import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface AppreciateButtonProps {
  profileId: string;
  personName: string;
}

interface AppreciationState {
  appreciation_count: number;
  appreciated: boolean;
}

const VISITOR_KEY = "nwsy-appreciation-visitor-id";

const getVisitorId = () => {
  let visitorId = localStorage.getItem(VISITOR_KEY);

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, visitorId);
  }

  return visitorId;
};

const AppreciateButton = ({
  profileId,
  personName,
}: AppreciateButtonProps) => {
  const [count, setCount] = useState(0);
  const [appreciated, setAppreciated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const visitorId = getVisitorId();

        const { data, error } = await supabase.rpc(
          "get_profile_appreciation_state",
          {
            p_profile_id: profileId,
            p_visitor_id: visitorId,
          }
        );

        if (error) throw error;

        const state = data?.[0] as AppreciationState | undefined;

        if (state) {
          setCount(Number(state.appreciation_count) || 0);
          setAppreciated(Boolean(state.appreciated));
        }
      } catch (error) {
        console.error("Failed to load appreciation state", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [profileId]);

  const handleToggle = async () => {
    if (updating) return;

    const previousCount = count;
    const previousAppreciated = appreciated;

    const nextAppreciated = !appreciated;

    setUpdating(true);
    setAppreciated(nextAppreciated);
    setCount((current) =>
      nextAppreciated
        ? current + 1
        : Math.max(0, current - 1)
    );

    try {
      const visitorId = getVisitorId();

      const { data, error } = await supabase.rpc(
        "toggle_profile_appreciation",
        {
          p_profile_id: profileId,
          p_visitor_id: visitorId,
        }
      );

      if (error) throw error;

      const state = data?.[0] as AppreciationState | undefined;

      if (state) {
        setCount(Number(state.appreciation_count) || 0);
        setAppreciated(Boolean(state.appreciated));
      }
    } catch (error: any) {
      setCount(previousCount);
      setAppreciated(previousAppreciated);

      toast({
        title: "Could not update appreciation",
        description:
          error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant={appreciated ? "default" : "outline"}
        onClick={handleToggle}
        disabled={loading || updating}
        aria-pressed={appreciated}
        aria-label={
          appreciated
            ? `Remove appreciation for ${personName}`
            : `Appreciate ${personName}`
        }
        className={
          appreciated
            ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
            : ""
        }
      >
        <Heart
          size={17}
          fill={appreciated ? "currentColor" : "none"}
        />

        {appreciated ? "Appreciated" : "Appreciate"}

        {!loading && (
          <span className="tabular-nums">
            {count}
          </span>
        )}
      </Button>

      <p className="text-xs text-muted-foreground">
        A quick way to show appreciation
      </p>
    </div>
  );
};

export default AppreciateButton;