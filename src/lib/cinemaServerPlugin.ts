import type { Plugin } from 'vite';
import {
  handleCinemaResolveRequest,
  handleCinemaVttRequest,
  handleCinemaMp4ProxyRequest,
  handleCinemaHlsProxyRequest,
} from '../../api/_cinemaHandler.js';

export interface SubtitleCue {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface ResolvedStream {
  id: string;
  server: string;
  label: string;
  type: 'mp4' | 'hls';
  audioMode: 'dublado' | 'legendado' | 'original' | 'multi';
  langCode: string;
  quality: string;
  url: string;
  proxyUrl: string;
}

export function cinemaStreamingPlugin(): Plugin {
  const registerMiddlewares = (server: any) => {
    server.middlewares.use('/api/cinema/resolve', handleCinemaResolveRequest);
    server.middlewares.use('/api/cinema/vtt', handleCinemaVttRequest);
    server.middlewares.use('/api/cinema/mp4-proxy', handleCinemaMp4ProxyRequest);
    server.middlewares.use('/api/cinema/hls-proxy', handleCinemaHlsProxyRequest);
    server.middlewares.use('/api/anime/hls-manifest', handleCinemaHlsProxyRequest);
    server.middlewares.use('/api/anime/proxy', handleCinemaHlsProxyRequest);
  };

  return {
    name: 'wotho-cinema-streaming-plugin',
    configureServer(server) {
      registerMiddlewares(server);
    },
    configurePreviewServer(server) {
      registerMiddlewares(server);
    },
  };
}
