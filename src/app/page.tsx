/**
 * Početna: istorijska mapa + klizač godina + bočni panel regiona.
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
import type { Metadata } from "next";

import { MapScreen } from "@/components/map/map-screen";

export const metadata: Metadata = { title: "Mapa" };

export default function HomePage() {
  return <MapScreen />;
}
