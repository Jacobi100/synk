"use client";

import { useEffect, useRef, useState } from "react";
import { Navigation, ExternalLink, Loader2, MapPin, AlertCircle } from "lucide-react";
import { COPY } from "@/lib/copy";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavigationMapProps {
  destinationLat:    number;
  destinationLng:    number;
  destinationLabel?: string;
  bountyTitle?:      string;
}

interface RouteInfo {
  distance: string;
  duration: string;
}

type MapStatus = "loading" | "ready" | "no-location" | "error";

// ---------------------------------------------------------------------------
// Loads the Maps JS API script exactly once per page lifecycle
// ---------------------------------------------------------------------------

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Not in browser context.")); return;
    }

    // Already loaded
    if ((window as Window & { google?: { maps?: unknown } }).google?.maps) {
      resolve(); return;
    }

    // Script already injected — poll until the global is ready
    if (document.getElementById("gmaps-script")) {
      const poll = setInterval(() => {
        if ((window as Window & { google?: { maps?: unknown } }).google?.maps) {
          clearInterval(poll); resolve();
        }
      }, 100);
      return;
    }

    (window as Window & { __gmapsReady?: () => void }).__gmapsReady = resolve;

    const script   = document.createElement("script");
    script.id      = "gmaps-script";
    script.src     = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=__gmapsReady`;
    script.async   = true;
    script.defer   = true;
    script.onerror = () => reject(new Error("Google Maps failed to load. Verify your API key."));
    document.head.appendChild(script);
  });
}

// ---------------------------------------------------------------------------
// Wraps geolocation in a Promise — resolves null on denial or timeout
// ---------------------------------------------------------------------------

function resolveCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      ()    => resolve(null),
      { timeout: 8000, maximumAge: 30_000 }
    );
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NavigationMap({
  destinationLat,
  destinationLng,
  destinationLabel,
}: NavigationMapProps) {
  const mapContainerRef                   = useRef<HTMLDivElement>(null);
  const [mapStatus, setMapStatus]         = useState<MapStatus>("loading");
  const [errorMessage, setErrorMessage]   = useState("");
  const [routeInfo, setRouteInfo]         = useState<RouteInfo | null>(null);

  const googleMapsDirectionsUrl =
    `https://www.google.com/maps/dir/?api=1` +
    `&destination=${destinationLat},${destinationLng}` +
    `&travelmode=driving`;

  useEffect(() => {
    let isMounted = true;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setErrorMessage("Google Maps API key is not configured.");
      setMapStatus("error");
      return;
    }

    async function initMap() {
      try {
        const [, providerCoords] = await Promise.all([
          loadGoogleMapsScript(apiKey!),
          resolveCurrentPosition(),
        ]);

        if (!isMounted || !mapContainerRef.current) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const g   = (window as any).google;
        const destination = { lat: destinationLat, lng: destinationLng };

        const map: google.maps.Map = new g.maps.Map(mapContainerRef.current, {
          zoom:              14,
          center:            destination,
          zoomControl:       true,
          streetViewControl: false,
          mapTypeControl:    false,
          fullscreenControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers:     [{ visibility: "off" }],
            },
          ],
        });

        // Destination marker — always shown
        new g.maps.Marker({
          position: destination,
          map,
          title:    destinationLabel ?? "Buyer location",
          icon: {
            path:         g.maps.SymbolPath.CIRCLE,
            scale:        10,
            fillColor:    "#5e3aff",
            fillOpacity:  1,
            strokeColor:  "#ffffff",
            strokeWeight: 2,
          },
        });

        if (!providerCoords) {
          if (isMounted) setMapStatus("no-location");
          return;
        }

        const directionsService  = new g.maps.DirectionsService() as google.maps.DirectionsService;
        const directionsRenderer = new g.maps.DirectionsRenderer({
          suppressMarkers: false,
          polylineOptions: {
            strokeColor:   "#5e3aff",
            strokeWeight:  5,
            strokeOpacity: 0.85,
          },
        }) as google.maps.DirectionsRenderer;

        directionsRenderer.setMap(map);

        directionsService.route(
          {
            origin:     providerCoords,
            destination,
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (
            result: google.maps.DirectionsResult | null,
            status: google.maps.DirectionsStatus
          ) => {
            if (!isMounted) return;

            if (status === google.maps.DirectionsStatus.OK && result) {
              directionsRenderer.setDirections(result);
              const leg = result.routes?.[0]?.legs?.[0];
              if (leg?.distance && leg?.duration) {
                setRouteInfo({
                  distance: leg.distance.text,
                  duration: leg.duration.text,
                });
              }
            }

            // Map is ready regardless of whether directions succeeded
            setMapStatus("ready");
          }
        );

      } catch (err) {
        if (!isMounted) return;
        setErrorMessage(
          err instanceof Error ? err.message : "An unexpected error occurred."
        );
        setMapStatus("error");
      }
    }

    initMap();
    return () => { isMounted = false; };

  }, [destinationLat, destinationLng, destinationLabel]);

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: "var(--border)", boxShadow: "var(--synk-shadow)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg2)" }}
      >
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4" style={{ color: "var(--violet)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            {COPY.NAV_MAP.TITLE}
          </span>
        </div>
        
          href={googleMapsDirectionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all hover:-translate-y-0.5"
          style={{
            backgroundColor: "var(--violet)",
            boxShadow:       "var(--shadow-violet)",
          }}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {COPY.NAV_MAP.OPEN_IN_MAPS}
        </a>
      </div>

      {/* Route summary — rendered only after directions load */}
      {routeInfo && (
        <div
          className="flex items-center gap-4 px-5 py-2.5 border-b text-sm"
          style={{ borderColor: "var(--border)", backgroundColor: "#f5f3ff" }}
        >
          <span className="font-semibold" style={{ color: "var(--violet)" }}>
            {routeInfo.duration}
          </span>
          <span style={{ color: "var(--text2)" }}>·</span>
          <span style={{ color: "var(--text2)" }}>📍 {routeInfo.distance}</span>
          {destinationLabel && (
            <>
              <span style={{ color: "var(--text2)" }}>·</span>
              <span style={{ color: "var(--text2)" }}>{destinationLabel}</span>
            </>
          )}
        </div>
      )}

      {/* Geolocation denied warning */}
      {mapStatus === "no-location" && (
        <div
          className="flex items-center gap-2 px-5 py-2.5 border-b text-xs"
          style={{
            borderColor:     "var(--border)",
            backgroundColor: "#fffbeb",
            color:           "#92400e",
          }}
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {COPY.NAV_MAP.NO_LOCATION}
        </div>
      )}

      {/* Map viewport */}
      <div className="relative" style={{ height: "360px" }}>

        {mapStatus === "loading" && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10"
            style={{ backgroundColor: "var(--bg2)" }}
          >
            <Loader2 className="h-7 w-7 animate-spin" style={{ color: "var(--violet)" }} />
            <p className="text-sm" style={{ color: "var(--text2)" }}>{COPY.NAV_MAP.LOADING}</p>
          </div>
        )}

        {mapStatus === "error" && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 z-10"
            style={{ backgroundColor: "var(--bg2)" }}
          >
            <MapPin className="h-8 w-8" style={{ color: "var(--text3)" }} />
            <p className="text-sm text-center" style={{ color: "var(--text2)" }}>
              {errorMessage}
            </p>
            
              href={googleMapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--violet)" }}
            >
              <ExternalLink className="h-4 w-4" />
              {COPY.NAV_MAP.ERROR_FALLBACK}
            </a>
          </div>
        )}

        <div ref={mapContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
}