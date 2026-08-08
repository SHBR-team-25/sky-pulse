import { flightDetailsMock } from '@/entities/flight';
import type { components } from '@/shared/types/api';

type FlightDetailsResponse = components['schemas']['FlightDetailsResponse'];

const MOCK_REQUEST_DELAY_MS = 500;

// TODO: временная функция для моков
export async function getFlightDetails(icao24: string): Promise<FlightDetailsResponse | null> {
    // TODO: тут применить функции запросов вместо мок
    await new Promise<void>((resolve) => {
        setTimeout(resolve, MOCK_REQUEST_DELAY_MS);
    });

    return flightDetailsMock.icao24 === icao24 ? flightDetailsMock : null;
}
