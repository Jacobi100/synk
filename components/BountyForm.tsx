"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Bounty, CreateBountyInput } from "@/lib/types/bounty";
import { Loader2, MapPin, Calendar } from "lucide-react";

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

  const [formData, setFormData] = useState<CreateBountyInput>({
    title: bounty?.title || "",
    description: bounty?.description || "",
    category: bounty?.category || "",
    latitude: bounty?.latitude || 6.5244,
    longitude: bounty?.longitude || 3.3792,
    location_name: bounty?.location_name || "Lagos, Nigeria",
    radius_km: bounty?.radius_km || 1,
    price_min: bounty?.price_min || null,
    price_max: bounty?.price_max || null,
    currency: bounty?.currency || "NGN",
    price_negotiable: bounty?.price_negotiable ?? true,
    images: bounty?.images || null,
    deadline: bounty?.deadline || null,
    urgency: bounty?.urgency || "flexible",
    slots_available: bounty?.slots_available || 1,
    status: bounty?.status || "open",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value ? parseFloat(value) : null,
    }));
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

      const url = bounty ? `/api/bounties/${bounty.id}` : "/api/bounties";
      const method = bounty ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save bounty");
      }

      router.push("/bounty/browse");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Bounty Title *
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="What do you need done?"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description || ""}
          onChange={handleChange}
          placeholder="Provide detailed information about what you need..."
          rows={5}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Category *
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a category</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            <MapPin className="inline w-4 h-4 mr-1" />
            Location Name
          </label>
          <input
            type="text"
            name="location_name"
            value={formData.location_name || ""}
            onChange={handleChange}
            placeholder="e.g., Yaba, Lagos"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Radius (km)
          </label>
          <input
            type="number"
            name="radius_km"
            value={formData.radius_km}
            onChange={handleNumberChange}
            min="1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Pricing */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Pricing
        </label>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Min Price
            </label>
            <input
              type="number"
              name="price_min"
              value={formData.price_min || ""}
              onChange={handleNumberChange}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Max Price
            </label>
            <input
              type="number"
              name="price_max"
              value={formData.price_max || ""}
              onChange={handleNumberChange}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Currency</label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="NGN">NGN</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>
        <label className="flex items-center mt-3 text-sm">
          <input
            type="checkbox"
            name="price_negotiable"
            checked={formData.price_negotiable}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="ml-2 text-gray-700">Price is negotiable</span>
        </label>
      </div>

      {/* Timeline */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            <Calendar className="inline w-4 h-4 mr-1" />
            Deadline
          </label>
          <input
            type="datetime-local"
            name="deadline"
            value={formData.deadline || ""}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Urgency *
          </label>
          <select
            name="urgency"
            value={formData.urgency}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {URGENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Slots */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Available Slots
        </label>
        <input
          type="number"
          name="slots_available"
          value={formData.slots_available}
          onChange={handleNumberChange}
          min="1"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {bounty ? "Update Bounty" : "Post Bounty"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="px-6"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
