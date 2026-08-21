import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface SchoolOnboardingProps {
  onSchoolCreated: () => void;
  isDemo?: boolean;
}

const SchoolOnboarding = ({
  onSchoolCreated,
  isDemo = false,
}: SchoolOnboardingProps) => {
  const [schoolName, setSchoolName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [demoPreview, setDemoPreview] = useState<{
    schoolName: string;
    adminEmail: string;
  } | null>(null);

  const handleCreate = async () => {
    if (!schoolName.trim() || !adminEmail.trim()) return;

    if (isDemo) {
      setDemoPreview({
        schoolName: schoolName.trim(),
        adminEmail: adminEmail.trim().toLowerCase(),
      });
      toast({
        title: "Demo Mode",
        description:
          "This shows the school-onboarding workflow without creating real data.",
      });
      setSchoolName("");
      setAdminEmail("");
      return;
    }

    setCreating(true);

    const { data: school, error: schoolError } = await supabase
      .from("schools")
      .insert({ name: schoolName.trim() })
      .select("id")
      .single();

    if (schoolError || !school) {
      toast({
        title: "Error creating school",
        description: schoolError?.message,
        variant: "destructive",
      });
      setCreating(false);
      return;
    }

    const { error: adminError } = await supabase
      .from("school_admins")
      .insert({
        school_id: school.id,
        email: adminEmail.trim().toLowerCase(),
        is_global_admin: false,
      });

    if (adminError) {
      toast({
        title: "School created but admin failed",
        description: adminError.message,
        variant: "destructive",
      });
      setCreating(false);
      return;
    }

    toast({
      title: "School created",
      description: `${schoolName} is ready. ${adminEmail} can now log in.`,
    });
    setSchoolName("");
    setAdminEmail("");
    setCreating(false);
    onSchoolCreated();
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-4">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="font-display text-xl text-foreground">
            Onboard a New School
          </h3>
          {isDemo && <Badge variant="outline">Read-only demo</Badge>}
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          Creates a new school and assigns its first admin. They can then log in
          and manage that chapter.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">
            School name
          </label>
          <Input
            placeholder="e.g. Juanita High School"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-1">
            First admin email
          </label>
          <Input
            type="email"
            placeholder="admin@school.edu"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
        </div>

        <Button
          onClick={handleCreate}
          disabled={creating || !schoolName.trim() || !adminEmail.trim()}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
        >
          {creating
            ? "Creating..."
            : isDemo
              ? "Create School (Demo)"
              : "Create School"}
        </Button>
      </div>

      {isDemo && demoPreview && (
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-xs uppercase tracking-wide font-semibold text-secondary mb-1">
            Demo result
          </p>
          <p className="text-sm font-medium text-foreground">
            {demoPreview.schoolName}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            First admin: {demoPreview.adminEmail}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            In production, this school would now appear in the global admin
            school selector.
          </p>
        </div>
      )}
    </div>
  );
};

export default SchoolOnboarding;