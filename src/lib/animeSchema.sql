-- ============================================================================
-- ARQUITETURA DE BANCO DE DADOS - PLATAFORMA DE STREAMING DE ANIMES (WORSCOI)
-- Modelagem Hierárquica Estrita (3 Níveis + Fontes): Anime -> Season -> Episode -> Source
-- Integridade Referencial, Chaves de Unicidade Lógica e Prevenção de Duplicatas
-- ============================================================================

-- 1. Extensões PostgreSQL para UUID e Criptografia SHA-256
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Nível 1: Tabela de Animes (Raiz da Obra e Metadados Oficiais IMDb/TMDB/Jikan/AniList)
CREATE TABLE IF NOT EXISTS animes (
    id VARCHAR(64) PRIMARY KEY,
    slug VARCHAR(128) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    japanese_title VARCHAR(255),
    synopsis TEXT NOT NULL,
    cover_url TEXT NOT NULL,
    banner_url TEXT NOT NULL,
    rating NUMERIC(3, 1) DEFAULT 0.0 CHECK (rating >= 0.0 AND rating <= 10.0),
    rating_count INTEGER DEFAULT 0 CHECK (rating_count >= 0),
    status VARCHAR(32) NOT NULL CHECK (status IN ('Em lançamento', 'Completo', 'Cancelado', 'Pausado')),
    studio VARCHAR(128) NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 1960 AND year <= 2040),
    audio_type VARCHAR(64) DEFAULT 'Dublado & Legendado PT-BR',
    trailer_youtube_id VARCHAR(32) NOT NULL,
    imdb_id VARCHAR(32) UNIQUE,
    tmdb_id INTEGER UNIQUE,
    mal_id INTEGER UNIQUE,
    anilist_id INTEGER UNIQUE,
    kitsu_id INTEGER,
    featured BOOLEAN DEFAULT FALSE,
    trending BOOLEAN DEFAULT FALSE,
    is_deep_philosophical BOOLEAN DEFAULT FALSE,
    rank INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_animes_slug ON animes(slug);
CREATE INDEX IF NOT EXISTS idx_animes_featured ON animes(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_animes_trending ON animes(trending) WHERE trending = TRUE;
CREATE INDEX IF NOT EXISTS idx_animes_rating ON animes(rating DESC);

-- 3. Nível 2: Tabela de Temporadas (Season)
CREATE TABLE IF NOT EXISTS seasons (
    id VARCHAR(64) PRIMARY KEY,
    anime_id VARCHAR(64) NOT NULL REFERENCES animes(id) ON DELETE CASCADE,
    season_number INTEGER NOT NULL CHECK (season_number > 0),
    title VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL,
    synopsis TEXT,
    poster_url TEXT NOT NULL,
    banner_url TEXT,
    episodes_count INTEGER DEFAULT 0 CHECK (episodes_count >= 0),
    trailer_youtube_id VARCHAR(32) NOT NULL,
    mal_id INTEGER,
    anilist_id INTEGER,
    kitsu_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Chave de Unicidade: Um anime não pode ter duas temporadas com o mesmo número
    CONSTRAINT unique_anime_season_number UNIQUE (anime_id, season_number)
);

CREATE INDEX IF NOT EXISTS idx_seasons_anime_id ON seasons(anime_id);
CREATE INDEX IF NOT EXISTS idx_seasons_number ON seasons(anime_id, season_number);

-- 4. Nível 3: Tabela de Episódios (Episode)
CREATE TABLE IF NOT EXISTS episodes (
    id VARCHAR(64) PRIMARY KEY,
    anime_id VARCHAR(64) NOT NULL REFERENCES animes(id) ON DELETE CASCADE,
    season_id VARCHAR(64) NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    season_number INTEGER NOT NULL CHECK (season_number > 0),
    episode_number INTEGER NOT NULL CHECK (episode_number > 0),
    title VARCHAR(255) NOT NULL,
    duration VARCHAR(32) NOT NULL DEFAULT '24m',
    thumbnail_url TEXT NOT NULL,
    synopsis TEXT,
    is_free BOOLEAN DEFAULT TRUE,
    air_date DATE,
    -- Prevenção Crítica de Duplicidade de Mídia:
    content_hash VARCHAR(64) NOT NULL,
    stream_url TEXT NOT NULL,
    youtube_video_id VARCHAR(32),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Chave de Unicidade Lógica Estrita: Um episódio específico por temporada e anime
    CONSTRAINT unique_anime_season_episode UNIQUE (anime_id, season_number, episode_number),
    -- Bloqueia reutilização cega da mesma fonte de vídeo/conteúdo para episódios diferentes
    CONSTRAINT unique_episode_content_hash UNIQUE (content_hash),
    CONSTRAINT unique_episode_stream_url UNIQUE (stream_url)
);

CREATE INDEX IF NOT EXISTS idx_episodes_season_id ON episodes(season_id);
CREATE INDEX IF NOT EXISTS idx_episodes_anime_season ON episodes(anime_id, season_number, episode_number);
CREATE INDEX IF NOT EXISTS idx_episodes_content_hash ON episodes(content_hash);

-- 5. Tabela de Fontes de Mídia (Sources / CDN / Streams)
CREATE TABLE IF NOT EXISTS sources (
    id VARCHAR(64) PRIMARY KEY,
    episode_id VARCHAR(64) NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    quality VARCHAR(16) NOT NULL CHECK (quality IN ('360p', '480p', '720p', '1080p', '4k')),
    stream_url TEXT NOT NULL,
    format VARCHAR(16) NOT NULL DEFAULT 'embed' CHECK (format IN ('hls', 'mp4', 'dash', 'embed')),
    provider VARCHAR(64) NOT NULL DEFAULT 'official-verified-hd',
    is_default BOOLEAN DEFAULT FALSE,
    content_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_episode_quality UNIQUE (episode_id, quality),
    CONSTRAINT unique_source_stream_url UNIQUE (stream_url)
);

CREATE INDEX IF NOT EXISTS idx_sources_episode_id ON sources(episode_id);

/*
===============================================================================
ESQUEMA EQUIVALENTE EM PRISMA ORM (schema.prisma)
===============================================================================

model Anime {
  id                  String    @id @db.VarChar(64)
  slug                String    @unique @db.VarChar(128)
  title               String    @db.VarChar(255)
  japaneseTitle       String?   @map("japanese_title") @db.VarChar(255)
  synopsis            String    @db.Text
  coverUrl            String    @map("cover_url") @db.Text
  bannerUrl           String    @map("banner_url") @db.Text
  rating              Decimal   @default(0.0) @db.Decimal(3, 1)
  ratingCount         Int       @default(0) @map("rating_count")
  status              String    @db.VarChar(32)
  studio              String    @db.VarChar(128)
  year                Int
  audioType           String    @default("Dublado & Legendado PT-BR") @map("audio_type")
  trailerYoutubeId    String    @map("trailer_youtube_id") @db.VarChar(32)
  imdbId              String?   @unique @map("imdb_id") @db.VarChar(32)
  tmdbId              Int?      @unique @map("tmdb_id")
  malId               Int?      @unique @map("mal_id")
  anilistId           Int?      @unique @map("anilist_id")
  seasons             Season[]
  episodes            Episode[]
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")

  @@map("animes")
}

model Season {
  id               String    @id @db.VarChar(64)
  animeId          String    @map("anime_id") @db.VarChar(64)
  seasonNumber     Int       @map("season_number")
  title            String    @db.VarChar(255)
  year             Int
  synopsis         String?   @db.Text
  posterUrl        String    @map("poster_url") @db.Text
  bannerUrl        String?   @map("banner_url") @db.Text
  episodesCount    Int       @default(0) @map("episodes_count")
  trailerYoutubeId String    @map("trailer_youtube_id") @db.VarChar(32)
  anime            Anime     @relation(fields: [animeId], references: [id], onDelete: Cascade)
  episodes         Episode[]

  @@unique([animeId, seasonNumber], name: "unique_anime_season_number")
  @@map("seasons")
}

model Episode {
  id             String   @id @db.VarChar(64)
  animeId        String   @map("anime_id") @db.VarChar(64)
  seasonId       String   @map("season_id") @db.VarChar(64)
  seasonNumber   Int      @map("season_number")
  episodeNumber  Int      @map("episode_number")
  title          String   @db.VarChar(255)
  duration       String   @default("24m") @db.VarChar(32)
  thumbnailUrl   String   @map("thumbnail_url") @db.Text
  synopsis       String?  @db.Text
  isFree         Boolean  @default(true) @map("is_free")
  contentHash    String   @unique @map("content_hash") @db.VarChar(64)
  streamUrl      String   @unique @map("stream_url") @db.Text
  youtubeVideoId String?  @map("youtube_video_id") @db.VarChar(32)
  anime          Anime    @relation(fields: [animeId], references: [id], onDelete: Cascade)
  season         Season   @relation(fields: [seasonId], references: [id], onDelete: Cascade)
  sources        Source[]

  @@unique([animeId, seasonNumber, episodeNumber], name: "unique_anime_season_episode")
  @@map("episodes")
}

model Source {
  id          String   @id @db.VarChar(64)
  episodeId   String   @map("episode_id") @db.VarChar(64)
  quality     String   @db.VarChar(16)
  streamUrl   String   @unique @map("stream_url") @db.Text
  format      String   @default("embed") @db.VarChar(16)
  provider    String   @default("official-verified-hd") @db.VarChar(64)
  isDefault   Boolean  @default(false) @map("is_default")
  contentHash String   @map("content_hash") @db.VarChar(64)
  episode     Episode  @relation(fields: [episodeId], references: [id], onDelete: Cascade)

  @@unique([episodeId, quality], name: "unique_episode_quality")
  @@map("sources")
}
*/
