import { handleCinemaResolveRequest } from '../../src/lib/cinemaServerPlugin';

export default async function handler(req: any, res: any) {
  return handleCinemaResolveRequest(req, res);
}
