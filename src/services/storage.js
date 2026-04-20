import { supabase, supabaseAvatarsBucket, hasSupabaseEnv } from "../lib/supabase";

const DEFAULT_AVATAR_BUCKET = supabaseAvatarsBucket || "avatar";
const DEFAULT_EVENT_BUCKET = String(
  import.meta.env.VITE_SUPABASE_EVENTS_BUCKET || "event-images"
).trim();

const MAX_AVATAR_MB = 6;
const MAX_EVENT_MB = 8;
const MAX_AVATAR_BYTES = MAX_AVATAR_MB * 1024 * 1024;
const MAX_EVENT_BYTES = MAX_EVENT_MB * 1024 * 1024;

function ensureSupabaseStorage() {
  if (!hasSupabaseEnv || !supabase) {
    throw new Error("La configuración pública de Supabase no está disponible.");
  }

  return supabase;
}

function getBucket(name, fallbackLabel) {
  const bucket = String(name || "").trim();

  if (!bucket) {
    throw new Error(
      `Falta configurar el bucket de ${fallbackLabel} en Supabase Storage.`
    );
  }

  return bucket;
}

function fileExtensionFromName(name = "") {
  const parts = String(name).split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "jpg";
}

function safeExt(ext = "") {
  const clean = String(ext || "").toLowerCase();
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(clean)) return clean;
  return "jpg";
}

function ensureImageFile(file, maxBytes, maxMb) {
  if (!file) {
    throw new Error("No se ha seleccionado ninguna imagen.");
  }

  if (!String(file.type || "").startsWith("image/")) {
    throw new Error("Selecciona un archivo de imagen válido.");
  }

  if (Number(file.size || 0) > maxBytes) {
    throw new Error(`La imagen supera el máximo permitido de ${maxMb} MB.`);
  }
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("No se pudo procesar la imagen."));
      img.onload = () => resolve(img);
      img.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}

async function compressImage(file, { maxSize = 1200, quality = 0.84, maxBytes, maxMb } = {}) {
  ensureImageFile(file, maxBytes, maxMb);

  const img = await loadImageFromFile(file);
  const largestSide = Math.max(img.width, img.height);
  const scale = Math.min(1, maxSize / largestSide);

  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No se pudo preparar la imagen.");
  }

  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    const originalExt = safeExt(fileExtensionFromName(file.name));
    const outputType = originalExt === "png" ? "image/png" : "image/jpeg";

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo comprimir la imagen."));
          return;
        }

        const finalExt = outputType === "image/png" ? "png" : "jpg";
        resolve({
          blob,
          contentType: blob.type || outputType,
          ext: finalExt,
        });
      },
      outputType,
      outputType === "image/png" ? undefined : quality
    );
  });
}

async function removeExistingFiles(folder, bucket) {
  const client = ensureSupabaseStorage();
  const cleanFolder = String(folder || "").trim();
  if (!cleanFolder) return;

  const { data, error } = await client.storage.from(bucket).list(cleanFolder, {
    limit: 100,
    offset: 0,
  });

  if (error) {
    if (String(error.message || "").toLowerCase().includes("bucket")) {
      throw new Error(`El bucket "${bucket}" no existe en Supabase Storage o no es accesible.`);
    }
    throw new Error(error.message || "No se pudo revisar el archivo actual.");
  }

  const files = Array.isArray(data) ? data : [];
  const paths = files
    .filter((item) => item?.name && !item.name.endsWith("/"))
    .map((item) => `${cleanFolder}/${item.name}`);

  if (!paths.length) return;

  const { error: removeError } = await client.storage.from(bucket).remove(paths);

  if (removeError) {
    throw new Error(removeError.message || "No se pudo reemplazar el archivo anterior.");
  }
}

async function uploadImageToBucket({ file, folder, bucketName, maxMb, maxBytes, maxSize = 1600 }) {
  const client = ensureSupabaseStorage();
  const bucket = getBucket(bucketName, "imágenes");
  const cleanFolder = String(folder || "").trim();

  if (!cleanFolder) {
    throw new Error("No se pudo identificar la carpeta de subida.");
  }

  const { blob, contentType, ext } = await compressImage(file, {
    maxSize,
    quality: 0.84,
    maxBytes,
    maxMb,
  });

  await removeExistingFiles(cleanFolder, bucket);

  const path = `${cleanFolder}/image-${Date.now()}.${ext}`;

  const { error: uploadError } = await client.storage.from(bucket).upload(path, blob, {
    contentType,
    upsert: true,
  });

  if (uploadError) {
    if (String(uploadError.message || "").toLowerCase().includes("bucket")) {
      throw new Error(`El bucket "${bucket}" no existe en Supabase Storage o no es accesible.`);
    }
    throw new Error(uploadError.message || "No se pudo subir la imagen a Storage.");
  }

  const { data: publicData } = client.storage.from(bucket).getPublicUrl(path);
  const publicUrl = publicData?.publicUrl
    ? `${publicData.publicUrl}${publicData.publicUrl.includes("?") ? "&" : "?"}t=${Date.now()}`
    : null;

  if (!publicUrl) {
    throw new Error("La imagen se subió, pero no se pudo obtener su URL pública.");
  }

  return {
    bucket,
    path,
    publicUrl,
  };
}

export async function uploadAvatarToSupabase(file, userId) {
  const cleanUserId = String(userId || "").trim();

  if (!cleanUserId) {
    throw new Error("No hay usuario autenticado para subir la imagen.");
  }

  return uploadImageToBucket({
    file,
    folder: cleanUserId,
    bucketName: DEFAULT_AVATAR_BUCKET,
    maxMb: MAX_AVATAR_MB,
    maxBytes: MAX_AVATAR_BYTES,
    maxSize: 1200,
  });
}

/**
 * Upload a raw audio Blob (e.g. from MediaRecorder) to the events bucket
 * and return the public URL. Bypasses the image-compression pipeline —
 * audio is stored as-is.
 */
export async function uploadAudioBlobToSupabase(blob, userId) {
  const cleanUserId = String(userId || "").trim();
  if (!cleanUserId) {
    throw new Error("No hay usuario autenticado para subir el audio.");
  }

  const supa = ensureSupabaseStorage();
  const bucket = getBucket(
    DEFAULT_EVENT_BUCKET || DEFAULT_AVATAR_BUCKET,
    "audios",
  );

  // Pick an extension from the blob's mime type; default to webm which
  // MediaRecorder produces on most browsers.
  let ext = "webm";
  const mime = (blob?.type || "").toLowerCase();
  if (mime.includes("mp4")) ext = "m4a";
  else if (mime.includes("mpeg")) ext = "mp3";
  else if (mime.includes("wav")) ext = "wav";
  else if (mime.includes("ogg")) ext = "ogg";

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${cleanUserId}/audio/${filename}`;

  const { error } = await supa.storage
    .from(bucket)
    .upload(path, blob, {
      contentType: blob.type || `audio/${ext}`,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message || "No se pudo subir el audio.");
  }

  const { data } = supa.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error("La URL pública del audio no está disponible.");
  }

  return data.publicUrl;
}

export async function uploadEventImageToSupabase(file, ownerId, eventId = "draft") {
  const cleanOwnerId = String(ownerId || "").trim();

  if (!cleanOwnerId) {
    throw new Error("No hay usuario autenticado para subir la imagen del evento.");
  }

  return uploadImageToBucket({
    file,
    folder: `${cleanOwnerId}/${String(eventId || "draft").trim() || "draft"}`,
    bucketName: DEFAULT_EVENT_BUCKET || DEFAULT_AVATAR_BUCKET,
    maxMb: MAX_EVENT_MB,
    maxBytes: MAX_EVENT_BYTES,
    maxSize: 1800,
  });
}
