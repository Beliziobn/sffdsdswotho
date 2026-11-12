import { handleCinemaMp4ProxyRequest } from '../_cinemaHandler.js';

export default async function handler(req: any, res: any) {
  return handleCinemaMp4ProxyRequest(req, res);
}
