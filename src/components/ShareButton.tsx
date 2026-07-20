import { useState } from "react";
import { Share2, Check } from "lucide-react";

interface ShareButtonProps {
  name: string;
  slug: string;
}

// tried to use the Web Share API here since most people will scan QR codes on their phones
// falls back to clipboard on desktop which is fine
const ShareButton = ({ name, slug }: ShareButtonProps) => {
  const [copied, setCopied] = useState(false);

  const url = `https://nowweseeyou.org/gallery/${slug}`;
  const firstName = name.split(" ")[0];

  const handleShare = async () => {
    // mobile: open native share sheet so they can text it, post it, whatever
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Meet ${name} | Now We See You`,
          text: `Read ${firstName}'s story on Now We See You.`,
          url,
        });
        return;
      } catch {
        // they cancelled — that's fine, don't do anything
        return;
      }
    }

    // desktop: just copy the link and show a confirmation
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // older browser fallback — create a hidden input, select it, copy
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleShare}
      aria-label={`Share ${firstName}'s profile`}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
    >
      {copied ? (
        <>
          <Check size={14} className="text-emerald-600" />
          <span className="text-emerald-600">Copied!</span>
        </>
      ) : (
        <>
          <Share2 size={14} />
          <span>Share {firstName}&apos;s story</span>
        </>
      )}
    </button>
  );
};

export default ShareButton;