/**
 * MangaDex, MangaPill & Webtoon Multi-Source Integration Engine
 * Provides authentic official manga metadata, dynamic chapter feeds, and high-speed proxied page streams
 * for all anime series on Worscoi.
 */

export interface MangaDexChapter {
  id: string;
  number: string;
  numericNumber: number;
  title: string;
  volume?: string;
  pagesCount: number;
  translatedLanguage: string;
  scanlationGroup: string;
  publishAt: string;
  isExternal?: boolean;
  externalUrl?: string | null;
  isFree: boolean;
  chapterUrl?: string;
}

export interface AnimeMangaHubConfig {
  animeId: string;
  mangadexId: string;
  canonicalTitle: string;
  japaneseTitle: string;
  author: string;
  artist: string;
  publisher: string;
  serialization: string;
  status: "Em publicação" | "Completo" | "Hiato";
  officialCover: string;
  totalChaptersEstimate: number;
  defaultLanguage: "pt-br" | "en" | "all";
  initialChapters: {
    id: string;
    number: number;
    title: string;
    pagesCount: number;
    pages?: string[];
    chapterUrl?: string;
    description: string;
    releaseDate: string;
    isFree: boolean;
    mangadexChapterId?: string;
  }[];
}

// Helper to generate local page paths
const localPages = (basePath: string, count: number): string[] => {
  return Array.from({ length: count }, (_, i) => `${basePath}/page-${i + 1}.jpg`);
};

export const ANIME_MANGA_CONFIGS: Record<string, AnimeMangaHubConfig> = {
  "solo-leveling": {
    animeId: "solo-leveling",
    mangadexId: "32d76d19-8a05-4db0-9fc2-e0b0648fe9d0",
    canonicalTitle: "Solo Leveling (Na Honjaman Level-Up)",
    japaneseTitle: "나 혼자만 레벨업",
    author: "Chugong",
    artist: "DUBU (REDICE Studio)",
    publisher: "D&C Media / KakaoPage",
    serialization: "KakaoPage Webtoon",
    status: "Completo",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png",
    totalChaptersEstimate: 179,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "sl-cap-1",
        number: 1,
        title: "Capítulo 1: O Caçador Mais Fraco da Humanidade",
        pagesCount: 27,
        pages: localPages("/chapters/solo-leveling/ep-1", 27),
        description: "Sung Jinwoo e seu grupo entram na temida dungeon dupla no Templo de Cartenon, encarando as estátuas colossais.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "08bfe070-e9e6-4b61-a781-1ab708e9755a",
      },
      {
        id: "sl-cap-2",
        number: 2,
        title: "Capítulo 2: Os Mandamentos do Templo de Cartenon",
        pagesCount: 22,
        pages: localPages("/chapters/solo-leveling/ep-2", 22),
        description: "As regras do templo são reveladas enquanto as estátuas esmagam impiedosamente os caçadores desesperados.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "7252aa87-ac47-4bef-aa2f-3c4cac5f0885",
      },
      {
        id: "sl-cap-3",
        number: 3,
        title: "Capítulo 3: O Despertar do Único Jogador",
        pagesCount: 33,
        pages: localPages("/chapters/solo-leveling/ep-3", 33),
        description: "À beira do sacrifício final, a misteriosa tela de log do Sistema surge diante dos olhos de Jinwoo.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "e2f6b03c-9551-4ee5-8017-89bbc20c9952",
      },
    ],
  },
  "frieren-beyond-journeys-end": {
    animeId: "frieren-beyond-journeys-end",
    mangadexId: "b0b721ff-c388-4486-aa0f-c2b0bb321512",
    canonicalTitle: "Sousou no Frieren (Frieren e a Jornada Para o Além)",
    japaneseTitle: "葬送のフリーレン",
    author: "Kanehito Yamada",
    artist: "Tsukasa Abe",
    publisher: "Shogakukan",
    serialization: "Weekly Shōnen Sunday",
    status: "Em publicação",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-qQTzQnEJJ3oB.jpg",
    totalChaptersEstimate: 152,
    defaultLanguage: "all",
    initialChapters: [
      {
        id: "fri-cap-1",
        number: 1,
        title: "Capítulo 1: O Fim da Aventura e a Passagem das Eras",
        pagesCount: 35,
        chapterUrl: "/chapters/5035-10001000/sousou-no-frieren-chapter-1",
        description: "Após derrotarem o Rei Demônio em uma marcha de 10 anos, a maga elfa Frieren testemunha a brevidade da vida de seus companheiros mortais.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "5035-10001000-sousou-no-frieren-chapter-1",
      },
      {
        id: "fri-cap-2",
        number: 2,
        title: "Capítulo 2: A Mentira do Sacerdote e o Aprendizado de Fern",
        pagesCount: 28,
        chapterUrl: "/chapters/5035-10002000/sousou-no-frieren-chapter-2",
        description: "Heiter confia a jovem órfã Fern aos cuidados de Frieren para decifrar um grimório lendário.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "5035-10002000-sousou-no-frieren-chapter-2",
      },
      {
        id: "fri-cap-3",
        number: 3,
        title: "Capítulo 3: Flores de Lua Azul",
        pagesCount: 30,
        chapterUrl: "/chapters/5035-10003000/sousou-no-frieren-chapter-3",
        description: "Frieren e Fern chegam à vila de Turck procurando pelas raras flores azuis favoritas do herói Himmel.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "5035-10003000-sousou-no-frieren-chapter-3",
      },
    ],
  },
  "jujutsu-kaisen-culling-game": {
    animeId: "jujutsu-kaisen-culling-game",
    mangadexId: "c52b2ce3-7f95-469c-96b0-479524fb7a1a",
    canonicalTitle: "Jujutsu Kaisen (Batalha de Feiticeiros)",
    japaneseTitle: "呪術廻戦",
    author: "Gege Akutami",
    artist: "Gege Akutami",
    publisher: "Shueisha",
    serialization: "Weekly Shōnen Jump",
    status: "Completo",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-LHBAeoZDIsnF.jpg",
    totalChaptersEstimate: 277,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "jjk-cap-1",
        number: 1,
        title: "Capítulo 1: Ryomen Sukuna",
        pagesCount: 58,
        chapterUrl: "/chapters/2085-10001000/jujutsu-kaisen-chapter-1",
        description: "Yuji Itadori engole o dedo amaldiçoado de Ryomen Sukuna para salvar seus colegas de escola do ataque de maldições.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "2085-10001000-jujutsu-kaisen-chapter-1",
      },
      {
        id: "jjk-cap-2",
        number: 2,
        title: "Capítulo 2: Condenação Secreta",
        pagesCount: 26,
        chapterUrl: "/chapters/2085-10002000/jujutsu-kaisen-chapter-2",
        description: "Satoru Gojo intervém junto aos superiores do Colégio Jujutsu de Tóquio para adiar a execução de Itadori.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "2085-10002000-jujutsu-kaisen-chapter-2",
      },
    ],
  },
  "demon-slayer-infinity-castle": {
    animeId: "demon-slayer-infinity-castle",
    mangadexId: "789642f8-ca89-4e4e-8f7b-eee4d17ea08b",
    canonicalTitle: "Demon Slayer: Kimetsu no Yaiba",
    japaneseTitle: "鬼滅の刃",
    author: "Koyoharu Gotouge",
    artist: "Koyoharu Gotouge",
    publisher: "Shueisha",
    serialization: "Weekly Shōnen Jump",
    status: "Completo",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0ClmgLd.jpg",
    totalChaptersEstimate: 205,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "kmy-cap-1",
        number: 1,
        title: "Capítulo 1: Crueldade na Neve",
        pagesCount: 60,
        chapterUrl: "/chapters/2285-10001000/kimetsu-no-yaiba-chapter-1",
        description: "Tanjiro Kamado encontra sua família assassinada na montanha e sua irmã Nezuko transformada em demônio faminto.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "2285-10001000-kimetsu-no-yaiba-chapter-1",
      },
      {
        id: "kmy-cap-2",
        number: 2,
        title: "Capítulo 2: O Estranho da Montanha",
        pagesCount: 24,
        chapterUrl: "/chapters/2285-10002000/kimetsu-no-yaiba-chapter-2",
        description: "O Hashira da Água Giyu Tomioka poupa Nezuko e envia Tanjiro ao treinamento de Sakonji Urokodaki.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "2285-10002000-kimetsu-no-yaiba-chapter-2",
      },
    ],
  },
  "tower-of-god": {
    animeId: "tower-of-god",
    mangadexId: "c0ee660b-f9f2-45c3-8068-5123ff53f84a",
    canonicalTitle: "Tower of God (Sin-ui Tap)",
    japaneseTitle: "신의 탑",
    author: "SIU",
    artist: "SIU",
    publisher: "Naver / Webtoon",
    serialization: "Naver Webtoon",
    status: "Em publicação",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx115230-0h8rB89fK5c9.jpg",
    totalChaptersEstimate: 600,
    defaultLanguage: "all",
    initialChapters: [
      {
        id: "tog-cap-1",
        number: 1,
        title: "Capítulo 1: O Andar de Headon — O Guardião da Torre",
        pagesCount: 8,
        description: "Vinte-e-Quinto Bam abre os portões colossais da Torre para seguir Rachel e encara o teste mortal da enguia de ferro.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "tower-of-god-ep-1",
      },
    ],
  },
  "kaiju-no-8": {
    animeId: "kaiju-no-8",
    mangadexId: "237d527f-adb5-420e-8e6e-b7dd006fbe47",
    canonicalTitle: "Kaiju No. 8 (Monster #8)",
    japaneseTitle: "怪獣8号",
    author: "Naoya Matsumoto",
    artist: "Naoya Matsumoto",
    publisher: "Shueisha",
    serialization: "Shōnen Jump+",
    status: "Em publicação",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx153288-c7X0d1a49E5Z.jpg",
    totalChaptersEstimate: 130,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "kj8-cap-1",
        number: 1,
        title: "Capítulo 1: O Faxineiro e o Monstro Interior",
        pagesCount: 54,
        chapterUrl: "/chapters/5098-10001000/kaijuu-8-gou-chapter-1",
        description: "Kafka Hibino, trabalhador de limpeza de carcaças de monstros, é infectado por uma criatura parasita e se transforma no Kaiju No. 8.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "5098-10001000-kaijuu-8-gou-chapter-1",
      },
      {
        id: "kj8-cap-2",
        number: 2,
        title: "Capítulo 2: O Despertar do Kaiju No. 8",
        pagesCount: 26,
        chapterUrl: "/chapters/5098-10002000/kaijuu-8-gou-chapter-2",
        description: "Kafka e Reno tentam escapar do hospital sem serem descobertos pela Força de Defesa Anti-Kaiju.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "5098-10002000-kaijuu-8-gou-chapter-2",
      },
    ],
  },
  "spy-x-family": {
    animeId: "spy-x-family",
    mangadexId: "6b958848-c885-4735-9201-12ee77abcb3c",
    canonicalTitle: "SPY×FAMILY (Espião e Família)",
    japaneseTitle: "スパイファミリー",
    author: "Tatsuya Endo",
    artist: "Tatsuya Endo",
    publisher: "Shueisha",
    serialization: "Shōnen Jump+",
    status: "Em publicação",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx140960-YrkSD4SQF9iL.jpg",
    totalChaptersEstimate: 174,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "sxf-cap-1",
        number: 1,
        title: "Missão 1: Operação Família Strix",
        pagesCount: 72,
        chapterUrl: "/chapters/4143-10001000/spy-x-family-chapter-1",
        description: "O lendário espião Twilight precisa adotar uma criança para se infiltrar na Academia Eden, sem desconfiar que a pequena Anya lê pensamentos.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "4143-10001000-spy-x-family-chapter-1",
      },
      {
        id: "sxf-cap-2",
        number: 2,
        title: "Missão 2: Em Busca de uma Esposa",
        pagesCount: 28,
        chapterUrl: "/chapters/4143-10002000/spy-x-family-chapter-2",
        description: "Para comparecer à entrevista formal da escola, Twilight precisa encontrar urgentemente uma esposa para completar o disfarce familiar.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "4143-10002000-spy-x-family-chapter-2",
      },
    ],
  },
  "chainsaw-man": {
    animeId: "chainsaw-man",
    mangadexId: "a77742b1-befd-49a4-bff5-1ad4e6b0ef7b",
    canonicalTitle: "Chainsaw Man (O Homem-Motosserra)",
    japaneseTitle: "チェンソーマン",
    author: "Tatsuki Fujimoto",
    artist: "Tatsuki Fujimoto",
    publisher: "Shueisha",
    serialization: "Weekly Shōnen Jump / Shōnen Jump+",
    status: "Em publicação",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx127230-NuZtFpmDuUeJ.png",
    totalChaptersEstimate: 232,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "csm-cap-1",
        number: 1,
        title: "Capítulo 1: Cão e Motosserra",
        pagesCount: 58,
        chapterUrl: "/chapters/723-10001000/chainsaw-man-chapter-1",
        description: "Denji vive na miséria vendendo partes do corpo para a Yakuza, até que o Demônio da Motosserra Pochita se funde ao seu coração.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "723-10001000-chainsaw-man-chapter-1",
      },
      {
        id: "csm-cap-2",
        number: 2,
        title: "Capítulo 2: O Lugar Onde Fica Pochita",
        pagesCount: 26,
        chapterUrl: "/chapters/723-10002000/chainsaw-man-chapter-2",
        description: "Makima leva Denji para o quartel-general da Segurança Pública de Tóquio como Caçador de Demônios oficial.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "723-10002000-chainsaw-man-chapter-2",
      },
    ],
  },
  "orb-movements-of-the-earth": {
    animeId: "orb-movements-of-the-earth",
    mangadexId: "183b5c1e-5bfd-4f7f-9b21-3ac88c584987",
    canonicalTitle: "Chi.: Chikyuu no Undou ni Tsuite (Orb: Sobre os Movimentos da Terra)",
    japaneseTitle: "チ。―地球の運動について―",
    author: "Uoto",
    artist: "Uoto",
    publisher: "Shogakukan",
    serialization: "Big Comic Spirits",
    status: "Completo",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151514-Y0d82Ah2ZOHX.jpg",
    totalChaptersEstimate: 62,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "6526-10001000-chi-chikyuu-no-undou-ni-tsuite-chapter-1",
        number: 1,
        title: "Capítulo 1: Heliocentrismo e a Verdade Proibida",
        pagesCount: 47,
        chapterUrl: "/chapters/6526-10001000/chi-chikyuu-no-undou-ni-tsuite-chapter-1",
        description: "No reino da Polônia do século XV, o jovem prodígio Rafal conhece o acadêmico herege Hubert e se depara com o modelo heliocêntrico.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "6526-10001000-chi-chikyuu-no-undou-ni-tsuite-chapter-1",
      },
      {
        id: "6526-10002000-chi-chikyuu-no-undou-ni-tsuite-chapter-2",
        number: 2,
        title: "Capítulo 2: E, No Entanto, a Terra se Move",
        pagesCount: 38,
        chapterUrl: "/chapters/6526-10002000/chi-chikyuu-no-undou-ni-tsuite-chapter-2",
        description: "Diante do inquisidor Nowak, Rafal precisa escolher entre renunciar à razão matemática ou defender a beleza do cosmos.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "6526-10002000-chi-chikyuu-no-undou-ni-tsuite-chapter-2",
      },
      {
        id: "6526-10003000-chi-chikyuu-no-undou-ni-tsuite-chapter-3",
        number: 3,
        title: "Capítulo 3: O Legado Sob as Estrelas",
        pagesCount: 34,
        chapterUrl: "/chapters/6526-10003000/chi-chikyuu-no-undou-ni-tsuite-chapter-3",
        description: "Anos após o julgamento de Rafal, Oczy e Badeni encontram o baú de pedra escondido com os cálculos astronômicos proibidos.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "6526-10003000-chi-chikyuu-no-undou-ni-tsuite-chapter-3",
      },
    ],
  },
  "dandadan": {
    animeId: "dandadan",
    mangadexId: "68112dc1-2b80-4f20-beb8-2f2a8716a430",
    canonicalTitle: "DAN DA DAN",
    japaneseTitle: "ダンダダン",
    author: "Yukinobu Tatsu",
    artist: "Yukinobu Tatsu",
    publisher: "Shueisha",
    serialization: "Shōnen Jump+",
    status: "Em publicação",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx171018-60q1B6GK2Ghb.jpg",
    totalChaptersEstimate: 185,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "5460-10001000-dandadan-chapter-1",
        number: 1,
        title: "Capítulo 1: É Assim Que o Amor Começa, Ya Know!",
        pagesCount: 67,
        chapterUrl: "/chapters/5460-10001000/dandadan-chapter-1",
        description: "Momo Ayase e Okarun fazem uma aposta para provar a existência de fantasmas e alienígenas, desencadeando o caos sobrenatural.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "5460-10001000-dandadan-chapter-1",
      },
      {
        id: "5460-10002000-dandadan-chapter-2",
        number: 2,
        title: "Capítulo 2: Isso Não É um Alienígena!",
        pagesCount: 42,
        chapterUrl: "/chapters/5460-10002000/dandadan-chapter-2",
        description: "Amaldiçoado pela Vovó Turbo, Okarun e Momo precisam conter a maldição antes que ela consuma todos ao redor.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "5460-10002000-dandadan-chapter-2",
      },
    ],
  },
  "attack-on-titan": {
    animeId: "attack-on-titan",
    mangadexId: "304ceac3-8cdb-4fe7-acf7-2b6ff7a60613",
    canonicalTitle: "Shingeki no Kyojin (Attack on Titan)",
    japaneseTitle: "進撃の巨人",
    author: "Hajime Isayama",
    artist: "Hajime Isayama",
    publisher: "Kodansha",
    serialization: "Bessatsu Shōnen Magazine",
    status: "Completo",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx110277-sKUNXAsWMNFw.jpg",
    totalChaptersEstimate: 139,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "5-10001000-shingeki-no-kyojin-chapter-1",
        number: 1,
        title: "Capítulo 1: Para Você, 2.000 Anos no Futuro",
        pagesCount: 53,
        chapterUrl: "/chapters/5-10001000/shingeki-no-kyojin-chapter-1",
        description: "Após um século de paz ilusória atrás das muralhas, o Titã Colossal surge sobre o distrito de Shiganshina.",
        releaseDate: "2023",
        isFree: true,
        mangadexChapterId: "5-10001000-shingeki-no-kyojin-chapter-1",
      },
      {
        id: "5-10002000-shingeki-no-kyojin-chapter-2",
        number: 2,
        title: "Capítulo 2: Aquele Dia",
        pagesCount: 45,
        chapterUrl: "/chapters/5-10002000/shingeki-no-kyojin-chapter-2",
        description: "O Titã Blindado rompe o portão interno da Muralha Maria enquanto Eren jura exterminar todos os titãs.",
        releaseDate: "2023",
        isFree: true,
        mangadexChapterId: "5-10002000-shingeki-no-kyojin-chapter-2",
      },
    ],
  },
  "vinland-saga": {
    animeId: "vinland-saga",
    mangadexId: "5d1fc77e-706a-4fc5-bea8-486c9be0145d",
    canonicalTitle: "Vinland Saga",
    japaneseTitle: "ヴィンランド・サガ",
    author: "Makoto Yukimura",
    artist: "Makoto Yukimura",
    publisher: "Kodansha",
    serialization: "Monthly Afternoon",
    status: "Em publicação",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx136430-gsBsJjA7hGh9.jpg",
    totalChaptersEstimate: 216,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "4741-10001000-vinland-saga-chapter-1",
        number: 1,
        title: "Capítulo 1: Os Homens do Norte",
        pagesCount: 68,
        chapterUrl: "/chapters/4741-10001000/vinland-saga-chapter-1",
        description: "O jovem Thorfinn atua no bando mercenário de Askeladd na França, buscando conquistar o direito a um duelo de honra.",
        releaseDate: "2023",
        isFree: true,
        mangadexChapterId: "4741-10001000-vinland-saga-chapter-1",
      },
      {
        id: "4741-10002000-vinland-saga-chapter-2",
        number: 2,
        title: "Capítulo 2: Em Algum Lugar Que Não Aqui",
        pagesCount: 36,
        chapterUrl: "/chapters/4741-10002000/vinland-saga-chapter-2",
        description: "Na Islândia congelada, Thors, o Troll de Jom, recorda os horrores das batalhas e a promessa de uma terra pacífica chamada Vinland.",
        releaseDate: "2023",
        isFree: true,
        mangadexChapterId: "4741-10002000-vinland-saga-chapter-2",
      },
    ],
  },
  "bleach-tybw": {
    animeId: "bleach-tybw",
    mangadexId: "a460ab18-22c1-47eb-a08a-9ee85fe37ec8",
    canonicalTitle: "Bleach: Thousand-Year Blood War",
    japaneseTitle: "BLEACH 千年血戦篇",
    author: "Tite Kubo",
    artist: "Tite Kubo",
    publisher: "Shueisha",
    serialization: "Weekly Shōnen Jump",
    status: "Completo",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx169755-Rqb7MjnzdTc6.jpg",
    totalChaptersEstimate: 686,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "552-10001000-bleach-chapter-1",
        number: 1,
        title: "Capítulo 1: A Morte e o Morango (Death & Strawberry)",
        pagesCount: 56,
        chapterUrl: "/chapters/552-10001000/bleach-chapter-1",
        description: "Ichigo Kurosaki conhece a Shinigami Rukia Kuchiki e recebe seus poderes para proteger sua família de um Hollow.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "552-10001000-bleach-chapter-1",
      },
      {
        id: "552-10002000-bleach-chapter-2",
        number: 2,
        title: "Capítulo 2: Starter",
        pagesCount: 24,
        chapterUrl: "/chapters/552-10002000/bleach-chapter-2",
        description: "Rukia se matricula na escola de Ichigo usando um Gigai enquanto o treina nos deveres de Shinigami Substituto.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "552-10002000-bleach-chapter-2",
      },
    ],
  },
  "monster": {
    animeId: "monster",
    mangadexId: "d9e30523-9d65-469e-92a2-302995770950",
    canonicalTitle: "Monster (Naoki Urasawa's Monster)",
    japaneseTitle: "モンスター",
    author: "Naoki Urasawa",
    artist: "Naoki Urasawa",
    publisher: "Shogakukan",
    serialization: "Big Comic Original",
    status: "Completo",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx19-gtMC64182sm4.jpg",
    totalChaptersEstimate: 162,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "3-10001000-monster-chapter-1",
        number: 1,
        title: "Capítulo 1: Herr Dr. Tenma",
        pagesCount: 36,
        chapterUrl: "/chapters/3-10001000/monster-chapter-1",
        description: "Em Düsseldorf, o neurocirurgião Dr. Kenzo Tenma questiona a ética hospitalar após ser forçado a operar um político em vez de um operário.",
        releaseDate: "2023",
        isFree: true,
        mangadexChapterId: "3-10001000-monster-chapter-1",
      },
      {
        id: "3-10002000-monster-chapter-2",
        number: 2,
        title: "Capítulo 2: Queda",
        pagesCount: 28,
        chapterUrl: "/chapters/3-10002000/monster-chapter-2",
        description: "Tenma desafia as ordens do Diretor Heinemann para salvar o menino Johan Liebert, perdendo seu cargo e seu noivado com Eva.",
        releaseDate: "2023",
        isFree: true,
        mangadexChapterId: "3-10002000-monster-chapter-2",
      },
    ],
  },
  "apothecary-diaries": {
    animeId: "apothecary-diaries",
    mangadexId: "8c1d7d0c-e0b7-4170-941d-29f652c3c19d",
    canonicalTitle: "Kusuriya no Hitorigoto (Diários de uma Apotecária)",
    japaneseTitle: "薬屋のひとりごと",
    author: "Natsu Hyuuga",
    artist: "Nekokurage",
    publisher: "Square Enix",
    serialization: "Monthly Big Gangan",
    status: "Em publicação",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx176301-TIGmldLffQGX.jpg",
    totalChaptersEstimate: 82,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "2523-10001000-kusuriya-no-hitorigoto-chapter-1",
        number: 1,
        title: "Capítulo 1: A Maldição da Corte Interna",
        pagesCount: 44,
        chapterUrl: "/chapters/2523-10001000/kusuriya-no-hitorigoto-chapter-1",
        description: "Maomao descobre a verdadeira causa farmacológica por trás da misteriosa doença que aflige os filhos do Imperador.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "2523-10001000-kusuriya-no-hitorigoto-chapter-1",
      },
      {
        id: "2523-10002000-kusuriya-no-hitorigoto-chapter-2",
        number: 2,
        title: "Capítulo 2: Provadora de Venenos",
        pagesCount: 36,
        chapterUrl: "/chapters/2523-10002000/kusuriya-no-hitorigoto-chapter-2",
        description: "Jinshi identifica quem enviou o aviso secreto e promove Maomao a dama de companhia e provadora de venenos da Consorte Gyokuyou.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "2523-10002000-kusuriya-no-hitorigoto-chapter-2",
      },
    ],
  },
  "re-zero": {
    animeId: "re-zero",
    mangadexId: "5ef4e73e-6fbc-456b-b7e1-4642256f666d",
    canonicalTitle: "Re:Zero kara Hajimeru Isekai Seikatsu",
    japaneseTitle: "Re:ゼロから始める異世界生活",
    author: "Tappei Nagatsuki",
    artist: "Daichi Matsuse / Shinichirou Otsuka",
    publisher: "Kadokawa",
    serialization: "Monthly Comic Alive",
    status: "Em publicação",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx163134-yieRFbvUOH9a.jpg",
    totalChaptersEstimate: 115,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "3535-10001000-re-zero-kara-hajimeru-isekai-seikatsu-daiisshou-outo-no-ichinichi-hen-chapter-1",
        number: 1,
        title: "Capítulo 1: O Fim do Começo",
        pagesCount: 38,
        chapterUrl: "/chapters/3535-10001000/re-zero-kara-hajimeru-isekai-seikatsu-daiisshou-outo-no-ichinichi-hen-chapter-1",
        description: "Subaru Natsuki é invocado na capital de Lugnica e salvo por uma misteriosa jovem de cabelos prateados.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "3535-10001000-re-zero-kara-hajimeru-isekai-seikatsu-daiisshou-outo-no-ichinichi-hen-chapter-1",
      },
      {
        id: "3535-10002000-re-zero-kara-hajimeru-isekai-seikatsu-daiisshou-outo-no-ichinichi-hen-chapter-2",
        number: 2,
        title: "Capítulo 2: O Retorno Através da Morte",
        pagesCount: 32,
        chapterUrl: "/chapters/3535-10002000/re-zero-kara-hajimeru-isekai-seikatsu-daiisshou-outo-no-ichinichi-hen-chapter-2",
        description: "Após ser assassinado na casa de câmbio das favelas, Subaru desperta novamente diante do mercador de maçãs.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "3535-10002000-re-zero-kara-hajimeru-isekai-seikatsu-daiisshou-outo-no-ichinichi-hen-chapter-2",
      },
    ],
  },
  "oshi-no-ko": {
    animeId: "oshi-no-ko",
    mangadexId: "296cbc31-af1a-4b5b-a34b-fee2b4cad542",
    canonicalTitle: "[OSHI NO KO]: Minha Estrela Favorita",
    japaneseTitle: "【推しの子】",
    author: "Aka Akasaka",
    artist: "Mengo Yokoyari",
    publisher: "Shueisha",
    serialization: "Weekly Young Jump",
    status: "Completo",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx166531-dAL5MsqDHUkj.jpg",
    totalChaptersEstimate: 166,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "5053-10001000-oshi-no-ko-chapter-1",
        number: 1,
        title: "Capítulo 1: Mãe e Filhos",
        pagesCount: 43,
        chapterUrl: "/chapters/5053-10001000/oshi-no-ko-chapter-1",
        description: "O médico Gorou Amamiya recebe em seu hospital rural a idol Ai Hoshino, que está grávida de gêmeos em segredo.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "5053-10001000-oshi-no-ko-chapter-1",
      },
      {
        id: "5053-10002000-oshi-no-ko-chapter-2",
        number: 2,
        title: "Capítulo 2: Irmão e Irmã",
        pagesCount: 28,
        chapterUrl: "/chapters/5053-10002000/oshi-no-ko-chapter-2",
        description: "Renascidos como Aquamarine e Ruby Hoshino, os gêmeos descobrem que ambos mantiveram as memórias de suas vidas passadas.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "5053-10002000-oshi-no-ko-chapter-2",
      },
    ],
  },
  "blue-lock": {
    animeId: "blue-lock",
    mangadexId: "4141c5dc-c525-4df5-afd7-cc7d192a832f",
    canonicalTitle: "BLUE LOCK",
    japaneseTitle: "ブルーロック",
    author: "Muneyuki Kaneshiro",
    artist: "Yusuke Nomura",
    publisher: "Kodansha",
    serialization: "Weekly Shōnen Magazine",
    status: "Em publicação",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx163146-BVZPgyzkqi82.png",
    totalChaptersEstimate: 285,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "580-10001000-blue-lock-chapter-1",
        number: 1,
        title: "Capítulo 1: Sonho",
        pagesCount: 75,
        chapterUrl: "/chapters/580-10001000/blue-lock-chapter-1",
        description: "Yoichi Isagi é convocado para o projeto Blue Lock, onde Jinpachi Ego desafia 300 atacantes a abandonar o jogo coletivo em nome do ego absoluto.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "580-10001000-blue-lock-chapter-1",
      },
      {
        id: "580-10002000-blue-lock-chapter-2",
        number: 2,
        title: "Capítulo 2: Entrando no Dormitório",
        pagesCount: 32,
        chapterUrl: "/chapters/580-10002000/blue-lock-chapter-2",
        description: "O teste de sobrevivência de Oni (Pega-Pega) no Time Z elimina o primeiro jogador em 136 segundos.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "580-10002000-blue-lock-chapter-2",
      },
    ],
  },
  "cyberpunk-edgerunners": {
    animeId: "cyberpunk-edgerunners",
    mangadexId: "832692d3-11c7-49a1-aca4-deabdcf9e996",
    canonicalTitle: "Cyberpunk: Edgerunners MADNESS",
    japaneseTitle: "サイバーパンク: エッジランナーズ MADNESS",
    author: "Bartosz Sztybor",
    artist: "Asano",
    publisher: "Kadokawa / CD Projekt Red",
    serialization: "Comic Alive+",
    status: "Em publicação",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx120377-ayZPoxiWt4Li.jpg",
    totalChaptersEstimate: 24,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "9677-10001000-cyberpunk-edgerunners-madness-chapter-1",
        number: 1,
        title: "Capítulo 1: Crônicas de Night City — Rebecca & Pilar",
        pagesCount: 42,
        chapterUrl: "/chapters/9677-10001000/cyberpunk-edgerunners-madness-chapter-1",
        description: "A história oficial em mangá no submundo implacável de Night City acompanhando a ascensão caótica dos irmãos mercenários.",
        releaseDate: "2025",
        isFree: true,
        mangadexChapterId: "9677-10001000-cyberpunk-edgerunners-madness-chapter-1",
      },
      {
        id: "9677-10002000-cyberpunk-edgerunners-madness-chapter-2",
        number: 2,
        title: "Capítulo 2: Cromo e Sangue",
        pagesCount: 34,
        chapterUrl: "/chapters/9677-10002000/cyberpunk-edgerunners-madness-chapter-2",
        description: "Um contrato corporativo dá errado nas ruas de Santo Domingo e exige poder de fogo pesado.",
        releaseDate: "2025",
        isFree: true,
        mangadexChapterId: "9677-10002000-cyberpunk-edgerunners-madness-chapter-2",
      },
    ],
  },
  "dungeon-meshi": {
    animeId: "dungeon-meshi",
    mangadexId: "d90ea6cb-7bc3-4d80-8af0-28557e6c4e17",
    canonicalTitle: "Dungeon Meshi (Delicious in Dungeon)",
    japaneseTitle: "ダンジョン飯",
    author: "Ryoko Kui",
    artist: "Ryoko Kui",
    publisher: "Enterbrain / Kadokawa",
    serialization: "Harta",
    status: "Completo",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx153518-IVXPDY5ph3kO.jpg",
    totalChaptersEstimate: 97,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "1092-10001000-dungeon-meshi-chapter-1",
        number: 1,
        title: "Capítulo 1: Ensopado de Monstros (Hot Pot)",
        pagesCount: 38,
        chapterUrl: "/chapters/1092-10001000/dungeon-meshi-chapter-1",
        description: "Sem dinheiro para provisões após o ataque do Dragão Vermelho, Laios, Marcille e Chilchuck aprendem com Senshi a cozinhar Escorpião Gigante e Cogumelos Andantes.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "1092-10001000-dungeon-meshi-chapter-1",
      },
      {
        id: "1092-10002000-dungeon-meshi-chapter-2",
        number: 2,
        title: "Capítulo 2: Torta de Planta Carnívora",
        pagesCount: 30,
        chapterUrl: "/chapters/1092-10002000/dungeon-meshi-chapter-2",
        description: "Senshi prepara uma quiche nutritiva usando os frutos das plantas devoradoras de aventureiros.",
        releaseDate: "2024",
        isFree: true,
        mangadexChapterId: "1092-10002000-dungeon-meshi-chapter-2",
      },
    ],
  },
  "black-clover": {
    animeId: "black-clover",
    mangadexId: "bc000001-0000-4000-8000-000000000001",
    canonicalTitle: "Black Clover",
    japaneseTitle: "ブラッククローバー",
    author: "Yūki Tabata",
    artist: "Yūki Tabata",
    publisher: "Shueisha",
    serialization: "Weekly Shōnen Jump / Jump GIGA",
    status: "Em publicação",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx97940-fyh8o7gNbha0.png",
    totalChaptersEstimate: 395,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "524-10001000-black-clover-chapter-1",
        number: 1,
        title: "Capítulo 1: O Juramento do Garoto Sem Magia",
        pagesCount: 52,
        chapterUrl: "/chapters/524-10001000/black-clover-chapter-1",
        description: "Asta e Yuno crescem juntos em Hage sonhando em se tornar o Rei Mago. Na cerimônia dos grimórios, Asta desperta o grimório de cinco folhas da Anti-Magia.",
        releaseDate: "2015",
        isFree: true,
        mangadexChapterId: "524-10001000-black-clover-chapter-1",
      },
      {
        id: "524-10002000-black-clover-chapter-2",
        number: 2,
        title: "Capítulo 2: O Exame dos Cavaleiros Mágicos",
        pagesCount: 25,
        chapterUrl: "/chapters/524-10002000/black-clover-chapter-2",
        description: "Asta e Yuno partem para a Capital Real para enfrentar o exame de seleção dos esquadrões mágicos.",
        releaseDate: "2015",
        isFree: true,
        mangadexChapterId: "524-10002000-black-clover-chapter-2",
      },
    ],
  },
  "jojos-bizarre-adventure": {
    animeId: "jojos-bizarre-adventure",
    mangadexId: "jj000001-0000-4000-8000-000000000002",
    canonicalTitle: "JoJo's Bizarre Adventure (Edição Colorida Oficial)",
    japaneseTitle: "ジョジョの奇妙な冒険",
    author: "Hirohiko Araki",
    artist: "Hirohiko Araki",
    publisher: "Shueisha",
    serialization: "Weekly Shōnen Jump / Ultra Jump",
    status: "Em publicação",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx102883-S9KzdMJhDswJ.png",
    totalChaptersEstimate: 131,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "2061-10001000-jojo-s-bizarre-adventure-color-chapter-1",
        number: 1,
        title: "Capítulo 1: Dio, o Invasor (Edição Colorida)",
        pagesCount: 54,
        chapterUrl: "/chapters/2061-10001000/jojo-s-bizarre-adventure-color-chapter-1",
        description: "O início do destino secular entre a linhagem Joestar e Dio Brando sob a maldição da Máscara de Pedra.",
        releaseDate: "2014",
        isFree: true,
        mangadexChapterId: "2061-10001000-jojo-s-bizarre-adventure-color-chapter-1",
      },
      {
        id: "2061-10002000-jojo-s-bizarre-adventure-color-chapter-2",
        number: 2,
        title: "Capítulo 2: Uma Nova Carta do Passado",
        pagesCount: 24,
        chapterUrl: "/chapters/2061-10002000/jojo-s-bizarre-adventure-color-chapter-2",
        description: "Jonathan Joestar enfrenta a ambição implacável de Dio na mansão Joestar.",
        releaseDate: "2014",
        isFree: true,
        mangadexChapterId: "2061-10002000-jojo-s-bizarre-adventure-color-chapter-2",
      },
    ],
  },
  "steel-ball-run": {
    animeId: "steel-ball-run",
    mangadexId: "sb000001-0000-4000-8000-000000000003",
    canonicalTitle: "JoJo's Bizarre Adventure Parte 7: Steel Ball Run",
    japaneseTitle: "スティール・ボール・ラン",
    author: "Hirohiko Araki",
    artist: "Hirohiko Araki",
    publisher: "Shueisha",
    serialization: "Ultra Jump",
    status: "Completo",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx31706-lRncu9VbcBB7.png",
    totalChaptersEstimate: 97,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "2067-10001000-jojo-no-kimyou-na-bouken-part-7-steel-ball-run-chapter-1",
        number: 1,
        title: "Capítulo 1: A Coletiva de Imprensa da Steel Ball Run",
        pagesCount: 53,
        chapterUrl: "/chapters/2067-10001000/jojo-no-kimyou-na-bouken-part-7-steel-ball-run-chapter-1",
        description: "Em 1890, nos Estados Unidos, Stephen Steel anuncia a maior corrida a cavalo da história atravessando o continente americano, unindo Gyro Zeppeli e Johnny Joestar.",
        releaseDate: "2004",
        isFree: true,
        mangadexChapterId: "2067-10001000-jojo-no-kimyou-na-bouken-part-7-steel-ball-run-chapter-1",
      },
      {
        id: "2067-10002000-jojo-no-kimyou-na-bouken-part-7-steel-ball-run-chapter-2",
        number: 2,
        title: "Capítulo 2: Gyro Zeppeli e o Segredo das Esferas de Aço",
        pagesCount: 45,
        chapterUrl: "/chapters/2067-10002000/jojo-no-kimyou-na-bouken-part-7-steel-ball-run-chapter-2",
        description: "Johnny Joestar, paralisado da cintura para baixo, vê suas pernas se moverem ao tocar na esfera giratória de Gyro.",
        releaseDate: "2004",
        isFree: true,
        mangadexChapterId: "2067-10002000-jojo-no-kimyou-na-bouken-part-7-steel-ball-run-chapter-2",
      },
    ],
  },
  "dragon-ball": {
    animeId: "dragon-ball",
    mangadexId: "db000001-0000-4000-8000-000000000004",
    canonicalTitle: "Dragon Ball Super",
    japaneseTitle: "ドラゴンボール超",
    author: "Akira Toriyama",
    artist: "Toyotarou",
    publisher: "Shueisha",
    serialization: "V Jump",
    status: "Em publicação",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx170083-GTwRrhTApcLR.png",
    totalChaptersEstimate: 105,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "1069-10001000-dragon-ball-super-chapter-1",
        number: 1,
        title: "Capítulo 1: A Premonição do Deus da Destruição",
        pagesCount: 19,
        chapterUrl: "/chapters/1069-10001000/dragon-ball-super-chapter-1",
        description: "Após a derrota de Majin Boo, Bills, o Deus da Destruição, desperta em busca do lendário Deus Super Saiyajin.",
        releaseDate: "2015",
        isFree: true,
        mangadexChapterId: "1069-10001000-dragon-ball-super-chapter-1",
      },
      {
        id: "1069-10002000-dragon-ball-super-chapter-2",
        number: 2,
        title: "Capítulo 2: Goku Derrotado no Planeta do Sr. Kaioh",
        pagesCount: 17,
        chapterUrl: "/chapters/1069-10002000/dragon-ball-super-chapter-2",
        description: "Goku desafia Bills usando o Super Saiyajin 3, mas descobre um abismo de poder divino.",
        releaseDate: "2015",
        isFree: true,
        mangadexChapterId: "1069-10002000-dragon-ball-super-chapter-2",
      },
    ],
  },
  "naruto": {
    animeId: "naruto",
    mangadexId: "na000001-0000-4000-8000-000000000005",
    canonicalTitle: "Naruto",
    japaneseTitle: "NARUTO -ナルト-",
    author: "Masashi Kishimoto",
    artist: "Masashi Kishimoto",
    publisher: "Shueisha",
    serialization: "Weekly Shōnen Jump",
    status: "Completo",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1735-kGfVm0YqCPcu.png",
    totalChaptersEstimate: 700,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "3069-10001000-naruto-chapter-1",
        number: 1,
        title: "Capítulo 1: Uzumaki Naruto!!",
        pagesCount: 55,
        chapterUrl: "/chapters/3069-10001000/naruto-chapter-1",
        description: "Rejeitado pela Vila Oculta da Folha por carregar a Raposa de Nove Caudas, Naruto Uzumaki jura superar todos os Hokages.",
        releaseDate: "1999",
        isFree: true,
        mangadexChapterId: "3069-10001000-naruto-chapter-1",
      },
      {
        id: "3069-10002000-naruto-chapter-2",
        number: 2,
        title: "Capítulo 2: Konohamaru!!",
        pagesCount: 23,
        chapterUrl: "/chapters/3069-10002000/naruto-chapter-2",
        description: "Agora um Genin oficial de Konoha, Naruto conhece o neto do Terceiro Hokage.",
        releaseDate: "1999",
        isFree: true,
        mangadexChapterId: "3069-10002000-naruto-chapter-2",
      },
    ],
  },
  "boruto": {
    animeId: "boruto",
    mangadexId: "bo000001-0000-4000-8000-000000000006",
    canonicalTitle: "Boruto: Two Blue Vortex & Next Generations",
    japaneseTitle: "BORUTO -ボルト- TWO BLUE VORTEX",
    author: "Masashi Kishimoto",
    artist: "Mikio Ikemoto",
    publisher: "Shueisha",
    serialization: "V Jump",
    status: "Em publicação",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx97938-BnF6M5yTaNB1.jpg",
    totalChaptersEstimate: 118,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "7486-10001000-boruto-two-blue-vortex-chapter-1",
        number: 1,
        title: "Capítulo 1: Boruto (Two Blue Vortex)",
        pagesCount: 49,
        chapterUrl: "/chapters/7486-10001000/boruto-two-blue-vortex-chapter-1",
        description: "Três anos após a Onipotência alterar as memórias do mundo inteiro, Boruto retorna a Konoha para deter Code.",
        releaseDate: "2023",
        isFree: true,
        mangadexChapterId: "7486-10001000-boruto-two-blue-vortex-chapter-1",
      },
      {
        id: "7486-10002000-boruto-two-blue-vortex-chapter-2",
        number: 2,
        title: "Capítulo 2: Árvores Divinas",
        pagesCount: 43,
        chapterUrl: "/chapters/7486-10002000/boruto-two-blue-vortex-chapter-2",
        description: "Boruto revela o novo Rasengan Uzuhiko utilizando a rotação planetária.",
        releaseDate: "2023",
        isFree: true,
        mangadexChapterId: "7486-10002000-boruto-two-blue-vortex-chapter-2",
      },
    ],
  },
  "one-piece": {
    animeId: "one-piece",
    mangadexId: "op000001-0000-4000-8000-000000000007",
    canonicalTitle: "One Piece",
    japaneseTitle: "ONE PIECE (ワンピース)",
    author: "Eiichiro Oda",
    artist: "Eiichiro Oda",
    publisher: "Shueisha",
    serialization: "Weekly Shōnen Jump",
    status: "Em publicação",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg",
    totalChaptersEstimate: 1140,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "2-10001000-one-piece-chapter-1",
        number: 1,
        title: "Capítulo 1: Romance Dawn — O Alvorecer da Aventura",
        pagesCount: 53,
        chapterUrl: "/chapters/2-10001000/one-piece-chapter-1",
        description: "Monkey D. Luffy recebe o chapéu de palha de Shanks, o Ruivo, e parte para o mar em busca do lendário tesouro One Piece.",
        releaseDate: "1997",
        isFree: true,
        mangadexChapterId: "2-10001000-one-piece-chapter-1",
      },
      {
        id: "2-10002000-one-piece-chapter-2",
        number: 2,
        title: "Capítulo 2: Aquele Chamado 'Luffy do Chapéu de Palha'",
        pagesCount: 23,
        chapterUrl: "/chapters/2-10002000/one-piece-chapter-2",
        description: "Luffy enfrenta a pirata Alvida com os poderes da Gomu Gomu no Mi.",
        releaseDate: "1997",
        isFree: true,
        mangadexChapterId: "2-10002000-one-piece-chapter-2",
      },
    ],
  },
  "hunter-x-hunter": {
    animeId: "hunter-x-hunter",
    mangadexId: "hx000001-0000-4000-8000-000000000008",
    canonicalTitle: "Hunter x Hunter",
    japaneseTitle: "HUNTER×HUNTER",
    author: "Yoshihiro Togashi",
    artist: "Yoshihiro Togashi",
    publisher: "Shueisha",
    serialization: "Weekly Shōnen Jump",
    status: "Em publicação",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-y5gsT1hoHuHw.png",
    totalChaptersEstimate: 410,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "1828-10001000-hunter-x-hunter-chapter-1",
        number: 1,
        title: "Capítulo 1: O Dia da Partida",
        pagesCount: 35,
        chapterUrl: "/chapters/1828-10001000/hunter-x-hunter-chapter-1",
        description: "Gon Freecss deixa a Ilha da Baleia para prestar o Exame Hunter e encontrar seu pai, Ging Freecss.",
        releaseDate: "1998",
        isFree: true,
        mangadexChapterId: "1828-10001000-hunter-x-hunter-chapter-1",
      },
      {
        id: "1828-10002000-hunter-x-hunter-chapter-2",
        number: 2,
        title: "Capítulo 2: Encontro na Tempestade",
        pagesCount: 23,
        chapterUrl: "/chapters/1828-10002000/hunter-x-hunter-chapter-2",
        description: "A bordo do navio rumo ao exame, Gon conhece Kurapika e Leorio.",
        releaseDate: "1998",
        isFree: true,
        mangadexChapterId: "1828-10002000-hunter-x-hunter-chapter-2",
      },
    ],
  },
  "my-hero-academia": {
    animeId: "my-hero-academia",
    mangadexId: "mh000001-0000-4000-8000-000000000009",
    canonicalTitle: "My Hero Academia (Boku no Hero Academia)",
    japaneseTitle: "僕のヒーローアカデミア",
    author: "Kōhei Horikoshi",
    artist: "Kōhei Horikoshi",
    publisher: "Shueisha",
    serialization: "Weekly Shōnen Jump",
    status: "Completo",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx163139-JchZhUFlNTWU.jpg",
    totalChaptersEstimate: 430,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "601-10001000-boku-no-hero-academia-chapter-1",
        number: 1,
        title: "Capítulo 1: Izuku Midoriya: A Origem",
        pagesCount: 53,
        chapterUrl: "/chapters/601-10001000/boku-no-hero-academia-chapter-1",
        description: "Nascido sem individualidade em uma sociedade de super-heróis, Izuku Midoriya tem seu destino transformado ao conhecer All Might.",
        releaseDate: "2014",
        isFree: true,
        mangadexChapterId: "601-10001000-boku-no-hero-academia-chapter-1",
      },
      {
        id: "601-10002000-boku-no-hero-academia-chapter-2",
        number: 2,
        title: "Capítulo 2: O Que é Preciso Para Ser um Herói",
        pagesCount: 25,
        chapterUrl: "/chapters/601-10002000/boku-no-hero-academia-chapter-2",
        description: "All Might declara a Midoriya: 'Você pode se tornar um herói!' e inicia o treinamento para herdar o One For All.",
        releaseDate: "2014",
        isFree: true,
        mangadexChapterId: "601-10002000-boku-no-hero-academia-chapter-2",
      },
    ],
  },
  "death-note": {
    animeId: "death-note",
    mangadexId: "dn000001-0000-4000-8000-000000000010",
    canonicalTitle: "Death Note",
    japaneseTitle: "DEATH NOTE (デスノート)",
    author: "Tsugumi Ohba",
    artist: "Takeshi Obata",
    publisher: "Shueisha",
    serialization: "Weekly Shōnen Jump",
    status: "Completo",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1535-kUgkcrfOrkUM.jpg",
    totalChaptersEstimate: 108,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "938-10001000-death-note-chapter-1",
        number: 1,
        title: "Capítulo 1: Tédio",
        pagesCount: 54,
        chapterUrl: "/chapters/938-10001000/death-note-chapter-1",
        description: "O brilhante estudante Light Yagami encontra o Death Note deixado cair pelo Shinigami Ryuk e decide tornar-se o Deus do Novo Mundo.",
        releaseDate: "2003",
        isFree: true,
        mangadexChapterId: "938-10001000-death-note-chapter-1",
      },
      {
        id: "938-10002000-death-note-chapter-2",
        number: 2,
        title: "Capítulo 2: L",
        pagesCount: 24,
        chapterUrl: "/chapters/938-10002000/death-note-chapter-2",
        description: "O maior detetive do mundo, L, prepara uma armadilha televisiva em Kanto para localizar Kira.",
        releaseDate: "2003",
        isFree: true,
        mangadexChapterId: "938-10002000-death-note-chapter-2",
      },
    ],
  },
  "fullmetal-alchemist-brotherhood": {
    animeId: "fullmetal-alchemist-brotherhood",
    mangadexId: "fm000001-0000-4000-8000-000000000011",
    canonicalTitle: "Fullmetal Alchemist (Hagane no Renkinjutsushi)",
    japaneseTitle: "鋼の錬金術師",
    author: "Hiromu Arakawa",
    artist: "Hiromu Arakawa",
    publisher: "Square Enix",
    serialization: "Monthly Shōnen Gangan",
    status: "Completo",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx5114-nSWCgQlmOMtj.jpg",
    totalChaptersEstimate: 113,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "6-10001000-fullmetal-alchemist-chapter-1",
        number: 1,
        title: "Capítulo 1: Os Dois Alquimistas",
        pagesCount: 51,
        chapterUrl: "/chapters/6-10001000/fullmetal-alchemist-chapter-1",
        description: "Edward e Alphonse Elric chegam à cidade de Liore em busca da lendária Pedra Filosofal para recuperar seus corpos.",
        releaseDate: "2001",
        isFree: true,
        mangadexChapterId: "6-10001000-fullmetal-alchemist-chapter-1",
      },
      {
        id: "6-10002000-fullmetal-alchemist-chapter-2",
        number: 2,
        title: "Capítulo 2: O Preço de uma Vida",
        pagesCount: 41,
        chapterUrl: "/chapters/6-10002000/fullmetal-alchemist-chapter-2",
        description: "Os irmãos Elric desmascaram os falsos milagres do Padre Cornello sob a Lei da Troca Equivalente.",
        releaseDate: "2001",
        isFree: true,
        mangadexChapterId: "6-10002000-fullmetal-alchemist-chapter-2",
      },
    ],
  },
  "sakamoto-days": {
    animeId: "sakamoto-days",
    mangadexId: "sk000001-0000-4000-8000-000000000012",
    canonicalTitle: "SAKAMOTO DAYS",
    japaneseTitle: "SAKAMOTO DAYS (サカモトデイズ)",
    author: "Yuto Suzuki",
    artist: "Yuto Suzuki",
    publisher: "Shueisha",
    serialization: "Weekly Shōnen Jump",
    status: "Em publicação",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx177709-e5Qx6RlsBgD5.png",
    totalChaptersEstimate: 205,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "5281-10001000-sakamoto-days-chapter-1",
        number: 1,
        title: "Capítulo 1: O Assassino Lendário",
        pagesCount: 55,
        chapterUrl: "/chapters/5281-10001000/sakamoto-days-chapter-1",
        description: "Taro Sakamoto era o assassino mais temido do submundo até se apaixonar, casar e abrir uma pacata loja de conveniência de bairro.",
        releaseDate: "2020",
        isFree: true,
        mangadexChapterId: "5281-10001000-sakamoto-days-chapter-1",
      },
      {
        id: "5281-10002000-sakamoto-days-chapter-2",
        number: 2,
        title: "Capítulo 2: As Regras da Família Sakamoto",
        pagesCount: 25,
        chapterUrl: "/chapters/5281-10002000/sakamoto-days-chapter-2",
        description: "Sakamoto e o telepata Shin protegem a rotina da família sem violar a regra número um: nunca matar ninguém.",
        releaseDate: "2020",
        isFree: true,
        mangadexChapterId: "5281-10002000-sakamoto-days-chapter-2",
      },
    ],
  },
  "dr-stone": {
    animeId: "dr-stone",
    mangadexId: "ds000001-0000-4000-8000-000000000013",
    canonicalTitle: "Dr. STONE",
    japaneseTitle: "Dr.STONE (ドクターストーン)",
    author: "Riichiro Inagaki",
    artist: "Boichi",
    publisher: "Shueisha",
    serialization: "Weekly Shōnen Jump",
    status: "Completo",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx172019-3cfZbrYBmV23.jpg",
    totalChaptersEstimate: 232,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "1059-10001000-dr-stone-chapter-1",
        number: 1,
        title: "Capítulo 1: Stone World",
        pagesCount: 55,
        chapterUrl: "/chapters/1059-10001000/dr-stone-chapter-1",
        description: "Uma luz misteriosa petrifica toda a humanidade. 3.700 anos depois, o gênio científico Senku Ishigami desperta para reconstruir a civilização do zero.",
        releaseDate: "2017",
        isFree: true,
        mangadexChapterId: "1059-10001000-dr-stone-chapter-1",
      },
      {
        id: "1059-10002000-dr-stone-chapter-2",
        number: 2,
        title: "Capítulo 2: Fantasia vs. Ciência",
        pagesCount: 25,
        chapterUrl: "/chapters/1059-10002000/dr-stone-chapter-2",
        description: "Senku descobre o fluido de despetrificação com ácido nítrico e desperta Tsukasa Shishio.",
        releaseDate: "2017",
        isFree: true,
        mangadexChapterId: "1059-10002000-dr-stone-chapter-2",
      },
    ],
  },
  "mob-psycho-100": {
    animeId: "mob-psycho-100",
    mangadexId: "mp000001-0000-4000-8000-000000000014",
    canonicalTitle: "Mob Psycho 100",
    japaneseTitle: "モブサイコ100",
    author: "ONE",
    artist: "ONE",
    publisher: "Shogakukan",
    serialization: "Ura Sunday / MangaONE",
    status: "Completo",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx140439-bPKmhe1wNxc9.jpg",
    totalChaptersEstimate: 101,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "2922-10001000-mob-psycho-100-chapter-1",
        number: 1,
        title: "Capítulo 1: O Autoproclamado Paranormal Arataka Reigen",
        pagesCount: 36,
        chapterUrl: "/chapters/2922-10001000/mob-psycho-100-chapter-1",
        description: "Shigeo 'Mob' Kageyama é um estudante pacato com poderes psíquicos colossais que trabalha para o charlatão carismático Reigen.",
        releaseDate: "2012",
        isFree: true,
        mangadexChapterId: "2922-10001000-mob-psycho-100-chapter-1",
      },
      {
        id: "2922-10002000-mob-psycho-100-chapter-2",
        number: 2,
        title: "Capítulo 2: Dúvidas da Juventude",
        pagesCount: 22,
        chapterUrl: "/chapters/2922-10002000/mob-psycho-100-chapter-2",
        description: "Mob tenta levar uma vida escolar comum enquanto sua contagem emocional se aproxima de 100%.",
        releaseDate: "2012",
        isFree: true,
        mangadexChapterId: "2922-10002000-mob-psycho-100-chapter-2",
      },
    ],
  },
  "shangri-la-frontier": {
    animeId: "shangri-la-frontier",
    mangadexId: "29ab6984-7c1d-4d45-b925-25aa082b492e",
    canonicalTitle: "Shangri-La Frontier",
    japaneseTitle: "シャングリラ・フロンティア",
    author: "Katarina",
    artist: "Ryosuke Fuji",
    publisher: "Kodansha",
    serialization: "Weekly Shōnen Magazine",
    status: "Em publicação",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151970-xtIx3VqEk02X.jpg",
    totalChaptersEstimate: 195,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "5194-10001000-shangri-la-frontier-chapter-1",
        number: 1,
        title: "Capítulo 1: Por Que Você Joga Games?",
        pagesCount: 52,
        chapterUrl: "/chapters/5194-10001000/shangri-la-frontier-chapter-1",
        description: "Rakuro Hizutome, o lendário caçador de jogos quebrados Sunraku, decide experimentar a obra-prima Shangri-La Frontier.",
        releaseDate: "2020",
        isFree: true,
        mangadexChapterId: "29ab6984-7c1d-4d45-b925-25aa082b492e",
      },
      {
        id: "5194-10002000-shangri-la-frontier-chapter-2",
        number: 2,
        title: "Capítulo 2: O Predador Noturno Lycagon",
        pagesCount: 30,
        chapterUrl: "/chapters/5194-10002000/shangri-la-frontier-chapter-2",
        description: "Sunraku encontra inesperadamente Lycagon, a Espreita da Noite, recebendo a maldição ancestral das feras.",
        releaseDate: "2020",
        isFree: true,
        mangadexChapterId: "29ab6984-7c1d-4d45-b925-25aa082b492e",
      },
      {
        id: "5194-10003000-shangri-la-frontier-chapter-3",
        number: 3,
        title: "Capítulo 3: O Ferreiro de Rabituza",
        pagesCount: 28,
        chapterUrl: "/chapters/5194-10003000/shangri-la-frontier-chapter-3",
        description: "Guiado pelo coelho Emul, Sunraku desbloqueia o cenário único do Reino Vorpal de Rabituza.",
        releaseDate: "2020",
        isFree: true,
        mangadexChapterId: "29ab6984-7c1d-4d45-b925-25aa082b492e",
      },
    ],
  },
  "mashle": {
    animeId: "mashle",
    mangadexId: "558c2122-7342-4649-85e9-a866727bb2e8",
    canonicalTitle: "Mashle: Magic and Muscles",
    japaneseTitle: "マッシュル-MASHLE-",
    author: "Hajime Komoto",
    artist: "Hajime Komoto",
    publisher: "Shueisha",
    serialization: "Weekly Shōnen Jump",
    status: "Completo",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151801-XxVf22Le6C8o.png",
    totalChaptersEstimate: 162,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "4958-10001000-mashle-chapter-1",
        number: 1,
        title: "Capítulo 1: Mash Burnedead e os Músculos Construídos",
        pagesCount: 54,
        chapterUrl: "/chapters/4958-10001000/mashle-chapter-1",
        description: "Em uma sociedade onde a magia é tudo, o jovem Mash treina apenas seus punhos e músculos enquanto saboreia seus amados profiteroles.",
        releaseDate: "2020",
        isFree: true,
        mangadexChapterId: "558c2122-7342-4649-85e9-a866727bb2e8",
      },
      {
        id: "4958-10002000-mashle-chapter-2",
        number: 2,
        title: "Capítulo 2: O Labirinto Misterioso",
        pagesCount: 24,
        chapterUrl: "/chapters/4958-10002000/mashle-chapter-2",
        description: "Durante o teste de admissão na Academia Easton, Mash quebra paredes mágicas na força bruta.",
        releaseDate: "2020",
        isFree: true,
        mangadexChapterId: "558c2122-7342-4649-85e9-a866727bb2e8",
      },
      {
        id: "4958-10003000-mashle-chapter-3",
        number: 3,
        title: "Capítulo 3: A Vassoura Mágica Supersônica",
        pagesCount: 22,
        chapterUrl: "/chapters/4958-10003000/mashle-chapter-3",
        description: "Incapaz de flutuar com magia, Mash lança a vassoura como um dardo e sobe nela a velocidade hipersônica.",
        releaseDate: "2020",
        isFree: true,
        mangadexChapterId: "558c2122-7342-4649-85e9-a866727bb2e8",
      },
    ],
  },
  "wind-breaker": {
    animeId: "wind-breaker",
    mangadexId: "9eb78304-0436-484d-9a79-a925b45e2731",
    canonicalTitle: "WIND BREAKER",
    japaneseTitle: "WIND BREAKER (ウィンドブレイカー)",
    author: "Satoru Nii",
    artist: "Satoru Nii",
    publisher: "Kodansha",
    serialization: "Magazine Pocket",
    status: "Em publicação",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx163270-wboZJp0ybwVK.jpg",
    totalChaptersEstimate: 175,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "5830-10001000-wind-breaker-chapter-1",
        number: 1,
        title: "Capítulo 1: Haruka Sakura e a Cidade de Makochi",
        pagesCount: 65,
        chapterUrl: "/chapters/5830-10001000/wind-breaker-chapter-1",
        description: "Haruka Sakura chega à cidade de Makochi para se tornar o lutador mais forte de Furin High, mas se depara com a ordem da Bofurin.",
        releaseDate: "2021",
        isFree: true,
        mangadexChapterId: "9eb78304-0436-484d-9a79-a925b45e2731",
      },
      {
        id: "5830-10002000-wind-breaker-chapter-2",
        number: 2,
        title: "Capítulo 2: O Herói Delinquente",
        pagesCount: 32,
        chapterUrl: "/chapters/5830-10002000/wind-breaker-chapter-2",
        description: "Sakura defende a dona de um café e descobre a gratidão dos moradores locais pelos estudantes delinquentes.",
        releaseDate: "2021",
        isFree: true,
        mangadexChapterId: "9eb78304-0436-484d-9a79-a925b45e2731",
      },
      {
        id: "5830-10003000-wind-breaker-chapter-3",
        number: 3,
        title: "Capítulo 3: O Homem Que Protege a Cidade",
        pagesCount: 26,
        chapterUrl: "/chapters/5830-10003000/wind-breaker-chapter-3",
        description: "O líder Umemiya dá as boas-vindas aos calouros e define o lema inviolável que rege todos os membros de Furin.",
        releaseDate: "2021",
        isFree: true,
        mangadexChapterId: "9eb78304-0436-484d-9a79-a925b45e2731",
      },
    ],
  },
  "jigokuraku": {
    animeId: "jigokuraku",
    mangadexId: "cb77e4a6-3921-43b9-9d64-7d78cd3205ce",
    canonicalTitle: "Hell's Paradise: Jigokuraku",
    japaneseTitle: "地獄楽 (Jigokuraku)",
    author: "Yuji Kaku",
    artist: "Yuji Kaku",
    publisher: "Shueisha",
    serialization: "Shōnen Jump+",
    status: "Completo",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx128893-Gc2t8b8M0mVu.jpg",
    totalChaptersEstimate: 127,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "2069-10001000-jigokuraku-chapter-1",
        number: 1,
        title: "Capítulo 1: O Shinobi Imortal e a Carrasca",
        pagesCount: 58,
        chapterUrl: "/chapters/2069-10001000/jigokuraku-chapter-1",
        description: "Gabimaru, o Vazio, resiste a todas as decapitações até que Sagiri Yamada Asaemon descobre seu amor oculto por sua esposa.",
        releaseDate: "2018",
        isFree: true,
        mangadexChapterId: "cb77e4a6-3921-43b9-9d64-7d78cd3205ce",
      },
      {
        id: "2069-10002000-jigokuraku-chapter-2",
        number: 2,
        title: "Capítulo 2: Triagem Para Shinsenkyo",
        pagesCount: 26,
        chapterUrl: "/chapters/2069-10002000/jigokuraku-chapter-2",
        description: "Os piores criminosos do Japão feudal se enfrentam diante do Shogunato para selecionar a expedição ao Paraíso Infernal.",
        releaseDate: "2018",
        isFree: true,
        mangadexChapterId: "cb77e4a6-3921-43b9-9d64-7d78cd3205ce",
      },
      {
        id: "2069-10003000-jigokuraku-chapter-3",
        number: 3,
        title: "Capítulo 3: O Segredo do Tao",
        pagesCount: 24,
        chapterUrl: "/chapters/2069-10003000/jigokuraku-chapter-3",
        description: "Desembarque na ilha de Shinsenkyo, repleta de flores grotescas e criaturas bizarras imortais.",
        releaseDate: "2018",
        isFree: true,
        mangadexChapterId: "cb77e4a6-3921-43b9-9d64-7d78cd3205ce",
      },
    ],
  },
  "classroom-of-the-elite": {
    animeId: "classroom-of-the-elite",
    mangadexId: "26e4421f-cef8-4775-8bf6-423061d9b43e",
    canonicalTitle: "Classroom of the Elite",
    japaneseTitle: "ようこそ実力至上主義の教室へ",
    author: "Shogo Kinugasa",
    artist: "Yuyu Ichino",
    publisher: "Media Factory / Kadokawa",
    serialization: "Monthly Comic Alive",
    status: "Em publicação",
    officialCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx98659-WNyPLIZDpGGY.jpg",
    totalChaptersEstimate: 95,
    defaultLanguage: "pt-br",
    initialChapters: [
      {
        id: "2330-10001000-classroom-of-the-elite-chapter-1",
        number: 1,
        title: "Capítulo 1: A Estrutura da Classe D",
        pagesCount: 46,
        chapterUrl: "/chapters/2330-10001000/classroom-of-the-elite-chapter-1",
        description: "Kiyotaka Ayanokouji ingressa no Colégio Metropolitano de Tóquio para Desenvolvimento Avançado e recebe 100 mil pontos.",
        releaseDate: "2016",
        isFree: true,
        mangadexChapterId: "26e4421f-cef8-4775-8bf6-423061d9b43e",
      },
      {
        id: "2330-10002000-classroom-of-the-elite-chapter-2",
        number: 2,
        title: "Capítulo 2: O Significado dos Pontos",
        pagesCount: 28,
        chapterUrl: "/chapters/2330-10002000/classroom-of-the-elite-chapter-2",
        description: "A professora Chabashira revela a dura realidade do sistema de pontuação baseado no mérito e disciplina da turma.",
        releaseDate: "2016",
        isFree: true,
        mangadexChapterId: "26e4421f-cef8-4775-8bf6-423061d9b43e",
      },
      {
        id: "2330-10003000-classroom-of-the-elite-chapter-3",
        number: 3,
        title: "Capítulo 3: O Plano das Sombras",
        pagesCount: 25,
        chapterUrl: "/chapters/2330-10003000/classroom-of-the-elite-chapter-3",
        description: "Ayanokouji e Horikita Suzune formulam uma estratégia secreta para salvar a Classe D do rebaixamento.",
        releaseDate: "2016",
        isFree: true,
        mangadexChapterId: "26e4421f-cef8-4775-8bf6-423061d9b43e",
      },
    ],
  },
};

// In-memory cache for chapters and pages to ensure lightning speed
const chaptersMemoryCache = new Map<string, MangaDexChapter[]>();
const pagesMemoryCache = new Map<string, { baseUrl: string; hash: string; pages: string[] }>();

/**
 * Universal anime manga chapter fetcher with multi-source fallback
 */
export async function fetchAnimeMangaChapters(animeId: string): Promise<MangaDexChapter[]> {
  const cacheKey = `anime_${animeId}`;
  if (chaptersMemoryCache.has(cacheKey)) {
    return chaptersMemoryCache.get(cacheKey)!;
  }

  // Special Case 1: Tower of God on Webtoon
  if (animeId === "tower-of-god") {
    try {
      const res = await fetch("/api/webtoon/official-chapters?titleNo=95&genre=fantasy&slug=tower-of-god");
      if (res.ok) {
        const data = await res.json();
        const chaps: MangaDexChapter[] = (data.chapters || []).map((c: any) => ({
          id: c.id,
          number: String(c.number),
          numericNumber: c.number,
          title: c.title,
          pagesCount: c.panels_count || 12,
          translatedLanguage: "PT-BR / OFICIAL",
          scanlationGroup: "Webtoon Oficial",
          publishAt: c.release_date || "2024",
          isFree: true,
          externalUrl: c.viewer_url || null,
        }));
        if (chaps.length > 0) {
          chaps.sort((a, b) => a.numericNumber - b.numericNumber);
          chaptersMemoryCache.set(cacheKey, chaps);
          return chaps;
        }
      }
    } catch (err) {
      console.warn("Tower of god chapters fallback:", err);
    }
  }

  // Primary Path: High-speed Manga catalog (/api/manga/chapters)
  try {
    const res = await fetch(`/api/manga/chapters?animeId=${animeId}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.chapters) && data.chapters.length > 0) {
        const chaps: MangaDexChapter[] = data.chapters.map((c: any) => ({
          id: c.id,
          number: String(c.number),
          numericNumber: c.number,
          title: c.title || `Capítulo ${c.number}`,
          pagesCount: 35,
          translatedLanguage: "PT-BR / OFICIAL",
          scanlationGroup: "Edição Oficial",
          publishAt: "2024",
          isFree: true,
          chapterUrl: c.chapterUrl,
        }));
        chaps.sort((a, b) => a.numericNumber - b.numericNumber);
        chaptersMemoryCache.set(cacheKey, chaps);
        return chaps;
      }
    }
  } catch (err) {
    console.warn("Multi-source manga chapter fetch error:", err);
  }

  // Fallback: Initial pre-configured chapters
  const config = ANIME_MANGA_CONFIGS[animeId];
  if (config && config.initialChapters.length > 0) {
    const fallbackList: MangaDexChapter[] = config.initialChapters.map((ch) => ({
      id: ch.id,
      number: String(ch.number),
      numericNumber: ch.number,
      title: ch.title,
      pagesCount: ch.pagesCount,
      translatedLanguage: "PT-BR",
      scanlationGroup: "Oficial",
      publishAt: ch.releaseDate,
      isFree: ch.isFree,
      chapterUrl: ch.chapterUrl,
    }));
    return fallbackList;
  }

  return [];
}

/**
 * Universal anime manga pages resolver with multi-language & multi-source support
 */
export async function fetchAnimeMangaPages(
  animeId: string,
  chapterIdentifier: string,
  chapterNumber?: number,
  language: "pt" | "en" | "ja" = "pt",
  quality: "data" | "dataSaver" = "data"
): Promise<{ baseUrl: string; hash: string; pages: string[] }> {
  const effectiveChapterNum =
    chapterNumber ||
    (chapterIdentifier.includes("chapter-")
      ? parseFloat(chapterIdentifier.split("chapter-")[1]) || 1
      : 1);
  const cacheKey = `${animeId}-${chapterIdentifier}-${effectiveChapterNum}-${language}-${quality}`;
  if (pagesMemoryCache.has(cacheKey)) {
    return pagesMemoryCache.get(cacheKey)!;
  }

  const config = ANIME_MANGA_CONFIGS[animeId];

  // 1. Primary Multi-Language MangaDex Resolver (fetches exact language: pt-br, en, or ja!)
  const langParam = language === "pt" ? "pt-br" : language === "en" ? "en" : "ja";
  const searchTitle = config?.canonicalTitle || animeId.replace(/-/g, " ");
  const mangadexId = config?.mangadexId || "";

  if (mangadexId || searchTitle) {
    try {
      const resolveUrl = `/api/mangadex/resolve-chapter?animeId=${encodeURIComponent(
        animeId || ""
      )}&mangaId=${encodeURIComponent(
        mangadexId
      )}&title=${encodeURIComponent(searchTitle)}&chapter=${effectiveChapterNum}&lang=${langParam}&quality=${quality}`;
      const resolveRes = await fetch(resolveUrl);
      if (resolveRes.ok) {
        const rData = await resolveRes.json();
        if (rData?.success && Array.isArray(rData.pages) && rData.pages.length > 0) {
          const result = {
            baseUrl: "",
            hash: `mangadex-${rData.languageUsed || langParam}`,
            pages: rData.pages,
          };
          pagesMemoryCache.set(cacheKey, result);
          return result;
        }
      }
    } catch (err) {
      console.warn("[MangaDex] Multi-language chapter resolve failed:", err);
    }
  }

  // 2. If language === "pt" and chapter has pre-configured local PT-BR pages (e.g. Solo Leveling)
  if (config && language === "pt") {
    const matchedInitial = config.initialChapters.find(
      (c) =>
        c.id === chapterIdentifier ||
        c.chapterUrl === chapterIdentifier ||
        c.number === effectiveChapterNum ||
        c.mangadexChapterId === chapterIdentifier
    );
    if (matchedInitial?.pages && matchedInitial.pages.length > 0) {
      const result = { baseUrl: "", hash: "local-pt", pages: matchedInitial.pages };
      pagesMemoryCache.set(cacheKey, result);
      return result;
    }
  }

  // 3. Special Case: Tower of God on Webtoon
  if (animeId === "tower-of-god") {
    try {
      const res = await fetch(
        `/api/webtoon/pages?titleNo=95&genre=fantasy&slug=tower-of-god&episodeNo=${effectiveChapterNum}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.pages) && data.pages.length > 0) {
          const proxied = data.pages.map((p: string) =>
            p.startsWith("/api/proxy/") ? p : `/api/proxy/webtoon-image?url=${encodeURIComponent(p)}`
          );
          const result = { baseUrl: "", hash: "webtoon", pages: proxied };
          pagesMemoryCache.set(cacheKey, result);
          return result;
        }
      }
    } catch (err) {
      console.warn("Tower of God pages fetch error:", err);
    }
  }

  // 4. High-res manga chapter pages via /api/manga/pages (MangaPill mirror)
  try {
    let cleanUrl = chapterIdentifier;
    if (chapterIdentifier.startsWith("/chapters/")) {
      cleanUrl = chapterIdentifier;
    } else if (/^\d+-\d+-/.test(chapterIdentifier)) {
      cleanUrl = chapterIdentifier.replace(/^(\d+-\d+)-(.+)$/, "/chapters/$1/$2");
    }

    const params = new URLSearchParams();
    if (cleanUrl.startsWith("/chapters/") || cleanUrl.startsWith("http")) {
      params.set("chapterUrl", cleanUrl);
    }
    if (animeId) {
      params.set("animeId", animeId);
    }
    if (effectiveChapterNum) {
      params.set("chapterNumber", String(effectiveChapterNum));
    }

    const res = await fetch(`/api/manga/pages?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.pages) && data.pages.length > 0) {
        const result = { baseUrl: "", hash: "manga", pages: data.pages };
        pagesMemoryCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.warn("Primary manga pages API fetch error:", err);
  }

  // 5. Direct UUID passed to MangaDex at-home proxy
  const uuidCandidate =
    chapterIdentifier.length === 36 &&
    chapterIdentifier.includes("-") &&
    !chapterIdentifier.includes("0000-4000-8000")
      ? chapterIdentifier
      : null;

  if (uuidCandidate) {
    try {
      const res = await fetch(`/api/mangadex/server?chapterId=${uuidCandidate}`);
      if (res.ok) {
        const json = await res.json();
        if (json.result === "ok" && json.baseUrl && json.chapter) {
          const { baseUrl, chapter } = json;
          const hash = chapter.hash;
          const files: string[] = chapter.data || chapter.dataSaver || [];
          const pages = files.map(
            (file) => `/api/proxy/manga-image?url=${encodeURIComponent(`${baseUrl}/data/${hash}/${file}`)}`
          );
          if (pages.length > 0) {
            const result = { baseUrl, hash, pages };
            pagesMemoryCache.set(cacheKey, result);
            return result;
          }
        }
      }
    } catch {}
  }

  // 6. Final fallback: pre-configured local pages if available
  if (config) {
    const matchedInitial =
      config.initialChapters.find((c) => c.number === effectiveChapterNum) || config.initialChapters[0];
    if (matchedInitial?.pages && matchedInitial.pages.length > 0) {
      const result = { baseUrl: "", hash: "local", pages: matchedInitial.pages };
      pagesMemoryCache.set(cacheKey, result);
      return result;
    }
  }

  throw new Error("Não foi possível carregar as páginas do capítulo selecionado.");
}

/**
 * Backward-compatible MangaDex chapter fetcher that delegates to universal multi-source engine
 */
export async function fetchMangaDexChapters(
  mangadexId: string,
  languageFilter: "pt-br" | "en" | "all" = "all"
): Promise<MangaDexChapter[]> {
  let matchedAnimeId = "";
  for (const [animeId, conf] of Object.entries(ANIME_MANGA_CONFIGS)) {
    if (conf.mangadexId === mangadexId || animeId === mangadexId) {
      matchedAnimeId = animeId;
      break;
    }
  }

  if (matchedAnimeId) {
    return await fetchAnimeMangaChapters(matchedAnimeId);
  }

  try {
    const res = await fetch(`/api/mangadex/feed?mangaId=${mangadexId}&lang=${languageFilter}&limit=100`);
    if (res.ok) {
      const data = await res.json();
      const rawChapters = data.data || [];
      const chapterMap = new Map<string, MangaDexChapter>();
      for (const item of rawChapters) {
        const attrs = item.attributes || {};
        const chNum = attrs.chapter || "1";
        const chapterObj: MangaDexChapter = {
          id: item.id,
          number: chNum,
          numericNumber: parseFloat(chNum) || 0,
          title: attrs.title || `Capítulo ${chNum}`,
          volume: attrs.volume || undefined,
          pagesCount: attrs.pages || 0,
          translatedLanguage: attrs.translatedLanguage || "en",
          scanlationGroup: "Scan Oficial",
          publishAt: attrs.publishAt ? new Date(attrs.publishAt).toLocaleDateString("pt-BR") : "2024",
          isFree: true,
        };
        chapterMap.set(chNum, chapterObj);
      }
      return Array.from(chapterMap.values()).sort((a, b) => a.numericNumber - b.numericNumber);
    }
  } catch {}

  return [];
}

/**
 * Backward-compatible MangaDex pages resolver that delegates to universal multi-source engine
 */
export async function fetchMangaDexChapterPages(
  chapterId: string,
  quality: "data" | "dataSaver" = "data",
  language: "pt" | "en" | "ja" = "pt"
): Promise<{ baseUrl: string; hash: string; pages: string[] }> {
  for (const [animeId, conf] of Object.entries(ANIME_MANGA_CONFIGS)) {
    const found = conf.initialChapters.find(
      (c) => c.id === chapterId || c.mangadexChapterId === chapterId || c.chapterUrl === chapterId
    );
    if (found) {
      return await fetchAnimeMangaPages(animeId, found.chapterUrl || chapterId, found.number, language, quality);
    }
  }

  return await fetchAnimeMangaPages("", chapterId, undefined, language, quality);
}
