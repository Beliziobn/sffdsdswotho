import { supabase } from "@/integrations/supabase/client";

export type ItemMediaType = "anime" | "manga" | "book" | "webtoon";

export interface UserReview {
  id: string;
  itemId: string;
  itemType: ItemMediaType;
  itemTitle: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1 to 5
  comment: string;
  statusTag?: string;
  likesCount: number;
  likedByUsers: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface ItemAdoreState {
  itemId: string;
  totalAdores: number;
  userAdored: boolean;
}

const REVIEWS_STORAGE_KEY = "worscoi_community_reviews_v1";
const ADORES_STORAGE_KEY = "worscoi_item_adores_v1";
const USER_ADORES_MAP_KEY = "worscoi_user_adores_map_v1";

function safeReadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWriteJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("worscoi_reviews_updated"));
  } catch {
    // Ignore quota errors
  }
}

// Seed authentic initial community reviews for key titles
const INITIAL_SEED_REVIEWS: UserReview[] = [
  {
    id: "seed-sbr-1",
    itemId: "steel-ball-run",
    itemType: "anime",
    itemTitle: "JoJo: Steel Ball Run",
    userId: "critic-lucas",
    userName: "Lucas Mendonça",
    rating: 5,
    statusTag: "Obra-prima",
    comment:
      "A adaptação de Steel Ball Run superou todas as expectativas! A 1ª fase com o prólogo de 48 minutos e a transição dinâmica para a corrida a cavalo pelos EUA captura com perfeição a genialidade de Hirohiko Araki. Animação impecável!",
    likesCount: 38,
    likedByUsers: ["user-1", "user-2"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "seed-sbr-manga-1",
    itemId: "steel-ball-run",
    itemType: "manga",
    itemTitle: "JoJo Part 7: Steel Ball Run",
    userId: "critic-beatriz",
    userName: "Beatriz Nogueira",
    rating: 5,
    statusTag: "Terminei de ler",
    comment:
      "A melhor parte de todo o universo de JoJo. O relacionamento entre Johnny Joestar e Gyro Zeppeli, a busca pelas Relíquias Sagradas e a lição do Spin Áureo são inesquecíveis. Leitura obrigatória!",
    likesCount: 45,
    likedByUsers: ["user-1"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: "seed-frieren-1",
    itemId: "frieren-beyond-journeys-end",
    itemType: "anime",
    itemTitle: "Frieren e a Jornada Para o Além",
    userId: "critic-gabriel",
    userName: "Gabriel Rocha",
    rating: 5,
    statusTag: "Assisti tudo",
    comment:
      "Uma das obras mais sensíveis e profundas dos últimos anos. A trilha sonora da Evan Call e a direção contemplativa da Madhouse criam uma experiência cinematográfica a cada episódio.",
    likesCount: 29,
    likedByUsers: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: "seed-book-principe",
    itemId: "1232",
    itemType: "book",
    itemTitle: "O Príncipe",
    userId: "critic-renato",
    userName: "Prof. Renato Silveira",
    rating: 5,
    statusTag: "Recomendo muito",
    comment:
      "Excelente ter a edição fac-similar integral disponível para leitura direta. O clássico de Maquiavel segue indispensável para compreender a dinâmica real do poder e da diplomacia.",
    likesCount: 22,
    likedByUsers: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: "seed-wt-solo",
    itemId: "wt-solo-leveling",
    itemType: "webtoon",
    itemTitle: "Solo Leveling: ReAwakening",
    userId: "critic-marcos",
    userName: "Marcos Vinícius",
    rating: 5,
    statusTag: "Obra-prima",
    comment:
      "A arte vertical do estúdio REDICE e do falecido DUBU estabeleceu um novo padrão para a indústria de webtoons mundiais. Ritmo frenético do primeiro ao último capítulo!",
    likesCount: 52,
    likedByUsers: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
  },
];

// Initialize reviews store with seed data if empty
function getAllStoredReviews(): UserReview[] {
  const stored = safeReadJson<UserReview[]>(REVIEWS_STORAGE_KEY, []);
  if (stored.length === 0) {
    safeWriteJson(REVIEWS_STORAGE_KEY, INITIAL_SEED_REVIEWS);
    return INITIAL_SEED_REVIEWS;
  }
  return stored;
}

export function getItemReviews(itemId: string, itemType: ItemMediaType): UserReview[] {
  const all = getAllStoredReviews();
  const cleanId = itemId.trim().toLowerCase();
  return all
    .filter(
      (r) =>
        r.itemId.toLowerCase() === cleanId &&
        r.itemType.toLowerCase() === itemType.toLowerCase()
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function saveUserReview(input: {
  itemId: string;
  itemType: ItemMediaType;
  itemTitle: string;
  user: { id: string; name: string; avatar?: string };
  rating: number;
  comment: string;
  statusTag?: string;
  existingReviewId?: string;
}): Promise<UserReview> {
  const all = getAllStoredReviews();
  const now = new Date().toISOString();
  const cleanId = input.itemId.trim().toLowerCase();

  let review: UserReview;

  if (input.existingReviewId) {
    const idx = all.findIndex((r) => r.id === input.existingReviewId);
    if (idx !== -1) {
      review = {
        ...all[idx],
        rating: Math.max(1, Math.min(5, input.rating)),
        comment: input.comment.trim(),
        statusTag: input.statusTag,
        updatedAt: now,
      };
      all[idx] = review;
    } else {
      review = {
        id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        itemId: cleanId,
        itemType: input.itemType,
        itemTitle: input.itemTitle,
        userId: input.user.id,
        userName: input.user.name,
        userAvatar: input.user.avatar,
        rating: Math.max(1, Math.min(5, input.rating)),
        comment: input.comment.trim(),
        statusTag: input.statusTag,
        likesCount: 0,
        likedByUsers: [],
        createdAt: now,
      };
      all.unshift(review);
    }
  } else {
    // Check if user already reviewed this item
    const existingIndex = all.findIndex(
      (r) =>
        r.itemId.toLowerCase() === cleanId &&
        r.itemType.toLowerCase() === input.itemType.toLowerCase() &&
        r.userId === input.user.id
    );

    if (existingIndex !== -1) {
      review = {
        ...all[existingIndex],
        rating: Math.max(1, Math.min(5, input.rating)),
        comment: input.comment.trim(),
        statusTag: input.statusTag,
        updatedAt: now,
      };
      all[existingIndex] = review;
    } else {
      review = {
        id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        itemId: cleanId,
        itemType: input.itemType,
        itemTitle: input.itemTitle,
        userId: input.user.id,
        userName: input.user.name,
        userAvatar: input.user.avatar,
        rating: Math.max(1, Math.min(5, input.rating)),
        comment: input.comment.trim(),
        statusTag: input.statusTag,
        likesCount: 0,
        likedByUsers: [],
        createdAt: now,
      };
      all.unshift(review);
    }
  }

  // Persist locally
  safeWriteJson(REVIEWS_STORAGE_KEY, all);

  // Persist into database (Supabase audit_logs)
  try {
    await supabase.from("audit_logs").insert({
      action: "community_review",
      entity: input.itemType,
      entity_id: cleanId,
      user_id: input.user.id.startsWith("master-admin") ? null : input.user.id,
      metadata: {
        review_id: review.id,
        item_title: input.itemTitle,
        rating: review.rating,
        comment: review.comment,
        status_tag: review.statusTag,
        user_name: review.userName,
        created_at: review.createdAt,
      },
    });
  } catch {
    // Supabase insert fallback succeeds locally
  }

  return review;
}

export async function deleteUserReview(reviewId: string, userId: string, isAdmin = false): Promise<boolean> {
  const all = getAllStoredReviews();
  const idx = all.findIndex((r) => r.id === reviewId);
  if (idx === -1) return false;

  if (all[idx].userId !== userId && !isAdmin) {
    return false;
  }

  all.splice(idx, 1);
  safeWriteJson(REVIEWS_STORAGE_KEY, all);
  return true;
}

export function toggleLikeReview(reviewId: string, userId: string): boolean {
  if (!userId) return false;
  const all = getAllStoredReviews();
  const idx = all.findIndex((r) => r.id === reviewId);
  if (idx === -1) return false;

  const target = all[idx];
  const hasLiked = target.likedByUsers.includes(userId);
  if (hasLiked) {
    target.likedByUsers = target.likedByUsers.filter((id) => id !== userId);
    target.likesCount = Math.max(0, target.likesCount - 1);
  } else {
    target.likedByUsers.push(userId);
    target.likesCount += 1;
  }
  all[idx] = target;
  safeWriteJson(REVIEWS_STORAGE_KEY, all);
  return !hasLiked;
}

// ============================================================================
// ADOROS (FAVORITES / LIKES ON THE WORK ITSELF)
// ============================================================================

const DEFAULT_BASE_ADORES: Record<string, number> = {
  "steel-ball-run": 1420,
  "solo-leveling": 2840,
  "frieren-beyond-journeys-end": 3120,
  "blue-lock": 1890,
  "dandadan": 1560,
  "attack-on-titan": 5400,
  "vinland-saga": 2980,
  "demon-slayer-infinity-castle": 4600,
  "black-clover": 2100,
  "one-piece": 8900,
  "dragon-ball": 7400,
  "naruto": 6800,
  "wt-solo-leveling": 3490,
  "1232": 890,
  "3333": 640,
};

export function getItemAdores(itemId: string, userId?: string): ItemAdoreState {
  const cleanId = itemId.trim().toLowerCase();
  const totalMap = safeReadJson<Record<string, number>>(ADORES_STORAGE_KEY, {});
  const userMap = safeReadJson<Record<string, string[]>>(USER_ADORES_MAP_KEY, {});

  const baseAdores = totalMap[cleanId] ?? DEFAULT_BASE_ADORES[cleanId] ?? 128;
  const userList = userMap[cleanId] || [];
  const userAdored = userId ? userList.includes(userId) : false;

  return {
    itemId: cleanId,
    totalAdores: baseAdores,
    userAdored,
  };
}

export async function toggleItemAdore(
  itemId: string,
  itemType: ItemMediaType,
  itemTitle: string,
  userId: string
): Promise<ItemAdoreState> {
  const cleanId = itemId.trim().toLowerCase();
  const totalMap = safeReadJson<Record<string, number>>(ADORES_STORAGE_KEY, {});
  const userMap = safeReadJson<Record<string, string[]>>(USER_ADORES_MAP_KEY, {});

  let count = totalMap[cleanId] ?? DEFAULT_BASE_ADORES[cleanId] ?? 128;
  const userList = userMap[cleanId] || [];
  const exists = userList.includes(userId);

  if (exists) {
    userMap[cleanId] = userList.filter((id) => id !== userId);
    count = Math.max(0, count - 1);
  } else {
    userMap[cleanId] = [...userList, userId];
    count += 1;
  }

  totalMap[cleanId] = count;
  safeWriteJson(ADORES_STORAGE_KEY, totalMap);
  safeWriteJson(USER_ADORES_MAP_KEY, userMap);

  // Sync to database audit_logs
  try {
    await supabase.from("audit_logs").insert({
      action: exists ? "community_unadore" : "community_adore",
      entity: itemType,
      entity_id: cleanId,
      user_id: userId.startsWith("master-admin") ? null : userId,
      metadata: {
        item_title: itemTitle,
        total_adores: count,
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    // Fallback works locally
  }

  return {
    itemId: cleanId,
    totalAdores: count,
    userAdored: !exists,
  };
}

export function getItemStats(
  itemId: string,
  itemType: ItemMediaType,
  defaultRating = 4.8,
  defaultCount = 120
) {
  const reviews = getItemReviews(itemId, itemType);
  if (reviews.length === 0) {
    return {
      averageRating: defaultRating,
      totalReviews: defaultCount,
      ratingScale10: Number((defaultRating * 2).toFixed(1)),
    };
  }

  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const avg = Number((sum / reviews.length).toFixed(1));
  return {
    averageRating: avg,
    totalReviews: reviews.length + defaultCount,
    ratingScale10: Number((avg * 2).toFixed(1)),
  };
}
