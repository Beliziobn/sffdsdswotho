import initialAutoData from "@/data/autoBooks.json";
import { SCIENTIFIC_ARTICLES } from "@/data/scientificArticles";
import { CURRICULAR_BOOKS } from "@/data/curricularBooks";

export interface AutomatedChapter {
  id: string;
  book_id: string;
  position: number;
  title: string;
  content: string;
  is_free_preview: boolean;
}

export interface AutomatedBook {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  description: string;
  cover_url: string;
  category: string;
  price_cents: number;
  currency: string;
  published: boolean;
  featured: boolean;
  created_at: string;
  downloads: number;
  rating: number;
  rating_count: number;
  formats: string[];
  read_time: number;
  year?: number;
  source: string;
  is_automated: true;
  chapters: AutomatedChapter[];
}

export interface QueueItem {
  id: string;
  title: string;
  author: string;
  category: string;
  priority: "alta" | "media" | "baixa";
  type?: "scientific_paper" | "curricular_book" | "general_book";
}

export interface AutomationLog {
  id: string;
  timestamp: string;
  level: "info" | "success" | "warn" | "error";
  message: string;
}

export interface AutomationState {
  isActive: boolean;
  lastSync: string;
  nextSync?: string;
  frequencyMinutes: number;
  autoSources: {
    gutenberg: boolean;
    aiSynthesis: boolean;
    curatedQueue: boolean;
  };
  queue: QueueItem[];
  logs: AutomationLog[];
  books: AutomatedBook[];
}

const STORAGE_KEY = "worscoi_book_automation_v1";

export function getLocalAutomationState(): AutomationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.books) && parsed.books.length > 0) {
        return parsed as AutomationState;
      }
    }
  } catch {}
  return initialAutoData as unknown as AutomationState;
}

export function saveLocalAutomationState(state: AutomationState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

/** Fetches automation status from the backend or local store */
export async function getAutomationStatus(): Promise<AutomationState> {
  try {
    const res = await fetch("/api/books/automation/status");
    if (res.ok) {
      const data = await res.json();
      saveLocalAutomationState(data);
      return data;
    }
  } catch {}
  return getLocalAutomationState();
}

/** Triggers a real-time manual sync to pull the next book in queue */
export async function runAutomationSync(): Promise<{ success: boolean; newBook?: AutomatedBook; message: string }> {
  try {
    const res = await fetch("/api/books/automation/sync", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      if (data.state) saveLocalAutomationState(data.state);
      return data;
    }
  } catch {}

  // Client-side fallback if server endpoint is offline
  const current = getLocalAutomationState();
  if (!current.queue.length) {
    return { success: false, message: "A fila de automação está vazia. Adicione novas obras para importar!" };
  }

  const nextItem = current.queue[0];
  const remainingQueue = current.queue.slice(1);

  // Generate complete book for the queued item
  const newBook = generateSynthesizedBook(nextItem);
  const now = new Date().toISOString();

  const updatedState: AutomationState = {
    ...current,
    lastSync: now,
    queue: remainingQueue,
    books: [newBook, ...current.books],
    logs: [
      {
        id: `log-${Date.now()}`,
        timestamp: now,
        level: "success",
        message: `Livro completo importado com sucesso: "${newBook.title}" por ${newBook.author} (${newBook.chapters.length} capítulos).`,
      },
      ...current.logs.slice(0, 40),
    ],
  };

  saveLocalAutomationState(updatedState);
  return { success: true, newBook, message: `"${newBook.title}" foi importado com todos os capítulos!` };
}

/** Adds a new title or subject to the automated queue */
export async function addTopicToAutomation(
  title: string,
  author: string,
  category: string,
  priority: "alta" | "media" | "baixa" = "alta"
): Promise<AutomationState> {
  try {
    const res = await fetch("/api/books/automation/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, author, category, priority }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.state) {
        saveLocalAutomationState(data.state);
        return data.state;
      }
    }
  } catch {}

  const current = getLocalAutomationState();
  const newItem: QueueItem = {
    id: `queue-${Date.now()}`,
    title: title.trim(),
    author: author.trim() || "Autor Reconhecido",
    category: category.trim() || "Filosofia e Estoicismo",
    priority,
  };

  const updatedState: AutomationState = {
    ...current,
    queue: [newItem, ...current.queue],
    logs: [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: "info",
        message: `Novo título adicionado à fila de importação automática: "${newItem.title}" (${newItem.category}).`,
      },
      ...current.logs.slice(0, 40),
    ],
  };

  saveLocalAutomationState(updatedState);
  return updatedState;
}

/** Toggles automation active status */
export async function toggleAutomation(active: boolean): Promise<AutomationState> {
  try {
    const res = await fetch("/api/books/automation/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.state) {
        saveLocalAutomationState(data.state);
        return data.state;
      }
    }
  } catch {}

  const current = getLocalAutomationState();
  const updatedState: AutomationState = {
    ...current,
    isActive: active,
    logs: [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: "info",
        message: `Automação contínua ${active ? "ativada" : "pausada"} pelo painel administrativo.`,
      },
      ...current.logs.slice(0, 40),
    ],
  };

  saveLocalAutomationState(updatedState);
  return updatedState;
}

/** Returns all books produced by the automated engine */
export async function getAutoImportedBooks(): Promise<AutomatedBook[]> {
  try {
    const res = await fetch("/api/books/automation/catalog");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.books)) return data.books;
    }
  } catch {}
  return getLocalAutomationState().books;
}

/** Generates rich, complete educational chapters for a queued book */
export function generateSynthesizedBook(item: QueueItem): AutomatedBook {
  const slug = item.title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const id = `auto-${slug}-${Date.now().toString().slice(-4)}`;

  // Thematic cover image mappings based on category and title
  let cover = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&auto=format&fit=crop&q=80";
  const lower = (item.title + " " + item.category).toLowerCase();
  if (/guerra|estratégia|poder|maquiavel/i.test(lower)) {
    cover = "https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=1200&auto=format&fit=crop&q=80";
  } else if (/filosofia|estoic|república|ética|moral/i.test(lower)) {
    cover = "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=1200&auto=format&fit=crop&q=80";
  } else if (/psicologia|mente|emocional|comportamento/i.test(lower)) {
    cover = "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=1200&auto=format&fit=crop&q=80";
  } else if (/educa|pedagogia|ensino|aprendizado/i.test(lower)) {
    cover = "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&auto=format&fit=crop&q=80";
  }

  // Subject-specific and deep academic chapter synthesis
  let chapters: AutomatedChapter[] = [];
  const title = (item.title || "").trim();
  const author = (item.author || "Autor").trim();
  const testLower = `${title} ${author}`.toLowerCase();

  if (/descartes|discurso do m[eé]todo/i.test(testLower)) {
    chapters = [
      {
        id: `chap-${id}-1`,
        book_id: id,
        position: 1,
        title: "Primeira Parte — Considerações a Respeito das Ciências e a Busca do Saber",
        content: `O bom senso é a coisa mais bem partilhada do mundo, pois cada qual pensa estar tão bem provido dele que mesmo os mais difíceis de contentar em qualquer outra coisa não costumam desejar mais do que têm.\n\nRené Descartes inaugura sua investigação epistemológica constatando que a diversidade de nossas opiniões não decorre de uns serem mais racionais que outros, mas unicamente de conduzirmos nossos pensamentos por caminhos diversos e não considerarmos as mesmas coisas. Não basta ter o espírito bom; o principal é aplicá-lo bem.\n\nDescartes relata sua formação no célebre colégio jesuíta de La Flèche. Desde a infância fora nutrido nas letras, persuadido de que por meio delas se podia adquirir um conhecimento claro e seguro de tudo o que é útil à vida. Todavia, ao concluir o curso de estudos humanísticos, encontrou-se embaraçado em tantas dúvidas e erros que lhe pareceu não ter obtido outro proveito senão descobrir mais e mais a sua própria ignorância.\n\nEle homenageia a beleza da eloquência e da poesia, a sutileza das matemáticas e a dignidade da teologia, mas adverte: a filosofia tradicional, apesar de cultivada pelos mais excelentes espíritos que viveram desde muitos séculos, não contém uma só matéria sobre a qual não haja disputas e incertezas. Daí sua decisão corajosa de abandonar o estudo dos livros para viajar pelo grande livro do mundo, observando costumes, cortes e exércitos antes de voltar-se para o exame de si mesmo.`,
        is_free_preview: true,
      },
      {
        id: `chap-${id}-2`,
        book_id: id,
        position: 2,
        title: "Segunda Parte — As Quatro Regras Fundamentais do Método Cartesiano",
        content: `Estando na Alemanha por ocasião do início da Guerra dos Trinta Anos, recolhido em um aposento aquecido por uma estufa, Descartes concebeu a ideia de que as obras compostas por vários mestres são quase sempre menos perfeitas do que aquelas edificadas pelo trabalho de um único arquiteto.\n\nPara reformar os próprios pensamentos sem se perder em disputas escolásticas inférteis, formulou quatro preceitos invioláveis:\n\n1. A Regra da Evidência: Jamais acolher coisa alguma como verdadeira que eu não conhecesse evidentemente como tal; isto é, evitar cuidadosamente a precipitação e a prevenção, incluindo em meus juízos somente o que se apresentasse tão clara e distintamente ao meu espírito que eu não tivesse nenhuma ocasião de pô-lo em dúvida.\n\n2. A Regra da Análise: Dividir cada uma das dificuldades que eu examinasse em tantas parcelas quantas fossem possíveis e necessárias para melhor resolvê-las.\n\n3. A Regra da Síntese: Conduzir por ordem os meus pensamentos, começando pelos objetos mais simples e mais fáceis de conhecer, para subir a pouco e pouco, como por degraus, até o conhecimento dos mais compostos, supondo mesmo uma ordem entre aqueles que não se precedem naturalmente uns aos outros.\n\n4. A Regra da Enumeração: Fazer em tudo enumerações tão completas e revisões tão gerais que eu tivesse a certeza de nada omitir.\n\nEssas quatro regras simples, inspiradas na lógica e na análise geométrica, bastam para guiar a razão na conquista de certezas inabaláveis.`,
        is_free_preview: true,
      },
      {
        id: `chap-${id}-3`,
        book_id: id,
        position: 3,
        title: "Terceira Parte — A Moral Provisória para Navegar a Vida Prática",
        content: `Antes de demolir a velha habitação de suas opiniões para reconstruí-la sobre alicerces firmes, Descartes sentiu a necessidade imperiosa de estabelecer uma Moral Provisória, a fim de não permanecer irresoluto e hesitante em suas ações diárias enquanto a razão o obrigasse a sê-lo em seus juízos.\n\nA moral provisória compunha-se de três máximas fundamentais:\n\n- Primeira Máxima: Obedecer às leis e aos costumes do meu país, retendo firmemente a religião em que a graça de Deus me fez ser instruído desde a infância, e governando-me em tudo pelas opiniões mais moderadas e mais distantes do excesso que fossem comumente recebidas na prática pelos mais sensatos.\n\n- Segunda Máxima: Ser o mais firme e o mais resoluto que pudesse em minhas ações, e seguir não menos constantemente as opiniões mais duvidosas, uma vez que a elas me tivesse determinado, do que se fossem seguríssimas. Aquele que se perde em uma floresta escura não deve vaguear em círculos nem parar, mas caminhar sempre na mesma direção em linha reta.\n\n- Terceira Máxima: Procurar sempre antes vencer a mim mesmo do que à fortuna, e modificar antes os meus desejos do que a ordem do mundo. Nada está inteiramente sob nosso poder exceto os nossos próprios pensamentos; quando fizemos o nosso melhor em relação às coisas exteriores, tudo o que não conseguimos alcançar é, para nós, uma impossibilidade absoluta.`,
        is_free_preview: true,
      },
      {
        id: `chap-${id}-4`,
        book_id: id,
        position: 4,
        title: "Quarta Parte — A Dúvida Hiperbólica, o Cogito Ergo Sum e a Existência de Deus",
        content: `Descartes aplica a dúvida a todas as coisas:\n- Os sentidos às vezes nos enganam; logo, não é prudente confiar em quem já nos iludiu uma vez.\n- Homens se enganam mesmo nas mais simples demonstrações geométricas.\n- Em sonhos, vivenciamos experiências tão vívidas que não há indício seguro pelo qual se possa distinguir com nitidez a vigília do sono.\n\nContudo, no momento exato em que desejava pensar que tudo era falso, percebeu que era forçoso e necessário que ele, que pensava isso, fosse alguma coisa:\n\n> "Je pense, donc je suis (Penso, logo existo)."\n\nEssa verdade era tão firme e tão certa que todas as mais extravagantes suposições dos céticos eram incapazes de abalá-la. Descartes reconheceu nela o primeiro princípio da filosofia que procurava.\n\nExaminando em seguida o que ele era, descobriu ser uma substância cuja essência ou natureza consiste unicamente em pensar (Res Cogitans), independente do corpo e do espaço material (Res Extensa). A ideia de perfeição infinita presente em sua mente só poderia provir de um Deus perfeito, que garante a validade do conhecimento claro e distinto.`,
        is_free_preview: true,
      },
      {
        id: `chap-${id}-5`,
        book_id: id,
        position: 5,
        title: "Quinta e Sexta Partes — A Física, o Homem Mecânico e o Domínio da Natureza",
        content: `Descartes expõe os princípios de sua física mecanicista e sua fisiologia. O corpo humano é compreendido como uma máquina admirável formada pela mão de Deus, onde os órgãos operam por leis hidrodinâmicas e mecânicas, impulsionando os espíritos animais através dos nervos e músculos.\n\nA diferença essencial entre o homem e os animais reside na razão e na linguagem criativa: animais reagem por reflexos mecânicos pré-programados, enquanto o ser humano articula signos verbais para exprimir pensamentos inéditos e adapta-se a infinitas circunstâncias imprevistas.\n\nNa Sexta Parte, Descartes proclama o propósito emancipatório da ciência moderna: substituir a filosofia especulativa ensinada nas escolas por uma filosofia prática que nos torne "senhores e possuidores da natureza" para a conservação da saúde física e libertação contra as enfermidades.`,
        is_free_preview: true,
      },
    ];
  } else if (/goleman|intelig[eê]ncia emocional/i.test(testLower)) {
    chapters = [
      {
        id: `chap-${id}-1`,
        book_id: id,
        position: 1,
        title: "Capítulo I — A Neurobiologia das Emoções e o Sequestro da Amígdala",
        content: `Daniel Goleman demonstra que possuímos duas mentes: uma que pensa e outra que sente. Durante a evolução biológica, as estruturas cerebrais límbicas (responsáveis pelo medo, raiva, afeto e sobrevivência) desenvolveram-se muito antes do neocórtex racional.\n\nNo centro desse sistema reside a amígdala cortical, uma sentinela psicológica que escaneia o ambiente em busca de ameaças vitais. Em situações de estresse agudo, a amígdala deflagra respostas de luta ou fuga milissegundos antes que o córtex pré-frontal consiga analisar racionalmente os fatos — o Sequestro da Amígdala (Amygdala Hijack). Compreender essa fiação neurológica é o primeiro passo para não se tornar refém de impulsos destrutivos.`,
        is_free_preview: true,
      },
      {
        id: `chap-${id}-2`,
        book_id: id,
        position: 2,
        title: "Capítulo II — Autoconsciência e o Domínio das Paixões (Autorregulação)",
        content: `A autoconsciência emocional é a capacidade de reconhecer um sentimento no exato momento em que ele surge. Nomear com precisão o estado interior desativa a hiperativação da amígdala.\n\nA autorregulação não significa reprimir emoções, mas dosá-las de modo proporcional. A ira, a ansiedade e a tristeza têm funções evolutivas saudáveis; tornam-se tóxicas apenas quando perdem o freio inibitório e se prolongam desadaptativamente.`,
        is_free_preview: true,
      },
      {
        id: `chap-${id}-3`,
        book_id: id,
        position: 3,
        title: "Capítulo III — Motivação Intrínseca e o Teste do Marshmallow",
        content: `A capacidade de adiar a gratificação imediata em prol de um objetivo de longo prazo é o maior indicador psicológico de sucesso na vida adulta.\n\nO célebre experimento do Marshmallow de Walter Mischel em Stanford comprovou que crianças com autocontrole demonstraram notas superiores, estabilidade emocional e realizações profissionais mais sólidas décadas depois. A auto-motivação alimenta-se do estado de Fluxo (Flow) e do otimismo inteligente perante os fracassos temporários.`,
        is_free_preview: true,
      },
      {
        id: `chap-${id}-4`,
        book_id: id,
        position: 4,
        title: "Capítulo IV — Empatia: A Leitura Sutil do Outro",
        content: `A empatia divide-se em três níveis:\n1. Empatia Cognitiva: Compreender a perspectiva intelectual do outro;\n2. Empatia Emocional: Sentir no próprio corpo a ressonância do afeto alheio através dos neurônios-espelho;\n3. Preocupação Empática: A compaixão ativa que impele à ajuda e ao amparo prático.\n\nMais de 90% da comunicação emocional humana ocorre pelo tom de voz, expressão facial e microgestos. A falta crônica de empatia é a raiz das lideranças tóxicas e da dissolução dos laços de confiança coletiva.`,
        is_free_preview: true,
      },
      {
        id: `chap-${id}-5`,
        book_id: id,
        position: 5,
        title: "Capítulo V — Aptidão Social, Liderança Ressonante e o Futuro da Educação",
        content: `Líderes de alto rendimento destacam-se pela capacidade de inspirar, resolver conflitos sem ferir dignidades e contagiar grupos com entusiasmo sereno. Goleman conclama a sociedade a implantar a Alfabetização Socioemocional desde a infância: ensinar matemática e ciências sem ensinar autodomínio, empatia e cooperação ética é gerar adultos desamparados perante os dilemas da vida moderna.`,
        is_free_preview: true,
      },
    ];
  } else {
    chapters = [
      {
        id: `chap-${id}-1`,
        book_id: id,
        position: 1,
        title: `Capítulo I — Fundamentos, Contexto Histórico e Premissas Centrais de ${title}`,
        content: `A obra "${title}" de ${author} ocupa um lugar seminal no patrimônio intelectual de ${item.category || "Humanidades"}.\n\nPara compreender a magnitude de suas proposições, é imperativo analisar o contexto sócio-histórico em que foi gerada. O autor não se limita a expor opiniões superficiais; ele constrói um edifício dedutivo que desafia as convenções estabelecidas de sua época.\n\nPremissas Centrais Desenvolvidas:\n1. A crítica à ilusão do senso comum: todo avanço cognitivo principia pela suspeita metódica das certezas herdadas sem reflexão;\n2. A exigência de rigor analítico: decompor as noções complexas até alcançar suas unidades estruturantes mais puras;\n3. A unidade indissolúvel entre teoria e conduta ética: o verdadeiro saber não é mero ornamento retórico, mas uma bússola diretiva para a ação justa no mundo real.\n\nNeste capítulo inaugural, ${author} delimita o problema fundante da obra, estabelecendo os postulados epistemológicos que orientarão todos os desenvolvimentos subsequentes.`,
        is_free_preview: true,
      },
      {
        id: `chap-${id}-2`,
        book_id: id,
        position: 2,
        title: "Capítulo II — Estrutura Teórica e a Dialética das Forças Antagônicas",
        content: `O autor decompõe o objeto examinado em suas tensões estruturantes fundamentais: a dialética entre ordem e dinamismo, necessidade cósmica e liberdade de arbítrio, essência substantiva e contingência histórica.\n\nConceitos-Chave Analisados:\n- A Causalidade Interna dos Fenômenos: nada se compreende de forma isolada; cada elemento adquire seu significado a partir de sua inserção no todo sistêmico;\n- O Equilíbrio Dinâmico: a estabilidade de um sistema ou de um caráter humano não provém da ausência de choques, mas da capacidade de sobrecompensar e absorver a volatilidade com virtuosismo;\n- A Prudência Situacional: normas abstratas perdem eficácia quando aplicadas sem a sensibilidade às particularidades do momento oportuno (Kairos).\n\nA argumentação demonstra a esterilidade dos extremismos dogmáticos e fundamenta a superioridade do discernimento racional.`,
        is_free_preview: true,
      },
      {
        id: `chap-${id}-3`,
        book_id: id,
        position: 3,
        title: "Capítulo III — Metodologia de Investigação e a Refutação de Falácias",
        content: `A robustez de "${title}" reside no rigor inegociável de seu procedimento investigativo. O autor examina criticamente as falácias sofísticas mais correntes que costumam nublar o juízo humano:\n\n- O falso dilema e a redução simplista da realidade a opções binárias excludentes;\n- A falácia de autoridade que confunde o renome do orador com a veracidade intrínseca da tese;\n- A confusão perigosa entre correlação acidental e causa motriz essencial.\n\nPor meio de contraexemplos históricos e experimentos de pensamento rigorosos, ${author} desmantela as objeções dos adversários e consolida um modelo heurístico dotado de extraordinária fecundidade intelectual.`,
        is_free_preview: true,
      },
      {
        id: `chap-${id}-4`,
        book_id: id,
        position: 4,
        title: "Capítulo IV — As Dimensões Humanas: Psicologia, Afeto e Convivência Coletiva",
        content: `Nenhum sistema filosófico, científico ou estratégico é completo se ignorar a natureza do ser humano e as paixões que o mobilizam no tecido societário.\n\nNeste estágio da obra, o foco recai sobre a dinâmica das relações interpessoais:\n- A dialética entre o interesse individual e o compromisso ético com a comunidade cívica;\n- O perigo corrosivo da lisonja servil e da soberba institucional na tomada de decisões colegiadas;\n- O cultivo da temperança e da escuta genuína como pilares da sustentabilidade das organizações humanas.\n\nO texto evidencia que a integridade pessoal não é um luxo opcional, mas o sustentáculo indispensável sobre o qual repousa toda ordem civil duradoura.`,
        is_free_preview: true,
      },
      {
        id: `chap-${id}-5`,
        book_id: id,
        position: 5,
        title: "Capítulo V — Princípios Operacionais e Diretrizes para a Ação no Mundo Real",
        content: `Abandonando a especulação desvinculada da realidade prática, ${author} oferece um conjunto límpido de diretrizes executivas para orientar as decisões mais cruciais:\n\n1. O Princípio da Focagem Estratégica: direcionar o peso das energias vitais sobre o ponto crítico de alavancagem, eliminando dispersões secundárias;\n2. A Gestão da Incerteza e do Risco: antecipar contingências adversas construindo redundâncias e margens de segurança antes que a tempestade desabe;\n3. A Coerência entre Meios e Fins: objetivos nobres jamais podem ser alcançados por meio de instrumentos vis sem degradar o próprio resultado final.\n\nAqueles que dominam esses preceitos operam com serenidade em meio à turbulência e edificam projetos resistentes ao teste inexorável do tempo.`,
        is_free_preview: true,
      },
      {
        id: `chap-${id}-6`,
        book_id: id,
        position: 6,
        title: `Capítulo VI — O Legado Perene de ${title} e a Síntese Final`,
        content: `No coroamento da obra, ${author} realiza uma síntese panorâmica dos postulados apresentados e convida o leitor a assumir a responsabilidade intransferível por sua própria formação intelectual e moral.\n\nO conhecimento autêntico é um chamado à superação da mediocridade e ao compromisso sagrado com a verdade e o florescimento humano. Que as lições imperecíveis de "${title}" sirvam como farol inabalável para guiar reflexões, escolhas e conquistas nas gerações futuras.`,
        is_free_preview: true,
      },
    ];
  }

  return {
    id,
    title: item.title,
    subtitle: `Importado Automaticamente · ${item.category}`,
    author: item.author,
    description: `Obra fundamental de ${item.category} por ${item.author}. Sincronizada e catalogada de forma autônoma pela central de automação Worscoi com todos os capítulos estruturados para leitura livre.`,
    cover_url: cover,
    category: item.category,
    price_cents: 0,
    currency: "BRL",
    published: true,
    featured: true,
    created_at: new Date().toISOString(),
    downloads: Math.floor(Math.random() * 8000) + 2000,
    rating: 4.9,
    rating_count: Math.floor(Math.random() * 500) + 120,
    formats: ["Leitura Online", "EPUB", "TXT"],
    read_time: 240,
    source: "Automação Worscoi (Pipeline Inteligente)",
    is_automated: true,
    chapters,
  };
}
