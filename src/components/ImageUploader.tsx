import { useState } from "react";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ImageUploaderProps {
  profileId: string;
  slug: string;
  imageType: "portrait" | "additional" | "qr";
  label: string;
  currentSortOrder: number;
  onUploaded: () => void;
}

// shared upload-to-storage-then-insert-row logic, used by both the admin
// profile editor and the club dashboard (photographer/artist uploads)
const ImageUploader = ({ profileId, slug, imageType, label, currentSortOrder, onUploaded }: ImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${slug || "temp"}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("profile-images")
        .getPublicUrl(path);

      const { error: insertError } = await supabase
        .from("profile_images")
        .insert({
          profile_id: profileId,
          image_url: urlData.publicUrl,
          image_type: imageType,
          sort_order: currentSortOrder,
        });

      if (insertError) throw insertError;

      toast({ title: "Image uploaded" });
      onUploaded();
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
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
        <Upload size={14} /> {uploading ? "Uploading..." : `Upload ${label}`}
      </span>
    </label>
  );
};

export default ImageUploader;