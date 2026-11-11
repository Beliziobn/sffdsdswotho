import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

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
 * Complete Skeleton Screen for Book and Content Detail pages
 */
export const ContentDetailSkeleton = () => (
  <div className="min-h-screen bg-background">
    <Navigation variant="dark" />
    
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
          <div className="space-y-2.5 max-w-2xl">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
);

/**
 * Complete Skeleton Screen for News Article reading page
 */
export const NewsArticleSkeleton = () => (
  <div className="min-h-screen bg-background">
    <Navigation variant="dark" />
    
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

        <div className="p-6 rounded-xl bg-muted/40 border-l-4 border-emerald-500 my-8">
          <Skeleton className="h-5 w-full mb-2" />
          <Skeleton className="h-5 w-2/3" />
        </div>

        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-10/12" />
      </div>
    </div>
    <Footer />
  </div>
);
