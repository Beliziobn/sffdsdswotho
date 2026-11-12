import { handleCinemaMp4ProxyRequest } from '../../src/lib/cinemaServerPlugin';

export default async function handler(req: any, res: any) {
  return handleCinemaMp4ProxyRequest(req, res);
}
