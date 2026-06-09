import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  staticFile,
  Img,
} from "remotion";
import { loadFont as loadCormorant } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as loadDM } from "@remotion/google-fonts/DMSans";

const display = loadCormorant("normal", { weights: ["500", "700"] }).fontFamily;
const body = loadDM("normal", { weights: ["400", "500", "700"] }).fontFamily;

const CREAM = "#F5F1E8";
const CHARCOAL = "#342E29";
const LILAC = "#8B6FB8";
const MUTED = "#7A6F66";

// Scene timing (frames @30fps)
const T = {
  title: { from: 0, dur: 120 },
  home: { from: 110, dur: 150 },
  gallery: { from: 250, dur: 150 },
  brad: { from: 390, dur: 180 },
  shirley: { from: 560, dur: 180 },
  closing: { from: 730, dur: 140 },
};

const ease = (n: number) => 1 - Math.pow(1 - n, 3);

const SceneFade: React.FC<{ children: React.ReactNode; dur: number }> = ({
  children,
  dur,
}) => {
  const f = useCurrentFrame();
  const opacity = interpolate(f, [0, 18, dur - 18, dur], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

// Scene 1 — Title
const TitleScene: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s1 = spring({ frame: f - 6, fps, config: { damping: 18 } });
  const s2 = spring({ frame: f - 28, fps, config: { damping: 18 } });
  const s3 = spring({ frame: f - 50, fps, config: { damping: 18 } });
  return (
    <SceneFade dur={T.title.dur}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 70% 30%, #E8DBF1 0%, ${CREAM} 60%)`,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          padding: 80,
        }}
      >
        <div
          style={{
            opacity: s1,
            transform: `translateY(${(1 - s1) * 18}px)`,
            fontFamily: body,
            fontSize: 26,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: LILAC,
            fontWeight: 700,
            marginBottom: 36,
          }}
        >
          A Student-Led Initiative
        </div>
        <div
          style={{
            opacity: s2,
            transform: `translateY(${(1 - s2) * 30}px)`,
            fontFamily: display,
            fontWeight: 700,
            fontSize: 200,
            lineHeight: 0.95,
            letterSpacing: -4,
            color: CHARCOAL,
            textAlign: "center",
          }}
        >
          Now <span style={{ color: LILAC, fontStyle: "italic" }}>We See</span> You
        </div>
        <div
          style={{
            opacity: s3,
            transform: `translateY(${(1 - s3) * 20}px)`,
            fontFamily: body,
            fontSize: 34,
            color: MUTED,
            marginTop: 36,
            maxWidth: 1100,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          Recognition infrastructure for the people who keep our schools running.
        </div>
      </AbsoluteFill>
    </SceneFade>
  );
};

// Caption pill bottom-center
const Caption: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - 6, fps, config: { damping: 18 } });
  return (
    <div
      style={{
        position: "absolute",
        bottom: 70,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: s,
        transform: `translateY(${(1 - s) * 24}px)`,
      }}
    >
      <div
        style={{
          background: "rgba(52, 46, 41, 0.92)",
          color: CREAM,
          fontFamily: body,
          fontSize: 32,
          fontWeight: 500,
          padding: "20px 44px",
          borderRadius: 999,
          boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
          letterSpacing: 0.3,
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Ken Burns image scene (no scroll)
const StillScene: React.FC<{
  src: string;
  caption: string;
  dur: number;
  startScale?: number;
  endScale?: number;
  panX?: number;
  panY?: number;
}> = ({ src, caption, dur, startScale = 1.0, endScale = 1.08, panX = 0, panY = 0 }) => {
  const f = useCurrentFrame();
  const p = ease(Math.min(1, f / dur));
  const scale = interpolate(p, [0, 1], [startScale, endScale]);
  const tx = interpolate(p, [0, 1], [0, panX]);
  const ty = interpolate(p, [0, 1], [0, panY]);
  return (
    <SceneFade dur={dur}>
      <AbsoluteFill style={{ background: CREAM, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${scale}) translate(${tx}px, ${ty}px)`,
            transformOrigin: "center center",
          }}
        >
          <Img
            src={staticFile(src)}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, transparent 0%, transparent 55%, rgba(0,0,0,0.35) 100%)",
          }}
        />
        <Caption>{caption}</Caption>
      </AbsoluteFill>
    </SceneFade>
  );
};

// Scroll scene — auto-scroll a tall screenshot
const ScrollScene: React.FC<{
  src: string;
  caption: string;
  dur: number;
  imgWidth: number;
  imgHeight: number;
  startY?: number;
  endY?: number;
}> = ({ src, caption, dur, imgWidth, imgHeight, startY = 0, endY }) => {
  const f = useCurrentFrame();
  const aspect = imgWidth / imgHeight;
  // Fit width to 1920
  const renderedHeight = 1920 / aspect;
  const maxScroll = renderedHeight - 1080;
  const _endY = endY ?? -maxScroll;
  const p = ease(Math.min(1, f / dur));
  const y = interpolate(p, [0, 1], [startY, _endY]);
  return (
    <SceneFade dur={dur}>
      <AbsoluteFill style={{ background: CREAM, overflow: "hidden" }}>
        <Img
          src={staticFile(src)}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1920,
            height: renderedHeight,
            transform: `translateY(${y}px)`,
          }}
        />
        <Caption>{caption}</Caption>
      </AbsoluteFill>
    </SceneFade>
  );
};

// Scene 6 — Closing
const ClosingScene: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s1 = spring({ frame: f - 6, fps, config: { damping: 18 } });
  const s2 = spring({ frame: f - 36, fps, config: { damping: 18 } });
  const s3 = spring({ frame: f - 70, fps, config: { damping: 18 } });
  return (
    <SceneFade dur={T.closing.dur}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 30% 70%, #E8DBF1 0%, ${CREAM} 65%)`,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          padding: 100,
          textAlign: "center",
        }}
      >
        <div
          style={{
            opacity: s1,
            transform: `translateY(${(1 - s1) * 24}px)`,
            fontFamily: display,
            fontWeight: 500,
            fontStyle: "italic",
            fontSize: 96,
            color: CHARCOAL,
            lineHeight: 1.1,
            maxWidth: 1500,
          }}
        >
          Every community has heroes.
        </div>
        <div
          style={{
            opacity: s2,
            transform: `translateY(${(1 - s2) * 24}px)`,
            fontFamily: display,
            fontWeight: 700,
            fontSize: 96,
            color: LILAC,
            lineHeight: 1.1,
            marginTop: 12,
          }}
        >
          Every hero deserves to be seen.
        </div>
        <div
          style={{
            opacity: s3,
            transform: `translateY(${(1 - s3) * 16}px)`,
            fontFamily: body,
            fontWeight: 500,
            fontSize: 44,
            color: CHARCOAL,
            marginTop: 64,
            letterSpacing: 1,
          }}
        >
          nowweseeyou.org
        </div>
      </AbsoluteFill>
    </SceneFade>
  );
};

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: CREAM }}>
      <Sequence from={T.title.from} durationInFrames={T.title.dur}>
        <TitleScene />
      </Sequence>

      <Sequence from={T.home.from} durationInFrames={T.home.dur}>
        <StillScene
          src="images/home.png"
          caption="Live at nowweseeyou.org"
          dur={T.home.dur}
          startScale={1.0}
          endScale={1.12}
          panY={-30}
        />
      </Sequence>

      <Sequence from={T.gallery.from} durationInFrames={T.gallery.dur}>
        <StillScene
          src="images/gallery-top.png"
          caption="Hand-drawn portraits. Real stories."
          dur={T.gallery.dur}
          startScale={1.04}
          endScale={1.14}
          panY={60}
        />
      </Sequence>

      <Sequence from={T.brad.from} durationInFrames={T.brad.dur}>
        <ScrollScene
          src="images/brad-full.png"
          caption="Brad Fisher · Head Custodian · LWHS"
          dur={T.brad.dur}
          imgWidth={1280}
          imgHeight={1900}
        />
      </Sequence>

      <Sequence from={T.shirley.from} durationInFrames={T.shirley.dur}>
        <ScrollScene
          src="images/shirley-full.png"
          caption="Shirley P. · Bookkeeper · 18 years in the district"
          dur={T.shirley.dur}
          imgWidth={1280}
          imgHeight={2500}
        />
      </Sequence>

      <Sequence from={T.closing.from} durationInFrames={T.closing.dur}>
        <ClosingScene />
      </Sequence>
    </AbsoluteFill>
  );
};
