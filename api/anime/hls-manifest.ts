import { handleCinemaHlsProxyRequest } from '../_cinemaHandler.js';

export default async function handler(req: any, res: any) {
  return handleCinemaHlsProxyRequest(req, res);
}
