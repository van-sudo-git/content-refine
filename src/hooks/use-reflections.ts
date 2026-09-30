import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { parseReflectionVideo } from "@/lib/reflections";

export interface StaffReflection {
  id: string;
  slug: string;
  name: string;
  role: string;
  school: string | null;
  quote: string | null;
  videoUrl: string | null;
  recordedDate: string | null;
  portraitUrl: string | null;
}

export async function fetchReflections(signal?: AbortSignal): Promise<StaffReflection[]> {
  const reflections: StaffReflection[] = [];
  const pageSize = 200;
  // Page through the public records instead of relying on Supabase's row cap.
  for (let offset = 0; ; offset += pageSize) {
    let request = supabase.from("profiles")
      .select("id, slug, name, role, reflection_quote, reflection_video_url, reflection_recorded_date, schools(name), profile_images(image_url, image_type, sort_order)")
      .eq("status", "published")
      .eq("consent_status", "approved")
      .or("reflection_quote.not.is.null,reflection_video_url.not.is.null")
      .order("reflection_recorded_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .order("id")
      .range(offset, offset + pageSize - 1);
    if (signal) request = request.abortSignal(signal);
    const { data, error } = await request;
    if (error) throw error;
    for (const profile of data ?? []) {
      const quote = profile.reflection_quote?.trim() || null;
      const videoUrl = parseReflectionVideo(profile.reflection_video_url)
        ? profile.reflection_video_url : null;
      if (!quote && !videoUrl) continue;
      const portraits = (profile.profile_images ?? [])
        .filter(image => image.image_type === "portrait")
        .sort((a, b) => a.sort_order - b.sort_order);
      reflections.push({ id: profile.id, slug: profile.slug, name: profile.name,
        role: profile.role, school: profile.schools?.name ?? null, quote, videoUrl,
        recordedDate: profile.reflection_recorded_date,
        portraitUrl: portraits[0]?.image_url ?? null });
    }
    if (!data || data.length < pageSize) break;
  }
  return reflections;
}

export function useReflections() {
  return useQuery({
    queryKey: ["public-staff-reflections"],
    queryFn: ({ signal }) => fetchReflections(signal),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    retry: 1,
  });
}
