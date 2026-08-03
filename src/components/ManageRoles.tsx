import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Trash2, UserPlus } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ClubRole = Database["public"]["Enums"]["club_role"];

interface RoleRow {
  id: string;
  email: string | null;
  role: ClubRole;
  created_at: string;
}

interface ManageRolesProps {
  schoolId: string | null;
}

// labels + descriptions for the 4 roles - matches the enum in supabase
const roleLabels: Record<ClubRole, string> = {
  journalist: "Journalist",
  photographer: "Photographer",
  artist: "Artist",
  pr: "PR",
};

const roleDescriptions: Record<ClubRole, string> = {
  journalist: "Interviews the nominee, writes and publishes the profile",
  photographer: "Takes and uploads photos for the profile",
  artist: "Draws the portrait for the profile",
  pr: "Makes flyers and does outreach for profiles that are already published",
};

const roleColors: Record<ClubRole, string> = {
  journalist: "bg-blue-100 text-blue-800",
  photographer: "bg-amber-100 text-amber-800",
  artist: "bg-purple-100 text-purple-800",
  pr: "bg-emerald-100 text-emerald-800",
};

const ManageRoles = ({ schoolId }: ManageRolesProps) => {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<ClubRole>("journalist");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    loadRoles(schoolId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  const loadRoles = async (sid: string) => {
    setLoading(true);

    const { data, error } = await supabase
      .from("club_roles")
      .select("id, email, role, created_at")
      .eq("school_id", sid)
      .order("role")
      .order("created_at");

    if (error) {
      toast({ title: "Couldn't load roles", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    setRoles((data ?? []) as RoleRow[]);
    setLoading(false);
  };

  const addRole = async () => {
    if (!schoolId) return;
    if (!newEmail.trim()) return;

     // basic email format check before hitting the database
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(newEmail.trim())) {
        toast({ title: "That doesn't look like a valid email", variant: "destructive" });
        return;
    }

    setAdding(true);

    const { error } = await supabase.from("club_roles").insert({
      school_id: schoolId,
      email: newEmail.trim().toLowerCase(),
      role: newRole,
    });

    setAdding(false);

    if (error) {
      // 23505 = unique constraint violation, means this email already has this role here
      if (error.code === "23505") {
        toast({ title: "Already assigned", description: "This person already has this role at this school.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
      return;
    }
    // send the welcome email - fire and forget, don't block the UI on it
    // let them know by email - if this fails the role is still assigned,
// just log it so we know to follow up manually
    console.log("Sending role-assigned email to", newEmail.trim().toLowerCase(), "as", newRole, "at school", schoolId);

    const { data: emailResult, error: emailError } = await supabase.functions.invoke("notify-role-assigned", {
    body: { email: newEmail.trim().toLowerCase(), role: newRole, school_id: schoolId },
    });

    if (emailError) {
    console.error("Role added but email failed to send", emailError);
    } else {
    console.log("Email function responded", emailResult);
    }

    toast({ title: "Added", description: `${newEmail} is now a ${roleLabels[newRole]}` });
    setNewEmail("");
    loadRoles(schoolId);
  };

  const removeRole = async (id: string) => {
    const { error } = await supabase.from("club_roles").delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Removed" });
    if (schoolId) loadRoles(schoolId);
  };

  if (!schoolId) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground">
        Pick a school first.
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-6">
      <div>
        <h3 className="font-display text-xl text-foreground">Club Roles</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Journalist, photographer, artist, and PR are all separate roles now instead
          of everyone needing full admin. A journalist only sees the nomination they're
          assigned to. PR can make flyers for anything already published at this school
          but can't touch nominations or other admins.
        </p>
      </div>

      {/* add a role - just email + dropdown, nothing fancy */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          type="email"
          placeholder="student email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addRole();
          }}
          className="flex-1"
        />
        <select
          value={newRole}
          onChange={(e) => setNewRole(e.target.value as ClubRole)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
        >
          <option value="journalist">Journalist</option>
          <option value="photographer">Photographer</option>
          <option value="artist">Artist</option>
          <option value="pr">PR</option>
        </select>
        <Button onClick={addRole} disabled={adding || !newEmail.trim()} className="shrink-0">
          <UserPlus size={16} />
          {adding ? "Adding..." : "Add"}
        </Button>
      </div>

      {/* quick reference so admins remember what each role can actually do */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="bg-background border border-border rounded-lg p-3">
          <Badge className={`${roleColors.journalist} border-0 mb-1.5`}>Journalist</Badge>
          <p className="text-muted-foreground">{roleDescriptions.journalist}</p>
        </div>
        <div className="bg-background border border-border rounded-lg p-3">
          <Badge className={`${roleColors.photographer} border-0 mb-1.5`}>Photographer</Badge>
          <p className="text-muted-foreground">{roleDescriptions.photographer}</p>
        </div>
        <div className="bg-background border border-border rounded-lg p-3">
          <Badge className={`${roleColors.artist} border-0 mb-1.5`}>Artist</Badge>
          <p className="text-muted-foreground">{roleDescriptions.artist}</p>
        </div>
        <div className="bg-background border border-border rounded-lg p-3">
          <Badge className={`${roleColors.pr} border-0 mb-1.5`}>PR</Badge>
          <p className="text-muted-foreground">{roleDescriptions.pr}</p>
        </div>
      </div>

      {/* list of everyone currently assigned */}
      <div className="space-y-2">
        {loading && <p className="text-muted-foreground text-sm">Loading...</p>}

        {!loading && roles.length === 0 && (
          <p className="text-muted-foreground text-sm py-4 text-center">
            Nobody's been assigned a role yet at this school.
          </p>
        )}

        {!loading &&
          roles.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-3 px-4 rounded-lg bg-background border border-border">
              <div className="flex items-center gap-3">
                <Badge className={`${roleColors[r.role]} border-0`}>{roleLabels[r.role]}</Badge>
                <span className="text-sm text-foreground">{r.email}</span>
              </div>
              <Button size="sm" variant="ghost" onClick={() => removeRole(r.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
      </div>
    </div>
  );
};

export default ManageRoles;