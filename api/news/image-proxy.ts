export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  const host = req.headers?.host || "localhost";
  const urlObj = new URL(req.url || "/", `http://${host}`);
  const targetUrl = urlObj.searchParams.get("url") || "";

  if (!targetUrl || !targetUrl.startsWith("http")) {
    res.statusCode = 400;
    res.end("URL inválida");
    return;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const imgRes = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (imgRes.ok) {
      const contentType = imgRes.headers.get("content-type") || "image/jpeg";
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      res.statusCode = 200;
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=604800, immutable");
      res.end(buffer);
      return;
    }
  } catch {
    // Continue to fallback
  }

  // Graceful fallback: Redirect to reliable high-res cover rather than returning a broken image
  const fallback = "https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=1200&auto=format&fit=crop&q=80";
  res.writeHead(302, { Location: fallback });
  res.end();
}
