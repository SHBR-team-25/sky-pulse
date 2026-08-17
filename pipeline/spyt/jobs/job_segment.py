import argparse
import hashlib
import math
import os
import time
from datetime import UTC, datetime

from pyspark.sql import SparkSession, Window
from pyspark.sql.functions import col, count, max as spark_max, row_number
from pyspark.sql.types import StructType, StructField, StringType, LongType, DoubleType, BooleanType


def parse_arguments():
    parser = argparse.ArgumentParser(description="job_segment: observations -> flights")
    parser.add_argument("--positions-history", required=True)
    parser.add_argument("--flights-open", required=True)
    parser.add_argument("--ref-airports", required=True)
    parser.add_argument("--flights-segments", required=True)
    parser.add_argument("--airport-events", required=True)
    parser.add_argument("--job-state", required=True)
    parser.add_argument("--proxy", required=True)
    parser.add_argument("--airport-radius-km", type=float, default=15.0)
    parser.add_argument("--timeout-seconds", type=int, default=1800)
    parser.add_argument("--until-ts", type=int, default=int(time.time()))
    return parser.parse_args()


def create_spark_session():
    return SparkSession.builder.appName("SPYT_Batch_Job_Segment").getOrCreate()


def flight_id(icao24, start_ts):
    value = f"{icao24}:{start_ts}".encode()
    return hashlib.sha256(value).hexdigest()[:32]


def distance_km(lat1, lon1, lat2, lon2):
    if None in (lat1, lon1, lat2, lon2):
        return None
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    return 6371.0088 * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def nearest_airport(lat, lon, airports, radius_km):
    candidates = []
    for airport in airports:
        distance = distance_km(lat, lon, airport["latitude_deg"], airport["longitude_deg"])
        if distance is not None and distance <= radius_km:
            candidates.append((distance, airport["icao_code"] or airport["ident"]))
    if not candidates:
        return None, None, None
    distance, code = min(candidates)
    return code, max(0.0, 1.0 - distance / radius_km), distance


def normalize_callsign(value):
    return value.strip() if value else None


def new_open(point, airport, confidence):
    start_ts = point["time_position"]
    return {
        "icao24": point["icao24"],
        "flight_id": flight_id(point["icao24"], start_ts),
        "start_ts": start_ts,
        "last_ts": start_ts,
        "last_on_ground": False,
        "last_lat": point["lat"],
        "last_lon": point["lon"],
        "last_baro_altitude": point["baro_altitude"],
        "last_vertical_rate": point["vertical_rate"],
        "last_callsign": normalize_callsign(point["callsign"]),
        "departure_icao": airport,
        "departure_confidence": confidence,
    }


def update_open(state, point):
    state.update({
        "last_ts": point["time_position"],
        "last_on_ground": point["on_ground"],
        "last_lat": point["lat"],
        "last_lon": point["lon"],
        "last_baro_altitude": point["baro_altitude"],
        "last_vertical_rate": point["vertical_rate"],
        "last_callsign": normalize_callsign(point["callsign"]) or state["last_callsign"],
    })


def close_flight(state, end_ts, reason, arrival, radius_km):
    arrival_icao, arrival_confidence, arrival_distance = arrival
    
    departure_distance_km = None
    if state["departure_confidence"] is not None:
        departure_distance_km = radius_km * (1 - state["departure_confidence"])
    
    return {
        "flight_id": state["flight_id"],
        "icao24": state["icao24"],
        "callsign": state["last_callsign"],
        "start_ts": state["start_ts"],
        "end_ts": end_ts,
        "departure_icao": state["departure_icao"],
        "departure_confidence": state["departure_confidence"],
        "departure_distance_km": departure_distance_km,
        "arrival_icao": arrival_icao,
        "arrival_confidence": arrival_confidence,
        "arrival_distance_km": arrival_distance,
        "point_count": 0,
        "max_altitude_m": None,
        "closed_reason": reason,
    }


def event(segment, direction):
    departure = direction == "departure"
    airport = segment["departure_icao"] if departure else segment["arrival_icao"]
    if airport is None:
        return None
    event_ts = segment["start_ts"] if departure else segment["end_ts"]
    return {
        "date": datetime.fromtimestamp(event_ts, UTC).date().isoformat(),
        "airport_icao": airport,
        "event_ts": event_ts,
        "icao24": segment["icao24"],
        "flight_id": segment["flight_id"],
        "direction": direction,
        "confidence": segment["departure_confidence"] if departure else segment["arrival_confidence"],
        "distance_km": segment["departure_distance_km"] if departure else segment["arrival_distance_km"],
        "other_airport_icao": segment["arrival_icao"] if departure else segment["departure_icao"],
    }


def load_watermark(spark, path):
    rows = spark.read.format("yt").option("path", path).load().filter(col("job_name") == "job_segment").collect()
    return rows[0]["watermark_ts"] if rows else 0


def write_rows(spark, rows, target_path):
    if not rows:
        return
    schema = spark.read.format("yt").option("path", target_path).load().schema
    spark.createDataFrame(rows, schema).write.format("yt") \
        .option("path", target_path) \
        .option("inconsistent_dynamic_write", "true") \
        .mode("append") \
        .save()


def main():
    args = parse_arguments()
    spark = create_spark_session()
    watermark = load_watermark(spark, args.job_state)
    history = spark.read.format("yt").option("path", args.positions_history).load()
    new_rows = history.filter((col("time_position") > watermark) & (col("time_position") <= args.until_ts))

    previous_window = Window.partitionBy("icao24").orderBy(col("time_position").desc())
    previous = history.filter(col("time_position") <= watermark).withColumn("rn", row_number().over(previous_window)).filter(col("rn") == 1).drop("rn")
    previous_by_aircraft = {row["icao24"]: row.asDict() for row in previous.collect()}
    points_by_aircraft = {}
    for row in new_rows.orderBy("icao24", "time_position").collect():
        points_by_aircraft.setdefault(row["icao24"], []).append(row.asDict())

    airports = [row.asDict() for row in spark.read.format("yt").option("path", args.ref_airports).load().collect()]
    open_states = {row["icao24"]: row.asDict() for row in spark.read.format("yt").option("path", args.flights_open).load().collect()}
    next_states = dict(open_states)
    closed = []

    for icao24 in set(points_by_aircraft) | set(open_states):
        state = next_states.get(icao24)
        previous_point = previous_by_aircraft.get(icao24)
        
        for point in points_by_aircraft.get(icao24, []):
            # Проверяем таймаут
            if state and point["time_position"] - state["last_ts"] > args.timeout_seconds:
                closed.append(close_flight(state, state["last_ts"], "timeout", (None, None, None), args.airport_radius_km))
                state = None
            
            # Проверяем смену callsign
            changed_callsign = state and normalize_callsign(point["callsign"]) and normalize_callsign(point["callsign"]) != state["last_callsign"]
            if changed_callsign:
                closed.append(close_flight(state, state["last_ts"], "coverage_exit", (None, None, None), args.airport_radius_km))
                state = None
            
            # Посадка
            if state and point["on_ground"]:
                arrival = nearest_airport(point["lat"], point["lon"], airports, args.airport_radius_km)
                update_open(state, point)
                closed.append(close_flight(state, point["time_position"], "landing", arrival, args.airport_radius_km))
                state = None
            
            # Обновление состояния
            elif state:
                update_open(state, point)
            
            # Взлет - создаем новый рейс
            elif not point["on_ground"]:
                existing_state = open_states.get(icao24)
                if existing_state:
                    state = dict(existing_state)
                    update_open(state, point)
                else:
                    # Проверяем, был ли предыдущий рейс на земле
                    is_takeoff = previous_point is not None and previous_point["on_ground"]
                    
                    # Если предыдущей точки нет или она была на земле - определяем аэропорт вылета
                    if is_takeoff or previous_point is None:
                        departure = nearest_airport(point["lat"], point["lon"], airports, args.airport_radius_km)
                        state = new_open(point, departure[0], departure[1])
                    else:
                        # Если предыдущая точка была в воздухе, но рейса не было - 
                        # это значит, что рейс начался до текущего батча
                        # Создаем рейс с неизвестным аэропортом вылета
                        state = new_open(point, None, None)
            
            previous_point = point
        
        # Закрываем рейс по таймауту в конце батча
        if state and args.until_ts - state["last_ts"] > args.timeout_seconds:
            closed.append(close_flight(state, state["last_ts"], "timeout", (None, None, None), args.airport_radius_km))
            state = None
        
        # Сохраняем состояние в next_states
        if state:
            next_states[icao24] = state
        else:
            next_states.pop(icao24, None)

    # Дополняем закрытые рейсы метриками
    if closed:
        bounds = spark.createDataFrame(
            [(s["flight_id"], s["icao24"], s["start_ts"], s["end_ts"]) for s in closed],
            ["flight_id", "icao24", "start_ts", "end_ts"]
        )
        metrics = history.alias("p").join(bounds.alias("b"), "icao24").filter(
            (col("p.time_position") >= col("b.start_ts")) & (col("p.time_position") <= col("b.end_ts"))
        ).groupBy("flight_id").agg(
            count("*").alias("point_count"),
            spark_max("baro_altitude").alias("max_altitude_m")
        )
        metrics_by_id = {row["flight_id"]: row.asDict() for row in metrics.collect()}
        
        # Получаем первую и последнюю точки для каждого закрытого рейса
        first_points = history.alias("p").join(bounds.alias("b"), "icao24").filter(
            col("p.time_position") == col("b.start_ts")
        ).select("p.*", "b.flight_id").collect()
        first_by_flight = {row["flight_id"]: row for row in first_points}
        
        for segment in closed:
            segment.update(metrics_by_id.get(segment["flight_id"], {}))
            
            # Если departure_icao не определен, пытаемся определить по первой точке
            if segment["departure_icao"] is None:
                first = first_by_flight.get(segment["flight_id"])
                if first:
                    airport = nearest_airport(
                        first["lat"], 
                        first["lon"], 
                        airports, 
                        args.airport_radius_km
                    )
                    segment["departure_icao"] = airport[0]
                    segment["departure_confidence"] = airport[1]
                    if airport[1] is not None:
                        segment["departure_distance_km"] = args.airport_radius_km * (1 - airport[1])

    # Сохраняем закрытые рейсы в flights_segments
    write_rows(spark, closed, args.flights_segments)
    
    # Сохраняем события в airport_events
    events = [item for segment in closed for item in (event(segment, "departure"), event(segment, "arrival")) if item]
    write_rows(spark, events, args.airport_events)
    
    # Обновляем flights_open (перезаписываем все открытые рейсы)
    if next_states:
        # Преобразуем словарь в список для Spark
        states_list = list(next_states.values())
        # Убедимся, что все ключи есть
        for state in states_list:
            # Добавляем departure_icao если его нет
            if "departure_icao" not in state or state["departure_icao"] is None:
                state["departure_icao"] = None
                state["departure_confidence"] = None
        
        open_schema = StructType([
            StructField("icao24", StringType(), True),
            StructField("flight_id", StringType(), True),
            StructField("start_ts", LongType(), True),
            StructField("last_ts", LongType(), True),
            StructField("last_on_ground", BooleanType(), True),
            StructField("last_lat", DoubleType(), True),
            StructField("last_lon", DoubleType(), True),
            StructField("last_baro_altitude", DoubleType(), True),
            StructField("last_vertical_rate", DoubleType(), True),
            StructField("last_callsign", StringType(), True),
            StructField("departure_icao", StringType(), True),
            StructField("departure_confidence", DoubleType(), True),
        ])

        states_df = spark.createDataFrame(states_list, schema=open_schema)
        states_df.write.format("yt") \
            .option("path", args.flights_open) \
            .option("inconsistent_dynamic_write", "true") \
            .mode("overwrite") \
            .save()
    else:
        # Если нет открытых рейсов - очищаем таблицу
        empty_schema = spark.read.format("yt").option("path", args.flights_open).load().schema
        spark.createDataFrame([], schema=empty_schema) \
            .write.format("yt") \
            .option("path", args.flights_open) \
            .option("inconsistent_dynamic_write", "true") \
            .mode("overwrite") \
            .save()
    
    # Обновляем watermark в job_state
    job_state_df = spark.createDataFrame([
        {"job_name": "job_segment", "watermark_ts": args.until_ts, "updated_at": int(time.time())}
    ])
    job_state_df.write.format("yt") \
        .option("path", args.job_state) \
        .option("inconsistent_dynamic_write", "true") \
        .mode("append") \
        .save()
    
    spark.stop()


if __name__ == "__main__":
    main()