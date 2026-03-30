import { supabase } from "../lib/supabase";

const DEFAULT_BUCKET = import.meta.env.VITE_SUPABASE_AVATARS_BUCKET || "avatars";

function fileExtensionFromName(name = "") {
  const parts = String(name).split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "jpg";
}

function safeExt(ext = "") {
  const clean = String(ext || "").toLowerCase();
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(clean)) return clean;
  return "jpg";
}

function avatarPath(userId, originalName = "avatar.jpg") {
  const ext = safeExt(fileExtensionFromName(originalName));
  const stamp = Date.now();
  return `${userId}/avatar-${stamp}.${ext}`;
}

function ensureImageFile(file) {
  if (!file) {
    throw new Error("No se ha seleccionado ninguna imagen.");
  }

  if (!String(file.type || "").startsWith("image/")) {
    throw new Error("Selecciona un archivo de imagen válido.");
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
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo comprimir la imagen."));
          return;
        }

        const ext = safeExt(fileExtensionFromName(file.name));
        const outType = ext === "png" ? "image/png" : "image/jpeg";
        const finalBlob =
          outType === "image/png"
            ? blob
            : blob.slice(0, blob.size, "image/jpeg");

        resolve({
          blob: finalBlob,
          contentType: finalBlob.type || outType,
          ext: outType === "image/png" ? "png" : "jpg",
        });
      },
      file.type === "image/png" ? "image/png" : "image/jpeg",
      file.type === "image/png" ? undefined : quality
    );
  });
}

export async function uploadAvatarToSupabase(file, userId, bucket = DEFAULT_BUCKET) {
  if (!userId) {
    throw new Error("No hay usuario autenticado para subir la imagen.");
  }

  const { blob, contentType, ext } = await compressImage(file);
  const path = `${userId}/avatar-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, blob, {
      contentType,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message || "No se pudo subir la imagen a Storage.");
  }

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
  const publicUrl = publicData?.publicUrl || null;

  if (!publicUrl) {
    throw new Error("La imagen se subió, pero no se pudo obtener su URL pública.");
  }

  return {
    bucket,
    path,
    publicUrl,
  };
}
