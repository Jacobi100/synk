"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { VoiceInput } from "@/components/voice/VoiceInput";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import type { RestructureResult } from "@/components/voice/VoiceInput";
import { COPY } from "@/lib/copy";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ListingPreview {
  title:               string;
  category:            string;
  description:         string;
  tags:                string[];
  priceMin:            number;
  priceMax:            number;
  confidence:          number;
  transcript:          string;
  detectedLanguage?:   string;
  neighbourhoodLabel?: string;
  coordinates?:        { lat: number; lng: number };
}

type PageState = "idle" | "recording" | "processing" | "preview" | "saving" | "success" | "error";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CreateListingPage() {
  const router = useRouter();

  const [state, setState]       = useState<PageState>("idle");
  const [preview, setPreview]   = useState<ListingPreview | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [coords, setCoords]     = useState<{ lat: number; lng: number } | undefined>();

  // Editable fields
  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory]       = useState("");
  const [priceMin, setPriceMin]       = useState(0);
  const [priceMax, setPriceMax]       = useState(0);

  // Get coordinates on mount
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      ()    => setCoords(undefined),
      { timeout: 5000 }
    );
  }, []);

  // Populate editable fields when preview loads
  useEffect(() => {
    if (!preview) return;
    setTitle(preview.title);
    setDescription(preview.description);
    setCategory(preview.category);
    setPriceMin(preview.priceMin);
    setPriceMax(preview.priceMax);
  }, [preview]);

  // -------------------------------------------------------------------------
  // VoiceInput result handler
  // -------------------------------------------------------------------------

  function handleResult(result: RestructureResult) {
    setPreview({
      title:               result.listing.title,
      category:            result.listing.category,
      description:         result.listing.description,
      tags:                result.listing.tags,
      priceMin:            result.listing.priceRange.minPrice,
      priceMax:            result.listing.priceRange.maxPrice,
      confidence:          result.listing.confidence,
      transcript:          result.transcript,
      detectedLanguage:    result.detectedLanguage,
      neighbourhoodLabel:  result.neighbourhoodLabel,
      coordinates:         result.coordinates,
    });
    setState("preview");
  }

  // -------------------------------------------------------------------------
  // Save to bounties
  // -------------------------------------------------------------------------

  async function handleSave() {
    if (!preview) return;

    if (!title.trim())       { setErrorMsg("Please add a title.");                              return; }
    if (priceMin <= 0)       { setErrorMsg("Please enter a minimum price.");                    return; }
    if (priceMax < priceMin) { setErrorMsg("Maximum price must be greater than minimum.");      return; }

    setState("saving");
    setErrorMsg("");

    try {
      const res = await fetch("/api/bounties/create", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:            title.trim(),
          description:      description.trim(),
          category,
          price_min:        priceMin,
          price_max:        priceMax,
          currency:         "NGN",
          price_negotiable: true,
          latitude:         preview.coordinates?.lat  ?? null,
          longitude:        preview.coordinates?.lng  ?? null,
          location_name:    preview.neighbourhoodLabel ?? "",
          urgency:          "flexible",
          slots_available:  1,
          status:           "open",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message ?? "Failed to post listing.");
      }

      setState("success");
      setTimeout(() => router.push("/dashboard"), 1500);

    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setState("error");
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 max-w-lg mx-auto">

      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-[var(--violet)]"
        style={{ color: "var(--text2)" }}
      >
        <ArrowLeftIcon className="h-4 w-4" /> {COPY.BACK_TO_FEED}
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{COPY.CREATE_JOB.TITLE}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {COPY.CREATE_JOB.SUBTITLE}
        </p>
      </div>

      {/* IDLE / RECORDING — show VoiceInput */}
      {(state === "idle" || state === "recording") && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-4 text-center">
            {COPY.CREATE_JOB.MIC_INSTRUCTION}
          </p>
          <VoiceInput
            onTranscript={() => setState("processing")}
            onResult={handleResult}
            coordinates={coords}
          />
          <p className="text-xs text-gray-400 text-center mt-2">
            {COPY.CREATE_JOB.LANGUAGE_SUPPORT}
          </p>
        </div>
      )}

      {/* PROCESSING */}
      {state === "processing" && (
        <div className="bg-white rounded-2xl shadow-sm p-10 flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">{COPY.CREATE_JOB.PROCESSING}</p>
        </div>
      )}

      {/* PREVIEW */}
      {state === "preview" && preview && (
        <div className="space-y-4">

          {/* Low confidence warning */}
          {preview.confidence < 0.5 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-yellow-800 text-sm font-medium">
                {COPY.CREATE_JOB.LOW_CONFIDENCE}
              </p>
            </div>
          )}

          {/* What we heard */}
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs text-blue-500 font-medium mb-1 uppercase tracking-wide">
              {COPY.CREATE_JOB.WHAT_WE_HEARD} {preview.detectedLanguage ? `· ${preview.detectedLanguage}` : ""}
            </p>
            <p className="text-sm text-blue-900 italic">"{preview.transcript}"</p>
          </div>

          {/* Editable fields */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">

            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Category</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Min Price (₦)</label>
                <input
                  type="number"
                  value={priceMin}
                  onChange={(e) => setPriceMin(Number(e.target.value))}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Max Price (₦)</label>
                <input
                  type="number"
                  value={priceMax}
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Location */}
            {preview.neighbourhoodLabel && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>📍</span>
                <span>{preview.neighbourhoodLabel}</span>
              </div>
            )}

            {/* Tags */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tags</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {preview.tags.map((tag) => (
                  <span key={tag} className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-sm">{errorMsg}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pb-8">
            <button
              onClick={() => { setState("idle"); setPreview(null); setErrorMsg(""); }}
              className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              {COPY.CREATE_JOB.RECORD_AGAIN}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 rounded-xl py-3 text-sm font-medium text-white hover:bg-blue-700 transition"
            >
              {COPY.CREATE_JOB.POST_LISTING}
            </button>
          </div>
        </div>
      )}

      {/* SAVING */}
      {state === "saving" && (
        <div className="bg-white rounded-2xl shadow-sm p-10 flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">{COPY.CREATE_JOB.POSTING}</p>
        </div>
      )}

      {/* SUCCESS */}
      {state === "success" && (
        <div className="bg-white rounded-2xl shadow-sm p-10 flex flex-col items-center gap-4">
          <div className="text-5xl">✅</div>
          <p className="text-gray-800 font-semibold">{COPY.CREATE_JOB.SUCCESS}</p>
          <p className="text-gray-400 text-sm">Taking you back...</p>{/* COPY.CREATE_JOB.REDIRECTING — key missing */}
        </div>
      )}

      {/* ERROR without preview */}
      {state === "error" && !preview && (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-600 text-sm">{errorMsg || "Something went wrong."}{/* COPY.CREATE_JOB.ERROR_GENERIC — key missing */}</p>
          </div>
          <button
            onClick={() => { setState("idle"); setErrorMsg(""); }}
            className="w-full border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            {COPY.CREATE_JOB.TRY_AGAIN}
          </button>
        </div>
      )}

    </div>
  );
}