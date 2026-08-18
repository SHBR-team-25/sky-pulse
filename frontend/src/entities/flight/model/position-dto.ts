import type {
    AircraftPosition,
    FlightDetails,
    FlightPhase,
    FlightTrackPoint,
    LiveFlight,
} from './types';

/** Ответ positions-service: GET /positions и GET /positions/{icao24}. */
export interface PositionDto {
    icao24: string;
    callsign: string | null;
    originCountry: string | null;
    timePosition: number;
    lat: number;
    lon: number;
    baroAltitude: number | null;
    onGround: boolean;
    velocity: number | null;
    trueTrack: number | null;
    manufacturername: string | null;
    model: string | null;
    operator: string | null;
}

/** Ответ positions-service: GET /positions/{icao24}/track. */
export interface TrackPointDto {
    timePosition: number;
    lat: number;
    lon: number;
    baroAltitude: number | null;
}

/** Приводит позицию из ответа сервиса к доменной модели. */
export function toAircraftPosition(position: PositionDto): AircraftPosition {
    return {
        icao24: position.icao24,
        lat: position.lat,
        lon: position.lon,
        altitudeM: position.baroAltitude,
        headingDeg: position.trueTrack,
        speedKmh: position.velocity === null ? null : position.velocity * 3.6,
        verticalRateMs: null,
        onGround: position.onGround,
        timestamp: position.timePosition,
    };
}

/** Определяет фазу полёта по признаку нахождения на земле. */
export function toFlightPhase(onGround: boolean): FlightPhase {
    return onGround ? 'on_ground' : 'cruising';
}

/** Приводит точку трека к точке маршрута доменной модели. */
export function toFlightTrackPoint(point: TrackPointDto): FlightTrackPoint {
    return {
        timestamp: point.timePosition,
        lat: point.lat,
        lon: point.lon,
        altitudeM: point.baroAltitude,
        headingDeg: null,
        onGround: false,
    };
}

/** Приводит позицию к борту на карте. */
export function toLiveFlight(position: PositionDto): LiveFlight {
    return {
        type: 'solo', // FIXME:
        count: 1,
        icao24: position.icao24,
        callsign: position.callsign,
        airlineName: position.operator,
        position: toAircraftPosition(position),
        phase: toFlightPhase(position.onGround),
        origin: null,
        destination: null,
        squawk: null,
    };
}

/** Собирает детали рейса из позиции и трека. */
export function toFlightDetails(position: PositionDto, track: TrackPointDto[]): FlightDetails {
    return {
        icao24: position.icao24,
        callsign: position.callsign,
        registration: null,
        manufacturer: position.manufacturername,
        model: position.model,
        airlineName: position.operator,
        origin: null,
        destination: null,
        position: toAircraftPosition(position),
        phase: toFlightPhase(position.onGround),
        etaMinutes: null,
        startTime: null,
        endTime: null,
        path: track.map(toFlightTrackPoint),
    };
}
