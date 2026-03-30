import { useState, useEffect } from "react";
import { Upload, X, Save, Eye, Trash2, Plus, ArrowLeft, Image as ImageIcon, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import QRCode from "qrcode";

interface ProfileImage {
  id: string;
  image_url: string;
  image_type: string;
  sort_order: number;
}

interface Profile {
  id: string;
  slug: string;
  name: string;
  role: string;
  department: string | null;
  bio: string | null;
  school_id: string | null;
  status: string;
  created_at: string;
}

interface AdminProfileManagerProps {
  schoolId: string | null;
}

const AdminProfileManager = ({ schoolId }: AdminProfileManagerProps) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [images, setImages] = useState<ProfileImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    role: "",
    department: "",
    bio: "",
  });

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setProfiles(data as Profile[]);
  };

  const loadImages = async (profileId: string) => {
    const { data } = await supabase
      .from("profile_images")
      .select("*")
      .eq("profile_id", profileId)
      .order("sort_order");
    if (data) setImages(data as ProfileImage[]);
  };

  const startNew = () => {
    setIsNew(true);
    setEditing(null);
    setImages([]);
    setForm({ name: "", slug: "", role: "", department: "", bio: "" });
  };

  const startEdit = async (profile: Profile) => {
    setIsNew(false);
    setEditing(profile);
    setForm({
      name: profile.name,
      slug: profile.slug,
      role: profile.role,
      department: profile.department || "",
      bio: profile.bio || "",
    });
    await loadImages(profile.id);
  };

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: isNew ? generateSlug(value) : prev.slug,
    }));
  };

  /** Generate a QR code PNG, upload to storage, and create a redirect entry */
  const generateAndUploadQR = async (profileId: string, slug: string) => {
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const redirectId = slug; // use the slug as the redirect ID
      const redirectUrl = `https://${projectId}.supabase.co/functions/v1/qr-redirect?id=${redirectId}`;

      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(redirectUrl, {
        width: 512,
        margin: 2,
        color: { dark: "#1E293B", light: "#FFFFFF" },
      });

      // Convert data URL to blob
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();

      // Upload to storage
      const path = `${slug}/qr-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(path, blob, { contentType: "image/png" });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("profile-images")
        .getPublicUrl(path);

      // Save as profile image with type "qr"
      await supabase.from("profile_images").insert({
        profile_id: profileId,
        image_url: urlData.publicUrl,
        image_type: "qr",
        sort_order: 999,
      });

      // Create or update the redirect entry
      const destinationUrl = `https://nowweseeyou.lovable.app/gallery/${slug}`;
      await supabase.from("redirects").upsert({
        id: redirectId,
        profile_slug: slug,
        destination_url: destinationUrl,
        active: true,
      }, { onConflict: "id" });

      return urlData.publicUrl;
    } catch (error: any) {
      console.error("QR generation error:", error);
      toast({ title: "QR generation failed", description: error.message, variant: "destructive" });
      return null;
    }
  };

  const uploadImage = async (file: File, imageType: string) => {
    const profileId = editing?.id;
    if (!profileId && !isNew) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${form.slug || "temp"}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("profile-images")
        .getPublicUrl(path);

      if (profileId) {
        const { data: imgData, error: insertError } = await supabase
          .from("profile_images")
          .insert({
            profile_id: profileId,
            image_url: urlData.publicUrl,
            image_type: imageType,
            sort_order: images.length,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        if (imgData) setImages((prev) => [...prev, imgData as ProfileImage]);
      } else {
        setImages((prev) => [
          ...prev,
          {
            id: `temp-${Date.now()}`,
            image_url: urlData.publicUrl,
            image_type: imageType,
            sort_order: prev.length,
          },
        ]);
      }

      toast({ title: "Image uploaded" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (img: ProfileImage) => {
    if (img.id.startsWith("temp-")) {
      setImages((prev) => prev.filter((i) => i.id !== img.id));
      return;
    }

    const { error } = await supabase.from("profile_images").delete().eq("id", img.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setImages((prev) => prev.filter((i) => i.id !== img.id));
    toast({ title: "Image removed" });
  };

  const saveProfile = async () => {
    if (!form.name.trim() || !form.slug.trim() || !form.role.trim()) {
      toast({ title: "Missing fields", description: "Name, slug, and role are required.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .insert({
            name: form.name.trim(),
            slug: form.slug.trim(),
            role: form.role.trim(),
            department: form.department.trim() || null,
            bio: form.bio.trim() || null,
            school_id: schoolId,
            status: "draft",
          })
          .select()
          .single();

        if (error) throw error;

        const newProfile = profile as Profile;

        // Save temp images
        if (images.length > 0) {
          const imageInserts = images.map((img, idx) => ({
            profile_id: newProfile.id,
            image_url: img.image_url,
            image_type: img.image_type,
            sort_order: idx,
          }));
          await supabase.from("profile_images").insert(imageInserts);
        }

        // Auto-generate QR code
        await generateAndUploadQR(newProfile.id, form.slug.trim());

        toast({ title: "Profile created", description: "Saved as draft with QR code generated." });
      } else if (editing) {
        const { error } = await supabase
          .from("profiles")
          .update({
            name: form.name.trim(),
            slug: form.slug.trim(),
            role: form.role.trim(),
            department: form.department.trim() || null,
            bio: form.bio.trim() || null,
          })
          .eq("id", editing.id);

        if (error) throw error;

        // Update redirect destination if slug changed
        if (editing.slug !== form.slug.trim()) {
          const destinationUrl = `https://nowweseeyou.lovable.app/gallery/${form.slug.trim()}`;
          await supabase.from("redirects")
            .update({ destination_url: destinationUrl, profile_slug: form.slug.trim() })
            .eq("profile_slug", editing.slug);
        }

        toast({ title: "Profile updated" });
      }

      setEditing(null);
      setIsNew(false);
      setImages([]);
      loadProfiles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message?.includes("duplicate")
          ? "A profile with this slug already exists."
          : error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  /** Manually generate/regenerate a QR code for an existing profile */
  const handleGenerateQR = async (profileId: string, slug: string) => {
    setUploading(true);
    const url = await generateAndUploadQR(profileId, slug);
    if (url) {
      toast({ title: "QR Code generated!", description: "QR code has been added to the profile images." });
      await loadImages(profileId);
    }
    setUploading(false);
  };

  const toggleStatus = async (profile: Profile) => {
    const newStatus = profile.status === "published" ? "draft" : "published";
    const { error } = await supabase
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", profile.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: newStatus === "published" ? "Profile published!" : "Profile unpublished" });
    loadProfiles();
  };

  const deleteProfile = async (id: string) => {
    if (!confirm("Delete this profile and all its images? This cannot be undone.")) return;

    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Profile deleted" });
    loadProfiles();
  };

  // Editor view
  if (isNew || editing) {
    const hasQR = images.some((img) => img.image_type === "qr");

    return (
      <div className="space-y-6">
        <button
          onClick={() => { setEditing(null); setIsNew(false); setImages([]); }}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <ArrowLeft size={14} /> Back to profiles
        </button>

        <h3 className="font-display text-2xl text-foreground">
          {isNew ? "New Profile" : `Editing: ${editing?.name}`}
        </h3>

        <div className="bg-card rounded-xl border border-border p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Brad Fisher"
              />
            </div>
            <div className="space-y-2">
              <Label>URL Slug *</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                placeholder="e.g. brad-fisher"
              />
              <p className="text-xs text-muted-foreground">/gallery/{form.slug || "..."}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role *</Label>
              <Input
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                placeholder="e.g. Head Custodian"
              />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input
                value={form.department}
                onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                placeholder="e.g. Facilities"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Bio / Story</Label>
            <Textarea
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Tell their story... Use multiple paragraphs separated by line breaks."
              className="min-h-[200px]"
            />
          </div>
        </div>

        {/* Image Management */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-5">
          <h4 className="font-display text-lg text-foreground">Images</h4>

          {/* Upload buttons */}
          <div className="flex flex-wrap gap-3">
            {[
              { type: "portrait", label: "Portrait" },
              { type: "additional", label: "Additional Photo" },
            ].map(({ type, label }) => (
              <label key={type} className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadImage(file, type);
                    e.target.value = "";
                  }}
                  disabled={uploading}
                />
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-sm text-foreground hover:bg-muted transition-colors">
                  <Upload size={14} /> {uploading ? "Uploading..." : `Upload ${label}`}
                </span>
              </label>
            ))}

            {/* Generate QR button (only for existing profiles) */}
            {editing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGenerateQR(editing.id, form.slug)}
                disabled={uploading || !form.slug.trim()}
                className="inline-flex items-center gap-2 px-4 py-2"
              >
                <QrCode size={14} /> {hasQR ? "Regenerate QR Code" : "Generate QR Code"}
              </Button>
            )}
          </div>

          {isNew && form.slug && (
            <p className="text-xs text-muted-foreground italic">
              A QR code will be auto-generated when you save the profile.
            </p>
          )}

          {/* Image grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((img) => (
                <div key={img.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <Badge className="absolute top-2 left-2 text-[10px]">{img.image_type}</Badge>
                  <button
                    onClick={() => deleteImage(img)}
                    className="absolute top-2 right-2 bg-background/80 rounded-full p-1 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {images.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No images yet. Upload a portrait to get started.</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button onClick={saveProfile} disabled={saving} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
            <Save size={14} /> {saving ? "Saving..." : "Save Profile"}
          </Button>
          <Button variant="outline" onClick={() => { setEditing(null); setIsNew(false); setImages([]); }}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Create and manage gallery profiles. QR codes are auto-generated on save.
        </p>
        <Button onClick={startNew} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
          <Plus size={14} /> New Profile
        </Button>
      </div>

      {profiles.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground">No profiles yet. Create your first one!</p>
        </div>
      ) : (
        profiles.map((profile) => (
          <div key={profile.id} className="bg-card rounded-xl border border-border p-5 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-display text-lg text-foreground truncate">{profile.name}</h3>
                <Badge className={profile.status === "published" ? "bg-emerald-100 text-emerald-800 border-0" : "bg-amber-100 text-amber-800 border-0"}>
                  {profile.status}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm truncate">{profile.role} · /gallery/{profile.slug}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button size="sm" variant="outline" onClick={() => startEdit(profile)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggleStatus(profile)}
                className={profile.status === "published" ? "text-amber-600" : "text-emerald-600"}
              >
                <Eye size={14} /> {profile.status === "published" ? "Unpublish" : "Publish"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteProfile(profile.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default AdminProfileManager;
