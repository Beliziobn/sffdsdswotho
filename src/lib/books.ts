export const BOOK_CATEGORIES = [
  "Filosofia e Estoicismo",
  "Psicologia e Mente",
  "Educação e Aprendizado",
  "Finanças e Negócios",
  "Autoajuda e Motivacional",
  "Filosofia e Pensamento",
  "Ficção Científica",
  "História e Sociedade",
  "Romance",
  "Terror/Horror",
  "Suspense e Mistério",
  "Aventura",
  "Fantasia",
  "Biografia e Autobiografia",
  "Didáticos e Técnicos",
  "Religiosos/Espiritual",
  "Poesia",
  "Narrativa",
  "Dramático",
];

/** Deterministic pick that rotates once per day. */
export const freeBookOfTheDay = <T,>(items: T[]): T | undefined => {
  if (items.length === 0) return undefined;
  const day = Math.floor(Date.now() / 86400000);
  return items[day % items.length];
};
