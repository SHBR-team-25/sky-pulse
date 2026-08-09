import React from 'react';
import ReactDom from 'react-dom';

const [ymaps3React, ymaps3Clusterer] = await Promise.all([
    ymaps3.import('@yandex/ymaps3-reactify'),
    ymaps3.import('@yandex/ymaps3-clusterer@0.0.1'),
    ymaps3.ready,
]);

export const reactify = ymaps3React.reactify.bindTo(React, ReactDom);
export const {
    YMap,
    YMapDefaultSchemeLayer,
    YMapDefaultFeaturesLayer,
    YMapFeatureDataSource,
    YMapLayer,
    YMapMarker,
} = reactify.module(ymaps3);

export const { YMapClusterer } = reactify.module(ymaps3Clusterer);

export const clusterByGrid = ymaps3Clusterer.clusterByGrid;
