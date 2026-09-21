/**
 * MapLibre GL prikaz istorijskih granica (GeoJSON iz public/maps) sa bojenjem po popunjenosti,
 * hover-om i klikom na region. Bez vanjskog tile/glyph servera – samo poligoni.
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 * 2026-09-21  Worker se učitava iz /maplibre/ (setWorkerUrl) – pod Turbopack-om je bio 404 i mapa je ostajala prazna.
 * 2026-09-21  Kontejner mape dobija inline position:absolute (maplibre-gl.css je nadjačavao Tailwind klasu, visina 0).
 */
"use client";

import {
  AttributionControl,
  type ExpressionSpecification,
  type GeoJSONSource,
  Map as MapLibreMap,
  type MapGeoJSONFeature,
  NavigationControl,
  setWorkerUrl,
} from "maplibre-gl";
import { useEffect, useRef } from "react";

import "maplibre-gl/dist/maplibre-gl.css";

import { mapUrl, type MapYear, type RegionProperties } from "@/lib/map-years";
import type { RegionFill } from "@/lib/map-fill";

import { BORDER, colorForRatio, LAND_LINKED_NOT_LOADED, LAND_UNLINKED, OCEAN } from "./fill-colors";

// REASON: MapLibre 6 traži worker pored svog modula (import.meta.url), što pod Turbopack-om ne
// postoji; worker se kopira u public/maplibre (scripts/copy-maplibre-worker.mjs) i servira odatle.
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

const SOURCE = "regions";
const L_FILL = "regions-fill";
const L_LINE = "regions-line";
const L_HOVER = "regions-hover";
const L_SELECTED = "regions-selected";

export interface HoverInfo {
  name: string;
  x: number;
  y: number;
}

interface Props {
  year: MapYear;
  fills: Record<string, RegionFill>;
  selected: string | null;
  onSelect: (name: string | null) => void;
  onHover: (info: HoverInfo | null) => void;
}

function buildFillExpression(fills: Record<string, RegionFill>): ExpressionSpecification | string {
  const entries = Object.values(fills);
  if (entries.length === 0) return LAND_UNLINKED;
  const expr: unknown[] = ["match", ["get", "NAME"]];
  for (const f of entries) {
    expr.push(f.region, f.ratio == null ? LAND_LINKED_NOT_LOADED : colorForRatio(f.ratio));
  }
  expr.push(LAND_UNLINKED);
  return expr as ExpressionSpecification;
}

export function HistoricalMap({ year, fills, selected, onSelect, onHover }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const loadedRef = useRef(false);
  const hoveredIdRef = useRef<number | string | null>(null);
  const callbacksRef = useRef({ onSelect, onHover });
  // REASON: "load" događaj mape stiže asinhrono; čitamo najnovije propse iz ref-a da ne
  // nacrtamo zastarjelu godinu/paletu iz zatvorenja (closure) pri kreiranju. Ref se
  // osvježava u efektu (a ne tokom rendera) kako nalaže React Compiler.
  const latestRef = useRef({ year, fills, selected });
  useEffect(() => {
    callbacksRef.current = { onSelect, onHover };
    latestRef.current = { year, fills, selected };
  });

  // Inicijalizacija mape (jednom).
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {},
        layers: [{ id: "ocean", type: "background", paint: { "background-color": OCEAN } }],
      },
      center: [18, 45],
      zoom: 3.6,
      minZoom: 1.2,
      maxZoom: 9,
      attributionControl: false,
      // REASON: Granice sa različitim projekcijama uz antimeridijan izgledaju bolje bez ponavljanja svijeta.
      renderWorldCopies: false,
    });
    mapRef.current = map;

    map.addControl(new NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(
      new AttributionControl({
        compact: true,
        customAttribution:
          '© <a href="https://github.com/aourednik/historical-basemaps" target="_blank" rel="noreferrer">historical-basemaps</a> (GPL-3.0)',
      }),
      "bottom-left",
    );

    map.on("load", () => {
      const { year: y0, fills: f0, selected: s0 } = latestRef.current;
      map.addSource(SOURCE, { type: "geojson", data: mapUrl(y0), generateId: true });
      map.addLayer({
        id: L_FILL,
        type: "fill",
        source: SOURCE,
        paint: {
          "fill-color": buildFillExpression(f0),
          "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 1, 0.92],
        },
      });
      map.addLayer({
        id: L_LINE,
        type: "line",
        source: SOURCE,
        paint: { "line-color": BORDER, "line-width": 0.6, "line-opacity": 0.7 },
      });
      map.addLayer({
        id: L_HOVER,
        type: "line",
        source: SOURCE,
        paint: {
          "line-color": "#1f1a12",
          "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 2, 0],
        },
      });
      map.addLayer({
        id: L_SELECTED,
        type: "line",
        source: SOURCE,
        filter: ["==", ["get", "NAME"], s0 ?? ""],
        paint: { "line-color": "#b91c1c", "line-width": 2.5 },
      });
      loadedRef.current = true;

      map.on("mousemove", L_FILL, (e) => {
        const f = e.features?.[0] as MapGeoJSONFeature | undefined;
        if (!f) return;
        map.getCanvas().style.cursor = "pointer";
        if (hoveredIdRef.current !== null && hoveredIdRef.current !== f.id) {
          map.setFeatureState({ source: SOURCE, id: hoveredIdRef.current }, { hover: false });
        }
        hoveredIdRef.current = f.id ?? null;
        if (f.id != null) map.setFeatureState({ source: SOURCE, id: f.id }, { hover: true });
        const name = (f.properties as RegionProperties).NAME ?? "";
        callbacksRef.current.onHover(name ? { name, x: e.point.x, y: e.point.y } : null);
      });
      map.on("mouseleave", L_FILL, () => {
        map.getCanvas().style.cursor = "";
        if (hoveredIdRef.current !== null) {
          map.setFeatureState({ source: SOURCE, id: hoveredIdRef.current }, { hover: false });
          hoveredIdRef.current = null;
        }
        callbacksRef.current.onHover(null);
      });
      map.on("click", L_FILL, (e) => {
        const f = e.features?.[0];
        const name = (f?.properties as RegionProperties | undefined)?.NAME ?? null;
        callbacksRef.current.onSelect(name);
      });
      map.on("click", (e) => {
        const hits = map.queryRenderedFeatures(e.point, { layers: [L_FILL] });
        if (hits.length === 0) callbacksRef.current.onSelect(null);
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
  }, []);

  // Promjena godine -> novi GeoJSON.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    hoveredIdRef.current = null;
    const src = map.getSource(SOURCE) as GeoJSONSource | undefined;
    src?.setData(mapUrl(year));
  }, [year]);

  // Promjena popunjenosti -> nova paleta.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    map.setPaintProperty(L_FILL, "fill-color", buildFillExpression(fills));
  }, [fills]);

  // Izabrani region -> crveni obrub.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    map.setFilter(L_SELECTED, ["==", ["get", "NAME"], selected ?? ""]);
  }, [selected]);

  // REASON: maplibre-gl.css postavlja `.maplibregl-map { position: relative }` i nadjačava Tailwind
  // `absolute` (ista specifičnost, kasnije učitan) – kontejner tada ima visinu 0 i mapa je prazna.
  // Inline stil je jači od oba.
  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", inset: 0 }}
      aria-label="Istorijska mapa svijeta"
    />
  );
}
