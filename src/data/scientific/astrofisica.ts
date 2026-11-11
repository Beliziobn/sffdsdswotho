export const ASTROFISICA_ARTICLE = {
  id: "sci-astrofisica-james-webb-galaxias",
  title: "Espectroscopia de Galáxias Primitivas no Amanhecer Cósmico (z > 10) pelo Telescópio Espacial James Webb",
  subtitle: "Artigo Científico Peer-Reviewed · Astrofísica Observacional & Cosmologia do Universo Primitivo",
  author: "Dr. Ethan K. Vance, Dra. Mirella S. Tanaka & Dr. Johann Richter",
  institution: "Observatório Astrofísico & Consórcio Internacional JWST NIRSpec JADES",
  field: "Astrofísica",
  doi: "10.3847/1538-4357/ad1902",
  description: "Análise espectroscópica infravermelha profunda com NIRSpec e NIRCam a bordo do James Webb Space Telescope (JWST) confirmando redshifts cosmológicos z = 10,60 a 13,18 no campo profundo JADES. Os dados revelam luminosidades ultravioletas anômalas, metalicidade inesperada de carbono e densidades numéricas de galáxias luminosas que impõem testes severos ao modelo cosmológico padrão Lambda-CDM e às taxas de formação estelar.",
  cover_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
  published_at: "2026-01-20",
  read_time: 80,
  peer_reviewed: true,
  downloads: 31200,
  rating: 4.98,
  rating_count: 1040,
  chapters: [
    {
      id: "sci-astro-1",
      position: 1,
      title: "1. Abstract Estruturado & O Amanhecer Cósmico",
      is_free_preview: true,
      content: `### RESUMO ESTRUTURADO

**Contexto:** O período situado entre 200 e 500 milhões de anos após o Big Bang marca a Época da Reionização, durante a qual as primeiras fontes luminosas — estrelas primordiais de População III de massa extrema e os primeiros núcleos ativos de galáxias (AGN) — ionizaram o hidrogênio neutro intergaláctico. Até o lançamento e comissionamento do Telescópio Espacial James Webb (JWST), o regime cosmológico com desvio para o vermelho (*redshift*) $z > 10$ era inacessível a medições espectroscópicas diretas de alta resolução.

**Objetivo:** Obter confirmação espectroscópica inequívoca da quebra de Lyman-alfa e caracterizar as propriedades físicas fundamentais (massa estelar, metalicidade, atenuação por poeira e taxa de formação de estrelas) de quatro galáxias candidatas ultradistantes identificadas no levantamento JADES (*JWST Advanced Deep Extragalactic Survey*).

**Métodos:** Utilizamos a matriz de micro-obturadores (MSA) do espectrógrafo de infravermelho próximo NIRSpec configurada em dispersão de prisma de baixa resolução ($R \\sim 100$, cobertura de $0,6 \\text{ a } 5,3 \\text{ }\\mu\\text{m}$) e redes de difração de média resolução G140M/F070LP e G235M/F170LP ($R \\sim 1000$). O tempo total de integração acumulado no campo profundo do Hubble Ultra Deep Field foi de $28,4 \\text{ horas}$.

**Resultados:** Confirmamos espectroscopicamente as galáxias JADES-GS-z10-1 ($z = 10,60 \\pm 0,01$), JADES-GS-z11-0 ($z = 11,58 \\pm 0,02$), JADES-GS-z12-0 ($z = 12,11 \\pm 0,01$) e a recordista mundial JADES-GS-z13-0 ($z = 13,18 \\pm 0,01$, observada meros 325 milhões de anos após o Big Bang). A luminosidade ultravioleta no referencial de repouso ($M_{\\text{UV}} \\approx -20,8$) implica uma densidade volumétrica de galáxias superbrilhantes uma ordem de magnitude superior às predições dos modelos cosmológicos convencionais baseados em simulações hidrodinâmicas semi-analíticas.

**Palavras-Chave:** Astrofísica, Cosmologia, James Webb Space Telescope, NIRSpec, Redshift, Universo Primitivo, Reionização.`,
    },
    {
      id: "sci-astro-2",
      position: 2,
      title: "2. Introdução: O Paradigma Lambda-CDM e o Mistério da Formação de Estruturas",
      is_free_preview: true,
      content: `### 2. O Modelo Cosmológico de Concordância e o Limite Teórico

No modelo cosmológico padrão $\\Lambda\\text{CDM}$ (Energia Escura Lambda + Matéria Escura Fria), a evolução das estruturas em larga escala decorre do colapso gravitacional hierárquico (*bottom-up*) de perturbações primordiais de densidade da matéria escura geradas durante a inflação cósmica.
A relação cosmológica fundamental entre o desvio para o vermelho $z$ e o fator de escala do Universo $a(t)$ é dada por:
$$1 + z = \\frac{a(t_{\\text{obs}})}{a(t_{\\text{em}})} = \\frac{\\lambda_{\\text{obs}}}{\\lambda_{\\text{repouso}}}$$
Para $z = 13,18$, o Universo tinha apenas $1/14,18$ do seu tamanho linear atual, correspondendo a uma idade cósmica de $t \\approx 325 \\text{ milhões de anos}$ (admitindo os parâmetros de Planck 2018: $H_0 = 67,4 \\text{ km/s/Mpc}$, $\\Omega_m = 0,315$, $\\Omega_\\Lambda = 0,685$).

#### O Problema da Sobrabundância de Galáxias Brilhantes
De acordo com a função de massa de halos de Sheth-Tormen, halos de matéria escura de massa superior a $M_{\\text{halo}} > 10^{10} M_\\odot$ em $z \\sim 13$ deveriam ser eventos estatísticos excepcionalmente raros (flutuações de densidade gaussianas de $4\\sigma$ a $5\\sigma$).
Se a eficiência de conversão de gás barriônico em estrelas for a mesma do Universo local ($\epsilon_{\\text{SF}} \\sim 0,1$), a densidade de galáxias ultravioletas observadas pelo JWST viola os limites matemáticos da quantidade de matéria barriônica disponível nos halos colapsados, abrindo um debate cosmológico sem precedentes:
1. **Eficiência Estelar Extrema:** Em ambientes de gás primordial livre de poeira e sob pressões extremas, a formação de estrelas ocorreria com $\epsilon_{\\text{SF}} \\to 1,0$ (quase todo o gás colapsa em estrelas sem retroalimentação de supernovas que o expila);
2. **Função de Massa Inicial Top-Heavy (IMF):** Predomínio maciço de estrelas hipermassivas ($50 \\text{ a } 200 M_\\odot$) de População III, cuja emissão de radiação ultravioleta ionizante por unidade de massa estelar é até 5 vezes superior à das estrelas modernas (IMF de Salpeter);
3. **Buracos Negros Primordiais e AGN Minúsculos:** A radiação emitida pelo disco de acreção em torno de buracos negros de massa intermediária ($10^4 - 10^6 M_\\odot$) simulando a luz estelar estendida.`,
    },
    {
      id: "sci-astro-3",
      position: 3,
      title: "3. Redução de Dados NIRSpec, Micro-obturadores e Calibração Espectral",
      is_free_preview: true,
      content: `### 3. Aquisição Instrumental e Pipeline de Calibração

O NIRSpec opera no ponto Lagrange L2 a uma temperatura criogênica passiva de $\\approx 37 \\text{ K}$.
- **Micro-Shutter Array (MSA):** Matriz configurável contendo $250.000$ micro-obturadores mecânicos operados eletromagneticamente. Cada obturador mede $100 \\times 200 \\text{ }\\mu\\text{as}$, permitindo espectroscopia simultânea de centenas de objetos astronômicos com eliminação quase total do ruído de fundo celeste zodiacal.
- **Identificação da Quebra de Lyman:** O hidrogênio neutro intergaláctico atua como um absorvedor óptico absoluto para todos os fótons com energia superior ao limite de ionização de Lyman ($13,6 \\text{ eV}$, $\\lambda_{\\text{repouso}} = 91,2 \\text{ nm}$) e na linha de ressonância Lyman-$\\alpha$ ($121,57 \\text{ nm}$). Isso gera um degrau nítido no espectro (*Lyman break*): o fluxo fotométrico cai abruptamente a zero para comprimentos de onda inferiores a:
$$\\lambda_{\\text{quebra, obs}} = (1 + z) \\times 121,57 \\text{ nm}$$
Para o sistema JADES-GS-z13-0, a quebra foi detectada com altíssima significância estatística ($> 18\\sigma$) em $\\lambda = 1,724 \\text{ }\\mu\\text{m}$, fixando $z = 13,18$.

#### Tratamento de Ruído e Efeitos Sistemáticos:
A redução dos dados utilizou a versão 1.12.4 da pipeline STScI com algoritmos especializados para correção de *snowballs* (impactos energéticos de raios cósmicos que saturam grupos de pixels nos detectores Teledyne H2RG) e remoção de radiação espalhada parasita nos canais ópticos do prisma.`,
    },
    {
      id: "sci-astro-4",
      position: 4,
      title: "4. Análise Espectral: Metalicidade, Poeira e Linhas de Emissão de Alta Energia",
      is_free_preview: true,
      content: `### 4. Resultados Espectroscópicos e Propriedades Físicas

#### Propriedades Fotométricas e Físicas das Galáxias Analisadas:
1. **JADES-GS-z13-0 ($z = 13,18$):**
   - Magnitude absoluta ultravioleta: $M_{\\text{UV}} = -20,8 \\pm 0,1$.
   - Massa estelar estimada por ajuste espectral SED: $M_* \\approx 4 \\times 10^8 M_\\odot$.
   - Inclinação espectral ultravioleta ($f_\\lambda \\propto \\lambda^\\beta$): $\\beta = -2,58 \\pm 0,08$. Esse valor extremamente azul e íngreme é característico de populações estelares hiper-jovens desprovidas de atenuação por poeira interestelar ($A_V < 0,02 \\text{ mag}$).
   - Taxa de Formação Estelar (SFR): $\\approx 8 \\text{ } M_\\odot/\\text{ano}$, o que representa uma atividade específica de formação estelar ($sSFR = SFR / M_* \\approx 20 \\text{ Gyr}^{-1}$) extraordinariamente violenta para um objeto de raio efetivo compacto de apenas $R_e \\approx 120 \\text{ parsecs}$.

2. **Detecção de Linhas de Emissão de Carbono e Oxigênio em $z = 10,60$ (JADES-GS-z10-1):**
   No sistema $z = 10,60$, o espectro de média resolução ($R \\sim 1000$) revelou a presença de linhas de emissão de alta ionização:
   - Dupleto de C IV $\\lambda\\lambda 1548, 1550$ em $\\lambda_{\\text{obs}} = 1,797 \\text{ }\\mu\\text{m}$.
   - Linha semifibida C III] $\\lambda 1909$ e [O III] $\\lambda 5007$.
   A razão $[\\text{C IV}] / [\\text{C III}] > 1,5$ indica um campo de radiação ionizante de dureza incomum, requerendo energias de fótons superiores a $47,9 \\text{ eV}$. Essa dureza pode ser alimentada por estrelas Wolf-Rayet massivas pobres em metais ou pela emissão de raio-X suave proveniente do disco de acreção de um buraco negro em crescimento super-Eddington.
   A fração de metalicidade calculada foi de $Z \\approx 0,03 - 0,05 Z_\\odot$, provando que os primeiros ciclos de nucleossíntese estelar e enriquecimento químico de supernovas ocorreram com velocidade impressionante em menos de 400 milhões de anos.`,
    },
    {
      id: "sci-astro-5",
      position: 5,
      title: "5. Conclusões Cosmológicas, Testes a Lambda-CDM e Referências",
      is_free_preview: true,
      content: `### 5. Implicações Cosmológicas e Conclusão

Os dados espectroscópicos do JWST confirmam que o amanhecer cósmico foi consideravelmente mais ativo, luminoso e dinâmico do que o consenso teórico postulava antes de 2022.
Esses resultados não requerem a revogação do modelo $\\Lambda\\text{CDM}$ da relatividade geral, mas exigem uma reformulação substancial da física de gases densos e da termodinâmica de resfriamento molecular de $\\text{H}_2$ no regime de baixa metalicidade. O feedback negativo de supernovas (que no Universo moderno expulsa gás e interrompe a formação de estrelas) é ineficaz nos potenciais gravitacionais ultracompactos das proto-galáxias primordiais, permitindo a ignição continuada de explosões colossais de formação estelar.

### REFERÊNCIAS BIBLIOGRÁFICAS
1. Robertson, B. E., et al. (2023). Identification and properties of intense star-forming galaxies at redshifts z > 10. *Nature Astronomy*, 7(5), 611-621.
2. Curtis-Lake, E., et al. (2023). Spectroscopic confirmation of four galaxies at redshifts 10.3–13.2. *Nature Astronomy*, 7(5), 622-632.
3. Madau, P., & Dickinson, M. (2014). Cosmic star-formation history. *Annual Review of Astronomy and Astrophysics*, 52, 415-486.
4. Boylan-Kolchin, M. (2023). Stress testing ΛCDM with high-redshift galaxy candidates from JWST. *Nature Astronomy*, 7(6), 731-735.
5. Inayoshi, K., Visbal, E., & Haiman, Z. (2020). The assembly of the first massive black holes. *Annual Review of Astronomy and Astrophysics*, 58, 27-97.`,
    },
  ],
};
