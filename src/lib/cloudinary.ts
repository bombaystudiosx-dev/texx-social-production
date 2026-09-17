// Free image hosting via Cloudinary's unsigned upload API — no backend
// secret needed, and no billing card required (unlike Firebase Storage,
// which now requires the Blaze plan). Create a free account at
// cloudinary.com, then an unsigned upload preset under
// Settings > Upload > Upload presets, and set the two env vars below.
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export const isCloudinaryConfigured = Boolean(CLOUD_NAME && UPLOAD_PRESET);

export async function uploadImageToCloudinary(file: File): Promise<string> {
  if (!isCloudinaryConfigured) {
    throw new Error("Image uploads are not configured yet.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET as string);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    throw new Error("Image upload failed.");
  }

  const data = await res.json();
  return data.secure_url as string;
}
