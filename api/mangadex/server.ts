import { handleMangadexServerRequest } from '../_mangaHandler.js';

export default async function handler(req: any, res: any) {
  return handleMangadexServerRequest(req, res);
}
