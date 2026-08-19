import argparse
import hashlib
import math
import os
import time
from datetime import UTC, datetime

from pyspark.sql import SparkSession, Window
from pyspark.sql.functions import col, isnan, row_number


def parse_arguments():
    parser = argparse.ArgumentParser(description="job_segment: observations -> flights")
    parser.add_argument("--positions-history", required=True)
    parser.add_argument("--flights-open", required=True)
    parser.add_argument("--ref-airports", required=True)
    parser.add_argument("--flights-segments", required=True)
    parser.add_argument("--airport-events", required=True)
    parser.add_argument("--job-state", required=True)
    parser.add_argument("--proxy", default=os.getenv("YT_PROXY"))
    parser.add_argument("--airport-radius-km", type=float, default=15.0)
    parser.add_argument("--timeout-seconds", type=int, default=1800)
    parser.add_argument("--max-transition-gap-seconds", type=int, default=300)
    parser.add_argument("--ground-glitch-max-seconds", type=int, default=60)
    parser.add_argument("--allowed-lateness-seconds", type=int, default=120)
    parser.add_argument("--until-ts", type=int)
    return parser.parse_args()


def create_spark_session():
    return SparkSession.builder.appName("SPYT_Batch_Job_Segment").getOrCreate()


def create_yt_client(proxy):
    if not proxy:
        raise ValueError("YTsaurus proxy must be provided via --proxy or YT_PROXY")
    token = os.getenv("YT_SECURE_VAULT_YT_TOKEN") or os.getenv("YT_TOKEN")
    if not token:
        raise ValueError(
            "YTsaurus token is missing: neither YT_SECURE_VAULT_YT_TOKEN "
            "nor YT_TOKEN is set"
        )

    from yt.wrapper import YtClient

    return YtClient(
        proxy=proxy,
        token=token,
        config={"backend": "http"},
    )


def validate_parameters(
    airport_radius_km,
    timeout_seconds,
    max_transition_gap_seconds,
    ground_glitch_max_seconds,
    allowed_lateness_seconds,
):
    if not math.isfinite(airport_radius_km) or airport_radius_km <= 0:
        raise ValueError("airport_radius_km must be a positive finite number")
    if timeout_seconds <= 0:
        raise ValueError("timeout_seconds must be positive")
    if max_transition_gap_seconds <= 0:
        raise ValueError("max_transition_gap_seconds must be positive")
    if max_transition_gap_seconds > timeout_seconds:
        raise ValueError("max_transition_gap_seconds must not exceed timeout_seconds")
    if ground_glitch_max_seconds < 0:
        raise ValueError("ground_glitch_max_seconds must not be negative")
    if ground_glitch_max_seconds > max_transition_gap_seconds:
        raise ValueError(
            "ground_glitch_max_seconds must not exceed max_transition_gap_seconds"
        )
    if allowed_lateness_seconds < 0:
        raise ValueError("allowed_lateness_seconds must not be negative")


def flight_id(icao24, start_ts):
    value = f"{icao24}:{start_ts}".encode()
    return hashlib.sha256(value).hexdigest()[:32]


def distance_km(lat1, lon1, lat2, lon2):
    if None in (lat1, lon1, lat2, lon2):
        return None
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    a = min(1.0, max(0.0, a))
    return 6371.0088 * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def nearest_airport(lat, lon, airports, radius_km):
    if not math.isfinite(radius_km) or radius_km <= 0:
        raise ValueError("radius_km must be a positive finite number")

    latitude_delta = radius_km / 110.574
    longitude_scale = 111.320 * abs(math.cos(math.radians(lat)))
    longitude_delta = 180.0 if longitude_scale < 1e-9 else radius_km / longitude_scale

    candidates = []
    for airport in airports:
        airport_latitude = airport["latitude_deg"]
        airport_longitude = airport["longitude_deg"]
        if abs(airport_latitude - lat) > latitude_delta:
            continue
        longitude_distance = abs((airport_longitude - lon + 180.0) % 360.0 - 180.0)
        if longitude_distance > longitude_delta:
            continue

        distance = distance_km(lat, lon, airport_latitude, airport_longitude)
        if distance is not None and distance <= radius_km:
            candidates.append((distance, airport["icao_code"] or airport["ident"]))
    if not candidates:
        return None, None, None
    distance, code = min(candidates)
    return code, max(0.0, 1.0 - distance / radius_km), distance


def normalize_callsign(value):
    return value.strip() if value else None


def validate_point(point):
    if not point.get("icao24"):
        raise ValueError("position must have a non-empty icao24")
    if not isinstance(point.get("time_position"), int):
        raise ValueError("position time_position must be an integer")
    if not isinstance(point.get("on_ground"), bool):
        raise ValueError("position on_ground must be a boolean")

    latitude = point.get("lat")
    longitude = point.get("lon")
    if (
        not isinstance(latitude, (int, float))
        or not math.isfinite(latitude)
        or not -90.0 <= latitude <= 90.0
    ):
        raise ValueError("position latitude must be finite and between -90 and 90")
    if (
        not isinstance(longitude, (int, float))
        or not math.isfinite(longitude)
        or not -180.0 <= longitude <= 180.0
    ):
        raise ValueError("position longitude must be finite and between -180 and 180")


def validate_open_state(state):
    if not state.get("icao24") or not state.get("flight_id"):
        raise ValueError("open flight must have non-empty icao24 and flight_id")
    if not isinstance(state.get("start_ts"), int) or not isinstance(state.get("last_ts"), int):
        raise ValueError("open flight timestamps must be integers")
    if state["start_ts"] > state["last_ts"]:
        raise ValueError("open flight start_ts must not exceed last_ts")
    if not isinstance(state.get("last_on_ground"), bool):
        raise ValueError("open flight last_on_ground must be a boolean")
    if not isinstance(state.get("point_count"), int) or state["point_count"] <= 0:
        raise ValueError("open flight point_count must be a positive integer")

    max_altitude = state.get("max_altitude_m")
    if max_altitude is not None and (
        not isinstance(max_altitude, (int, float)) or not math.isfinite(max_altitude)
    ):
        raise ValueError("open flight max_altitude_m must be finite")

    departure_distance = state.get("departure_distance_km")
    if departure_distance is not None and (
        not isinstance(departure_distance, (int, float))
        or not math.isfinite(departure_distance)
        or departure_distance < 0
    ):
        raise ValueError("open flight departure_distance_km must be non-negative and finite")

    confidence = state.get("departure_confidence")
    if confidence is not None and (
        not isinstance(confidence, (int, float))
        or not math.isfinite(confidence)
        or not 0.0 <= confidence <= 1.0
    ):
        raise ValueError("open flight departure_confidence must be between 0 and 1")


def new_open(point, departure):
    airport, confidence, departure_distance = departure
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
        "departure_distance_km": departure_distance,
        "point_count": 1,
        "max_altitude_m": (
            point["baro_altitude"]
            if point["baro_altitude"] is not None
            and math.isfinite(point["baro_altitude"])
            else None
        ),
    }


def update_open(state, point):
    altitude = point["baro_altitude"]
    if altitude is not None and math.isfinite(altitude):
        current_max = state["max_altitude_m"]
        state["max_altitude_m"] = (
            altitude if current_max is None else max(current_max, altitude)
        )
    state["point_count"] += 1
    state.update(
        {
            "last_ts": point["time_position"],
            "last_on_ground": point["on_ground"],
            "last_lat": point["lat"],
            "last_lon": point["lon"],
            "last_baro_altitude": point["baro_altitude"],
            "last_vertical_rate": point["vertical_rate"],
            "last_callsign": normalize_callsign(point["callsign"])
            or state["last_callsign"],
        }
    )


def close_flight(state, end_ts, reason, arrival):
    arrival_icao, arrival_confidence, arrival_distance = arrival

    return {
        "flight_id": state["flight_id"],
        "icao24": state["icao24"],
        "callsign": state["last_callsign"],
        "start_ts": state["start_ts"],
        "end_ts": end_ts,
        "departure_icao": state["departure_icao"],
        "departure_confidence": state["departure_confidence"],
        "departure_distance_km": state["departure_distance_km"],
        "arrival_icao": arrival_icao,
        "arrival_confidence": arrival_confidence,
        "arrival_distance_km": arrival_distance,
        "point_count": state["point_count"],
        "max_altitude_m": state["max_altitude_m"],
        "closed_reason": reason,
    }


def is_short_same_airport_glitch(state, end_ts, arrival, max_duration_seconds):
    """Return true for an implausibly short ground-air-ground transition."""
    arrival_icao = arrival[0]
    return (
        max_duration_seconds > 0
        and state["departure_icao"] is not None
        and state["departure_icao"] == arrival_icao
        and end_ts - state["start_ts"] <= max_duration_seconds
    )


def append_landing(closed, state, end_ts, arrival, ground_glitch_max_seconds):
    if not is_short_same_airport_glitch(
        state,
        end_ts,
        arrival,
        ground_glitch_max_seconds,
    ):
        closed.append(close_flight(state, end_ts, "landing", arrival))


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
        "confidence": (
            segment["departure_confidence"] if departure else segment["arrival_confidence"]
        ),
        "distance_km": (
            segment["departure_distance_km"]
            if departure
            else segment["arrival_distance_km"]
        ),
        "other_airport_icao": segment["arrival_icao"] if departure else segment["departure_icao"],
    }


def load_watermark(spark, path):
    rows = (
        spark.read.format("yt")
        .option("path", path)
        .load()
        .filter(col("job_name") == "job_segment")
        .collect()
    )
    return rows[0]["watermark_ts"] if rows else 0


def ensure_watermark_unchanged(spark, path, expected_watermark):
    current_watermark = load_watermark(spark, path)
    if current_watermark != expected_watermark:
        raise RuntimeError(
            "job_segment watermark changed during the run: "
            f"expected {expected_watermark}, got {current_watermark}. "
            "Another job_segment instance is probably running."
        )


def validate_results(states, closed):
    closed_ids = [segment["flight_id"] for segment in closed]
    if len(closed_ids) != len(set(closed_ids)):
        raise RuntimeError("one flight_id was closed more than once in a single run")

    open_ids = {state["flight_id"] for state in states.values()}
    overlap = open_ids.intersection(closed_ids)
    if overlap:
        raise RuntimeError(f"flight_id is both open and closed: {sorted(overlap)}")

    for icao24, state in states.items():
        validate_open_state(state)
        if state["icao24"] != icao24:
            raise RuntimeError("open flight dictionary key does not match its icao24")

    for segment in closed:
        if segment["start_ts"] > segment["end_ts"]:
            raise RuntimeError(
                f"flight {segment['flight_id']} ends before it starts"
            )


def write_rows(spark, rows, target_path):
    if not rows:
        return
    schema = spark.read.format("yt").option("path", target_path).load().schema
    (
        spark.createDataFrame(rows, schema)
        .write.format("yt")
        .option("path", target_path)
        .option("inconsistent_dynamic_write", "true")
        .mode("append")
        .save()
    )


def delete_closed_open_states(client, target_path, original_keys, states):
    keys_to_delete = sorted(set(original_keys) - set(states))
    if keys_to_delete:
        client.delete_rows(
            target_path,
            [{"icao24": icao24} for icao24 in keys_to_delete],
            format="json",
        )


def process_aircraft_points(
    state,
    previous_point,
    points,
    airports,
    until_ts,
    timeout_seconds,
    max_transition_gap_seconds,
    ground_glitch_max_seconds,
    airport_radius_km,
):
    closed = []
    if state:
        validate_open_state(state)

    for point in points:
        validate_point(point)
        if state and point["time_position"] <= state["last_ts"]:
            continue

        if state and point["time_position"] - state["last_ts"] > timeout_seconds:
            if state["last_on_ground"]:
                arrival = nearest_airport(
                    state["last_lat"],
                    state["last_lon"],
                    airports,
                    airport_radius_km,
                )
                reason = "landing"
            else:
                arrival = (None, None, None)
                reason = "timeout"
            if reason == "landing":
                append_landing(
                    closed,
                    state,
                    state["last_ts"],
                    arrival,
                    ground_glitch_max_seconds,
                )
            else:
                closed.append(close_flight(state, state["last_ts"], reason, arrival))
            state = None

        if state:
            if point["on_ground"] and state["last_on_ground"]:
                arrival = nearest_airport(
                    state["last_lat"],
                    state["last_lon"],
                    airports,
                    airport_radius_km,
                )
                append_landing(
                    closed,
                    state,
                    state["last_ts"],
                    arrival,
                    ground_glitch_max_seconds,
                )
                state = None
            elif point["on_ground"]:
                update_open(state, point)
            elif (
                state["last_on_ground"]
                and point["time_position"] - state["last_ts"]
                > ground_glitch_max_seconds
            ):
                arrival = nearest_airport(
                    state["last_lat"],
                    state["last_lon"],
                    airports,
                    airport_radius_km,
                )
                append_landing(
                    closed,
                    state,
                    state["last_ts"],
                    arrival,
                    ground_glitch_max_seconds,
                )
                state = None
            else:
                update_open(state, point)

        if state is None and not point["on_ground"]:
            is_takeoff = (
                previous_point is not None
                and previous_point["on_ground"]
                and 0
                < point["time_position"] - previous_point["time_position"]
                <= max_transition_gap_seconds
            )
            if is_takeoff:
                departure = nearest_airport(
                    previous_point["lat"],
                    previous_point["lon"],
                    airports,
                    airport_radius_km,
                )
                state = new_open(point, departure)
            else:
                state = new_open(point, (None, None, None))

        previous_point = point

    if state and until_ts - state["last_ts"] > timeout_seconds:
        if state["last_on_ground"]:
            arrival = nearest_airport(
                state["last_lat"],
                state["last_lon"],
                airports,
                airport_radius_km,
            )
            reason = "landing"
        else:
            arrival = (None, None, None)
            reason = "timeout"
        if reason == "landing":
            append_landing(
                closed,
                state,
                state["last_ts"],
                arrival,
                ground_glitch_max_seconds,
            )
        else:
            closed.append(close_flight(state, state["last_ts"], reason, arrival))
        state = None

    return state, closed


def run(args, spark):
    validate_parameters(
        airport_radius_km=args.airport_radius_km,
        timeout_seconds=args.timeout_seconds,
        max_transition_gap_seconds=args.max_transition_gap_seconds,
        ground_glitch_max_seconds=args.ground_glitch_max_seconds,
        allowed_lateness_seconds=args.allowed_lateness_seconds,
    )
    until_ts = (
        args.until_ts
        if args.until_ts is not None
        else int(time.time()) - args.allowed_lateness_seconds
    )

    watermark = load_watermark(spark, args.job_state)
    if until_ts < watermark:
        raise ValueError(f"until_ts ({until_ts}) must not be less than watermark ({watermark})")

    history = spark.read.format("yt").option("path", args.positions_history).load()
    # The cursor follows when streaming made a row visible, not its OpenSky event
    # time. Otherwise a delayed row can arrive after an event-time watermark and
    # be skipped forever.
    new_rows = history.filter(
        col("enriched_at").isNotNull()
        & (col("enriched_at") > watermark)
        & (col("enriched_at") <= until_ts)
        & col("icao24").isNotNull()
        & col("on_ground").isNotNull()
        & col("lat").isNotNull()
        & ~isnan("lat")
        & col("lat").between(-90.0, 90.0)
        & col("lon").isNotNull()
        & ~isnan("lon")
        & col("lon").between(-180.0, 180.0)
    )

    previous_window = Window.partitionBy("icao24").orderBy(col("time_position").desc())
    previous = (
        history.filter(col("enriched_at").isNotNull() & (col("enriched_at") <= watermark))
        .withColumn("rn", row_number().over(previous_window))
        .filter(col("rn") == 1)
        .drop("rn")
    )
    previous_by_aircraft = {row["icao24"]: row.asDict() for row in previous.collect()}
    points_by_aircraft = {}
    for row in new_rows.orderBy("icao24", "time_position").collect():
        points_by_aircraft.setdefault(row["icao24"], []).append(row.asDict())

    airports = [
        row.asDict()
        for row in spark.read.format("yt")
        .option("path", args.ref_airports)
        .load()
        .filter(
            col("latitude_deg").isNotNull()
            & ~isnan("latitude_deg")
            & col("latitude_deg").between(-90.0, 90.0)
            & col("longitude_deg").isNotNull()
            & ~isnan("longitude_deg")
            & col("longitude_deg").between(-180.0, 180.0)
        )
        .collect()
    ]
    states = {
        row["icao24"]: row.asDict()
        for row in spark.read.format("yt")
        .option("path", args.flights_open)
        .load()
        .collect()
    }
    original_open_keys = set(states)
    closed = []

    for icao24 in set(points_by_aircraft) | set(states):
        state = states.get(icao24)
        previous_point = previous_by_aircraft.get(icao24)

        state, newly_closed = process_aircraft_points(
            state=state,
            previous_point=previous_point,
            points=points_by_aircraft.get(icao24, []),
            airports=airports,
            until_ts=until_ts,
            timeout_seconds=args.timeout_seconds,
            max_transition_gap_seconds=args.max_transition_gap_seconds,
            ground_glitch_max_seconds=args.ground_glitch_max_seconds,
            airport_radius_km=args.airport_radius_km,
        )
        closed.extend(newly_closed)

        if state:
            states[icao24] = state
        else:
            states.pop(icao24, None)

    validate_results(states, closed)
    ensure_watermark_unchanged(spark, args.job_state, watermark)

    # Сохраняем закрытые рейсы в flights_segments
    write_rows(spark, closed, args.flights_segments)
    
    # Сохраняем события в airport_events
    events = [
        item
        for segment in closed
        for item in (event(segment, "departure"), event(segment, "arrival"))
        if item
    ]
    write_rows(spark, events, args.airport_events)
    
    # Обновляем существующие и новые открытые рейсы. Для dynamic table запись
    # отсутствующих ключей не удаляет старые строки, поэтому закрытые рейсы ниже
    # удаляются явно через delete_rows.
    if states:
        # Преобразуем словарь в список для Spark
        states_list = list(states.values())
        # Убедимся, что все ключи есть
        for state in states_list:
            # Добавляем departure_icao если его нет
            if "departure_icao" not in state or state["departure_icao"] is None:
                state["departure_icao"] = None
                state["departure_confidence"] = None
        
        open_schema = spark.read.format("yt").option("path", args.flights_open).load().schema

        states_df = spark.createDataFrame(states_list, schema=open_schema)
        (
            states_df.write.format("yt")
            .option("path", args.flights_open)
            .option("inconsistent_dynamic_write", "true")
            .mode("append")
            .save()
        )

    if original_open_keys - set(states):
        delete_closed_open_states(
            create_yt_client(args.proxy),
            args.flights_open,
            original_open_keys,
            states,
        )
    
    # Обновляем watermark в job_state
    job_state_df = spark.createDataFrame(
        [
            {
                "job_name": "job_segment",
                "watermark_ts": until_ts,
                "updated_at": int(time.time()),
            }
        ]
    )
    (
        job_state_df.write.format("yt")
        .option("path", args.job_state)
        .option("inconsistent_dynamic_write", "true")
        .mode("append")
        .save()
    )
    


def main():
    args = parse_arguments()
    spark = create_spark_session()
    try:
        run(args, spark)
    finally:
        spark.stop()


if __name__ == "__main__":
    main()
