export interface ModernChapter {
  id: string;
  book_id: string;
  position: number;
  title: string;
  content: string;
  is_free_preview: boolean;
}

export interface ModernBook {
  id: string;
  title: string;
  author: string;
  subtitle: string;
  description: string;
  cover_url: string;
  category: string;
  price_cents: 0;
  currency: string;
  published: boolean;
  featured: boolean;
  created_at: string;
  downloads: number;
  rating: number;
  rating_count: number;
  read_time: number;
  year: number;
  formats: string[];
  is_modern_bestseller: true;
  chapters: ModernChapter[];
}
