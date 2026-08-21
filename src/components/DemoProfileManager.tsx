import { useState } from "react";
import { ArrowLeft, Eye, Image as ImageIcon, QrCode, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { DEMO_PROFILES, type DemoProfile } from "@/lib/demoData";

const demoGuard = () => {
  toast({
    title: "Demo Mode",
    description: "This action is view-only in the demo.",
  });
};

const contributionLabel: Record<
  DemoProfile["contributors"][number]["role"],
  string
> = {
  journalist: "Journalist",
  photographer: "Photographer",
  artist: "Artist",
};

const DemoProfileManager = () => {
  const [viewing, setViewing] = useState<DemoProfile | null>(null);

  if (viewing) {
    const contributorsByPerson = new Map<string, string[]>();
    viewing.contributors.forEach((contributor) => {
      const existing = contributorsByPerson.get(contributor.name) || [];
      const label = contributionLabel[contributor.role];
      if (!existing.includes(label)) existing.push(label);
      contributorsByPerson.set(contributor.name, existing);
    });

    return (
      <div className="space-y-6">
        <button
          onClick={() => setViewing(null)}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <ArrowLeft size={14} /> Back to profiles
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <h3 className="font-display text-2xl text-foreground">{viewing.name}</h3>
          <Badge
            className={
              viewing.status === "published"
                ? "bg-emerald-100 text-emerald-800 border-0"
                : "bg-amber-100 text-amber-800 border-0"
            }
          >
            {viewing.status}
          </Badge>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Role:</span>{" "}
              <span className="text-foreground font-medium">{viewing.role}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Department:</span>{" "}
              <span className="text-foreground font-medium">{viewing.department}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Slug:</span>{" "}
              <span className="text-foreground font-medium">
                /gallery/{viewing.slug}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Nomination:</span>{" "}
              <span className="text-foreground font-medium">
                {viewing.nomination_id ? "Linked" : "Not linked"}
              </span>
            </div>
          </div>

          <div>
            <p className="text-muted-foreground text-xs mb-1">Bio</p>
            <p className="text-foreground text-sm leading-relaxed">{viewing.bio}</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users size={15} className="text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Contributors</p>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              {Array.from(contributorsByPerson.entries()).map(([name, roles]) => (
                <p key={name}>
                  {roles.join(", ")} — {name}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h4 className="font-display text-lg text-foreground">Images & QR Code</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {viewing.images.map((img, index) => (
              <div key={`${img.type}-${index}`} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                  <img
                    src={img.url}
                    alt={`${viewing.name} ${img.type}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <Badge className="absolute top-2 left-2 text-[10px]">
                  {img.type}
                </Badge>
              </div>
            ))}
            {viewing.images.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <ImageIcon size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No images uploaded yet.</p>
              </div>
            )}
          </div>

          {!viewing.images.some((image) => image.type === "qr") && (
            <p className="text-xs text-muted-foreground italic">
              QR code appears after publication.
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={demoGuard}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
          >
            Save Profile (Demo)
          </Button>
          <Button variant="outline" onClick={() => setViewing(null)}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Sample profiles showing published, submitted, and in-progress work. All actions are view-only.
        </p>
        <Button
          onClick={demoGuard}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
        >
          New Profile (Demo)
        </Button>
      </div>

      {DEMO_PROFILES.map((profile) => (
        <div
          key={profile.id}
          className="bg-card rounded-xl border border-border p-5 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {profile.images[0] && (
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-border flex-shrink-0">
                <img
                  src={profile.images[0].url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h3 className="font-display text-lg text-foreground truncate">
                  {profile.name}
                </h3>
                <Badge
                  className={
                    profile.status === "published"
                      ? "bg-emerald-100 text-emerald-800 border-0"
                      : "bg-amber-100 text-amber-800 border-0"
                  }
                >
                  {profile.status}
                </Badge>
                {profile.images.some((image) => image.type === "qr") && (
                  <QrCode size={14} className="text-muted-foreground" />
                )}
              </div>

              <p className="text-muted-foreground text-sm truncate">
                {profile.role} · /gallery/{profile.slug}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {profile.contributors.length} contributor role
                {profile.contributors.length === 1 ? "" : "s"} recorded
              </p>
            </div>
          </div>

          <Button size="sm" variant="outline" onClick={() => setViewing(profile)}>
            <Eye size={14} /> View
          </Button>
        </div>
      ))}
    </div>
  );
};

export default DemoProfileManager;