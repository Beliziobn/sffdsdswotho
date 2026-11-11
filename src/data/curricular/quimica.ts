export const QUIMICA_BOOK = {
  id: "curr-quimica-geral-e-organica",
  title: "Química Essencial & Avançada: Estrutura Atômica, Físico-Química e Síntese Orgânica",
  subtitle: "Tratado Curricular Completo · Teoria Microscópica, Equações Balanceadas, Estequiometria e Mecanismos de Reação",
  author: "Profª. Dra. Luciana Mendes & Prof. Dr. Tiago Barcellos",
  discipline: "Química",
  grade_level: "Ensino Médio & Pré-Vestibular",
  description: "Tratado didático definitivo de Química Geral, Físico-Química, Química Inorgânica e Química Orgânica: Modelos Atômicos e Teoria Quântica, Tabela Periódica e Propriedades Periódicas, Ligações Químicas e Geometria Molecular VSEPR, Interações Intermoleculares, Cálculo Estequiométrico com Rendimento e Pureza, Soluções e Concentrações, Termoquímica e Lei de Hess, Cinética Química e Teoria das Colisões, Equilíbrio Químico e Iônico (pH, pOH, Solução Tampão), Eletroquímica (Pilhas e Eletrólise), Funções Orgânicas e Isomeria.",
  cover_url: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&auto=format&fit=crop&q=80",
  year: 2026,
  read_time: 410,
  downloads: 29800,
  rating: 4.96,
  rating_count: 1140,
  chapters: [
    {
      id: "qui-cap-1",
      position: 1,
      title: "Capítulo I — A Estrutura da Matéria: Da Teoria Atômica Clássica aos Orbitais Quânticos",
      is_free_preview: true,
      content: `### 1. Evolução Histórica dos Modelos Atômicos

A compreensão da matéria transitou de intuições metafísicas gregas para modelos probabilísticos refinados pela mecânica quântica:

1. **Modelo de Dalton (1808 — 'Bola de Bilhar'):**
   - O átomo é a menor partícula elementar da matéria, indivisível, indestrutível, maciço e esférico.
   - Elementos químicos distintos possuem átomos de massas e propriedades químicas distintas.
   - Reações químicas consistem na recombinação e rearranjo de átomos fixos.

2. **Modelo de Thomson (1897 — 'Pudim de Passas'):**
   - Descoberta do **elétron** através de experimentos com tubos de raios catódicos de William Crookes sob alta tensão e vácuo elevado.
   - O átomo é uma esfera homogênea de carga elétrica positiva na qual elétrons de carga negativa estão uniformemente incrustados. Primeiro modelo a provar a divisibilidade do átomo.

3. **Modelo de Rutherford (1911 — 'Sistema Planetário'):**
   - Experimento do bombardeamento de uma finíssima folha de ouro ($10^{-4}$ mm) com partículas alfa ($\alpha^{2+}$) emitidas pelo polônio radioativo.
   - Constatação: a maioria esmagadora das partículas atravessava a lâmina em linha reta sem desvios, enquanto uma fração ínfima sofria desvios violentos ou rebatia.
   - Conclusão: o átomo é constituído por um **núcleo central** extremamente denso e minúsculo de carga positiva, cercado por um imenso espaço vazio denominado **eletrosfera**, onde elétrons orbitam a distâncias gigantescas em relação ao raio nuclear ($R_{\\text{átomo}} \\approx 10^4 \\times R_{\\text{núcleo}}$).

4. **Modelo de Bohr (1913 — Quantização da Energia):**
   - Incorporação da teoria dos quanta de Max Planck aos postulados de Rutherford:
     - Os elétrons descrevem órbitas circulares estáveis e bem definidas ao redor do núcleo sem emitir radiação eletromagnética espontânea (estados estacionários).
     - O momento angular do elétron é quantizado: $L = m v r = n \\frac{h}{2\\pi}$, onde $n \\in \\{1, 2, 3, \\dots\\}$ é o número quântico principal.
     - Salto Quântico: ao absorver um fóton de energia precisa ($E = h \\cdot f$), o elétron salta para um nível energético mais externo (estado excitado). Ao retornar a um nível mais interno, emite um fóton de frequência idêntica à diferença entre os níveis:
$$\\Delta E = E_{\\text{final}} - E_{\\text{inicial}} = h \\cdot \\nu = \\frac{h \\cdot c}{\\lambda}$$
Isso explica com exatidão as raias discretas dos espectros de emissão do hidrogênio.

5. **Modelo Mecânico-Ondulatório (Schrödinger, de Broglie e Heisenberg — Orbitais):**
   - Dualidade onda-partícula de Louis de Broglie: $\\lambda = \\frac{h}{p} = \\frac{h}{m v}$.
   - Princípio da Incerteza de Werner Heisenberg: é impossível determinar com precisão absoluta simultânea a posição $x$ e o momento linear $p$ de um elétron: $\\Delta x \\cdot \\Delta p \\geq \\frac{h}{4\\pi}$.
   - O conceito determinístico de 'órbita' é substituído pelo conceito probabilístico de **orbital**: região do espaço ao redor do núcleo com densidade de probabilidade máxima ($\\geq 90\\%$) de encontrar o elétron, descrita pelo quadrado da função de onda $|\\psi|^2$.

### 2. Números Quânticos e Distribuição Eletrônica
- **Número Quântico Principal (n):** Determina o nível de energia e o tamanho do orbital ($n = 1, 2, 3, 4, 5, 6, 7$).
- **Número Quântico Secundário ou Azimutal (l):** Determina a forma geométrica do subnível ($l = 0 \\implies s$ esférico; $l = 1 \\implies p$ bilobular; $l = 2 \\implies d$ tetralobular; $l = 3 \\implies f$).
- **Número Quântico Magnético ($m_l$):** Orientação espacial do orbital (varia de $-l$ até $+l$).
- **Número Quântico de Spin ($m_s$ ou s):** Rotação intrínseca do elétron ($-1/2$ ou $+1/2$).
- **Princípio da Exclusão de Pauli:** Dois elétrons em um mesmo átomo não podem compartilhar os mesmos quatro números quânticos.
- **Regra de Hund (Princípio da Máxima Multiplicidade):** Em orbitais degenerados de mesma energia, os elétrons devem ser distribuídos primeiramente de modo a maximizar o número de spins paralelos desemparelhados antes de ocorrer o emparelhamento.`,
    },
    {
      id: "qui-cap-2",
      position: 2,
      title: "Capítulo II — Ligações Químicas, Geometria Molecular VSEPR e Forças Intermoleculares",
      is_free_preview: true,
      content: `### 1. Forças Intramoleculares (Ligações Químicas)

A estabilidade atômica é governada pela minimização da energia potencial eletrostática. Segundo a Regra do Octeto (Lewis), os átomos ligam-se buscando a configuração estável com 8 elétrons na camada de valência (ou 2, como o hélio).

1. **Ligação Iônica (Eletrovalente):**
   - Ocorre entre elementos com grande diferença de eletronegatividade ($\\Delta E > 1,7$), tipicamente metais alcalinos/alcalino-terrosos e não-metais/halogênios.
   - Há transferência definitiva de elétrons, formando cátions e ânions mantidos unidos por intensas atrações eletrostáticas multidirecionais em retículos cristalinos sólidos tridimensionais (ex: $\\text{NaCl}$, $\\text{CaF}_2$).
   - Propriedades: altos pontos de fusão e ebulição, condutividade elétrica exclusiva em solução aquosa ou fundidos.

2. **Ligação Covalente Molecular:**
   - Ocorre entre ametais e/ou hidrogênio, onde a diferença de eletronegatividade é insuficiente para arrancar elétrons.
   - Há compartilhamento mútuo de pares de elétrons em orbitais moleculares ligantes.
   - Ligação Covalente Coordenada (Dativa): o par de elétrons compartilhado provém inteiramente de um único átomo doador dotado de pares livres (ex: formação do cátion amônio $\\text{NH}_4^+$ e ozônio $\\text{O}_3$).

3. **Ligação Metálica:**
   - Ocorre entre átomos de metais. Devido à baixa energia de ionização, os elétrons da camada de valência deslocalizam-se livremente, formando um **'mar de elétrons'** deslocalizados que permeia uma rede rígida de cátions metálicos fixos.
   - Explica a alta condutibilidade elétrica e térmica, o brilho característico, a ductilidade (capacidade de formar fios) e a maleabilidade (capacidade de formar lâminas finas).

### 2. Teoria da Repulsão dos Pares Eletrônicos da Camada de Valência (VSEPR)
Os pares eletrônicos ligantes e não-ligantes (livres) ao redor do átomo central repelem-se mutuamente, adotando a geometria espacial que maximiza a distância angular entre eles:
- 2 nuvens eletrônicas: **Linear** (ângulo de $180^\\circ$, ex: $\\text{BeCl}_2$, $\\text{CO}_2$).
- 3 nuvens, 0 pares livres: **Trigonal Plana** (ângulo de $120^\\circ$, ex: $\\text{BF}_3$, $\\text{SO}_3$).
- 3 nuvens, 1 par livre: **Angular** (ângulo $\\approx 118^\\circ$, ex: $\\text{SO}_2$, $\\text{O}_3$).
- 4 nuvens, 0 pares livres: **Tetraédrica** (ângulo de $109^\\circ 28'$, ex: $\\text{CH}_4$, $\\text{SiCl}_4$).
- 4 nuvens, 1 par livre: **Piramidal** (ângulo $\\approx 107^\\circ$, ex: $\\text{NH}_3$, $\\text{PCl}_3$).
- 4 nuvens, 2 pares livres: **Angular** (ângulo de $104,5^\\circ$ devido à forte repulsão dos pares livres, ex: $\\text{H}_2\\text{O}$).

### 3. Forças Intermoleculares e Relação com Pontos de Ebulição
1. **Forças de London (Dipolo Induzido / Dispersão):** Presentes em todas as moléculas, mas determinantes nas apolares (ex: $\\text{O}_2$, $\\text{N}_2$, $\\text{CH}_4$, gases nobres). Flutuações instantâneas na nuvem eletrônica criam dipolos efêmeros. São as mais fracas.
2. **Dipolo-Dipolo Permanente:** Presentes em moléculas polares sem hidrogênio ligado a átomos fortemente eletronegativos (ex: $\\text{HCl}$, $\\text{SO}_2$, $\\text{H}_2\\text{S}$).
3. **Ligações de Hidrogênio:** Interação eletrostática forte e orientada que ocorre quando o hidrogênio está covalentemente ligado a átomos minúsculos e fortemente eletronegativos: Flúor (F), Oxigênio (O) ou Nitrogênio (N) (ex: $\\text{H}_2\\text{O}$, $\\text{HF}$, $\\text{NH}_3$, bases nitrogenadas do DNA). É responsável pelo elevado calor específico da água e por sua anomalia de densidade máxima a $4^\\circ\\text{C}$.`,
    },
    {
      id: "qui-cap-3",
      position: 3,
      title: "Capítulo III — Estequiometria Rigorosa: Leis Ponderais, Rendimento, Pureza e Reagente Limitante",
      is_free_preview: true,
      content: `### 1. As Leis Ponderais Fundamentais

- **Lei de Lavoisier (Conservação da Massa, 1789):** Em um sistema fechado, a massa total dos reagentes que se combinam é rigorosamente igual à massa total dos produtos formados:
$$\\sum m_{\\text{reagentes}} = \\sum m_{\\text{produtos}}$$
- **Lei de Proust (Proporções Definidas, 1799):** Uma determinada substância pura, qualquer que seja sua procedência, é sempre formada pelos mesmos elementos combinados na mesma proporção em massa.

### 2. O Conceito Fundamental de Mol e Massa Molar
- **1 Mol de qualquer entidade elementar** contém $N_A = 6,02214076 \\times 10^{23}$ entidades (Constante de Avogadro).
- A **Massa Molar ($M$)** de uma substância (em g/mol) é numericamente idêntica à sua massa molecular em unidades de massa atômica (u).
- Volume Molar de Gases Ideais nas CNTP ($0^\\circ\\text{C}$ e $1 \\text{ atm}$): $V_{\\text{molar}} = 22,4 \\text{ L/mol}$.

### 3. Algoritmo Analítico para Reagente Limitante e em Excesso
Quando reagentes são misturados fora da proporção estequiométrica exata, um deles consumirá totalmente primeiro, limitando a quantidade máxima de produto que pode ser sintetizada:
1. Calcule o número de mols $n_i$ de cada reagente disponível: $n = m / M$.
2. Divida o número de mols de cada reagente pelo seu respectivo coeficiente estequiométrico da equação devidamente balanceada:
$$R_i = \\frac{n_i}{\\text{coeficiente}_i}$$
3. O menor valor de $R_i$ identifica inequivocamente o **Reagente Limitante**.
4. **Todos os cálculos subsequentes de produtos teóricos devem ser baseados exclusivamente no reagente limitante.**
5. O reagente com maior $R_i$ está em **Excesso**, e a quantidade que sobra sem reagir é dada pela diferença estequiométrica.

### 4. Resolução de Problema Avançado Modelo ENEM / Fuvest
**Problema:** Misturam-se $100 \\text{ g}$ de hidróxido de sódio ($\\text{NaOH}$, $M = 40 \\text{ g/mol}$) com $98 \\text{ g}$ de ácido sulfúrico ($\\text{H}_2\\text{SO}_4$, $M = 98 \\text{ g/mol}$). A reação ocorre segundo a equação:
$$2\\text{NaOH} + \\text{H}_2\\text{SO}_4 \\to \\text{Na}_2\\text{SO}_4 + 2\\text{H}_2\\text{O}$$
Sabendo que o rendimento da síntese foi de $85\\%$, determine a massa real de sulfato de sódio ($\\text{Na}_2\\text{SO}_4$, $M = 142 \\text{ g/mol}$) obtida e a massa de reagente em excesso que sobrou.

**Resolução Detalhada:**
1. Mols de $\\text{NaOH}$ disponíveis: $n = 100 / 40 = 2,5 \\text{ mols}$.
2. Mols de $\\text{H}_2\\text{SO}_4$ disponíveis: $n = 98 / 98 = 1,0 \\text{ mol}$.
3. Teste do limitante:
   - Para $\\text{NaOH}$: $2,5 / 2 = 1,25$.
   - Para $\\text{H}_2\\text{SO}_4$: $1,0 / 1 = 1,00$.
Como $1,00 < 1,25$, o $\\text{H}_2\\text{SO}_4$ é o **Reagente Limitante**, e o $\\text{NaOH}$ está em excesso!
4. Consumo de $\\text{NaOH}$: $1,0 \\text{ mol de } \\text{H}_2\\text{SO}_4$ consome $2 \\times 1,0 = 2,0 \\text{ mols de NaOH}$.
   - Sobram sem reagir: $2,5 - 2,0 = 0,5 \\text{ mol de NaOH}$.
   - Massa de excesso: $0,5 \\times 40 = 20 \\text{ g de NaOH}$ permanecem intactos.
5. Produção teórica de $\\text{Na}_2\\text{SO}_4$:
   - $1,0 \\text{ mol de } \\text{H}_2\\text{SO}_4 \\to 1,0 \\text{ mol de } \\text{Na}_2\\text{SO}_4 = 142 \\text{ g (rendimento de 100%)}$.
6. Aplicando o rendimento real de $85\\%$:
$$m_{\\text{real}} = 142 \\times 0,85 = 120,7 \\text{ gramas de } \\text{Na}_2\\text{SO}_4$$`,
    },
    {
      id: "qui-cap-4",
      position: 4,
      title: "Capítulo IV — Equilíbrio Químico e Iônico: Kc, Kp, Le Chatelier, pH, pOH e Solução Tampão",
      is_free_preview: true,
      content: `### 1. O Estado de Equilíbrio Dinâmico

Em sistemas fechados com reações reversíveis ($aA + bB \\rightleftharpoons cC + dD$), o equilíbrio químico é atingido quando a velocidade da reação direta ($v_d = k_d [A]^a [B]^b$) se iguala numericamente à velocidade da reação inversa ($v_i = k_i [C]^c [D]^d$).
No equilíbrio:
- As propriedades macroscópicas (concentrações, pressão, cor) tornam-se constantes no tempo.
- Microscopicamente, a reação continua ocorrendo incessantemente nos dois sentidos (equilíbrio dinâmico).

#### Constantes de Equilíbrio:
- Em termos de concentrações em quantidade de matéria ($K_c$):
$$K_c = \\frac{[C]^c [D]^d}{A^a [B]^b}$$
Substâncias puras no estado sólido ($s$) e solventes puros no estado líquido ($l$) possuem atividade unitária constante e **não entram na expressão de $K_c$**.
- Em termos de pressões parciais ($K_p$ para sistemas gasosos):
$$K_p = \\frac{(p_C)^c (p_D)^d}{(p_A)^a (p_B)^b} = K_c \\cdot (R T)^{\\Delta n}$$
onde $\\Delta n = (c + d) - (a + b)$ é a variação do número de mols gasosos.

### 2. O Princípio de Le Chatelier
Se um sistema em equilíbrio for submetido a uma perturbação externa (alteração de concentração, temperatura ou pressão), ele deslocará seu equilíbrio no sentido que tende a atenuar os efeitos dessa perturbação:
1. **Concentração:**
   - Adicionar uma espécie desloca o equilíbrio para o lado oposto (para consumi-la).
   - Retirar uma espécie desloca o equilíbrio para o mesmo lado (para repô-la).
2. **Pressão Total (por variação de volume em sistemas gasosos):**
   - Aumento de pressão desloca o equilíbrio em direção ao menor volume gasoso (menor número de mols de gás).
   - Diminuição de pressão desloca em direção ao maior volume gasoso.
3. **Temperatura (A ÚNICA perturbação que altera o valor numérico de K):**
   - Aumento de temperatura favorece o sentido endotérmico ($\\Delta H > 0$).
   - Diminuição de temperatura favorece o sentido exotérmico ($\\Delta H < 0$).
*Nota Importante:* A adição de um **catalisador** apenas diminui a energia de ativação e aumenta igualmente as velocidades direta e inversa, reduzindo o tempo para atingir o equilíbrio, mas **não altera as concentrações de equilíbrio nem o valor de K**.

### 3. Equilíbrio Iônico da Água, Escala de pH e Solução Tampão
A autoionização da água obedece a:
$$2\\text{H}_2\\text{O}(l) \\rightleftharpoons \\text{H}_3\\text{O}^+(aq) + \\text{OH}^-(aq)$$
O produto iônico da água a $25^\\circ\\text{C}$ é:
$$K_w = [\\text{H}^+][\\text{OH}^-] = 1,0 \\times 10^{-14}$$
Definição de Sørensen para pH e pOH:
$$\\text{pH} = -\\log_{10}[\\text{H}^+] \\quad \\text{e} \\quad \\text{pOH} = -\\log_{10}[\\text{OH}^-]$$
$$\\text{pH} + \\text{pOH} = 14 \\quad (\\text{a } 25^\\circ\\text{C})$$
- Meio Neutro: $[\\text{H}^+] = [\\text{OH}^-] = 10^{-7} \\implies \\text{pH} = 7$
- Meio Ácido: $[\\text{H}^+] > 10^{-7} \\implies \\text{pH} < 7$
- Meio Básico / Alcalino: $[\\text{H}^+] < 10^{-7} \\implies \\text{pH} > 7$

#### Solução Tampão (Equação de Henderson-Hasselbalch):
Mistura formada por um ácido fraco e seu sal de base forte (ex: $\\text{CH}_3\\text{COOH} / \\text{CH}_3\\text{COONa}$), ou uma base fraca e seu sal correspondente, que resiste a variações bruscas de pH perante a adição de pequenas quantidades de ácidos fortes ou bases fortes:
$$\\text{pH} = \\text{p}K_a + \\log_{10}\\left(\\frac{[\\text{base conjugada}]}{[\\text{ácido fraco}]}\\right)$$
O sangue humano é tamponado pelo sistema carbônico/bicarbonato ($\text{H}_2\\text{CO}_3 / \\text{HCO}_3^-$) na faixa vital de $\\text{pH} = 7,35 - 7,45$.`,
    },
    {
      id: "qui-cap-5",
      position: 5,
      title: "Capítulo V — Química Orgânica: Postulados de Kekulé, Funções Orgânicas e Reações Fundamentais",
      is_free_preview: true,
      content: `### 1. Os Postulados Fundamentais de Kekulé e Hibridização do Carbono

O átomo de carbono ($Z = 6$, $1s^2 2s^2 2p^2$) possui 4 elétrons na camada de valência e fundamenta a Química Orgânica por meio de três características singulares:
1. **Tetravalência Constante:** O carbono sempre realiza quatro ligações covalentes para atingir o octeto.
2. **As quatro valências simples são equivalentes no espaço:** Não importa qual posição um substituinte ocupe no metano, o composto é idêntico.
3. **Formação de Cadeias Estáveis:** O carbono tem a capacidade ímpar de ligar-se covalentemente a outros átomos de carbono formando longas cadeias contínuas, ramificadas ou cíclicas.

#### Estados de Hibridização do Carbono:
- **$sp^3$:** 4 ligações simples ($\sigma$). Geometria **tetraédrica** com ângulos de $109^\\circ 28'$. Ex: alcanos.
- **$sp^2$:** 2 ligações simples ($\sigma$) e 1 ligação dupla (formada por 1 $\\sigma$ e 1 $\\pi$). Geometria **trigonal plana** com ângulos de $120^\\circ$. Ex: alcenos.
- **$sp$:** 1 ligação simples e 1 ligação tripla (1 $\\sigma$ e 2 $\\pi$) ou 2 duplas consecutivas. Geometria **linear** com ângulos de $180^\\circ$. Ex: alcinos.

### 2. Guia Sistemático das Funções Orgânicas Oxigenadas e Nitrogenadas
- **Hidrocarbonetos:** Apenas C e H. Alcanos (parafinas), Alcenos (olefinas), Alcinos e Aromáticos (Benzeno com ressonância $\\pi$).
- **Álcoois:** Hidroxila ($-OH$) ligada a carbono saturado $sp^3$. Nomenclatura com terminação *-ol*. Ex: etanol ($\text{CH}_3\\text{CH}_2\\text{OH}$).
- **Fenóis:** Hidroxila ligada diretamente a um anel benzênico aromático ($\text{Ar}-OH$). Possuem caráter ácido fraco.
- **Éteres:** Oxigênio como heteroátomo entre dois radicais carbônicos ($R-O-R'$). Ex: etoxietano (éter comum).
- **Aldeídos:** Carbonila terminal ($R-\\text{CHO}$). Nomenclatura com terminação *-al*. Ex: metanal (formol).
- **Cetonas:** Carbonila entre dois carbonos ($R-\\text{CO}-R'$). Nomenclatura com terminação *-ona*. Ex: propanona (acetona).
- **Ácidos Carboxílicos:** Grupo carboxila terminal ($R-\\text{COOH}$). Caráter ácido acentuado pela estabilização por ressonância do ânion carboxilato. Nomenclatura com terminação *-oico*. Ex: ácido etanoico (ácido acético).
- **Ésteres:** Formados pela reação de esterificação entre um ácido carboxílico e um álcool:
$$R-\\text{COOH} + R'-\\text{OH} \\overset{\\text{H}^+}{\\rightleftharpoons} R-\\text{COO}-R' + \\text{H}_2\\text{O}$$
Responsáveis pelas fragrâncias florais e aromatizantes artificiais de frutas.
- **Aminas:** Derivadas da amônia por substituição de hidrogênios por radicais ($R-\\text{NH}_2$, $R_2\\text{NH}$, $R_3\\text{N}$). Caráter básico decorrente do par de elétrons livre no nitrogênio.
- **Amidas:** Grupo acila ligado ao nitrogênio ($R-\\text{CO}-\\text{NH}_2$). Base das ligações peptídicas que unem aminoácidos em proteínas biológicas.`,
    },
  ],
};
