import { useState } from "react";
import { Eye, QrCode, Image as ImageIcon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import comingSoonPortrait from "@/assets/demo-coming-soon.png";
import shirleyPortrait from "@/assets/demo-shirley.png";

interface DemoProfile {
  id: string;
  name: string;
  slug: string;
  role: string;
  department: string;
  bio: string;
  status: "published" | "draft";
  images: { type: string; url: string }[];
}

const DEMO_PROFILES: DemoProfile[] = [
  {
    id: "demo-shirley",
    name: "Shirley Poblete",
    slug: "shirley-poblete",
    role: "Bookkeeper / Accounting Technician",
    department: "Lake Washington High School",
    bio: `Every school depends on people who keep everything running behind the scenes. One of those people is Shirley Poblete, who manages purchasing and finances for Lake Washington High School.

Shirley has been at Lake Washington High School for almost three years and has spent 18 years working in the school district. Before this, she worked at Redmond Middle School for over a decade, building deep experience in supporting schools from the inside.

Her role touches nearly every part of the school. Shirley handles all purchasing, from classroom supplies to travel approvals, while also managing budgets for both ASB and the general fund. Throughout the day, she balances 10 to 15 different tasks at once, helping students, staff, and community members who walk into her office.

"No day is ever the same, you're always doing something different, and that's what makes it fun."

One of her most important responsibilities is making sure the school's budget stays on track. It's something she monitors constantly, ensuring that everything the school needs is available and accounted for.

What Shirley enjoys most about her work is the people. Whether it's helping a student, supporting a teacher, or working with the community, those daily interactions are what keep her motivated, even during the busiest times.

For her, the most meaningful part of the job is simple but powerful: watching students grow over time and being part of that journey, even in a small way.

Outside of school, Shirley enjoys writing and spending time with her horse, Panda. She loves horseback riding, especially jumping, a passion that reflects her energy and willingness to take on challenges.

Through her work, Shirley helps make sure that everything behind the scenes runs smoothly, so the rest of the school can focus on learning, teaching, and growing.`,
    status: "published",
    images: [
      { type: "portrait", url: shirleyPortrait },
      { type: "qr", url: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=demo-shirley" },
    ],
  },
  {
    id: "demo-p1",
    name: "Priya Sharma",
    slug: "priya-sharma",
    role: "Librarian",
    department: "Library",
    bio: "Priya turned our library into the most popular room in school. She started a student book club, reading challenges, and a cozy corner that kids love. Under her guidance the library circulation doubled in one semester.",
    status: "published",
    images: [
      { type: "portrait", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop" },
      { type: "qr", url: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=demo-priya" },
    ],
  },
  {
    id: "demo-p2",
    name: "James Okafor",
    slug: "james-okafor",
    role: "Head Custodian",
    department: "Facilities",
    bio: "James knows every student by name and always greets them with a smile. He fixed the playground equipment on his own time so kids wouldn't miss recess.",
    status: "published",
    images: [
      { type: "portrait", url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop" },
      { type: "qr", url: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=demo-james" },
    ],
  },
  {
    id: "demo-p3",
    name: "David Nguyen",
    slug: "david-nguyen",
    role: "Math Teacher",
    department: "Mathematics",
    bio: "David makes math fun. His creative problem-solving activities have inspired several students to join math competitions.",
    status: "draft",
    images: [
      { type: "portrait", url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop" },
    ],
  },
  {
    id: "demo-p4",
    name: "Coming Soon",
    slug: "coming-soon",
    role: "Profile in Progress",
    department: ",",
    bio: "This profile is being prepared. A student-drawn portrait has been submitted, and the full story, photos, and QR code will be added soon. Check back shortly to meet the next person we're celebrating.",
    status: "draft",
    images: [
      { type: "portrait", url: comingSoonPortrait },
    ],
  },
];

const demoGuard = () => {
  toast({ title: "Demo Mode", description: "This action is view-only in the demo." });
};

const DemoProfileManager = () => {
  const [viewing, setViewing] = useState<DemoProfile | null>(null);

  if (viewing) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setViewing(null)}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <ArrowLeft size={14} /> Back to profiles
        </button>

        <h3 className="font-display text-2xl text-foreground">
          {viewing.name}
        </h3>

        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
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
              <span className="text-foreground font-medium">/gallery/{viewing.slug}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>{" "}
              <Badge className={viewing.status === "published" ? "bg-emerald-100 text-emerald-800 border-0" : "bg-amber-100 text-amber-800 border-0"}>
                {viewing.status}
              </Badge>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Bio</p>
            <p className="text-foreground text-sm leading-relaxed">{viewing.bio}</p>
          </div>
        </div>

        {/* Images */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h4 className="font-display text-lg text-foreground">Images & QR Code</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {viewing.images.map((img, i) => (
              <div key={i} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </div>
                <Badge className="absolute top-2 left-2 text-[10px]">{img.type}</Badge>
              </div>
            ))}
            {viewing.images.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <ImageIcon size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No images uploaded yet.</p>
              </div>
            )}
          </div>
          {!viewing.images.some((i) => i.type === "qr") && (
            <p className="text-xs text-muted-foreground italic">
              A QR code would be auto-generated when saving a real profile.
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <Button onClick={demoGuard} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
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
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Sample profiles showing the management workflow. Actions are view-only.
        </p>
        <Button onClick={demoGuard} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
          New Profile (Demo)
        </Button>
      </div>

      {DEMO_PROFILES.map((profile) => (
        <div key={profile.id} className="bg-card rounded-xl border border-border p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Thumbnail */}
            {profile.images[0] && (
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-border flex-shrink-0">
                <img src={profile.images[0].url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-display text-lg text-foreground truncate">{profile.name}</h3>
                <Badge className={profile.status === "published" ? "bg-emerald-100 text-emerald-800 border-0" : "bg-amber-100 text-amber-800 border-0"}>
                  {profile.status}
                </Badge>
                {profile.images.some((i) => i.type === "qr") && (
                  <QrCode size={14} className="text-muted-foreground" />
                )}
              </div>
              <p className="text-muted-foreground text-sm truncate">{profile.role} · /gallery/{profile.slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button size="sm" variant="outline" onClick={() => setViewing(profile)}>
              <Eye size={14} /> View
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DemoProfileManager;
