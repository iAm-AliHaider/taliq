import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

// File upload endpoint for expense receipts, claim documents, etc.
// In production, replace with S3/Vercel Blob. This uses /tmp for serverless.

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string || "receipt";
    const refId = formData.get("refId") as string || "unknown";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Allowed: JPG, PNG, WebP, PDF" }, { status: 400 });
    }

    // Generate filename
    const ext = file.name.split(".").pop() || "bin";
    const filename = `${type}_${refId}_${Date.now()}.${ext}`;

    // Save to /tmp (serverless) — in production use S3/Vercel Blob
    const uploadDir = join("/tmp", "taliq-uploads");
    await mkdir(uploadDir, { recursive: true });
    const filepath = join(uploadDir, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    return NextResponse.json({
      ok: true,
      filename,
      url: `/api/upload?file=${filename}`,
      size: file.size,
      type: file.type,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("file");

  if (!filename) {
    return NextResponse.json({ error: "No filename" }, { status: 400 });
  }

  // Prevent path traversal
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "");
  const filepath = join("/tmp", "taliq-uploads", safe);

  try {
    const { readFile } = await import("fs/promises");
    const data = await readFile(filepath);
    const ext = safe.split(".").pop()?.toLowerCase();
    const contentType = ext === "pdf" ? "application/pdf" : ext === "png" ? "image/png" : "image/jpeg";
    return new NextResponse(data, { headers: { "Content-Type": contentType } });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
