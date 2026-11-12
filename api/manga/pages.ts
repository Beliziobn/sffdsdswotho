import { handleMangaPagesRequest } from '../_mangaHandler.js';

export default async function handler(req: any, res: any) {
  return handleMangaPagesRequest(req, res);
}
