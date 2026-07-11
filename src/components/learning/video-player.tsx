"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  CheckCircle2,
  Loader2,
  Maximize,
  Minimize,
  Pause,
  Play,
  PlayCircle,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
const SEEK_STEP = 5;
const VOLUME_STEP = 0.1;
const CONTROLS_TIMEOUT = 3000;
const COMPLETION_THRESHOLD = 0.8;

export function VideoPlayer({
  videoId,
  embedUrl,
  provider,
  completed,
}: {
  videoId: string;
  embedUrl: string;
  provider: string;
  completed: boolean;
}) {
  const [done, setDone] = useState(completed);
  const [canComplete, setCanComplete] = useState(completed);
  const [saving, setSaving] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);

  // We add origin to the embedUrl to ensure postMessage API works properly
  const [secureUrl, setSecureUrl] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined" && embedUrl) {
      const url = new URL(embedUrl);
      if (provider === "youtube") {
        url.searchParams.set("origin", window.location.origin);
        url.searchParams.set("enablejsapi", "1");
        url.searchParams.set("controls", "0");
        url.searchParams.set("rel", "0");
        url.searchParams.set("modestbranding", "1");
      }
      setSecureUrl(url.toString());
    }
  }, [embedUrl, provider]);

  useEffect(() => {
    if (!secureUrl) return;
    let interval: NodeJS.Timeout;

    const isYT = provider === "youtube" || secureUrl.includes("youtube") || secureUrl.includes("youtu.be");

    if (isYT) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      
      const initPlayer = () => {
        if (!iframeRef.current || playerRef.current) return;
        
        playerRef.current = new win.YT.Player(iframeRef.current, {
          events: {
            onReady: () => {
              setIsReady(true);
              const dur = playerRef.current?.getDuration?.() || 0;
              setDuration(dur);
            },
            onStateChange: (event: { data: number }) => {
              // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
              const playing = event.data === win.YT.PlayerState.PLAYING;
              setIsPlaying(playing);
              
              if (playing) {
                let lastSyncTime = 0;
                interval = setInterval(() => {
                  if (!playerRef.current?.getDuration) return;
                  const dur = playerRef.current.getDuration();
                  const cur = playerRef.current.getCurrentTime();
                  setDuration(dur);
                  setCurrentTime(cur);
                  const currentProgress = dur > 0 ? (cur / dur) * 100 : 0;
                  setProgress(currentProgress);
                  
                  // Sync to server every 15 seconds instead of every second
                  const now = Date.now();
                  if (dur > 0 && now - lastSyncTime >= 15000) {
                    lastSyncTime = now;
                     fetch("/api/student/video", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ video_id: videoId, percentage: currentProgress, is_completed: currentProgress >= COMPLETION_THRESHOLD * 100 }),
                     }).catch(() => {});
                  }

                  if (!completed && dur > 0 && cur / dur >= COMPLETION_THRESHOLD) {
                    setCanComplete(true);
                  }
                }, 1000);
              } else {
                clearInterval(interval);
              }
            },
          },
        });
      };

      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        
        // Push callback to queue in case multiple players load
        const oldCallback = win.onYouTubeIframeAPIReady;
        win.onYouTubeIframeAPIReady = () => {
          if (oldCallback) oldCallback();
          initPlayer();
        };
      } else if (win.YT?.Player) {
        // Use a short timeout to ensure iframe is fully rendered in DOM
        setTimeout(initPlayer, 200);
      } else {
        const oldCallback = win.onYouTubeIframeAPIReady;
        win.onYouTubeIframeAPIReady = () => {
          if (oldCallback) oldCallback();
          initPlayer();
        };
      }
    }

    return () => clearInterval(interval);
  }, [secureUrl, provider, completed, videoId]);

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (isPlaying) {
      hideTimerRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
      }, CONTROLS_TIMEOUT);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    } else {
      resetHideTimer();
    }
  }, [isPlaying, resetHideTimer]);

  const togglePlay = useCallback(() => {
    if (!playerRef.current || !isReady) return;
    if (typeof playerRef.current.playVideo === "function") {
      if (isPlaying) { playerRef.current.pauseVideo(); } else { playerRef.current.playVideo(); }
    }
  }, [isPlaying, isReady]);

  const seekRelative = useCallback((delta: number) => {
    if (!playerRef.current || !isReady) return;
    const p = playerRef.current;
    if (typeof p.seekTo === "function") {
      const cur = p.getCurrentTime?.() ?? 0;
      p.seekTo(Math.max(0, cur + delta), true);
    }
  }, [isReady]);

  const changeVolume = useCallback((delta: number) => {
    if (!playerRef.current || !isReady) return;
    const next = Math.max(0, Math.min(1, volume + delta));
    setVolume(next);
    setIsMuted(next === 0);
    if (typeof playerRef.current.setVolume === "function") {
      playerRef.current.setVolume(next * 100);
      if (next > 0) { playerRef.current.unMute?.(); }
    }
  }, [volume, isReady]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement)?.isContentEditable) return;
      if (!isReady || !playerRef.current) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          seekRelative(SEEK_STEP);
          break;
        case "ArrowLeft":
          e.preventDefault();
          seekRelative(-SEEK_STEP);
          break;
        case "ArrowUp":
          e.preventDefault();
          changeVolume(VOLUME_STEP);
          break;
        case "ArrowDown":
          e.preventDefault();
          changeVolume(-VOLUME_STEP);
          break;
      }
      resetHideTimer();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isReady, isPlaying, volume, duration, resetHideTimer, togglePlay, seekRelative, changeVolume]);

  const setVolumeFromClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!volumeBarRef.current || !isReady) return;
    const rect = volumeBarRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(pct);
    setIsMuted(pct === 0);
    if (playerRef.current && typeof playerRef.current.setVolume === "function") {
      playerRef.current.setVolume(pct * 100);
      if (pct > 0) playerRef.current.unMute?.();
      else playerRef.current.mute?.();
    }
  }, [isReady]);

  const toggleMute = useCallback(() => {
    if (!playerRef.current || !isReady) return;
    const next = !isMuted;
    setIsMuted(next);
    if (typeof playerRef.current.mute === "function") {
      if (next) { playerRef.current.mute(); } else { playerRef.current.unMute(); }
    }
  }, [isMuted, isReady]);

  const seekTo = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || !isReady || !progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = pct * duration;
    if (typeof playerRef.current.seekTo === "function") {
      playerRef.current.seekTo(time, true);
    }
    setCurrentTime(time);
    setProgress(pct * 100);
  }, [duration, isReady]);

  const setPlaybackSpeed = useCallback((rate: number) => {
    if (!playerRef.current || !isReady) return;
    setSpeed(rate);
    setShowSpeedMenu(false);
    if (typeof playerRef.current.setPlaybackRate === "function") {
      playerRef.current.setPlaybackRate(rate);
    }
  }, [isReady]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }, []);

  async function markComplete() {
    setSaving(true);
    await fetch("/api/student/video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ video_id: videoId, percentage: 100, is_completed: true }),
    });
    setDone(true);
    window.location.reload();
  }

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  const controlsVisible = showControls || !isPlaying;

  return (
    <div className="space-y-4">
      {/* ── Academy Video Container ── */}
      <div
        ref={containerRef}
        className="group relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-800 bg-black shadow-lg shadow-black/40"
        onMouseMove={resetHideTimer}
        onMouseLeave={() => {
          if (isPlaying) { setShowControls(false); setShowSpeedMenu(false); }
        }}
      >
        {secureUrl ? (
          <>
            {/* Provider iframe — non-interactive to protect branding clicks */}
            <iframe
              id={`player-${videoId}`}
              ref={iframeRef}
              src={secureUrl}
              className="pointer-events-none absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              title="Lesson video"
              tabIndex={-1}
            />

            {/* Click surface */}
            <button
              type="button"
              className="absolute inset-0 z-10 cursor-pointer bg-transparent focus:outline-none"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
            />

            {/* Center play button */}
            {!isPlaying && isReady && (
              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-400/90 text-slate-950 shadow-xl shadow-cyan-400/25 backdrop-blur-sm sm:h-20 sm:w-20">
                  <Play className="ms-1 h-7 w-7 fill-current sm:h-9 sm:w-9" />
                </div>
              </div>
            )}

            {/* Loading spinner */}
            {!isReady && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
                  <p className="text-sm text-cyan-200 animate-pulse font-medium tracking-wide">Loading Secure Player...</p>
                </div>
              </div>
            )}

            {/* ── Controls Bar ── */}
            <div
              className={`absolute inset-x-0 bottom-0 z-30 transition-opacity duration-300 ${
                controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

              <div className="relative px-3 pb-2.5 pt-8 sm:px-4 sm:pb-3">
                {/* Progress bar */}
                <div
                  ref={progressBarRef}
                  className="group/bar mb-2.5 h-1 w-full cursor-pointer rounded-full bg-white/20 transition-all hover:h-1.5 sm:mb-3"
                  onClick={seekTo}
                >
                  <div
                    className="relative h-full rounded-full bg-cyan-400 transition-all duration-150 ease-linear"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute -top-1 end-0 h-3 w-3 translate-x-1/2 rounded-full bg-cyan-300 opacity-0 shadow-md shadow-cyan-400/40 transition-opacity group-hover/bar:opacity-100" />
                  </div>
                </div>

                {/* Controls row */}
                <div className="flex items-center justify-between gap-1">
                  {/* Left controls */}
                  <div className="flex items-center gap-1 sm:gap-2">
                    {/* Play/Pause */}
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="rounded-md p-1.5 text-white/90 transition hover:bg-white/10 hover:text-white"
                      aria-label={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? <Pause className="h-4 w-4 sm:h-5 sm:w-5" /> : <Play className="h-4 w-4 fill-current sm:h-5 sm:w-5" />}
                    </button>

                    {/* Volume group */}
                    <div className="group/vol flex items-center gap-1">
                      <button
                        type="button"
                        onClick={toggleMute}
                        className="rounded-md p-1.5 text-white/90 transition hover:bg-white/10 hover:text-white"
                        aria-label={isMuted ? "Unmute" : "Mute"}
                      >
                        <VolumeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      <div
                        ref={volumeBarRef}
                        className="hidden h-1 w-0 cursor-pointer rounded-full bg-white/20 transition-all group-hover/vol:w-16 sm:block sm:group-hover/vol:w-20"
                        onClick={setVolumeFromClick}
                      >
                        <div
                          className="h-full rounded-full bg-white/70"
                          style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Time */}
                    <span className="select-none text-[10px] font-medium tabular-nums text-white/60 sm:text-xs">
                      {fmt(currentTime)}<span className="text-white/30"> / </span>{fmt(duration)}
                    </span>
                  </div>

                  {/* Right controls */}
                  <div className="flex items-center gap-1">
                    {/* Speed selector */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                        className="rounded-md px-1.5 py-1 text-[10px] font-semibold text-white/80 transition hover:bg-white/10 hover:text-white sm:text-xs"
                      >
                        {speed === 1 ? "1x" : `${speed}x`}
                      </button>
                      {showSpeedMenu && (
                        <div className="absolute bottom-full end-0 mb-2 overflow-hidden rounded-lg border border-slate-700 bg-slate-900/95 py-1 shadow-xl backdrop-blur-md">
                          {SPEED_OPTIONS.map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setPlaybackSpeed(r)}
                              className={`block w-full px-4 py-1.5 text-start text-xs transition ${
                                speed === r
                                  ? "bg-cyan-400/15 text-cyan-300"
                                  : "text-white/70 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              {r}x
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Fullscreen */}
                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      className="rounded-md p-1.5 text-white/90 transition hover:bg-white/10 hover:text-white"
                      aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                    >
                      {isFullscreen ? <Minimize className="h-4 w-4 sm:h-5 sm:w-5" /> : <Maximize className="h-4 w-4 sm:h-5 sm:w-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-center text-slate-500">
            <div>
              <PlayCircle className="mx-auto mb-3 h-10 w-10" />
              <p className="text-sm">No video link has been added yet.</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Completion Button ── */}
      <Button
        onClick={markComplete}
        disabled={saving || done || !secureUrl || !canComplete}
        variant={done ? "secondary" : "primary"}
        className={done ? "bg-emerald-500/20 text-emerald-400" : "bg-cyan-600 hover:bg-cyan-700 text-white"}
      >
        {done ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <PlayCircle className="h-4 w-4 mr-2" />}
        {done
          ? "Video completed"
          : saving
            ? "Saving..."
            : canComplete
              ? "Mark video complete"
              : "Watch at least 80% to complete"}
      </Button>
    </div>
  );
}
