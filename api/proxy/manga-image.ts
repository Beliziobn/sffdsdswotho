import { handleMangaImageProxyRequest } from '../_mangaHandler.js';

export default async function handler(req: any, res: any) {
  return handleMangaImageProxyRequest(req, res);
}
