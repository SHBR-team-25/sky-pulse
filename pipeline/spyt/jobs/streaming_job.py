import argparse
from pyspark.sql import SparkSession, Window
from pyspark.sql.functions import col, current_timestamp, row_number, unix_timestamp


def parse_arguments():
    parser = argparse.ArgumentParser(description='job_enrich: positions_raw + ref_aircraft -> positions_current/positions_history')
    parser.add_argument('--positions-raw', required=True, help='Input: positions_raw queue path in YT')
    parser.add_argument(
        '--positions-raw-consumer',
        required=True,
        help='Registered queue_consumer path for positions_raw',
    )
    parser.add_argument('--ref-aircraft', required=True, help='Reference: ref_aircraft table path in YT')
    parser.add_argument('--positions-current', required=True, help='Output: positions_current table path in YT')
    parser.add_argument('--positions-history', required=True, help='Output: positions_history table path in YT')
    parser.add_argument('--checkpoint', required=True, help='Checkpoint path')
    return parser.parse_args()


def create_streaming_session():
    return SparkSession.builder \
        .appName("SPYT_Streaming_Job_Enrich") \
        .config("spark.sql.streaming.schemaInference", "true") \
        .config("spark.streaming.stopGracefullyOnShutdown", "true") \
        .config("spark.sql.streaming.metricsEnabled", "true") \
        .getOrCreate()


def enrich(raw_df, ref_aircraft_df):
    return raw_df \
        .join(ref_aircraft_df, on="icao24", how="left") \
        .withColumn("enriched_at", unix_timestamp(current_timestamp()))


def main():
    args = parse_arguments()

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
    ref_aircraft_df = spark.read.format("yt").option("path", args.ref_aircraft).load()

    raw_stream = spark.readStream \
        .format("yt") \
        .option("path", args.positions_raw) \
        .option("queue", args.positions_raw) \
        .option("consumer_path", args.positions_raw_consumer) \
        .option("cluster", "https://http-proxy-hackathon.demo.ytsaurus.tech") \
        .load()

    def process_batch(batch_df, batch_id):
        if batch_df.isEmpty():
            return

        enriched_df = enrich(batch_df, ref_aircraft_df).cache()

        # positions_history: ключ (icao24, time_position) уникален для каждой позиции,
        # запись в сортированную dynamic-таблицу по этому ключу — обычный append.
        enriched_df.write.format("yt") \
            .option("path", args.positions_history) \
            .option("inconsistent_dynamic_write", "true") \
            .mode("append") \
            .save()

        # positions_current: ключ icao24 один на борт, поэтому из микробатча
        # берём только самую свежую позицию на каждый борт перед записью.
        latest_window = Window.partitionBy("icao24").orderBy(col("time_position").desc())
        latest_df = enriched_df \
            .withColumn("rn", row_number().over(latest_window)) \
            .filter(col("rn") == 1) \
            .drop("rn")
        latest_df.write.format("yt") \
            .option("path", args.positions_current) \
            .option("inconsistent_dynamic_write", "true") \
            .mode("append") \
            .save()

        enriched_df.unpersist()

    query = raw_stream.writeStream \
        .foreachBatch(process_batch) \
        .option("checkpointLocation", args.checkpoint) \
        .trigger(processingTime="10 seconds") \
        .start()

    query.awaitTermination()


if __name__ == "__main__":
    main()
