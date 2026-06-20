import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaCarouselType, EmblaEventType } from "embla-carousel";
import { Link } from "react-router-dom";

export interface CoverflowProfile {
  id: string;
  slug: string;
  name: string;
  role: string;
  department: string | null;
  portrait_url: string | null;
  href?: string;
}

const TWEEN_FACTOR_BASE = 0.6;

const numberWithinRange = (number: number, min: number, max: number) =>
  Math.min(Math.max(number, min), max);

export const CoverflowCarousel = ({ profiles }: { profiles: CoverflowProfile[] }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: profiles.length > 2,
    align: "center",
    containScroll: false,
    skipSnaps: false,
    dragFree: false,
  });
  const tweenFactor = useRef(0);
  const tweenNodes = useRef<HTMLElement[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const setTweenNodes = useCallback((api: EmblaCarouselType) => {
    tweenNodes.current = api.slideNodes().map(
      (slideNode) => slideNode.querySelector(".coverflow-card") as HTMLElement
    );
  }, []);

  const setTweenFactor = useCallback((api: EmblaCarouselType) => {
    tweenFactor.current = TWEEN_FACTOR_BASE * api.scrollSnapList().length;
  }, []);

  const tweenScale = useCallback((api: EmblaCarouselType, eventName?: EmblaEventType) => {
    const engine = api.internalEngine();
    const scrollProgress = api.scrollProgress();
    const slidesInView = api.slidesInView();
    const isScrollEvent = eventName === "scroll";

    api.scrollSnapList().forEach((scrollSnap, snapIndex) => {
      let diffToTarget = scrollSnap - scrollProgress;
      const slidesInSnap = engine.slideRegistry[snapIndex];

      slidesInSnap.forEach((slideIndex) => {
        if (isScrollEvent && !slidesInView.includes(slideIndex)) return;

        if (engine.options.loop) {
          engine.slideLooper.loopPoints.forEach((loopItem) => {
            const target = loopItem.target();
            if (slideIndex === loopItem.index && target !== 0) {
              const sign = Math.sign(target);
              if (sign === -1) diffToTarget = scrollSnap - (1 + scrollProgress);
              if (sign === 1) diffToTarget = scrollSnap + (1 - scrollProgress);
            }
          });
        }

        const tweenValue = 1 - Math.abs(diffToTarget * tweenFactor.current);
        const scale = numberWithinRange(tweenValue, 0.55, 1).toString();
        const opacity = numberWithinRange(tweenValue + 0.1, 0.45, 1).toString();
        const node = tweenNodes.current[slideIndex];
        if (node) {
          node.style.transform = `scale(${scale})`;
          node.style.opacity = opacity;
        }
      });
    });
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    setTweenNodes(emblaApi);
    setTweenFactor(emblaApi);
    tweenScale(emblaApi);

    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect();

    emblaApi
      .on("reInit", (api) => {
        setTweenNodes(api);
        setTweenFactor(api);
        tweenScale(api);
      })
      .on("scroll", tweenScale)
      .on("slideFocus", tweenScale)
      .on("select", onSelect);
  }, [emblaApi, setTweenNodes, setTweenFactor, tweenScale]);

  if (profiles.length === 0) return null;

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y -ml-4">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="flex-[0_0_60%] sm:flex-[0_0_42%] md:flex-[0_0_32%] lg:flex-[0_0_26%] pl-4 min-w-0"
            >
              <Link to={p.href ?? `/gallery/${p.slug}`} className="coverflow-card block transition-[transform,opacity] duration-200 ease-out will-change-transform origin-center">
                <div className="aspect-[3/4] bg-card rounded-2xl overflow-hidden border border-border shadow-lg">
                  {p.portrait_url ? (
                    <img
                      src={p.portrait_url}
                      alt={`${p.name}, hand-drawn portrait`}
                      loading="lazy"
                      draggable={false}
                      className="w-full h-full object-cover select-none"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-card">
                      <span className="font-display text-6xl opacity-30">{p.name[0]}</span>
                    </div>
                  )}
                </div>
                <h3 className="font-display text-base text-foreground mt-3 text-center truncate">{p.name}</h3>
                <p className="text-muted-foreground text-xs text-center truncate px-2">
                  {p.role}
                  {p.department && `, ${p.department}`}
                </p>
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-1.5 mt-5">
        {profiles.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === selectedIndex ? "w-6 bg-secondary" : "w-1.5 bg-border hover:bg-muted-foreground/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default CoverflowCarousel;
