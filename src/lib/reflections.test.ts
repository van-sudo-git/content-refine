import { describe, expect, it } from "vitest";
import { parseReflectionVideo, reflectionDate } from "./reflections";

describe("reflection media", () => {
  it("normalizes watch, short and embed URLs without arbitrary query injection", () => {
    for (const url of ["https://youtu.be/3gYNUUTPJKU", "https://www.youtube.com/watch?v=3gYNUUTPJKU&list=ignored", "https://youtube.com/shorts/3gYNUUTPJKU", "https://youtube-nocookie.com/embed/3gYNUUTPJKU"]) {
      expect(parseReflectionVideo(url)).toMatchObject({kind: "embed", url: "https://www.youtube-nocookie.com/embed/3gYNUUTPJKU"});
    }
  });
  it("rejects executable and insecure links", () => {
    for (const url of ["javascript:alert(1)", "data:text/html,hello", "http://example.com/a.mp4", "invalid"]) expect(parseReflectionVideo(url)).toBeNull();
  });
  it("does not embed a lookalike provider", () => {
    expect(parseReflectionVideo("https://youtube.com.example.org/watch?v=3gYNUUTPJKU")?.kind).toBe("link");
  });
  it("preserves signed direct media URLs and unlisted Vimeo hashes", () => {
    expect(parseReflectionVideo("https://example.com/a.mp4?token=abc")).toEqual({kind: "direct", url: "https://example.com/a.mp4?token=abc"});
    expect(parseReflectionVideo("https://vimeo.com/123456/abcdef")).toMatchObject({kind: "embed", url: "https://player.vimeo.com/video/123456?h=abcdef"});
  });
  it("formats dates without timezone day shifts", () => {
    expect(reflectionDate("2026-09-01")).toBe("September 2026");
    expect(reflectionDate(null)).toBeNull();
    expect(reflectionDate("invalid")).toBeNull();
  });
});
