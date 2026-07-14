import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, CheckCircle } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/Layout";
import AnimatedSection from "@/components/AnimatedSection";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const SCHOOL_OPTIONS = [
  { value: "Lake Washington High School", label: "Lake Washington High School" },
];

const nominationSchema = z.object({
  school_name: z.string().trim().min(1, "Please select a school"),
  nominee_name: z.string().trim().min(1, "Name is required").max(100),
  nominee_role: z.string().trim().min(1, "Role is required").max(100),
  nominee_department: z.string().trim().max(100).optional(),
  reason: z.string().trim().min(10, "Please share at least a sentence or two").max(2000),
  nominator_name: z.string().trim().min(1, "Your name is required").max(100),
  nominator_email: z.string().trim().email("Please enter a valid email").max(255),
  nominee_informed: z.boolean(),
});

type NominationFormValues = z.infer<typeof nominationSchema>;

const Nominate = () => {
  const [submitted, setSubmitted] = useState(false);
  const [schoolId, setSchoolId] = useState<string | null>(null);

  const form = useForm<NominationFormValues>({
    resolver: zodResolver(nominationSchema),
    defaultValues: {
      nominee_name: "",
      nominee_role: "",
      nominee_department: "",
      reason: "",
      nominator_name: "",
      nominator_email: "",
      nominee_informed: false,
    },
  });

  useEffect(() => {
    const fetchSchool = async () => {
      const { data } = await supabase
        .from("schools")
        .select("id")
        .eq("name", "Lake Washington High School")
        .single();
      if (data) setSchoolId(data.id);
    };
    fetchSchool();
  }, []);

  const onSubmit = async (values: NominationFormValues) => {
    if (!schoolId) return;

    const { error } = await supabase.from("nominations").insert([{
      school_id: schoolId,
      nominee_name: values.nominee_name,
      nominee_role: values.nominee_role,
      nominee_department: values.nominee_department,
      reason: values.reason,
      nominator_name: values.nominator_name,
      nominator_email: values.nominator_email,
      nominee_informed: values.nominee_informed,
    }]);

    if (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
      return;
    }

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Layout>
        <section className="py-24 min-h-[70vh] flex items-center">
          <div className="container mx-auto px-6">
            <div className="max-w-lg mx-auto text-center">
              <AnimatedSection>
                <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} className="text-secondary" />
                </div>
                <h1 className="font-display text-4xl text-foreground mb-4">Thank You!</h1>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Your nomination has been submitted. We'll review it and reach out to the nominee with care and respect for their privacy.
                </p>
              </AnimatedSection>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>Nominate a Staff Member | Now We See You</title>
        <meta name="description" content="Know a staff member who deserves to be celebrated? Submit a nomination so we can share their story with care and consent." />
        <link rel="canonical" href="https://nowweseeyou.org/nominate" />
        <meta property="og:title" content="Nominate a Staff Member" />
        <meta property="og:description" content="Submit a staff member to be celebrated through Now We See You." />
        <meta property="og:url" content="https://nowweseeyou.org/nominate" />
        <meta property="og:type" content="website" />
      </Helmet>
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto">
            <AnimatedSection>
              <div className="text-center mb-12">
                <p className="text-secondary font-medium mb-2">Make Someone's Day</p>
                <h1 className="font-display text-5xl md:text-6xl text-foreground mb-6">
                  Nominate Someone
                </h1>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Know a staff member who deserves to be seen and celebrated? Fill out the form below. Participation is always voluntary.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="bg-card rounded-2xl border border-border p-8 md:p-12">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-1 mb-8">
                      <h2 className="font-display text-2xl text-foreground">About the Nominee</h2>
                      <p className="text-muted-foreground text-sm">Who would you like to nominate?</p>
                    </div>

                    <FormField
                      control={form.control}
                      name="nominee_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Their Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Brad Fisher" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="nominee_role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Their Role</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Custodian" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="nominee_department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Facilities" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Why are you nominating them?</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us what makes this person special and why they deserve to be seen..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nominee_informed"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal text-muted-foreground leading-snug">
                            I've already told this person about the nomination (optional but encouraged)
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <div className="border-t border-border pt-6 mt-8 space-y-1 mb-2">
                      <h2 className="font-display text-2xl text-foreground">About You</h2>
                      <p className="text-muted-foreground text-sm">So we can follow up if needed.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="nominator_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="nominator_email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="you@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 py-6 text-lg"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting ? (
                        "Submitting..."
                      ) : (
                        <>
                          Submit Nomination <Send size={18} />
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      Nominees will be contacted with care. They can always choose not to participate.
                    </p>
                  </form>
                </Form>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Nominate;
