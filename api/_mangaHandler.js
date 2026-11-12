/**
 * Unified Manga, MangaDex & Multi-Source Pages Resolver & Image Proxy
 * High-speed, self-contained ESM handler running on both Vite Connect and Vercel Serverless.
 */

const MANGA_PATH_MAP = {
  'solo-leveling': '/manga/2557/solo-leveling',
  'frieren-beyond-journeys-end': '/manga/5035/sousou-no-frieren',
  'jujutsu-kaisen-culling-game': '/manga/2085/jujutsu-kaisen',
  'demon-slayer-infinity-castle': '/manga/2285/kimetsu-no-yaiba',
  'chainsaw-man': '/manga/723/chainsaw-man',
  'spy-x-family': '/manga/4143/spy-x-family',
  'kaiju-no-8': '/manga/5098/kaijuu-8-gou',
  'orb-movements-of-the-earth': '/manga/6526/chi-chikyuu-no-undou-ni-tsuite',
  'dandadan': '/manga/5460/dandadan',
  'attack-on-titan': '/manga/5/shingeki-no-kyojin',
  'vinland-saga': '/manga/4741/vinland-saga',
  'bleach-tybw': '/manga/552/bleach',
  'monster': '/manga/3/monster',
  'apothecary-diaries': '/manga/2523/kusuriya-no-hitorigoto',
  're-zero': '/manga/3535/re-zero-kara-hajimeru-isekai-seikatsu-daiisshou-outo-no-ichinichi-hen',
  'oshi-no-ko': '/manga/5053/oshi-no-ko',
  'blue-lock': '/manga/580/blue-lock',
  'dungeon-meshi': '/manga/1092/dungeon-meshi',
  'black-clover': '/manga/524/black-clover',
  'jojos-bizarre-adventure': '/manga/2061/jojo-s-bizarre-adventure-color',
  'steel-ball-run': '/manga/2067/jojo-no-kimyou-na-bouken-part-7-steel-ball-run',
  'dragon-ball': '/manga/1069/dragon-ball-super',
  'naruto': '/manga/3069/naruto',
  'boruto': '/manga/7486/boruto-two-blue-vortex',
  'one-piece': '/manga/2/one-piece',
  'hunter-x-hunter': '/manga/1828/hunter-x-hunter',
  'my-hero-academia': '/manga/601/boku-no-hero-academia',
  'death-note': '/manga/938/death-note',
  'fullmetal-alchemist-brotherhood': '/manga/6/fullmetal-alchemist',
  'sakamoto-days': '/manga/5281/sakamoto-days',
  'dr-stone': '/manga/1059/dr-stone',
  'mob-psycho-100': '/manga/2922/mob-psycho-100',
  'shangri-la-frontier': '/manga/5194/shangri-la-frontier-kusoge-hunter-kamige-ni-idoman-to-su',
  'mashle': '/manga/4958/mashle',
  'wind-breaker': '/manga/5830/wind-breaker-nii-satoru',
  'jigokuraku': '/manga/2069/jigokuraku',
  'classroom-of-the-elite': '/manga/2330/youkoso-jitsuryoku-shijou-shugi-no-kyoushitsu-e',
};

const MANGADEX_ID_MAP = {
  'solo-leveling': '32d76d19-8a05-4db0-9fc2-e0b0648fe9d0',
  'frieren-beyond-journeys-end': 'b0b721ff-c388-4486-aa0f-c8b0e92152b0',
  'jujutsu-kaisen-culling-game': 'c52b2ce3-7f95-469c-96b0-479524fb7a1a',
  'demon-slayer-infinity-castle': '789642f8-ca89-4e4e-8f7b-eee4d17ea08b',
  'chainsaw-man': 'a77742b1-b6a4-4f14-946f-c1e550e50209',
  'spy-x-family': '626f8e28-1114-411a-8219-fc3be2d02c52',
  'kaiju-no-8': '351493f6-fb7c-47ea-a2f0-f9ab723b7e65',
  'orb-movements-of-the-earth': '5d8525b4-d57e-4050-84c4-754668ba89f2',
  'dandadan': '5f95b349-41e9-4467-bc18-80f4f9547d69',
  'attack-on-titan': '3046a5dd-5699-4277-bf00-11b14a77769b',
  'vinland-saga': '5d63ce37-0105-408a-b9c1-40ef3dd74400',
  'bleach-tybw': 'c392c6ec-071a-4c28-9824-3453b34f7831',
  'monster': '3a521404-58a4-49c5-a6e5-4f4c898b584a',
  'apothecary-diaries': 'aa924f72-9118-4e48-936b-a25e8362540d',
  're-zero': 'b91c1065-27a4-4ea8-aa92-f04bf4a01490',
  'oshi-no-ko': '2961b79e-473c-4ab6-9c22-23ae513d0d32',
  'blue-lock': '1f5f3e4b-9721-4876-b6b6-b8f4185f5431',
  'dungeon-meshi': 'd90ea637-a31a-44ba-a788-06e00171ec38',
  'black-clover': '022378f4-2794-4632-a5e2-e1d5ba732c44',
  'jojos-bizarre-adventure': '10442d87-f57b-48d6-96a2-72661e63a167',
  'steel-ball-run': '10442d87-f57b-48d6-96a2-72661e63a167',
  'dragon-ball': '8665790c-ee5e-49b0-a35a-ddc99b867c83',
  'naruto': '6b1d830b-0447-494b-a019-3db9dfd10cfd',
  'boruto': '46f88d22-1d6d-4959-a579-22a7f5eb3343',
  'one-piece': 'a1c7c817-4e59-43b7-9365-09675a149a6f',
  'hunter-x-hunter': '8e38d7a1-c27a-4c8d-b3ef-ff4874457788',
  'my-hero-academia': '4f3bcae4-2d96-41f9-9528-7d7780d6b638',
  'death-note': '737a846b-30eb-4581-9964-44b41362e873',
  'fullmetal-alchemist-brotherhood': '59e22306-be51-40be-be4c-a1147a7596ad',
  'sakamoto-days': 'c5598fc5-a92c-4861-a482-aa86915e718f',
  'dr-stone': 'f8326a09-e854-460c-b26a-e24b2ab75865',
  'mob-psycho-100': '01fc2bb2-26f5-46f3-a15e-48a03a676b7e',
  'shangri-la-frontier': '69b008d5-17a4-4dfc-acfa-6e9faea1c4eb',
  'mashle': '6e44b94a-81a1-4fc3-a9d2-dfbe2a7b8e55',
  'wind-breaker': 'c73cc9a0-2f94-4d89-b1d7-d7ff7d3fa8f0',
  'jigokuraku': '6fb18a4a-10f8-45be-b921-689360d5bfa4',
  'classroom-of-the-elite': '765275e7-2b73-455b-b9fb-26466f28cfc6',
};

const chaptersCache = new Map();
const pagesCache = new Map();
const imageCache = new Map();
const resolvedMangaIdCache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

function getUrl(req) {
  return new URL(req.url || '', `http://${req.headers?.host || 'localhost:3000'}`);
}

async function resolveRealMangaDexId(mangaId, title) {
  if (mangaId && mangaId.length === 36 && !mangaId.includes('0000-4000-8000')) {
    return mangaId;
  }
  if (!title) return null;
  const cleanTitle = title.trim().toLowerCase();
  if (resolvedMangaIdCache.has(cleanTitle)) {
    return resolvedMangaIdCache.get(cleanTitle);
  }
  for (const [key, id] of Object.entries(MANGADEX_ID_MAP)) {
    if (cleanTitle.includes(key.replace(/-/g, ' ')) || key.includes(cleanTitle)) {
      resolvedMangaIdCache.set(cleanTitle, id);
      return id;
    }
  }
  try {
    const sRes = await fetch(
      `https://api.mangadex.org/manga?title=${encodeURIComponent(title)}&limit=5&order[followedCount]=desc`,
      { headers: { 'User-Agent': 'WorscoiReader/1.0', Accept: 'application/json' }, signal: AbortSignal.timeout(5000) }
    );
    if (sRes.ok) {
      const sJson = await sRes.json();
      const firstId = sJson?.data?.[0]?.id;
      if (firstId) {
        resolvedMangaIdCache.set(cleanTitle, firstId);
        return firstId;
      }
    }
  } catch {}
  return null;
}

export async function fetchMangaChaptersInternal(animeId, customPath) {
  const targetPath = customPath || MANGA_PATH_MAP[animeId];
  if (!targetPath) return null;

  const cacheKey = `manga_chaps_${targetPath}`;
  const cached = chaptersCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const upstreamRes = await fetch(`https://mangapill.com${targetPath}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!upstreamRes.ok) return null;

    const html = await upstreamRes.text();
    const matches = [...html.matchAll(/href="(\/chapters\/[^"]+)"[^>]*>([^<]+)<\/a>/g)];
    if (!matches.length) return null;

    const chapters = matches.map((match) => {
      const url = match[1];
      const rawName = match[2].trim();
      const numMatch = rawName.match(/Chapter\s+([\d.]+)/i);
      const num = numMatch ? parseFloat(numMatch[1]) : 0;
      return {
        id: url.replace('/chapters/', '').replace(/\//g, '-'),
        chapterUrl: url,
        number: num,
        title: rawName.replace(/^Chapter\s+/i, 'Capítulo '),
        isFree: true,
      };
    });

    chapters.sort((a, b) => a.number - b.number);
    const payload = { success: true, animeId, total: chapters.length, chapters };
    chaptersCache.set(cacheKey, { data: payload, timestamp: Date.now() });
    return payload;
  } catch {
    return null;
  }
}

async function resolvePagesFromMangaPill(chapterUrl, animeId, chapterNumber) {
  let cleanUrl = chapterUrl || '';
  if (cleanUrl && !cleanUrl.startsWith('/') && !cleanUrl.startsWith('http')) {
    if (/^\d+-\d+-/.test(cleanUrl)) {
      cleanUrl = cleanUrl.replace(/^(\d+-\d+)-(.+)$/, '/chapters/$1/$2');
    } else {
      cleanUrl = '';
    }
  }

  if (!cleanUrl && animeId && MANGA_PATH_MAP[animeId]) {
    const chapsData = await fetchMangaChaptersInternal(animeId);
    if (chapsData?.chapters?.length) {
      const targetNum = parseFloat(chapterNumber || '1');
      const found =
        chapsData.chapters.find((c) => c.number === targetNum) ||
        chapsData.chapters.find((c) => Math.floor(c.number) === Math.floor(targetNum)) ||
        chapsData.chapters[0];
      if (found?.chapterUrl) cleanUrl = found.chapterUrl;
    }
  }

  if (!cleanUrl) return null;

  const cacheKey = `manga_pages_${cleanUrl}`;
  const cached = pagesCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.pages;
  }

  const fullTarget = cleanUrl.startsWith('http') ? cleanUrl : `https://mangapill.com${cleanUrl}`;
  const upstreamRes = await fetch(fullTarget, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Referer: 'https://mangapill.com/',
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!upstreamRes.ok) return null;

  const html = await upstreamRes.text();
  const rawImgs = [...html.matchAll(/data-src="([^"]+)"/g)].map((m) => m[1]);
  const proxiedPages = rawImgs.map((u) => `/api/proxy/manga-image?url=${encodeURIComponent(u)}`);

  if (proxiedPages.length > 0) {
    pagesCache.set(cacheKey, { pages: proxiedPages, timestamp: Date.now() });
    return proxiedPages;
  }
  return null;
}

export async function handleMangaChaptersRequest(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const urlObj = getUrl(req);
    const animeId = urlObj.searchParams.get('animeId') || '';
    const customPath = urlObj.searchParams.get('mangaPath') || MANGA_PATH_MAP[animeId];

    if (!customPath && !animeId) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: `Nenhum caminho de mangá mapeado para o anime: ${animeId}` }));
      return;
    }

    const payload = await fetchMangaChaptersInternal(animeId, customPath);
    if (!payload || !payload.chapters?.length) {
      // Fallback: MangaDex Feed chapters
      const mdId = MANGADEX_ID_MAP[animeId] || (await resolveRealMangaDexId(null, animeId.replace(/-/g, ' ')));
      if (mdId) {
        const mdRes = await fetch(`https://api.mangadex.org/manga/${mdId}/aggregate`, {
          headers: { 'User-Agent': 'WorscoiReader/1.0', Accept: 'application/json' },
          signal: AbortSignal.timeout(6000),
        });
        if (mdRes.ok) {
          const mdData = await mdRes.json();
          const chList = [];
          for (const vol of Object.values(mdData.volumes || {})) {
            for (const [cNum, cObj] of Object.entries(vol.chapters || {})) {
              chList.push({
                id: cObj.id,
                chapterUrl: '',
                number: parseFloat(cNum) || 1,
                title: `Capítulo ${cNum}`,
                isFree: true,
              });
            }
          }
          if (chList.length > 0) {
            chList.sort((a, b) => a.number - b.number);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, animeId, total: chList.length, chapters: chList }));
            return;
          }
        }
      }

      res.statusCode = 502;
      res.end(JSON.stringify({ error: 'Upstream manga catalog unreachable' }));
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.end(JSON.stringify(payload));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err?.message || 'Error fetching manga chapters' }));
  }
}

export async function handleMangaPagesRequest(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const urlObj = getUrl(req);
    const chapterUrl = urlObj.searchParams.get('chapterUrl') || '';
    const animeId = urlObj.searchParams.get('animeId') || '';
    const chapterNum = parseFloat(urlObj.searchParams.get('chapterNumber') || '1');

    const pages = await resolvePagesFromMangaPill(chapterUrl, animeId, chapterNum);
    if (pages && pages.length > 0) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=1800');
      res.end(JSON.stringify({ success: true, count: pages.length, pages, chapterUrl }));
      return;
    }

    // Secondary fallback: MangaDex At-Home resolver
    const mdId = MANGADEX_ID_MAP[animeId] || (await resolveRealMangaDexId(null, animeId.replace(/-/g, ' ')));
    if (mdId) {
      const aggRes = await fetch(`https://api.mangadex.org/manga/${mdId}/aggregate`, {
        headers: { 'User-Agent': 'WorscoiReader/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(6000),
      });
      if (aggRes.ok) {
        const aggData = await aggRes.json();
        let targetChId = null;
        for (const vol of Object.values(aggData.volumes || {})) {
          if (vol.chapters) {
            const match = vol.chapters[String(chapterNum)] || vol.chapters[String(Math.floor(chapterNum))];
            if (match?.id) {
              targetChId = match.id;
              break;
            }
          }
        }
        if (targetChId) {
          const srvRes = await fetch(`https://api.mangadex.org/at-home/server/${targetChId}`, {
            headers: { 'User-Agent': 'WorscoiReader/1.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(6000),
          });
          if (srvRes.ok) {
            const srvJson = await srvRes.json();
            const { baseUrl, chapter } = srvJson;
            if (baseUrl && chapter?.hash && chapter?.data?.length) {
              const mdPages = chapter.data.map(
                (f) => `/api/proxy/manga-image?url=${encodeURIComponent(`${baseUrl}/data/${chapter.hash}/${f}`)}`
              );
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Cache-Control', 'public, max-age=1800');
              res.end(JSON.stringify({ success: true, count: mdPages.length, pages: mdPages, chapterUrl: targetChId }));
              return;
            }
          }
        }
      }
    }

    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Could not resolve pages for this chapter' }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err?.message || 'Error fetching manga pages' }));
  }
}

export async function handleMangadexResolveChapterRequest(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const urlObj = getUrl(req);
    const rawMangaId = urlObj.searchParams.get('mangaId');
    const title = urlObj.searchParams.get('title');
    const chapter = urlObj.searchParams.get('chapter') || '1';
    const lang = (urlObj.searchParams.get('lang') || 'pt').toLowerCase();
    const quality = urlObj.searchParams.get('quality') === 'dataSaver' ? 'dataSaver' : 'data';

    const mangaId = await resolveRealMangaDexId(rawMangaId, title);

    const langCodes =
      lang === 'pt' || lang === 'pt-br'
        ? ['pt-br', 'pt']
        : lang === 'en'
        ? ['en']
        : lang === 'ja'
        ? ['ja', 'ja-ro']
        : lang === 'ko'
        ? ['ko']
        : [lang];

    let resolvedChapterId = null;
    let finalLanguageUsed = lang;

    // 1. Check MangaDex aggregate for requested language
    if (mangaId) {
      try {
        const langQuery = langCodes.map((l) => `translatedLanguage[]=${l}`).join('&');
        const aggRes = await fetch(`https://api.mangadex.org/manga/${mangaId}/aggregate?${langQuery}`, {
          headers: { 'User-Agent': 'WorscoiReader/1.0', Accept: 'application/json' },
          signal: AbortSignal.timeout(6000),
        });
        if (aggRes.ok) {
          const aggData = await aggRes.json();
          const targetNum = String(chapter);
          const targetNumFloat = String(parseFloat(chapter) || 1);
          for (const vol of Object.values(aggData.volumes || {})) {
            if (vol.chapters) {
              const match = vol.chapters[targetNum] || vol.chapters[targetNumFloat];
              if (match?.id) {
                resolvedChapterId = match.id;
                break;
              }
            }
          }
        }
      } catch (err) {
        console.warn('MangaDex aggregate error:', err);
      }
    }

    // 2. If found on MangaDex in requested language, fetch pages from @at-home node
    if (resolvedChapterId) {
      try {
        const srvRes = await fetch(`https://api.mangadex.org/at-home/server/${resolvedChapterId}`, {
          headers: { 'User-Agent': 'WorscoiReader/1.0', Accept: 'application/json' },
          signal: AbortSignal.timeout(8000),
        });
        if (srvRes.ok) {
          const srvJson = await srvRes.json();
          const baseUrl = srvJson?.baseUrl;
          const chData = srvJson?.chapter;
          if (baseUrl && chData?.hash) {
            const files =
              quality === 'dataSaver' && Array.isArray(chData.dataSaver) && chData.dataSaver.length > 0
                ? chData.dataSaver
                : chData.data || chData.dataSaver || [];
            const folder = quality === 'dataSaver' && chData.dataSaver?.length ? 'data-saver' : 'data';
            const pages = files.map(
              (f) => `/api/proxy/manga-image?url=${encodeURIComponent(`${baseUrl}/${folder}/${chData.hash}/${f}`)}`
            );
            if (pages.length > 0) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Cache-Control', 'public, max-age=1800');
              res.end(
                JSON.stringify({
                  success: true,
                  chapterId: resolvedChapterId,
                  languageUsed: finalLanguageUsed,
                  pages,
                })
              );
              return;
            }
          }
        }
      } catch (err) {
        console.warn('MangaDex at-home server fetch error:', err);
      }
    }

    const animeIdParam = urlObj.searchParams.get('animeId') || '';

    // 3. Fallback: High-res mirror from MangaPill for all 39 franchises
    let matchedAnimeId = animeIdParam;
    if (!matchedAnimeId || !MANGA_PATH_MAP[matchedAnimeId]) {
      const cleanTitle = (title || '').toLowerCase();
      for (const [k, id] of Object.entries(MANGADEX_ID_MAP)) {
        if (id === mangaId || cleanTitle.includes(k.replace(/-/g, ' ')) || k.includes(cleanTitle)) {
          matchedAnimeId = k;
          break;
        }
      }
    }

    const mirrorPages = await resolvePagesFromMangaPill('', matchedAnimeId, chapter);
    if (mirrorPages && mirrorPages.length > 0) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=1800');
      res.end(
        JSON.stringify({
          success: true,
          chapterId: `mirror-${chapter}`,
          languageUsed: lang,
          pages: mirrorPages,
        })
      );
      return;
    }

    // 4. Secondary MangaDex Fallback: Try all languages on MangaDex
    if (mangaId) {
      try {
        const broadAggRes = await fetch(`https://api.mangadex.org/manga/${mangaId}/aggregate`, {
          headers: { 'User-Agent': 'WorscoiReader/1.0', Accept: 'application/json' },
          signal: AbortSignal.timeout(6000),
        });
        if (broadAggRes.ok) {
          const broadAggData = await broadAggRes.json();
          const targetNum = String(chapter);
          let broadChId = null;
          for (const vol of Object.values(broadAggData.volumes || {})) {
            if (vol.chapters) {
              const match = vol.chapters[targetNum] || vol.chapters[String(parseFloat(targetNum) || 1)];
              if (match?.id) {
                broadChId = match.id;
                break;
              }
            }
          }
          if (broadChId) {
            const srvRes = await fetch(`https://api.mangadex.org/at-home/server/${broadChId}`, {
              headers: { 'User-Agent': 'WorscoiReader/1.0', Accept: 'application/json' },
              signal: AbortSignal.timeout(8000),
            });
            if (srvRes.ok) {
              const srvJson = await srvRes.json();
              const baseUrl = srvJson?.baseUrl;
              const chData = srvJson?.chapter;
              if (baseUrl && chData?.hash) {
                const files = chData.data || chData.dataSaver || [];
                const pages = files.map(
                  (f) => `/api/proxy/manga-image?url=${encodeURIComponent(`${baseUrl}/data/${chData.hash}/${f}`)}`
                );
                if (pages.length > 0) {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.setHeader('Cache-Control', 'public, max-age=1800');
                  res.end(
                    JSON.stringify({
                      success: true,
                      chapterId: broadChId,
                      languageUsed: 'oficial',
                      pages,
                    })
                  );
                  return;
                }
              }
            }
          }
        }
      } catch {}
    }

    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, pages: [], error: 'Capítulo não encontrado no momento' }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: err?.message || 'Error resolving chapter' }));
  }
}

export async function handleMangadexFeedRequest(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const urlObj = getUrl(req);
    const rawMangaId = urlObj.searchParams.get('mangaId');
    const title = urlObj.searchParams.get('title');
    const lang = (urlObj.searchParams.get('lang') || 'pt-br').toLowerCase();
    const limit = urlObj.searchParams.get('limit') || '100';

    const mangaId = await resolveRealMangaDexId(rawMangaId, title);
    if (!mangaId) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Missing mangaId' }));
      return;
    }

    let upstream = `https://api.mangadex.org/manga/${mangaId}/feed?order[chapter]=asc&limit=${limit}&includes[]=scanlation_group&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica`;
    if (lang === 'pt-br' || lang === 'pt') {
      upstream += '&translatedLanguage[]=pt-br&translatedLanguage[]=pt';
    } else if (lang === 'en') {
      upstream += '&translatedLanguage[]=en';
    } else if (lang === 'ko') {
      upstream += '&translatedLanguage[]=ko';
    } else if (lang === 'ja') {
      upstream += '&translatedLanguage[]=ja&translatedLanguage[]=ja-ro';
    }

    const upRes = await fetch(upstream, {
      headers: { 'User-Agent': 'WorscoiReader/1.0', Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    const json = await upRes.text();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.end(json);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err?.message || 'Proxy error' }));
  }
}

export async function handleMangadexServerRequest(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const urlObj = getUrl(req);
    const chapterId = urlObj.searchParams.get('chapterId');
    if (!chapterId) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Missing chapterId' }));
      return;
    }
    const upRes = await fetch(`https://api.mangadex.org/at-home/server/${chapterId}`, {
      headers: { 'User-Agent': 'WorscoiReader/1.0', Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    const json = await upRes.text();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=1800');
    res.end(json);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err?.message || 'Server proxy error' }));
  }
}

export async function handleMangaImageProxyRequest(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const urlObj = getUrl(req);
    const targetUrl = urlObj.searchParams.get('url');

    if (!targetUrl) {
      res.statusCode = 400;
      res.end('Missing url parameter');
      return;
    }

    // Cache hit
    const cached = imageCache.get(targetUrl);
    if (cached && Date.now() - cached.timestamp < 1000 * 60 * 60 * 2) {
      res.statusCode = 200;
      res.setHeader('Content-Type', cached.contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      res.end(cached.buffer);
      return;
    }

    const reqHeaders = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    };

    if (targetUrl.includes('mangadex.org') || targetUrl.includes('mangadex.network')) {
      reqHeaders['Referer'] = 'https://mangadex.org/';
    } else if (targetUrl.includes('mangapill.com') || targetUrl.includes('readdetectiveconan.com')) {
      reqHeaders['Referer'] = 'https://mangapill.com/';
    } else if (targetUrl.includes('webtoons.com') || targetUrl.includes('pstatic.net') || targetUrl.includes('webtoon-phinf')) {
      reqHeaders['Referer'] = 'https://www.webtoons.com/';
    }

    let upstreamRes = await fetch(targetUrl, { headers: reqHeaders, signal: AbortSignal.timeout(12000) });

    // Fallback: If MangaDex at-home node returned 404, try canonical uploads.mangadex.org URL
    if (!upstreamRes.ok && (targetUrl.includes('mangadex.network') || targetUrl.includes('mangadex.org'))) {
      const match = targetUrl.match(/\/(data|data-saver)\/([a-f0-9]+)\/([^/?]+)/i);
      if (match) {
        const canonicalUrl = `https://uploads.mangadex.org/${match[1]}/${match[2]}/${match[3]}`;
        const canRes = await fetch(canonicalUrl, { headers: { 'Referer': 'https://mangadex.org/' }, signal: AbortSignal.timeout(12000) });
        if (canRes.ok) {
          upstreamRes = canRes;
        }
      }
    }

    if (!upstreamRes.ok) {
      res.statusCode = upstreamRes.status;
      res.end(`Upstream error ${upstreamRes.status}`);
      return;
    }

    const contentType = upstreamRes.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await upstreamRes.arrayBuffer());

    if (imageCache.size > 1200) {
      const firstKey = imageCache.keys().next().value;
      if (firstKey) imageCache.delete(firstKey);
    }
    imageCache.set(targetUrl, { buffer, contentType, timestamp: Date.now() });

    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    res.end(buffer);
  } catch (err) {
    res.statusCode = 500;
    res.end(err?.message || 'Proxy error');
  }
}
