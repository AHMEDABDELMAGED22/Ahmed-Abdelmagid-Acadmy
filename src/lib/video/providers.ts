import type { VideoProvider } from "@/lib/types";

export interface VideoEmbed {
  provider: VideoProvider;
  providerVideoId: string | null;
  embedUrl: string | null;
}

/**
 * Called when the instructor saves a video URL.
 * Extracts the provider video ID and generates the embed URL for storage.
 */
export function resolveVideoEmbed(url: string, provider: VideoProvider = "youtube"): VideoEmbed {
  if (provider === "youtube") {
    const id = extractYouTubeId(url);
    return {
      provider,
      providerVideoId: id,
      embedUrl: id ? buildYouTubeEmbedUrl(id) : null,
    };
  }

  if (provider === "vimeo") {
    const id = extractVimeoId(url);
    return {
      provider,
      providerVideoId: id,
      embedUrl: id ? buildVimeoEmbedUrl(id) : null,
    };
  }

  if (provider === "bunny") {
    const extracted = extractBunnyId(url);
    return {
      provider,
      providerVideoId: extracted?.videoId || url,
      embedUrl: extracted ? `https://iframe.mediadelivery.net/embed/${extracted.libraryId}/${extracted.videoId}` : url,
    };
  }

  return {
    provider,
    providerVideoId: null,
    embedUrl: url,
  };
}

/**
 * Called at request time by the secure API route.
 * Generates a fresh embed URL from provider + videoId without
 * exposing any stored URLs to the client.
 *
 * FUTURE: For Bunny/Mux, this is where you would generate
 * a short-lived signed token instead of a static URL.
 */
export function generateSecureEmbedUrl(provider: VideoProvider, videoId: string): string | null {
  switch (provider) {
    case "youtube":
      return buildYouTubeEmbedUrl(videoId);
    case "vimeo":
      return buildVimeoEmbedUrl(videoId);
    case "bunny":
      // FUTURE: Generate signed Bunny Token here
      // return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${signedToken}`;
      return null;
    case "mux":
      // FUTURE: Generate signed Mux JWT here
      // return `https://stream.mux.com/${playbackId}.m3u8?token=${signedJwt}`;
      return null;
    default:
      return null;
  }
}

/* ── YouTube ── */

function buildYouTubeEmbedUrl(videoId: string): string {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    iv_load_policy: "3",
    enablejsapi: "1",
    controls: "0",
    disablekb: "1",
    fs: "0",
    showinfo: "0",
    cc_load_policy: "0",
  });
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

/* ── Vimeo ── */

function buildVimeoEmbedUrl(videoId: string): string {
  return `https://player.vimeo.com/video/${videoId}?dnt=1&api=1&controls=0`;
}

/* ── Extractors ── */

function extractVimeoId(url: string) {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match?.[1] || null;
}

function extractBunnyId(url: string) {
  const match = url.match(/mediadelivery\.net\/(?:embed|play)\/([^\/]+)\/([^\/?\"']+)/);
  return match ? { libraryId: match[1], videoId: match[2] } : null;
}

function extractYouTubeId(url: string) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}
