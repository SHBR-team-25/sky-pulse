import argparse
import time
import logging

from pyspark.sql import SparkSession, Window
from pyspark.sql.functions import (
    avg,
    coalesce,
    col,
    countDistinct,
    desc,
    length,
    lit,
    row_number,
    trim,
    when,
)
from pyspark.sql.functions import max as spark_max
from pyspark.sql.functions import min as spark_min  # ← добавлено!
from pyspark.sql.functions import sum as spark_sum

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


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
    parser.add_argument("--computed-at", type=int)
    parser.add_argument("--top-limit", type=int, default=10)
    parser.add_argument("--window-seconds", type=int, default=86_400)
    parser.add_argument("--position-freshness-seconds", type=int, default=900)
    return parser.parse_args()


def create_spark_session():
    return SparkSession.builder.appName("SPYT_Batch_Job_Aggregate").getOrCreate()


def validate_parameters(computed_at, top_limit, window_seconds, position_freshness_seconds):
    if computed_at <= 0:
        raise ValueError("computed_at must be positive")
    if top_limit <= 0:
        raise ValueError("top_limit must be positive")
    if window_seconds <= 0:
        raise ValueError("window_seconds must be positive")
    if position_freshness_seconds <= 0:
        raise ValueError("position_freshness_seconds must be positive")


def filter_time_window(dataframe, timestamp_column, end_ts, window_seconds):
    start_ts = end_ts - window_seconds
    return dataframe.filter(
        col(timestamp_column).isNotNull() & (col(timestamp_column) > start_ts)
    )


def count_when(condition, name):
    return (
        coalesce(
            spark_sum(when(condition, 1).otherwise(0)),
            lit(0),
        )
        .cast("long")
        .alias(name)
    )


def filter_valid_events(events):
    return events.filter(
        col("airport_icao").isNotNull()
        & col("other_airport_icao").isNotNull()
        & (col("airport_icao") != col("other_airport_icao"))
        & col("flight_id").isNotNull()
        & col("direction").isin("departure", "arrival")
    )


def filter_valid_dashboard_segments(segments):
    return segments.filter(
        col("flight_id").isNotNull()
        & col("departure_icao").isNotNull()
        & col("arrival_icao").isNotNull()
        & (col("departure_icao") != col("arrival_icao"))
    )


def latest_fresh_positions(positions, computed_at, freshness_seconds):
    freshness_window = Window.partitionBy("icao24").orderBy(col("time_position").desc())
    return (
        filter_time_window(
            positions,
            "time_position",
            computed_at,
            freshness_seconds,
        )
        .filter(col("icao24").isNotNull())
        .withColumn("rn", row_number().over(freshness_window))
        .filter(col("rn") == 1)
        .drop("rn")
    )


def build_totals(
    positions,
    events,
    computed_at,
    window_seconds,
    position_freshness_seconds,
):
    fresh_positions = latest_fresh_positions(
        positions,
        computed_at,
        position_freshness_seconds,
    )
    
    fresh_count = fresh_positions.count()
    logger.info(f"Fresh positions count: {fresh_count}")
    if fresh_count > 0:
        max_ts = fresh_positions.agg(spark_max("time_position")).first()[0]
        logger.info(f"Fresh positions max time_position: {max_ts}")
    
    recent_events = filter_valid_events(
        filter_time_window(events, "event_ts", computed_at, window_seconds)
    )
    airborne = col("on_ground") == lit(False)
    on_ground = col("on_ground") == lit(True)

    position_totals = fresh_positions.agg(
        count_when(airborne, "active_flights"),
        avg(when(airborne, col("baro_altitude"))).alias("avg_altitude_m"),
        avg(when(airborne, col("velocity"))).alias("avg_velocity_mps"),
        count_when(airborne, "airborne"),
        count_when(on_ground, "on_ground"),
        count_when(airborne & (col("vertical_rate") > 1.0), "climbing"),
        count_when(airborne & (col("vertical_rate") < -1.0), "descending"),
        count_when(col("squawk").isin("7500", "7700"), "emergency_squawks"),
    )
    airport_totals = recent_events.agg(
        countDistinct("airport_icao").cast("long").alias("tracked_airports")
    )

    return (
        position_totals.crossJoin(airport_totals)
        .withColumn("computed_at", lit(computed_at).cast("long"))
        .select(
            "computed_at",
            "active_flights",
            "tracked_airports",
            "avg_altitude_m",
            "avg_velocity_mps",
            "airborne",
            "on_ground",
            "climbing",
            "descending",
            "emergency_squawks",
        )
    )


def build_trend(totals):
    return totals.select(
        "computed_at",
        col("active_flights").alias("active_aircraft"),
    )


def build_top_airports(events, computed_at, window_seconds, top_limit):
    recent_events = filter_time_window(events, "event_ts", computed_at, window_seconds)
    valid_events = filter_valid_events(recent_events)

    return (
        valid_events.groupBy("airport_icao")
        .agg(
            count_when(col("direction") == "departure", "departures"),
            count_when(col("direction") == "arrival", "arrivals"),
            countDistinct("flight_id").cast("long").alias("total_flights"),
        )
        .withColumn(
            "rank",
            row_number().over(Window.orderBy(desc("total_flights"), "airport_icao")).cast("long"),
        )
        .filter(col("rank") <= top_limit)
        .withColumn("computed_at", lit(computed_at).cast("long"))
        .select(
            "rank",
            "airport_icao",
            "departures",
            "arrivals",
            "total_flights",
            "computed_at",
        )
    )


def build_routes(segments, computed_at, window_seconds, top_limit):
    recent_segments = filter_time_window(segments, "end_ts", computed_at, window_seconds)
    valid_segments = filter_valid_dashboard_segments(recent_segments)

    return (
        valid_segments.groupBy("departure_icao", "arrival_icao")
        .agg(countDistinct("flight_id").cast("long").alias("flight_count"))
        .withColumn(
            "rank",
            row_number()
            .over(
                Window.orderBy(
                    desc("flight_count"),
                    "departure_icao",
                    "arrival_icao",
                )
            )
            .cast("long"),
        )
        .filter(col("rank") <= top_limit)
        .withColumn("computed_at", lit(computed_at).cast("long"))
        .select(
            "rank",
            "departure_icao",
            "arrival_icao",
            "flight_count",
            "computed_at",
        )
    )


def build_manufacturers(segments, aircraft, computed_at, window_seconds):
    recent_segments = filter_time_window(
        segments,
        "end_ts",
        computed_at,
        window_seconds,
    )
    recent_segments = filter_valid_dashboard_segments(recent_segments)
    manufacturers = aircraft.select(
        "icao24",
        trim(col("manufacturername")).alias("manufacturername"),
    ).dropDuplicates(["icao24"])

    return (
        recent_segments.join(manufacturers, "icao24", "left")
        .withColumn(
            "manufacturer",
            when(
                col("manufacturername").isNull() | (length(col("manufacturername")) == 0),
                "Unknown",
            ).otherwise(col("manufacturername")),
        )
        .groupBy("manufacturer")
        .agg(countDistinct("flight_id").cast("long").alias("flight_count"))
        .withColumn("computed_at", lit(computed_at).cast("long"))
        .select("manufacturer", "flight_count", "computed_at")
        .orderBy(desc("flight_count"), "manufacturer")
    )


def overwrite(dataframe, path):
    (
        dataframe.write.format("yt")
        .option("path", path)
        .option("inconsistent_dynamic_write", "true")
        .mode("overwrite")
        .save()
    )


def append(dataframe, path):
    (
        dataframe.write.format("yt")
        .option("path", path)
        .option("inconsistent_dynamic_write", "true")
        .mode("append")
        .save()
    )


def materialize_positions_snapshot(positions):
    snapshot = positions.cache()
    try:
        snapshot.count()
        latest_position_ts = snapshot.agg(
            spark_max("time_position").alias("latest_position_ts")
        ).first()["latest_position_ts"]
        return snapshot, latest_position_ts
    except Exception:
        snapshot.unpersist()
        raise


def choose_computed_at(requested_computed_at, latest_position_ts, now_ts):
    if requested_computed_at is not None:
        return requested_computed_at
    return max(now_ts, latest_position_ts or 0)


def run(args, spark):
    logger.info("=" * 60)
    logger.info("Starting job_aggregate")
    
    positions = spark.read.format("yt").option("path", args.positions_current).load()
    positions_snapshot = None
    totals = None
    
    try:
        total_positions = positions.count()
        logger.info(f"positions_current total rows: {total_positions}")
        
        if total_positions > 0:
            max_ts = positions.agg(spark_max("time_position")).first()[0]
            logger.info(f"positions_current max time_position: {max_ts}")
            # Убираем spark_min, оставляем только max
        else:
            logger.warning("positions_current is EMPTY!")
        
        positions_snapshot, latest_position_ts = materialize_positions_snapshot(positions)
        now_ts = int(time.time())
        
        logger.info(f"latest_position_ts: {latest_position_ts}")
        logger.info(f"now_ts: {now_ts}")
        
        computed_at = choose_computed_at(
            requested_computed_at=args.computed_at,
            latest_position_ts=latest_position_ts,
            now_ts=now_ts,
        )
        logger.info(f"computed_at: {computed_at}")
        logger.info(f"position_freshness_seconds: {args.position_freshness_seconds}")
        
        if computed_at - args.position_freshness_seconds > latest_position_ts:
            logger.warning(f"WARNING: computed_at - freshness ({computed_at - args.position_freshness_seconds}) > latest_position_ts ({latest_position_ts})")
            logger.warning("All data may be excluded from the window!")
        
        validate_parameters(
            computed_at=computed_at,
            top_limit=args.top_limit,
            window_seconds=args.window_seconds,
            position_freshness_seconds=args.position_freshness_seconds,
        )

        events = spark.read.format("yt").option("path", args.airport_events).load()
        segments = spark.read.format("yt").option("path", args.flights_segments).load()
        aircraft = spark.read.format("yt").option("path", args.ref_aircraft).load()

        totals = build_totals(
            positions=positions_snapshot,
            events=events,
            computed_at=computed_at,
            window_seconds=args.window_seconds,
            position_freshness_seconds=args.position_freshness_seconds,
        ).cache()
        
        totals_count = totals.count()
        logger.info(f"totals rows: {totals_count}")
        if totals_count > 0:
            totals.show(5, truncate=False)
            active = totals.select("active_flights").first()[0]
            logger.info(f"active_flights: {active}")
        else:
            logger.warning("totals is EMPTY!")
        
        trend = build_trend(totals)
        top_airports = build_top_airports(
            events=events,
            computed_at=computed_at,
            window_seconds=args.window_seconds,
            top_limit=args.top_limit,
        )
        routes = build_routes(
            segments=segments,
            computed_at=computed_at,
            window_seconds=args.window_seconds,
            top_limit=args.top_limit,
        )
        manufacturers = build_manufacturers(
            segments=segments,
            aircraft=aircraft,
            computed_at=computed_at,
            window_seconds=args.window_seconds,
        )

        overwrite(totals, args.dashboard_totals)
        append(trend, args.dashboard_trend)
        overwrite(top_airports, args.dashboard_top_airports)
        overwrite(routes, args.dashboard_routes)
        overwrite(manufacturers, args.dashboard_manufacturers)
        
        logger.info("job_aggregate completed successfully")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error(f"job_aggregate failed: {e}")
        raise
    finally:
        if totals is not None:
            totals.unpersist()
        if positions_snapshot is not None:
            positions_snapshot.unpersist()


def main():
    args = parse_arguments()
    spark = create_spark_session()
    try:
        run(args, spark)
    finally:
        spark.stop()


if __name__ == "__main__":
    main()