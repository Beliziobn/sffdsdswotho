import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton for BookCard used in Catalog grids and Recommendation sections
 */
export const BookCardSkeleton = () => (
  <Card className="overflow-hidden border border-border bg-card shadow-soft flex flex-col h-full">
    <div className="relative h-48 w-full bg-accent/50 overflow-hidden">
      <Skeleton className="w-full h-full rounded-none" />
      <div className="absolute top-3 right-3">
        <Skeleton className="h-5 w-16 rounded-md" />
      </div>
    </div>
    <div className="p-6 flex-1 flex flex-col justify-between">
      <div>
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-3.5 w-1/2 mb-4" />
        <div className="flex flex-wrap gap-1.5 mb-5">
          <Skeleton className="h-4 w-16 rounded-sm" />
          <Skeleton className="h-4 w-20 rounded-sm" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border/40">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
    </div>
  </Card>
);

/**
 * Grid of BookCard skeletons for loading lists
 */
export const BookGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <BookCardSkeleton key={i} />
    ))}
  </div>
);

/**
 * Skeleton for News editorial cards
 */
export const NewsCardSkeleton = () => (
  <Card className="overflow-hidden border border-border bg-card shadow-soft flex flex-col h-full">
    <div className="relative h-48 w-full bg-accent/50 overflow-hidden">
      <Skeleton className="w-full h-full rounded-none" />
      <div className="absolute top-3 right-3">
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
    <div className="p-6 flex-1 flex flex-col justify-between">
      <div>
        <Skeleton className="h-3 w-28 mb-3" />
        <Skeleton className="h-5 w-full mb-2" />
        <Skeleton className="h-5 w-4/5 mb-3" />
        <Skeleton className="h-3.5 w-full mb-1.5" />
        <Skeleton className="h-3.5 w-full mb-1.5" />
        <Skeleton className="h-3.5 w-2/3 mb-4" />
      </div>
      <div className="pt-2">
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  </Card>
);

/**
 * Grid of NewsCard skeletons
 */
export const NewsGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
    {Array.from({ length: count }).map((_, i) => (
      <NewsCardSkeleton key={i} />
    ))}
  </div>
);

/**
 * Skeleton for Cinema items
 */
export const CinemaCardSkeleton = () => (
  <div className="flex flex-col">
    <div className="relative overflow-hidden rounded-md bg-zinc-900 border border-zinc-800 aspect-[2/3]">
      <Skeleton className="w-full h-full rounded-none bg-zinc-800/80" />
      <div className="absolute top-2.5 left-2.5">
        <Skeleton className="h-4 w-10 rounded bg-zinc-700/60" />
      </div>
    </div>
    <div className="pt-2.5 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <Skeleton className="h-3 w-10 bg-zinc-800" />
        <Skeleton className="h-3 w-8 bg-zinc-800" />
        <Skeleton className="h-3 w-8 bg-zinc-800" />
      </div>
      <Skeleton className="h-4 w-3/4 bg-zinc-800" />
      <Skeleton className="h-3 w-1/2 bg-zinc-800/80" />
    </div>
  </div>
);

/**
 * Grid of CinemaCard skeletons
 */
export const CinemaGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <CinemaCardSkeleton key={i} />
    ))}
  </div>
);

/**
 * Skeleton for Chapter / Episode rows inside Anime, Manga, Book, and Webtoon detail pages
 */
export const ChapterListSkeleton = ({
  count = 6,
  dark = false,
}: {
  count?: number;
  dark?: boolean;
}) => (
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className={`flex items-center justify-between p-3.5 rounded-xl border ${
          dark
            ? "bg-white/[0.02] border-white/10"
            : "bg-card/60 border-border/70"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
          <Skeleton
            className={`w-9 h-9 rounded-lg shrink-0 ${
              dark ? "bg-white/10" : ""
            }`}
          />
          <div className="flex-1 space-y-2">
            <Skeleton
              className={`h-3.5 w-3/4 ${dark ? "bg-white/10" : ""}`}
            />
            <Skeleton
              className={`h-2.5 w-1/2 ${dark ? "bg-white/5" : ""}`}
            />
          </div>
        </div>
        <Skeleton
          className={`w-7 h-7 rounded-md shrink-0 ${
            dark ? "bg-white/10" : ""
          }`}
        />
      </div>
    ))}
  </div>
);

/**
 * Complete Skeleton Screen for Book, Webtoon, and Content Detail pages
 */
export const ContentDetailSkeleton = () => (
  <div className="w-full">
    {/* Hero Banner Backdrop */}
    <div className="relative w-full h-[55vh] min-h-[380px] bg-muted/40 overflow-hidden">
      <Skeleton className="w-full h-full rounded-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
    </div>

    {/* Metadata & Actions Stage */}
    <div className="container mx-auto px-6 lg:px-12 -mt-36 relative z-10 pb-20">
      <div className="grid md:grid-cols-3 gap-8 lg:gap-12 items-start">
        {/* Cover Skeleton */}
        <div className="md:col-span-1 max-w-[280px] mx-auto md:mx-0 w-full">
          <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-border/80 bg-card">
            <Skeleton className="w-full h-full rounded-none" />
          </div>
          <div className="mt-4 flex flex-col gap-2.5">
            <Skeleton className="h-11 w-full rounded-full" />
            <Skeleton className="h-10 w-full rounded-full" />
          </div>
        </div>

        {/* Info Column */}
        <div className="md:col-span-2 pt-4">
          <div className="flex gap-2 mb-3">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-9 md:h-12 w-4/5 mb-3" />
          <Skeleton className="h-4 w-1/3 mb-6" />

          {/* Key Stats Bar */}
          <div className="flex gap-4 p-4 rounded-xl bg-card border border-border mb-6">
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>

          {/* Synopsis Paragraphs */}
          <div className="space-y-2.5 max-w-2xl mb-10">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          {/* Chapter Index Skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-5 w-44 mb-3" />
            <ChapterListSkeleton count={6} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Complete Skeleton Screen for News Article reading page
 */
export const NewsArticleSkeleton = () => (
  <div className="container mx-auto px-6 lg:px-12 pt-28 pb-20 max-w-4xl">
    {/* Category and Date Header */}
    <div className="flex items-center gap-3 mb-4">
      <Skeleton className="h-6 w-24 rounded-full" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-20" />
    </div>

    {/* Main Headline */}
    <Skeleton className="h-10 md:h-14 w-full mb-3" />
    <Skeleton className="h-10 md:h-14 w-4/5 mb-6" />

    {/* Excerpt Subtitle */}
    <Skeleton className="h-5 w-full mb-2" />
    <Skeleton className="h-5 w-3/4 mb-8" />

    {/* Big Cover Image */}
    <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden mb-10 bg-accent">
      <Skeleton className="w-full h-full rounded-none" />
    </div>

    {/* Article Body Paragraphs */}
    <div className="space-y-4 max-w-3xl">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5 mb-6" />

      <div className="p-6 rounded-xl bg-muted/40 border border-border my-8">
        <Skeleton className="h-5 w-full mb-2" />
        <Skeleton className="h-5 w-2/3" />
      </div>

      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-10/12" />
    </div>
  </div>
);

/**
 * Editorial Book Reader Skeleton (used in Reader.tsx and ContentReader.tsx)
 */
export const BookReaderSkeleton = ({
  withHeader = true,
}: {
  withHeader?: boolean;
}) => (
  <div className="min-h-screen bg-background">
    {withHeader && (
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-48 hidden sm:block" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </header>
    )}
    <article className="max-w-2xl mx-auto px-6 py-16 md:py-24">
      <div className="mb-12 pb-8 border-b border-border/60">
        <Skeleton className="h-3 w-28 mb-3" />
        <Skeleton className="h-9 md:h-11 w-3/4 mb-4" />
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Drop-cap first paragraph skeleton */}
      <div className="flex gap-4 items-start mb-6">
        <Skeleton className="w-14 h-14 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2.5 pt-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
        </div>
      </div>

      {/* Subsequent book paragraphs */}
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="space-y-2.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ))}
      </div>
    </article>
  </div>
);

/**
 * Vertical Manga / Webtoon Panel Skeletons (used in AnimeMangaReader.tsx and WebtoonReader.tsx)
 */
export const MangaReaderSkeleton = ({
  pages = 3,
  dark = true,
}: {
  pages?: number;
  dark?: boolean;
}) => (
  <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 py-6 flex flex-col items-center gap-4">
    {Array.from({ length: pages }).map((_, idx) => (
      <div
        key={idx}
        className={`w-full aspect-[2/3] max-h-[820px] rounded-xl overflow-hidden border p-4 sm:p-6 flex flex-col gap-3 ${
          dark
            ? "bg-zinc-900/90 border-white/10"
            : "bg-card border-border"
        }`}
      >
        {/* Top wide manga panel */}
        <Skeleton
          className={`w-full h-1/3 rounded-lg ${
            dark ? "bg-white/[0.06]" : ""
          }`}
        />
        {/* Middle split manga panels */}
        <div className="grid grid-cols-5 gap-3 h-1/3">
          <Skeleton
            className={`col-span-3 h-full rounded-lg ${
              dark ? "bg-white/[0.05]" : ""
            }`}
          />
          <Skeleton
            className={`col-span-2 h-full rounded-lg ${
              dark ? "bg-white/[0.07]" : ""
            }`}
          />
        </div>
        {/* Bottom dramatic action panel */}
        <Skeleton
          className={`w-full flex-1 rounded-lg ${
            dark ? "bg-white/[0.06]" : ""
          }`}
        />
        {/* Page footer bar */}
        <div className="flex items-center justify-between pt-1">
          <Skeleton
            className={`h-2.5 w-20 ${dark ? "bg-white/10" : ""}`}
          />
          <Skeleton
            className={`h-2.5 w-12 ${dark ? "bg-white/10" : ""}`}
          />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Physical Book A4 Page Skeleton (used in OriginalPdfViewer.tsx)
 */
export const PdfPageSkeleton = ({ progress }: { progress?: number }) => (
  <div className="w-full max-w-2xl mx-auto my-6 px-4">
    <div className="aspect-[1/1.414] w-full rounded-lg bg-[#faf8f5] dark:bg-zinc-900 border border-stone-300/80 dark:border-zinc-800 shadow-2xl p-8 sm:p-12 flex flex-col justify-between">
      {/* Running header */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-zinc-800">
        <Skeleton className="h-2.5 w-32 bg-stone-200 dark:bg-zinc-800" />
        <Skeleton className="h-2.5 w-10 bg-stone-200 dark:bg-zinc-800" />
      </div>

      {/* Chapter heading & figure */}
      <div className="my-6 space-y-3">
        <Skeleton className="h-6 w-2/3 bg-stone-200/90 dark:bg-zinc-800" />
        <Skeleton className="h-3.5 w-1/3 bg-stone-200/70 dark:bg-zinc-800/70 mb-6" />
        <Skeleton className="h-36 w-full rounded-md bg-stone-200/80 dark:bg-zinc-800/80 my-4" />
      </div>

      {/* Book text lines */}
      <div className="space-y-2.5 flex-1">
        {Array.from({ length: 11 }).map((_, idx) => (
          <Skeleton
            key={idx}
            className={`h-3 bg-stone-200/80 dark:bg-zinc-800/80 ${
              idx % 4 === 3 ? "w-3/4" : "w-full"
            }`}
          />
        ))}
      </div>

      {/* Page footer / progress */}
      <div className="pt-6 border-t border-stone-200 dark:border-zinc-800 flex items-center justify-between">
        <Skeleton className="h-2.5 w-24 bg-stone-200 dark:bg-zinc-800" />
        {typeof progress === "number" && progress > 0 ? (
          <div className="w-32 bg-stone-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-600 h-full transition-all duration-300"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        ) : (
          <Skeleton className="h-2.5 w-8 bg-stone-200 dark:bg-zinc-800" />
        )}
      </div>
    </div>
  </div>
);

/**
 * Full-page Material Layout Skeleton for Route Transitions (App.tsx Suspense fallback)
 */
export const PageShellSkeleton = () => (
  <div className="min-h-screen bg-background">
    {/* Top Navigation Bar Skeleton */}
    <div className="h-20 border-b border-border/60 px-6 lg:px-12 flex items-center justify-between">
      <Skeleton className="h-6 w-28" />
      <div className="hidden md:flex items-center gap-6">
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-3.5 w-16" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>

    {/* Hero Banner Material Skeleton */}
    <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-10 pb-8">
      <div className="rounded-2xl border border-border/60 bg-card/50 p-8 md:p-12 mb-12">
        <Skeleton className="h-3.5 w-28 mb-4" />
        <Skeleton className="h-10 md:h-12 w-3/4 max-w-xl mb-4" />
        <Skeleton className="h-4 w-2/3 max-w-lg mb-6" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-36 rounded-full" />
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
      </div>

      {/* Filter Pills Skeleton */}
      <div className="flex items-center gap-2.5 mb-8 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full shrink-0" />
        ))}
      </div>

      {/* Material Grid Skeleton */}
      <BookGridSkeleton count={8} />
    </div>
  </div>
);
