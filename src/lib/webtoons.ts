export type WebtoonDay =
  | "Segunda"
  | "Terça"
  | "Quarta"
  | "Quinta"
  | "Sexta"
  | "Sábado"
  | "Domingo"
  | "Concluído";

export interface WebtoonEpisode {
  id: string;
  webtoon_id: string;
  number: number;
  title: string;
  synopsis: string;
  cover: string;
  release_date: string;
  views: number;
  likes: number;
  panels: string[];
  is_free: boolean;
}

export interface Webtoon {
  id: string;
  title: string;
  korean_title?: string;
  slug: string;
  author: string;
  artist: string;
  description: string;
  cover: string;
  banner: string;
  rating: number;
  rating_count: number;
  views: number;
  genres: string[];
  status: "Em lançamento" | "Concluído";
  release_day: WebtoonDay;
  color_theme?: string;
  featured?: boolean;
  trending?: boolean;
  weekly_rank?: number;
  collection?: string;
  episodes_count: number;
  episodes: WebtoonEpisode[];
}

export const WEBTOON_GENRES = [
  "Todos",
  "Ação",
  "Fantasia",
  "Murim",
  "Isekai",
  "Sobrenatural",
  "Romance",
  "Comédia",
  "Sci-Fi",
  "Esportes",
  "Drama",
  "Terror",
  "Escolar",
  "Mistério",
  "Psicológico",
];

export const RELEASE_DAYS: Array<{ value: WebtoonDay | "Todos"; label: string; short: string }> = [
  { value: "Todos", label: "Todos os Dias", short: "Todos" },
  { value: "Segunda", label: "Segunda-feira", short: "Seg" },
  { value: "Terça", label: "Terça-feira", short: "Ter" },
  { value: "Quarta", label: "Quarta-feira", short: "Qua" },
  { value: "Quinta", label: "Quinta-feira", short: "Qui" },
  { value: "Sexta", label: "Sexta-feira", short: "Sex" },
  { value: "Sábado", label: "Sábado", short: "Sáb" },
  { value: "Domingo", label: "Domingo", short: "Dom" },
  { value: "Concluído", label: "Obras Completas", short: "Fim" },
];

// Helper to generate sequential pages
const generatePages = (basePath: string, count: number): string[] => {
  return Array.from({ length: count }, (_, i) => `${basePath}/page-${i + 1}.jpg`);
};

export const BASE_CURATED_WEBTOONS: Webtoon[] = [
  {
    id: "wt-solo-leveling",
    title: "Solo Leveling: ReAwakening",
    korean_title: "나 혼자만 레벨업",
    slug: "solo-leveling",
    author: "Chugong",
    artist: "DUBU (REDICE Studio)",
    description:
      "Em um mundo onde caçadores humanos despertam habilidades mágicas para combater monstros mortais, Sung Jinwoo é conhecido como 'o caçador mais fraco da humanidade'. À beira da morte em uma masmorra dupla implacável, ele aceita uma misteriosa missão que o transforma no único ser humano capaz de subir de nível sem limites. A obra pioneira que redefiniu o gênero de caçadores e sistemas mundiais.",
    cover: "/covers/webtoons/solo-leveling-cover.jpg",
    banner: "/covers/webtoons/solo-leveling-cover.jpg",
    rating: 9.9,
    rating_count: 64200,
    views: 489000,
    genres: ["Ação", "Sobrenatural", "Fantasia"],
    status: "Em lançamento",
    release_day: "Sábado",
    featured: true,
    trending: true,
    weekly_rank: 1,
    collection: "Sistemas & Caçadores",
    episodes_count: 3,
    episodes: [
      {
        id: "wt-solo-ep-1",
        webtoon_id: "wt-solo-leveling",
        number: 1,
        title: "Capítulo 1 — O Caçador Mais Fraco da Humanidade",
        synopsis: "Sung Jinwoo e sua equipe adentram uma masmorra de rank D comum e descobrem a passagem secreta para o Templo de Cártem.",
        cover: "/chapters/solo-leveling/ep-1/page-1.jpg",
        release_date: "2026-11-01T00:00:00Z",
        views: 124500,
        likes: 18200,
        panels: generatePages("/chapters/solo-leveling/ep-1", 27),
        is_free: true,
      },
      {
        id: "wt-solo-ep-2",
        webtoon_id: "wt-solo-leveling",
        number: 2,
        title: "Capítulo 2 — Os Três Mandamentos de Cártem",
        synopsis: "As estátuas colossais ganham vida e Jinwoo decifra os três mandamentos sagrados para manter seus companheiros vivos.",
        cover: "/chapters/solo-leveling/ep-2/page-1.jpg",
        release_date: "2026-11-02T00:00:00Z",
        views: 108300,
        likes: 15400,
        panels: generatePages("/chapters/solo-leveling/ep-2", 22),
        is_free: true,
      },
      {
        id: "wt-solo-ep-3",
        webtoon_id: "wt-solo-leveling",
        number: 3,
        title: "Capítulo 3 — O Sacrifício e o Despertar do Jogador",
        synopsis: "Abandonado pelos sobreviventes ao redor do altar em chamas, a janela misteriosa do Sistema surge diante de seus olhos.",
        cover: "/chapters/solo-leveling/ep-3/page-1.jpg",
        release_date: "2026-11-03T00:00:00Z",
        views: 95400,
        likes: 14100,
        panels: generatePages("/chapters/solo-leveling/ep-3", 33),
        is_free: true,
      },
    ],
  },
  {
    id: "wt-omniscient-reader",
    title: "O Ponto de Vista do Leitor Onisciente",
    korean_title: "전지적 독자 시점",
    slug: "omniscient-reader",
    author: "sing N song",
    artist: "Sleepy-C (REDICE Studio)",
    description:
      "Kim Dokja era um funcionário comum cujo único prazer na vida era ler uma webnovel impopular de 3.149 capítulos chamada 'Três Maneiras de Sobreviver em um Mundo Apocalíptico'. No momento exato em que ele termina o capítulo final, o mundo real se quebra e a história da novel ganha vida. Dokja é a única pessoa na Terra que sabe como o apocalipse começa e onde ele termina.",
    cover: "/covers/webtoons/orv-cover.jpg",
    banner: "/covers/webtoons/orv-cover.jpg",
    rating: 9.8,
    rating_count: 53100,
    views: 412000,
    genres: ["Ação", "Fantasia", "Sobrenatural"],
    status: "Em lançamento",
    release_day: "Terça",
    featured: true,
    trending: true,
    weekly_rank: 2,
    collection: "Sistemas & Caçadores",
    episodes_count: 2,
    episodes: [
      {
        id: "wt-orv-ep-1",
        webtoon_id: "wt-omniscient-reader",
        number: 1,
        title: "Capítulo 1 — Prólogo do Fim do Mundo",
        synopsis: "No metrô de Seul voltando do trabalho, Kim Dokja termina o capítulo 3.149 de TWSA e o dokkaebi Bihyung surge iniciando o primeiro cenário.",
        cover: "/chapters/omniscient-reader/ep-1/page-1.jpg",
        release_date: "2026-11-01T00:00:00Z",
        views: 98000,
        likes: 16100,
        panels: generatePages("/chapters/omniscient-reader/ep-1", 42),
        is_free: true,
      },
      {
        id: "wt-orv-ep-2",
        webtoon_id: "wt-omniscient-reader",
        number: 2,
        title: "Capítulo 2 — Iniciando o Serviço Pago",
        synopsis: "O relógio começa a correr: cada pessoa no vagão deve matar uma criatura viva antes de expirar o tempo. O caos toma conta de Seul.",
        cover: "/chapters/omniscient-reader/ep-2/page-1.jpg",
        release_date: "2026-11-02T00:00:00Z",
        views: 89400,
        likes: 14700,
        panels: generatePages("/chapters/omniscient-reader/ep-2", 31),
        is_free: true,
      },
    ],
  },
  {
    id: "wt-the-beginning-after-the-end",
    title: "The Beginning After the End",
    korean_title: "끝이 아닌 시작",
    slug: "the-beginning-after-the-end",
    author: "TurtleMe",
    artist: "Fuyuki23",
    description:
      "O Rei Grey possui riqueza sem paralelo, prestígio e força militar formidável em um mundo governado pelo poder das artes marciais. No entanto, a solidão profunda corrompe seu coração. Reencarnado como Arthur Leywin em um novo continente mágico povoado por feras míticas, magos e elfos, ele tem uma segunda chance de aprender o valor do amor, da família e de proteger os que ama.",
    cover: "/covers/webtoons/tbate-cover.jpg",
    banner: "/covers/webtoons/tbate-cover.jpg",
    rating: 9.8,
    rating_count: 49800,
    views: 395000,
    genres: ["Fantasia", "Isekai", "Ação"],
    status: "Em lançamento",
    release_day: "Sexta",
    featured: true,
    trending: true,
    weekly_rank: 3,
    collection: "Isekai & Realeza",
    episodes_count: 1,
    episodes: [
      {
        id: "wt-tbate-ep-1",
        webtoon_id: "wt-the-beginning-after-the-end",
        number: 1,
        title: "Capítulo 1 — O Despertar da Centelha de Mana",
        synopsis: "O Rei Grey renasce como Arthur Leywin e descobre as partículas de mana que dançam pelo ar no novo reino.",
        cover: "/chapters/tbate/ep-1/page-1.jpg",
        release_date: "2026-11-01T00:00:00Z",
        views: 84300,
        likes: 14200,
        panels: generatePages("/chapters/tbate/ep-1", 55),
        is_free: true,
      },
    ],
  },
  {
    id: "wt-nano-machine",
    title: "Nano Machine",
    korean_title: "나노 마신",
    slug: "nano-machine",
    author: "Jeolmu Hyeon",
    artist: "GGBG (REDICE Studio)",
    description:
      "Cheon Yeo-woon é o filho ilegítimo do Lorde do Culto Demoníaco, perseguido implacavelmente pelos seis clãs rivais que desejam aniquilá-lo antes que ele dispute a sucessão. Prestes a ser assassinado em uma emboscada noturna, um descendente vindo do futuro distante injeta em seu corpo uma máquina de nanotecnologia de sétima geração que recalcula seus meridianos marciais e concede poder sobre-humano.",
    cover: "/covers/webtoons/nano-machine-cover.jpg",
    banner: "/covers/webtoons/nano-machine-cover.jpg",
    rating: 9.7,
    rating_count: 38400,
    views: 341000,
    genres: ["Murim", "Ação", "Sci-Fi"],
    status: "Em lançamento",
    release_day: "Quinta",
    featured: true,
    trending: true,
    weekly_rank: 4,
    collection: "Murim & Artes Marciais",
    episodes_count: 1,
    episodes: [
      {
        id: "wt-nano-ep-1",
        webtoon_id: "wt-nano-machine",
        number: 1,
        title: "Capítulo 1 — A Injeção da Máquina do Século XXI",
        synopsis: "Sangrando na sarjeta do Grande Culto Demoníaco, Yeo-woon recebe a injeção misteriosa e o sistema artificial Nano ativa a varredura biológica.",
        cover: "/chapters/nano-machine/ep-1/page-1.jpg",
        release_date: "2026-11-01T00:00:00Z",
        views: 74200,
        likes: 12100,
        panels: generatePages("/chapters/nano-machine/ep-1", 21),
        is_free: true,
      },
    ],
  },
  {
    id: "wt-tower-of-god",
    title: "Tower of God",
    korean_title: "신의 탑",
    slug: "tower-of-god",
    author: "SIU",
    artist: "SIU",
    description:
      "O que você mais deseja? Dinheiro e riqueza? Glória e honra? Poder e autoridade? Vingança? Ou algo que transcenda tudo isso? Seja o que for que você procure, 'está aqui', no topo da Torre de Deus. Bam, um jovem ingênuo que nunca conheceu a luz do sol, adentra os portões proibidos da Torre arriscando sua própria vida para reencontrar Rachel, sua única amiga.",
    cover: "/covers/webtoons/tower-of-god-cover.jpg",
    banner: "/covers/webtoons/tower-of-god-cover.jpg",
    rating: 9.6,
    rating_count: 58200,
    views: 472000,
    genres: ["Fantasia", "Ação", "Sobrenatural"],
    status: "Em lançamento",
    release_day: "Segunda",
    featured: true,
    trending: true,
    weekly_rank: 5,
    collection: "Fantasia Épica",
    episodes_count: 0,
    episodes: [],
  },
  {
    id: "wt-return-mount-hua",
    title: "O Retorno da Seita do Monte Hua",
    korean_title: "화산귀환",
    slug: "return-mount-hua",
    author: "Biga",
    artist: "LICO (Studio LICO)",
    description:
      "Chung Myung, o Santo da Espada da Flor de Ameixa do Monte Hua, sacrifica sua própria vida para decapitar o Demônio Celestial supremo e salvar a humanidade. Cem anos depois, ele renasce no corpo de um garoto mendigo e corre empolgado para o Monte Hua, apenas para descobrir que sua outrora gloriosa seita foi reduzida a ruínas empoeiradas e esquecida pelo mundo. Munido de gênio e sarcasmo incomparáveis, ele decide reconstruir a seita do zero.",
    cover: "/covers/webtoons/mount-hua-cover.jpg",
    banner: "/covers/webtoons/mount-hua-cover.jpg",
    rating: 9.8,
    rating_count: 42100,
    views: 367000,
    genres: ["Murim", "Comédia", "Ação"],
    status: "Em lançamento",
    release_day: "Quarta",
    featured: true,
    trending: true,
    weekly_rank: 6,
    collection: "Murim & Artes Marciais",
    episodes_count: 0,
    episodes: [],
  },
  {
    id: "wt-lore-olympus",
    title: "Lore Olympus",
    korean_title: "로어 올림푸스",
    slug: "lore-olympus",
    author: "Rachel Smythe",
    artist: "Rachel Smythe",
    description:
      "Vencedor dos prêmios Eisner e Harvey. Uma releitura moderna, estilosa e comovente do mito grego de Perséfone e Hades. Perséfone, jovem deusa da primavera protegida com rigor por sua mãe Deméter no reino mortal, muda-se para o reluzente Olimpo moderno para estudar e acaba chamando a atenção do discreto e solitário regente do Submundo.",
    cover: "/covers/webtoons/lore-olympus-cover.jpg",
    banner: "/covers/webtoons/lore-olympus-cover.jpg",
    rating: 9.7,
    rating_count: 51200,
    views: 420000,
    genres: ["Romance", "Drama", "Fantasia"],
    status: "Concluído",
    release_day: "Domingo",
    featured: true,
    trending: true,
    weekly_rank: 7,
    collection: "Romance & Emoção",
    episodes_count: 0,
    episodes: [],
  },
  {
    id: "wt-eleceed",
    title: "Eleceed",
    korean_title: "일렉시드",
    slug: "eleceed",
    author: "Jeho Son",
    artist: "ZHENA",
    description:
      "Jiwoo é um estudante do ensino médio bondoso que resgata todos os gatos vadios do bairro e esconde um segredo perigoso: ele tem o dom da supervelocidade felina. Kayden é um agente secreto despertado e o usuário de eletricidade mais forte do mundo que, gravemente ferido em fuga, se disfarça no corpo de um gato gordo e peludo. Juntos, essa dupla improvável enfrenta o submundo das batalhas de despertados.",
    cover: "/covers/webtoons/eleceed-cover.jpg",
    banner: "/covers/webtoons/eleceed-cover.jpg",
    rating: 9.9,
    rating_count: 36700,
    views: 320000,
    genres: ["Ação", "Comédia", "Sobrenatural"],
    status: "Em lançamento",
    release_day: "Terça",
    featured: true,
    trending: true,
    weekly_rank: 8,
    collection: "Sistemas & Caçadores",
    episodes_count: 0,
    episodes: [],
  },
  {
    id: "wt-villainess-marionette",
    title: "A Vilã É Uma Marionete",
    korean_title: "악녀는 마리오네트",
    slug: "villainess-marionette",
    author: "Han Yi-rim",
    artist: "Manggle",
    description:
      "A princesa Cayena Hill sempre viveu como uma marionete descartável nos jogos de poder de seu irmão tirano Regef, culminando em sua execução brutal. Ao renascer com as memórias de sua vida anterior, ela corta as cordas invisíveis que a controlavam. Com inteligência magistral, elegância fatal e o apoio estratégico do misterioso Duque Raffaello Kidrey, ela assume o xadrez do império.",
    cover: "/covers/webtoons/villainess-marionette-cover.jpg",
    banner: "/covers/webtoons/villainess-marionette-cover.jpg",
    rating: 9.7,
    rating_count: 31200,
    views: 295000,
    genres: ["Romance", "Isekai", "Drama"],
    status: "Em lançamento",
    release_day: "Segunda",
    featured: true,
    trending: true,
    weekly_rank: 9,
    collection: "Isekai & Realeza",
    episodes_count: 0,
    episodes: [],
  },
  {
    id: "wt-wind-breaker",
    title: "Wind Breaker",
    korean_title: "윈드브레이커",
    slug: "wind-breaker",
    author: "Yongseok Jo",
    artist: "Yongseok Jo",
    description:
      "Jay é o presidente perfeito do grêmio estudantil do Colégio Taeyang, focado 100% nas notas e nas expectativas de sua família. Mas quando ele monta em sua bicicleta de marcha fixa (fixie) pelas ladeiras da cidade à noite, ele corta os ventos com velocidade e reflexos insanos. Ao ser desafiado pela equipe Hummingbird, Jay descobre a paixão pura pelas competições de ciclismo de rua do torneio League of Street.",
    cover: "/covers/webtoons/wind-breaker-cover.jpg",
    banner: "/covers/webtoons/wind-breaker-cover.jpg",
    rating: 9.8,
    rating_count: 44200,
    views: 380000,
    genres: ["Esportes", "Drama", "Ação"],
    status: "Concluído",
    release_day: "Concluído",
    featured: true,
    trending: true,
    weekly_rank: 10,
    collection: "Maratonar Obras Completas",
    episodes_count: 0,
    episodes: [],
  },
  {
    id: "wt-the-greatest-estate-developer",
    title: "O Maior Desenvolvedor Imobiliário",
    korean_title: "역대급 영지 설계사",
    slug: "the-greatest-estate-developer",
    author: "BK_Moon",
    artist: "Kim Hyunsoo",
    description:
      "Kim Suho, um brilhante estudante de engenharia civil na Coreia do Sul, acorda misteriosamente no corpo de Lloyd Frontera, o filho mimado e alcoólatra de um barão à beira da falência em um romance de fantasia medieval. Usando conhecimentos avançados de termodinâmica, engenharia estrutural e o tradicional sistema de aquecimento de piso Ondol, ele decide reerguer a província e garantir uma aposentadoria dourada enquanto engana monstros e nobres gananciosos com seus sorrisos demoníacos hilários.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx140228-E6gO1FfSg5Wb.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/manga/banner/140228-WbUeP7L2iV7n.jpg",
    rating: 9.9,
    rating_count: 52400,
    views: 465000,
    genres: ["Fantasia", "Comédia", "Isekai"],
    status: "Em lançamento",
    release_day: "Sexta",
    featured: true,
    trending: true,
    weekly_rank: 2,
    collection: "Isekai & Realeza",
    episodes_count: 175,
    episodes: [],
  },
  {
    id: "wt-lookism",
    title: "Lookism (Aparências)",
    korean_title: "외모지상주의",
    slug: "lookism",
    author: "Park Tae-joon",
    artist: "Park Tae-joon",
    description:
      "Daniel Park é um estudante do ensino médio obeso e inseguro que sofre bullying diário e impiedoso na escola. Desesperado para escapar do tormento, ele se transfere para Seul. Na véspera do primeiro dia de aula, um milagre acontece: ele acorda no corpo de um jovem alto, extremamente atlético e deslumbrante, enquanto seu corpo original dorme ao lado. Alternando entre os dois corpos a cada 12 horas, Daniel desvenda o submundo das gangues de Seul e os segredos do corpo perfeito.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx86377-O71x1h6mYn8S.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/manga/banner/86377-U8tUjV6o2N0J.jpg",
    rating: 9.8,
    rating_count: 67800,
    views: 520000,
    genres: ["Ação", "Drama", "Escolar"],
    status: "Em lançamento",
    release_day: "Quinta",
    featured: true,
    trending: true,
    weekly_rank: 3,
    collection: "Maratonar Obras Completas",
    episodes_count: 480,
    episodes: [],
  },
  {
    id: "wt-sss-class-suicide-hunter",
    title: "Caçador Suicida de Rank SSS",
    korean_title: "SSS급 죽어야 사는 헌터",
    slug: "sss-class-suicide-hunter",
    author: "Shin Noah",
    artist: "Bill K",
    description:
      "Gongja Kim é um caçador miserável de rank F que inveja o renomado Santo da Espada Flamejante. Desesperado por poder, ele recebe do Sistema uma habilidade de rank SSS bizarra: copiar uma habilidade de quem o assassinar, voltando 24 horas no tempo a cada morte. Após descobrir que seu ídolo é um assassino sádico, Gongja comete suicídio mais de 4.000 vezes para voltar quatro mil dias no tempo e punir o monstro antes que ele atinja o estrelato, iniciando uma das jornadas mais profundas e poéticas da ficção coreana.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx128039-PqI0x1h6mYn8S.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/manga/banner/128039-U8tUjV6o2N0J.jpg",
    rating: 9.9,
    rating_count: 48900,
    views: 430000,
    genres: ["Ação", "Fantasia", "Psicológico"],
    status: "Em lançamento",
    release_day: "Terça",
    featured: true,
    trending: true,
    weekly_rank: 4,
    collection: "Sistemas & Caçadores",
    episodes_count: 120,
    episodes: [],
  },
  {
    id: "wt-doom-breaker",
    title: "O Deus Batalhador Suicida (Doom Breaker)",
    korean_title: "투신전생기",
    slug: "doom-breaker",
    author: "Blue-Deep",
    artist: "Blue-Deep",
    description:
      "Em um mundo abandonado pelos céus e devastado pela invasão dos apóstolos do Deus da Destruição Tartaros, Zephyr foi o último guerreiro humano a ficar de pé. Derrotado mas insubmisso após decepar um membro da própria divindade, o Panteão dos Deuses acha sua bravura tão eletrizante que decide dar a ele uma segunda chance: retornar ao passado mantendo suas memórias e recebendo a bênção do Dragão Azul ancestral.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx136192-K8tUjV6o2N0J.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/manga/banner/136192-U8tUjV6o2N0J.jpg",
    rating: 9.8,
    rating_count: 41200,
    views: 390000,
    genres: ["Ação", "Fantasia", "Sobrenatural"],
    status: "Em lançamento",
    release_day: "Sábado",
    featured: true,
    trending: true,
    weekly_rank: 6,
    collection: "Fantasia Épica",
    episodes_count: 110,
    episodes: [],
  },
  {
    id: "wt-murim-login",
    title: "Login no Murim",
    korean_title: "무림 로그인",
    slug: "murim-login",
    author: "ZEROBIG",
    artist: "Jang Chul-gyu",
    description:
      "Jin Tae-Kyung é um caçador miserável de rank F no mundo moderno que sobrevive minerando cristais em masmorras. Um dia, ele tropeça em uma cápsula de realidade virtual descartada e, ao ligá-la, sua consciência é sugada para dentro do lendário mundo das artes marciais de Jianghu, no corpo do segundo filho desajeitado de um clã nobre. O que ele não esperava é que todas as estatísticas, força interna de Qi e artes marciais aprendidas no Murim continuam ativas quando ele desloga de volta para a Terra!",
    cover: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx118086-O8tUjV6o2N0J.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/manga/banner/118086-U8tUjV6o2N0J.jpg",
    rating: 9.8,
    rating_count: 39500,
    views: 382000,
    genres: ["Murim", "Comédia", "Ação"],
    status: "Em lançamento",
    release_day: "Sábado",
    featured: true,
    trending: true,
    weekly_rank: 7,
    collection: "Murim & Artes Marciais",
    episodes_count: 190,
    episodes: [],
  },
  {
    id: "wt-sweet-home",
    title: "Sweet Home",
    korean_title: "스위트홈",
    slug: "sweet-home",
    author: "Kim Carnby",
    artist: "Hwang Young-chan",
    description:
      "Após uma tragédia familiar que ceifou a vida de seus pais e irmã, o recluso Cha Hyun-soo se muda para o decadente complexo de apartamentos Green Home, planejando cometer suicídio no final do mês. No entanto, quando uma misteriosa infecção global começa a transformar as pessoas em monstros bizarros e grotescos alimentados por seus desejos mais íntimos, Hyun-soo e os residentes sobreviventes são forçados a lutar desesperadamente para permanecer humanos.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx100924-O8tUjV6o2N0J.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/manga/banner/100924-U8tUjV6o2N0J.jpg",
    rating: 9.9,
    rating_count: 58000,
    views: 450000,
    genres: ["Terror", "Sobrenatural", "Drama"],
    status: "Concluído",
    release_day: "Concluído",
    featured: true,
    trending: true,
    weekly_rank: 8,
    collection: "Maratonar Obras Completas",
    episodes_count: 141,
    episodes: [],
  },
  {
    id: "wt-teenage-mercenary",
    title: "Mercenário Adolescente (Teenage Mercenary)",
    korean_title: "입학용병",
    slug: "teenage-mercenary",
    author: "YC",
    artist: "Rakhyun",
    description:
      "Aos oito anos de idade, Ijin Yu foi o único sobrevivente de um acidente aéreo em território estrangeiro. Para sobreviver na selva brutal, ele foi forçado a se tornar um mercenário de elite de letalidade inigualável conhecido pelo codinome 'Agente 001'. Dez anos depois, ele finalmente é resgatado e retorna à Coreia do Sul para reencontrar seu avô e sua irmã mais nova. Matriculado em uma escola comum, ele usará todas as suas táticas militares para proteger sua nova família contra valentões e sindicatos corporativos.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx125860-O8tUjV6o2N0J.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/manga/banner/125860-U8tUjV6o2N0J.jpg",
    rating: 9.8,
    rating_count: 45600,
    views: 410000,
    genres: ["Ação", "Escolar", "Drama"],
    status: "Em lançamento",
    release_day: "Domingo",
    featured: true,
    trending: true,
    weekly_rank: 9,
    collection: "Ação & Estratégia",
    episodes_count: 200,
    episodes: [],
  },
  {
    id: "wt-damn-reincarnation",
    title: "Maldita Reencarnação (Damn Reincarnation)",
    korean_title: "빌어먹을 환생",
    slug: "damn-reincarnation",
    author: "Kiki",
    artist: "Studio LICO",
    description:
      "Hamel viajou ao lado do herói Vermouth e de seus companheiros lendários para exterminar os cinco Reis Demônios, morrendo antes que a guerra terminasse. Trezentos anos depois, ele acorda reencarnado como Eugene Lionheart, um descendente direto da linhagem do herói Vermouth. Ao descobrir que o mundo vive sob uma falsa paz e que a história oficial foi distorcida para ocultar um pacto sinistro, Eugene empunha a lâmina novamente para terminar o que começou em sua vida anterior.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx148906-O8tUjV6o2N0J.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/manga/banner/148906-U8tUjV6o2N0J.jpg",
    rating: 9.8,
    rating_count: 42100,
    views: 395000,
    genres: ["Ação", "Fantasia", "Sobrenatural"],
    status: "Em lançamento",
    release_day: "Quinta",
    featured: true,
    trending: true,
    weekly_rank: 10,
    collection: "Fantasia Épica",
    episodes_count: 110,
    episodes: [],
  },
];

import { EXPANDED_WEBTOONS } from "@/data/expandedWebtoons";
import { getFullWebtoonChapters } from "./webtoonSyncEngine";
import { getOfficialCover } from "./webtoonCovers";

// Apply authentic official covers to base webtoons
const normalizedBaseCurated: Webtoon[] = BASE_CURATED_WEBTOONS.map((w) => {
  const official = getOfficialCover(w.id, w.slug, w.cover);
  return {
    ...w,
    cover: official.cover,
    banner: official.banner,
    korean_title: official.korean_title || w.korean_title,
  };
});

// Map expanded items to Webtoon interface with authentic official covers
const mappedExpandedWebtoons: Webtoon[] = EXPANDED_WEBTOONS.map((e) => {
  const official = getOfficialCover(e.id, e.slug, e.cover);
  const resolvedCover = official.cover;
  const resolvedBanner = official.banner;
  const resolvedKorean = official.korean_title || e.korean_title;
  return {
    id: e.id,
    title: e.title,
    korean_title: resolvedKorean,
    slug: e.slug,
    author: e.author,
    artist: e.artist,
    description: e.description,
    cover: resolvedCover,
    banner: resolvedBanner,
    rating: e.rating,
    rating_count: e.rating_count,
    views: e.views,
    genres: e.genres,
    status: e.status,
    release_day: e.release_day,
    featured: e.featured,
    trending: e.trending,
    weekly_rank: e.weekly_rank,
    collection: e.collection,
    episodes_count: e.episodes_count || 60,
    episodes: getFullWebtoonChapters(e.id),
  };
});

export const CURATED_WEBTOONS: Webtoon[] = [
  ...normalizedBaseCurated,
  ...mappedExpandedWebtoons,
];

export function getCuratedWebtoons(): Webtoon[] {
  return CURATED_WEBTOONS.map((w) => {
    const fullEpisodes = w.episodes && w.episodes.length > 0 ? w.episodes : getFullWebtoonChapters(w.id);
    return {
      ...w,
      episodes_count: fullEpisodes.length || w.episodes_count || 60,
      episodes: fullEpisodes,
    };
  });
}

export function getWebtoonById(id: string): Webtoon | undefined {
  if (!id) return undefined;
  const cleanId = id.startsWith("wt-") ? id : `wt-${id}`;
  const rawSlug = id.replace(/^wt-auto-/, "").replace(/^wt-/, "");
  const found = CURATED_WEBTOONS.find(
    (w) =>
      w.id === id ||
      w.id === cleanId ||
      w.id === `wt-auto-${rawSlug}` ||
      w.slug === id ||
      w.slug === rawSlug
  );
  if (!found) return undefined;
  const fullEpisodes = found.episodes && found.episodes.length > 0 ? found.episodes : getFullWebtoonChapters(found.id);
  return {
    ...found,
    episodes_count: fullEpisodes.length || found.episodes_count || 60,
    episodes: fullEpisodes,
  };
}

export function getWebtoonsByDay(day: WebtoonDay | "Todos"): Webtoon[] {
  const all = getCuratedWebtoons();
  if (day === "Todos") return all;
  return all.filter((w) => w.release_day === day);
}

export function getTrendingWebtoons(): Webtoon[] {
  return [...getCuratedWebtoons()].sort((a, b) => b.views - a.views);
}

export function getWebtoonsByCollection(collectionName: string): Webtoon[] {
  return getCuratedWebtoons().filter((w) => w.collection === collectionName);
}
