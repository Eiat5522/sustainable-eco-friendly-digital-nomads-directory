// Type definitions for leaflet.markercluster
// Project: https://github.com/Leaflet/Leaflet.markercluster
// Definitions by: Robert Imig <https://github.com/rimig>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.3

import * as L from 'leaflet';

declare module 'leaflet' {
    class MarkerClusterGroup extends FeatureGroup {
        constructor(options?: MarkerClusterGroupOptions);
        clearLayers(): this;
        addLayer(layer: Layer): this;
        addLayers(layers: Layer[]): this;
        removeLayer(layer: Layer): this;
        removeLayers(layers: Layer[]): this;
        hasLayer(layer: Layer): boolean;
        getLayer(id: number): Layer | undefined;
        getLayers(): Layer[];
        zoomToShowLayer(layer: Layer, callback?: () => void): void;
        refreshClusters(layers?: Layer | Layer[] | LayerGroup): this;
        disableClustering(): this;
        enableClustering(): this;
    }

    interface MarkerClusterGroupOptions {
        showCoverageOnHover?: boolean;
        zoomToBoundsOnClick?: boolean;
        spiderfyOnMaxZoom?: boolean;
        removeOutsideVisibleBounds?: boolean;
        animate?: boolean;
        animateAddingMarkers?: boolean;
        disableClusteringAtZoom?: number;
        maxClusterRadius?: number | ((zoom: number) => number);
        polygonOptions?: PolylineOptions;
        singleMarkerMode?: boolean;
        spiderLegPolylineOptions?: PolylineOptions;
        spiderfyDistanceMultiplier?: number;
        chunkedLoading?: boolean;
        chunkDelay?: number;
        iconCreateFunction?: (cluster: Cluster) => Icon | DivIcon;
    }

    interface Cluster {
        getChildCount(): number;
        getAllChildMarkers(storage?: Marker[]): Marker[];
        getBounds(): LatLngBounds;
        getLatLng(): LatLng;
    }
}
