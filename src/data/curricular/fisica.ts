export const FISICA_BOOK = {
  id: "curr-fisica-ensino-medio-completo",
  title: "Física Geral & Experimental: Da Mecânica Clássica ao Eletromagnetismo e Física Moderna",
  subtitle: "Tratado Curricular Completo · Leis Fundamentais, Deduções Físicas, Fenomenologia & Exercícios Comentados",
  author: "Prof. Dr. Carlos Eduardo Diniz & Prof. Dr. Arthur Ramos",
  discipline: "Física",
  grade_level: "Ensino Médio & Ensino Superior",
  description: "Manual didático profundo e enciclopédico de Física cobrindo Cinemática Escalar e Vetorial, Dinâmica Newtoniana, Gravitação Universal, Trabalho e Conservação de Energia, Quantidade de Movimento e Colisões, Estática e Hidrostática de Fluidos, Termologia, Teoria Cinética dos Gases e Leis da Termodinâmica, Óptica Geométrica e Ondulatória, Fenômenos Sonoros e Acústica, Eletrostática, Eletrodinâmica de Circuitos, Magnetismo, Indução Eletromagnética de Faraday e Introdução à Física Quântica e Relativística.",
  cover_url: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=1200&auto=format&fit=crop&q=80",
  year: 2026,
  read_time: 440,
  downloads: 32900,
  rating: 4.97,
  rating_count: 1260,
  chapters: [
    {
      id: "fis-cap-1",
      position: 1,
      title: "Capítulo I — Cinemática Escalar e Vetorial: Movimentos Uniformes, Variados e Balística",
      is_free_preview: true,
      content: `### 1. Grandezas Cinemáticas Fundamentais

A cinemática descreve a geometria do movimento no espaço e no tempo sem se preocupar com as causas dinâmicas (forças).
- **Posição e Deslocamento Escalar ($\\Delta S$):** $\\Delta S = S - S_0$.
- **Velocidade Escalar Média ($v_m$):** 
$$v_m = \\frac{\\Delta S}{\\Delta t}$$
Conversão fundamental: $1 \\text{ m/s} = 3,6 \\text{ km/h}$.
- **Velocidade Escalar Instantânea:** Definida rigorosamente como a derivada temporal da função horária da posição:
$$v(t) = \\lim_{\\Delta t \\to 0} \\frac{\\Delta S}{\\Delta t} = \\frac{dS}{dt}$$
- **Aceleração Escalar Instantânea:** Derivada temporal da velocidade:
$$a(t) = \\frac{dv}{dt} = \\frac{d^2S}{dt^2}$$

### 2. Movimento Retilíneo Uniforme (MRU) e Uniformemente Variado (MRUV)
- **No MRU ($a = 0$, $v = \\text{constante}$):**
$$S(t) = S_0 + v \\cdot t$$
O gráfico $S \\times t$ é uma reta com inclinação correspondente à velocidade. A área sob o gráfico $v \\times t$ é numericamente igual ao deslocamento escalar $\\Delta S$.

- **No MRUV ($a = \\text{constante} \\neq 0$):**
Função Horária da Velocidade:
$$v(t) = v_0 + a \\cdot t$$
Função Horária da Posição (obtida por integração):
$$S(t) = S_0 + v_0 \\cdot t + \\frac{1}{2} a \\cdot t^2$$
Equação de Torricelli (eliminação do parâmetro temporal):
$$v^2 = v_0^2 + 2a \\Delta S$$

### 3. Cinemática Vetorial e Lançamento Oblíquo no Vácuo (Balística de Galileu)
No lançamento de um projétil com velocidade inicial $v_0$ e ângulo de tiro $\\theta$ em relação ao solo horizontal (sob aceleração da gravidade $g$ vertical para baixo):
O movimento se decompõe em dois movimentos independentes (Princípio de Simultaneidade de Galileu):
- **Eixo Horizontal (x) — MRU:**
$$v_{0x} = v_0 \\cos(\\theta)$$
$$x(t) = (v_0 \\cos(\\theta)) \\cdot t$$
- **Eixo Vertical (y) — MRUV com $a = -g$:**
$$v_{0y} = v_0 \\sin(\\theta)$$
$$v_y(t) = v_0 \\sin(\\theta) - g t$$
$$y(t) = (v_0 \\sin(\\theta)) t - \\frac{1}{2} g t^2$$

#### Fórmulas Canônicas Derivadas:
1. **Tempo de Subida ($t_s$):** Ocorre quando $v_y = 0$:
$$t_s = \\frac{v_0 \\sin(\\theta)}{g} \\implies \\text{Tempo Total de Voo } T_{\\text{voo}} = 2t_s = \\frac{2v_0 \\sin(\\theta)}{g}$$
2. **Altura Máxima ($H_{\\text{max}}$):**
$$H_{\\text{max}} = \\frac{v_{0y}^2}{2g} = \\frac{v_0^2 \\sin^2(\\theta)}{2g}$$
3. **Alcance Horizontal Máximo (A):**
$$A = v_{0x} \\cdot T_{\\text{voo}} = (v_0 \\cos(\\theta)) \\cdot \\frac{2v_0 \\sin(\\theta)}{g} = \\frac{v_0^2 \\sin(2\\theta)}{g}$$
O alcance é máximo quando $\\sin(2\\theta) = 1 \\implies 2\\theta = 90^\\circ \\implies \\theta = 45^\\circ$. Para dois ângulos complementares $(\\theta_1 + \\theta_2 = 90^\\circ)$, os alcances horizontais são idênticos.`,
    },
    {
      id: "fis-cap-2",
      position: 2,
      title: "Capítulo II — Dinâmica Newtoniana: As Três Leis do Movimento, Forças de Atrito e Dinâmica Curvilínea",
      is_free_preview: true,
      content: `### 1. Os Três Axiomas Fundamentais de Isaac Newton (1687)

1. **Primeira Lei (Princípio da Inércia):** Todo corpo persevera em seu estado de repouso ou de movimento retilíneo uniforme a menos que seja compelido a mudar seu estado por forças externas resultantes aplicadas sobre ele. A massa inercial é a medida quantitativa da resistência que um corpo oferece à aceleração.
$$\\sum \\vec{F} = \\vec{0} \\iff \\vec{v} = \\text{constante}$$

2. **Segunda Lei (Princípio Fundamental da Dinâmica):** A força resultante que atua sobre um corpo de massa constante é igual ao produto de sua massa pela aceleração vetorial adquirida:
$$\\vec{F}_{\\text{res}} = \\sum \\vec{F}_i = m \\cdot \\vec{a}$$
No Sistema Internacional: $[F] = \\text{kg} \\cdot \\text{m/s}^2 = \\text{Newton (N)}$.
Na forma geral de Euler-Newton, a força é a derivada temporal do momento linear $\\vec{p} = m \\vec{v}$:
$$\\vec{F} = \\frac{d\\vec{p}}{dt}$$

3. **Terceira Lei (Princípio da Ação e Reação):** A toda ação opõe-se sempre uma reação de igual intensidade e de sentido contrário; ou as ações mútuas de dois corpos um sobre o outro são sempre iguais e dirigidas a partes opostas:
$$\\vec{F}_{A \\to B} = - \\vec{F}_{B \\to A}$$
*Propriedades Críticas do Par Ação-Reação:*
- Têm a mesma natureza (ambas gravitacionais, ambas eletromagnéticas, etc.).
- Possuem módulos idênticos e mesma direção, mas sentidos opostos.
- **Atuam obrigatoriamente em corpos distintos**, logo nunca se equilibram nem se anulam mutuamente.

### 2. Forças Especiais da Mecânica Clássica
- **Força Peso ($\\vec{P}$):** A atração gravitacional local: $P = m \\cdot g$.
- **Força Normal ($\\vec{N}$):** Reação de contato perpendicular exercida por uma superfície comprimida.
- **Força Elástica e Lei de Hooke:** $F_{\\text{el}} = -k \\cdot x$, onde $k$ é a constante elástica da mola e $x$ é a deformação sofrida.

### 3. Modelo Fenomenológico do Atrito de Superfície
- **Atrito Estático ($f_e$):** Atua quando não há escorregamento relativo entre as superfícies. Varia de 0 até um valor máximo limite:
$$0 \\leq f_e \\leq f_{e,\\text{max}} = \\mu_e \\cdot N$$
onde $\\mu_e$ é o coeficiente de atrito estático.
- **Atrito Cinético ou Dinâmico ($f_c$):** Atua durante o deslizamento relativo efetivo. Tem valor aproximadamente constante:
$$f_c = \\mu_c \\cdot N \\quad (\\text{com } \\mu_c < \\mu_e)$$

### 4. Dinâmica no Movimento Curvilíneo
Em uma trajetória curva de raio de curvatura $R$, a aceleração se decompõe em componente tangencial $a_t = dv/dt$ e componente centrípeta $a_{cp} = v^2/R = \\omega^2 R$.
A resultante das forças na direção perpendicular à velocidade é a **Resultante Centrípeta**:
$$F_{cp} = m \\cdot \\frac{v^2}{R} = m \\cdot \\omega^2 \\cdot R$$
A força centrípeta não é um novo tipo de força física, mas sim o papel desempenhado pela resultante das forças reais (atrito de pneus em curvas, tração de fios em pêndulos, normal em lombadas ou gravidade em órbitas satelitais).`,
    },
    {
      id: "fis-cap-3",
      position: 3,
      title: "Capítulo III — Trabalho, Energia Mecânica e Teoremas de Conservação",
      is_free_preview: true,
      content: `### 1. Conceito Físico de Trabalho Mecânico ($\\tau$ ou W)

O trabalho mede a transferência ou transformação de energia efetuada por uma força ao longo de um deslocamento.
Para uma força constante $\\vec{F}$ atuando em um corpo que se desloca $\\vec{d}$:
$$\\tau = \\vec{F} \\cdot \\vec{d} = |F| \\cdot |d| \\cdot \\cos(\\theta)$$
- Se $0^\\circ \\leq \\theta < 90^\\circ$: $\\tau > 0$ (Trabalho Motor, a força fornece energia).
- Se $\\theta = 90^\\circ$: $\\tau = 0$ (Forças perpendiculares ao deslocamento, como a Normal em plano horizontal ou a Força Centrípeta, não realizam trabalho).
- Se $90^\\circ < \\theta \\leq 180^\\circ$: $\\tau < 0$ (Trabalho Resistente, como a força de atrito dissipando calor).

No caso geral de força variável, o trabalho é a integral de linha:
$$\\tau = \\int_{r_1}^{r_2} \\vec{F} \\cdot d\\vec{r}$$
Geometricamente, corresponde à área sob a curva no gráfico $F \\times d$.

### 2. Teorema da Energia Cinética (TEC)
A energia cinética é a energia associada ao estado de movimento de um corpo:
$$E_c = \\frac{1}{2} m v^2$$
O Teorema Fundamental estabelece que o trabalho de **todas** as forças (resultante) atuantes sobre um corpo equivale à variação de sua energia cinética:
$$\\tau_{\\text{res}} = \\Delta E_c = \\frac{1}{2} m v_f^2 - \\frac{1}{2} m v_0^2$$

### 3. Forças Conservativas e Energia Potencial
Uma força é denominada conservativa quando o trabalho realizado por ela entre dois pontos independe da trajetória percorrida (ex: força peso, força elástica, força eletrostática de Coulomb).
Para essas forças, define-se uma função energia potencial $U$ tal que $\\tau_{\\text{cons}} = -\\Delta U$:
- **Energia Potencial Gravitacional:** $E_{pg} = m \\cdot g \\cdot h$ (referencial no solo).
- **Energia Potencial Elástica:** $E_{pe} = \\frac{1}{2} k x^2$.

### 4. Princípio da Conservação da Energia Mecânica
A Energia Mecânica Total é a soma das energias cinética e potencial:
$$E_m = E_c + E_p$$
- **Em Sistemas Conservativos (sem forças dissipativas como atrito e resistência do ar):**
$$E_m(\\text{inicial}) = E_m(\\text{final}) \\implies \\Delta E_m = 0$$
- **Na Presença de Forças Não-Conservativas (Dissipativas):**
$$\\tau_{\\text{dissipativo}} = E_m(\\text{final}) - E_m(\\text{inicial}) = \\Delta E_m < 0$$
A energia mecânica perdida é integralmente degradada em energia térmica (calor) e sonora, satisfazendo o Primeiro Princípio Universal da Termodinâmica.`,
    },
    {
      id: "fis-cap-4",
      position: 4,
      title: "Capítulo IV — Termologia, Calorimetria e Leis Fundamentais da Termodinâmica",
      is_free_preview: true,
      content: `### 1. Temperatura, Equilíbrio Térmico e Escalas

- **Temperatura:** Medida microscópica do grau médio de agitação térmica das moléculas e átomos de um sistema.
- **Calor:** Energia térmica em trânsito espontâneo entre dois corpos impulsionada exclusivamente por uma diferença de temperatura entre eles.
- **Lei Zero da Termodinâmica:** Se um corpo A está em equilíbrio térmico com B, e B está em equilíbrio térmico com C, então A está em equilíbrio térmico com C. Isso permite a calibração de termômetros.
- **Escala Kelvin (Escala Absoluta):** O zero absoluto ($0 \\text{ K} = -273,15^\\circ\\text{C}$) representa o estado limite de cessação teórica da agitação cinética molecular.
$$T_{\\text{Kelvin}} = \\theta_{\\text{Celsius}} + 273,15$$

### 2. Calorimetria: Calor Sensível e Calor Latente
- **Equação Fundamental da Calorimetria (Calor Sensível):** Variação de temperatura sem mudança de estado físico:
$$Q = m \\cdot c \\cdot \\Delta T$$
onde $c$ é o calor específico da substância (para água líquida: $c = 1,0 \\text{ cal/g}^\\circ\\text{C} = 4184 \\text{ J/kg}\\cdot\\text{K}$) e $C = m \\cdot c$ é a capacidade térmica do corpo.
- **Calor Latente de Mudança de Fase:** Ocorre a temperatura rigorosamente constante para substâncias puras a pressão constante:
$$Q = m \\cdot L$$
onde $L$ é o calor latente de fusão ou vaporização (para gelo: $L_f = 80 \\text{ cal/g}$; para água: $L_v = 540 \\text{ cal/g}$).
- **Princípio da Conservação em Calorímetros Ideais:**
$$\\sum Q_{\\text{cedido}} + \\sum Q_{\\text{recebido}} = 0$$

### 3. As Leis da Termodinâmica e Ciclos Térmicos
1. **Primeira Lei da Termodinâmica (Conservação de Energia):**
$$\\Delta U = Q - W$$
onde $\\Delta U$ é a variação da energia interna do gás ideal (para gás monoatômico: $\\Delta U = \\frac{3}{2} n R \\Delta T$), $Q$ é o calor trocado com a vizinhança e $W = \\int P dV$ é o trabalho realizado pelo gás.
- Em transformações isobáricas ($P = \\text{const}$): $W = P \\cdot \\Delta V$.
- Em transformações isocóricas/isovolumétricas ($\\Delta V = 0$): $W = 0 \\implies \\Delta U = Q$.
- Em transformações isotérmicas ($\\Delta T = 0$): $\\Delta U = 0 \\implies Q = W = n R T \\ln(V_f / V_i)$.
- Em transformações adiabáticas ($Q = 0$): $\\Delta U = -W$.

2. **Segunda Lei da Termodinâmica (Entropia e Irreversibilidade):**
- Enunciado de Kelvin-Planck: É impossível construir uma máquina térmica que, operando em ciclos, retire calor de uma única fonte e o converta integralmente em trabalho mecânico (nenhuma máquina térmica pode ter rendimento de 100%).
- Enunciado de Clausius: O calor não pode fluir espontaneamente de um corpo frio para um corpo quente sem a realização de trabalho externo.
- **Rendimento Geral de Máquina Térmica:**
$$\\eta = \\frac{W}{Q_{\\text{quente}}} = \\frac{Q_q - Q_f}{Q_q} = 1 - \\frac{Q_{\\text{frio}}}{Q_{\\text{quente}}}$$
- **Ciclo Ideal de Carnot:** O ciclo termodinâmico de rendimento máximo teórico absoluto entre duas temperaturas absolutas $T_q$ e $T_f$:
$$\\eta_{\\text{Carnot}} = 1 - \\frac{T_f}{T_q}$$`,
    },
    {
      id: "fis-cap-5",
      position: 5,
      title: "Capítulo V — Eletrostática e Eletrodinâmica: Campos, Circuitos, Leis de Kirchhoff e Efeito Joule",
      is_free_preview: true,
      content: `### 1. Lei de Coulomb e Campo Eletrostático

A interação eletrostática entre duas cargas pontuais $q_1$ e $q_2$ separadas por uma distância $r$ no vácuo é regida pela Lei de Coulomb:
$$F_e = k_0 \\cdot \\frac{|q_1 \\cdot q_2|}{r^2}$$
onde $k_0 = \\frac{1}{4\\pi \\epsilon_0} \\approx 8,99 \\times 10^9 \\text{ N}\\cdot\\text{m}^2/\\text{C}^2$.
- O **Campo Elétrico ($\\vec{E}$)** gerado por uma carga fonte $Q$:
$$\\vec{E} = \\frac{\\vec{F}_e}{q} \\implies E = k_0 \\frac{|Q|}{r^2}$$
- O **Potencial Eletrostático (V)** é uma grandeza escalar:
$$V = k_0 \\frac{Q}{r}$$
A relação entre trabalho eletrostático e diferença de potencial: $\\tau_{A \\to B} = q(V_A - V_B) = q \\cdot U$.

### 2. Corrente Elétrica e Leis de Ohm
- **Intensidade da Corrente:**
$$i = \\frac{\\Delta q}{\\Delta t} = \\frac{n \\cdot e}{\\Delta t} \\quad (1 \\text{ A} = 1 \\text{ C/s})$$
onde $e = 1,602 \\times 10^{-19} \\text{ C}$ é a carga elementar do elétron.
- **Primeira Lei de Ohm:** Em condutores ôhmicos a temperatura constante:
$$U = R \\cdot i$$
- **Segunda Lei de Ohm (Resistência e Geometria do Condutor):**
$$R = \\rho \\cdot \\frac{L}{A}$$
onde $\\rho$ é a resistividade elétrica do material ($\\Omega \\cdot \\text{m}$), $L$ é o comprimento do fio e $A$ é a área de sua seção transversal.

### 3. Potência Elétrica e Efeito Joule
A transformação irreversível de energia elétrica em energia térmica devido às colisões microscópicas dos elétrons livres contra a rede cristalina do metal condutor é o Efeito Joule:
$$P = U \\cdot i = R \\cdot i^2 = \\frac{U^2}{R} \\quad (\\text{em Watts, W})$$
Consumo de Energia Comercial: $E = P \\cdot \\Delta t$ (em kWh, onde $1 \\text{ kWh} = 1000 \\text{ W} \\times 3600 \\text{ s} = 3,6 \\times 10^6 \\text{ J}$).

### 4. Circuitos Elétricos e Leis de Kirchhoff
1. **Lei dos Nós (Conservação da Carga):** A soma das correntes elétricas que chegam a qualquer nó é igual à soma das correntes que dele saem:
$$\\sum i_{\\text{entrada}} = \\sum i_{\\text{saída}}$$
2. **Lei das Malhas (Conservação de Energia):** A soma algébrica das diferenças de potencial (tensões e forças eletromotrizes) ao longo de qualquer malha fechada de um circuito elétrico é nula:
$$\\sum \\mathcal{E} - \\sum (R \\cdot i) = 0$$`,
    },
  ],
};
