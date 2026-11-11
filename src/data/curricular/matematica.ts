export const MATEMATICA_BOOK = {
  id: "curr-matematica-ensino-medio-completo",
  title: "Matemática Fundamental & Avançada para o Ensino Médio e Vestibulares",
  subtitle: "Tratado Curricular Completo · Teoria Rigorosa, Demonstrações, Problemas Resolvidos & Gabaritos",
  author: "Profª. Dra. Mariana Peixoto & Prof. Dr. Renato Silveira",
  discipline: "Matemática",
  grade_level: "Ensino Médio & Ensino Superior",
  description: "Tratado didático exaustivo cobrindo a totalidade da grade curricular de Matemática: Teoria dos Conjuntos, Funções Reais (Afim, Quadrática, Modular, Exponencial e Logarítmica), Trigonometria no Ciclo e Equações Trigonométricas, Progressões Aritméticas e Geométricas, Matrizes, Determinantes e Sistemas Lineares, Geometria Plana Euclidiana, Geometria Espacial Métrica e de Posição, Geometria Analítica, Análise Combinatória, Probabilidade e Estatística Descritiva com centenas de passos de resolução comentados.",
  cover_url: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1200&auto=format&fit=crop&q=80",
  year: 2026,
  read_time: 420,
  downloads: 38400,
  rating: 4.98,
  rating_count: 1420,
  chapters: [
    {
      id: "mat-cap-1",
      position: 1,
      title: "Capítulo I — Teoria dos Conjuntos, Conjuntos Numéricos e Intervalos na Reta Real",
      is_free_preview: true,
      content: `### 1. Fundamentos da Teoria dos Conjuntos

A Matemática moderna assenta-se sobre a linguagem rigorosa dos conjuntos, formalizada inicialmente por Georg Cantor no final do século XIX. Um conjunto é uma coleção bem definida de objetos, denominados elementos. Se um elemento x pertence a um conjunto A, escrevemos x ∈ A; caso contrário, x ∉ A.

#### Relações Fundamentais e Álgebra de Conjuntos
1. **Inclusão e Subconjuntos:** Dizemos que A é subconjunto de B (A ⊆ B) se, e somente se, todo elemento pertencente a A também pertence a B:
$$\\forall x, (x \\in A \\implies x \\in B)$$
Se A ⊆ B e A ≠ B, dizemos que A é um subconjunto próprio de B (A ⊂ B).

2. **União (A ∪ B):** Conjunto formado pelos elementos que pertencem a A, a B ou a ambos:
$$A \\cup B = \\{ x \\mid x \\in A \\lor x \\in B \\}$$

3. **Interseção (A ∩ B):** Conjunto dos elementos simultaneamente comuns a A e B:
$$A \\cap B = \\{ x \\mid x \\in A \\land x \\in B \\}$$
Se A ∩ B = ∅, A e B são denominados conjuntos disjuntos.

4. **Diferença e Complementar:** A diferença A \\ B é o conjunto dos elementos que pertencem a A mas não pertencem a B. Quando A é o conjunto universo U, o complementar de B em relação a U é denotado por B^c ou C_U(B).

5. **Leis de De Morgan:**
$$(A \\cup B)^c = A^c \\cap B^c$$
$$(A \\cap B)^c = A^c \\cup B^c$$

#### O Princípio da Inclusão-Exclusão
Para dois conjuntos finitos A e B, o número de elementos da união é dado por:
$$n(A \\cup B) = n(A) + n(B) - n(A \\cap B)$$
Para três conjuntos A, B e C:
$$n(A \\cup B \\cup C) = n(A) + n(B) + n(C) - n(A \\cap B) - n(A \\cap C) - n(B \\cap C) + n(A \\cap B \\cap C)$$

### 2. A Hierarquia dos Conjuntos Numéricos

A construção dos números obedece a uma extensão contínua imposta pela necessidade de resolver equações algébricas:

1. **Números Naturais (ℕ):** $\\mathbb{N} = \\{0, 1, 2, 3, 4, \\dots\\}$. Fechado sob adição e multiplicação, mas não sob subtração.
2. **Números Inteiros (ℤ):** $\\mathbb{Z} = \\{\\dots, -3, -2, -1, 0, 1, 2, 3, \\dots\\}$. Permite resolver equações do tipo $x + a = b$.
3. **Números Racionais (ℚ):** $\\mathbb{Q} = \\{ p/q \\mid p, q \\in \\mathbb{Z}, q \\neq 0 \\}$. Compreende as frações e as dízimas periódicas.
4. **Números Irracionais (𝕀 ou ℝ \\ ℚ):** Números cuja expansão decimal é infinita e não periódica (exemplos clássicos: $\\sqrt{2}$, $\\pi$, $e$, $\\phi = \\frac{1+\\sqrt{5}}{2}$).
5. **Demonstração Clássica da Irracionalidade de $\\sqrt{2}$ (Método de Redução ao Absurdo):**
Suponha, por contradição, que $\\sqrt{2}$ seja racional, isto é, $\\sqrt{2} = \\frac{p}{q}$, com $p, q \\in \\mathbb{Z}^*$ e $\\text{mdc}(p, q) = 1$ (fração irredutível).
Elevando ambos os membros ao quadrado:
$$2 = \\frac{p^2}{q^2} \\implies p^2 = 2q^2$$
Como $p^2$ é par, $p$ deve necessariamente ser par (pois o quadrado de um ímpar é sempre ímpar). Logo, podemos escrever $p = 2k$ para algum $k \\in \\mathbb{Z}$.
Substituindo:
$$(2k)^2 = 2q^2 \\implies 4k^2 = 2q^2 \\implies q^2 = 2k^2$$
Portanto, $q^2$ também é par, o que implica que $q$ é par.
Ora, se $p$ e $q$ são simultaneamente pares, ambos compartilham o fator 2, contradizendo a premissa de que $\\text{mdc}(p, q) = 1$. Conclui-se que $\\sqrt{2} \\notin \\mathbb{Q}$.

### 3. Intervalos Reais e Notação Topológica

Sejam $a, b \\in \\mathbb{R}$ com $a < b$:
- Intervalo Fechado: $[a, b] = \\{ x \\in \\mathbb{R} \\mid a \\leq x \\leq b \\}$
- Intervalo Aberto: $(a, b) = ]a, b[ = \\{ x \\in \\mathbb{R} \\mid a < x < b \\}$
- Intervalos Semiabertos: $[a, b) = \\{ x \\mid a \\leq x < b \\}$ e $(a, b] = \\{ x \\mid a < x \\leq b \\}$
- Intervalos Infinitos: $[a, +\\infty) = \\{ x \\mid x \\geq a \\}$, $(-\\infty, b) = \\{ x \\mid x < b \\}$

### 4. Resolução de Problemas Modelo Passo a Passo

**Problema 1 (FUVEST/UNICAMP adaptado):**
Em um colégio com 800 alunos, 420 estudam Francês, 360 estudam Alemão e 180 não estudam nenhum desses dois idiomas. 
a) Quantos alunos estudam simultaneamente ambos os idiomas?
b) Quantos alunos estudam exclusivamente Alemão?

**Resolução Detalhada:**
1. O universo é $U = 800$.
2. O número de alunos que estudam ao menos um dos idiomas é $n(F \\cup A) = U - 180 = 800 - 180 = 620$.
3. Aplicando a fórmula da união de dois conjuntos:
$$n(F \\cup A) = n(F) + n(A) - n(F \\cap A)$$
$$620 = 420 + 360 - n(F \\cap A)$$
$$620 = 780 - n(F \\cap A) \\implies n(F \\cap A) = 780 - 620 = 160$$
Portanto, 160 alunos estudam simultaneamente Francês e Alemão.
4. Para os que estudam exclusivamente Alemão:
$$n(A \\setminus F) = n(A) - n(F \\cap A) = 360 - 160 = 200$$
Resposta: a) 160 alunos; b) 200 alunos.`,
    },
    {
      id: "mat-cap-2",
      position: 2,
      title: "Capítulo II — Teoria Geral das Funções Reais: Definição, Domínio, Imagem e Classificação",
      is_free_preview: true,
      content: `### 1. Definição Formal de Função

Sejam A e B conjuntos não vazios. Uma função $f$ de A em B ($f: A \\to B$) é uma relação binária que associa a **cada** elemento $x \\in A$ um **único** elemento $y \\in B$.
- **Domínio de f ($D(f)$):** É o próprio conjunto de partida A.
- **Contradomínio de f ($CD(f)$):** É o conjunto de chegada B.
- **Imagem de f ($Im(f)$):** É o subconjunto de B constituído por todos os valores $y$ que correspondem a pelo menos um $x \\in A$:
$$Im(f) = \\{ y \\in B \\mid \\exists x \\in A, f(x) = y \\} \\subseteq B$$

#### Teste da Reta Vertical no Plano Cartesiano
Uma curva no plano $\\mathbb{R}^2$ representa o gráfico de uma função $y = f(x)$ se, e somente se, **toda reta vertical** traçada sobre o domínio intercepta a curva em **no máximo um ponto**. Se uma única reta vertical cortar a curva em dois ou mais pontos, não se trata de uma função.

### 2. Determinação de Domínio em Funções Reais de Variável Real

Ao trabalhar em $\\mathbb{R}$, as restrições algébricas canônicas exigem:
1. Denominadores não podem ser nulos: se $f(x) = \\frac{P(x)}{Q(x)}$, então $Q(x) \\neq 0$.
2. Radicandos de raízes de índice par devem ser não-negativos: se $f(x) = \\sqrt[2n]{g(x)}$, então $g(x) \\geq 0$.
3. Logaritmandos devem ser estritamente positivos e bases positivas diferentes de 1: se $f(x) = \\log_{b(x)}[g(x)]$, então $g(x) > 0$, $b(x) > 0$ e $b(x) \\neq 1$.

### 3. Classificação das Funções: Injetora, Sobrejetora e Bijetora

1. **Função Injetora (ou Injetiva):** Elementos distintos do domínio possuem imagens distintas:
$$\\forall x_1, x_2 \\in A, x_1 \\neq x_2 \\implies f(x_1) \\neq f(x_2)$$
Equivalente contrapositiva: $f(x_1) = f(x_2) \\implies x_1 = x_2$.
*Teste da Reta Horizontal:* Nenhuma reta horizontal intercepta o gráfico mais de uma vez.

2. **Função Sobrejetora (ou Sobrejetiva):** O conjunto imagem coincide com o contradomínio:
$$Im(f) = CD(f) \\iff \\forall y \\in B, \\exists x \\in A \\text{ tal que } f(x) = y$$

3. **Função Bijetora (ou Bijetiva):** É simultaneamente injetora e sobrejetora. 
*Teorema Fundamental:* Uma função $f: A \\to B$ admite função inversa $f^{-1}: B \\to A$ se, e somente se, $f$ for **bijetora**.
Graficamente, a curva de $f^{-1}$ é a reflexão simétrica da curva de $f$ em torno da reta bissetriz dos quadrantes ímpares ($y = x$).

### 4. Paridade de Funções
- **Função Par:** $f(-x) = f(x)$ para todo $x \\in D(f)$. O gráfico apresenta simetria axial em relação ao eixo das ordenadas (eixo y). Exemplos: $f(x) = x^2$, $f(x) = \\cos(x)$.
- **Função Ímpar:** $f(-x) = -f(x)$ para todo $x \\in D(f)$. O gráfico apresenta simetria central em relação à origem $(0, 0)$. Exemplos: $f(x) = x^3$, $f(x) = \\sin(x)$.

### 5. Composição de Funções (Função Composta)
Dadas $f: A \\to B$ e $g: B \\to C$, a composta $g \\circ f: A \\to C$ é definida por:
$$(g \\circ f)(x) = g(f(x))$$
A condição de existência da composta exige que $Im(f) \\subseteq D(g)$. Note que, em geral, a composição **não é comutativa**: $g \\circ f \\neq f \\circ g$.`,
    },
    {
      id: "mat-cap-3",
      position: 3,
      title: "Capítulo III — Função Afim: Coeficientes, Taxa de Variação, Equação da Reta e Inequações",
      is_free_preview: true,
      content: `### 1. Definição Algébrica e Significado Geométrico

Uma função $f: \\mathbb{R} \\to \\mathbb{R}$ é denominada função afim (ou polinomial do 1º grau) quando pode ser expressa na forma:
$$f(x) = ax + b \\quad (a, b \\in \\mathbb{R}, a \\neq 0)$$
- **Coeficiente Angular (a):** Representa a taxa de variação constante da função. Matematicamente:
$$a = \\frac{\\Delta y}{\\Delta x} = \\frac{f(x_2) - f(x_1)}{x_2 - x_1} = \\tan(\\theta)$$
onde $\\theta$ é o ângulo de inclinação da reta com o semieixo positivo das abscissas.
  - Se $a > 0$: a função é estritamente crescente em $\\mathbb{R}$ ($\\theta$ agudo).
  - Se $a < 0$: a função é estritamente decrescente em $\\mathbb{R}$ ($\\theta$ obtuso).
  - Se $a = 0$: a função é constante ($f(x) = b$, reta horizontal paralela ao eixo x).

- **Coeficiente Linear (b):** Representa o ponto onde a reta intercepta o eixo das ordenadas (eixo y), com coordenadas $(0, b)$.
- **Caso Particular — Função Linear:** Quando $b = 0$, $f(x) = ax$. O gráfico passa obrigatoriamente pela origem $(0, 0)$, caracterizando uma relação de proporcionalidade direta.

### 2. Zero ou Raiz da Função Afim
A raiz de $f(x) = ax + b$ é o valor de $x$ que anula a função:
$$f(x) = 0 \\implies ax + b = 0 \\implies x_0 = -\\frac{b}{a}$$
Geometricamente, $(-b/a, 0)$ é a interseção com o eixo x.

### 3. Estudo do Sinal da Função Afim
- Para $a > 0$: $f(x) < 0$ para $x < -b/a$; $f(x) = 0$ em $x = -b/a$; e $f(x) > 0$ para $x > -b/a$.
- Para $a < 0$: $f(x) > 0$ para $x < -b/a$; $f(x) = 0$ em $x = -b/a$; e $f(x) < 0$ para $x > -b/a$.

### 4. Inequações do 1º Grau, Inequações-Produto e Inequações-Quociente
Para resolver uma inequação do tipo:
$$\\frac{(2x - 6)(5 - x)}{x + 1} \\geq 0$$
utilizamos o quadro de sinais (quadro-varal):
1. Raiz de $f_1(x) = 2x - 6 \\implies x = 3$ (positiva para $x > 3$).
2. Raiz de $f_2(x) = 5 - x \\implies x = 5$ (positiva para $x < 5$, pois $a = -1 < 0$).
3. Raiz de $g(x) = x + 1 \\implies x = -1$ (positiva para $x > -1$). Condição de existência: $x \\neq -1$.
4. Traçando as linhas de sinal e multiplicando os sinais nos intervalos:
   - $x < -1$: $(-)(+)/(-) = +$ (convém)
   - $-1 < x < 3$: $(-)(+)/(+) = -$
   - $3 \\leq x \\leq 5$: $(+)(+)/(+) = +$ (convém)
   - $x > 5$: $(+)(-)/(+) = -$
Conjunto Solução: $S = (-\\infty, -1) \\cup [3, 5]$.`,
    },
    {
      id: "mat-cap-4",
      position: 4,
      title: "Capítulo IV — Função Quadrática: Dedução de Bhaskara, Vértice da Parábola e Otimização Extrema",
      is_free_preview: true,
      content: `### 1. Definição e Parábola

Uma função $f: \\mathbb{R} \\to \\mathbb{R}$ dada por:
$$f(x) = ax^2 + bx + c \\quad (a, b, c \\in \\mathbb{R}, a \\neq 0)$$
é denominada função quadrática (ou do 2º grau). O seu gráfico é uma parábola com eixo de simetria paralelo ao eixo vertical y.
- Se $a > 0$: a concavidade é voltada para cima (a função admite ponto de mínimo absoluto).
- Se $a < 0$: a concavidade é voltada para baixo (a função admite ponto de máximo absoluto).

### 2. Dedução Rigorosa da Fórmula das Raízes (Método do Completamento de Quadrados)
Considere $ax^2 + bx + c = 0$. Como $a \\neq 0$, dividimos toda a equação por $a$:
$$x^2 + \\frac{b}{a}x + \\frac{c}{a} = 0$$
Isolamos o termo constante no segundo membro:
$$x^2 + \\frac{b}{a}x = -\\frac{c}{a}$$
Para transformar o primeiro membro em um trinômio quadrado perfeito $(x + k)^2 = x^2 + 2kx + k^2$, adicionamos $(\\frac{b}{2a})^2 = \\frac{b^2}{4a^2}$ a ambos os membros:
$$x^2 + 2 \\cdot x \\cdot \\left(\\frac{b}{2a}\\right) + \\frac{b^2}{4a^2} = \\frac{b^2}{4a^2} - \\frac{c}{a}$$
$$\\left(x + \\frac{b}{2a}\\right)^2 = \\frac{b^2 - 4ac}{4a^2}$$
Definindo o discriminante $\\Delta = b^2 - 4ac$:
$$x + \\frac{b}{2a} = \\pm \\frac{\\sqrt{\\Delta}}{2a} \\implies x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$$

#### Discussão da Natureza das Raízes:
- $\\Delta > 0$: duas raízes reais e distintas ($x_1 \\neq x_2$), a parábola intercepta o eixo x em dois pontos.
- $\\Delta = 0$: duas raízes reais e iguais ($x_1 = x_2 = -b/(2a)$), a parábola é tangente ao eixo x.
- $\\Delta < 0$: nenhuma raiz real (raízes complexas conjugadas), a parábola não toca o eixo x.

### 3. Coordenadas do Vértice da Parábola e Problemas de Máximo e Mínimo
Pela simetria da parábola, a abscissa do vértice situa-se no ponto médio das raízes:
$$x_v = \\frac{x_1 + x_2}{2} = \\frac{-b/a}{2} = -\\frac{b}{2a}$$
A ordenada do vértice $y_v$ é o valor da função em $x_v$:
$$y_v = f(x_v) = a\\left(-\\frac{b}{2a}\\right)^2 + b\\left(-\\frac{b}{2a}\\right) + c = \\frac{ab^2}{4a^2} - \\frac{b^2}{2a} + c = -\\frac{b^2 - 4ac}{4a} = -\\frac{\\Delta}{4a}$$
Portanto:
$$V = \\left(-\\frac{b}{2a}, -\\frac{\\Delta}{4a}\\right)$$
- **Conjunto Imagem:**
  - Se $a > 0$: $Im(f) = [y_v, +\\infty) = [-\\Delta / 4a, +\\infty)$
  - Se $a < 0$: $Im(f) = (-\\infty, y_v] = (-\\infty, -\\Delta / 4a]$

### 4. Relações de Girard para Equações do 2º Grau
Sejam $x_1$ e $x_2$ as raízes de $ax^2 + bx + c = 0$:
- Soma ($S$): $x_1 + x_2 = -\\frac{b}{a}$
- Produto ($P$): $x_1 \\cdot x_2 = \\frac{c}{a}$
- Forma Fatorada: $f(x) = a(x - x_1)(x - x_2)$
- Forma Canônica do Vértice: $f(x) = a(x - x_v)^2 + y_v$`,
    },
    {
      id: "mat-cap-5",
      position: 5,
      title: "Capítulo V — Funções Exponenciais e Logaritmos: Propriedades, Equações e Modelagem de Crescimento",
      is_free_preview: true,
      content: `### 1. Potenciação e Função Exponencial

Dado um número real $a > 0$ e $a \\neq 1$, a função exponencial $f: \\mathbb{R} \\to \\mathbb{R}_+^*$ é definida por:
$$f(x) = a^x$$
- Se $a > 1$: $f(x)$ é estritamente crescente. Conforme $x \\to +\\infty$, $f(x) \\to +\\infty$; conforme $x \\to -\\infty$, $f(x) \\to 0^+$ (o eixo x é assíntota horizontal).
- Se $0 < a < 1$: $f(x)$ é estritamente decrescente.
- O gráfico intercepta sempre o eixo vertical em $(0, 1)$, visto que $a^0 = 1$ para todo $a \\neq 0$.
- O domínio é $\\mathbb{R}$ e o conjunto imagem é $\\mathbb{R}_+^* = (0, +\\infty)$.

### 2. A Teoria dos Logaritmos

O logaritmo é a operação inversa da exponenciação. Dados $a, b \\in \\mathbb{R}$ com $a > 0$, $a \\neq 1$ e $b > 0$:
$$\\log_a(b) = x \\iff a^x = b$$
onde $b$ é o logaritmando, $a$ é a base e $x$ é o logaritmo.

#### Propriedades Operatórias Fundamentais:
1. Logaritmo do Produto: $\\log_a(u \\cdot v) = \\log_a(u) + \\log_a(v)$
2. Logaritmo do Quociente: $\\log_a(u / v) = \\log_a(u) - \\log_a(v)$
3. Logaritmo da Potência: $\\log_a(u^k) = k \\cdot \\log_a(u)$
4. Mudança de Base:
$$\\log_a(b) = \\frac{\\log_c(b)}{\\log_c(a)}$$
5. Propriedade da Potência na Base: $\\log_{a^n}(b) = \\frac{1}{n} \\log_a(b)$
6. Identidade Notável: $a^{\\log_a(b)} = b$

### 3. O Número de Euler (e) e o Logaritmo Natural
O número irracional e transcendental $e \\approx 2,718281828...$ surge naturalmente do limite do cálculo de juros compostos contínuos:
$$e = \\lim_{n \\to \\infty} \\left(1 + \\frac{1}{n}\\right)^n = \\sum_{k=0}^{\\infty} \\frac{1}{k!} = 1 + 1 + \\frac{1}{2} + \\frac{1}{6} + \\frac{1}{24} + \\dots$$
O logaritmo na base $e$ é denominado **Logaritmo Natural** (ou Neperiano), denotado por $\\ln(x) = \\log_e(x)$.

### 4. Aplicação Prática: Lei de Decaimento Radioativo e Crescimento Populacional
A equação diferencial de Malthus estabelece que a taxa de variação de uma quantidade $N(t)$ é proporcional a ela própria:
$$\\frac{dN}{dt} = k N \\implies N(t) = N_0 \\cdot e^{kt}$$
- Se $k > 0$: crescimento exponencial contínuo (bactérias, contágio viral inicial).
- Se $k < 0$: decaimento exponencial (decaimento radiativo de Carbono-14, resfriamento de corpos pela Lei de Newton).`,
    },
    {
      id: "mat-cap-6",
      position: 6,
      title: "Capítulo VI — Trigonometria no Triângulo Retângulo e no Círculo Trigonométrico Universal",
      is_free_preview: true,
      content: `### 1. Razões Trigonométricas no Triângulo Retângulo
Seja um triângulo retângulo com ângulo agudo $\\alpha$, hipotenusa $a$, cateto oposto $b$ e cateto adjacente $c$:
- Seno: $\\sin(\\alpha) = \\frac{\\text{cateto oposto}}{\\text{hipotenusa}} = \\frac{b}{a}$
- Cosseno: $\\cos(\\alpha) = \\frac{\\text{cateto adjacente}}{\\text{hipotenusa}} = \\frac{c}{a}$
- Tangente: $\\tan(\\alpha) = \\frac{\\text{cateto oposto}}{\\text{cateto adjacente}} = \\frac{b}{c} = \\frac{\\sin(\\alpha)}{\\cos(\\alpha)}$

#### Valores Notáveis (30°, 45° e 60°):
- $\\sin(30^\\circ) = 1/2$, $\\cos(30^\\circ) = \\sqrt{3}/2$, $\\tan(30^\\circ) = \\sqrt{3}/3$
- $\\sin(45^\\circ) = \\sqrt{2}/2$, $\\cos(45^\\circ) = \\sqrt{2}/2$, $\\tan(45^\\circ) = 1$
- $\\sin(60^\\circ) = \\sqrt{3}/2$, $\\cos(60^\\circ) = 1/2$, $\\tan(60^\\circ) = \\sqrt{3}$

### 2. O Círculo Trigonométrico Universal
O ciclo trigonométrico é uma circunferência orientada de raio unitário ($R = 1$) centrada na origem $(0, 0)$ do plano cartesiano. O sentido anti-horário é convencionado como positivo.
- O eixo horizontal (eixo x) é o **Eixo dos Cossenos**.
- O eixo vertical (eixo y) é o **Eixo dos Senos**.
- A reta vertical $x = 1$ é o **Eixo das Tangentes**.

#### Relação Fundamental da Trigonometria:
Pela aplicação direta do Teorema de Pitágoras no triângulo retângulo de catetos $\\cos(x)$ e $\\sin(x)$ e hipotenusa $R = 1$:
$$\\sin^2(x) + \\cos^2(x) = 1$$
Dividindo ambos os membros por $\\cos^2(x)$:
$$\\tan^2(x) + 1 = \\sec^2(x)$$
Dividindo ambos os membros por $\\sin^2(x)$:
$$1 + \\cot^2(x) = \\csc^2(x)$$

### 3. Fórmulas de Adição, Subtração e Arco Duplo
- $\\sin(a \\pm b) = \\sin(a)\\cos(b) \\pm \\sin(b)\\cos(a)$
- $\\cos(a \\pm b) = \\cos(a)\\cos(b) \\mp \\sin(a)\\sin(b)$
- $\\tan(a \\pm b) = \\frac{\\tan(a) \\pm \\tan(b)}{1 \\mp \\tan(a)\\tan(b)}$

#### Arco Duplo:
- $\\sin(2a) = 2\\sin(a)\\cos(a)$
- $\\cos(2a) = \\cos^2(a) - \\sin^2(a) = 2\\cos^2(a) - 1 = 1 - 2\\sin^2(a)$
- $\\tan(2a) = \\frac{2\\tan(a)}{1 - \\tan^2(a)}$

### 4. Leis dos Senos e dos Cossenos em Triângulos Quaisquer
Em qualquer triângulo de lados $a, b, c$ e ângulos opostos $A, B, C$:
- **Lei dos Cossenos:**
$$a^2 = b^2 + c^2 - 2bc \\cos(A)$$
- **Lei dos Senos (com raio R da circunferência circunscrita):**
$$\\frac{a}{\\sin(A)} = \\frac{b}{\\sin(B)} = \\frac{c}{\\sin(C)} = 2R$$`,
    },
    {
      id: "mat-cap-7",
      position: 7,
      title: "Capítulo VII — Análise Combinatória: Princípios de Contagem, Permutações, Arranjos e Combinações",
      is_free_preview: true,
      content: `### 1. O Princípio Fundamental da Contagem (Regra do Produto)

Se uma decisão $D_1$ puder ser tomada de $m$ maneiras distintas e, subsequentemente, uma decisão $D_2$ puder ser tomada de $n$ maneiras distintas, o número total de maneiras consecutivas de tomar as decisões $D_1$ e $D_2$ é $m \\times n$.

### 2. Permutações Simples e com Repetição
- **Permutação Simples ($P_n$):** Reagrupamento ordenado de todos os $n$ elementos disponíveis:
$$P_n = n! = n \\times (n-1) \\times (n-2) \\times \\dots \\times 2 \\times 1$$
Convenciona-se $0! = 1$.

- **Permutação com Repetição ($P_n^{\\alpha, \\beta, \\dots}$):** Quando certos elementos se repetem:
$$P_n^{\\alpha, \\beta, \\gamma} = \\frac{n!}{\\alpha! \\cdot \\beta! \\cdot \\gamma!}$$
Exemplo clássico: anagramas da palavra BANANA ($n = 6$, 3 A's, 2 N's, 1 B):
$$P_6^{3, 2} = \\frac{6!}{3! \\cdot 2!} = \\frac{720}{6 \\cdot 2} = 60$$

- **Permutação Circular ($PC_n$):** Disposição de $n$ elementos ao redor de uma mesa circular, onde rotações simples não geram novas disposições:
$$PC_n = \\frac{n!}{n} = (n-1)!$$

### 3. Arranjos Simples vs. Combinações Simples
A distinção basilar que decide a escolha da ferramenta combinatória é: **A ordem dos elementos no agrupamento faz diferença?**
- Se SIM (a ordem importa, como senhas, pódios, cargos diferenciados): **Arranjo**.
- Se NÃO (a ordem não importa, como comissões, equipes, sorteio de dezenas): **Combinação**.

#### Fórmulas Algébricas:
- **Arranjo Simples ($A_{n, p}$):** Escolha ordenada de $p$ elementos dentre $n$ distintos ($p \\leq n$):
$$A_{n, p} = \\frac{n!}{(n - p)!}$$

- **Combinação Simples ($C_{n, p}$ ou $\\binom{n}{p}$):** Seleção de $p$ elementos dentre $n$ onde a ordem é irrelevante:
$$C_{n, p} = \\binom{n}{p} = \\frac{n!}{p!(n - p)!}$$

### 4. O Triângulo de Pascal e o Binômio de Newton
Os coeficientes binomiais $\\binom{n}{p}$ organizam-se no Triângulo de Pascal, cuja propriedade estrutural básica é a Relação de Stifel:
$$\\binom{n}{p} + \\binom{n}{p+1} = \\binom{n+1}{p+1}$$
Pelo Teorema do Binômio de Newton:
$$(x + y)^n = \\sum_{k=0}^{n} \\binom{n}{k} x^{n-k} y^k$$
O termo geral de ordem $k+1$ é dado por:
$$T_{k+1} = \\binom{n}{k} x^{n-k} y^k$$`,
    },
    {
      id: "mat-cap-8",
      position: 8,
      title: "Capítulo VIII — Geometria Espacial Métrica: Poliedros de Platão, Prismas, Cilindros, Cones e Esferas",
      is_free_preview: true,
      content: `### 1. Poliedros e Relação de Euler

Um poliedro é uma figura geométrica tridimensional limitada por faces poligonais planas.
- **Teorema de Euler para Poliedros Convexos:**
$$V - A + F = 2$$
onde $V$ é o número de vértices, $A$ é o número de arestas e $F$ é o número de faces.
- Se um poliedro possui $F_3$ faces triangulares, $F_4$ quadrangulares, etc., a contagem de arestas obedece a:
$$2A = 3F_3 + 4F_4 + 5F_5 + \\dots$$
- **Os Cinco Poliedros Regulares de Platão:** Tetraedro regular (4 faces), Hexaedro/Cubo (6), Octaedro (8), Dodecaedro (12) e Icosaedro (20).

### 2. Prismas e Paralelepípedos
- Volume Geral de Qualquer Prisma:
$$V = A_{\\text{base}} \\times h$$
- **Cubo de Aresta a:**
  - Área Total: $A_t = 6a^2$
  - Volume: $V = a^3$
  - Diagonal do Cubo: $D = a\\sqrt{3}$
- **Paralelepípedo Retângulo de dimensões a, b, c:**
  - Área Total: $A_t = 2(ab + ac + bc)$
  - Volume: $V = a \\cdot b \\cdot c$
  - Diagonal: $D = \\sqrt{a^2 + b^2 + c^2}$

### 3. Corpos Redondos de Revolução
1. **Cilindro Circular Reto (Raio R e Altura h):**
   - Área da Base: $A_b = \\pi R^2$
   - Área Lateral: $A_l = 2\\pi R h$
   - Área Total: $A_t = 2\\pi R(R + h)$
   - Volume: $V = \\pi R^2 h$
   - Cilindro Equilátero: quando a seção meridiana é um quadrado ($h = 2R$).

2. **Cone Circular Reto (Raio R, Altura h e Geratriz g):**
   - Relação Pitagórica Fundamental: $g^2 = h^2 + R^2$
   - Área Lateral: $A_l = \\pi R g$
   - Área Total: $A_t = \\pi R (g + R)$
   - Volume: $V = \\frac{1}{3} \\pi R^2 h$
   - Cone Equilátero: quando $g = 2R$, o que implica $h = R\\sqrt{3}$.

3. **Esfera de Raio R:**
   - Área da Superfície Esférica: $A = 4\\pi R^2$
   - Volume da Esfera: $V = \\frac{4}{3}\\pi R^3$
   - Fuso Esférico (Área para ângulo $\\alpha$ em graus): $A_{\\text{fuso}} = \\frac{\\alpha}{360^\\circ} \\cdot 4\\pi R^2$
   - Cunha Esférica (Volume para ângulo $\\alpha$): $V_{\\text{cunha}} = \\frac{\\alpha}{360^\\circ} \\cdot \\frac{4}{3}\\pi R^3$`,
    },
  ],
};
