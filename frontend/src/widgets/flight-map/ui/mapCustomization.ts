import type { CustomizationConfig } from '@yandex/ymaps3-types';

type MapTheme = 'light' | 'dark';

const sharedMapCustomization: CustomizationConfig = [
    {
        tags: { any: ['park', 'cemetery'] },
        stylers: { visibility: 'off' },
    },
    {
        tags: { any: ['vegetation'] },
        stylers: { visibility: 'off' },
    },
    {
        tags: { any: ['industrial', 'construction_site', 'medical', 'sports_ground', 'beach'] },
        types: 'polygon',
        stylers: { visibility: 'off' },
    },
    {
        tags: {
            any: 'transit',
            none: ['transit_location', 'transit_line', 'transit_schema', 'is_unclassified_transit'],
        },
        stylers: { visibility: 'off' },
    },
    {
        tags: {
            any: 'urban_area',
            none: [
                'residential',
                'industrial',
                'cemetery',
                'park',
                'medical',
                'sports_ground',
                'beach',
                'construction_site',
            ],
        },
        stylers: { visibility: 'off' },
    },
    {
        tags: { any: ['transit'] },
        elements: ['label.icon', 'label.text'],
        stylers: { visibility: 'off' },
    },
    {
        tags: { any: ['outdoor', 'park', 'cemetery', 'medical'] },
        elements: 'label',
        stylers: { visibility: 'off' },
    },
    {
        tags: { any: 'poi', none: ['outdoor', 'park', 'cemetery', 'medical'] },
        stylers: { visibility: 'off' },
    },
    {
        tags: { any: 'road' },
        types: 'point',
        stylers: { visibility: 'off' },
    },
    {
        tags: { any: ['food_and_drink', 'shopping', 'commercial_services'] },
        stylers: { visibility: 'off' },
    },
    {
        tags: { any: ['traffic_light'] },
        stylers: { visibility: 'off' },
    },
    {
        tags: { any: ['entrance'] },
        stylers: { visibility: 'off' },
    },
    {
        tags: {
            any: ['road'],
            none: ['road_1', 'road_2', 'road_3', 'road_4', 'road_5', 'road_6', 'road_7'],
        },
        elements: 'label.icon',
        stylers: { visibility: 'off' },
    },
    {
        tags: { any: ['road_5', 'road_6'] },
        stylers: { visibility: 'off' },
    },
    {
        tags: { any: ['road_7'] },
        stylers: { visibility: 'off' },
    },
    {
        tags: {
            any: ['road_construction', 'road_minor', 'road_unclassified', 'path', 'road_limited'],
        },
        stylers: { visibility: 'off' },
    },
    {
        tags: { any: ['district'] },
        elements: 'label',
        stylers: { visibility: 'off' },
    },
    {
        tags: { any: 'admin', none: ['country', 'region', 'locality', 'district', 'address'] },
        elements: 'label',
        stylers: { visibility: 'off' },
    },
    {
        tags: { any: ['road_5', 'road_6'] },
        elements: 'label',
        stylers: { visibility: 'off' },
    },
    {
        tags: {
            any: [
                'address',
                'road_7',
                'road_limited',
                'road_unclassified',
                'road_minor',
                'road_construction',
                'path',
            ],
        },
        elements: 'label',
        stylers: { visibility: 'off' },
    },
    {
        tags: { any: ['building', 'address', 'fence'] },
        stylers: { visibility: 'off' },
    },
    {
        tags: { any: ['transit'] },
        stylers: { visibility: 'off' },
    },
];

export const mapCustomizationByTheme: Record<MapTheme, CustomizationConfig> = {
    light: sharedMapCustomization,
    dark: sharedMapCustomization,
};
