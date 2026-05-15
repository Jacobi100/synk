"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import Link from "next/link";
import { COPY } from "@/lib/copy";

interface NearbyJob {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  price_min: number | null;
  price_max: number | null;
  location_name: string | null;
}

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Not in browser context.")); return;
    }
    if ((window as Window & { google?: { maps?: unknown } }).google?.maps) {
      resolve(); return;
    }
    if (document.getElementById("gmaps-script")) {
      const poll = setInterval(() => {
        if ((window as Window & { google?: { maps?: unknown } }).google?.maps) {
          clearInterval(poll); resolve();
        }
      }, 100);
      return;
    }
    (window as Window & { __gmapsReady?: () => void }).__gmapsReady = resolve;
    const script = document.createElement("script");
    script.id = "gmaps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=__gmapsReady`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Google Maps failed to load."));
    document.head.appendChild(script);
  });
}

function resolveCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 30_000 }
    );
  });
}

interface NearbyJobsMapProps {
  compact?: boolean;
}

export default function NearbyJobsMap({ compact }: NearbyJobsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [jobs, setJobs] = useState<NearbyJob[]>([]);
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const res = await fetch("/api/bounties/feed");
        const data = await res.json();
        const bounties = (data.bounties || []) as NearbyJob[];
        if (!isMounted) return;
        setJobs(bounties);

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey || !mapContainerRef.current) {
          setMapStatus("error");
          return;
        }

        const coords = await resolveCurrentPosition();
        await loadGoogleMapsScript(apiKey);
        if (!isMounted || !mapContainerRef.current) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const g = (window as any).google;
        const center = coords || { lat: 9.082, lng: 8.6753 };

        const map = new g.maps.Map(mapContainerRef.current, {
          zoom: coords ? 12 : 6,
          center,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          styles: [
            { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
          ],
        });

        bounties.forEach((job) => {
          if (!job.latitude || !job.longitude) return;
          const marker = new g.maps.Marker({
            position: { lat: job.latitude, lng: job.longitude },
            map,
            title: job.title,
            icon: {
              path: g.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#5E3AFF",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });

          const infoWindow = new g.maps.InfoWindow({
            content: `<div style="padding:8px;font-family:system-ui,sans-serif;max-width:200px">
              <p style="font-weight:600;font-size:14px;margin:0 0 4px">${job.title}</p>
              ${job.price_min || job.price_max ? `<p style="font-size:13px;color:#666;margin:0">₦${job.price_min?.toLocaleString() || ''}${job.price_max ? ` – ₦${job.price_max.toLocaleString()}` : ''}</p>` : ''}
              ${job.location_name ? `<p style="font-size:12px;color:#999;margin:4px 0 0">📍 ${job.location_name}</p>` : ''}
            </div>`,
          });

          marker.addListener("click", () => infoWindow.open(map, marker));
        });

        setMapStatus("ready");
      } catch {
        if (isMounted) setMapStatus("error");
      }
    }

    init();
    return () => { isMounted = false; };
  }, []);

  if (compact) {
    return (
      <>
        <div
          className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(94,58,255,0.08) 0%, transparent 70%)" }}
        />

        <div className="overflow-hidden rounded-[24px] border border-white/10">
          <div className="relative" style={{ height: "420px" }}>
            {mapStatus === "loading" && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0e0f0c]">
                <Loader2 className="h-7 w-7 animate-spin text-[#5E3AFF]" />
                <p className="text-sm text-[#868685]">{COPY.NAV_MAP.LOADING}</p>
              </div>
            )}
            {mapStatus === "error" && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[#0e0f0c]">
                <MapPin className="h-8 w-8 text-[#868685]" />
                <p className="text-sm text-[#868685]">
                  {COPY.NAV_MAP.ERROR_FALLBACK}
                </p>
              </div>
            )}
            <div ref={mapContainerRef} className="h-full w-full" />
          </div>

          <div className="flex items-center justify-between px-5 py-3 bg-background">
            <span className="text-xs font-medium text-muted-foreground">
              {jobs.length} {jobs.length === 1 ? "job" : "jobs"} near you
            </span>
            <Link
              href="/dashboard"
              className="text-xs font-semibold transition-colors hover:underline text-primary"
            >
              {COPY.HOME.FIND_JOBS} &rarr;
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="relative overflow-hidden bg-[#0e0f0c]">
      <div
        className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(94,58,255,0.08) 0%, transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-8">
          <p className="text-xl font-semibold leading-relaxed text-[#e8ebe6]">
            {COPY.HOME.FIND_JOBS_DESC}
          </p>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-white/10">
          <div className="relative" style={{ height: "420px" }}>
            {mapStatus === "loading" && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0e0f0c]">
                <Loader2 className="h-7 w-7 animate-spin text-[#5E3AFF]" />
                <p className="text-sm text-[#868685]">{COPY.NAV_MAP.LOADING}</p>
              </div>
            )}
            {mapStatus === "error" && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[#0e0f0c]">
                <MapPin className="h-8 w-8 text-[#868685]" />
                <p className="text-sm text-[#868685]">
                  {COPY.NAV_MAP.ERROR_FALLBACK}
                </p>
              </div>
            )}
            <div ref={mapContainerRef} className="h-full w-full" />
          </div>

          <div className="flex items-center justify-between px-5 py-3 bg-background">
            <span className="text-xs font-medium text-muted-foreground">
              {jobs.length} {jobs.length === 1 ? "job" : "jobs"} near you
            </span>
            <Link
              href="/dashboard"
              className="text-xs font-semibold transition-colors hover:underline text-primary"
            >
              {COPY.HOME.FIND_JOBS} &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
