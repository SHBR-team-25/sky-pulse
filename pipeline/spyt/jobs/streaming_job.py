import argparse

from pyspark.sql import SparkSession, Window
from pyspark.sql.functions import (
    col,
    current_timestamp,
    lit,
    row_number,
    substring,
    trim,
    unix_timestamp,
    upper,
    when,
)
from pyspark.storagelevel import StorageLevel


def parse_arguments():
    parser = argparse.ArgumentParser(
        description="job_enrich: raw + aircraft reference -> current/history"
    )
    parser.add_argument(
        "--positions-raw", required=True, help="Input: positions_raw queue path in YT"
    )
    parser.add_argument(
        "--positions-raw-consumer",
        required=True,
        help="Registered queue_consumer path for positions_raw",
    )
    parser.add_argument(
        "--ref-aircraft", required=True, help="Reference: ref_aircraft table path in YT"
    )
    parser.add_argument(
        "--positions-current", required=True, help="Output: positions_current table path in YT"
    )
    parser.add_argument(
        "--positions-history", required=True, help="Output: positions_history table path in YT"
    )
    parser.add_argument("--checkpoint", required=True, help="Checkpoint path")
    parser.add_argument("--trigger-seconds", type=int, default=30)
    parser.add_argument("--max-rows-per-partition", type=int, default=50_000)
    return parser.parse_args()


def create_streaming_session():
    return (
        SparkSession.builder.appName("SPYT_Streaming_Job_Enrich")
        .config("spark.sql.streaming.schemaInference", "true")
        .config("spark.streaming.stopGracefullyOnShutdown", "true")
        .config("spark.sql.streaming.metricsEnabled", "true")
        .getOrCreate()
    )


def enrich(raw_df, ref_aircraft_df):
    return raw_df.join(ref_aircraft_df, on="icao24", how="left").withColumn(
        "enriched_at", unix_timestamp(current_timestamp())
    )


def classify_aircraft(enriched_df):
    category = col("category")
    type_prefix = substring(upper(trim(col("icaoaircrafttype"))), 1, 1)
    unknown_category = category.isNull() | category.isin(0, 1)

    return enriched_df.withColumn(
        "aircraft_class",
        when(category.between(2, 7), lit("aircraft"))
        .when(category.between(8, 20), lit("non_aircraft"))
        .when(
            unknown_category & type_prefix.isin("H", "G", "T"),
            lit("non_aircraft"),
        )
        .when(
            unknown_category & type_prefix.isin("L", "S", "A"),
            lit("aircraft"),
        )
        .otherwise(lit("unknown")),
    )


def latest_per_aircraft(positions_df):
    latest_window = Window.partitionBy("icao24").orderBy(col("time_position").desc())
    return (
        positions_df.withColumn("rn", row_number().over(latest_window))
        .filter(col("rn") == 1)
        .drop("rn")
    )


def newer_than_current(latest_df, current_df):
    candidate = latest_df.alias("candidate")
    current_times = current_df.select("icao24", "time_position").alias("current")
    return (
        candidate.join(current_times, on="icao24", how="left")
        .filter(
            col("current.time_position").isNull()
            | (col("candidate.time_position") > col("current.time_position"))
        )
        .select("candidate.*")
    )


def main():
    args = parse_arguments()

    if args.trigger_seconds <= 0:
        raise ValueError("trigger_seconds must be positive")
    if args.max_rows_per_partition <= 0:
        raise ValueError("max_rows_per_partition must be positive")

    spark = create_streaming_session()

    print("Starting job_enrich:")
    print(f"  positions_raw: {args.positions_raw}")
    print(f"  positions_raw_consumer: {args.positions_raw_consumer}")
    print(f"  ref_aircraft: {args.ref_aircraft}")
    print(f"  positions_current: {args.positions_current}")
    print(f"  positions_history: {args.positions_history}")
    print(f"  checkpoint: {args.checkpoint}")

    # ref_aircraft — статический справочник, читается как обычный batch DataFrame
    # и переиспользуется в каждом микробатче через join.
    ref_aircraft_df = (
        spark.read.format("yt")
        .option("path", args.ref_aircraft)
        .load()
        .repartition("icao24")
        .persist(StorageLevel.MEMORY_AND_DISK)
    )
    # Materialize once. Without this action the static YT table can be scanned and
    # shuffled again when every microbatch performs its enrichment join.
    ref_aircraft_count = ref_aircraft_df.count()
    print(f"  cached ref_aircraft rows: {ref_aircraft_count}")

    raw_stream = (
        spark.readStream.format("yt")
        .option("path", args.positions_raw)
        .option("queue", args.positions_raw)
        .option("consumer_path", args.positions_raw_consumer)
        .option("max_rows_per_partition", args.max_rows_per_partition)
        .option("cluster", "https://http-proxy-hackathon.demo.ytsaurus.tech")
        .load()
    )

    def process_batch(batch_df, batch_id):
        if batch_df.isEmpty():
            return

        classified_df = classify_aircraft(enrich(batch_df, ref_aircraft_df)).cache()

        # positions_history: (icao24, time_position) is the dynamic-table key.
        # Repeated source observations replace that key (and refresh enriched_at)
        # rather than creating two physical history rows. job_segment therefore
        # still has to treat an already processed event timestamp idempotently.
        try:
            class_counts = {
                row["aircraft_class"]: row["count"]
                for row in classified_df.groupBy("aircraft_class").count().collect()
            }
            print(
                f"  batch {batch_id} aircraft classification: "
                f"aircraft={class_counts.get('aircraft', 0)} "
                f"non_aircraft={class_counts.get('non_aircraft', 0)} "
                f"unknown={class_counts.get('unknown', 0)}"
            )

            filtered_df = classified_df.filter(col("aircraft_class") != "non_aircraft")

            filtered_df.write.format("yt").option("path", args.positions_history).option(
                "inconsistent_dynamic_write", "true"
            ).mode("append").save()

            # positions_current: ключ icao24 один на борт, поэтому из микробатча
            # берём только самую свежую позицию на каждый борт перед записью.
            latest_df = latest_per_aircraft(filtered_df)
            current_df = spark.read.format("yt").option("path", args.positions_current).load()
            newer_than_current(latest_df, current_df).write.format("yt").option(
                "path", args.positions_current
            ).option("inconsistent_dynamic_write", "true").mode("append").save()
        finally:
            # foreachBatch должен снять cache и при ошибке одной из записей.
            classified_df.unpersist()

    try:
        query = (
            raw_stream.writeStream.foreachBatch(process_batch)
            .option("checkpointLocation", args.checkpoint)
            .trigger(processingTime=f"{args.trigger_seconds} seconds")
            .start()
        )

        query.awaitTermination()
    finally:
        ref_aircraft_df.unpersist()


if __name__ == "__main__":
    main()
