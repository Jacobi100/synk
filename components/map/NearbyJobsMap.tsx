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

type TooltipStyle = "compact" | "detailed";

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

function formatCompactPrice(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return m % 1 === 0 ? `₦${m}M` : `₦${m.toFixed(1)}M`;
  }
  if (value >= 1_000) {
    const k = value / 1_000;
    return k % 1 === 0 ? `₦${k}K` : `₦${k.toFixed(1)}K`;
  }
  return `₦${value}`;
}

function formatPrice(
  price_min: number | null,
  price_max: number | null,
): string | null {
  if (!price_min && !price_max) return null;
  if (price_min && price_max) return `${formatCompactPrice(price_min)} – ${formatCompactPrice(price_max)}`;
  if (price_min) return formatCompactPrice(price_min);
  return formatCompactPrice(price_max!);
}

function buildTooltipHTML(job: NearbyJob): string {
  return buildTooltipHTMLWithStyle(job, "compact");
}

function buildTooltipHTMLWithStyle(job: NearbyJob, style: TooltipStyle): string {
  const price = formatPrice(job.price_min, job.price_max);

  if (style === "detailed") {
    return `
      <div style="font-family:var(--font-inter,system-ui,sans-serif);max-width:280px;min-width:200px;">
        <div style="padding:16px 18px 12px;">
          <p style="font-weight:600;font-size:15px;margin:0 0 8px;color:var(--foreground,#0e0f0c);line-height:1.3;letter-spacing:-0.01em;">
            ${job.title}
          </p>
          ${price ? `<p style="font-size:14px;margin:0;color:var(--primary,#5E3AFF);font-weight:700;">${price}</p>` : ""}
          ${job.location_name ? `<p style="font-size:12px;margin:10px 0 0;color:var(--muted-foreground,#454745);">${job.location_name}</p>` : ""}
        </div>
        <div style="border-top:1px solid var(--border,#d4d7d2);padding:12px 18px;display:flex;align-items:center;justify-content:space-between;gap:12px;">
          <span style="font-size:11px;color:var(--muted-foreground,#454745);">Synk Bounty</span>
          <a href="/bounties/${job.id}" style="font-size:12px;font-weight:600;color:var(--primary,#5E3AFF);text-decoration:none;display:inline-flex;align-items:center;gap:4px;">
            View Details →
          </a>
        </div>
      </div>
    `;
  }

  return `
    <div style="font-family:var(--font-inter,system-ui,sans-serif);max-width:240px;min-width:180px;">
      <div style="padding:14px 16px 8px;">
        <p style="font-weight:600;font-size:14px;margin:0 0 6px;color:var(--foreground,#0e0f0c);line-height:1.3;letter-spacing:-0.01em;">
          ${job.title}
        </p>
        ${price ? `<p style="font-size:13px;margin:0;color:var(--primary,#5E3AFF);font-weight:700;">${price}</p>` : ""}
        ${job.location_name ? `<p style="font-size:12px;margin:8px 0 0;color:var(--muted-foreground,#454745);">${job.location_name}</p>` : ""}
      </div>
      <div style="border-top:1px solid var(--border,#d4d7d2);padding:10px 16px;">
        <a href="/bounties/${job.id}" style="font-size:12px;font-weight:600;color:var(--primary,#5E3AFF);text-decoration:none;display:inline-flex;align-items:center;gap:4px;">
          View Details →
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
  tooltipStyle?: TooltipStyle;
}

function buildMarkerLabel(job: NearbyJob): HTMLDivElement {
  const price = formatPrice(job.price_min, job.price_max);

  const el = document.createElement("div");
  el.style.cssText =
    "display:flex;flex-direction:column;align-items:center;cursor:pointer;user-select:none;filter:drop-shadow(0 6px 12px rgba(0,0,0,0.12));transform:translateY(-50%);transition:transform 0.18s ease, filter 0.18s ease;";
  el.innerHTML = `
    <div data-marker-pill="true" style="background:var(--primary,#5E3AFF);color:var(--primary-foreground,#FFFFFF);padding:5px 10px;border-radius:8px;font-size:12px;font-weight:600;line-height:1.3;text-align:center;white-space:nowrap;max-width:180px;box-shadow:inset 0 0 0 1px rgba(255,255,255,0.14);">
      <span style="overflow:hidden;text-overflow:ellipsis;max-width:180px;display:inline-block;vertical-align:middle;">${job.title}</span>
      ${price ? ` · <span style="font-weight:500;opacity:0.9;">${price}</span>` : ""}
    </div>
    <div data-marker-pointer="true" style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:5px solid var(--primary,#5E3AFF);"></div>
  `;
  return el;
}

function applyMarkerState(label: HTMLDivElement, state: "default" | "hover" | "active") {
  const pill = label.querySelector("[data-marker-pill]") as HTMLDivElement | null;
  const pointer = label.querySelector("[data-marker-pointer]") as HTMLDivElement | null;
  if (!pill || !pointer) return;

  if (state === "active") {
    label.style.transform = "translateY(-52%) scale(1.03)";
    label.style.filter = "drop-shadow(0 10px 18px rgba(0,0,0,0.2))";
    label.style.zIndex = "20";
    pill.style.background = "var(--primary-hover,#7B61FF)";
    pointer.style.borderTopColor = "var(--primary-hover,#7B61FF)";
    return;
  }

  if (state === "hover") {
    label.style.transform = "translateY(-52%) scale(1.01)";
    label.style.filter = "drop-shadow(0 8px 14px rgba(0,0,0,0.18))";
    label.style.zIndex = "10";
    pill.style.background = "var(--primary,#5E3AFF)";
    pointer.style.borderTopColor = "var(--primary,#5E3AFF)";
    return;
  }

  label.style.transform = "translateY(-50%)";
  label.style.filter = "drop-shadow(0 6px 12px rgba(0,0,0,0.12))";
  label.style.zIndex = "1";
  pill.style.background = "var(--primary,#5E3AFF)";
  pointer.style.borderTopColor = "var(--primary,#5E3AFF)";
}

export default function NearbyJobsMap({ compact, flush, tooltipStyle = "compact" }: NearbyJobsMapProps) {
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
        const { AdvancedMarkerElement } = await g.maps.importLibrary("marker");

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
        });

        const isHoverDevice = window.matchMedia("(hover: hover)").matches;
        let tooltipTimeout: ReturnType<typeof setTimeout> | null = null;

        const infoWindow = new g.maps.InfoWindow({
          pixelOffset: new g.maps.Size(0, -8),
        });

        const bounds = new g.maps.LatLngBounds();
        let hasMarkers = false;

        const GROUP_THRESHOLD = 0.0002;
        const OFFSET_STEP = 0.00015;

        const bountiesCopy = [...bounties];
        const groups: { jobs: NearbyJob[]; lat: number; lng: number }[] = [];

        while (bountiesCopy.length) {
          const job = bountiesCopy.shift()!;
          if (!job.latitude || !job.longitude) continue;
          let added = false;
          for (const g of groups) {
            if (Math.abs(g.lat - job.latitude) < GROUP_THRESHOLD && Math.abs(g.lng - job.longitude) < GROUP_THRESHOLD) {
              g.jobs.push(job);
              added = true;
              break;
            }
          }
          if (!added) {
            groups.push({ jobs: [job], lat: job.latitude, lng: job.longitude });
          }
        }

        groups.forEach((group) => {
          const anchorLat = group.lat;
          const anchorLng = group.lng;
          bounds.extend(new g.maps.LatLng(anchorLat, anchorLng));

          group.jobs.forEach((job, idx) => {
            const angle = idx === 0 ? 0 : (idx % 2 === 0 ? -45 : 45);
            const rad = (angle * Math.PI) / 180;
            const tier = Math.ceil(idx / 2);
            const dist = OFFSET_STEP * (tier + 1);
            const offsetLat = anchorLat + Math.cos(rad) * dist;
            const offsetLng = anchorLng + Math.sin(rad) * dist;

            const position = new g.maps.LatLng(offsetLat, offsetLng);

            const label = buildMarkerLabel(job);

            const marker = new AdvancedMarkerElement({
              map,
              position,
              title: job.title,
              content: label,
            });

            const html = buildTooltipHTML(job);

            if (isHoverDevice) {
              label.addEventListener("mouseenter", () => {
                if (tooltipTimeout) clearTimeout(tooltipTimeout);
                applyMarkerState(label, "hover");
                infoWindow.setContent(html);
                infoWindow.open({ map, anchor: marker });
              });

              label.addEventListener("mouseleave", () => {
                tooltipTimeout = setTimeout(() => {
                  infoWindow.close();
                  applyMarkerState(label, "default");
                }, 200);
              });
            }

            marker.addListener("click", () => {
              router.push(`/bounties/${job.id}`);
            });

            hasMarkers = true;
          });
        });

        if (hasMarkers) {
          if (coords) bounds.extend(new g.maps.LatLng(coords.lat, coords.lng));
          map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
        }

        if (coords) {
          const dot = document.createElement("div");
          dot.style.cssText =
            "width:18px;height:18px;border-radius:50%;background:#000;border:3px solid #fff;animation:ping-location 2s infinite;";

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
