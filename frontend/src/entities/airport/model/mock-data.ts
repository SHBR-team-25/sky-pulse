import type { components } from '@/shared/api';

type AirportsListResponse = components['schemas']['AirportsListResponse'];

export const airportsMock = {
    asOf: 1_785_578_400,
    items: [
        {
            icao: 'UUEE',
            iata: 'SVO',
            name: 'Sheremetyevo International Airport',
            city: 'Moscow',
            country: 'RU',
            position: { lat: 55.9726, lon: 37.4146 },
        },
        {
            icao: 'UUDD',
            iata: 'DME',
            name: 'Domodedovo International Airport',
            city: 'Moscow',
            country: 'RU',
            position: { lat: 55.4088, lon: 37.9063 },
        },
        {
            icao: 'UUWW',
            iata: 'VKO',
            name: 'Vnukovo International Airport',
            city: 'Moscow',
            country: 'RU',
            position: { lat: 55.5915, lon: 37.2615 },
        },
        {
            icao: 'UUBW',
            iata: 'ZIA',
            name: 'Zhukovsky International Airport',
            city: 'Zhukovsky',
            country: 'RU',
            position: { lat: 55.5533, lon: 38.15 },
        },
        {
            icao: 'UUMO',
            iata: null,
            name: 'Ostafyevo International Airport',
            city: 'Moscow',
            country: 'RU',
            position: { lat: 55.5117, lon: 37.5072 },
        },
    ],
    page: 1,
    pageSize: 5,
    total: 5,
} satisfies AirportsListResponse;
