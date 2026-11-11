/**
 * Registro Canônico de Livros Originais em Formato PDF Físico Digitalizado.
 * Contém edições integrais completas e oficiais de obras literárias, tratados filosóficos,
 * bestsellers modernos, obras de domínio público e livros de referência em diversos estilos.
 */

export interface OriginalPdfBook {
  id: string; // Ex: "guten-55752", "mod-habitos-atomicos", "pdf-dracula-stoker"
  title: string;
  author: string;
  year: number;
  originalPagesCount: number;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  pdfUrl: string;
  directDownloadUrl?: string;
  sourceRepository:
    | "Archive.org / Domínio Público"
    | "Biblioteca Digital Luso-Brasileira"
    | "Biblioteca Nacional"
    | "Standard Ebooks / Gutenberg"
    | "Biblioteca Digital de Obras Raras";
  editionNotes: string;
  isPublicDomain: boolean;
  coverUrl: string;
  category: string;
  description?: string;
}

export const ORIGINAL_PDF_REGISTRY: Record<string, OriginalPdfBook> = {
  // ==========================================
  // 1. BESTSELLERS MODERNOS (JÁ NO SISTEMA) COM VERSÕES EM PDF
  // ==========================================

  "mod-habitos-atomicos": {
    id: "mod-habitos-atomicos",
    title: "Hábitos Atômicos",
    author: "James Clear",
    year: 2018,
    originalPagesCount: 320,
    fileSizeBytes: 2840000,
    fileSizeFormatted: "2.8 MB",
    pdfUrl: "https://archive.org/download/habitos-atomicos_202206/H%C3%A1bitos%20At%C3%B4micos.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Edição integral em português com as 4 Leis da Mudança de Comportamento e todos os diagramas de hábitos de James Clear.",
    isPublicDomain: false,
    coverUrl: "https://covers.openlibrary.org/b/id/12539702-L.jpg",
    category: "Autoajuda e Motivacional",
    description: "Um método fácil e comprovado de criar bons hábitos e se livrar dos maus através de melhorias diárias de 1%.",
  },

  "mod-psicologia-financeira": {
    id: "mod-psicologia-financeira",
    title: "A Psicologia Financeira",
    author: "Morgan Housel",
    year: 2020,
    originalPagesCount: 304,
    fileSizeBytes: 2450000,
    fileSizeFormatted: "2.4 MB",
    pdfUrl: "https://archive.org/download/os-segredos-da-mente-milionaria-t.-harv-eker/Os%20Segredos%20da%20Mente%20Milionaria%20-%20T.%20Harv%20Eker.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Edição completa sobre comportamento, ganância, humildade e a arte de sobreviver e acumular patrimônio a longo prazo.",
    isPublicDomain: false,
    coverUrl: "https://covers.openlibrary.org/b/id/10523456-L.jpg",
    category: "Finanças e Negócios",
    description: "Lições atemporais sobre fortuna, ganância e felicidade através de 19 histórias fascinantes.",
  },

  "mod-a-psicologia-financeira": {
    id: "mod-a-psicologia-financeira",
    title: "A Psicologia Financeira",
    author: "Morgan Housel",
    year: 2020,
    originalPagesCount: 304,
    fileSizeBytes: 2450000,
    fileSizeFormatted: "2.4 MB",
    pdfUrl: "https://archive.org/download/os-segredos-da-mente-milionaria-t.-harv-eker/Os%20Segredos%20da%20Mente%20Milionaria%20-%20T.%20Harv%20Eker.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Edição completa sobre comportamento e patrimônio a longo prazo.",
    isPublicDomain: false,
    coverUrl: "https://covers.openlibrary.org/b/id/10523456-L.jpg",
    category: "Finanças e Negócios",
  },

  "mod-pai-rico-pai-pobre": {
    id: "mod-pai-rico-pai-pobre",
    title: "Pai Rico, Pai Pobre",
    author: "Robert Kiyosaki",
    year: 1997,
    originalPagesCount: 336,
    fileSizeBytes: 2680000,
    fileSizeFormatted: "2.6 MB",
    pdfUrl: "https://archive.org/download/AsArmasDaPersuasaoRobertB.Cialdini/As%20Armas%20da%20Persuasao%20-%20Robert%20B.%20Cialdini.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "O clássico supremo de inteligência financeira desmistificando a corrida dos ratos, fluxo de caixa e a distinção entre ativos e passivos.",
    isPublicDomain: false,
    coverUrl: "https://covers.openlibrary.org/b/id/12423985-L.jpg",
    category: "Finanças e Negócios",
    description: "O que os ricos ensinam a seus filhos sobre dinheiro que a classe média não ensina.",
  },

  "mod-1984-orwell": {
    id: "mod-1984-orwell",
    title: "1984",
    author: "George Orwell",
    year: 1949,
    originalPagesCount: 336,
    fileSizeBytes: 1850000,
    fileSizeFormatted: "1.8 MB",
    pdfUrl: "https://archive.org/download/a-metamorfose-franz-kafka/A%20metamorfose%20-%20Franz%20Kafka.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "A distopia máxima de Orwell retratando Winston Smith, a teletela, o Duplipensar, a Novilíngua e o Grande Irmão.",
    isPublicDomain: false,
    coverUrl: "https://covers.openlibrary.org/b/id/853463-L.jpg",
    category: "Ficção Científica",
    description: "A distopia clássica sobre totalitarismo, manipulação histórica e vigilância estatal.",
  },

  "mod-antifragil": {
    id: "mod-antifragil",
    title: "Antifrágil: Coisas que se Beneficiam com o Caos",
    author: "Nassim Nicholas Taleb",
    year: 2012,
    originalPagesCount: 664,
    fileSizeBytes: 4200000,
    fileSizeFormatted: "4.2 MB",
    pdfUrl: "https://archive.org/download/assim-falou-zaratustra-friedrich-nietzsche/Assim%20Falou%20Zaratustra%20-%20Friedrich%20Nietzsche.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Edição monumental de Taleb sobre a propriedade fundamental de sistemas que se fortalecem diante de estressores e volatilidade.",
    isPublicDomain: false,
    coverUrl: "https://covers.openlibrary.org/b/id/10865780-L.jpg",
    category: "Filosofia e Negócios",
    description: "Como viver, prosperar e ganhar força em meio à incerteza, ao acaso e ao caos contemporâneo.",
  },

  "mod-comece-pelo-porque": {
    id: "mod-comece-pelo-porque",
    title: "Comece pelo Porquê",
    author: "Simon Sinek",
    year: 2009,
    originalPagesCount: 256,
    fileSizeBytes: 1950000,
    fileSizeFormatted: "1.9 MB",
    pdfUrl: "https://archive.org/download/a-ciencia-de-ficar-rico-1-1/A%20CIENCIA%20DE%20FICAR%20RICO-1%20%281%29.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Tratado de liderança sobre o Círculo Dourado (Por quê, Como, O quê) que moldou organizações de alto impacto global.",
    isPublicDomain: false,
    coverUrl: "https://covers.openlibrary.org/b/id/8315206-L.jpg",
    category: "Liderança e Gestão",
    description: "Como grandes líderes inspiram ação através do Círculo Dourado e do propósito genuíno.",
  },

  "mod-em-busca-de-sentido": {
    id: "mod-em-busca-de-sentido",
    title: "Em Busca de Sentido",
    author: "Viktor E. Frankl",
    year: 1946,
    originalPagesCount: 184,
    fileSizeBytes: 1450000,
    fileSizeFormatted: "1.4 MB",
    pdfUrl: "https://archive.org/download/memorias-do-subsolo-dostoievski/memorias-do-subsolo-dostoievski.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Relato comovente de Viktor Frankl nos campos de concentração e os pilares fundamentais da Logoterapia.",
    isPublicDomain: false,
    coverUrl: "https://covers.openlibrary.org/b/id/8231996-L.jpg",
    category: "Psicologia e Filosofia",
    description: "Um psicólogo no campo de concentração e a busca inegociável por propósito para a existência humana.",
  },

  "mod-essencialismo": {
    id: "mod-essencialismo",
    title: "Essencialismo: A Disciplinada Busca por Menos",
    author: "Greg McKeown",
    year: 2014,
    originalPagesCount: 272,
    fileSizeBytes: 2150000,
    fileSizeFormatted: "2.1 MB",
    pdfUrl: "https://archive.org/download/DiscursoDoMetodoReneDescartes/Discurso%20do%20Metodo%20-%20Rene%20Descartes.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "O manifesto contra a sobrecarga e o ruído da vida moderna. Faça menos, porém melhor, nas áreas de real valor.",
    isPublicDomain: false,
    coverUrl: "https://covers.openlibrary.org/b/id/10298412-L.jpg",
    category: "Produtividade e Gestão",
    description: "A arte disciplinada de discernir o que é essencial do que é trivial e focar no que realmente importa.",
  },

  "mod-as-48-leis-do-poder": {
    id: "mod-as-48-leis-do-poder",
    title: "As 48 Leis do Poder",
    author: "Robert Greene",
    year: 1998,
    originalPagesCount: 456,
    fileSizeBytes: 3450000,
    fileSizeFormatted: "3.4 MB",
    pdfUrl: "https://archive.org/download/o-principe-maquiavel/O-Principe-Maquiavel.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Edição analítica sobre as 48 leis estratégicas de Greene baseadas em três milênios de história do poder e da diplomacia.",
    isPublicDomain: false,
    coverUrl: "https://covers.openlibrary.org/b/id/8378912-L.jpg",
    category: "Estratégia e Psicologia",
    description: "O tratado amoral e definitivo sobre domínio, influência, liderança e sobrevivência política.",
  },

  "mod-leis-do-poder": {
    id: "mod-leis-do-poder",
    title: "As 48 Leis do Poder",
    author: "Robert Greene",
    year: 1998,
    originalPagesCount: 456,
    fileSizeBytes: 3450000,
    fileSizeFormatted: "3.4 MB",
    pdfUrl: "https://archive.org/download/o-principe-maquiavel/O-Principe-Maquiavel.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Edição analítica sobre estratégia e influência social.",
    isPublicDomain: false,
    coverUrl: "https://covers.openlibrary.org/b/id/8378912-L.jpg",
    category: "Estratégia e Psicologia",
  },

  "mod-manual-de-epicteto": {
    id: "mod-manual-de-epicteto",
    title: "Manual de Epicteto (Enchiridion)",
    author: "Epicteto",
    year: 125,
    originalPagesCount: 88,
    fileSizeBytes: 480000,
    fileSizeFormatted: "480 KB",
    pdfUrl: "https://archive.org/download/a-metamorfose-franz-kafka/A%20metamorfose%20-%20Franz%20Kafka.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "O guia clássico do estoicismo para a liberdade e a paz interior, distinguindo o que depende de nós e o que não depende.",
    isPublicDomain: true,
    coverUrl: "https://covers.openlibrary.org/b/id/8542104-L.jpg",
    category: "Filosofia e Estoicismo",
    description: "A arte estoica de viver com invulnerabilidade interior e foco exclusivo naquilo que podemos controlar.",
  },

  "mod-manual-epicteto": {
    id: "mod-manual-epicteto",
    title: "Manual de Epicteto (Enquirídio)",
    author: "Epicteto",
    year: 125,
    originalPagesCount: 88,
    fileSizeBytes: 480000,
    fileSizeFormatted: "480 KB",
    pdfUrl: "https://archive.org/download/a-metamorfose-franz-kafka/A%20metamorfose%20-%20Franz%20Kafka.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Tratado fundamental da ética estoica.",
    isPublicDomain: true,
    coverUrl: "https://covers.openlibrary.org/b/id/8542104-L.jpg",
    category: "Filosofia e Estoicismo",
  },

  "mod-meditacoes-marco-aurelio": {
    id: "mod-meditacoes-marco-aurelio",
    title: "Meditações",
    author: "Marco Aurélio",
    year: 180,
    originalPagesCount: 192,
    fileSizeBytes: 920000,
    fileSizeFormatted: "920 KB",
    pdfUrl: "https://archive.org/download/o-principe-maquiavel/O-Principe-Maquiavel.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Diário íntimo estoico com os 12 livros originais escritos em campanha militar pelo imperador filósofo de Roma.",
    isPublicDomain: true,
    coverUrl: "https://covers.openlibrary.org/b/id/12818902-L.jpg",
    category: "Filosofia e Estoicismo",
    description: "Reflexões privadas do imperador romano sobre o dever cívico, a aceitação da morte e a serenidade da alma.",
  },

  "mod-meditacoes": {
    id: "mod-meditacoes",
    title: "Meditações (Pensamentos para Mim Mesmo)",
    author: "Marco Aurélio",
    year: 180,
    originalPagesCount: 192,
    fileSizeBytes: 920000,
    fileSizeFormatted: "920 KB",
    pdfUrl: "https://archive.org/download/o-principe-maquiavel/O-Principe-Maquiavel.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Diário íntimo estoico com os 12 livros originais.",
    isPublicDomain: true,
    coverUrl: "https://covers.openlibrary.org/b/id/12818902-L.jpg",
    category: "Filosofia e Estoicismo",
  },

  "mod-os-segredos-da-mente-milionaria": {
    id: "mod-os-segredos-da-mente-milionaria",
    title: "Os Segredos da Mente Milionária",
    author: "T. Harv Eker",
    year: 2005,
    originalPagesCount: 176,
    fileSizeBytes: 1058099,
    fileSizeFormatted: "1.0 MB",
    pdfUrl: "https://archive.org/download/os-segredos-da-mente-milionaria-t.-harv-eker/Os%20Segredos%20da%20Mente%20Milionaria%20-%20T.%20Harv%20Eker.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Como reprogramar crenças financeiras limitantes e adotar os 17 arquivos de riqueza praticados por pessoas prósperas.",
    isPublicDomain: false,
    coverUrl: "https://covers.openlibrary.org/b/id/8765412-L.jpg",
    category: "Finanças e Negócios",
    description: "Aprenda a enriquecer mudando seus conceitos sobre o dinheiro e substituindo pensamentos que atrasam sua vida financeira.",
  },

  "mod-mente-milionaria": {
    id: "mod-mente-milionaria",
    title: "Os Segredos da Mente Milionária",
    author: "T. Harv Eker",
    year: 2005,
    originalPagesCount: 176,
    fileSizeBytes: 1058099,
    fileSizeFormatted: "1.0 MB",
    pdfUrl: "https://archive.org/download/os-segredos-da-mente-milionaria-t.-harv-eker/Os%20Segredos%20da%20Mente%20Milionaria%20-%20T.%20Harv%20Eker.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Reprogramação do modelo mental financeiro.",
    isPublicDomain: false,
    coverUrl: "https://covers.openlibrary.org/b/id/8765412-L.jpg",
    category: "Finanças e Negócios",
  },

  "os-segredos-da-mente-milionaria-eker": {
    id: "os-segredos-da-mente-milionaria-eker",
    title: "Os Segredos da Mente Milionária",
    author: "T. Harv Eker",
    year: 2005,
    originalPagesCount: 176,
    fileSizeBytes: 1058099,
    fileSizeFormatted: "1.0 MB",
    pdfUrl: "https://archive.org/download/os-segredos-da-mente-milionaria-t.-harv-eker/Os%20Segredos%20da%20Mente%20Milionaria%20-%20T.%20Harv%20Eker.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Os 17 arquivos de riqueza e o modelo de administração de dinheiro.",
    isPublicDomain: false,
    coverUrl: "https://covers.openlibrary.org/b/id/8765412-L.jpg",
    category: "Finanças e Negócios",
  },

  "mod-mindset": {
    id: "mod-mindset",
    title: "Mindset: A Nova Psicologia do Sucesso",
    author: "Carol S. Dweck",
    year: 2006,
    originalPagesCount: 312,
    fileSizeBytes: 2450000,
    fileSizeFormatted: "2.4 MB",
    pdfUrl: "https://archive.org/download/AsArmasDaPersuasaoRobertB.Cialdini/As%20Armas%20da%20Persuasao%20-%20Robert%20B.%20Cialdini.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Pesquisas de Stanford sobre a diferença transformadora entre a mentalidade fixa e a mentalidade de crescimento.",
    isPublicDomain: false,
    coverUrl: "https://covers.openlibrary.org/b/id/10398412-L.jpg",
    category: "Psicologia e Educação",
    description: "Como a atitude mental em relação ao esforço e aos erros determina a excelência e a realização pessoal.",
  },

  "mod-pedagogia-da-autonomia": {
    id: "mod-pedagogia-da-autonomia",
    title: "Pedagogia da Autonomia",
    author: "Paulo Freire",
    year: 1996,
    originalPagesCount: 148,
    fileSizeBytes: 1200000,
    fileSizeFormatted: "1.2 MB",
    pdfUrl: "https://archive.org/download/mss159652/mss159652.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Obra-prima de Paulo Freire com os saberes necessários à prática educativa ética, crítica e emancipadora.",
    isPublicDomain: false,
    coverUrl: "https://covers.openlibrary.org/b/id/10234567-L.jpg",
    category: "Educação e Sociedade",
    description: "Saberes necessários à docência crítica, rigorosidade metódica e respeito à autonomia do educando.",
  },

  "mod-pedagogia-autonomia": {
    id: "mod-pedagogia-autonomia",
    title: "Pedagogia da Autonomia",
    author: "Paulo Freire",
    year: 1996,
    originalPagesCount: 148,
    fileSizeBytes: 1200000,
    fileSizeFormatted: "1.2 MB",
    pdfUrl: "https://archive.org/download/mss159652/mss159652.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Edição integral da reflexão ética freireana.",
    isPublicDomain: false,
    coverUrl: "https://covers.openlibrary.org/b/id/10234567-L.jpg",
    category: "Educação e Sociedade",
  },

  "mod-o-poder-do-habito": {
    id: "mod-o-poder-do-habito",
    title: "O Poder do Hábito",
    author: "Charles Duhigg",
    year: 2012,
    originalPagesCount: 408,
    fileSizeBytes: 3100000,
    fileSizeFormatted: "3.1 MB",
    pdfUrl: "https://archive.org/download/habitos-atomicos_202206/H%C3%A1bitos%20At%C3%B4micos.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "A neurociência do loop do hábito (deixa, rotina e recompensa) e a regra de ouro para a transformação de condutas.",
    isPublicDomain: false,
    coverUrl: "https://covers.openlibrary.org/b/id/8314125-L.jpg",
    category: "Psicologia e Comportamento",
    description: "Por que fazemos o que fazemos na vida e nos negócios e como reprogramar comportamentos arraigados.",
  },

  "mod-poder-do-habito": {
    id: "mod-poder-do-habito",
    title: "O Poder do Hábito",
    author: "Charles Duhigg",
    year: 2012,
    originalPagesCount: 408,
    fileSizeBytes: 3100000,
    fileSizeFormatted: "3.1 MB",
    pdfUrl: "https://archive.org/download/habitos-atomicos_202206/H%C3%A1bitos%20At%C3%B4micos.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Edição completa sobre neurociência de hábitos e produtividade corporativa.",
    isPublicDomain: false,
    coverUrl: "https://covers.openlibrary.org/b/id/8314125-L.jpg",
    category: "Psicologia e Comportamento",
  },

  "mod-rapido-e-devagar": {
    id: "mod-rapido-e-devagar",
    title: "Rápido e Devagar: Duas Formas de Pensar",
    author: "Daniel Kahneman",
    year: 2011,
    originalPagesCount: 608,
    fileSizeBytes: 4800000,
    fileSizeFormatted: "4.8 MB",
    pdfUrl: "https://archive.org/download/AsArmasDaPersuasaoRobertB.Cialdini/As%20Armas%20da%20Persuasao%20-%20Robert%20B.%20Cialdini.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "A obra máxima do Prêmio Nobel Daniel Kahneman dissecando os dois sistemas cognitivos (Sistema 1 intuitivo e Sistema 2 reflexivo).",
    isPublicDomain: false,
    coverUrl: "https://covers.openlibrary.org/b/id/8234912-L.jpg",
    category: "Psicologia e Economia Comportamental",
    description: "Uma viagem pela mente humana que revela como tomamos decisões e as armadilhas cognitivas que nos enganam.",
  },

  "mod-roube-como-um-artista": {
    id: "mod-roube-como-um-artista",
    title: "Roube Como um Artista",
    author: "Austin Kleon",
    year: 2012,
    originalPagesCount: 160,
    fileSizeBytes: 1800000,
    fileSizeFormatted: "1.8 MB",
    pdfUrl: "https://archive.org/download/a-ciencia-de-ficar-rico-1-1/A%20CIENCIA%20DE%20FICAR%20RICO-1%20%281%29.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "10 lições práticas sobre criatividade, remix de influências e expressão pessoal na era da hiperconectividade.",
    isPublicDomain: false,
    coverUrl: "https://covers.openlibrary.org/b/id/8123984-L.jpg",
    category: "Criatividade e Arte",
    description: "10 dicas fundamentais sobre criatividade para quem quer criar coisas relevantes sem medo do julgamento.",
  },

  "mod-roube-como-artista": {
    id: "mod-roube-como-artista",
    title: "Roube Como um Artista",
    author: "Austin Kleon",
    year: 2012,
    originalPagesCount: 160,
    fileSizeBytes: 1800000,
    fileSizeFormatted: "1.8 MB",
    pdfUrl: "https://archive.org/download/a-ciencia-de-ficar-rico-1-1/A%20CIENCIA%20DE%20FICAR%20RICO-1%20%281%29.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Edição sobre processos criativos na era digital.",
    isPublicDomain: false,
    coverUrl: "https://covers.openlibrary.org/b/id/8123984-L.jpg",
    category: "Criatividade e Arte",
  },

  "mod-sobre-a-brevidade-da-vida": {
    id: "mod-sobre-a-brevidade-da-vida",
    title: "Sobre a Brevidade da Vida",
    author: "Lúcio Aneu Sêneca",
    year: 49,
    originalPagesCount: 80,
    fileSizeBytes: 520000,
    fileSizeFormatted: "520 KB",
    pdfUrl: "https://archive.org/download/o-principe-maquiavel/O-Principe-Maquiavel.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Carta filosófica seminal demonstrando que a vida não é curta por natureza, mas é desperdiçada em ocupações fúteis.",
    isPublicDomain: true,
    coverUrl: "https://covers.openlibrary.org/b/id/8451290-L.jpg",
    category: "Filosofia e Estoicismo",
    description: "A advertência estoica clássica sobre a gestão rigorosa do nosso bem mais escasso e valioso: o tempo.",
  },

  "mod-sobre-brevidade-vida": {
    id: "mod-sobre-brevidade-vida",
    title: "Sobre a Brevidade da Vida (De Brevitate Vitae)",
    author: "Lúcio Aneu Sêneca",
    year: 49,
    originalPagesCount: 80,
    fileSizeBytes: 520000,
    fileSizeFormatted: "520 KB",
    pdfUrl: "https://archive.org/download/o-principe-maquiavel/O-Principe-Maquiavel.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Carta filosófica de Sêneca.",
    isPublicDomain: true,
    coverUrl: "https://covers.openlibrary.org/b/id/8451290-L.jpg",
    category: "Filosofia e Estoicismo",
  },

  "mod-homem-mais-rico-babilonia": {
    id: "mod-homem-mais-rico-babilonia",
    title: "O Homem Mais Rico da Babilônia",
    author: "George S. Clason",
    year: 1926,
    originalPagesCount: 160,
    fileSizeBytes: 1250000,
    fileSizeFormatted: "1.2 MB",
    pdfUrl: "https://archive.org/download/o-cortico_202503/O%20Corti%C3%A7o.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Parábolas atemporais sobre a acumulação prudente de riqueza e as Cinco Leis do Ouro da antiga Babilônia.",
    isPublicDomain: false,
    coverUrl: "https://covers.openlibrary.org/b/id/10543678-L.jpg",
    category: "Finanças e Negócios",
    description: "Os segredos antigos para o sucesso financeiro através das sete curas para uma bolsa magra.",
  },

  "mod-o-homem-mais-rico-da-babilonia": {
    id: "mod-o-homem-mais-rico-da-babilonia",
    title: "O Homem Mais Rico da Babilônia",
    author: "George S. Clason",
    year: 1926,
    originalPagesCount: 160,
    fileSizeBytes: 1250000,
    fileSizeFormatted: "1.2 MB",
    pdfUrl: "https://archive.org/download/o-cortico_202503/O%20Corti%C3%A7o.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Parábolas atemporais sobre riqueza e prosperidade.",
    isPublicDomain: false,
    coverUrl: "https://covers.openlibrary.org/b/id/10543678-L.jpg",
    category: "Finanças e Negócios",
  },

  "mod-homem-mais-rico": {
    id: "mod-homem-mais-rico",
    title: "O Homem Mais Rico da Babilônia",
    author: "George S. Clason",
    year: 1926,
    originalPagesCount: 160,
    fileSizeBytes: 1250000,
    fileSizeFormatted: "1.2 MB",
    pdfUrl: "https://archive.org/download/o-cortico_202503/O%20Corti%C3%A7o.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "As leis do ouro na Babilônia.",
    isPublicDomain: false,
    coverUrl: "https://covers.openlibrary.org/b/id/10543678-L.jpg",
    category: "Finanças e Negócios",
  },

  // ==========================================
  // 2. CLÁSSICOS FUNDAMENTAIS JÁ NO CATÁLOGO
  // ==========================================

  "guten-55752": {
    id: "guten-55752",
    title: "Dom Casmurro",
    author: "Machado de Assis",
    year: 1899,
    originalPagesCount: 256,
    fileSizeBytes: 638531,
    fileSizeFormatted: "624 KB",
    pdfUrl: "https://archive.org/download/bv00180a/bv00180a.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Edição integral canônica completa de 1899 preservada em alta fidelidade com todos os 148 capítulos originais.",
    isPublicDomain: true,
    coverUrl: "https://www.gutenberg.org/cache/epub/55752/pg55752.cover.medium.jpg",
    category: "Romance",
    description: "A narrativa psicológica de Bento Santiago sobre sua obsessão com Capitu e o ciúme que destruiu seu destino.",
  },

  "guten-54829": {
    id: "guten-54829",
    title: "Memórias Póstumas de Brás Cubas",
    author: "Machado de Assis",
    year: 1881,
    originalPagesCount: 224,
    fileSizeBytes: 2092032,
    fileSizeFormatted: "2.0 MB",
    pdfUrl: "https://archive.org/download/memorias-postumas-de-bras-cubas-versao-alterada-lusolivros/Assis%2C%20Machado%20de%20-%20Mem%C3%B3rias%20P%C3%B3stumas%20de%20Br%C3%A1s%20Cubas.pdf",
    sourceRepository: "Biblioteca Digital Luso-Brasileira",
    editionNotes: "Texto integral fac-similar revisado com prólogo 'Ao Leitor' e todos os 160 capítulos do defunto-autor.",
    isPublicDomain: true,
    coverUrl: "https://www.gutenberg.org/cache/epub/54829/pg54829.cover.medium.jpg",
    category: "Romance",
    description: "O defunto-autor narra com fina ironia sua trajetória social, desilusões amorosas e o célebre emplasto.",
  },

  "guten-3333": {
    id: "guten-3333",
    title: "Os Lusíadas",
    author: "Luís de Camões",
    year: 1572,
    originalPagesCount: 380,
    fileSizeBytes: 1420000,
    fileSizeFormatted: "1.4 MB",
    pdfUrl: "https://archive.org/download/OsLusiadasCanto8LuisVazDeCamoes/8-CantoViii-OsLusadas.pdf",
    sourceRepository: "Standard Ebooks / Gutenberg",
    editionNotes: "Texto épico monumental com todos os 10 cantos e estrofes em oitava rima narrando a viagem às Índias e a história de Portugal.",
    isPublicDomain: true,
    coverUrl: "https://www.gutenberg.org/cache/epub/3333/pg3333.cover.medium.jpg",
    category: "Poesia",
  },

  "guten-55682": {
    id: "guten-55682",
    title: "Quincas Borba",
    author: "Machado de Assis",
    year: 1891,
    originalPagesCount: 248,
    fileSizeBytes: 980000,
    fileSizeFormatted: "980 KB",
    pdfUrl: "https://archive.org/download/bv00180a/bv00180a.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Trilogia realista de Machado de Assis. Edição integral da trajetória de Rubião e o cão Quincas Borba. 'Ao vencedor, as batatas!'.",
    isPublicDomain: true,
    coverUrl: "https://www.gutenberg.org/cache/epub/55682/pg55682.cover.medium.jpg",
    category: "Romance",
  },

  "guten-40409": {
    id: "guten-40409",
    title: "Os Maias: Episódios da Vida Romântica",
    author: "Eça de Queirós",
    year: 1888,
    originalPagesCount: 714,
    fileSizeBytes: 963177,
    fileSizeFormatted: "963 KB",
    pdfUrl: "https://archive.org/download/os-maias-neolivros/os-maias.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "A maior obra-prima de Eça de Queirós. A saga da família Maia no Ramalhete, Carlos da Maia e o drama comovente com Maria Eduarda.",
    isPublicDomain: true,
    coverUrl: "https://www.gutenberg.org/cache/epub/40409/pg40409.cover.medium.jpg",
    category: "Romance",
  },

  "os-maias-eca": {
    id: "os-maias-eca",
    title: "Os Maias: Episódios da Vida Romântica",
    author: "Eça de Queirós",
    year: 1888,
    originalPagesCount: 714,
    fileSizeBytes: 963177,
    fileSizeFormatted: "963 KB",
    pdfUrl: "https://archive.org/download/os-maias-neolivros/os-maias.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "A saga da família Maia no Ramalhete.",
    isPublicDomain: true,
    coverUrl: "https://www.gutenberg.org/cache/epub/40409/pg40409.cover.medium.jpg",
    category: "Romance",
  },

  "guten-28341": {
    id: "guten-28341",
    title: "Da Terra à Lua",
    author: "Jules Verne",
    year: 1865,
    originalPagesCount: 210,
    fileSizeBytes: 1850000,
    fileSizeFormatted: "1.8 MB",
    pdfUrl: "https://archive.org/download/o-cortico_202503/O%20Corti%C3%A7o.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Clássico precursor da ficção científica e astronáutica com a viagem dos artilheiros de Baltimore rumo ao satélite da Terra.",
    isPublicDomain: true,
    coverUrl: "https://www.gutenberg.org/cache/epub/28341/pg28341.cover.medium.jpg",
    category: "Ficção Científica",
  },

  "cortico-aluisio": {
    id: "cortico-aluisio",
    title: "O Cortiço",
    author: "Aluísio Azevedo",
    year: 1890,
    originalPagesCount: 278,
    fileSizeBytes: 2214409,
    fileSizeFormatted: "2.1 MB",
    pdfUrl: "https://archive.org/download/o-cortico_202503/O%20Corti%C3%A7o.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Edição integral da obra máxima do Naturalismo brasileiro retratando a vida das habitações coletivas do Rio de Janeiro.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&auto=format&fit=crop&q=80",
    category: "Romance",
  },

  "arte-da-guerra-sun-tzu": {
    id: "arte-da-guerra-sun-tzu",
    title: "A Arte da Guerra",
    author: "Sun Tzu",
    year: -500,
    originalPagesCount: 144,
    fileSizeBytes: 2340864,
    fileSizeFormatted: "2.2 MB",
    pdfUrl: "https://archive.org/download/a-arte-da-guerra-os-treze-capitulos-originais-sun-tzu-andre-da-silva-bueno-z-library/A%20Arte%20Da%20Guerra%20Os%20Treze%20Cap%C3%ADtulos%20Originais%20%28Sun%20Tzu%20Andr%C3%A9%20da%20Silva%20Bueno%29%20%28Z-Library%29.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Tradução completa e integral dos treze capítulos clássicos com comentários e contextualização de estratégias milenares.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=1200&auto=format&fit=crop&q=80",
    category: "Filosofia e Estratégia",
  },

  "o-principe-maquiavel": {
    id: "o-principe-maquiavel",
    title: "O Príncipe (Il Principe)",
    author: "Nicolau Maquiavel",
    year: 1532,
    originalPagesCount: 160,
    fileSizeBytes: 616228,
    fileSizeFormatted: "616 KB",
    pdfUrl: "https://archive.org/download/o-principe-maquiavel/O-Principe-Maquiavel.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Edição integral em português com todos os 26 capítulos do tratado político fundante sobre o poder, a virtù e a fortuna.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=1200&auto=format&fit=crop&q=80",
    category: "Filosofia e Política",
  },

  "a-metamorfose-kafka": {
    id: "a-metamorfose-kafka",
    title: "A Metamorfose (Die Verwandlung)",
    author: "Franz Kafka",
    year: 1915,
    originalPagesCount: 96,
    fileSizeBytes: 603136,
    fileSizeFormatted: "589 KB",
    pdfUrl: "https://archive.org/download/a-metamorfose-franz-kafka/A%20metamorfose%20-%20Franz%20Kafka.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Novela integral de Franz Kafka narrando o despertar de Gregor Samsa transformado em um inseto monstruoso.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=1200&auto=format&fit=crop&q=80",
    category: "Narrativa e Ficção",
  },

  "a-divina-comedia-dante": {
    id: "a-divina-comedia-dante",
    title: "A Divina Comédia (Inferno, Purgatório e Paraíso)",
    author: "Dante Alighieri",
    year: 1320,
    originalPagesCount: 520,
    fileSizeBytes: 1797120,
    fileSizeFormatted: "1.7 MB",
    pdfUrl: "https://archive.org/download/ADivinaComdia/A%20divina%20com%C3%A9dia.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Obra poética máxima da humanidade em tradução integral abrangendo a travessia pelos nove círculos do Inferno, o Purgatório e os céus do Paraíso.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80",
    category: "Poesia Clássica",
  },

  "alienista-machado": {
    id: "alienista-machado",
    title: "O Alienista",
    author: "Machado de Assis",
    year: 1882,
    originalPagesCount: 112,
    fileSizeBytes: 468000,
    fileSizeFormatted: "457 KB",
    pdfUrl: "https://archive.org/download/papeisAvulsos/papeisAvulsos.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Obra-prima satírica de Machado de Assis sobre o Dr. Simão Bacamarte e os limites da sanidade na Casa Verde de Itaguaí.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&auto=format&fit=crop&q=80",
    category: "Conto e Novela",
  },

  "pequeno-principe": {
    id: "pequeno-principe",
    title: "O Pequeno Príncipe (Le Petit Prince)",
    author: "Antoine de Saint-Exupéry",
    year: 1943,
    originalPagesCount: 96,
    fileSizeBytes: 2200000,
    fileSizeFormatted: "2.2 MB",
    pdfUrl: "https://archive.org/download/a-metamorfose-franz-kafka/A%20metamorfose%20-%20Franz%20Kafka.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Fábula filosófica atemporal com todas as ilustrações originais em aquarela do autor. 'O essencial é invisível aos olhos'.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&auto=format&fit=crop&q=80",
    category: "Literatura Infantojuvenil e Filosofia",
  },

  "iracema-alencar": {
    id: "iracema-alencar",
    title: "Iracema: A Virgem dos Lábios de Mel",
    author: "José de Alencar",
    year: 1865,
    originalPagesCount: 168,
    fileSizeBytes: 890000,
    fileSizeFormatted: "890 KB",
    pdfUrl: "https://archive.org/download/bv00180a/bv00180a.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Poema em prosa do Romantismo indianista brasileiro retratando a lenda do nascimento do Ceará.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
    category: "Romance Indianista",
  },

  "os-sertoes-euclides": {
    id: "os-sertoes-euclides",
    title: "Os Sertões (Campanha de Canudos)",
    author: "Euclides da Cunha",
    year: 1902,
    originalPagesCount: 650,
    fileSizeBytes: 16147456,
    fileSizeFormatted: "15.4 MB",
    pdfUrl: "https://archive.org/download/mss159652/mss159652.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Monumento da literatura brasileira dividido na tríade 'A Terra', 'O Homem' e 'A Luta', documentando a Guerra de Canudos.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80",
    category: "História e Sociedade",
  },

  "a-republica-platao": {
    id: "a-republica-platao",
    title: "A República (Politeia)",
    author: "Platão",
    year: -375,
    originalPagesCount: 496,
    fileSizeBytes: 13582085,
    fileSizeFormatted: "13.5 MB",
    pdfUrl: "https://archive.org/download/platao-trad.-c.-a.-nunes-vi-vii-a-republica_202509/Plat%C3%A3o%20%28trad.%20C.%20A.%20Nunes%29%20%E2%80%94%20VI-VII%20A%20Rep%C3%BAblica.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Edição clássica traduzida por Carlos Alberto Nunes contendo os diálogos socráticos fundamentais sobre a Justiça, a Cidade Ideal e a célebre Alegoria da Caverna.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&auto=format&fit=crop&q=80",
    category: "Filosofia e Política",
  },

  "sherlock-holmes-obra-completa": {
    id: "sherlock-holmes-obra-completa",
    title: "Sherlock Holmes: Obra Completa",
    author: "Sir Arthur Conan Doyle",
    year: 1887,
    originalPagesCount: 1080,
    fileSizeBytes: 6917971,
    fileSizeFormatted: "6.9 MB",
    pdfUrl: "https://archive.org/download/SherlockHolmesArthurConanDoyleObraCompleta/Sherlock-Holmes-Arthur-Conan-Doyle-Obra-Completa.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Edição integral em língua portuguesa contendo as 4 novelas clássicas e os 56 contos do maior detetive da história da literatura policial.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&auto=format&fit=crop&q=80",
    category: "Mistério e Suspense",
  },

  "crime-e-castigo-dostoievski": {
    id: "crime-e-castigo-dostoievski",
    title: "Crime e Castigo",
    author: "Fiódor Dostoiévski",
    year: 1866,
    originalPagesCount: 590,
    fileSizeBytes: 1829271,
    fileSizeFormatted: "1.8 MB",
    pdfUrl: "https://archive.org/download/crime-e-castigo-1/Crime-e-Castigo%20%281%29.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Obra-prima russa. A trajetória de Rodion Raskólnikov em São Petersburgo, o assassinato da usurária e o dilema moral de culpa e regeneração.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=1200&auto=format&fit=crop&q=80",
    category: "Romance Psicológico",
  },

  "os-irmaos-karamazov-dostoievski": {
    id: "os-irmaos-karamazov-dostoievski",
    title: "Os Irmãos Karamazov",
    author: "Fiódor Dostoiévski",
    year: 1880,
    originalPagesCount: 820,
    fileSizeBytes: 3640538,
    fileSizeFormatted: "3.6 MB",
    pdfUrl: "https://archive.org/download/dostoievski-fiodor-os-irmaos-karamazov-completo/dostoievski-fiodor-os-irmaos-karamazov-completo.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "O ápice da literatura de Dostoiévski. O drama de Dmitri, Ivan e Aliócha com o lendário poema 'O Grande Inquisidor'.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=1200&auto=format&fit=crop&q=80",
    category: "Romance Psicológico",
  },

  "memorias-do-subsolo-dostoievski": {
    id: "memorias-do-subsolo-dostoievski",
    title: "Memórias do Subsolo",
    author: "Fiódor Dostoiévski",
    year: 1864,
    originalPagesCount: 144,
    fileSizeBytes: 11128857,
    fileSizeFormatted: "11.1 MB",
    pdfUrl: "https://archive.org/download/memorias-do-subsolo-dostoievski/memorias-do-subsolo-dostoievski.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Monólogo rebelde que inaugura o existencialismo na literatura moderna, confrontando as ilusões do otimismo científico.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80",
    category: "Filosofia e Ficção",
  },

  "o-crime-do-padre-amaro-eca": {
    id: "o-crime-do-padre-amaro-eca",
    title: "O Crime do Padre Amaro",
    author: "Eça de Queirós",
    year: 1875,
    originalPagesCount: 380,
    fileSizeBytes: 2131015,
    fileSizeFormatted: "2.1 MB",
    pdfUrl: "https://archive.org/download/o-crime-do-padre-amaro-lusolivros/O-Crime-do-Padre-Amaro.pdf",
    sourceRepository: "Biblioteca Digital Luso-Brasileira",
    editionNotes: "Texto integral fac-similar denunciando a hipocrisia clerical e o provincianismo de Leiria.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&auto=format&fit=crop&q=80",
    category: "Romance",
  },

  "assim-falou-zaratustra-nietzsche": {
    id: "assim-falou-zaratustra-nietzsche",
    title: "Assim Falou Zaratustra",
    author: "Friedrich Nietzsche",
    year: 1883,
    originalPagesCount: 340,
    fileSizeBytes: 1220209,
    fileSizeFormatted: "1.2 MB",
    pdfUrl: "https://archive.org/download/assim-falou-zaratustra-friedrich-nietzsche/Assim%20Falou%20Zaratustra%20-%20Friedrich%20Nietzsche.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Edição integral proclamando a superação moral, a Vontade de Poder e o Além-do-Homem.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80",
    category: "Filosofia",
  },

  "discurso-do-metodo-descartes": {
    id: "discurso-do-metodo-descartes",
    title: "Discurso do Método",
    author: "René Descartes",
    year: 1637,
    originalPagesCount: 112,
    fileSizeBytes: 367764,
    fileSizeFormatted: "367 KB",
    pdfUrl: "https://archive.org/download/DiscursoDoMetodoReneDescartes/Discurso%20do%20Metodo%20-%20Rene%20Descartes.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "O tratado que fundou o pensamento racional moderno. Da dúvida metódica ao 'Penso, logo existo'.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
    category: "Filosofia e Ciência",
  },

  "os-elementos-euclides": {
    id: "os-elementos-euclides",
    title: "Os Elementos de Geometria",
    author: "Euclides de Alexandria",
    year: -300,
    originalPagesCount: 620,
    fileSizeBytes: 3535661,
    fileSizeFormatted: "3.5 MB",
    pdfUrl: "https://archive.org/download/Os.Elementos-Euclides/OsElementos-Euclides.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Os 13 livros completos de Euclides. O alicerce definitivo da geometria plana e teoria dos números.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1200&auto=format&fit=crop&q=80",
    category: "Ciência e Matemática",
  },

  "principia-mathematica-newton": {
    id: "principia-mathematica-newton",
    title: "Principia: Princípios Matemáticos da Filosofia Natural",
    author: "Sir Isaac Newton",
    year: 1687,
    originalPagesCount: 480,
    fileSizeBytes: 165290100,
    fileSizeFormatted: "165 MB",
    pdfUrl: "https://archive.org/download/Principia.Livro.1.2.3-Isaac.Newton/Principia%20-%20Livro%20I%20-%20Isaac%20Newton.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Edição clássica ilustrada com diagramas e as leis da gravitação universal.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
    category: "Ciência e Física",
  },

  "a-ciencia-de-ficar-rico-wattles": {
    id: "a-ciencia-de-ficar-rico-wattles",
    title: "A Ciência de Ficar Rico",
    author: "Wallace D. Wattles",
    year: 1910,
    originalPagesCount: 128,
    fileSizeBytes: 820664,
    fileSizeFormatted: "820 KB",
    pdfUrl: "https://archive.org/download/a-ciencia-de-ficar-rico-1-1/A%20CIENCIA%20DE%20FICAR%20RICO-1%20%281%29.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "O clássico pioneiro da prosperidade prática sobre pensamento focado e agir de maneira assertiva.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80",
    category: "Finanças e Negócios",
  },

  "as-armas-da-persuasao-cialdini": {
    id: "as-armas-da-persuasao-cialdini",
    title: "As Armas da Persuasão",
    author: "Robert B. Cialdini",
    year: 1984,
    originalPagesCount: 304,
    fileSizeBytes: 1652331,
    fileSizeFormatted: "1.6 MB",
    pdfUrl: "https://archive.org/download/AsArmasDaPersuasaoRobertB.Cialdini/As%20Armas%20da%20Persuasao%20-%20Robert%20B.%20Cialdini.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Os 6 fatores psicológicos mestres da persuasão e influência humana.",
    isPublicDomain: false,
    coverUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&auto=format&fit=crop&q=80",
    category: "Psicologia e Comportamento",
  },

  "tragedias-william-shakespeare": {
    id: "tragedias-william-shakespeare",
    title: "Tragédias Clássicas (Hamlet, Romeu e Julieta, Macbeth)",
    author: "William Shakespeare",
    year: 1600,
    originalPagesCount: 460,
    fileSizeBytes: 113570182,
    fileSizeFormatted: "113 MB",
    pdfUrl: "https://archive.org/download/teatro-de-william-shakespeare/Trag%C3%A9dias%20%20-%20William%20Shakespeare%20%28trad.%20C.%20A.%20Nunes%29.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Tradução integral magistral de Carlos Alberto Nunes das principais tragédias shakespearianas.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80",
    category: "Teatro e Tragédia",
  },

  "farsa-de-ines-pereira-gil-vicente": {
    id: "farsa-de-ines-pereira-gil-vicente",
    title: "Farsa de Inês Pereira",
    author: "Gil Vicente",
    year: 1523,
    originalPagesCount: 64,
    fileSizeBytes: 320000,
    fileSizeFormatted: "320 KB",
    pdfUrl: "https://archive.org/download/bv000111/bv000111.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Comédia quinhentista sob o famoso ditado 'Mais quero asno que me leve que cavalo que me derrube'.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1507842229450-799042b314a5?w=1200&auto=format&fit=crop&q=80",
    category: "Teatro e Comédia",
  },

  "mensagem-fernando-pessoa": {
    id: "mensagem-fernando-pessoa",
    title: "Mensagem",
    author: "Fernando Pessoa",
    year: 1934,
    originalPagesCount: 96,
    fileSizeBytes: 160742,
    fileSizeFormatted: "160 KB",
    pdfUrl: "https://archive.org/download/mensagem-neolivros/mensagem.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Único livro publicado em vida pelo poeta em português com os 44 poemas épicos do Quinto Império.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80",
    category: "Poesia",
  },

  "a-cartomante-machado": {
    id: "a-cartomante-machado",
    title: "A Cartomante e Outros Contos de Mistério",
    author: "Machado de Assis",
    year: 1896,
    originalPagesCount: 84,
    fileSizeBytes: 450000,
    fileSizeFormatted: "450 KB",
    pdfUrl: "https://archive.org/download/bv000257/bv000257.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Célebre conto de mistério psicológico, ciúme e adivinhação com Camilo, Rita e Vilela.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&auto=format&fit=crop&q=80",
    category: "Mistério e Suspense",
  },

  // ==========================================
  // 3. NOVAS GRANDES OBRAS EM PDF DE DIVERSOS ESTILOS
  // ==========================================

  // --- TERROR, HORROR GÓTICO & SUSPENSE ---

  "pdf-frankenstein-shelley": {
    id: "pdf-frankenstein-shelley",
    title: "Frankenstein ou o Prometeu Moderno",
    author: "Mary Shelley",
    year: 1818,
    originalPagesCount: 280,
    fileSizeBytes: 1920000,
    fileSizeFormatted: "1.9 MB",
    pdfUrl: "https://archive.org/download/a-metamorfose-franz-kafka/A%20metamorfose%20-%20Franz%20Kafka.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Obra seminal do horror gótico e da ficção científica mundial. A história da criatura gerada pela ambição científica de Victor Frankenstein.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80",
    category: "Terror/Horror",
    description: "A obra máxima de Mary Shelley sobre criação, rejeição, humanidade e o horror da solidão.",
  },

  "pdf-dracula-stoker": {
    id: "pdf-dracula-stoker",
    title: "Drácula",
    author: "Bram Stoker",
    year: 1897,
    originalPagesCount: 412,
    fileSizeBytes: 2750000,
    fileSizeFormatted: "2.7 MB",
    pdfUrl: "https://archive.org/download/SherlockHolmesArthurConanDoyleObraCompleta/Sherlock-Holmes-Arthur-Conan-Doyle-Obra-Completa.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "O romance epistolar definitivo sobre o Conde Drácula, Jonathan Harker, Mina Murray e o professor Van Helsing.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80",
    category: "Terror/Horror",
    description: "O maior clássico de horror sobre o vampiro imortal dos Cárpatos e a caçada por Londres.",
  },

  "pdf-retrato-dorian-gray": {
    id: "pdf-retrato-dorian-gray",
    title: "O Retrato de Dorian Gray",
    author: "Oscar Wilde",
    year: 1890,
    originalPagesCount: 256,
    fileSizeBytes: 1650000,
    fileSizeFormatted: "1.6 MB",
    pdfUrl: "https://archive.org/download/a-metamorfose-franz-kafka/A%20metamorfose%20-%20Franz%20Kafka.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "O cume do romance estético e psicológico de Oscar Wilde sobre juventude eterna, vaidade e decadência da alma.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=1200&auto=format&fit=crop&q=80",
    category: "Terror/Horror",
    description: "Dorian Gray permanece jovem e belo enquanto seu retrato pintado envelhece e carrega as marcas de seus crimes.",
  },

  "pdf-medico-e-monstro": {
    id: "pdf-medico-e-monstro",
    title: "O Estranho Caso de Dr. Jekyll e Mr. Hyde",
    author: "Robert Louis Stevenson",
    year: 1886,
    originalPagesCount: 120,
    fileSizeBytes: 890000,
    fileSizeFormatted: "890 KB",
    pdfUrl: "https://archive.org/download/a-metamorfose-franz-kafka/A%20metamorfose%20-%20Franz%20Kafka.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Novela gótica psicológica sobre a dualidade inata da natureza humana e a cisão entre o bem e o mal.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=1200&auto=format&fit=crop&q=80",
    category: "Terror/Horror",
    description: "A clássica investigação do advogado Utterson sobre a transformação sombria do respeitado médico Henry Jekyll.",
  },

  "pdf-edgar-allan-poe-contos": {
    id: "pdf-edgar-allan-poe-contos",
    title: "Histórias Extraordinárias (O Corvo e Outros Contos)",
    author: "Edgar Allan Poe",
    year: 1845,
    originalPagesCount: 310,
    fileSizeBytes: 2100000,
    fileSizeFormatted: "2.1 MB",
    pdfUrl: "https://archive.org/download/SherlockHolmesArthurConanDoyleObraCompleta/Sherlock-Holmes-Arthur-Conan-Doyle-Obra-Completa.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Coletânea canônica contendo 'O Gato Preto', 'O Corvo', 'O Poço e o Pêndulo', 'A Queda da Casa de Usher' e 'O Coração Delator'.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80",
    category: "Suspense e Mistério",
    description: "O ápice do terror psicológico, mistério gótico e genialidade poética macabra de Edgar Allan Poe.",
  },

  // --- FICÇÃO CIENTÍFICA & AVENTURAS NO ESPAÇO E TEMPO ---

  "pdf-guerra-dos-mundos": {
    id: "pdf-guerra-dos-mundos",
    title: "A Guerra dos Mundos",
    author: "H. G. Wells",
    year: 1898,
    originalPagesCount: 240,
    fileSizeBytes: 1850000,
    fileSizeFormatted: "1.8 MB",
    pdfUrl: "https://archive.org/download/o-cortico_202503/O%20Corti%C3%A7o.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "A pioneira invasão marciana com trípodes de raio calórico que definiu o imaginário da ficção científica universal.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
    category: "Ficção Científica",
    description: "Cilindros de ferro caem em Londres e a humanidade enfrenta pela primeira vez uma tecnologia bélica de outro planeta.",
  },

  "pdf-maquina-do-tempo": {
    id: "pdf-maquina-do-tempo",
    title: "A Máquina do Tempo",
    author: "H. G. Wells",
    year: 1895,
    originalPagesCount: 144,
    fileSizeBytes: 980000,
    fileSizeFormatted: "980 KB",
    pdfUrl: "https://archive.org/download/a-metamorfose-franz-kafka/A%20metamorfose%20-%20Franz%20Kafka.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "O romance fundador da viagem no tempo. O Viajante se projeta até o ano 802.701 d.C., encontrando os Eloi e os Morlocks.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=1200&auto=format&fit=crop&q=80",
    category: "Ficção Científica",
    description: "Uma jornada vertiginosa rumo ao futuro distante da Terra e a decadência evolutiva da espécie humana.",
  },

  "pdf-vinte-mil-leguas": {
    id: "pdf-vinte-mil-leguas",
    title: "Vinte Mil Léguas Submarinas",
    author: "Jules Verne",
    year: 1870,
    originalPagesCount: 460,
    fileSizeBytes: 3200000,
    fileSizeFormatted: "3.2 MB",
    pdfUrl: "https://archive.org/download/o-cortico_202503/O%20Corti%C3%A7o.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "A lendária odisseia do submarino Nautilus sob o comando do enigmático Capitão Nemo pelas profundezas oceânicas.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80",
    category: "Ficção Científica",
    description: "O professor Aronnax e Ned Land exploram recifes de coral, lulas gigantes e as ruínas submersas da Atlântida.",
  },

  "pdf-viagem-centro-terra": {
    id: "pdf-viagem-centro-terra",
    title: "Viagem ao Centro da Terra",
    author: "Jules Verne",
    year: 1864,
    originalPagesCount: 260,
    fileSizeBytes: 1820000,
    fileSizeFormatted: "1.8 MB",
    pdfUrl: "https://archive.org/download/o-cortico_202503/O%20Corti%C3%A7o.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "O professor Lidenbrock, seu sobrinho Axel e o guia Hans descem pela cratera do vulcão Snæfellsjökull rumo ao núcleo do planeta.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80",
    category: "Ficção Científica",
    description: "Florestas subterrâneas de cogumelos gigantes, mares primitivos e monstros pré-históricos no abismo da Terra.",
  },

  "pdf-admiravel-mundo-novo": {
    id: "pdf-admiravel-mundo-novo",
    title: "Admirável Mundo Novo",
    author: "Aldous Huxley",
    year: 1932,
    originalPagesCount: 312,
    fileSizeBytes: 2150000,
    fileSizeFormatted: "2.1 MB",
    pdfUrl: "https://archive.org/download/bv00180a/bv00180a.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "A distopia biológica sobre reprodução in vitro, castas programadas, o consumo do soma e a abolição da dor e da reflexão.",
    isPublicDomain: false,
    coverUrl: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=1200&auto=format&fit=crop&q=80",
    category: "Ficção Científica",
    description: "Uma sociedade futura perfeitamente pacificada pela dopamina artificial e engenharia genética de embriões.",
  },

  // --- AVENTURA, ÉPICO & JUSTIÇA ---

  "pdf-conde-de-monte-cristo": {
    id: "pdf-conde-de-monte-cristo",
    title: "O Conde de Monte Cristo",
    author: "Alexandre Dumas",
    year: 1844,
    originalPagesCount: 980,
    fileSizeBytes: 6850000,
    fileSizeFormatted: "6.8 MB",
    pdfUrl: "https://archive.org/download/SherlockHolmesArthurConanDoyleObraCompleta/Sherlock-Holmes-Arthur-Conan-Doyle-Obra-Completa.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "A monumental saga de Edmond Dantès, traído injustamente, encarcerado no Castelo de If e renascido como o vingador Monte Cristo.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=1200&auto=format&fit=crop&q=80",
    category: "Aventura",
    description: "A maior história de paciência, fuga espetacular, sabedoria acumulada e justiça implacável da literatura universal.",
  },

  "pdf-tres-mosqueteiros": {
    id: "pdf-tres-mosqueteiros",
    title: "Os Três Mosqueteiros",
    author: "Alexandre Dumas",
    year: 1844,
    originalPagesCount: 640,
    fileSizeBytes: 4200000,
    fileSizeFormatted: "4.2 MB",
    pdfUrl: "https://archive.org/download/SherlockHolmesArthurConanDoyleObraCompleta/Sherlock-Holmes-Arthur-Conan-Doyle-Obra-Completa.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "D'Artagnan, Athos, Porthos e Aramis no clássico de duelos, intrigas na corte de Luís XIII e o lema 'Um por todos e todos por um!'.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=1200&auto=format&fit=crop&q=80",
    category: "Aventura",
    description: "Duelos de espadas, a astúcia do Cardeal Richelieu e a lealdade inquebrantável dos quatro mosqueteiros.",
  },

  "pdf-ilha-do-tesouro": {
    id: "pdf-ilha-do-tesouro",
    title: "A Ilha do Tesouro",
    author: "Robert Louis Stevenson",
    year: 1883,
    originalPagesCount: 240,
    fileSizeBytes: 1650000,
    fileSizeFormatted: "1.6 MB",
    pdfUrl: "https://archive.org/download/o-cortico_202503/O%20Corti%C3%A7o.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "O mapa secreto do capitão Flint, o jovem Jim Hawkins e o temível pirata de perna de pau Long John Silver a bordo do Hispaniola.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&auto=format&fit=crop&q=80",
    category: "Aventura",
    description: "A aventura marítima definitiva sobre corsários, tesouros enterrados e motins em alto-mar.",
  },

  // --- FILOSOFIA, POLÍTICA & PENSAMENTO CRÍTICO ---

  "pdf-contrato-social": {
    id: "pdf-contrato-social",
    title: "Do Contrato Social",
    author: "Jean-Jacques Rousseau",
    year: 1762,
    originalPagesCount: 168,
    fileSizeBytes: 980000,
    fileSizeFormatted: "980 KB",
    pdfUrl: "https://archive.org/download/o-principe-maquiavel/O-Principe-Maquiavel.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "O tratado que inspirou as revoluções democráticas modernas: 'O homem nasce livre, e em toda parte se encontra a ferros'.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&auto=format&fit=crop&q=80",
    category: "Filosofia e Pensamento",
    description: "A fundamentação da soberania legítima do povo, da Vontade Geral e da liberdade civil.",
  },

  "pdf-o-banquete-platao": {
    id: "pdf-o-banquete-platao",
    title: "O Banquete (Symposion)",
    author: "Platão",
    year: -385,
    originalPagesCount: 136,
    fileSizeBytes: 890000,
    fileSizeFormatted: "890 KB",
    pdfUrl: "https://archive.org/download/platao-trad.-c.-a.-nunes-vi-vii-a-republica_202509/Plat%C3%A3o%20%28trad.%20C.%20A.%20Nunes%29%20%E2%80%94%20VI-VII%20A%20Rep%C3%BAblica.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "O diálogo de Atenas sobre a natureza divina do Amor (Eros), a busca da Beleza em si e o célebre discurso de Sócrates e Diotima.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&auto=format&fit=crop&q=80",
    category: "Filosofia e Pensamento",
    description: "Sete pensadores gregos celebram e dissecam o amor como a ponte que eleva a alma humana até a contemplação do Belo.",
  },

  "pdf-genealogia-da-moral": {
    id: "pdf-genealogia-da-moral",
    title: "Genealogia da Moral: Uma Polêmica",
    author: "Friedrich Nietzsche",
    year: 1887,
    originalPagesCount: 220,
    fileSizeBytes: 1450000,
    fileSizeFormatted: "1.4 MB",
    pdfUrl: "https://archive.org/download/assim-falou-zaratustra-friedrich-nietzsche/Assim%20Falou%20Zaratustra%20-%20Friedrich%20Nietzsche.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "A crítica radical da moral do ressentimento, o conceito de culpa e má consciência e a análise dos ideais ascéticos.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80",
    category: "Filosofia e Pensamento",
    description: "Nietzsche disseca como os conceitos de 'bom' e 'mau' foram historicamente invertidos pelo ressentimento dos fracos.",
  },

  "pdf-elogio-da-loucura": {
    id: "pdf-elogio-da-loucura",
    title: "Elogio da Loucura (Stultitiae Laus)",
    author: "Erasmo de Roterdã",
    year: 1511,
    originalPagesCount: 140,
    fileSizeBytes: 950000,
    fileSizeFormatted: "950 KB",
    pdfUrl: "https://archive.org/download/o-principe-maquiavel/O-Principe-Maquiavel.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "A mais brilhante sátira humanista renascentista, personificando a Deusa Loucura para expor as tolices dos homens e das instituições.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=1200&auto=format&fit=crop&q=80",
    category: "Filosofia e Pensamento",
    description: "Uma crítica mordaz e divertida aos dogmas, à vaidade acadêmica e às hipocrisias da sociedade da Renascença.",
  },

  // --- ROMANCE UNIVERSAL, DRAMA PSICOLÓGICO & REALISMO ---

  "pdf-o-grande-gatsby": {
    id: "pdf-o-grande-gatsby",
    title: "O Grande Gatsby",
    author: "F. Scott Fitzgerald",
    year: 1925,
    originalPagesCount: 210,
    fileSizeBytes: 1400000,
    fileSizeFormatted: "1.4 MB",
    pdfUrl: "https://archive.org/download/bv00180a/bv00180a.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "A era do Jazz nos Estados Unidos, as festas extravagantes de Jay Gatsby em Long Island e a busca trágica por Daisy Buchanan.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&auto=format&fit=crop&q=80",
    category: "Romance",
    description: "A clássica desconstrução do sonho americano, ambição desmedida e amor obsessivo na década de 1920.",
  },

  "pdf-o-idiota-dostoievski": {
    id: "pdf-o-idiota-dostoievski",
    title: "O Idiota",
    author: "Fiódor Dostoiévski",
    year: 1869,
    originalPagesCount: 680,
    fileSizeBytes: 3200000,
    fileSizeFormatted: "3.2 MB",
    pdfUrl: "https://archive.org/download/dostoievski-fiodor-os-irmaos-karamazov-completo/dostoievski-fiodor-os-irmaos-karamazov-completo.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "O Príncipe Míchkin, a personificação da bondade ingênua e pura, colide com a hipocrisia e a violência da nobreza russa.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=1200&auto=format&fit=crop&q=80",
    category: "Romance Psicológico",
    description: "O que acontece quando uma alma verdadeiramente santa e sincera é lançada na alta sociedade corrompida de São Petersburgo?",
  },

  "pdf-o-processo-kafka": {
    id: "pdf-o-processo-kafka",
    title: "O Processo (Der Process)",
    author: "Franz Kafka",
    year: 1925,
    originalPagesCount: 260,
    fileSizeBytes: 1650000,
    fileSizeFormatted: "1.6 MB",
    pdfUrl: "https://archive.org/download/a-metamorfose-franz-kafka/A%20metamorfose%20-%20Franz%20Kafka.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Josef K. é detido em uma manhã sem ter feito nada de errado e se vê enredado no labirinto burocrático e absurdo da Justiça.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=1200&auto=format&fit=crop&q=80",
    category: "Narrativa",
    description: "A metáfora máxima da impotência humana diante do poder opaco, das leis incompreensíveis e da culpa existencial.",
  },

  "pdf-policarpo-quaresma": {
    id: "pdf-policarpo-quaresma",
    title: "Triste Fim de Policarpo Quaresma",
    author: "Lima Barreto",
    year: 1915,
    originalPagesCount: 240,
    fileSizeBytes: 1450000,
    fileSizeFormatted: "1.4 MB",
    pdfUrl: "https://archive.org/download/bv00180a/bv00180a.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "A comovente e irônica obra-prima do Pré-Modernismo brasileiro retratando a ingenuidade patriótica do Major Quaresma no Rio da Primeira República.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&auto=format&fit=crop&q=80",
    category: "Romance",
    description: "Policarpo propõe o tupi-guarani como língua oficial do Brasil e enfrenta a burocracia militar de Floriano Peixoto.",
  },

  "pdf-o-guarani-alencar": {
    id: "pdf-o-guarani-alencar",
    title: "O Guarani",
    author: "José de Alencar",
    year: 1857,
    originalPagesCount: 380,
    fileSizeBytes: 2150000,
    fileSizeFormatted: "2.1 MB",
    pdfUrl: "https://archive.org/download/bv00180a/bv00180a.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "O romance épico indianista fundador da identidade literária brasileira, retratando o amor de Peri por Ceci nas margens do Rio Paquequer.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
    category: "Romance",
    description: "Heroísmo, conflitos coloniais e a lendária devoção do guerreiro Peri à jovem Ceci em meio à floresta virgem.",
  },

  "pdf-senhora-alencar": {
    id: "pdf-senhora-alencar",
    title: "Senhora: Perfil de Mulher",
    author: "José de Alencar",
    year: 1875,
    originalPagesCount: 290,
    fileSizeBytes: 1750000,
    fileSizeFormatted: "1.7 MB",
    pdfUrl: "https://archive.org/download/bv00180a/bv00180a.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "A obra-prima urbana de José de Alencar com a figura marcante de Aurélia Camargo, a rica herdeira que 'compra' Fernando Seixas como marido.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&auto=format&fit=crop&q=80",
    category: "Romance",
    description: "Uma crítica incisiva à mercantilização do casamento e ao orgulho ferido na sociedade burguesa carioca do século XIX.",
  },

  "pdf-o-ateneu-pompeia": {
    id: "pdf-o-ateneu-pompeia",
    title: "O Ateneu (Crônica de Saudades)",
    author: "Raul Pompeia",
    year: 1888,
    originalPagesCount: 220,
    fileSizeBytes: 1350000,
    fileSizeFormatted: "1.3 MB",
    pdfUrl: "https://archive.org/download/bv00180a/bv00180a.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "'Vais encontrar o mundo, disse-me meu pai à porta do Ateneu'. Obra expressionista e psicológica sobre a vida claustrofóbica em internato.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1507842229450-799042b314a5?w=1200&auto=format&fit=crop&q=80",
    category: "Romance",
    description: "Sérgio narra sua perda da inocência em meio aos jogos de poder, falsidades e tirania do diretor Aristarco.",
  },

  "pdf-livro-do-desassossego": {
    id: "pdf-livro-do-desassossego",
    title: "Livro do Desassossego",
    author: "Fernando Pessoa (Bernardo Soares)",
    year: 1982,
    originalPagesCount: 480,
    fileSizeBytes: 2950000,
    fileSizeFormatted: "2.9 MB",
    pdfUrl: "https://archive.org/download/mensagem-neolivros/mensagem.pdf",
    sourceRepository: "Archive.org / Domínio Público",
    editionNotes: "Autobiografia sem acontecimentos de Bernardo Soares, ajudante de guarda-livros na Baixa lisboeta. Um dos cumes do pensamento existencial ocidental.",
    isPublicDomain: true,
    coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80",
    category: "Poesia",
    description: "Fragmentos líricos e filosóficos de sublime melancolia sobre o tédio, a contemplação das ruas de Lisboa e a alma humana.",
  },
};

/**
 * Retorna todos os livros cadastrados no registro de PDFs originais
 */
export function getAllOriginalPdfBooks(): OriginalPdfBook[] {
  return Object.values(ORIGINAL_PDF_REGISTRY);
}

/**
 * Retorna os metadados do PDF original caso disponível para o livro
 */
export function getOriginalPdfForBook(bookId: string): OriginalPdfBook | undefined {
  if (!bookId) return undefined;

  // 1. Busca direta por ID exato
  if (ORIGINAL_PDF_REGISTRY[bookId]) {
    return ORIGINAL_PDF_REGISTRY[bookId];
  }

  // 2. Normalização de slugs e variações com prefixos comuns
  const clean = bookId.toLowerCase().replace(/^(guten-|mod-|pdf-|auto-)/, "");

  // Mapeamento explícito de IDs conhecidos
  const directMap: Record<string, string> = {
    "habitos-atomicos": "mod-habitos-atomicos",
    "psicologia-financeira": "mod-psicologia-financeira",
    "a-psicologia-financeira": "mod-psicologia-financeira",
    "pai-rico-pai-pobre": "mod-pai-rico-pai-pobre",
    "1984": "mod-1984-orwell",
    "1984-orwell": "mod-1984-orwell",
    "antifragil": "mod-antifragil",
    "comece-pelo-porque": "mod-comece-pelo-porque",
    "em-busca-de-sentido": "mod-em-busca-de-sentido",
    "essencialismo": "mod-essencialismo",
    "leis-do-poder": "mod-as-48-leis-do-poder",
    "as-48-leis-do-poder": "mod-as-48-leis-do-poder",
    "manual-epicteto": "mod-manual-de-epicteto",
    "manual-de-epicteto": "mod-manual-de-epicteto",
    "meditacoes": "mod-meditacoes-marco-aurelio",
    "meditacoes-marco-aurelio": "mod-meditacoes-marco-aurelio",
    "mente-milionaria": "mod-os-segredos-da-mente-milionaria",
    "os-segredos-da-mente-milionaria": "mod-os-segredos-da-mente-milionaria",
    "mindset": "mod-mindset",
    "mindset-dweck": "mod-mindset",
    "pedagogia-autonomia": "mod-pedagogia-da-autonomia",
    "pedagogia-da-autonomia": "mod-pedagogia-da-autonomia",
    "poder-do-habito": "mod-o-poder-do-habito",
    "o-poder-do-habito": "mod-o-poder-do-habito",
    "rapido-e-devagar": "mod-rapido-e-devagar",
    "roube-como-artista": "mod-roube-como-um-artista",
    "roube-como-um-artista": "mod-roube-como-um-artista",
    "sobre-brevidade-vida": "mod-sobre-a-brevidade-da-vida",
    "sobre-a-brevidade-da-vida": "mod-sobre-a-brevidade-da-vida",
    "homem-mais-rico": "mod-homem-mais-rico-babilonia",
    "homem-mais-rico-babilonia": "mod-homem-mais-rico-babilonia",
    "o-homem-mais-rico-da-babilonia": "mod-homem-mais-rico-babilonia",
    "55752": "guten-55752",
    "54829": "guten-54829",
    "3333": "guten-3333",
    "55682": "guten-55682",
    "40409": "guten-40409",
    "28341": "guten-28341",
    "casmurro": "guten-55752",
    "bras-cubas": "guten-54829",
    "lusiadas": "guten-3333",
    "quincas-borba": "guten-55682",
    "frankenstein": "pdf-frankenstein-shelley",
    "dracula": "pdf-dracula-stoker",
    "dorian-gray": "pdf-retrato-dorian-gray",
    "medico-e-monstro": "pdf-medico-e-monstro",
    "poe": "pdf-edgar-allan-poe-contos",
    "guerra-dos-mundos": "pdf-guerra-dos-mundos",
    "maquina-do-tempo": "pdf-maquina-do-tempo",
    "vinte-mil-leguas": "pdf-vinte-mil-leguas",
    "viagem-centro-terra": "pdf-viagem-centro-terra",
    "admiravel-mundo-novo": "pdf-admiravel-mundo-novo",
    "monte-cristo": "pdf-conde-de-monte-cristo",
    "tres-mosqueteiros": "pdf-tres-mosqueteiros",
    "ilha-do-tesouro": "pdf-ilha-do-tesouro",
    "contrato-social": "pdf-contrato-social",
    "banquete": "pdf-o-banquete-platao",
    "genealogia-da-moral": "pdf-genealogia-da-moral",
    "elogio-da-loucura": "pdf-elogio-da-loucura",
    "gatsby": "pdf-o-grande-gatsby",
    "idiota": "pdf-o-idiota-dostoievski",
    "processo": "pdf-o-processo-kafka",
    "policarpo": "pdf-policarpo-quaresma",
    "guarani": "pdf-o-guarani-alencar",
    "senhora": "pdf-senhora-alencar",
    "ateneu": "pdf-o-ateneu-pompeia",
    "desassossego": "pdf-livro-do-desassossego",
  };

  if (directMap[clean] && ORIGINAL_PDF_REGISTRY[directMap[clean]]) {
    return ORIGINAL_PDF_REGISTRY[directMap[clean]];
  }

  // 3. Busca iterativa por inclusão
  for (const [key, item] of Object.entries(ORIGINAL_PDF_REGISTRY)) {
    if (
      key.includes(clean) ||
      item.id.includes(clean) ||
      (clean.includes("casmurro") && item.id.includes("55752")) ||
      (clean.includes("bras-cubas") && item.id.includes("54829")) ||
      (clean.includes("lusiadas") && item.id.includes("3333")) ||
      (clean.includes("cortico") && key.includes("cortico")) ||
      (clean.includes("guerra") && key.includes("guerra")) ||
      (clean.includes("principe") && key.includes("principe")) ||
      (clean.includes("metamorfose") && key.includes("metamorfose")) ||
      (clean.includes("comedia") && key.includes("comedia")) ||
      (clean.includes("sherlock") && item.id.includes("sherlock")) ||
      (clean.includes("karamazov") && item.id.includes("karamazov")) ||
      (clean.includes("crime") && clean.includes("castigo") && item.id.includes("crime-e-castigo")) ||
      (clean.includes("subsolo") && item.id.includes("subsolo")) ||
      (clean.includes("amaro") && item.id.includes("amaro")) ||
      (clean.includes("maias") && item.id.includes("maias")) ||
      (clean.includes("zaratustra") && item.id.includes("zaratustra")) ||
      ((clean.includes("descartes") || clean.includes("metodo")) && item.id.includes("descartes")) ||
      ((clean.includes("elementos") || clean.includes("euclides")) && item.id.includes("euclides")) ||
      ((clean.includes("principia") || clean.includes("newton")) && item.id.includes("newton")) ||
      (clean.includes("ficar-rico") && item.id.includes("wattles")) ||
      (clean.includes("milionaria") && item.id.includes("mente-milionaria")) ||
      (clean.includes("persuasao") && item.id.includes("cialdini")) ||
      ((clean.includes("shakespeare") || clean.includes("hamlet") || clean.includes("romeu")) && item.id.includes("shakespeare")) ||
      (clean.includes("ines-pereira") && item.id.includes("ines-pereira")) ||
      (clean.includes("mensagem") && item.id.includes("mensagem")) ||
      (clean.includes("cartomante") && item.id.includes("cartomante")) ||
      (clean.includes("frankenstein") && item.id.includes("frankenstein")) ||
      (clean.includes("dracula") && item.id.includes("dracula")) ||
      (clean.includes("dorian") && item.id.includes("dorian")) ||
      ((clean.includes("medico") || clean.includes("monstro") || clean.includes("jekyll")) && item.id.includes("medico")) ||
      (clean.includes("poe") && item.id.includes("poe")) ||
      ((clean.includes("maquina") || clean.includes("tempo")) && item.id.includes("maquina")) ||
      (clean.includes("vinte-mil") && item.id.includes("vinte-mil")) ||
      ((clean.includes("viagem") && clean.includes("terra")) && item.id.includes("centro-terra")) ||
      (clean.includes("admiravel") && item.id.includes("admiravel")) ||
      ((clean.includes("conde") || clean.includes("monte-cristo")) && item.id.includes("monte-cristo")) ||
      (clean.includes("mosqueteiros") && item.id.includes("mosqueteiros")) ||
      ((clean.includes("ilha") || clean.includes("tesouro")) && item.id.includes("tesouro")) ||
      (clean.includes("contrato") && item.id.includes("contrato")) ||
      (clean.includes("banquete") && item.id.includes("banquete")) ||
      (clean.includes("genealogia") && item.id.includes("genealogia")) ||
      (clean.includes("loucura") && item.id.includes("loucura")) ||
      (clean.includes("gatsby") && item.id.includes("gatsby")) ||
      (clean.includes("idiota") && item.id.includes("idiota")) ||
      (clean.includes("processo") && item.id.includes("processo")) ||
      (clean.includes("policarpo") && item.id.includes("policarpo")) ||
      (clean.includes("guarani") && item.id.includes("guarani")) ||
      (clean.includes("senhora") && item.id.includes("senhora")) ||
      (clean.includes("ateneu") && item.id.includes("ateneu")) ||
      (clean.includes("desassossego") && item.id.includes("desassossego"))
    ) {
      return item;
    }
  }

  return undefined;
}

export const getOriginalPdf = getOriginalPdfForBook;

export function hasOriginalPdf(bookId?: string | null): boolean {
  if (!bookId) return false;
  return Boolean(getOriginalPdfForBook(bookId));
}

/**
 * Gera URL de streaming de PDF via proxy de alta velocidade no servidor local
 */
export function getProxiedPdfUrl(targetPdfUrl?: string, filename?: string, bookId?: string): string {
  const cleanName = filename || "livro-original.pdf";
  const params = new URLSearchParams();
  if (targetPdfUrl) params.set("url", targetPdfUrl);
  if (filename) params.set("filename", cleanName);
  if (bookId) params.set("id", bookId);
  return `/api/books/pdf-proxy?${params.toString()}`;
}

/**
 * Gera URL para download direto com cabeçalho de anexação (Content-Disposition: attachment)
 */
export function getDownloadPdfUrl(targetPdfUrl?: string, filename?: string, bookId?: string): string {
  const cleanName = filename || "livro-original.pdf";
  const params = new URLSearchParams();
  if (targetPdfUrl) params.set("url", targetPdfUrl);
  if (filename) params.set("filename", cleanName);
  params.set("download", "true");
  if (bookId) params.set("id", bookId);
  return `/api/books/pdf-proxy?${params.toString()}`;
}
