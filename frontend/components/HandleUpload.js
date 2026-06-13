import { getApiUrl } from "@/app/utils/api";

/**
 * Uploads a file directly to S3 using a presigned upload URL.
 *
 * @param {File} file - The file object to upload.
 * @param {string} token - Authorization bearer token.
 * @param {string} folder - Destination folder on the S3 bucket (e.g. 'listings').
 * @returns {Promise<{objectKey: string}>} - The S3 objectKey.
 */
export async function uploadImageToS3(file, token, folder = "listings") {
  if (!file) throw new Error("Tidak ada file untuk diunggah");

  const apiUrl = getApiUrl();
  const filename = encodeURIComponent(file.name);

  // 1. Request a presigned URL from the backend
  const response = await fetch(`${apiUrl}/storage_service/presigned/upload?filename=${filename}&folder=${folder}`, {
    method: "POST",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": file.type,
      "x-amz-acl": "public-read",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Gagal mendapatkan presigned URL dari server");
  }

  const { url: presignedUrl, objectKey } = await response.json();

  if (!presignedUrl) {
    throw new Error("Respon server tidak valid, presigned URL tidak ditemukan");
  }

  // 2. Upload file binary directly to S3 using the presigned URL
  // S3 requires "x-amz-acl": "public-read" if the PutObject command was signed with that ACL
  const uploadResponse = await fetch(presignedUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
      "x-amz-acl": "public-read",
    },
  });
  console.log("uploadResponse", uploadResponse);

  if (!uploadResponse.ok) {
    throw new Error(`Gagal mengunggah gambar ke S3 (${uploadResponse.statusText})`);
  }

  return { objectKey };
}
