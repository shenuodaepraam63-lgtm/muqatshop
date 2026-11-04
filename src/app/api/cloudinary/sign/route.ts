import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { isAdminAuthSuccess, requireAdmin } from "@/lib/admin-auth";

/**
 * Signed upload parameters for Cloudinary.
 * Admin-only: must not be callable by anonymous or regular customers.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!isAdminAuthSuccess(auth)) return auth;

  try {
    const cloudName =
      process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        {
          error:
            "Cloudinary credentials missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET",
        },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const folderRaw = String(body.folder || "muqatshop/products");
    // Prevent path escape into unrelated Cloudinary folders
    const folder = folderRaw.replace(/\.\./g, "").replace(/^\/+/, "");
    if (!folder.startsWith("muqatshop/")) {
      return NextResponse.json(
        { error: "مجلد الرفع غير مسموح" },
        { status: 400 }
      );
    }

    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign: Record<string, string | number> = { folder, timestamp };
    if (body.public_id) {
      const pid = String(body.public_id).replace(/[^a-zA-Z0-9/_-]/g, "");
      if (pid) paramsToSign.public_id = pid;
    }

    const sorted = Object.keys(paramsToSign)
      .sort()
      .map((k) => `${k}=${paramsToSign[k]}`)
      .join("&");

    const signature = crypto
      .createHash("sha1")
      .update(sorted + apiSecret)
      .digest("hex");

    return NextResponse.json({
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder,
    });
  } catch (e) {
    console.error("[cloudinary/sign] failed", e instanceof Error ? e.name : "error");
    return NextResponse.json({ error: "Sign failed" }, { status: 500 });
  }
}
