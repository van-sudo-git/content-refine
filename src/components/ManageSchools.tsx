import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type School = { id: string; name: string; display_order: number; archived: boolean };
interface Props { isDemo?: boolean; onChanged: () => Promise<void> }

function message(error: unknown) {
  return typeof error === "object" && error !== null && "message" in error
    ? String(error.message) : "Please refresh and try again.";
}

export default function ManageSchools({ isDemo = false, onChanged }: Props) {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(!isDemo);
  const [saving, setSaving] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  async function loadSchools() {
    const { data, error } = await supabase.from("schools")
      .select("id, name, display_order, archived")
      .order("display_order").order("name").order("id");
    if (error) throw error;
    setSchools(data ?? []);
  }

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    async function load() {
      try {
        const { data, error } = await supabase.from("schools")
          .select("id, name, display_order, archived")
          .order("display_order").order("name").order("id");
        if (error) throw error;
        if (!cancelled) setSchools(data ?? []);
      } catch (error) {
        if (!cancelled) toast({ title: "Unable to load schools",
          description: message(error), variant: "destructive" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [isDemo]);

  async function change(action: () => Promise<void>, title: string) {
    if (isDemo || saving) return;
    setSaving(true);
    try {
      await action();
      await loadSchools();
      await onChanged();
      toast({ title });
    } catch (error) {
      toast({ title: "Unable to complete school management",
        description: message(error), variant: "destructive" });
      await loadSchools().catch(() => undefined);
    } finally { setSaving(false); }
  }

  const active = schools.filter(s => !s.archived);
  const archived = schools.filter(s => s.archived);

  async function move(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= active.length) return;
    const reordered = [...active];
    [reordered[index], reordered[destination]] = [reordered[destination], reordered[index]];
    await change(async () => {
      const { error } = await supabase.rpc("reorder_schools", {
        p_ids: reordered.map(s => s.id),
      });
      if (error) throw error;
    }, "School order saved");
  }

  async function archive(school: School, value: boolean) {
    if (value && !window.confirm(
      'Archive "' + school.name + '"?\n\n' +
      "Remove it from active listings and stop new nominations. " +
      "Existing profiles and QR links will be preserved."
    )) return;
    await change(async () => {
      const { error } = await supabase.rpc("set_school_archived", {
        p_school_id: school.id, p_archived: value,
      });
      if (error) throw error;
    }, value ? "School archived" : "School restored");
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div>
        <h3 className="font-display text-xl text-foreground">Manage Schools</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Change school order or archive a school. Existing profiles and QR links stay available.
          Restored schools must enable public nominations again in School Settings.
        </p>
      </div>
      {isDemo ? <p className="text-sm text-muted-foreground">School management is disabled in demo mode.</p>
      : loading ? <p className="text-sm text-muted-foreground">Loading schools...</p>
      : <>
        <div className="space-y-2">
          {active.map((school, index) => (
            <div key={school.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
              <span className="font-medium">{school.name}</span>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="outline" disabled={saving || index === 0}
                  aria-label={"Move " + school.name + " up"} onClick={() => move(index, -1)}>
                  <ArrowUp size={16} />
                </Button>
                <Button size="icon" variant="outline" disabled={saving || index === active.length - 1}
                  aria-label={"Move " + school.name + " down"} onClick={() => move(index, 1)}>
                  <ArrowDown size={16} />
                </Button>
                <Button variant="outline" disabled={saving} onClick={() => archive(school, true)}>Archive</Button>
              </div>
            </div>
          ))}
          {!active.length && <p className="text-sm text-muted-foreground">No active schools.</p>}
        </div>
        {archived.length > 0 && <>
          <Button variant="ghost" onClick={() => setShowArchived(!showArchived)}>
            {showArchived ? "Hide" : "Show"} archived schools ({archived.length})
          </Button>
          {showArchived && archived.map(school => (
            <div key={school.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <span className="text-muted-foreground">{school.name}</span>
              <Button variant="outline" disabled={saving} onClick={() => archive(school, false)}>Restore</Button>
            </div>
          ))}
        </>}
      </>}
    </div>
  );
}
