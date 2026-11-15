export type NewsItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_url?: string | null;
  category: string;
  published: boolean;
  published_at: string;
  created_at?: string;
  updated_at?: string;
  author?: string;
  source_name?: string;
  source_url?: string;
  read_time?: number;
  is_syndicated?: boolean;
  featured?: boolean;
};

export type CuratedNews = NewsItem;

export const NEWS_CATEGORIES = [
  "Futebol",
  "Basquete",
  "Desportos",
  "Geopolítica",
  "Animes",
  "Mangás",
  "Webtoons",
  "Tecnologias",
  "Moda",
  "Games",
  "Cultura",
  "Livros",
  "Mercado",
  "Política",
  "Ciência",
  "Geografia",
  "Virais",
  "Listas",
] as const;

export function readingTime(item: Partial<CuratedNews>): number {
  if (item.read_time && item.read_time > 0) return item.read_time;
  const text = `${item.title || ""} ${item.excerpt || ""} ${item.content || ""}`;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

export function byline(item: Partial<CuratedNews>): string {
  return item.source_name || item.author || "Redação Oficial";
}

export function photoCredit(item: Partial<CuratedNews>): string {
  const src = item.source_name || item.author;
  return src ? `Foto: Divulgação / ${src}` : "Foto: Reprodução Editorial";
}

export function pickFeatured(items: CuratedNews[]): CuratedNews | null {
  if (!items || items.length === 0) return null;
  const explicit = items.find((i) => i.featured);
  if (explicit) return explicit;
  return items[0];
}

export const CATEGORY_METADATA: Record<
  string,
  {
    title: string;
    subtitle: string;
    description: string;
    seoKeywords: string[];
    accentColor: string;
    badgeBg: string;
  }
> = {
  Futebol: {
    title: "Notícias de Futebol • BeSoccer, 365Scores e TNT Sports",
    subtitle: "Cobertura oficial em tempo real via BeSoccer, 365Scores e TNT Sports",
    description:
      "Acompanhe resultados, mercado de transferências, UEFA Champions League, Premier League, La Liga, Brasileirão e seleções com apuração direta de BeSoccer, 365Scores e TNT Sports.",
    seoKeywords: ["notícias de futebol", "besoccer", "365scores", "tnt sports", "champions league", "futebol ao vivo"],
    accentColor: "from-green-500 to-emerald-600",
    badgeBg: "bg-emerald-500/90 text-white border-emerald-400/40",
  },
  Basquete: {
    title: "Notícias de Basquetebol & NBA • BeSoccer, 365Scores e TNT Sports",
    subtitle: "NBA, EuroLeague, NBB e basquete mundial via BeSoccer, 365Scores e TNT Sports",
    description:
      "Cobertura completa de basquetebol: rodadas da NBA, playoffs, estatísticas, trocas e ligas internacionais com dados de BeSoccer, 365Scores e TNT Sports.",
    seoKeywords: ["notícias de basquete", "nba brasil", "besoccer basquete", "365scores nba", "tnt sports nba"],
    accentColor: "from-orange-500 to-red-600",
    badgeBg: "bg-orange-500/90 text-white border-orange-400/40",
  },
  Desportos: {
    title: "Outros Desportos e Modalidades • BeSoccer, 365Scores e TNT Sports",
    subtitle: "Fórmula 1, Tênis, Vôlei, UFC, Atletismo e Olimpíadas via BeSoccer, 365Scores e TNT Sports",
    description:
      "Todas as modalidades esportivas mundiais reunidas em um só lugar: automobilismo, tênis, vôlei, artes marciais e esportes olímpicos.",
    seoKeywords: ["outros desportos", "modalidades esportivas", "besoccer", "365scores", "tnt sports", "fórmula 1", "tênis"],
    accentColor: "from-lime-500 to-green-600",
    badgeBg: "bg-lime-600/90 text-white border-lime-400/40",
  },
  "Geopolítica": {
    title: "Notícias de Geopolítica • The New York Times, Euronews e Band",
    subtitle: "Relações internacionais, diplomacia e política global via NYT, Euronews e Band",
    description:
      "Análises aprofundadas sobre geopolítica, cúpulas globais, conflitos internacionais e economia política com reportagens do The New York Times, Euronews e Band Jornalismo.",
    seoKeywords: ["notícias de geopolítica", "new york times", "euronews", "band notícias", "relações internacionais"],
    accentColor: "from-slate-500 to-blue-600",
    badgeBg: "bg-blue-600/90 text-white border-blue-400/40",
  },
  Animes: {
    title: "Notícias de Animes • Crunchyroll Notícias & Anime News Network",
    subtitle: "Estreias, trailers e indústria japonesa via Crunchyroll Notícias e Anime News Network",
    description:
      "Fique por dentro das últimas notícias de animes direto da Crunchyroll Notícias e Anime News Network (ANN): novas temporadas, estúdios e estreias oficiais.",
    seoKeywords: ["notícias de animes", "crunchyroll notícias", "anime news network", "estreias de animes", "otaku"],
    accentColor: "from-amber-500 to-orange-500",
    badgeBg: "bg-amber-500/90 text-white border-amber-400/40",
  },
  "Mangás": {
    title: "Notícias de Mangás • Crunchyroll Notícias & Anime News Network",
    subtitle: "Lançamentos editoriais, Shonen Jump e tiragens via Crunchyroll e Anime News Network",
    description:
      "Acompanhe os anúncios de novos capítulos, rankings da Oricon, premiações e publicações de mangás reportados pela Crunchyroll Notícias e Anime News Network.",
    seoKeywords: ["notícias de mangás", "crunchyroll mangás", "anime news network", "shonen jump", "mangakás"],
    accentColor: "from-rose-500 to-pink-500",
    badgeBg: "bg-rose-500/90 text-white border-rose-400/40",
  },
  Webtoons: {
    title: "Notícias de Webtoons • WEBTOON Oficial (webtoon.com)",
    subtitle: "Lançamentos originais, manhwas e adaptações direto da WEBTOON (webtoon.com)",
    description:
      "Descubra as novidades oficiais da plataforma WEBTOON (webtoon.com): novas séries originais, retornos de temporada e adaptações de manhwas.",
    seoKeywords: ["notícias de webtoons", "webtoon.com", "manhwa notícias", "solo leveling", "tower of god"],
    accentColor: "from-violet-500 to-purple-500",
    badgeBg: "bg-violet-600/90 text-white border-violet-400/40",
  },
  Tecnologias: {
    title: "Notícias de Tecnologia • TecMundo & Canaltech",
    subtitle: "Inteligência Artificial, smartphones, hardware e ciência digital via TecMundo e Canaltech",
    description:
      "Cobertura tecnológica em tempo real com reportagens do TecMundo e Canaltech sobre IA, lançamentos de celulares, cibersegurança e inovação.",
    seoKeywords: ["notícias de tecnologia", "tecmundo", "canaltech", "inteligência artificial", "smartphones"],
    accentColor: "from-cyan-500 to-sky-500",
    badgeBg: "bg-cyan-600/90 text-white border-cyan-400/40",
  },
  Moda: {
    title: "Notícias de Moda & Streetwear • Vogue, ELLE Brasil, Nike e Adidas",
    subtitle: "Alta-costura, tendências e drops exclusivos via Vogue, ELLE Brasil, Nike e Adidas",
    description:
      "As principais tendências das semanas de moda, editoriais da Vogue e ELLE Brasil, além dos lançamentos globais e colaborações da Nike e Adidas.",
    seoKeywords: ["notícias de moda", "vogue", "elle brasil", "nike lançamentos", "adidas originals", "streetwear"],
    accentColor: "from-fuchsia-500 to-pink-600",
    badgeBg: "bg-fuchsia-600/90 text-white border-fuchsia-400/40",
  },
  Games: {
    title: "Notícias de Jogos • MMORPGBR, IGN Brasil, Eurogamer e Mais",
    subtitle: "MMOs, RPGs, lançamentos de PC/Consoles e eSports via MMORPGBR e grandes portais",
    description:
      "Tudo sobre o universo gamer com cobertura especializada do MMORPGBR, IGN Brasil, Eurogamer e GameVicio sobre MMORPGs, PlayStation, Xbox, Nintendo e PC.",
    seoKeywords: ["notícias de jogos", "mmorpgbr", "ign brasil", "eurogamer", "lançamentos de games", "mmorpg"],
    accentColor: "from-indigo-500 to-blue-500",
    badgeBg: "bg-indigo-600/90 text-white border-indigo-400/40",
  },
  Cultura: {
    title: "Notícias de Cultura & Artes • BBC Culture & The Guardian Culture",
    subtitle: "Cinema, literatura, música, exposições e crítica internacional via BBC Culture e The Guardian",
    description:
      "Reportagens e ensaios culturais da BBC Culture e The Guardian Culture sobre cinema mundial, artes visuais, música, teatro e patrimônio.",
    seoKeywords: ["notícias de cultura", "bbc culture", "the guardian culture", "cinema e artes", "crítica cultural"],
    accentColor: "from-yellow-500 to-amber-500",
    badgeBg: "bg-amber-600/90 text-white border-amber-400/40",
  },
  Livros: {
    title: "Notícias de Livros & Literatura",
    subtitle: "Lançamentos literários, prêmios internacionais e resenhas",
    description:
      "Novidades do mercado editorial, grandes autores, feiras literárias e críticas da BBC Culture e The Guardian Books.",
    seoKeywords: ["notícias de livros", "literatura", "mercado editorial", "lançamentos de livros"],
    accentColor: "from-emerald-500 to-teal-500",
    badgeBg: "bg-teal-600/90 text-white border-teal-400/40",
  },
  Mercado: {
    title: "Notícias de Mercado, Economia & Negócios",
    subtitle: "Finanças globais, bolsas de valores e tecnologia corporativa",
    description:
      "Indicadores econômicos, movimentações corporativas e análises de mercado internacional.",
    seoKeywords: ["notícias de mercado", "economia", "bolsa de valores", "investimentos"],
    accentColor: "from-teal-500 to-emerald-600",
    badgeBg: "bg-emerald-600/90 text-white border-emerald-400/40",
  },
  "Política": {
    title: "Notícias de Política & Diplomacia • NYT, Euronews e Band",
    subtitle: "Decisões governamentais, parlamentos e política internacional via NYT, Euronews e Band",
    description:
      "Cobertura política nacional e internacional com apuração do The New York Times, Euronews e Band Jornalismo.",
    seoKeywords: ["notícias de política", "new york times", "euronews", "band", "diplomacia"],
    accentColor: "from-slate-500 to-zinc-600",
    badgeBg: "bg-slate-600/90 text-white border-slate-400/40",
  },
  "Ciência": {
    title: "Notícias de Ciência & Espaço",
    subtitle: "Descobertas científicas, astronomia, medicina e biotecnologia",
    description:
      "Avanços da ciência espacial, física, genética e saúde global.",
    seoKeywords: ["notícias de ciência", "astronomia", "espaço", "biotecnologia"],
    accentColor: "from-sky-500 to-indigo-600",
    badgeBg: "bg-sky-600/90 text-white border-sky-400/40",
  },
  Geografia: {
    title: "Notícias de Geografia, Clima & Territórios",
    subtitle: "Meio ambiente, oceanos, transição energética e cartografia global",
    description:
      "Reportagens sobre mudanças climáticas, ecossistemas e transformações geográficas globais.",
    seoKeywords: ["notícias de geografia", "clima", "meio ambiente", "sustentabilidade"],
    accentColor: "from-lime-500 to-green-600",
    badgeBg: "bg-green-600/90 text-white border-green-400/40",
  },
  Virais: {
    title: "Notícias Virais & Tendências Digitais",
    subtitle: "O que está movimentando as redes e a cultura da internet",
    description:
      "Fenômenos digitais, criadores de conteúdo e os assuntos mais comentados da semana.",
    seoKeywords: ["notícias virais", "trends", "redes sociais", "cultura digital"],
    accentColor: "from-pink-500 to-rose-600",
    badgeBg: "bg-pink-600/90 text-white border-pink-400/40",
  },
  Listas: {
    title: "Listas, Rankings & Guias Especiais",
    subtitle: "Seleções editoriais, comparativos e recomendações",
    description:
      "Rankings e guias completos sobre jogos, animes, tecnologia, moda e cultura.",
    seoKeywords: ["listas", "rankings", "melhores do ano", "guias"],
    accentColor: "from-purple-500 to-fuchsia-600",
    badgeBg: "bg-purple-600/90 text-white border-purple-400/40",
  },
};

export const FALLBACK_NEWS: NewsItem[] = [
  {
    "id": "syn-brasil-x-japao-raphinha-reencontra-suzuki-apos-dobradinha-em-duelo-pela-cha-27760194488",
    "title": "Brasil x Japão: Raphinha reencontra Suzuki após ‘dobradinha’ em duelo pela Champions League",
    "slug": "brasil-x-japao-raphinha-reencontra-suzuki-apos-dobradinha-em-duelo-pela-cha-27760194488",
    "excerpt": "Atacante do Barcelona já marcou duas vezes contra o goleiro japonês nesta temporada em duelo vencido contra o Aston Villa pelo principal torneio europeu",
    "content": "Atacante do Barcelona já marcou duas vezes contra o goleiro japonês nesta temporada em duelo vencido contra o Aston Villa pelo principal torneio europeu\n\nO amistoso entre Brasil e Japão , neste sábado (14), em Singapura, terá um confronto particular entre dois jogadores que vivem momentos de destaque no futebol europeu. De um lado, Raphinha, principal referência ofensiva da equipe de Carlo Ancelotti. Do outro, o goleiro japonês Zion Suzuki, que vem chamando a atenção com suas atuações pelo Aston Villa, da Inglaterra.\n\nO reencontro terá um ingrediente especial: os dois já estiveram frente a frente nesta temporada, quando o Barcelona venceu o Aston Villa por 3 a 0, pela Champions League. Na ocasião, Raphinha marcou dois gols sobre o goleiro de 24 anos e voltou a mostrar sua capacidade de decidir partidas em alto nível.\n\nAgora, os dois estarão em lados opostos novamente, desta vez defendendo suas seleções. Raphinha, inclusive, será o capitão da Seleção Brasileira diante dos japoneses. Sem Marquinhos, Carlo Ancelotti decidiu manter a hierarquia estabelecida na última Data FIFA e entregar a braçadeira ao camisa 10.\n\n### Raphinha vive fase artilheira, enquanto Suzuki chama atenção na Inglaterra\n\nO atacante do Barcelona chega ao compromisso internacional em grande fase. Raphinha soma 19 gols em 14 partidas e aparece entre os principais artilheiros em atividade no futebol europeu.\n\nRaphinha tenta deslanchar na Seleção Brasileira após excelentes números pelo Barcelona – Foto: Ruano Carneiro/Getty Images\n\nSuzuki, por sua vez, também atravessa um momento importante na carreira. O goleiro foi contratado pelo Aston Villa para ocupar a vaga de Dibu Martínez e já figura entre os jogadores com mais defesas na atual edição da Premier League, ocupando a quarta posição no ranking.\n\nAs atuações do japonês também despertaram o interesse de outros gigantes europeus. Segundo o TeamTalk , o Liverpool monitora a situação do goleiro como uma possível alternativa para o futuro, considerando a possibilidade de substituir Alisson, cujo contrato com os Reds vai até o próximo ano.\n\nEntretanto, uma negociação não deve ser simples. Suzuki tem vínculo com o Aston Villa até 2031, e o clube inglês não deve facilitar uma eventual saída do jogador contratado no último verão europeu.\n\n### Brasil busca nova vitória após confronto equilibrado na Copa do Mundo\n\nO amistoso também marca mais um encontro entre duas seleções que protagonizaram um confronto disputado na última Copa do Mundo . Na ocasião, Brasil e Japão se enfrentaram na fase eliminatória, e a equipe brasileira precisou buscar a virada para vencer por 2 a 1, com gol de Gabriel Martinelli nos acréscimos.\n\nRaphinha não participou daquela partida por estar lesionado, enquanto Suzuki teve atuação de destaque defendendo a seleção japonesa. Brasil e Japão se enfrentam neste sábado (14), às 7h15 (horário de Brasília), no Estádio Nacional de Singapura.\n\nMatheus Martins Fontes começou a carreira em 2010 e se formou em jornalismo na Unesp em 2012. Com passagem por O Estado de S.Paulo, Torcedores.com e Revista TÊNIS, participou na cobertura de Copas do Mundo, Jogos Olímpicos, Roland Garros, Copa Davis, entre outros eventos. É repórter e especialista do Palmeiras no Bolavip Brasil, com apurações de bastidores, mercado da bola, análises e opiniões sobre o clube.",
    "cover_url": "https://media.bolavip.com/wp-content/uploads/sites/27/2026/11/13134345/GettyImages-2233763060-1200x740.webp",
    "category": "Futebol",
    "published": true,
    "published_at": "2026-11-13T08:48:00.000Z",
    "created_at": "2026-11-13T08:48:00.000Z",
    "author": "TNT Sports",
    "source_name": "TNT Sports",
    "source_url": "https://br.bolavip.com/selecao-brasileira/brasil-x-japao-raphinha-reencontra-suzuki-apos-dobradinha-em-duelo-pela-champions-league",
    "read_time": 3,
    "is_syndicated": true,
    "featured": true
  },
  {
    "id": "syn-onde-assistir-a-nba-hoje-11-11-veja-jogos-horarios-e-transmissoes-desta-qua-79513229",
    "title": "Onde assistir à NBA hoje (11/11): veja jogos, horários e transmissões desta quarta-feira",
    "slug": "onde-assistir-a-nba-hoje-11-11-veja-jogos-horarios-e-transmissoes-desta-qua-79513229",
    "excerpt": "Programação desta quarta reúne nove partidas da liga norte-americana, além de compromissos pelo basquete brasileiro e pela Euroliga",
    "content": "Programação desta quarta reúne nove partidas da liga norte-americana, além de compromissos pelo basquete brasileiro e pela Euroliga\n\nA programação de basquete desta quarta-feira (11) conta com partidas pela NBA, pelo Novo Basquete Brasil (NBB) e pela Euroliga. Ao todo, são nove jogos da liga norte-americana, além de um confronto pelo campeonato brasileiro e outro pela competição europeia.\n\nNa NBA, a rodada começa &agrave;s 21h, com três partidas simultâneas. Entre os destaques estão Lakers x Bucks, &agrave;s 22h, e Warriors x Rockets, &agrave;s 23h30. Confira os horários e onde assistir aos jogos ao vivo.\n\n### Jogos de basquete hoje (11/11): onde assistir\n\n### Euroliga – 11&ordf; rodada\n\n### NBB – 1&ordf; fase, 5&ordf; rodada\n\n### NBA – Semana 4\n\n### Como assistir &agrave; NBA ao vivo no Brasil\n\nA NBA conta com diferentes opções de transmissão no Brasil. Entre elas estão ESPN, Disney+, Amazon Prime Video e NBA League Pass, com disponibilidade de partidas conforme a programação de cada plataforma.\n\nA ESPN exibe jogos selecionados, com cobertura jornalística e análises. O Disney+ também disponibiliza confrontos da liga por streaming.\n\nO Amazon Prime Video possui um pacote de transmissões que inclui 147 jogos da temporada regular, além de partidas da Emirates NBA Cup, do SoFi NBA Play-In, do jogo da Black Friday e de confrontos das duas primeiras rodadas dos playoffs.\n\nOutra alternativa é o canal oficial NBA Brasil no YouTube , que transmite partidas selecionadas gratuitamente e oferece resumos, melhores momentos e análises.\n\n### NBA League Pass: como acompanhar os jogos\n\nO NBA League Pass reúne as partidas da liga em um único serviço de streaming. A assinatura dá acesso a jogos ao vivo e conteúdos sob demanda, incluindo pré-temporada, temporada regular, NBA Cup e playoffs.\n\nA plataforma também oferece recursos como múltiplos ângulos de câmera e replays. A Vivo disponibiliza o NBA League Pass Premium como opção para seus clientes.\n\nUm jogo por semana recebe narração em português e aparece identificado como “VIVO” na programação.\n\n### Thiago Seabra\n\nJornalista esportivo no Blog do Torcedor, do Jornal do Commercio, cobrindo futebol local e outros esportes. Atuou também no Projeto Comprova, iniciativa de verificação de fatos que busca oferecer ao público uma compreensão confiável dos acontecimentos.",
    "cover_url": "https://imagens.ne10.uol.com.br/veiculos/_midias/png/2026/11/10/852x479/1_hwjuf76agaakp14-37222600.png?20261110130826",
    "category": "Basquete",
    "published": true,
    "published_at": "2026-11-11T00:57:00.000Z",
    "created_at": "2026-11-11T00:57:00.000Z",
    "author": "TNT Sports",
    "source_name": "TNT Sports",
    "source_url": "https://jc.uol.com.br/blog-do-torcedor/onde-assistir/2026/11/11/onde-assistir-a-nba-hoje-11-11-veja-jogos-horarios-e-transmissoes-desta-quarta-feira.html",
    "read_time": 2,
    "is_syndicated": true,
    "featured": false
  },
  {
    "id": "syn-ufc-retorno-de-amanda-nunes-pode-concluir-dominio-inedito-do-brasil-no-mma--1600367930",
    "title": "UFC: Retorno de Amanda Nunes pode concluir domínio inédito do Brasil no MMA feminino",
    "slug": "ufc-retorno-de-amanda-nunes-pode-concluir-dominio-inedito-do-brasil-no-mma--1600367930",
    "excerpt": "Dentre outros destaques, o card do UFC 334, programado para este sábado (14), em Nova York (EUA), marca o retorno de Amanda Nunes - para muitos fãs e membros da imprensa, a maior lutadora de MMA de todos os tempos. E se ...",
    "content": "Dentre outros destaques, o card do UFC 334, programado para este sábado (14), em Nova York (EUA), marca o retorno de Amanda Nunes - para muitos fãs e membros da imprensa, a maior lutadora de MMA de todos os tempos. E se individualmente não faltam recordes para a 'Leoa', coincidentemente, sua volta à ativa após mais de três anos aposentada pode ajudar o Brasil a concluir um feito inédito na modalidade e fincar sua bandeira como a grande potência feminina da organização. Caso Amanda vença Kayla Harrison na disputa do título dos pesos-galos (61 kg), o país teria, pela primeira vez na história, todas as campeãs do Ultimate possíveis de forma simultânea.\n\nAtualmente representado por três categorias, o MMA feminino no UFC já é dominado por uma legião de atletas brasileiras. Na categoria peso-palha (52 kg), Mackenzie Dern reina, tendo defendido seu cinturão em agosto deste ano, contra Gillian Robertson. Já na divisão peso-mosca (57 kg), Natália Silva recentemente se tornou a primeira campeã tupiniquim da faixa de peso, ao derrotar a chinesa Wang Cong no início de outubro. Portanto, caso derrote a bicampeã olímpica de judô Kayla Harrison, Amanda Nunes completará a 'trinca de ouro' nacional.\n\n### Exemplo para a nova geração\n\nUma das pioneiras e única bicampeã da história do UFC entre as mulheres, tendo conquistado o cinturão peso-galo e peso-pena (66 kg) no passado, Amanda Nunes inspirou uma legião de atletas da nova geração. Pensando nisso, o perfil oficial do 'UFC Brasil' nas redes sociais (veja abaixo ou clique aqui ), reuniu lutadoras brasileiras do atual plantel do Ultimate para exaltarem o legado da 'Leoa'. O relato das também campeãs Natália Silva e Mackenzie Dern ficou ainda mais em evidência, dado o contexto.\n\nBrasil não conhece Brasil e quer plano de crescimento\n\nChina deve estar rindo da pane aérea nos EUA\n\n\"Sou muito privilegiada, porque muitas vezes eu te vi pela TV, torci muito por você , celebrei te vendo e alcançando seus sonhos. E agora estamos prestes a viver um momento histórico para o Brasil. Três campeãs femininas representando o nosso país \", declarou Natália Silva.\n\nAssista a lutas ao vivo do WGP e K1 Kickboxing pelo UOL Play\n\n\" Falta só você! Três campeãs brasileiras no UFC . Acredito muito em você, sei que você vai tirar onda na sua luta, por toda a sua dedicação. Obrigado por ser uma inspiração para mim , e por todo apoio que você me deu. Vamos com tudo!\", exaltou Mackenzie Dern.\n\n### Rivalidade antiga\n\nPara além de objetivos amplos, pensando no MMA nacional como um todo, o embate contra Kayla carrega toda uma carga extra, por conta do histórico de ambas as atletas. Originalmente companheira de Harrison na 'American Top Team', Amanda já admitiu que a ascensão da judoca americana foi um dos principais motivos para sua saída da equipe.\n\nCom uma narrativa estabelecida, a rivalidade extrapolou o ambiente dos treinos e passou a ganhar contornos públicos, alimentando a expectativa em torno do duelo. Agora, com o cinturão em jogo e trajetórias que voltam a se cruzar no maior palco do MMA, o embate ganhou ainda mais relevância. O presidente do UFC, Dana White, inclusive, já classificou o confronto entre Kayla e Amanda como a maior luta feminina da história da organização.\n\n\" Já treinei com ela, é uma menina muito forte. Uma atleta dura, eu também sou. Quando a gente treinava, era um quebra-quebra na academia, era uma luta. Toda vez que a gente treinava, era uma luta. Eu sabia que isso (combate entre nós) iria acontecer. Quando a gente treinava, tinha algo que era diferente. Você sente quando é treino com uma parceira e quando é um treino de competição. Eu pensava: 'Essa menina quer alguma coisa aqui'. Eu ficava ligada. O tatame ficou pequeno para nós duas. Os incomodados que se mudem, e eu que estava incomodada (e saí da American Top Team)\", relatou Nunes, em entrevista ao canal 'UFC Brasil', nesta semana.\n\n### O que está em jogo?\n\nApontada como a 'GOAT' do MMA feminino, Amanda é ex-campeã peso-galo e peso-pena do UFC. Kayla, por sua vez, é uma espécie de heroína nos EUA, já que foi medalhista de ouro olímpica duas vezes, se tornou campeã da PFL e, agora, também do Ultimate. Sendo assim, a judoca agora busca o posto de melhor lutadora de todos os tempos nos esportes de combate caso vença a 'Leoa' . Nunes, por sua vez, mesmo voltando da aposentadoria, quer mostrar neste sábado, no UFC 334, que ainda detém o domínio da modalidade contra um nome de grande apelo comercial e esportivo.\n\nUm post compartilhado por UFC Brasil (@ufc_brasil)\n\nSiga nossas redes sociais e fique ligado nas notícias do mundo da luta: X , Instagram , Facebook , Youtube e TikTok\n\nO jornalismo é o antídoto a falsos especialistas, vídeos fabricados e algoritmos que premiam quem grita mais. O custo é real: tempo, método, equipe, tecnologia e advogados para suportar pressão e retaliação.\n\nMais do que uma compra, sua assinatura é assumir uma posição: garante os recursos para uma produção editorial independente.\n\n### Veja também\n\n### Deixe seu comentário\n\nO autor da mensagem, e não o UOL, é o responsável pelo comentário. Leia as Regras de Uso do UOL.\n\nTransmissão ao vivo de Chapecoense x Vasco pelo Brasileirão: veja onde assistir\n\nSérie B ainda terá playoffs: simule os jogos e defina os promovidos\n\nMirassol empata com Atlético-MG em jogo adiantado; times do Z4 agradecem\n\nIsrael reforça alerta para possível ataque surpresa dos EUA ao Irã\n\nIdosos com 70 anos ou mais são 4 de cada 10 novos eleitores no 2º turno",
    "cover_url": "http://www.bing.com/th?id=ONUT.pZsibHiul6gMWwZArxT_jA&pid=News",
    "category": "Desportos",
    "published": true,
    "published_at": "2026-11-14T09:56:00.000Z",
    "created_at": "2026-11-14T09:56:00.000Z",
    "author": "BeSoccer",
    "source_name": "BeSoccer",
    "source_url": "https://www.uol.com.br/esporte/ultimas-noticias/ag-fight/2026/11/14/ufc-retorno-de-amanda-nunes-pode-concluir-dominio-inedito-do-brasil-no-mma-feminino.htm",
    "read_time": 5,
    "is_syndicated": true,
    "featured": false
  },
  {
    "id": "syn-get-focused-on-london-how-iran-s-agents-attacked-european-targets-5327363884",
    "title": "‘Get Focused on London’: How Iran’s Agents Attacked European Targets",
    "slug": "get-focused-on-london-how-iran-s-agents-attacked-european-targets-5327363884",
    "excerpt": "A wave of assaults in Britain and elsewhere in the spring sowed fear across Europe. Prosecutors shed new light on how Iran took aim at U.S. allies.",
    "content": "A wave of assaults in Britain and elsewhere in the spring sowed fear across Europe. Prosecutors shed new light on how Iran took aim at U.S. allies.\n\nAs the U.S.-Israel war in Iran raged earlier this year, a man linked to Iranian criminal networks perched in front of a computer, on a video call with a teenager in London. The man wanted to make sure the teen, who was moments away from setting fire to a synagogue, carried out his plans.\n\n“Light it up like a Christmas tree,” the man, an Iraqi named Mohammad Ali al-Hassani, urged the 17-year-old, according to U.S. prosecutors. The teen climbed over a wall and tossed a bomb through a broken window. “J’s mic is muted,” read the text on Mr. al-Hassani’s computer screen.\n\nThe synagogue arson in April was a small, violent part of Iran’s efforts to force an end to the bombing campaign that was pummeling the country, according to American investigators.\n\nThe attack was described in a federal indictment filed in New York this week. It revealed extensive new details about a wave of violence against Jewish institutions in Europe and U.S. targets, including a British air base used by American bombers. Prosecutors hold Iran’s agents responsible for the assaults.\n\nWithin days of the war starting, Mr. al-Hassani and at least two associates, including an operative for Iran’s powerful Islamic Revolutionary Guard Corps, began plotting the attacks in Europe, prosecutors said. The men talked about procuring drones and missiles from contacts in Iran. They pored over a map of London, with one saying they should “get focused” on targeting the British capital. Soon after, attacks hit temples and other Jewish sites in London.\n\nIn the fight against much stronger conventional forces, Iran has found ways to impose costs on its adversaries without inviting a full military response. One major aspect of Iran’s strategy is its embrace of small-time criminals to conduct low-cost assaults against vulnerable targets that are part of everyday life.\n\nWe are having trouble retrieving the article content.\n\nPlease enable JavaScript in your browser settings.\n\nThank you for your patience while we verify access. If you are in Reader mode please exit and log into your Times account, or subscribe for all of The Times.\n\nThank you for your patience while we verify access.\n\n### Related Content",
    "cover_url": "https://static01.nyt.com/images/2026/11/14/multimedia/14uk-iran-attacks-02-fqwm/14uk-iran-attacks-02-fqwm-facebookJumbo.jpg",
    "category": "Geopolítica",
    "published": true,
    "published_at": "2026-11-14T19:23:20.000Z",
    "created_at": "2026-11-14T19:23:20.000Z",
    "author": "The New York Times",
    "source_name": "The New York Times",
    "source_url": "https://www.nytimes.com/2026/11/13/world/europe/iran-attacks-europe-britain.html",
    "read_time": 2,
    "is_syndicated": true,
    "featured": false
  },
  {
    "id": "syn-anime-de-giant-ojo-sama-escala-rina-kawaguchi-como-a-voz-de-stella-5969235371",
    "title": "Anime de Giant Ojo-sama escala Rina Kawaguchi como a voz de Stella",
    "slug": "anime-de-giant-ojo-sama-escala-rina-kawaguchi-como-a-voz-de-stella-5969235371",
    "excerpt": "Foi revelada uma nova adição ao elenco de voz do anime de Giant Ojo-sama , em antecipação à sua estreia, prevista para janeiro de 2027. Rina Kawaguchi (Nico Wakatsuki em WITCH WATCH ) fará a voz de Stella, cuja arte v...",
    "content": "Foi revelada uma nova adição ao elenco de voz do anime de Giant Ojo-sama , em antecipação à sua estreia, prevista para janeiro de 2027. Rina Kawaguchi (Nico Wakatsuki em WITCH WATCH ) fará a voz de Stella, cuja arte você pôde conferir acima, além do vídeo a seguir: As contas oficiais revelaram ainda que Risa Imayanagi fará a voz de Madoka Ito . Hiroshi Ikehata ( WITCH WATCH estúdio Tatsunoko Production, com Katsuya Oshima na assistência de direção. Yu Sato ( Please Put Them On, Takamine-san ) cuida da coordenação de enredo, enquanto Hajime Mitsuda ( Food for the Soul ) fica a cargo do design de personagens. O mangá Giant Ojo-sama , escrito e ilustrado por Nikumura Q, começou como um web comic no site Jump Rookie, da Shueisha, e foi posteriormente publicado pela editora Shogakukan no Sunday Webry. Até o momento, 13 volumes encadernados foram lançados no Japão. A história acompanha uma jovem herdeira da maior empresa de máquinas de venda automática do mundo, que ganha, de presente, uma cidade inteira para desenvolver no seu quarto aniversário. Ela toma uma fórmula mágica para crescer até o tamanho de um arranha-céu a fim de combater invasores, mas acaba causando problemas acidentalmente no processo. Fontes: Conta oficial de Giant Ojo-sama no X (antigo Twitter) , Anime News Network",
    "cover_url": "https://a.storyblok.com/f/178900/960x540/483b439b3b/giant-ojosama-stella.jpeg",
    "category": "Animes",
    "published": true,
    "published_at": "2026-11-14T21:15:00.000Z",
    "created_at": "2026-11-14T21:15:00.000Z",
    "author": "Crunchyroll Notícias",
    "source_name": "Crunchyroll Notícias",
    "source_url": "https://crunchyroll.com/pt-br/news/latest/2026/11/14/anime-giant-ojosama-elenco-rina-kawaguchi-como-stella",
    "read_time": 1,
    "is_syndicated": true,
    "featured": false
  },
  {
    "id": "syn-manga-seraph-of-the-end-e-finalizado-e-encerra-sua-publicacao-em-4-de-dezem-22832473401",
    "title": "Mangá Seraph of the End é finalizado e encerra sua publicação em 4 de dezembro",
    "slug": "manga-seraph-of-the-end-e-finalizado-e-encerra-sua-publicacao-em-4-de-dezem-22832473401",
    "excerpt": "A edição de dezembro da revista Jump SQ. , publicada pela Shueisha , anunciou oficialmente que o mangá Seraph of the End: Vampire Reign (Owari no Seraph), criado por Takaya Kagami , Yamato Yamamoto e Daisuke Furuya , che...",
    "content": "A edição de dezembro da revista Jump SQ. , publicada pela Shueisha , anunciou oficialmente que o mangá Seraph of the End: Vampire Reign (Owari no Seraph), criado por Takaya Kagami , Yamato Yamamoto e Daisuke Furuya , chegará ao fim na próxima edição, programada para o dia 4 de dezembro.\n\nA obra já havia antecipado anteriormente que sua conclusão aconteceria com o lançamento do trigésimo sétimo volume compilado. Os autores iniciaram a publicação da série nas páginas da revista Jump SQ. no ano de 2022. No mercado norte-americano, a editora Viz Media é a responsável pela distribuição digital e impressa da obra.\n\n### Sinopse:\n\nA trama se passa em um mundo onde um vírus desconhecido dizimou toda a população humana, com exceção de crianças que acabaram escravizadas por vampiros. O enredo acompanha Yuuichirou Hyakuya, um jovem humano que sonha em se tornar forte o suficiente para eliminar todos os vampiros.\n\n### Mais sobre:\n\nO mangá também inspirou uma adaptação em série de televisão em anime com doze episódios, lançada em abril de 2015, além de uma segunda temporada com doze episódios intitulada Seraph of the End: Battle in Nagoya , estreada em outubro do mesmo ano. A obra gerou ainda uma série de romances derivados escrita por Takaya Kagami e ilustrada por Yo Asami , publicada em inglês pela Kodansha USA Publishing , expandindo ainda mais o universo original criado para os leitores.",
    "cover_url": "https://www.animeunited.com.br/oomtumtu/2026/11/image-16.png",
    "category": "Mangás",
    "published": true,
    "published_at": "2026-11-03T13:28:00.000Z",
    "created_at": "2026-11-03T13:28:00.000Z",
    "author": "Anime News Network",
    "source_name": "Anime News Network",
    "source_url": "https://www.animeunited.com.br/noticias/manga-seraph-of-the-end-e-finalizado-e-encerra-sua-publicacao-em-4-de-dezembro/",
    "read_time": 1,
    "is_syndicated": true,
    "featured": false
  },
  {
    "id": "syn-como-adicionar-instrucoes-para-que-o-gemini-lembre-de-informacoes-em-qualqu-8556580554",
    "title": "Como adicionar instruções para que o Gemini lembre de informações em qualquer conversa?",
    "slug": "como-adicionar-instrucoes-para-que-o-gemini-lembre-de-informacoes-em-qualqu-8556580554",
    "excerpt": "É possível definir instruções personalizadas no Gemini para que a inteligência artificial siga suas preferências durante as conversas. Assim, você não precisa repetir as mesmas orientações sempre que abrir um novo chat.",
    "content": "É possível definir instruções personalizadas no Gemini para que a inteligência artificial siga suas preferências durante as conversas. Assim, você não precisa repetir as mesmas orientações sempre que abrir um novo chat.\n\nTambém dá para pedir ao Gemini que guarde algumas informações durante uma conversa. Com esses dados, a IA pode adaptar o tom e o formato das respostas , como fazer resumos curtos ou usar listas, além de lembrar fatos sobre hábitos e datas importantes. As informações salvas ficam disponíveis em novas conversas no aplicativo para Android e iOS, na versão web, no Chrome e em smartwatches compatíveis.\n\nComo adicionar instruções personalizadas no Gemini?\n\nAs instruções personalizadas servem para definir previamente como a inteligência artificial deve se comportar ou formatar as respostas. Veja como adicionar suas preferências:\n\nNo painel lateral, entre em “Configurações” (ícone de engrenagem);\n\nVá em “Inteligência Personalizada”;\n\nClique em “Instruções para o Gemini”;\n\nDigite a orientação que deseja salvar;\n\nComo editar ou excluir as instruções personalizadas no Gemini?\n\nAs instruções salvas podem ser alteradas ou removidas quando necessário. Para gerenciar essas orientações siga os passos abaixo:\n\nAcesse “Configurações” (ícone de engrenagem);\n\nVá em “Inteligência Personalizada”;\n\nEntre em “Instruções para o Gemini”;\n\nProcure as instruções que você quer ver, editar ou excluir;\n\nToque em “Mais” (ícone de três pontos);\n\nQual é a diferença entre instruções e memória no Gemini?\n\nAs instruções personalizadas servem para dizer ao Gemini como você quer que a IA responda. Já a memória é usada para guardar informações sobre você que podem ser consideradas em conversas futuras.\n\nPor exemplo, uma instrução pode pedir que o Gemini sempre responda em português e use listas quando apresentar várias opções. Já a memória pode guardar que você prefere respostas curtas ou que trabalha com determinado tipo de conteúdo.\n\nSe você gostou do conteúdo, talvez também se interesse por conferir “ Guia completo para substituir os seus Gems pelas novas Skills do Gemini ”.",
    "cover_url": "https://tl.ctcdn.com.br/KjYxfq9ZwNJUzGi10239oTXZ0Uw=/0x0/filters:format(webp):quality(85)/bdc06da0-0714-4caa-bbad-1e18aad4f7e7.jpeg",
    "category": "Tecnologias",
    "published": true,
    "published_at": "2026-11-14T23:00:00.000Z",
    "created_at": "2026-11-14T23:00:00.000Z",
    "author": "Canaltech",
    "source_name": "Canaltech",
    "source_url": "https://canaltech.com.br/inteligencia-artificial/como-adicionar-instrucoes-para-que-o-gemini-lembre-de-informacoes-em-qualquer-conversa/",
    "read_time": 2,
    "is_syndicated": true,
    "featured": false
  },
  {
    "id": "syn-e-t-phone-chanel-how-fashion-s-labels-got-personal-again-10371932906",
    "title": "E.T., Phone Chanel! How Fashion’s Labels Got Personal Again",
    "slug": "e-t-phone-chanel-how-fashion-s-labels-got-personal-again-10371932906",
    "excerpt": "E.T., phone home! Or if you’re Steven Spielberg g etting honored at the Museum of Modern Art’s annual Film Benefit , phone Chanel. On Thursday night, Spielberg offered a peek inside his bespoke Chanel tuxedo jacket, cour...",
    "content": "E.T., phone home! Or if you’re Steven Spielberg g etting honored at the Museum of Modern Art’s annual Film Benefit , phone Chanel. On Thursday night, Spielberg offered a peek inside his bespoke Chanel tuxedo jacket, courtesy of Matthieu Blazy. Beneath the classic black tailoring was a galaxy-speckled lining, an embroidered playing card featuring E.T. on his bicycle, and a little patch reading “E.T. PHONE HOME.” Spielberg proudly flashed the details for all to see. Now that’s a statement lining.\n\nIt’s just the latest in a series of delightfully personal flourishes coming out of Blazy’s Chanel atelier. For his spring 2026 haute couture debut , the designer asked models to contribute something meaningful to their looks: a love letter, a birth date, a lucky symbol, an intimate thought. These were translated into exquisite embroideries by the house’s Lesage atelier, stitched into garments or onto little silk notes tucked inside delicate, translucent Chanel handbags. Model Stephanie Cavalli reportedly chose a letter from her husband. The sentiment was just as beautiful as the craftsmanship.\n\nBlazy has continued to play with this notion of garments carrying memories. In the lead up to the spring 2027 Chanel show, models Bhavitha Mandava and Awar Odhiang discovered embroidered playing cards tucked inside jacket linings, depicting Gabrielle Chanel wearing looks the models themselves had previously walked down the runway in.\n\nCouture clients can reportedly request this kind of personalization, too. And at October’s Academy Museum Gala, meanwhile, Hailey Bieber ’s custom bubblegum-pink Chanel gown concealed another tender, handwritten detail: a note that featured the name of her son, Jack, accompanied by an arrow-pierced heart.\n\nLeaving something deeply personal inside a garment is hardly new. Alexander McQueen famously made a rebellious art of it. While working for Romeo Gigli in Milan, the young designer reportedly left a rather less romantic message inside a jacket after being made to repeatedly redo its construction: “Fuck you, Romeo.” There are also the legendary tales—though disputed—of profanities hidden inside suits made for Prince Charles during his Savile Row apprenticeship. More poignantly, McQueen stitched locks of his own hair into the linings of his 1992 graduate collection, Jack the Ripper Stalks His Victims , and later used them in his clothing labels.\n\nBut the clothing label itself has also long been a place for designers to express a little personality. Spend an afternoon rifling through the racks of any good thrift store and you’ll find a rag-tag assortment of embroidered crests, elaborate cursive fonts, wacky illustrations, and wonderfully earnest mottos from long-forgotten local dressmakers to grand houses. Even Burberry’s evolving labels offer a miniature history of the brand: from the old Burberrys name and the original Equestrian Knight emblem, introduced in 1901, to the pared-back modernist identity of recent years, and Daniel Lee’s revival of the knight in 2023. A label can do so, so much more than simply announce who made something.\n\nA new generation of designers is rediscovering the joy of these small, characterful details. Take Sofia Testino , whose young eponymous label imagines a whole world of professions and their fictional, more off-kilter wardrobes. It’s been a joy to watch her brand identity develop through old-fashioned woven labels, with evolving colorful geometric borders, winged crests, and the tagline: “Style, Quality, Value.” There are shoeboxes bearing a cartoonish evolution from ape to woman in high heels. Testino has spoken about collecting vintage labels and old flight-attendant uniforms, mixing and matching elements to create her own distinctive identity. “I feel like labels and packaging and all these little details have been lost,” she recently told Welcome.jpeg . Where so many brands have settled for homogenizing, identity-flattening minimalism, she’s building an entire universe (and its fleet of well-dressed staff) down to the last stitch.\n\nElsewhere, London-based knitwear designer Oscar Ouyang has made a sweet little lamb a recurring signature, appearing on his whimsical knits and charming clothing labels. For her recent collaboration with Frankies Bikinis, Devon Lee Carlson joined forces with longtime friend Francesca Aiello to revisit treasured vintage pieces from their own wardrobes, complete with sweet pink co-branded labels decorated with a little dog and flowers. And in another corner of London, Sinéad O’Dwyer has been rethinking her brand identity as her customers grow up alongside her, with her newly imagined logo finding its way into the stitching on the back of her jeans.\n\nFor London-based demi-couture designer Ellie Misner , a clothing label can also serve as a little love letter commemorating a particularly special moment. Misner, who works on bespoke pieces, has taken to hand-embroidering her clients’s names above her own handwritten logo. For Raye, who fulfilled a long-held dream by headlining Reading and Leeds Festival, Misner stitched her name in burgundy thread into a crimson corseted gown. For Tems, whose Glastonbury main-stage performance marked another career milestone, it was a cobalt-blue signature sewn onto the inside of a midnight-blue ensemble. “My labels are my handwriting,” Misner tells Vogue , explaining that she handwrites the wearer’s name and then embroiders it, often choosing a thread that corresponds with the garment. For a performance that means so much to both artist and designer, it’s a way of marking the occasion, making the piece feel like more than just another custom commission. Misner likens the gesture to “a love note to their garment.” She adds: “I wish I could do it for everyone,” but the time-consuming process makes each one all the more special. These aren’t all bespoke gestures in the couture sense, but they share a certain spirit that insists on individuality, as well as the pleasure of details that one can keep entirely to oneself.\n\nThere’s something especially resonant about all this in an age of AI-generated images, algorithmically dictated taste, and increasingly impersonal consumption. Fashion, more and more, seems keen to remind us that there are actual people, with skills and emotions behind the clothes. At Chanel’s fall 2026 couture show , artist Joël Blanc painted the runway live in watercolors, capturing the spectacle in real time. And look at the new holiday campaigns from Prada, Dior, and Bottega Veneta, where all three have embraced the nostalgic charms of illustration and animation. Prada, in particular, has made a point of celebrating hand-drawn artistry, enlisting veteran animator John Pomeroy to conjure a whimsical winter wonderland populated by snow lynxes and mischievous mice.\n\nIn a world where almost anything can be reproduced, the idiosyncratic and intimate feel increasingly precious. The most meaningful thing about what we wear might be something nobody else can see.",
    "cover_url": "https://assets.vogue.com/photos/6af8d1e7f3830138ecc77bec/16:9/w_1280,c_limit/SnapInsta.to_901924449_18655914754043699_7619360128406125069_n.jpg",
    "category": "Moda",
    "published": true,
    "published_at": "2026-11-14T21:39:45.000Z",
    "created_at": "2026-11-14T21:39:45.000Z",
    "author": "Vogue",
    "source_name": "Vogue",
    "source_url": "https://www.vogue.com/article/how-fashions-labels-got-personal-again",
    "read_time": 6,
    "is_syndicated": true,
    "featured": false
  },
  {
    "id": "syn-breath-of-the-wild-reverteu-queda-de-popularidade-de-zelda-dizem-ex-funcion-13387772640",
    "title": "Breath of the Wild reverteu queda de popularidade de Zelda, dizem ex-funcionários da Nintendo",
    "slug": "breath-of-the-wild-reverteu-queda-de-popularidade-de-zelda-dizem-ex-funcion-13387772640",
    "excerpt": "Antes de Breath of the Wild transformar Zelda em um fenômeno de vendas, a franquia estava perdendo fãs e enfrentava dificuldades para conquistar novos jogadores.",
    "content": "Antes de Breath of the Wild transformar Zelda em um fenômeno de vendas, a franquia estava perdendo fãs e enfrentava dificuldades para conquistar novos jogadores.\n\nA revelação veio de Kit Ellis e Krysta Yang, ex-funcionários da Nintendo of America, que afirmam que a situação havia se tornado tão preocupante que a empresa precisava mudar radicalmente a fórmula da série.\n\nDurante um episódio do podcast Kit & Krysta, Ellis relembrou sua participação em pesquisas com consumidores realizadas pela Nintendo antes do lançamento de Breath of the Wild, em 2017.\n\nSegundo ele, os resultados mostravam uma queda constante no interesse pela franquia, enquanto os jogos tradicionais de Zelda já não conseguiam atrair um público novo.\n\n“Lembro que participava dos grupos de pesquisa e era um momento realmente sombrio. A base de fãs estava diminuindo, não estávamos atraindo novos jogadores e o interesse do público ficava cada vez menor. Precisávamos fazer alguma coisa radical” , contou Ellis.\n\nBreath of the Wild mudou o rumo da franquia de Zelda e impulsionou as vendas\n\nKrysta Yang também relembrou a situação delicada da franquia, afirmando que os jogos de Zelda já não vendiam como a Nintendo esperava .\n\nA dupla contestou a ideia de que a empresa abandonou a estrutura tradicional da série justamente quando ela estava no auge da popularidade, algo que Ellis chamou de revisionismo histórico.\n\nOs números ajudam a entender essa preocupação: Twilight Princess acumulou cerca de 10,1 milhões de cópias em suas diferentes versões, enquanto Skyward Sword chegou a 7,82 milhões e A Link Between Worlds vendeu 4,26 milhões.\n\nJá Breath of the Wild ultrapassou 35 milhões de unidades , tornando-se o maior sucesso comercial da franquia, seguido por Tears of the Kingdom, com mais de 22 milhões.\n\nO assunto voltou à tona com o sucesso de Ocarina of Time Remake no Nintendo Switch 2, que vendeu 5,2 milhões de cópias em apenas quatro dias.\n\nPara Ellis e Yang, a boa recepção do remake mostra que ainda existe espaço para aventuras no estilo clássico de Zelda, mas não apaga os problemas que levaram a Nintendo a apostar no mundo aberto de Breath of the Wild.",
    "cover_url": "https://www.gamevicio.com/wp-content/uploads/2026/11/breath-of-the-wild-reverteu-queda-zelda-3.webp",
    "category": "Games",
    "published": true,
    "published_at": "2026-11-14T17:51:02.000Z",
    "created_at": "2026-11-14T17:51:02.000Z",
    "author": "GameVicio",
    "source_name": "GameVicio",
    "source_url": "https://www.gamevicio.com/noticias/2026/11/breath-of-the-wild-reverteu-queda-zelda/",
    "read_time": 2,
    "is_syndicated": true,
    "featured": false
  },
  {
    "id": "syn-hannah-fry-feels-unbelievably-lucky-after-cervical-cancer-treatment-9126603626",
    "title": "Hannah Fry feels 'unbelievably lucky' after cervical cancer treatment",
    "slug": "hannah-fry-feels-unbelievably-lucky-after-cervical-cancer-treatment-9126603626",
    "excerpt": "The mathmetician was diagnosed with cervical cancer six years ago",
    "content": "The mathmetician was diagnosed with cervical cancer six years ago\n\nProf Hannah Fry has described feeling \"unbelievably lucky\" after being treated for cervical cancer.\n\nThe mathematician and BBC presenter, who recently took part in the second season of the Celebrity Traitors, said cancerous cells were discovered after she attended a cervical screening in 2020.\n\nShe underwent a hysterectomy, describing the experience to BBC Radio 4's Desert Island Discs as \"horrific\".\n\n\"As awful as that was, it had a full stop at the end of the sentence,\" the 42-year-old added. \"I had my five-year clear the other day. I feel so unbelievably lucky.\"\n\nIn Sunday's episode, Fry told show host Lauren Laverne that she had delayed a cervical screening examination for months in 2020. After she attended one, the results \"didn't come back for a few weeks,\" she said.\n\n\"Then I got a call from my GP telling me they needed me to come back and do another test, and they did a biopsy.\n\n\"I was trying hard not to panic but when they found it was in the lymphatic system… that was when it really started to come down.\"\n\nThe broadcaster said she was told that her chances of survival depended on the cancerous cells not having spread to her lymph nodes, although it was not clear \"how bad it was at that point\".\n\n\"It's all about, basically, how far into your lymphatic system has it got. If it had not got into any lymph nodes, then the odds were in my favour and I had a really good chance of survival,\" she said.\n\nFry explained that this meant \"if it was in one it would drop to a 60% chance of survival and two – the odds would go against me and it would be a 40% chance\".\n\nFry attended a Cancer Research UK reception hosted by the King and Queen at St James's Palace in June\n\nWhile in isolation in hospital following her hysterectomy, Fry said a surgeon told her that four of her lymph nodes had appeared enlarged.\n\nShe added: \"I was in this hospital bed on my own and no-one could come and visit me for over a week, with nothing but the sheer terrifying drop of the end of my existence in front of me – it was horrific.\"\n\nFry described not being able to \"think back to happy things that... have already happened because it is sad\", while also not being able to \"look forward to things you are hopeful about because it doesn't feel like it is there\".\n\nShe also said she asked her then husband to set up FaceTime in the corner of a room so she could watch their two young daughters play while she was in hospital.\n\n\"I didn't want them to see me, it was too much,\" she said.\n\nBut she added: \"Going through something like that I don't think I would swap it.\n\n\"I think it was honestly such a gift to have that experience when you're 36 and then come out the other side of it.\"\n\nThe presenter grew up in a working-class family and studied mathematics at University of College London.\n\nShe later completed a PhD in fluid dynamics, and last year became Cambridge University's first professor of the public understanding of mathematics.\n\nFry has fronted BBC science series including The Future with Hannah Fry and The Secret Genius of Modern Life.\n\nShe was banished in the latest series of The Celebrity Traitors after being exposed as a traitor.\n\n### Related topics\n\n### More on this story\n\nYoung women now have 'close to zero' risk of cervical cancer death after HPV jab\n\nHPV home-testing kits available for women in England who have missed cervical screening\n\nPeriod blood test could offer less invasive alternative to cervical screening",
    "cover_url": "https://ichef.bbci.co.uk/ace/branded_news/1200/cpsprodpb/36ca/live/a5a42090-e06d-11f1-99e6-531f8829f5a3.jpg",
    "category": "Cultura",
    "published": true,
    "published_at": "2026-11-15T00:09:29.000Z",
    "created_at": "2026-11-15T00:09:29.000Z",
    "author": "BBC Culture",
    "source_name": "BBC Culture",
    "source_url": "https://www.bbc.co.uk/news/articles/cw62p4n3n1xyo?at_medium=RSS&at_campaign=rss",
    "read_time": 4,
    "is_syndicated": true,
    "featured": false
  },
  {
    "id": "syn-retorno-do-vilao-imbativel-forca-solo-leveling-a-reinventar-seu-proprio-api-6996358968",
    "title": "Retorno do vilão imbatível força Solo Leveling a reinventar seu próprio ápice",
    "slug": "retorno-do-vilao-imbativel-forca-solo-leveling-a-reinventar-seu-proprio-api-6996358968",
    "excerpt": "O capítulo inaugural de “Solo Leveling: Ragnarok” não perde tempo: logo na primeira virada, ressurge o Dragão da Destruição, a criatura que cinco anos antes fincou as garras no peito de Sung Jinwoo e encerrou a Guerra do...",
    "content": "O capítulo inaugural de “Solo Leveling: Ragnarok” não perde tempo: logo na primeira virada, ressurge o Dragão da Destruição, a criatura que cinco anos antes fincou as garras no peito de Sung Jinwoo e encerrou a Guerra dos Monarcas. Fãs que esperavam uma aventura pós-apoteótica descobriram, já nas primeiras páginas, que o fantasma da derrota segue vivo – e mais relevante do que nunca para o futuro da franquia.\n\nA manobra narrativa parece simples, mas tem efeito duplo. Ao recuperar o único adversário que o Caçador das Sombras não conseguiu derrubar, a sequência reposiciona a série num momento em que o mercado de webtoons sofre pressão de novos títulos de revanche, como mostram dados recentes sobre o “filão mais quente dos webtoons”. A aposta: transformar um déjà-vu em gatilho de curiosidade e, de quebra, testar se o universo criado por Chugong consegue sobreviver sem depender do protagonista morto.\n\n### Vilão reciclado vira medidor de risco criativo\n\nPara além do fan-service, o retorno do Dragão é um indicador pragmático de risco. Segundo editores sul-coreanos ouvidos pelo setor, webtoons que trocam de protagonista perdem, em média, 28% do público ativo nos três primeiros meses. Reciclar o oponente mais temido reduz esse impacto: o leitor reingressa em terreno conhecido, mas com a tensão redobrada pela ausência de Jinwoo.\n\nA jogada também dialoga com o apetite pela vingança que domina o gênero. Desde 2021, séries centradas em revanche saltaram 124% em leituras globais, conforme levantamento que discutimos no artigo sobre por que os manhwas de revanche viraram o filão mais quente. “Ragnarok” inverte a lógica: o herdeiro de Jinwoo não busca vingança; ele precisa impedir que o passado do pai se repita. É o mesmo trope, mas com culpa no lugar de raiva – nuance suficiente para diferenciar o título num mar de clones.\n\n### Herança de Jinwoo é boia ou âncora para a sequência\n\nO sucessor escolhido, Sung Suho, carrega dois fardos: provar que a família ainda é relevante na trama e segurar a bilheteria de um IP que migra para animação este ano. Suho estreia bem: ganha o primeiro encontro com o Dragão, mas descobre que a fera não reapareceu para lutar, e sim para avisar sobre um conflito maior. Esse recurso expõe a série a um dilema clássico – entregar resposta rápida ou esticar o mistério para a temporada.\n\nInternamente, a editora coreana D&C Media defende o caminho longo: capítulos mais curtos, cliffhangers agressivos e venda de pacotes premium para leitura antecipada. É o modelo que transformou “Solo Leveling” em fenômeno, mas que, hoje, enfrenta a concorrência de plataformas como a japonesa Piccoma e a chinesa Kuaikan. Se “Ragnarok” não acelerar, pode ver o público migrar para novidades de scroll infinito que oferecem resolução semanal.\n\n### Mercado já precifica a sobrevida do dragão\n\nGrupos de investimento em mídia virtual projetam que a volta do vilão deve adicionar 12% ao tráfego do webtoon original nos primeiros 60 dias, número suficiente para sustentar a cadeia de produtos licenciados – do figure à linha de uísques colecionáveis inflada por sucessos como Trigun . O termômetro mais sensível, porém, está no Ocidente: a Yen Press planeja imprimir tiragens 20% maiores nos EUA caso o hype se confirme até o capítulo 15.\n\nPara o anime que a A-1 Pictures entrega em abril, a presença do Dragão exerce outro papel: ator de continuidade. Mesmo quem não leu o manhwa original reconhecerá o arco “Monarchs War”, que foi condensado na primeira temporada animada. A criatura serve como ponto de convergência entre usuários de diferentes mídias e pavimenta um pipeline de produtos, de games mobile a kits metálicos em edição premium, numa rota já explorada por franquias como Evangelion.\n\nSe a estratégia vingará ou não, ainda é cedo para cravar. Mas a escolha de reencenar a ferida que matou o herói deixa claro que “Solo Leveling” prefere arriscar memória afetiva a se aventurar em território completamente virgem. E, para um mercado que hoje mede engajamento em segundos de rolagem, nada é mais valioso do que oferecer ao leitor um motivo visceral para pressionar “próximo capítulo”.",
    "cover_url": "https://radiogeekbr.com.br/wp-content/uploads/2026/11/radiogeekbr-1794677286.webp",
    "category": "Webtoons",
    "published": true,
    "published_at": "2026-11-14T09:27:00.000Z",
    "created_at": "2026-11-14T09:27:00.000Z",
    "author": "WEBTOON",
    "source_name": "WEBTOON",
    "source_url": "https://radiogeekbr.com.br/solo-leveling-retorno-inimigo-imparavel/",
    "read_time": 4,
    "is_syndicated": true,
    "featured": false
  }
];
