import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle, Mail } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "already" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setError("No unsubscribe token was provided.");
      return;
    }

    const validate = async () => {
      try {
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          {
            headers: {
              apikey: SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
            },
          }
        );

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          setStatus("invalid");
          setError(data.error || "This unsubscribe link is invalid or has expired.");
          return;
        }

        const data = await response.json();
        if (data.valid === false && data.reason === "already_unsubscribed") {
          setStatus("already");
        } else if (data.valid === true) {
          setStatus("valid");
        } else {
          setStatus("invalid");
          setError("This unsubscribe link is invalid or has expired.");
        }
      } catch (err) {
        console.error("Unsubscribe validation failed", err);
        setStatus("invalid");
        setError("This unsubscribe link is invalid or has expired.");
      }
    };

    validate();
  }, [token]);

  const handleConfirm = async () => {
    if (!token) return;
    setStatus("loading");

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });

      if (invokeError || !data?.success) {
        setStatus("error");
        setError(invokeError?.message || "We could not process your unsubscribe request. Please try again.");
        return;
      }

      setStatus("success");
    } catch (err) {
      console.error("Unsubscribe confirmation failed", err);
      setStatus("error");
      setError("We could not process your unsubscribe request. Please try again.");
    }
  };

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md bg-white border border-[#E8E3D8] shadow-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-lilac/10 flex items-center justify-center">
              <Mail className="w-6 h-6 text-lilac" />
            </div>
            <CardTitle className="font-display text-2xl text-[#332E2B]">
              Manage your email preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            {status === "loading" && (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="w-6 h-6 animate-spin text-lilac" />
                <p className="text-[#6B6560]">Verifying your unsubscribe link...</p>
              </div>
            )}

            {status === "valid" && (
              <div className="space-y-4">
                <p className="text-[#332E2B]">
                  You are about to unsubscribe from NowWeSeeYou emails. You will no longer receive profile or nomination notifications.
                </p>
                <Button
                  onClick={handleConfirm}
                  className="bg-lilac hover:bg-lilac/90 text-white"
                >
                  Confirm unsubscribe
                </Button>
              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center gap-3 py-2">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
                <p className="text-[#332E2B] font-medium">You have been unsubscribed.</p>
                <p className="text-[#6B6560] text-sm">
                  You will no longer receive these emails. If you change your mind, contact your school administrator.
                </p>
              </div>
            )}

            {(status === "invalid" || status === "error") && (
              <div className="flex flex-col items-center gap-3 py-2">
                <AlertCircle className="w-10 h-10 text-amber-500" />
                <p className="text-[#332E2B] font-medium">
                  {status === "error" ? "Something went wrong" : "This link is no longer valid"}
                </p>
                <p className="text-[#6B6560] text-sm">{error}</p>
              </div>
            )}

            {status === "already" && (
              <div className="flex flex-col items-center gap-3 py-2">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
                <p className="text-[#332E2B] font-medium">You are already unsubscribed.</p>
                <p className="text-[#6B6560] text-sm">
                  This email address is no longer receiving these messages.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
