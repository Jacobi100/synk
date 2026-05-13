import { supabaseAdmin } from "@/lib/supabase/server";

export type CreateBountyPayload = {
  title: string;
  description: string | null;
  category: string;
  latitude: number;
  longitude: number;
  location_name: string | null;
  radius_km: number;
  price_min: number | null;
  price_max: number | null;
  currency: string;
  price_negotiable: boolean;
  deadline: string | null;
  urgency: "asap" | "scheduled" | "flexible";
  slots_available: number;
};

function parseNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseBool(v: unknown, defaultVal: boolean): boolean {
  if (v === null || v === undefined) return defaultVal;
  if (typeof v === "boolean") return v;
  if (v === "true" || v === "on" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  return defaultVal;
}

export function parseCreateBountyFromJson(body: Record<string, unknown>): CreateBountyPayload {
  const urgency = (body.urgency as string) || "flexible";
  return {
    title: String(body.title ?? "").trim(),
    description: body.description != null ? String(body.description) : null,
    category: String(body.category ?? "").trim(),
    latitude: Number(body.latitude),
    longitude: Number(body.longitude),
    location_name: body.location_name != null ? String(body.location_name) : null,
    radius_km: parseNum(body.radius_km) ?? 1,
    price_min: parseNum(body.price_min),
    price_max: parseNum(body.price_max),
    currency: String(body.currency ?? "NGN"),
    price_negotiable: parseBool(body.price_negotiable, true),
    deadline: body.deadline != null && String(body.deadline) !== "" ? String(body.deadline) : null,
    urgency: urgency === "asap" || urgency === "scheduled" || urgency === "flexible" ? urgency : "flexible",
    slots_available: Math.max(1, Math.floor(parseNum(body.slots_available) ?? 1)),
  };
}

export function parseCreateBountyFromFormData(fd: FormData): CreateBountyPayload {
  const obj: Record<string, unknown> = {};
  fd.forEach((value, key) => {
    if (key === "images") return;
    obj[key] = value;
  });
  return parseCreateBountyFromJson(obj);
}

async function uploadBountyImages(profileId: string, files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const ext = (file.name.split(".").pop() || "bin").replace(/[^a-zA-Z0-9]/g, "") || "bin";
    const path = `${profileId}/${crypto.randomUUID()}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    const { error } = await supabaseAdmin.storage.from("bounty-images").upload(path, buf, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (error) throw new Error(`Image upload failed: ${error.message}`);
    const { data } = supabaseAdmin.storage.from("bounty-images").getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}

export async function createBountyWithAdmin(
  clerkUserId: string,
  payload: CreateBountyPayload,
  files: File[],
): Promise<{ bounty: Record<string, unknown> }> {
  if (!payload.title || !payload.category) {
    throw new Error("Title and category are required");
  }
  if (!Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude)) {
    throw new Error("Valid latitude and longitude are required");
  }

  const { data: profile, error: pErr } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("clerk_id", clerkUserId)
    .single();

  if (pErr || !profile) throw new Error("Profile not found");

  const imageUrls = files.length > 0 ? await uploadBountyImages(profile.id as string, files) : [];

  const row = {
    poster_id: profile.id,
    title: payload.title,
    description: payload.description,
    category: payload.category,
    latitude: payload.latitude,
    longitude: payload.longitude,
    location_name: payload.location_name,
    radius_km: payload.radius_km,
    price_min: payload.price_min,
    price_max: payload.price_max,
    currency: payload.currency,
    price_negotiable: payload.price_negotiable,
    images: imageUrls.length ? imageUrls : null,
    deadline: payload.deadline,
    urgency: payload.urgency,
    slots_available: payload.slots_available,
    status: "open",
  };

  const { data: bounty, error } = await supabaseAdmin.from("bounties").insert(row).select().single();

  if (error) throw new Error(error.message);
  return { bounty: bounty as Record<string, unknown> };
}
