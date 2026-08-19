const PLANE_ICON_TILT_DEG = 45;

export function getFlightIconRotation(trueTrack: number | null | undefined): string {
    return `rotate(${(trueTrack ?? 0) - PLANE_ICON_TILT_DEG}deg)`;
}
