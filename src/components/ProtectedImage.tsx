import { useState, useEffect } from "react";
import { getSmartNewsCover, isValidCoverUrl } from "@/lib/newsImageResolver";

interface ProtectedImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  category?: string;
  fallbackSrc?: string;
  /** Marks the image as LCP candidate (disables lazy loading). */
  priority?: boolean;
}

/** Only local assets get a .webp sibling — remote URLs are used as-is. */
const webpFor = (src: string) =>
  !/^https?:/i.test(src) && /\.(jpe?g|png)$/i.test(src) ? src.replace(/\.(jpe?g|png)$/i, ".webp") : null;

/**
 * Image with WebP preference, lazy decoding, no-referrer hotlink bypass, server proxy retry,
 * and fallback to a topic-appropriate high-resolution cover only if both direct & proxied fail.
 */
const ProtectedImage = ({ src, alt, className, category, fallbackSrc, priority }: ProtectedImageProps) => {
  const cleanSrc = src ? src.replace(/&amp;/g, "&").trim() : "";
  const [stage, setStage] = useState<"direct" | "proxy" | "fallback">("direct");

  useEffect(() => {
    setStage("direct");
  }, [cleanSrc]);

  let source: string;
  if (!isValidCoverUrl(cleanSrc)) {
    source = getSmartNewsCover(alt, category, fallbackSrc);
  } else if (stage === "direct") {
    source = cleanSrc;
  } else if (stage === "proxy" && /^https?:/i.test(cleanSrc) && !cleanSrc.includes("images.unsplash.com")) {
    source = `/api/news/image-proxy?url=${encodeURIComponent(cleanSrc)}`;
  } else {
    source = getSmartNewsCover(alt, category, fallbackSrc);
  }

  const webp = webpFor(source);

  return (
    <picture onContextMenu={(e) => e.preventDefault()} className="block w-full h-full">
      {webp && <source srcSet={webp} type="image/webp" />}
      <img
        src={source}
        alt={alt}
        referrerPolicy="no-referrer"
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
        onError={() => {
          if (stage === "direct" && /^https?:/i.test(cleanSrc) && !cleanSrc.includes("images.unsplash.com")) {
            setStage("proxy");
          } else if (stage !== "fallback") {
            setStage("fallback");
          }
        }}
        className={`select-none [-webkit-user-drag:none] ${className ?? ""}`}
      />
    </picture>
  );
};

export default ProtectedImage;
