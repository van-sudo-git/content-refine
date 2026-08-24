import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface SchoolSettingsProps {
  schoolId: string | null;
  isDemo?: boolean;
}

const SchoolSettings = ({
  schoolId,
  isDemo = false,
}: SchoolSettingsProps) => {
  const [acceptingNominations, setAcceptingNominations] = useState(false);
  const [loading, setLoading] = useState(!isDemo);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!schoolId) return;

    // Demo should show what the real setting looks like without changing production data.
    if (isDemo) {
      setAcceptingNominations(true);
      setLoading(false);
      return;
    }

    const loadSetting = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("schools")
        .select("accepting_nominations")
        .eq("id", schoolId)
        .single();

      if (error) {
        toast({
          title: "Unable to load school settings",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setAcceptingNominations(data.accepting_nominations);
      }

      setLoading(false);
    };

    loadSetting();
  }, [schoolId, isDemo]);

  const handleToggle = async (checked: boolean) => {
    if (!schoolId || isDemo) return;

    setSaving(true);

    // RLS still decides which school this admin is actually allowed to change.
    const { error } = await supabase
      .from("schools")
      .update({ accepting_nominations: checked })
      .eq("id", schoolId);

    if (error) {
      toast({
        title: "Unable to update nominations",
        description: error.message,
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    setAcceptingNominations(checked);
    setSaving(false);

    toast({
      title: checked
        ? "Public nominations enabled"
        : "Public nominations disabled",
      description: checked
        ? "This school now appears in the public nomination form."
        : "This school will no longer accept new public nominations.",
    });
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-display text-xl text-foreground">
              Public Nominations
            </h3>

            {isDemo && <Badge variant="outline">Read-only demo</Badge>}
          </div>

          <p className="text-muted-foreground text-sm mt-1 max-w-xl">
            When enabled, this school appears in the public “Nominate Someone”
            form and can receive new staff nominations.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-muted-foreground">
            {loading
              ? "Loading..."
              : acceptingNominations
                ? "On"
                : "Off"}
          </span>

          <Switch
            checked={acceptingNominations}
            onCheckedChange={handleToggle}
            disabled={loading || saving || isDemo}
            aria-label="Accept public nominations"
          />
        </div>
      </div>
    </div>
  );
};

export default SchoolSettings;