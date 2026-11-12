import { handleCinemaVttRequest } from '../_cinemaHandler.js';

export default async function handler(req: any, res: any) {
  return handleCinemaVttRequest(req, res);
}
