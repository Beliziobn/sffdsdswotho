/**
 * Project Gutenberg integration for Worscoi.
 * Provides free, public-domain ebooks with complete chapters and text.
 */

export interface GutenbergBook {
  id: string; // e.g. "guten-55752"
  gutenberg_id: number;
  title: string;
  author: string;
  description: string;
  cover_url: string;
  category: string;
  price_cents: 0;
  currency: string;
  published: boolean;
  featured: boolean;
  created_at: string;
  downloads?: number;
  formats: string[];
  is_public_domain: true;
  epub_url?: string;
  txt_url?: string;
  read_time?: number;
  year?: number;
}

export interface GutenbergChapter {
  id: string;
  book_id: string;
  position: number;
  title: string;
  content: string;
  is_free_preview: boolean;
}

/** Pre-curated classic literature with verified Gutenberg texts and authentic scanned covers */
export const CURATED_GUTENBERG_BOOKS: GutenbergBook[] = [
  {
    id: "guten-55752",
    gutenberg_id: 55752,
    title: "Dom Casmurro",
    author: "Machado de Assis",
    description: "Obra-prima do Realismo brasileiro. Narrado em primeira pessoa por Bento Santiago (o Bentinho), o romance aborda sua obsessão e desconfiança sobre o suposto adultério entre sua esposa Capitu e seu melhor amigo Escobar. Leitura integral com todos os 148 capítulos originais.",
    cover_url: "https://www.gutenberg.org/cache/epub/55752/pg55752.cover.medium.jpg",
    category: "Romance",
    price_cents: 0,
    currency: "BRL",
    published: true,
    featured: true,
    created_at: "2024-01-01T00:00:00Z",
    downloads: 14200,
    formats: ["Leitura Online", "EPUB", "TXT"],
    is_public_domain: true,
    epub_url: "https://www.gutenberg.org/ebooks/55752.epub3.images",
    txt_url: "https://www.gutenberg.org/cache/epub/55752/pg55752.txt",
    read_time: 360,
    year: 1899,
  },
  {
    id: "guten-54829",
    gutenberg_id: 54829,
    title: "Memórias Póstumas de Brás Cubas",
    author: "Machado de Assis",
    description: "Um defunto-autor decide relatar suas memórias além-túmulo com ironia mordaz, desconstruindo a sociedade carioca do século XIX. Marco fundador do Realismo no Brasil. Leitura integral com todos os 160 capítulos.",
    cover_url: "https://www.gutenberg.org/cache/epub/54829/pg54829.cover.medium.jpg",
    category: "Romance",
    price_cents: 0,
    currency: "BRL",
    published: true,
    featured: true,
    created_at: "2024-01-02T00:00:00Z",
    downloads: 11950,
    formats: ["Leitura Online", "EPUB", "TXT"],
    is_public_domain: true,
    epub_url: "https://www.gutenberg.org/ebooks/54829.epub3.images",
    txt_url: "https://www.gutenberg.org/cache/epub/54829/pg54829.txt",
    read_time: 320,
    year: 1881,
  },
  {
    id: "guten-3333",
    gutenberg_id: 3333,
    title: "Os Lusíadas",
    author: "Luís de Camões",
    description: "A epopeia magna da língua portuguesa. Em dez cantos e oitava rima, Camões canta a viagem de Vasco da Gama às Índias e os feitos valorosos dos navegadores e guerreiros portugueses. Texto integral completo com todos os cantos e estrofes.",
    cover_url: "https://www.gutenberg.org/cache/epub/3333/pg3333.cover.medium.jpg",
    category: "Poesia",
    price_cents: 0,
    currency: "BRL",
    published: true,
    featured: true,
    created_at: "2024-01-03T00:00:00Z",
    downloads: 18700,
    formats: ["Leitura Online", "EPUB", "TXT"],
    is_public_domain: true,
    epub_url: "https://www.gutenberg.org/ebooks/3333.epub3.images",
    txt_url: "https://www.gutenberg.org/cache/epub/3333/pg3333.txt",
    read_time: 480,
    year: 1572,
  },
  {
    id: "guten-55682",
    gutenberg_id: 55682,
    title: "Quincas Borba",
    author: "Machado de Assis",
    description: "Ao herdar a imensa fortuna do filósofo Quincas Borba com a única condição de cuidar de seu cão de mesmo nome, o ingênuo Rubião se muda para o Rio de Janeiro e cai nas malhas da cobiça e da loucura. 'Ao vencedor, as batatas!' Obra integral.",
    cover_url: "https://www.gutenberg.org/cache/epub/55682/pg55682.cover.medium.jpg",
    category: "Romance",
    price_cents: 0,
    currency: "BRL",
    published: true,
    featured: true,
    created_at: "2024-01-04T00:00:00Z",
    downloads: 7800,
    formats: ["Leitura Online", "EPUB", "TXT"],
    is_public_domain: true,
    epub_url: "https://www.gutenberg.org/ebooks/55682.epub3.images",
    txt_url: "https://www.gutenberg.org/cache/epub/55682/pg55682.txt",
    read_time: 350,
    year: 1891,
  },
  {
    id: "guten-40409",
    gutenberg_id: 40409,
    title: "Os Maias: Episódios da Vida Romântica",
    author: "Eça de Queirós",
    description: "Cume do Realismo português. Acompanha três gerações da aristocrática família Maia e o trágico caso amoroso entre Carlos da Maia e Maria Eduarda, sob o cenário corrosivo da Lisboa do fim do século XIX. Leitura integral.",
    cover_url: "https://www.gutenberg.org/cache/epub/40409/pg40409.cover.medium.jpg",
    category: "Romance",
    price_cents: 0,
    currency: "BRL",
    published: true,
    featured: true,
    created_at: "2024-01-05T00:00:00Z",
    downloads: 9400,
    formats: ["Leitura Online", "EPUB", "TXT"],
    is_public_domain: true,
    epub_url: "https://www.gutenberg.org/ebooks/40409.epub3.images",
    txt_url: "https://www.gutenberg.org/cache/epub/40409/pg40409.txt",
    read_time: 600,
    year: 1888,
  },
  {
    id: "guten-28341",
    gutenberg_id: 28341,
    title: "Da Terra à Lua: Viagem Directa em 97 Horas e 20 Minutos",
    author: "Jules Verne",
    description: "Pioneiro absoluto da ficção científica mundial, em clássica tradução para o português. Os membros do Gun Club de Baltimore projetam um gigantesco canhão para enviar três aventureiros e dois cães em viagem audaciosa à Lua.",
    cover_url: "https://www.gutenberg.org/cache/epub/28341/pg28341.cover.medium.jpg",
    category: "Ficção Científica",
    price_cents: 0,
    currency: "BRL",
    published: true,
    featured: true,
    created_at: "2024-01-06T00:00:00Z",
    downloads: 10200,
    formats: ["Leitura Online", "EPUB", "TXT"],
    is_public_domain: true,
    epub_url: "https://www.gutenberg.org/ebooks/28341.epub3.images",
    txt_url: "https://www.gutenberg.org/cache/epub/28341/pg28341.txt",
    read_time: 290,
    year: 1865,
  },
  {
    id: "guten-26988",
    gutenberg_id: 26988,
    title: "Amor de Salvação",
    author: "Camilo Castelo Branco",
    description: "Uma das obras mais líricas e intensas do Romantismo em língua portuguesa. A jornada dramática do amor purificador e das paixões humanas que desafiam as convenções morais do século XIX. Texto integral.",
    cover_url: "https://www.gutenberg.org/cache/epub/26988/pg26988.cover.medium.jpg",
    category: "Romance",
    price_cents: 0,
    currency: "BRL",
    published: true,
    featured: false,
    created_at: "2024-01-07T00:00:00Z",
    downloads: 5600,
    formats: ["Leitura Online", "EPUB", "TXT"],
    is_public_domain: true,
    epub_url: "https://www.gutenberg.org/ebooks/26988.epub3.images",
    txt_url: "https://www.gutenberg.org/cache/epub/26988/pg26988.txt",
    read_time: 270,
    year: 1864,
  },
  {
    id: "guten-31347",
    gutenberg_id: 31347,
    title: "Contos de Eça de Queirós",
    author: "Eça de Queirós",
    description: "Reunião de célebres contos fantásticos e satíricos do mestre português, incluindo 'Singularidades de uma Rapariga Loura', 'Um Poeta Lírico', 'No Moinho' e 'O Defunto'. Leituras ágeis e envolventes na íntegra.",
    cover_url: "https://www.gutenberg.org/cache/epub/31347/pg31347.cover.medium.jpg",
    category: "Narrativa",
    price_cents: 0,
    currency: "BRL",
    published: true,
    featured: false,
    created_at: "2024-01-08T00:00:00Z",
    downloads: 6300,
    formats: ["Leitura Online", "EPUB", "TXT"],
    is_public_domain: true,
    epub_url: "https://www.gutenberg.org/ebooks/31347.epub3.images",
    txt_url: "https://www.gutenberg.org/cache/epub/31347/pg31347.txt",
    read_time: 240,
    year: 1902,
  },
  {
    id: "guten-27637",
    gutenberg_id: 27637,
    title: "A Correspondência de Fradique Mendes",
    author: "Eça de Queirós",
    description: "Memórias, cartas e notas do genial e cosmopolita viajante Fradique Mendes. Um compêndio de reflexões brilhantes, crônicas de época e refinada prosa realista sobre a civilização e a cultura europeia e brasileira.",
    cover_url: "https://www.gutenberg.org/cache/epub/27637/pg27637.cover.medium.jpg",
    category: "Biografia e Autobiografia",
    price_cents: 0,
    currency: "BRL",
    published: true,
    featured: false,
    created_at: "2024-01-09T00:00:00Z",
    downloads: 4800,
    formats: ["Leitura Online", "EPUB", "TXT"],
    is_public_domain: true,
    epub_url: "https://www.gutenberg.org/ebooks/27637.epub3.images",
    txt_url: "https://www.gutenberg.org/cache/epub/27637/pg27637.txt",
    read_time: 310,
    year: 1900,
  },
  {
    id: "guten-24919",
    gutenberg_id: 24919,
    title: "Amor Crioulo: Vida Paulistana",
    author: "Abel Botelho",
    description: "Parte da série 'Patologia Social'. Um romance instigante e provocador ambientado na vibrante sociedade paulistana do final do século XIX, explorando as tensões, os costumes urbanos e os dramas da burguesia nascente.",
    cover_url: "https://www.gutenberg.org/cache/epub/24919/pg24919.cover.medium.jpg",
    category: "Romance",
    price_cents: 0,
    currency: "BRL",
    published: true,
    featured: false,
    created_at: "2024-01-11T00:00:00Z",
    downloads: 5200,
    formats: ["Leitura Online", "EPUB", "TXT"],
    is_public_domain: true,
    epub_url: "https://www.gutenberg.org/ebooks/24919.epub3.images",
    txt_url: "https://www.gutenberg.org/cache/epub/24919/pg24919.txt",
    read_time: 380,
    year: 1913,
  },
  {
    id: "guten-29040",
    gutenberg_id: 29040,
    title: "Como e Porque Sou Romancista",
    author: "José de Alencar",
    description: "Autobiografia literária e memórias de José de Alencar, um dos maiores nomes do Romantismo no Brasil. O autor revela seus processos criativos, as origens de 'O Guarani' e 'Iracema', e sua paixão pela fundação de uma literatura genuinamente brasileira.",
    cover_url: "https://www.gutenberg.org/cache/epub/29040/pg29040.cover.medium.jpg",
    category: "Biografia e Autobiografia",
    price_cents: 0,
    currency: "BRL",
    published: true,
    featured: false,
    created_at: "2024-01-12T00:00:00Z",
    downloads: 6800,
    formats: ["Leitura Online", "EPUB", "TXT"],
    is_public_domain: true,
    epub_url: "https://www.gutenberg.org/ebooks/29040.epub3.images",
    txt_url: "https://www.gutenberg.org/cache/epub/29040/pg29040.txt",
    read_time: 180,
    year: 1893,
  },
  {
    id: "guten-22622",
    gutenberg_id: 22622,
    title: "Aves Migradoras",
    author: "Fialho de Almeida",
    description: "Reunião de contos e crônicas do mestre naturalista português Fialho de Almeida. Narrativas afiadas, dotadas de estilo vigoroso e descrição impressionista da vida campestre e dos tipos humanos da época.",
    cover_url: "https://www.gutenberg.org/cache/epub/22622/pg22622.cover.medium.jpg",
    category: "Narrativa",
    price_cents: 0,
    currency: "BRL",
    published: true,
    featured: false,
    created_at: "2024-01-13T00:00:00Z",
    downloads: 4100,
    formats: ["Leitura Online", "EPUB", "TXT"],
    is_public_domain: true,
    epub_url: "https://www.gutenberg.org/ebooks/22622.epub3.images",
    txt_url: "https://www.gutenberg.org/cache/epub/22622/pg22622.txt",
    read_time: 260,
    year: 1914,
  },
  {
    id: "guten-26777",
    gutenberg_id: 26777,
    title: "A Revolução Portugueza: O 5 de Outubro (Lisboa 1910)",
    author: "Francisco Jorge de Abreu",
    description: "Relato histórico e documental detalhado da implantação da República em Portugal em outubro de 1910. Com depoimentos de líderes, registros da revolta popular militar e a queda da monarquia constitucional.",
    cover_url: "https://www.gutenberg.org/cache/epub/26777/pg26777.cover.medium.jpg",
    category: "Biografia e Autobiografia",
    price_cents: 0,
    currency: "BRL",
    published: true,
    featured: false,
    created_at: "2024-01-14T00:00:00Z",
    downloads: 4900,
    formats: ["Leitura Online", "EPUB", "TXT"],
    is_public_domain: true,
    epub_url: "https://www.gutenberg.org/ebooks/26777.epub3.images",
    txt_url: "https://www.gutenberg.org/cache/epub/26777/pg26777.txt",
    read_time: 330,
    year: 1912,
  },
  {
    id: "guten-31552",
    gutenberg_id: 31552,
    title: "Novo Dicionário da Língua Portuguesa",
    author: "Cândido de Figueiredo",
    description: "Obra de referência monumental da lexicografia portuguesa. Milhares de verbetes, etimologias, definições históricas e termos clássicos da língua portuguesa para estudo e consulta acadêmica e literária.",
    cover_url: "https://www.gutenberg.org/cache/epub/31552/pg31552.cover.medium.jpg",
    category: "Didáticos e Técnicos",
    price_cents: 0,
    currency: "BRL",
    published: true,
    featured: false,
    created_at: "2024-01-15T00:00:00Z",
    downloads: 16800,
    formats: ["Leitura Online", "EPUB", "TXT"],
    is_public_domain: true,
    epub_url: "https://www.gutenberg.org/ebooks/31552.epub3.images",
    txt_url: "https://www.gutenberg.org/cache/epub/31552/pg31552.txt",
    read_time: 1200,
    year: 1899,
  },
  {
    id: "guten-62383",
    gutenberg_id: 62383,
    title: "A Bíblia Sagrada (Antigo e Novo Testamento)",
    author: "Tradução João Ferreira de Almeida",
    description: "Texto canônico completo da Bíblia Sagrada em língua portuguesa, com todos os livros históricos, poéticos, proféticos, os quatro evangelhos e as epístolas para leitura e consulta livre sem restrições.",
    cover_url: "https://www.gutenberg.org/cache/epub/62383/pg62383.cover.medium.jpg",
    category: "Religiosos/Espiritual",
    price_cents: 0,
    currency: "BRL",
    published: true,
    featured: false,
    created_at: "2024-01-10T00:00:00Z",
    downloads: 25400,
    formats: ["Leitura Online", "EPUB", "TXT"],
    is_public_domain: true,
    epub_url: "https://www.gutenberg.org/ebooks/62383.epub3.images",
    txt_url: "https://www.gutenberg.org/cache/epub/62383/pg62383.txt",
    read_time: 1400,
    year: 1819,
  },
];

/** Fetch live Gutenberg catalog via backend proxy */
export async function fetchGutenbergCatalog(search = ""): Promise<GutenbergBook[]> {
  try {
    const url = `/api/books/catalog${search ? `?search=${encodeURIComponent(search)}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Falha ao buscar catálogo");
    const data = await res.json();
    if (Array.isArray(data.books) && data.books.length > 0) {
      // Merge with curated list so curated entries always have their best metadata & authentic covers
      const map = new Map<string, GutenbergBook>();
      for (const b of CURATED_GUTENBERG_BOOKS) map.set(b.id, b);
      for (const b of data.books) {
        if (!map.has(b.id)) map.set(b.id, b);
      }
      const list = Array.from(map.values());
      return search
        ? list.filter((b) =>
            b.title.toLowerCase().includes(search.toLowerCase()) ||
            b.author.toLowerCase().includes(search.toLowerCase())
          )
        : list;
    }
    return CURATED_GUTENBERG_BOOKS;
  } catch {
    return CURATED_GUTENBERG_BOOKS.filter((b) =>
      search
        ? b.title.toLowerCase().includes(search.toLowerCase()) ||
          b.author.toLowerCase().includes(search.toLowerCase())
        : true
    );
  }
}

/** Fetch full parsed chapters for a book */
export async function fetchGutenbergChapters(bookId: string): Promise<GutenbergChapter[]> {
  const cleanId = bookId.replace(/^guten-/, "");
  try {
    const res = await fetch(`/api/books/chapters?bookId=${cleanId}`);
    if (!res.ok) throw new Error("Falha ao carregar capítulos");
    const data = await res.json();
    return data.chapters || [];
  } catch (err) {
    console.error("Erro ao carregar capítulos Gutenberg:", err);
    return [];
  }
}
