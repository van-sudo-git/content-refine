import { useState } from "react";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ImageUploaderProps {
  profileId?: string;
  nominationId?: string;
  slug?: string;
  imageType: "portrait" | "additional" | "qr";
  label: string;
  currentSortOrder: number;
  onUploaded: () => void;
}

// Shared upload logic.
//
// Admin/profile editing uses profileId + slug.
// Club photographers/artists use nominationId so they can upload
// independently of whether the journalist has started the profile.
const ImageUploader = ({
  profileId,
  nominationId,
  slug,
  imageType,
  label,
  currentSortOrder,
  onUploaded,
}: ImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (file: File) => {
    if (!profileId && !nominationId) {
      toast({
        title: "Upload failed",
        description: "This image is not linked to a profile or nomination.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const ext = file.name.split(".").pop();

      // Nomination uploads must use this path because the storage RLS
      // policies authorize assigned photographers/artists by nomination id.
      const path = nominationId
        ? `nominations/${nominationId}/${Date.now()}.${ext}`
        : `${slug || "temp"}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("profile-images")
        .getPublicUrl(path);

      // In nomination mode we intentionally do not need a profile id.
      // The database triggers attach it immediately if a profile already
      // exists, or later when the journalist creates the profile.
      const { error: insertError } = nominationId
        ? await supabase.from("profile_images").insert({
            nomination_id: nominationId,
            image_url: urlData.publicUrl,
            image_type: imageType,
            sort_order: currentSortOrder,
          })
        : await supabase.from("profile_images").insert({
            profile_id: profileId,
            image_url: urlData.publicUrl,
            image_type: imageType,
            sort_order: currentSortOrder,
          });

      if (insertError) throw insertError;

      toast({ title: "Image uploaded" });
      onUploaded();
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <label className="cursor-pointer">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileChange(file);
          e.target.value = "";
        }}
        disabled={uploading}
      />
      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-sm text-foreground hover:bg-muted transition-colors">
        <Upload size={14} />
        {uploading ? "Uploading..." : `Upload ${label}`}
      </span>
    </label>
  );
};

export default ImageUploader;