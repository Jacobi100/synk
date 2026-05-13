import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  createBountyWithAdmin,
  parseCreateBountyFromFormData,
  parseCreateBountyFromJson,
} from "@/lib/bounty/server-create";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";
    let payload;
    let files: File[] = [];

    if (contentType.includes("multipart/form-data")) {
      const fd = await request.formData();
      payload = parseCreateBountyFromFormData(fd);
      const maybeFiles = fd.getAll("images");
      files = maybeFiles.filter((f): f is File => f instanceof File && f.size > 0);
    } else {
      const body = (await request.json()) as Record<string, unknown>;
      payload = parseCreateBountyFromJson(body);
    }

    const { bounty } = await createBountyWithAdmin(userId, payload, files);
    return NextResponse.json(bounty, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status =
      message === "Unauthorized" ? 401 : message.includes("Profile not found") ? 400 : 500;
    console.error("Create bounty error:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
