"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Bounty, CreateBountyInput } from "@/lib/types/bounty";
import { Loader2, MapPin, Calendar, Sparkles } from "lucide-react";

interface BountyFormProps {
  bounty?: Bounty;
  onSubmit?: (data: CreateBountyInput) => void;
}

const CATEGORIES = [
  "Web Development",
  "Mobile Development",
  "Design",
  "Writing",
  "Translation",
  "Data Entry",
  "Virtual Assistance",
  "Marketing",
  "Business",
  "Other",
];

const URGENCY_OPTIONS = [
  { value: "asap", label: "ASAP" },
  { value: "scheduled", label: "Scheduled" },
  { value: "flexible", label: "Flexible" },
];

export function BountyForm({ bounty, onSubmit }: BountyFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [suggest, setSuggest] = useState<{ avg: number | null; suggested_min: number | null; suggested_max: number | null } | null>(null);

  const [formData, setFormData] = useState<CreateBountyInput>({
    title: bounty?.title || "",
    description: bounty?.description || "",
    category: bounty?.category || "",
    latitude: bounty?.latitude || 6.5244,
    longitude: bounty?.longitude || 3.3792,
    location_name: bounty?.location_name || "Lagos, Nigeria",
    radius_km: bounty?.radius_km || 1,
    price_min: bounty?.price_min ?? null,
    price_max: bounty?.price_max ?? null,
    currency: "NGN",
    price_negotiable: bounty?.price_negotiable ?? true,
    images: bounty?.images || null,
    deadline: bounty?.deadline || null,
    urgency: bounty?.urgency || "flexible",
    slots_available: bounty?.slots_available || 1,
  });

  const fetchSuggestion = useCallback(async () => {
    if (!formData.category || !formData.latitude || !formData.longitude) return;
    try {
      const u = new URL("/api/ai/suggest-price", window.location.origin);
      u.searchParams.set("category", formData.category);
      u.searchParams.set("latitude", String(formData.latitude));
      u.searchParams.set("longitude", String(formData.longitude));
      const res = await fetch(u.toString());
      if (!res.ok) return;
      setSuggest(await res.json());
    } catch {
      setSuggest(null);
    }
  }, [formData.category, formData.latitude, formData.longitude]);

  useEffect(() => {
    void fetchSuggestion();
  }, [fetchSuggestion]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value ? parseFloat(value) : null,
    }));
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let location_name = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } },
          );
          if (res.ok) {
            const data = await res.json();
            const { city, town, village, suburb, state, country } = data.address ?? {};
            const locality = city || town || village || suburb;
            location_name = [locality, state, country].filter(Boolean).join(", ");
          }
        } catch {
          /* keep coordinates label */
        }
        setFormData((prev) => ({ ...prev, latitude, longitude, location_name }));
        setLocating(false);
      },
      () => {
        setError("Unable to retrieve your location. Please check your browser permissions.");
        setLocating(false);
      },
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (onSubmit) {
        onSubmit(formData);
        return;
      }

      if (bounty) {
        const response = await fetch(`/api/bounties/${bounty.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to save bounty");
        }
        router.push("/dashboard");
        return;
      }

      const fd = new FormData();
      fd.append("title", formData.title);
      fd.append("description", formData.description || "");
      fd.append("category", formData.category);
      fd.append("latitude", String(formData.latitude));
      fd.append("longitude", String(formData.longitude));
      fd.append("location_name", formData.location_name || "");
      fd.append("radius_km", String(formData.radius_km));
      if (formData.price_min != null) fd.append("price_min", String(formData.price_min));
      if (formData.price_max != null) fd.append("price_max", String(formData.price_max));
      fd.append("currency", formData.currency);
      fd.append("price_negotiable", formData.price_negotiable ? "true" : "false");
      if (formData.deadline) fd.append("deadline", formData.deadline);
      fd.append("urgency", formData.urgency);
      fd.append("slots_available", String(formData.slots_available));
      imageFiles.forEach((f) => fd.append("images", f));

      const response = await fetch("/api/bounties/create", {
        method: "POST",
        body: fd,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to post bounty");
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">{error}</div>
      )}

      {suggest?.suggested_min != null && suggest.suggested_max != null && (
        <div className="flex items-start gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <span className="font-semibold">Suggested price (area + category): </span>
            ₦{suggest.suggested_min.toLocaleString("en-NG")} – ₦{suggest.suggested_max.toLocaleString("en-NG")}
            {suggest.avg != null && (
              <span className="text-violet-700"> (avg ₦{Math.round(suggest.avg).toLocaleString("en-NG")})</span>
            )}
          </div>
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-900">Bounty title *</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="What do you need done?"
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-900">Description</label>
        <textarea
          name="description"
          value={formData.description || ""}
          onChange={handleChange}
          placeholder="Provide detailed information..."
          rows={5}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-900">Category *</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">Select a category</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-900">Photos (optional)</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
          className="w-full text-sm text-gray-600"
        />
        {imageFiles.length > 0 && (
          <p className="mt-1 text-xs text-gray-500">{imageFiles.length} file(s) selected</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900">
            <MapPin className="mr-1 inline h-4 w-4" />
            Location name
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="location_name"
              value={formData.location_name || ""}
              onChange={handleChange}
              placeholder="e.g., Yaba, Lagos"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={locating}
              title="Use my location"
              className="flex shrink-0 items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              {locating ? "…" : "GPS"}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}
          </p>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900">Radius (km)</label>
          <input
            type="number"
            name="radius_km"
            value={formData.radius_km}
            onChange={handleNumberChange}
            min={1}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-900">Pricing (NGN)</label>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-gray-600">Min</label>
            <input
              type="number"
              name="price_min"
              value={formData.price_min ?? ""}
              onChange={handleNumberChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600">Max</label>
            <input
              type="number"
              name="price_max"
              value={formData.price_max ?? ""}
              onChange={handleNumberChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
        <label className="mt-3 flex items-center text-sm">
          <input
            type="checkbox"
            name="price_negotiable"
            checked={formData.price_negotiable}
            onChange={handleChange}
            className="h-4 w-4 rounded text-blue-600"
          />
          <span className="ml-2 text-gray-700">Price is negotiable</span>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900">
            <Calendar className="mr-1 inline h-4 w-4" />
            Deadline
          </label>
          <input
            type="datetime-local"
            name="deadline"
            value={formData.deadline || ""}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900">Urgency *</label>
          <select
            name="urgency"
            value={formData.urgency}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {URGENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-900">Slots available</label>
        <input
          type="number"
          name="slots_available"
          value={formData.slots_available}
          onChange={handleNumberChange}
          min={1}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white hover:bg-blue-700">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {bounty ? "Update bounty" : "Post bounty"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} className="px-6">
          Cancel
        </Button>
      </div>
    </form>
  );
}
