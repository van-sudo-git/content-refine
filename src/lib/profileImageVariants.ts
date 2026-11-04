export type ProfileImageVariant = "thumb" | "card" | "full";

interface VariantSpec {
  name: ProfileImageVariant;
  maxEdge: number;
  quality: number;
}

interface CreatedVariant extends VariantSpec {
  blob: Blob;
}

const VARIANTS: VariantSpec[] = [
  { name: "thumb", maxEdge: 400, quality: 0.78 },
  { name: "card", maxEdge: 800, quality: 0.82 },
  { name: "full", maxEdge: 1600, quality: 0.86 },
];

const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Could not resize image."));
        }
      },
      "image/webp",
      quality
    );
  });

export const createProfileImageVariants = async (
  file: File
): Promise<CreatedVariant[]> => {
  if (!SUPPORTED_IMAGE_TYPES.has(file.type.toLowerCase())) {
    throw new Error(
      "Please upload a JPG, PNG, or WebP image. HEIC images should be converted first."
    );
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();

    const originalWidth = image.naturalWidth;
    const originalHeight = image.naturalHeight;
    const originalMaxEdge = Math.max(originalWidth, originalHeight);

    const variants: CreatedVariant[] = [];

    for (const spec of VARIANTS) {
      const scale = Math.min(1, spec.maxEdge / originalMaxEdge);

      const width = Math.max(1, Math.round(originalWidth * scale));
      const height = Math.max(1, Math.round(originalHeight * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Could not process image.");
      }

      context.drawImage(image, 0, 0, width, height);

      const blob = await canvasToBlob(canvas, spec.quality);

      variants.push({
        ...spec,
        blob,
      });
    }

    return variants;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

export const getProfileImageVariantUrl = (
  imageUrl: string,
  variant: ProfileImageVariant
) => {
  if (!imageUrl) return imageUrl;

  if (/-((thumb)|(card)|(full))\.webp(?=\?|$)/i.test(imageUrl)) {
    return imageUrl.replace(
      /-((thumb)|(card)|(full))\.webp(?=\?|$)/i,
      `-${variant}.webp`
    );
  }

  // Legacy image: leave untouched until the one-time backfill.
  return imageUrl;
};

const getStoragePathFromPublicUrl = (imageUrl: string) => {
  const marker = "/storage/v1/object/public/profile-images/";

  try {
    const pathname = new URL(imageUrl).pathname;
    const index = pathname.indexOf(marker);

    if (index == -1) return null;

    return decodeURIComponent(
      pathname.slice(index + marker.length)
    );
  } catch {
    return null;
  }
};

export const getProfileImageStoragePaths = (
  imageUrl: string
): string[] => {
  const path = getStoragePathFromPublicUrl(imageUrl);

  if (!path) return [];

  if (/-((thumb)|(card)|(full))\.webp$/i.test(path)) {
    return (["thumb", "card", "full"] as ProfileImageVariant[]).map(
      (variant) =>
        path.replace(
          /-((thumb)|(card)|(full))\.webp$/i,
          `-${variant}.webp`
        )
    );
  }

  return [path];
};
