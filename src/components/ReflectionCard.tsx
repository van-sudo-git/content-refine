import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink, Heart, Play } from "lucide-react";
import type { StaffReflection } from "@/hooks/use-reflections";
import { parseReflectionVideo, reflectionDate } from "@/lib/reflections";

function ReflectionPlayer({ reflection }: { reflection: StaffReflection }) {
  const [playing, setPlaying] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const media = parseReflectionVideo(reflection.videoUrl);
  const thumbnail = media?.kind === "embed" && media.thumbnail
    ? media.thumbnail : reflection.portraitUrl;
  useEffect(() => {
    if (playing) (frameRef.current || videoRef.current)?.focus();
  }, [playing]);
  if (!media) return null;
  const label = `Watch ${reflection.name.split(" ")[0]}'s reflection`;
  return (
    <div className="relative aspect-video w-full overflow-hidden bg-muted">
      {playing && media.kind === "embed" ? (
        <iframe ref={frameRef} tabIndex={0} title={`${reflection.name} reflection video`}
          src={`${media.url}${media.url.includes("?") ? "&" : "?"}autoplay=1`}
          className="absolute inset-0 h-full w-full" allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
      ) : playing && media.kind === "direct" ? (
        <video ref={videoRef} tabIndex={0} src={media.url} controls autoPlay playsInline
          aria-label={`${reflection.name} reflection video`} className="h-full w-full bg-black object-contain" />
      ) : (
        <>
          {thumbnail && !imageFailed ? (
            <img src={thumbnail} alt="" loading="lazy" onError={() => setImageFailed(true)}
              className="h-full w-full object-contain" />
          ) : <div className="flex h-full items-center justify-center bg-secondary/5" aria-hidden="true"><Play className="h-14 w-14 text-secondary/30" /></div>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent pointer-events-none" />
          {media.kind === "link" ? (
            <a href={media.url} target="_blank" rel="noopener noreferrer"
              className="absolute bottom-5 left-5 right-5 sm:right-auto inline-flex items-center justify-center gap-2 rounded-full bg-background px-5 py-3 text-sm font-medium shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary">
              <ExternalLink size={16} aria-hidden="true" /> {label}<span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            <button type="button" onClick={() => setPlaying(true)}
              className="absolute bottom-5 left-5 right-5 sm:right-auto inline-flex items-center justify-center gap-2 rounded-full bg-background px-5 py-3 text-sm font-medium shadow-md hover:text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary">
              <Play size={16} className="text-secondary" aria-hidden="true" /> {label}
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default function ReflectionCard({ reflection, featured = false }: { reflection: StaffReflection; featured?: boolean }) {
  const firstName = reflection.name.split(" ")[0];
  const date = reflectionDate(reflection.recordedDate);
  const profilePath = `/gallery/${encodeURIComponent(reflection.slug)}`;
  const hasVideo = Boolean(parseReflectionVideo(reflection.videoUrl));
  return (
    <article aria-labelledby={`reflection-${reflection.id}`} className={`overflow-hidden rounded-2xl border border-border bg-card ${featured && hasVideo ? "grid lg:grid-cols-[1.2fr_1fr]" : ""}`}>
      {hasVideo && <div className="flex items-center bg-muted"><ReflectionPlayer key={reflection.videoUrl} reflection={reflection} /></div>}
      <div className={featured ? "p-7 md:p-10" : "p-7"}>
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">In {firstName}'s voice</p>
        {reflection.quote && <blockquote className={`mb-7 font-display leading-snug ${featured ? "text-3xl md:text-4xl" : "text-3xl"}`}>“{reflection.quote}”</blockquote>}
        <h3 id={`reflection-${reflection.id}`} className="font-semibold">{reflection.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{[reflection.role, reflection.school].filter(Boolean).join(" · ")}</p>
        {date && <p className="mt-3 text-xs text-muted-foreground">Recorded {date}</p>}
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-secondary">
          <Link to={profilePath} className="inline-flex items-center gap-2 hover:underline">Read their story <ArrowRight size={14} aria-hidden="true" /></Link>
          <Link to={`${profilePath}#appreciation`} className="inline-flex items-center gap-2 hover:underline">Leave appreciation <Heart size={14} aria-hidden="true" /></Link>
        </div>
      </div>
    </article>
  );
}
