import type { components } from '@/shared/api';

type AirportsListResponse = components['schemas']['AirportsListResponse'];
type AirportFlightsResponse = components['schemas']['AirportFlightsResponse'];

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

export const airportFlightsMock = {
    airport: {
        icao: 'UUEE',
        iata: 'SVO',
        name: 'Sheremetyevo International Airport',
    },
    items: [
        {
            icao24: '4242f4',
            callsign: 'SU2604',
            airlineName: 'Aeroflot',
            direction: 'departure',
            otherAirport: {
                icao: 'LFPG',
                iata: 'CDG',
                name: 'Charles de Gaulle International Airport',
                asOf: 1_785_578_400,
                candidatesCount: 1,
            },
            observedAt: 1_785_578_100,
        },
        {
            icao24: '4248f2',
            callsign: 'SU1702',
            airlineName: 'Aeroflot',
            direction: 'departure',
            otherAirport: {
                icao: 'UNNT',
                iata: 'OVB',
                name: 'Novosibirsk Tolmachevo Airport',
                asOf: 1_785_578_400,
                candidatesCount: 1,
            },
            observedAt: 1_785_577_200,
        },
        {
            icao24: '4ca8e7',
            callsign: 'AZ542',
            airlineName: 'ITA Airways',
            direction: 'arrival',
            otherAirport: {
                icao: 'LIRF',
                iata: 'FCO',
                name: 'Rome Fiumicino Airport',
                asOf: 1_785_578_400,
                candidatesCount: 1,
            },
            observedAt: 1_785_576_300,
        },
        {
            icao24: '4245d8',
            callsign: 'SU274',
            airlineName: 'Aeroflot',
            direction: 'departure',
            otherAirport: {
                icao: 'ZBAA',
                iata: 'PEK',
                name: 'Beijing Capital International Airport',
                asOf: 1_785_578_400,
                candidatesCount: 2,
            },
            observedAt: 1_785_575_400,
        },
        {
            icao24: '4247a1',
            callsign: 'FV6321',
            airlineName: 'Rossiya Airlines',
            direction: 'arrival',
            otherAirport: {
                icao: 'URSS',
                iata: 'AER',
                name: 'Sochi International Airport',
                asOf: 1_785_578_400,
                candidatesCount: 1,
            },
            observedAt: 1_785_574_500,
        },
        {
            icao24: '8963f2',
            callsign: 'EK130',
            airlineName: 'Emirates',
            direction: 'arrival',
            otherAirport: {
                icao: 'OMDB',
                iata: 'DXB',
                name: 'Dubai International Airport',
                asOf: 1_785_578_400,
                candidatesCount: 1,
            },
            observedAt: 1_785_573_600,
        },
        {
            icao24: '4240c1',
            callsign: null,
            airlineName: null,
            direction: 'departure',
            otherAirport: null,
            observedAt: 1_785_572_700,
        },
        {
            icao24: '3c65a8',
            callsign: 'LH1444',
            airlineName: 'Lufthansa',
            direction: 'arrival',
            otherAirport: {
                icao: 'EDDF',
                iata: 'FRA',
                name: 'Frankfurt Airport',
                asOf: 1_785_578_400,
                candidatesCount: 1,
            },
            observedAt: 1_785_571_800,
        },
    ],
} satisfies AirportFlightsResponse;
