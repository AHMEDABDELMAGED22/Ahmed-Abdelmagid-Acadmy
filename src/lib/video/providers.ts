import type { VideoProvider } from "@/lib/types";

export interface VideoEmbed {
  provider: VideoProvider;
  providerVideoId: string | null;
  embedUrl: string | null;
}

export function resolveVideoEmbed(url: string, provider: VideoProvider = "youtube"): VideoEmbed {
  if (provider === "youtube") {
    const id = extractYouTubeId(url);
    return {
      provider,
      providerVideoId: id,
      embedUrl: id
        ? `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1&iv_load_policy=3`
        : null,
    };
  }

  return {
    provider,
    providerVideoId: null,
    embedUrl: url,
  };
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
