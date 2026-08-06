import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff } from "lucide-react";
import Layout from "@/components/Layout";
import AnimatedSection from "@/components/AnimatedSection";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useAuthReady } from "@/hooks/use-auth-ready";

// figures out where someone should land after signing in, checking
// school_admins first, then club_roles for pr/journalist/photographer/artist
type LoginDestination = "/admin" | "/club" | null;

const resolveDestination = async (email: string): Promise<LoginDestination> => {
  const { data: adminRow } = await supabase
    .from("school_admins")
    .select("id")
    .eq("email", email)
    .limit(1)
    .maybeSingle();

  if (adminRow) return "/admin";

  // pull ALL club_roles rows for this email - someone can hold more than one
  const { data: roleRows } = await supabase
    .from("club_roles")
    .select("id, role")
    .eq("email", email);

  if (!roleRows || roleRows.length === 0) return null;

  const roles = roleRows.map((r) => r.role);
  const isPr = roles.includes("pr");
  const isCreative = roles.some((r) => r === "journalist" || r === "photographer" || r === "artist");

  // if they're pr and a creative role, /club is home base - it surfaces
  // a link to flyer generator for the pr side, same idea as admin-who's-
  // also-a-journalist getting a link the other direction
  if (isCreative) return "/club";
  if (isPr) return "/admin";

  return null;
};

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existingAccountEmail, setExistingAccountEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const navigate = useNavigate();
  const { user, isReady } = useAuthReady();

  useEffect(() => {
    if (!isReady || !user?.email) return;

    let cancelled = false;

    const checkSession = async () => {
      try {
        const destination = await resolveDestination((user.email ?? "").toLowerCase());

        if (cancelled) return;

        if (destination) {
          navigate(destination, { replace: true });
          return;
        }

        await supabase.auth.signOut();
        toast({
          title: "Access denied",
          description: "This email is not registered as an admin or club member.",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    checkSession();

    return () => {
      cancelled = true;
    };
  }, [isReady, navigate, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email: normalizedEmail, password });
        if (error) throw error;

        // supabase doesn't error on a duplicate signup - it returns a user
        // with no identities instead, so this is the real check
        const isExistingUser = data.user && data.user.identities?.length === 0;

        if (isExistingUser) {
          setExistingAccountEmail(normalizedEmail);
          setResent(false);
          return;
        }

        toast({
          title: "Check your email",
          description: "We sent you a confirmation link. Come back after confirming.",
        });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (error) throw error;

        const signedInEmail = data.user?.email?.trim().toLowerCase() ?? normalizedEmail;
        const destination = await resolveDestination(signedInEmail);

        if (!destination) {
          await supabase.auth.signOut();
          toast({
            title: "Access denied",
            description: "This email is not registered as an admin or club member.",
            variant: "destructive",
          });
          return;
        }

        navigate(destination, { replace: true });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!existingAccountEmail) return;
    setResending(true);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: existingAccountEmail,
    });

    setResending(false);

    if (error) {
      toast({ title: "Couldn't resend", description: error.message, variant: "destructive" });
      return;
    }

    setResent(true);
  };

  return (
    <Layout>
      <section className="py-24 min-h-[70vh] flex items-center">
        <div className="container mx-auto px-6">
          <div className="max-w-md mx-auto">
            <AnimatedSection>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                  <Lock size={28} className="text-secondary" />
                </div>
                <h1 className="font-display text-4xl text-foreground mb-2">Club &amp; Admin Access</h1>
                <p className="text-muted-foreground">
                  Sign in to review nominations and manage your school.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.15}>
              <div className="bg-card rounded-2xl border border-border p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@school.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute inset-y-0 right-0 inline-flex items-center justify-center px-3 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-pressed={showPassword}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    disabled={loading}
                  >
                    {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
                  </Button>
                </form>
                {/* if the user already has an account, show a message and a button to resend the confirmation email */}
                {existingAccountEmail && (
                  <div className="mt-4 rounded-lg border border-border bg-muted/50 p-4 space-y-3">
                    <p className="text-sm text-foreground">
                      You already have an account for <strong>{existingAccountEmail}</strong>.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setExistingAccountEmail(null);
                          setIsSignUp(false);
                        }}
                      >
                        Sign in instead
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleResendConfirmation}
                        disabled={resending || resent}
                      >
                        {resent ? "Confirmation sent" : resending ? "Sending..." : "Resend confirmation email"}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="mt-4 text-center space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setExistingAccountEmail(null);
                    }}
                    className="text-sm text-muted-foreground hover:text-secondary transition-colors"
                  >
                    {isSignUp
                      ? "Already have an account? Sign in"
                      : "Need an account? Sign up"}
                  </button>
                </div>

                <div className="mt-6 pt-6 border-t border-border text-center">
                  <p className="text-xs text-muted-foreground mb-3">Want to explore first?</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/admin?demo=true")}
                  >
                    Try Demo Dashboard
                  </Button>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AdminLogin;
