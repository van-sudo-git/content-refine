import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface SchoolOnboardingProps {
  onSchoolCreated: () => void;
}

// global admin only — creates a new school and assigns its first admin email
const SchoolOnboarding = ({ onSchoolCreated }: SchoolOnboardingProps) => {
  const [schoolName, setSchoolName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!schoolName.trim() || !adminEmail.trim()) return;
    setCreating(true);

    // create the school first
    const { data: school, error: schoolError } = await supabase
      .from("schools")
      .insert({ name: schoolName.trim() })
      .select("id")
      .single();

    if (schoolError || !school) {
      toast({ title: "Error creating school", description: schoolError?.message, variant: "destructive" });
      setCreating(false);
      return;
    }

    // assign first admin to the new school
    const { error: adminError } = await supabase
      .from("school_admins")
      .insert({
        school_id: school.id,
        email: adminEmail.trim().toLowerCase(),
        is_global_admin: false,
      });

    if (adminError) {
      toast({ title: "School created but admin failed", description: adminError.message, variant: "destructive" });
      setCreating(false);
      return;
    }

    toast({ title: "School created", description: `${schoolName} is ready. ${adminEmail} can now log in.` });
    setSchoolName("");
    setAdminEmail("");
    setCreating(false);
    onSchoolCreated();
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-4">
      <div>
        <h3 className="font-display text-xl text-foreground">Onboard a New School</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Creates a new school and assigns its first admin. They can log in immediately.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">School name</label>
          <Input
            placeholder="e.g. Juanita High School"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">First admin email</label>
          <Input
            type="email"
            placeholder="admin@lwsd.org"
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
          {creating ? "Creating..." : "Create School"}
        </Button>
      </div>
    </div>
  );
};

export default SchoolOnboarding;