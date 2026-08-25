import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";

interface GenerateProfileQrOptions {
  profileId: string;
  slug: string;
}

interface GenerateProfileQrResult {
  url: string;
  redirectId: string;
  replacedExisting: boolean;
}

const storagePathFromPublicUrl = (imageUrl: string) => {
  const marker = "/storage/v1/object/public/profile-images/";
  const markerIndex = imageUrl.indexOf(marker);

  if (markerIndex === -1) return null;

  const encodedPath = imageUrl
    .slice(markerIndex + marker.length)
    .split("?")[0];

  try {
    return decodeURIComponent(encodedPath);
  } catch {
    return encodedPath;
  }
};

/**
 * Generate the profile QR using the same durable redirect used by QR analytics.
 *
 * Important: the QR does NOT point straight at /gallery/:slug. It points at the
 * qr-redirect Edge Function, which logs the scan before redirecting to the profile.
 */
export const generateAndUploadProfileQR = async ({
  profileId,
  slug,
}: GenerateProfileQrOptions): Promise<GenerateProfileQrResult> => {
  const savedSlug = slug.trim();
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

  if (!savedSlug) {
    throw new Error("Save a profile slug before generating the QR code.");
  }

  if (!projectId) {
    throw new Error("Supabase project ID is not configured.");
  }

  // Reuse an existing redirect id when possible. This matters if a profile slug
  // changed after a QR was printed: the physical QR keeps the same tracked id,
  // and its historical + future scans stay in the same analytics stream.
  const { data: existingRedirect, error: redirectLookupError } = await supabase
    .from("redirects")
    .select("id")
    .eq("profile_slug", savedSlug)
    .limit(1)
    .maybeSingle();

  if (redirectLookupError) throw redirectLookupError;

  const redirectId = existingRedirect?.id ?? savedSlug;
  const redirectUrl = `https://${projectId}.supabase.co/functions/v1/qr-redirect?id=${redirectId}`;

  // Keep these settings identical to the existing Admin QR implementation.
  const qrDataUrl = await QRCode.toDataURL(redirectUrl, {
    width: 512,
    margin: 2,
    color: { dark: "#1E293B", light: "#FFFFFF" },
  });

  const response = await fetch(qrDataUrl);
  const blob = await response.blob();

  // Admin and Journalist now use the same storage layout for newly generated QRs.
  const path = `profile-qr/${profileId}/qr-${Date.now()}.png`;
  const { error: uploadError } = await supabase.storage
    .from("profile-images")
    .upload(path, blob, { contentType: "image/png" });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from("profile-images")
    .getPublicUrl(path);

  const destinationUrl = `https://nowweseeyou.org/gallery/${savedSlug}`;

  // This redirect is what makes every scan count in redirect_events_daily via
  // the existing qr-redirect Edge Function.
  const { error: redirectError } = await supabase
    .from("redirects")
    .upsert(
      {
        id: redirectId,
        profile_slug: savedSlug,
        destination_url: destinationUrl,
        active: true,
      },
      { onConflict: "id" }
    );

  if (redirectError) {
    await supabase.storage.from("profile-images").remove([path]);
    throw redirectError;
  }

  const { data: existingQr, error: qrLookupError } = await supabase
    .from("profile_images")
    .select("id, image_url")
    .eq("profile_id", profileId)
    .eq("image_type", "qr")
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (qrLookupError) {
    await supabase.storage.from("profile-images").remove([path]);
    throw qrLookupError;
  }

  if (existingQr) {
    const { error: updateError } = await supabase
      .from("profile_images")
      .update({
        image_url: urlData.publicUrl,
        image_type: "qr",
        sort_order: 999,
      })
      .eq("id", existingQr.id);

    if (updateError) {
      await supabase.storage.from("profile-images").remove([path]);
      throw updateError;
    }

    // Only clean up files from the new shared QR folder. Older Admin QR files
    // used a slug folder and are intentionally left alone rather than risking
    // deletion of unrelated profile media.
    const oldPath = storagePathFromPublicUrl(existingQr.image_url);
    if (oldPath?.startsWith("profile-qr/")) {
      await supabase.storage.from("profile-images").remove([oldPath]);
    }
  } else {
    const { error: insertError } = await supabase
      .from("profile_images")
      .insert({
        profile_id: profileId,
        image_url: urlData.publicUrl,
        image_type: "qr",
        sort_order: 999,
      });

    if (insertError) {
      await supabase.storage.from("profile-images").remove([path]);
      throw insertError;
    }
  }

  return {
    url: urlData.publicUrl,
    redirectId,
    replacedExisting: Boolean(existingQr),
  };
};