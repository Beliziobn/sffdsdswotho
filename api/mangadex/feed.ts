import { handleMangadexFeedRequest } from '../_mangaHandler.js';

export default async function handler(req: any, res: any) {
  return handleMangadexFeedRequest(req, res);
}
