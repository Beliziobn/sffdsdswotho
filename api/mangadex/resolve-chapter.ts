import { handleMangadexResolveChapterRequest } from '../_mangaHandler.js';

export default async function handler(req: any, res: any) {
  return handleMangadexResolveChapterRequest(req, res);
}
