import { supabase } from "../lib/supabase";

const DEFAULT_BUCKET = import.meta.env.VITE_SUPABASE_AVATARS_BUCKET || "avatar";

const MAX_AVATAR_MB = 6;
const MAX_AVATAR_BYTES = MAX_AVATAR_MB * 1024 * 1024;

function getAvatarBucket() {
  const bucket = String(DEFAULT_BUCKET || "").trim();

  if (!bucket) {
    throw new Error(
      "Falta configurar VITE_SUPABASE_AVATARS_BUCKET con el nombre real del bucket."
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

function ensureImageFile(file) {
  if (!file) {
    throw new Error("No se ha seleccionado ninguna imagen.");
  }

  if (!String(file.type || "").startsWith("image/")) {
    throw new Error("Selecciona un archivo de imagen válido.");
  }

  if (Number(file.size || 0) > MAX_AVATAR_BYTES) {
    throw new Error(`La imagen supera el máximo permitido de ${MAX_AVATAR_MB} MB.`);
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

async function compressImage(file, { maxSize = 1200, quality = 0.84 } = {}) {
  ensureImageFile(file);

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

async function removeExistingAvatars(userId, bucket) {
  const folder = String(userId || "").trim();
  if (!folder) return;

  const { data, error } = await supabase.storage.from(bucket).list(folder, {
    limit: 100,
    offset: 0,
  });

  if (error) {
    if (String(error.message || "").toLowerCase().includes("bucket")) {
      throw new Error(
        `El bucket "${bucket}" no existe en Supabase Storage o no es accesible.`
      );
    }
    throw new Error(error.message || "No se pudo revisar el avatar actual.");
  }

  const files = Array.isArray(data) ? data : [];
  const paths = files
    .filter((item) => item?.name && !item.name.endsWith("/"))
    .map((item) => `${folder}/${item.name}`);

  if (!paths.length) return;

  const { error: removeError } = await supabase.storage.from(bucket).remove(paths);

  if (removeError) {
    throw new Error(removeError.message || "No se pudo reemplazar el avatar anterior.");
  }
}

export async function uploadAvatarToSupabase(file, userId) {
  const bucket = getAvatarBucket();
  const cleanUserId = String(userId || "").trim();

  if (!cleanUserId) {
    throw new Error("No hay usuario autenticado para subir la imagen.");
  }

  const { blob, contentType, ext } = await compressImage(file);

  await removeExistingAvatars(cleanUserId, bucket);

  const path = `${cleanUserId}/avatar-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, blob, {
      contentType,
      upsert: true,
    });

  if (uploadError) {
    if (String(uploadError.message || "").toLowerCase().includes("bucket")) {
      throw new Error(
        `El bucket "${bucket}" no existe en Supabase Storage o no es accesible.`
      );
    }
    throw new Error(uploadError.message || "No se pudo subir la imagen a Storage.");
  }

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
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
