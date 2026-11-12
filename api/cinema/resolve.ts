import { handleCinemaResolveRequest } from '../_cinemaHandler.js';

export default async function handler(req: any, res: any) {
  return handleCinemaResolveRequest(req, res);
}
