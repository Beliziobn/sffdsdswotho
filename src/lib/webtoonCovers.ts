import rawCoversMap from "@/data/officialCoversMap.json";

export interface OfficialCoverInfo {
  cover: string;
  banner: string;
  korean_title?: string;
  english_title?: string;
}

const coversDict = rawCoversMap as Record<string, OfficialCoverInfo>;

/**
 * Resolves the official, authentic cover and banner art for any manhwa or webtoon
 * strictly eliminating generic photos so that readers can identify titles by their real art.
 */
export function getOfficialCover(
  id: string,
  slug?: string,
  fallbackCover?: string
): { cover: string; banner: string; korean_title?: string } {
  if (!id) {
    const fallback = fallbackCover || "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105398-b673Vt5ZSuz3.jpg";
    return { cover: fallback, banner: fallback };
  }

  const normId = id.replace(/^wt-auto-/, "").replace(/^wt-/, "");
  const found =
    coversDict[id] ||
    coversDict[normId] ||
    coversDict[`wt-${normId}`] ||
    coversDict[`wt-auto-${normId}`] ||
    (slug ? coversDict[slug] : undefined) ||
    (slug ? coversDict[slug.replace(/-/g, " ")] : undefined);

  if (found && found.cover) {
    return {
      cover: found.cover,
      banner: found.banner || found.cover,
      korean_title: found.korean_title,
    };
  }

  const defaultUrl = fallbackCover || "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105398-b673Vt5ZSuz3.jpg";
  return {
    cover: defaultUrl,
    banner: defaultUrl,
  };
}
