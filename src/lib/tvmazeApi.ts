/**
 * TVmaze Public API Integration (No API Key required)
 * Provides real-time TV series metadata, episode guides, and schedules.
 */

export interface TVmazeEpisode {
  id: number;
  name: string;
  season: number;
  number: number;
  runtime: number | null;
  summary: string | null;
  image: { medium: string; original: string } | null;
}

export async function fetchTVmazeEpisodesByTitle(title: string): Promise<TVmazeEpisode[]> {
  try {
    const searchRes = await fetch(
      `https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(title)}&embed=episodes`
    );
    if (!searchRes.ok) return [];
    const data = await searchRes.json();
    const episodes = data?._embedded?.episodes;
    if (!Array.isArray(episodes)) return [];
    return episodes.map((ep: TVmazeEpisode) => ({
      ...ep,
      summary: ep.summary ? ep.summary.replace(/<[^>]+>/g, "") : null,
    }));
  } catch {
    return [];
  }
}
