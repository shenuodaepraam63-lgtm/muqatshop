import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Returns a signature for Cloudinary signed uploads.
 * Requires env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */
export async function POST(req: NextRequest) {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Cloudinary credentials missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const folder = body.folder || "muqatshop/products";
    const timestamp = Math.round(Date.now() / 1000);

    // Params to sign (alphabetical order for Cloudinary)
    const paramsToSign: Record<string, string | number> = {
      folder,
      timestamp,
    };
    if (body.public_id) paramsToSign.public_id = body.public_id;

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
    console.error(e);
    return NextResponse.json({ error: "Sign failed" }, { status: 500 });
  }
}
