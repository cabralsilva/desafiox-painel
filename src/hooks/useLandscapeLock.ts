import { useEffect, useState } from "react";
import { isNativePlatform } from "@/lib/nativePlatform";

async function lockLandscapeNative() {
  try {
    const { ScreenOrientation } = await import("@capacitor/screen-orientation");
    await ScreenOrientation.lock({ orientation: "landscape" });
  } catch {
    /* plugin ausente */
  }
}

async function unlockNative() {
  try {
    const { ScreenOrientation } = await import("@capacitor/screen-orientation");
    await ScreenOrientation.unlock();
  } catch {
    /* ignore */
  }
}

function isPortraitNow() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(orientation: portrait)").matches && window.innerWidth < 1024;
}

/** Trava landscape no nativo e sinaliza retrato no web/tablet. */
export function useLandscapeLock(enabled: boolean) {
  const [isPortrait, setIsPortrait] = useState(isPortraitNow);

  useEffect(() => {
    if (!enabled) return;

    const onChange = () => setIsPortrait(isPortraitNow());
    onChange();
    window.addEventListener("resize", onChange);
    window.addEventListener("orientationchange", onChange);

    if (isNativePlatform()) {
      lockLandscapeNative();
    } else {
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (type: string) => Promise<void>;
      };
      orientation?.lock?.("landscape").catch(() => undefined);
    }

    return () => {
      window.removeEventListener("resize", onChange);
      window.removeEventListener("orientationchange", onChange);
      if (isNativePlatform()) unlockNative();
      else screen.orientation?.unlock?.();
    };
  }, [enabled]);

  return { isPortrait: enabled && isPortrait };
}
