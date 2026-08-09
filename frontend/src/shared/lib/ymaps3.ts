import React from 'react';
import ReactDom from 'react-dom';
import '@yandex/ymaps3-default-ui-theme/dist/esm/index.css';

const [ymaps3React] = await Promise.all([ymaps3.import('@yandex/ymaps3-reactify'), ymaps3.ready]);
const ymaps3Clusterer = await import('@yandex/ymaps3-clusterer');
const ymaps3DefaultUiTheme = await import('@yandex/ymaps3-default-ui-theme');

export const reactify = ymaps3React.reactify.bindTo(React, ReactDom);
export const {
    YMap,
    YMapDefaultSchemeLayer,
    YMapDefaultFeaturesLayer,
    YMapFeatureDataSource,
    YMapLayer,
    YMapMarker,
    YMapControls,
} = reactify.module(ymaps3);

export const { YMapClusterer } = reactify.module(ymaps3Clusterer);
export const { YMapZoomControl } = reactify.module(ymaps3DefaultUiTheme);

export const clusterByGrid = ymaps3Clusterer.clusterByGrid;
