export type ReflectionVideo =
  | { kind: "embed"; url: string; thumbnail: string | null }
  | { kind: "direct"; url: string }
  | { kind: "link"; url: string };

/** Accept public HTTPS video links only; never interpolate arbitrary iframe hosts. */
export function parseReflectionVideo(value: string | null): ReflectionVideo | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return null;
    const host = url.hostname.replace(/^www\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = url.pathname.split("/")[1];
    if (["youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)) {
      id = /^\/(embed|shorts|live)\//.test(url.pathname)
        ? url.pathname.split("/")[2]
        : url.searchParams.get("v");
    }
    if (id && /^[\w-]{11}$/.test(id)) {
      return { kind: "embed", url: `https://www.youtube-nocookie.com/embed/${id}`,
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` };
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const match = url.pathname.match(/^\/(?:video\/)?(\d+)(?:\/([a-zA-Z0-9]+))?\/?$/);
      if (match) {
        const embed = new URL(`https://player.vimeo.com/video/${match[1]}`);
        const hash = url.searchParams.get("h") || match[2];
        if (hash) embed.searchParams.set("h", hash);
        return { kind: "embed", url: embed.href, thumbnail: null };
      }
    }
    if (/\.(mp4|webm|ogg)$/i.test(url.pathname)) return { kind: "direct", url: url.href };
    return { kind: "link", url: url.href };
  } catch { return null; }
}

export function reflectionDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value.slice(0, 10) + "T12:00:00Z");
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}
