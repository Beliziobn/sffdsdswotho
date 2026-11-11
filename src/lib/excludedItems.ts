/**
 * Permanent registry of decommissioned and excluded books, webtoons, and news items.
 * Guaranteed exclusion across all catalog queries, feeds, and detail routes.
 */

export const EXCLUDED_IDS = new Set<string>([
  "1ac925cf-f047-4ab4-8bbf-c7f7a1537ebf", // A Praça ao Amanhecer
  "11111111-1111-1111-1111-111111111111", // A Praça ao Amanhecer (legacy book id)
  "7edac3af-2761-4744-8996-140749dc3ee9", // O Farol Silencioso
  "22222222-2222-2222-2222-222222222222", // O Farol Silencioso (legacy book id)
  "3b98755d-af2a-47ec-89bf-a350d4f408c2", // Janela Aberta
  "33333333-3333-3333-3333-333333333333", // Janela Aberta (legacy book id)
  "3c0a4fab-3fc0-4ce5-a1b4-3cbb070ffa29", // Helena Vasques lança novo romance na Praça Central
  "f14aac16-8646-4741-9c53-fa220851824e", // Helena Vasques (legacy news id)
  "4fb0abc0-6875-4e00-a504-937c46579a44", // Cinco contos para ler em uma tarde
  "a9fbcce0-e7b4-42e2-bf37-688501ba159e", // Cinco contos (legacy news id)
  "571eaf29-2cbc-4e2d-b777-23bc892eef85", // O regresso das livrarias de bairro
  "cbeac577-67af-4a12-be9d-a17a3a8bd74f", // O regresso das livrarias (legacy news id)
  "9b840389-4977-4f45-b526-11086f7ae51f", // Leitura digital e retenção de memória
  "46a9049d-8a30-4c0b-a615-62e5382f3783", // Luz de Neon
  "9acd02a8-afe7-46ab-82ef-7f22cfc79008", // Café da Meia-Noite
  "c7ec0428-feaa-468b-81be-ab7adcd19823", // Kaze no Kokoro
  "25d1ab00-90fe-4b59-a797-85368fb2d80b", // Ramen da Meia-Noite
  "1862b7a4-5d86-4fde-8ffa-272a567352fb", // Sigilo
  "8b5ac78c-dfcc-4d73-b229-4d7648abc983", // Estrela Cadente
]);

export const EXCLUDED_SLUGS = new Set<string>([
  "sigilo",
  "kaze-no-kokoro",
  "estrela-cadente",
  "ramen-da-meia-noite",
  "helena-vasques-novo-romance",
  "cinco-contos-para-uma-tarde",
  "regresso-livrarias-de-bairro",
]);

const EXCLUDED_TITLE_KEYWORDS = [
  "sigilo",
  "kaze no kokoro",
  "estrela cadente",
  "ramen da meia-noite",
  "ramen da meia - noite",
  "luz de neon",
  "luz neon",
  "café da meia-noite",
  "cafe da meia-noite",
  "praça ao amanhecer",
  "praca ao amanhecer",
  "farol silencioso",
  "janela aberta",
  "regresso das livrarias de bairro",
  "livrarias de bairro",
  "cinco contos para ler em uma tarde",
  "cinco contos para uma tarde",
  "helena vasques",
  "leitura digital e retenção de memória",
  "leitura digital e retencao de memoria",
];

export function isExcludedItem(item?: {
  id?: string | null;
  title?: string | null;
  slug?: string | null;
  cover?: string | null;
  cover_url?: string | null;
}): boolean {
  if (!item) return false;

  const id = item.id ? String(item.id).trim().toLowerCase() : "";
  if (id && EXCLUDED_IDS.has(id)) return true;

  const slug = item.slug ? String(item.slug).trim().toLowerCase() : "";
  if (slug && EXCLUDED_SLUGS.has(slug)) return true;

  const title = item.title
    ? String(item.title)
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
    : "";

  if (title) {
    for (const kw of EXCLUDED_TITLE_KEYWORDS) {
      const normalizedKw = kw
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      if (title === normalizedKw || title.includes(normalizedKw)) {
        return true;
      }
    }
  }

  const cover = (item.cover || item.cover_url || "").toLowerCase();
  if (
    cover.includes("/covers/farol.jpg") ||
    cover.includes("/covers/janela.jpg") ||
    cover.includes("/covers/praca.jpg") ||
    cover.includes("/covers/manga-")
  ) {
    return true;
  }

  return false;
}

export function filterExcludedItems<
  T extends {
    id?: string | null;
    title?: string | null;
    slug?: string | null;
    cover?: string | null;
    cover_url?: string | null;
  }
>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => !isExcludedItem(item));
}
