import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowDown, ArrowRight, RefreshCw } from "lucide-react";
import Layout from "@/components/Layout";
import ReflectionCard from "@/components/ReflectionCard";
import { useReflections } from "@/hooks/use-reflections";

export default function WhyItMatters() {
  const { data = [], isPending, isError, refetch, isFetching } = useReflections();
  const [featured, ...remaining] = data;
  return (
    <Layout>
      <Helmet>
        <title>Why It Matters | Now We See You</title>
        <meta name="description" content="Hear what being recognized means to the staff who help our schools thrive. Watch their reflections and leave a message of appreciation." />
        <link rel="canonical" href="https://nowweseeyou.org/why-it-matters" />
        <meta property="og:title" content="Recognition. In their own words. | Now We See You" />
        <meta property="og:description" content="Staff reflections on being seen and appreciated." />
        <meta property="og:url" content="https://nowweseeyou.org/why-it-matters" />
        <meta property="og:type" content="website" />
      </Helmet>
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <section className="max-w-3xl pb-14 pt-14 md:pb-20 md:pt-20" aria-labelledby="why-title">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Why it matters</p>
          <h1 id="why-title" className="mt-5 font-display text-5xl leading-[1.05] md:text-7xl">Recognition.<br /><em className="text-secondary">In their own words.</em></h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">A portrait is only part of the story. Hear what being recognized means to the people who help our schools thrive.</p>
          <a href="#reflections" className="mt-7 inline-flex items-center gap-2 text-sm text-secondary hover:underline">Meet the people behind the portraits <ArrowDown size={15} aria-hidden="true" /></a>
        </section>
        <section id="reflections" aria-labelledby="reflections-title" className="scroll-mt-28">
          <div className="mb-7 flex flex-col justify-between gap-3 border-t border-border pt-7 md:flex-row md:items-end">
            <h2 id="reflections-title" className="font-display text-3xl md:text-4xl">The other side of a portrait</h2>
            <p className="text-sm text-muted-foreground">Staff reflections on being seen and appreciated.</p>
          </div>
          {isPending ? (
            <div role="status" className="rounded-2xl border border-border p-10 text-muted-foreground">Loading staff reflections…</div>
          ) : isError ? (
            <div role="alert" className="rounded-2xl border border-border p-8">
              <p>We couldn’t load the reflections right now.</p>
              <button type="button" disabled={isFetching} onClick={() => void refetch()} className="mt-4 inline-flex items-center gap-2 text-secondary disabled:opacity-50"><RefreshCw size={16} aria-hidden="true" /> {isFetching ? "Trying again…" : "Try again"}</button>
            </div>
          ) : featured ? (
            <>
              <ReflectionCard key={featured.id} reflection={featured} featured />
              {remaining.length > 0 && <div className="mt-6 grid items-start gap-6 md:grid-cols-2">{remaining.map(reflection => <ReflectionCard key={reflection.id} reflection={reflection} />)}</div>}
            </>
          ) : (
            <div className="rounded-2xl border border-border p-10"><h3 className="font-display text-2xl">More voices to come</h3><p className="mt-3 text-muted-foreground">Staff reflections will appear here as they are shared. In the meantime, explore the portraits and stories in our galleries.</p><Link to="/galleries" className="mt-4 inline-block text-secondary hover:underline">Explore the galleries →</Link></div>
          )}
        </section>
        <section className="my-16 flex flex-col items-start justify-between gap-7 rounded-2xl bg-secondary/5 p-7 md:flex-row md:items-center md:p-11" aria-labelledby="invitation-title">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Keep the conversation going</p><h2 id="invitation-title" className="mt-3 font-display text-3xl md:text-4xl">A few words can mean a lot.</h2><p className="mt-3 max-w-lg text-muted-foreground">Visit a staff member’s story and leave a message about the difference they’ve made to you.</p></div>
          <Link to="/galleries" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-secondary px-6 py-3 text-sm font-medium text-secondary-foreground hover:opacity-90">Explore the galleries <ArrowRight size={16} aria-hidden="true" /></Link>
        </section>
      </div>
    </Layout>
  );
}
