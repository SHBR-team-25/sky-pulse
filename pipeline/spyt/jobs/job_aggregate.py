import argparse
import time

from pyspark.sql import SparkSession, Window
from pyspark.sql.functions import (
    avg, col, count, countDistinct, desc, lit, row_number, sum as spark_sum, when,
)


def parse_arguments():
    parser = argparse.ArgumentParser(description="job_aggregate: dashboard marts")
    parser.add_argument("--airport-events", required=True)
    parser.add_argument("--positions-current", required=True)
    parser.add_argument("--flights-segments", required=True)
    parser.add_argument("--ref-aircraft", required=True)
    parser.add_argument("--dashboard-totals", required=True)
    parser.add_argument("--dashboard-trend", required=True)
    parser.add_argument("--dashboard-top-airports", required=True)
    parser.add_argument("--dashboard-routes", required=True)
    parser.add_argument("--dashboard-manufacturers", required=True)
    parser.add_argument("--computed-at", type=int, default=int(time.time()))
    parser.add_argument("--top-limit", type=int, default=10)
    return parser.parse_args()


def create_spark_session():
    return SparkSession.builder.appName("SPYT_Batch_Job_Aggregate").getOrCreate()


def overwrite(df, path):
    df.write.format("yt") \
        .option("path", path) \
        .option("inconsistent_dynamic_write", "true") \
        .mode("overwrite") \
        .save()


def append(df, path):
    df.write.format("yt") \
        .option("path", path) \
        .option("inconsistent_dynamic_write", "true") \
        .mode("append") \
        .save()


def main():
    args = parse_arguments()
    spark = create_spark_session()

    positions = spark.read.format("yt").option("path", args.positions_current).load().cache()
    events = spark.read.format("yt").option("path", args.airport_events).load().cache()
    segments = spark.read.format("yt").option("path", args.flights_segments).load().cache()
    aircraft = spark.read.format("yt").option("path", args.ref_aircraft).load()

    since_24h = args.computed_at - 24 * 60 * 60
    recent_events = events.filter(col("event_ts") >= since_24h)
    recent_segments = segments.filter(col("end_ts") >= since_24h)

    totals = positions.agg(
        spark_sum(when(~col("on_ground"), 1).otherwise(0)).cast("long").alias("active_flights"),
        avg("baro_altitude").alias("avg_altitude_m"),
        avg("velocity").alias("avg_velocity_mps"),
        spark_sum(when(~col("on_ground"), 1).otherwise(0)).cast("long").alias("airborne"),
        spark_sum(when(col("on_ground"), 1).otherwise(0)).cast("long").alias("on_ground"),
        spark_sum(when(col("vertical_rate") > 1.0, 1).otherwise(0)).cast("long").alias("climbing"),
        spark_sum(when(col("vertical_rate") < -1.0, 1).otherwise(0)).cast("long").alias("descending"),
        spark_sum(when(col("squawk").isin("7500", "7700"), 1).otherwise(0)).cast("long").alias("emergency_squawks"),
    ).crossJoin(
        recent_events.agg(countDistinct("airport_icao").cast("long").alias("tracked_airports"))
    ).withColumn("computed_at", lit(args.computed_at).cast("long")).select(
        "computed_at", "active_flights", "tracked_airports", "avg_altitude_m",
        "avg_velocity_mps", "airborne", "on_ground", "climbing", "descending",
        "emergency_squawks",
    )
    overwrite(totals, args.dashboard_totals)

    trend = totals.select("computed_at", col("active_flights").alias("active_aircraft"))
    append(trend, args.dashboard_trend)

    top = recent_events.groupBy("airport_icao").agg(
        spark_sum(when(col("direction") == "departure", 1).otherwise(0)).cast("long").alias("departures"),
        spark_sum(when(col("direction") == "arrival", 1).otherwise(0)).cast("long").alias("arrivals"),
        countDistinct("flight_id").cast("long").alias("total_flights"),
    ).withColumn(
        "rank", row_number().over(Window.orderBy(desc("total_flights"), "airport_icao")).cast("long")
    ).filter(
        col("rank") <= args.top_limit
    ).withColumn(
        "computed_at", lit(args.computed_at).cast("long")
    ).select(
        "rank", "airport_icao", "departures", "arrivals", "total_flights", "computed_at",
    )
    overwrite(top, args.dashboard_top_airports)

    routes = recent_segments.filter(
        col("departure_icao").isNotNull() & col("arrival_icao").isNotNull()
    ).groupBy(
        "departure_icao", "arrival_icao"
    ).agg(
        count("*").cast("long").alias("flight_count")
    ).withColumn(
        "rank", row_number().over(Window.orderBy(desc("flight_count"), "departure_icao", "arrival_icao")).cast("long")
    ).filter(
        col("rank") <= args.top_limit
    ).withColumn(
        "computed_at", lit(args.computed_at).cast("long")
    ).select(
        "rank", "departure_icao", "arrival_icao", "flight_count", "computed_at",
    )
    overwrite(routes, args.dashboard_routes)

    manufacturers = recent_segments.join(
        aircraft.select("icao24", "manufacturername"), "icao24", "left"
    ).withColumn(
        "manufacturer",
        when(col("manufacturername").isNull() | (col("manufacturername") == ""), "Unknown")
        .otherwise(col("manufacturername"))
    ).groupBy(
        "manufacturer"
    ).agg(
        count("*").cast("long").alias("flight_count")
    ).withColumn(
        "computed_at", lit(args.computed_at).cast("long")
    ).orderBy(
        desc("flight_count"), "manufacturer"
    )
    overwrite(manufacturers, args.dashboard_manufacturers)

    positions.unpersist()
    events.unpersist()
    segments.unpersist()

    spark.stop()


if __name__ == "__main__":
    main()