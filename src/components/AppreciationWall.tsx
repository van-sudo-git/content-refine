import { useState, useEffect } from "react";
import { Heart, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import AnimatedSection from "@/components/AnimatedSection";

interface Appreciation {
  id: string;
  author_name: string;
  message: string;
  created_at: string;
}

interface AppreciationWallProps {
  profileSlug: string;
  personName: string;
}

const AppreciationWall = ({ profileSlug, personName }: AppreciationWallProps) => {
  const [appreciations, setAppreciations] = useState<Appreciation[]>([]);
  const [authorName, setAuthorName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAppreciations = async () => {
    const { data } = await supabase
      .from("appreciations")
      .select("id, author_name, message, created_at")
      .eq("profile_slug", profileSlug)
      .order("created_at", { ascending: false });
    if (data) setAppreciations(data);
    setLoading(false);
  };

  useEffect(() => {
    loadAppreciations();
  }, [profileSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !message.trim()) return;
    setSubmitting(true);

    try {
      const res = await supabase.functions.invoke("moderate-appreciation", {
        body: {
          author_name: authorName.trim(),
          message: message.trim(),
          profile_slug: profileSlug,
        },
      });

      const data = res.data;

      if (data?.approved) {
        toast({ title: "Thank you! 💜", description: "Your appreciation has been posted." });
        setAuthorName("");
        setMessage("");
        loadAppreciations();
      } else {
        toast({
          title: "Message not posted",
          description: data?.reason || "Please ensure your message is positive and appreciative.",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-16">
      <AnimatedSection>
        <div className="flex items-center gap-3 mb-8">
          <Heart size={24} className="text-secondary" />
          <h2 className="font-display text-3xl text-foreground">Appreciation Wall</h2>
        </div>

        {/* Submit form */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-8">
          <p className="text-muted-foreground text-sm mb-4">
            Leave a kind message for {personName}. All messages are checked to ensure they're positive and appropriate.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Your name"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              required
              maxLength={100}
            />
            <Textarea
              placeholder={`Share what ${personName} means to you...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              maxLength={500}
              className="min-h-[100px]"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{message.length}/500</span>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
              >
                {submitting ? "Checking..." : <><Send size={14} /> Post Appreciation</>}
              </Button>
            </div>
          </form>
        </div>

        {/* Appreciation messages */}
        {loading ? (
          <p className="text-muted-foreground text-center py-8">Loading appreciations...</p>
        ) : appreciations.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border">
            <Heart size={32} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No appreciations yet. Be the first to share!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appreciations.map((a) => (
              <div key={a.id} className="bg-card rounded-xl border border-border p-5">
                <p className="text-foreground/80 text-sm leading-relaxed mb-3">{a.message}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-foreground">{a.author_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </AnimatedSection>
    </div>
  );
};

export default AppreciationWall;
