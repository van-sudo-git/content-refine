import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Trash2, UserPlus } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { DEMO_ROLES } from "@/lib/demoData";

type ClubRole = Database["public"]["Enums"]["club_role"];

interface RoleRow {
  id: string;
  email: string | null;
  name: string | null;
  role: ClubRole;
  created_at: string;
}

interface ManageRolesProps {
  schoolId: string | null;
  isDemo?: boolean;
}

const roleLabels: Record<ClubRole, string> = {
  journalist: "Journalist",
  photographer: "Photographer",
  artist: "Artist",
  pr: "Community Outreach",
};

const roleDescriptions: Record<ClubRole, string> = {
  journalist: "Interviews the nominee and writes the profile draft",
  photographer: "Takes and uploads photos for the profile",
  artist: "Creates and uploads artwork for the profile",
  pr: "Makes flyers and does outreach for published profiles",
};

const roleColors: Record<ClubRole, string> = {
  journalist: "bg-blue-100 text-blue-800",
  photographer: "bg-amber-100 text-amber-800",
  artist: "bg-purple-100 text-purple-800",
  pr: "bg-emerald-100 text-emerald-800",
};

const ManageRoles = ({ schoolId, isDemo = false }: ManageRolesProps) => {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(!isDemo);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<ClubRole>("journalist");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const demoGuard = () => {
    toast({
      title: "Demo Mode",
      description: "Role changes are disabled in the read-only demo.",
    });
  };

  useEffect(() => {
    if (!schoolId) return;

    if (isDemo) {
      setRoles(
        DEMO_ROLES.filter((role) => role.school_id === schoolId).map((role) => ({
          id: role.id,
          email: role.email,
          name: role.name,
          role: role.role,
          created_at: role.created_at,
        }))
      );
      setLoading(false);
      return;
    }

    loadRoles(schoolId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId, isDemo]);

  const loadRoles = async (sid: string) => {
    if (isDemo) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("club_roles")
      .select("id, email, name, role, created_at")
      .eq("school_id", sid)
      .order("role")
      .order("created_at");

    if (error) {
      toast({
        title: "Couldn't load roles",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setRoles((data ?? []) as RoleRow[]);
    setLoading(false);
  };

  const addRole = async () => {
    if (isDemo) {
      demoGuard();
      return;
    }
    if (!schoolId || !newEmail.trim()) return;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(newEmail.trim())) {
      toast({
        title: "That doesn't look like a valid email",
        variant: "destructive",
      });
      return;
    }

    setAdding(true);

    const { error } = await supabase.from("club_roles").insert({
      school_id: schoolId,
      email: newEmail.trim().toLowerCase(),
      name: newName.trim() || null,
      role: newRole,
    });

    setAdding(false);

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "Already assigned",
          description: "This person already has this role at this school.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
      return;
    }

    console.log(
      "Sending role-assigned email to",
      newEmail.trim().toLowerCase(),
      "as",
      newRole,
      "at school",
      schoolId
    );

    const { data: emailResult, error: emailError } =
      await supabase.functions.invoke("notify-role-assigned", {
        body: {
          email: newEmail.trim().toLowerCase(),
          role: newRole,
          school_id: schoolId,
        },
      });

    if (emailError) {
      console.error("Role added but email failed to send", emailError);
    } else {
      console.log("Email function responded", emailResult);
    }

    toast({
      title: "Added",
      description: `${newName.trim() || newEmail} is now a ${roleLabels[newRole]}`,
    });
    setNewName("");
    setNewEmail("");
    loadRoles(schoolId);
  };

  const removeRole = async (id: string) => {
    if (isDemo) {
      demoGuard();
      return;
    }

    const { error } = await supabase.from("club_roles").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Removed" });
    if (schoolId) loadRoles(schoolId);
  };

  const startEdit = (role: RoleRow) => {
    if (isDemo) {
      demoGuard();
      return;
    }
    setEditingId(role.id);
    setEditName(role.name || "");
  };

  const saveEdit = async (id: string) => {
    if (isDemo) {
      demoGuard();
      return;
    }

    const { error } = await supabase
      .from("club_roles")
      .update({ name: editName.trim() || null })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Name updated" });
    setEditingId(null);
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
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="font-display text-xl text-foreground">Club Roles</h3>
          {isDemo && <Badge variant="outline">Read-only demo</Badge>}
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          Students can hold one or more roles. Publishing remains an admin action.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="student name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1"
        />
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
          <option value="pr">Community Outreach</option>
        </select>
        <Button
          onClick={addRole}
          disabled={adding || (!isDemo && !newEmail.trim())}
          className="shrink-0"
        >
          <UserPlus size={16} />
          {adding ? "Adding..." : isDemo ? "Add (Demo)" : "Add"}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {(["journalist", "photographer", "artist", "pr"] as ClubRole[]).map(
          (role) => (
            <div
              key={role}
              className="bg-background border border-border rounded-lg p-3"
            >
              <Badge className={`${roleColors[role]} border-0 mb-1.5`}>
                {roleLabels[role]}
              </Badge>
              <p className="text-muted-foreground">{roleDescriptions[role]}</p>
            </div>
          )
        )}
      </div>

      <div className="space-y-2">
        {loading && (
          <p className="text-muted-foreground text-sm">Loading...</p>
        )}

        {!loading && roles.length === 0 && (
          <p className="text-muted-foreground text-sm py-4 text-center">
            Nobody's been assigned a role yet at this school.
          </p>
        )}

        {!loading &&
          roles.map((role) => (
            <div
              key={role.id}
              className="flex items-center justify-between py-3 px-4 rounded-lg bg-background border border-border"
            >
              <div className="flex items-center gap-3 flex-1">
                <Badge className={`${roleColors[role.role]} border-0`}>
                  {roleLabels[role.role]}
                </Badge>

                {editingId === role.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs text-muted-foreground shrink-0">
                      {role.email}
                    </span>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Name"
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) =>
                        e.key === "Enter" && saveEdit(role.id)
                      }
                    />
                    <Button size="sm" onClick={() => saveEdit(role.id)}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(role)}
                    className="text-sm text-foreground hover:underline text-left flex items-center gap-2"
                    title={isDemo ? "View-only in demo mode" : "Click to edit name"}
                  >
                    <span>
                      {role.name || (
                        <span className="text-muted-foreground italic">
                          no name
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {role.email}
                    </span>
                  </button>
                )}
              </div>

              {editingId !== role.id && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeRole(role.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
          ))}
      </div>

      {isDemo && (
        <p className="text-xs text-muted-foreground">
          Notice that Maya Patel appears twice: one person can hold multiple roles.
        </p>
      )}
    </div>
  );
};

export default ManageRoles;