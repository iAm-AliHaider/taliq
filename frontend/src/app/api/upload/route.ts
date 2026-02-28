import { NextRequest, NextResponse } from "next/server";
import { put, del, list } from "@vercel/blob";

// File upload endpoint — uses Vercel Blob for persistent storage in production,
// falls back to /tmp for local development.

const IS_VERCEL = !!process.env.BLOB_READ_WRITE_TOKEN;

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
    const filename = `taliq/${type}/${refId}_${Date.now()}.${ext}`;

    if (IS_VERCEL) {
      // Vercel Blob — persistent cloud storage
      const blob = await put(filename, file, {
        access: "public",
        addRandomSuffix: false,
      });

      return NextResponse.json({
        ok: true,
        filename: blob.pathname,
        url: blob.url,
        size: file.size,
        type: file.type,
        storage: "vercel-blob",
      });
    } else {
      // Local fallback — /tmp
      const { writeFile, mkdir } = await import("fs/promises");
      const { join } = await import("path");
      const uploadDir = join("/tmp", "taliq-uploads");
      await mkdir(uploadDir, { recursive: true });
      const localName = `${type}_${refId}_${Date.now()}.${ext}`;
      const filepath = join(uploadDir, localName);
      const bytes = await file.arrayBuffer();
      await writeFile(filepath, Buffer.from(bytes));

      return NextResponse.json({
        ok: true,
        filename: localName,
        url: `/api/upload?file=${localName}`,
        size: file.size,
        type: file.type,
        storage: "local-tmp",
      });
    }
  } catch (e: any) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("file");

  if (!filename) {
    // List files
    if (IS_VERCEL) {
      const { blobs } = await list({ prefix: "taliq/" });
      return NextResponse.json({ files: blobs.map(b => ({ url: b.url, pathname: b.pathname, size: b.size, uploadedAt: b.uploadedAt })) });
    }
    return NextResponse.json({ files: [], storage: "local-tmp" });
  }

  // Prevent path traversal
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "");

  if (IS_VERCEL) {
    // Vercel Blob URLs are direct — redirect
    return NextResponse.json({ error: "Use the blob URL directly" }, { status: 400 });
  }

  // Local fallback — serve from /tmp
  try {
    const { readFile } = await import("fs/promises");
    const { join } = await import("path");
    const filepath = join("/tmp", "taliq-uploads", safe);
    const data = await readFile(filepath);
    const ext = safe.split(".").pop()?.toLowerCase();
    const contentType = ext === "pdf" ? "application/pdf" : ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    return new NextResponse(data, { headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000" } });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!IS_VERCEL) {
    return NextResponse.json({ error: "Delete only supported with Vercel Blob" }, { status: 400 });
  }

  try {
    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });
    await del(url);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
