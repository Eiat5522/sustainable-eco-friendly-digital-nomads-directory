"use client"

import { WorldMap } from "./world-map"

export function WorldMapDemo() {
  const dots = [
    {
      start: {
        lat: 64.2008,
        lng: -149.4937,
      },
      end: {
        lat: 34.0522,
        lng: -118.2437,
      },
    },
    {
      start: {
        lat: 64.2008,
        lng: -149.4937,
      },
      end: {
        lat: -15.432563,
        lng: 28.315853,
      },
    },
    {
      start: {
        lat: -15.432563,
        lng: 28.315853,
      },
      end: {
        lat: 38.5767,
        lng: -92.1735,
      },
    },
    {
      start: {
        lat: -15.432563,
        lng: 28.315853,
      },
      end: {
        lat: -34.6118,
        lng: -58.3960,
      },
    },
    {
      start: {
        lat: -15.432563,
        lng: 28.315853,
      },
      end: {
        lat: 1.3521,
        lng: 103.8198,
      },
    },
    {
      start: {
        lat: 32.0853,
        lng: 34.7818,
      },
      end: {
        lat: 25.2048,
        lng: 55.2708,
      },
    },
    {
      start: {
        lat: 1.3521,
        lng: 103.8198,
      },
      end: {
        lat: 35.6762,
        lng: 139.6503,
      },
    },
    {
      start: {
        lat: 22.396428,
        lng: 114.109497,
      },
      end: {
        lat: 40.7128,
        lng: -74.0060,
      },
    },
    {
      start: {
        lat: 35.6762,
        lng: 139.6503,
      },
      end: {
        lat: 22.396428,
        lng: 114.109497,
      },
    },
    {
      start: {
        lat: 25.2048,
        lng: 55.2708,
      },
      end: {
        lat: 51.5074,
        lng: -0.1278,
      },
    },
    {
      start: {
        lat: 51.5074,
        lng: -0.1278,
      },
      end: {
        lat: 40.7128,
        lng: -74.0060,
      },
    },
    {
      start: {
        lat: 14.5995,
        lng: 120.9842,
      },
      end: {
        lat: 51.5074,
        lng: -0.1278,
      },
    },
  ]

  return (
    <div className="py-10 bg-background">
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-sm md:text-lg text-muted-foreground">
          Discover sustainable destinations worldwide
        </p>
        <h2 className="text-lg md:text-4xl text-foreground mt-4 relative z-20 font-bold tracking-tight">
          Find Your Next{" "}
          <span className="text-primary">
            Eco-Friendly Digital Nomad
          </span>{" "}
          Destination
        </h2>
      </div>
      <WorldMap dots={dots} />
    </div>
  )
}
