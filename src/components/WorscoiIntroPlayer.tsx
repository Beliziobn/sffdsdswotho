import { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";

export const WORSCOI_INTRO_HD_URL = "/assets/aistudio/w_logo_intro_hd.mp4";
export const WORSCOI_INTRO_VIDEO_URL = "/assets/aistudio/w_logo_intro_c643297e.mp4";

// Global cache pre-loader to ensure the HD video file is pre-decoded in browser memory
if (typeof window !== "undefined") {
  try {
    const prewarm = document.createElement("video");
    prewarm.src = WORSCOI_INTRO_HD_URL;
    prewarm.preload = "auto";
    prewarm.muted = true;
    prewarm.load();
  } catch {
    // Ignore prewarm errors in non-browser environments
  }
}

interface WorscoiIntroPlayerProps {
  onComplete: () => void;
  title?: string;
  subtitle?: string;
  allowSkip?: boolean;
  autoPlay?: boolean;
  className?: string;
  layout?: "player" | "manga-page" | "webtoon-panel";
}

export const WorscoiIntroPlayer = ({
  onComplete,
  className = "",
}: WorscoiIntroPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const completedRef = useRef(false);

  const handleFinish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Start playback immediately with zero delay
    video.muted = true;
    video.currentTime = 0;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // If autoplay policy blocks it, finish immediately without hanging
        handleFinish();
      });
    }

    // Fallback safety timeout (video is 4.0s) so user is never locked in case of browser decoder stall
    const safetyTimer = setTimeout(() => {
      handleFinish();
    }, 4500);

    return () => {
      clearTimeout(safetyTimer);
    };
  }, []);

  if (typeof document === "undefined") {
    return null;
  }

  // Mandatory Fullscreen Opening: Fills 100% of the screen with object-cover, zero text overlays, non-skippable
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => {
        // Mandatory playback: clicking does NOT advance or skip
        e.stopPropagation();
      }}
      className={`fixed inset-0 z-[99999] w-screen h-screen bg-[#554cef] flex items-center justify-center overflow-hidden select-none cursor-default ${className}`}
    >
      {/* 100% Fullscreen HD Video covering the entire screen edge-to-edge */}
      <video
        ref={videoRef}
        src={WORSCOI_INTRO_HD_URL}
        playsInline
        autoPlay
        muted
        preload="auto"
        onEnded={handleFinish}
        onError={handleFinish}
        style={{
          imageRendering: "-webkit-optimize-contrast",
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
        }}
        className="w-full h-full object-cover pointer-events-none"
      >
        <source src={WORSCOI_INTRO_HD_URL} type="video/mp4" />
        <source src={WORSCOI_INTRO_VIDEO_URL} type="video/mp4" />
      </video>
    </motion.div>,
    document.body
  );
};

export default WorscoiIntroPlayer;
