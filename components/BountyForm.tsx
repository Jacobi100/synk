"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Bounty, CreateBountyInput } from "@/lib/types/bounty";
import { ArrowPathIcon, MapPinIcon, CalendarDaysIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { COPY } from "@/lib/copy";
import { Button } from "@/components/ui/button";

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

const inputBase =
  "w-full rounded-[12px] border border-foreground bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-mute";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-sm font-semibold text-foreground">
      {children}
    </label>
  );
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-border" />
      <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-mute">
        {title}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

export function BountyForm({ bounty, onSubmit }: BountyFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [suggest, setSuggest] = useState<{
    avg: number | null;
    suggested_min: number | null;
    suggested_max: number | null;
  } | null>(null);

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
    } catch { setSuggest(null); }
  }, [formData.category, formData.latitude, formData.longitude]);

  useEffect(() => { void fetchSuggestion(); }, [fetchSuggestion]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value ? parseFloat(value) : null }));
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) { setError("Geolocation not supported."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let location_name = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } },
          );
          if (res.ok) {
            const d = await res.json();
            const { city, town, village, suburb, state, country } = d.address ?? {};
            const loc = city || town || village || suburb;
            location_name = [loc, state, country].filter(Boolean).join(", ");
          }
        } catch { /* keep coords */ }
        setFormData((prev) => ({ ...prev, latitude, longitude, location_name }));
        setLocating(false);
      },
      () => { setError("Unable to get location."); setLocating(false); },
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (onSubmit) { onSubmit(formData); return; }

      if (bounty) {
        const res = await fetch(`/api/bounties/${bounty.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
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

      const res = await fetch("/api/bounties/create", { method: "POST", body: fd });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Failed"); }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* AI suggestion */}
      {suggest?.suggested_min != null && suggest.suggested_max != null && (
        <div className="flex items-start gap-3 rounded-[24px] bg-[var(--primary-pale)] p-4 text-sm text-foreground">
          <SparklesIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            {COPY.BOUNTY_FORM.PRICE_SUGGESTION(
              suggest.suggested_min.toLocaleString("en-NG"),
              suggest.suggested_max.toLocaleString("en-NG")
            )}
            {suggest.avg != null && (
              <span className="opacity-70"> {COPY.BOUNTY_FORM.PRICE_AVERAGE(Math.round(suggest.avg).toLocaleString("en-NG"))}</span>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-[24px] bg-[var(--negative)]/10 p-4 text-sm text-[var(--negative)]">
          {error}
        </div>
      )}

      <SectionDivider title="Basic info" />

      {/* Title */}
      <div>
        <FieldLabel>{COPY.BOUNTY_FORM.FIELD_TITLE}</FieldLabel>
        <input
          type="text" name="title" value={formData.title} onChange={handleChange} required
          placeholder="What do you need done?"
          className={`${inputBase} focus:shadow-[0_0_0_2px_var(--ring)]`}
        />
      </div>

      {/* Description */}
      <div>
        <FieldLabel>{COPY.BOUNTY_FORM.FIELD_DESCRIPTION}</FieldLabel>
        <textarea
          name="description" value={formData.description || ""} onChange={handleChange}
          placeholder="Provide detailed information about the task, requirements, and expectations…"
          rows={5} className={`${inputBase} focus:shadow-[0_0_0_2px_var(--ring)]`}
        />
      </div>

      {/* Category */}
      <div>
        <FieldLabel>{COPY.BOUNTY_FORM.FIELD_CATEGORY}</FieldLabel>
        <select
          name="category" value={formData.category} onChange={handleChange} required
          className={`${inputBase} focus:shadow-[0_0_0_2px_var(--ring)]`}
        >
          <option value="">Select a category</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Photos */}
      <div>
        <FieldLabel>{COPY.BOUNTY_FORM.FIELD_IMAGES}</FieldLabel>
        <div className="rounded-[12px] border border-dashed border-foreground/30 px-4 py-3 text-sm transition-colors hover:border-primary">
          <input
            type="file" accept="image/*" multiple
            onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
            className="w-full cursor-pointer"
          />
          {imageFiles.length > 0 && (
            <p className="mt-1 text-xs text-primary">
              {imageFiles.length} file{imageFiles.length !== 1 ? "s" : ""} selected
            </p>
          )}
        </div>
      </div>

      <SectionDivider title="Location" />

      {/* Location + Radius */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <FieldLabel>
            <MapPinIcon className="mr-1 inline h-3.5 w-3.5 text-mute" />
            {COPY.BOUNTY_FORM.FIELD_LOCATION}
          </FieldLabel>
          <div className="flex gap-2">
            <input
              type="text" name="location_name" value={formData.location_name || ""}
              onChange={handleChange} placeholder="e.g., Yaba, Lagos"
              className={`${inputBase} flex-1 focus:shadow-[0_0_0_2px_var(--ring)]`}
            />
            <button
              type="button" onClick={handleUseMyLocation} disabled={locating}
              className="flex shrink-0 items-center gap-1.5 rounded-[12px] border border-foreground bg-background px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
            >
              {locating ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <MapPinIcon className="h-4 w-4" />}
              {locating ? "" : "GPS"}
            </button>
          </div>
          <p className="mt-1 font-mono text-[11px] text-mute">
            {formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}
          </p>
        </div>
        <div>
          <FieldLabel>Radius (km)</FieldLabel>
          <input
            type="number" name="radius_km" value={formData.radius_km}
            onChange={handleNumberChange} min={1}
            className={`${inputBase} focus:shadow-[0_0_0_2px_var(--ring)]`}
          />
        </div>
      </div>

      <SectionDivider title="Pricing" />

      <div>
        <FieldLabel>{COPY.BOUNTY_FORM.FIELD_PRICE}</FieldLabel>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Minimum</label>
            <input
              type="number" name="price_min" value={formData.price_min ?? ""}
              onChange={handleNumberChange} placeholder="0"
              className={`${inputBase} focus:shadow-[0_0_0_2px_var(--ring)]`}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Maximum</label>
            <input
              type="number" name="price_max" value={formData.price_max ?? ""}
              onChange={handleNumberChange} placeholder="0"
              className={`${inputBase} focus:shadow-[0_0_0_2px_var(--ring)]`}
            />
          </div>
        </div>
        <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
          <input
            type="checkbox" name="price_negotiable" checked={formData.price_negotiable}
            onChange={handleChange}
            className="h-4 w-4 rounded accent-primary"
          />
          {COPY.BOUNTY_FORM.FIELD_NEGOTIABLE}
        </label>
      </div>

      <SectionDivider title="Schedule" />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <FieldLabel>
            <CalendarDaysIcon className="mr-1 inline h-3.5 w-3.5 text-mute" />
            {COPY.BOUNTY_FORM.FIELD_DEADLINE}
          </FieldLabel>
          <input
            type="datetime-local" name="deadline" value={formData.deadline || ""}
            onChange={handleChange}
            className={`${inputBase} focus:shadow-[0_0_0_2px_var(--ring)]`}
          />
        </div>
        <div>
          <FieldLabel>{COPY.BOUNTY_FORM.FIELD_URGENCY}</FieldLabel>
          <select
            name="urgency" value={formData.urgency} onChange={handleChange}
            className={`${inputBase} focus:shadow-[0_0_0_2px_var(--ring)]`}
          >
            {URGENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <FieldLabel>{COPY.BOUNTY_FORM.FIELD_SLOTS}</FieldLabel>
        <input
          type="number" name="slots_available" value={formData.slots_available}
          onChange={handleNumberChange} min={1}
          className={`${inputBase} max-w-[10rem] focus:shadow-[0_0_0_2px_var(--ring)]`}
        />
        <p className="mt-1 text-xs text-mute">
          How many providers can be selected for this bounty.
        </p>
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
          {bounty ? "Update bounty" : "Post bounty"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
