import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ReflectionCard from "@/components/ReflectionCard";
import { useReflections } from "@/hooks/use-reflections";

/** Homepage teaser, sourced from the same public profiles as Why It Matters. */
export default function HomeReflection() {
  const { data, isPending, isError } = useReflections();
  const reflection =
  data?.find((person) =>
    person.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .split(/\s+/)[0]
      .toLowerCase() === "jose"
  ) ?? data?.[0];
  // Keep the rest of the homepage usable if reflections are unavailable.
  if (isPending || isError || !reflection) return null;

  return (
    <section aria-labelledby="home-reflection-title" className="pb-12 pt-4 md:pb-16 md:pt-6">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">WHY IT MATTERS</p>
              <h2 id="home-reflection-title" className="font-display text-3xl text-foreground md:text-4xl">Recognition. In their own words.</h2>
              <p className="mt-2 text-sm text-muted-foreground">Hear from the people behind the portraits.</p>
            </div>
            <Link to="/why-it-matters" className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-secondary hover:underline">
              Hear more staff reflections <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <ReflectionCard key={reflection.id} reflection={reflection} featured />
        </div>
      </div>
    </section>
  );
}
