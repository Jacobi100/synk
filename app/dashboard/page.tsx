"use client";

import { useCallback, useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { BountyCard } from "@/components/BountyCard";
import { Button } from "@/components/ui/button";
import type { BountyFeedItem } from "@/lib/types/bounty";
import Link from "next/link";
import { Loader2, MapPin, RefreshCw } from "lucide-react";

export default function DashboardPage() {
  const [items, setItems] = useState<BountyFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const loadFeed = useCallback(async (lat?: number, lng?: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (lat !== undefined && lng !== undefined) {
        params.append("lat", lat.toString());
        params.append("lng", lng.toString());
      }
      const res = await fetch(`/api/bounties/feed?${params}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to load feed");
      }
      const data = await res.json();
      setItems(data.bounties as BountyFeedItem[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load all bounties initially
    void loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    if (!coords) return;
    // Reload with location if coords are available
    void loadFeed(coords.lat, coords.lng);
  }, [coords, loadFeed]);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError("Unable to read location. Allow location or try again.");
        setLocating(false);
      },
    );
  };

  useEffect(() => {
    // Load all bounties on mount
    void loadFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot on mount
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Available bounties</h1>
            <p className="mt-1 text-gray-600">
              Open tasks from all locations, with suggested pricing when location is available.
            </p>
            {coords && (
              <p className="mt-2 text-xs text-gray-500">
                <MapPin className="mb-0.5 mr-1 inline h-3 w-3" />
                {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={locating} onClick={useMyLocation}>
              {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-2">Refresh location</span>
            </Button>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/bounties/create">Post a bounty</Link>
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <p className="text-gray-600">No open bounties available right now.</p>
            <Button asChild className="mt-6 bg-blue-600 hover:bg-blue-700">
              <Link href="/bounties/create">Post the first one</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((b) => (
              <BountyCard key={b.id} bounty={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
