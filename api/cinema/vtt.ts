import { handleCinemaVttRequest } from '../../src/lib/cinemaServerPlugin';

export default async function handler(req: any, res: any) {
  return handleCinemaVttRequest(req, res);
}
