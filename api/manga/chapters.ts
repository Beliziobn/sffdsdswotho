import { handleMangaChaptersRequest } from '../_mangaHandler.js';

export default async function handler(req: any, res: any) {
  return handleMangaChaptersRequest(req, res);
}
