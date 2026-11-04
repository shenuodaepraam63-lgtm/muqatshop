import { adminFetch } from "@/lib/admin-api";

/**
 * Client-side helper: get signed params (admin-auth) then upload file to Cloudinary.
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  const signRes = await adminFetch("/api/cloudinary/sign", {
    method: "POST",
    body: JSON.stringify({ folder: "muqatshop/products" }),
  });

  if (!signRes.ok) {
    const err = await signRes.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error || "Failed to get upload signature"
    );
  }

  const { signature, timestamp, apiKey, cloudName, folder } =
    await signRes.json();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", folder);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } }).error?.message || "Upload failed"
    );
  }

  const data = await uploadRes.json();
  return data.secure_url as string;
}
