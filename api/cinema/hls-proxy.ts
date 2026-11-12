import { handleCinemaHlsProxyRequest } from '../../src/lib/cinemaServerPlugin';

export default async function handler(req: any, res: any) {
  return handleCinemaHlsProxyRequest(req, res);
}
