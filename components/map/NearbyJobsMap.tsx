"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&libraries=marker&callback=__gmapsReady`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Google Maps failed to load."));
    document.head.appendChild(script);
  });
}

function buildTooltipHTML(job: NearbyJob): string {
  const price =
    job.price_min || job.price_max
      ? `₦${job.price_min?.toLocaleString() ?? ""}${job.price_max ? ` – ₦${job.price_max.toLocaleString()}` : ""}`
      : null;

  return `
    <div style="font-family:system-ui,sans-serif;max-width:240px;min-width:170px;">
      <div style="padding:12px 14px 6px;">
        <p style="font-weight:700;font-size:14px;margin:0 0 3px;color:#0e0f0c;line-height:1.3;">
          ${job.title}
        </p>
        ${price ? `<p style="font-size:13px;margin:0;color:#5E3AFF;font-weight:700;">${price}</p>` : ""}
        ${job.location_name ? `<p style="font-size:12px;margin:6px 0 0;color:#666;display:flex;align-items:center;gap:3px;">📍 ${job.location_name}</p>` : ""}
      </div>
      <div style="border-top:1px solid #e5e7eb;padding:8px 14px;">
        <a href="/bounties/${job.id}" style="font-size:12px;font-weight:600;color:#5E3AFF;text-decoration:none;">
          View Details &rarr;
        </a>
      </div>
    </div>
  `;
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
  flush?: boolean;
}

function buildMarkerLabel(job: NearbyJob): HTMLDivElement {
  const price =
    job.price_min || job.price_max
      ? `₦${job.price_min?.toLocaleString() ?? ""}${job.price_max ? ` – ₦${job.price_max.toLocaleString()}` : ""}`
      : "";

  const el = document.createElement("div");
  el.style.cssText =
    "display:flex;flex-direction:column;align-items:center;cursor:pointer;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.2));transform:translateY(-50%);";
  el.innerHTML = `
    <div style="background:#5E3AFF;color:white;padding:5px 12px;border-radius:8px;font-size:12px;font-weight:600;white-space:nowrap;max-width:160px;overflow:hidden;text-overflow:ellipsis;text-align:center;line-height:1.3;">
      ${job.title}${price ? ` · ${price}` : ""}
    </div>
    <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:6px solid #5E3AFF;"></div>
  `;
  return el;
}

export default function NearbyJobsMap({ compact, flush }: NearbyJobsMapProps) {
  const router = useRouter();
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
        const { AdvancedMarkerElement, PinElement } = await g.maps.importLibrary("marker");

        const center = coords || { lat: 9.082, lng: 8.6753 };

        const map = new g.maps.Map(mapContainerRef.current, {
          zoom: coords ? 12 : 6,
          center,
          mapId: "DEMO_MAP_ID",
          zoomControl: true,
          zoomControlOptions: {
            position: g.maps.ControlPosition.RIGHT_CENTER,
          },
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          fullscreenControlOptions: {
            position: g.maps.ControlPosition.RIGHT_TOP,
          },
          styles: [
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] },
            { featureType: "address", stylers: [{ visibility: "off" }] },
            { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
            { featureType: "administrative.neighborhood", stylers: [{ visibility: "off" }] },
          ],
        });

        const isHoverDevice = window.matchMedia("(hover: hover)").matches;
        let tooltipTimeout: ReturnType<typeof setTimeout> | null = null;

        const infoWindow = new g.maps.InfoWindow({
          pixelOffset: new g.maps.Size(0, -8),
        });

        bounties.forEach((job) => {
          if (!job.latitude || !job.longitude) return;

          const label = buildMarkerLabel(job);

          const marker = new AdvancedMarkerElement({
            map,
            position: { lat: job.latitude, lng: job.longitude },
            title: job.title,
            content: label,
          });

          const html = buildTooltipHTML(job);

          if (isHoverDevice) {
            label.addEventListener("mouseenter", () => {
              if (tooltipTimeout) clearTimeout(tooltipTimeout);
              infoWindow.setContent(html);
              infoWindow.open({ map, anchor: marker });
            });

            label.addEventListener("mouseleave", () => {
              tooltipTimeout = setTimeout(() => infoWindow.close(), 200);
            });
          }

          marker.addListener("click", () => {
            router.push(`/bounties/${job.id}`);
          });
        });

        if (coords) {
          const dot = document.createElement("div");
          dot.style.cssText =
            "width:18px;height:18px;border-radius:50%;background:#000;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);";

          new AdvancedMarkerElement({
            map,
            position: coords,
            title: "Your location",
            content: dot,
          });
        }

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
      <div className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full blur-3xl sm:-top-32 sm:-right-32 sm:h-96 sm:w-96"
          style={{ background: "radial-gradient(circle, rgba(94,58,255,0.08) 0%, transparent 70%)" }}
        />

        <div className={`overflow-hidden ${flush ? "" : "rounded-[24px] border"}`} style={{ borderColor: flush ? undefined : "var(--border)" }}>
          <div className="relative" style={{ height: "420px" }}>
            {mapStatus === "loading" && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">{COPY.NAV_MAP.LOADING}</p>
              </div>
            )}
            {mapStatus === "error" && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-background">
                <MapPin className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {COPY.NAV_MAP.ERROR_FALLBACK}
                </p>
              </div>
            )}
            <div ref={mapContainerRef} className="h-full w-full" />
          </div>

          <div className="flex items-center justify-between border-t px-5 py-3 bg-background" style={{ borderColor: "var(--border)" }}>
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
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(94,58,255,0.08) 0%, transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-8">
          <p className="text-xl font-semibold leading-relaxed text-foreground">
            {COPY.HOME.FIND_JOBS_DESC}
          </p>
        </div>

        <div className="overflow-hidden rounded-[24px] border" style={{ borderColor: "var(--border)" }}>
          <div className="relative" style={{ height: "420px" }}>
            {mapStatus === "loading" && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">{COPY.NAV_MAP.LOADING}</p>
              </div>
            )}
            {mapStatus === "error" && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-background">
                <MapPin className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {COPY.NAV_MAP.ERROR_FALLBACK}
                </p>
              </div>
            )}
            <div ref={mapContainerRef} className="h-full w-full" />
          </div>

          <div className="flex items-center justify-between border-t px-5 py-3 bg-background" style={{ borderColor: "var(--border)" }}>
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
