/**
 * Manuais e Livros Didáticos Completos de Disciplinas Curriculares.
 * Cobre Ensino Fundamental II, Ensino Médio, Pré-Vestibular / ENEM e Ensino Superior (Ciclo Básico).
 * Oferece leitura integral aprofundada com teoria axiomática completa, fórmulas deduzidas,
 * demonstrações passo a passo, problemas modelo resolvidos e baterias de questões do ENEM e vestibulares comentadas.
 */

export interface CurricularBookData {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  discipline: string;
  grade_level: string;
  description: string;
  cover_url: string;
  year: number;
  read_time: number;
  downloads: number;
  rating: number;
  rating_count: number;
  chapters: Array<{
    id: string;
    position: number;
    title: string;
    content: string;
    is_free_preview: boolean;
  }>;
}

export const CURRICULAR_BOOKS: CurricularBookData[] = [
  {
    id: "curr-matematica-ensino-medio-completo",
    title: "Matemática Fundamental & Avançada para o Ensino Médio",
    subtitle: "Disciplina Curricular Integral · 1º ao 3º Ano, ENEM & Vestibulares Tradicionais",
    author: "Profª. Dra. Mariana Peixoto & Prof. Renato Silveira",
    discipline: "Matemática",
    grade_level: "Ensino Médio & ENEM",
    description: "Tratado didático completo de Matemática Cobrindo todo o currículo nacional: Fundamentos de Funções, Funções Afim e Quadrática, Exponenciais e Logaritmos, Trigonometria no Ciclo, Matrizes e Sistemas Lineares, Geometria Espacial Métrica, Análise Combinatória, Probabilidade e Geometria Analítica Plana. Contém teoria formal, demonstrações axiomáticas, problemas modelo com resolução algébrica passo a passo e questões comentadas dos principais vestibulares do país.",
    cover_url: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1200&auto=format&fit=crop&q=80",
    year: 2026,
    read_time: 480,
    downloads: 38500,
    rating: 4.98,
    rating_count: 1420,
    chapters: [
      {
        id: "chap-curr-mat-1",
        position: 1,
        title: "Capítulo I — Teoria Axiomática dos Conjuntos, Relações Binárias e Conceito Rigoroso de Função Real",
        is_free_preview: true,
        content: `### 1. Fundamentos da Teoria dos Conjuntos e Relações Binárias

A Matemática moderna estrutura-se sobre a noção primordial de conjunto. Consideremos dois conjuntos não vazios, A e B. O produto cartesiano A × B é definido formalmente como o conjunto de todos os pares ordenados (x, y) tais que x pertence a A e y pertence a B:
A × B = { (x, y) | x ∈ A e y ∈ B }

Uma relação binária R de A em B é qualquer subconjunto do produto cartesiano: R ⊆ A × B.

### 2. Definição Formal de Função (Aplicação)
Uma relação f de A em B é denominada **função** (ou aplicação de A em B, denotada por f: A → B) se, e somente se, satisfaz a duas condições rigorosas de existência e unicidade:
1. **Condição de Existência**: Para todo elemento x pertencente ao conjunto A, existe ao menos um elemento y pertencente a B tal que o par (x, y) pertença a f: ∀x ∈ A, ∃y ∈ B | (x, y) ∈ f.
2. **Condição de Unicidade**: Para cada elemento x de A, o elemento correspondente y em B é estritamente único. Ou seja, se (x, y₁) ∈ f e (x, y₂) ∈ f, então necessariamente y₁ = y₂.

Denominamos:
* **Domínio de f (D(f))**: O conjunto de partida A.
* **Contradomínio de f (CD(f))**: O conjunto de chegada B.
* **Imagem de f (Im(f))**: O conjunto de todos os elementos y de B que são correspondentes de algum x de A: Im(f) = { y ∈ B | ∃x ∈ A com f(x) = y }. Por definição, Im(f) ⊆ CD(f).

### 3. Classificação das Funções
* **Função Injetora**: Elementos distintos do domínio possuem imagens distintas no contradomínio. Simbolicamente: ∀x₁, x₂ ∈ A, x₁ ≠ x₂ ⟹ f(x₁) ≠ f(x₂), ou equivalentemente pela contrapositiva, f(x₁) = f(x₂) ⟹ x₁ = x₂. No plano cartesiano, qualquer reta horizontal intercepta o gráfico da função em no máximo um ponto.
* **Função Sobrejetora**: O conjunto imagem coincide plenamente com o contradomínio: Im(f) = CD(f). Todos os elementos de B são flechados por ao menos um elemento de A.
* **Função Bijetora**: A função é simultaneamente injetora e sobrejetora. Apenas funções bijetoras admitem **função inversa** f⁻¹: B → A, tal que (f⁻¹ ∘ f)(x) = x e (f ∘ f⁻¹)(y) = y.

### 4. Determinação do Domínio Real de Validade
Ao trabalhar em ℝ, as seguintes restrições algébricas devem ser rigorosamente verificadas:
* Denominadores não podem se anular: em f(x) = g(x) / h(x), impõe-se h(x) ≠ 0.
* Radicais de índice par exigem radicando não negativo: em f(x) = ⁿ√(g(x)) com n par, impõe-se g(x) ≥ 0.
* Logaritmos exigem logaritmando estritamente positivo e base positiva e diferente de 1.

### 5. Problema Modelo Resolvido com Passo a Passo Algébrico
**Problema**: Determine o domínio real da função f(x) = √((x - 2) / (5 - x)) + 1 / √(x² - 9).

**Resolução Detalhada**:
1. Para a primeira parcela √((x - 2) / (5 - x)), temos índice par e fração:
   (x - 2) / (5 - x) ≥ 0 e 5 - x ≠ 0 ⟹ x ≠ 5.
   Estudando o sinal do quociente:
   - Numerador: x - 2 = 0 ⟹ x = 2 (positivo para x > 2, negativo para x < 2).
   - Denominador: 5 - x = 0 ⟹ x = 5 (positivo para x < 5, negativo para x > 5).
   - Regra de sinais do quociente: Positivo no intervalo fechado em 2 e aberto em 5: S₁ = [2, 5).

2. Para a segunda parcela 1 / √(x² - 9), a raiz está no denominador, logo o radicando deve ser estritamente positivo:
   x² - 9 > 0 ⟹ x² > 9 ⟹ x < -3 ou x > 3. Logo: S₂ = (-∞, -3) ∪ (3, +∞).

3. O domínio de f é a interseção dos dois subconjuntos de validade:
   D(f) = S₁ ∩ S₂ = [2, 5) ∩ ( (-∞, -3) ∪ (3, +∞) ) = (3, 5).
   Portanto, D(f) = { x ∈ ℝ | 3 < x < 5 }.

### 6. Questão Comentada de Vestibular (ENEM / FUVEST)
**Enunciado**: Seja f: ℝ → ℝ uma função bijetora tal que f(3x + 1) = 6x - 4 para todo x real. Determine a expressão algébrica da função inversa f⁻¹(x).

**Resolução Comentada**:
1. Para encontrar f(u), façamos a mudança de variável u = 3x + 1. Isolando x em função de u, temos: x = (u - 1) / 3.
2. Substituindo x na expressão dada:
   f(u) = 6 * ((u - 1) / 3) - 4 = 2(u - 1) - 4 = 2u - 2 - 4 = 2u - 6.
   Logo, f(x) = 2x - 6.
3. Para encontrar f⁻¹(x), fazemos y = 2x - 6, permutamos as variáveis (trocando x por y) e isolamos y:
   x = 2y - 6 ⟹ 2y = x + 6 ⟹ y = (x + 6) / 2 = (1/2)x + 3.
   Assim, a função inversa procurada é f⁻¹(x) = x/2 + 3.`,
      },
      {
        id: "chap-curr-mat-2",
        position: 2,
        title: "Capítulo II — Função Afim: Coeficiente Angular, Taxa de Variação Média e Inequações do 1º Grau",
        is_free_preview: true,
        content: `### 1. Forma Canônica e Significado dos Coeficientes
A função afim (função polinomial do 1º grau) é definida pela lei:
f(x) = ax + b, onde a, b ∈ ℝ e a ≠ 0.

* **Coeficiente Angular (a)**: Representa a inclinação da reta em relação ao semi-eixo positivo das abscissas e a **taxa constante de variação média** da função:
  a = Δy / Δx = (f(x₂) - f(x₁)) / (x₂ - x₁) = tg θ.
  - Se a > 0: A função é estritamente crescente em todo o seu domínio.
  - Se a < 0: A função é estritamente decrescente.
* **Coeficiente Linear (b)**: Representa a ordenada do ponto em que a reta corta o eixo Oy, ou seja, o par ordenado (0, b), pois f(0) = a(0) + b = b.
* **Raiz ou Zero da Função**: O valor de x que anula a função:
  ax + b = 0 ⟹ x = -b/a. O gráfico intersecta o eixo Ox no ponto (-b/a, 0).

### 2. Estudo Completo de Sinais da Função Afim
Para analisar onde f(x) é positiva, nula ou negativa:
* Caso a > 0 (Reta Crescente):
  - f(x) < 0 para x < -b/a
  - f(x) = 0 para x = -b/a
  - f(x) > 0 para x > -b/a
* Caso a < 0 (Reta Decrescente):
  - f(x) > 0 para x < -b/a
  - f(x) = 0 para x = -b/a
  - f(x) < 0 para x > -b/a

### 3. Inequações Produto e Inequações Quociente
Para resolver desigualdades do tipo f(x) · g(x) ≥ 0 ou f(x) / g(x) < 0:
1. Encontram-se as raízes individuais de cada fator afim.
2. Constrói-se o quadro de sinais (varal de sinais) com os intervalos delimitados pelas raízes em ordem crescente.
3. Aplica-se a regra de sinais multiplicativa coluna por coluna.
4. Lembrar: em inequações quociente, o denominador nunca pode ser nulo, mesmo que a desigualdade inclua o sinal de igualdade.

### 4. Problema Resolvido Passo a Passo
**Problema**: Uma cooperativa agrícola possui um plano de logística rodoviária em que o frete diário de caminhões é cobrado segundo duas opções:
- Transportadora Alfa: R$ 320,00 de diária fixa mais R$ 2,40 por quilômetro percorrido.
- Transportadora Beta: R$ 180,00 de diária fixa mais R$ 3,10 por quilômetro percorrido.
Determine a partir de qual quilometragem diária a contratação da Transportadora Alfa torna-se economicamente mais vantajosa para o produtor.

**Resolução Algébrica**:
1. Escrevemos as leis horárias dos custos em função da distância d (em km):
   C_Alfa(d) = 2,40d + 320
   C_Beta(d) = 3,10d + 180
2. A Transportadora Alfa será mais vantajosa quando o seu custo for estritamente menor que o da Beta:
   C_Alfa(d) < C_Beta(d) ⟹ 2,40d + 320 < 3,10d + 180
3. Subtraindo 2,40d e 180 de ambos os lados:
   320 - 180 < 3,10d - 2,40d
   140 < 0,70d ⟹ d > 140 / 0,70 = 200 km.
Portanto, para trajetos diários estritamente superiores a 200 km, a Transportadora Alfa é mais econômica.`,
      },
      {
        id: "chap-curr-mat-3",
        position: 3,
        title: "Capítulo III — Função Quadrática: Dedução do Vértice, Zeros e Problemas de Otimização Extrema",
        is_free_preview: true,
        content: `### 1. Definição e Dedução da Fórmula Canônica
A função quadrática possui a lei:
f(x) = ax² + bx + c, onde a, b, c ∈ ℝ e a ≠ 0.

Completando o quadrado da expressão:
f(x) = a [ x² + (b/a)x + c/a ]
f(x) = a [ (x + b/(2a))² - b²/(4a²) + c/a ]
f(x) = a (x + b/(2a))² - (b² - 4ac)/(4a)

Definindo o discriminante **Δ = b² - 4ac**:
f(x) = a (x + b/(2a))² - Δ / (4a)

### 2. Dedução das Coordenadas do Vértice V(x_v, y_v)
Dado que (x + b/(2a))² é sempre maior ou igual a zero para todo x real:
* Se a > 0, o menor valor possível de f(x) ocorre exatamente quando o termo ao quadrado se anula, isto é, x + b/(2a) = 0 ⟹ **x_v = -b / (2a)**.
  Substituindo x_v na função, obtemos a ordenada mínima: **y_v = -Δ / (4a)**.
* Se a < 0, o vértice representa o ponto de **máximo absoluto** da função, com as mesmíssimas coordenadas.

### 3. Relações de Girard (Soma e Produto das Raízes)
Para f(x) = ax² + bx + c com raízes x₁ e x₂:
* **Soma (S)**: x₁ + x₂ = -b / a
* **Produto (P)**: x₁ · x₂ = c / a
Forma fatorada: f(x) = a(x - x₁)(x - x₂).

### 4. Problema de Otimização Prática (ENEM / Fuvest)
**Problema**: Um fazendeiro dispõe de 120 metros lineares de cerca de arame galvanizado e deseja delimitar um piquete retangular aproveitando um muro reto de pedra já existente como um dos lados. Quais devem ser as dimensões do retângulo para que a área cercada seja máxima, e qual é o valor dessa área?

**Resolução Detalhada**:
1. Sejam x o comprimento dos dois lados perpendiculares ao muro e y o comprimento do lado paralelo ao muro.
2. A cerca é usada para 2x + y = 120 ⟹ y = 120 - 2x.
3. A área do retângulo em função de x é:
   A(x) = x · y = x · (120 - 2x) = -2x² + 120x.
4. Trata-se de uma parábola com concavidade voltada para baixo (a = -2 < 0), logo possui um ponto de máximo:
   x_v = -b / (2a) = -120 / (2 · (-2)) = -120 / -4 = 30 metros.
5. Calculando y e a área máxima:
   y = 120 - 2(30) = 120 - 60 = 60 metros.
   A_max = A(30) = 30 · 60 = 1.800 m².
Ou via y_v: y_v = -Δ / (4a) = -(120² - 4(-2)(0)) / (4 · (-2)) = -14.400 / -8 = 1.800 m².`,
      },
      {
        id: "chap-curr-mat-4",
        position: 4,
        title: "Capítulo IV — Exponenciais e Logaritmos: Propriedades Operatórias, Decaimento e Escalas Científicas",
        is_free_preview: true,
        content: `### 1. A Função Exponencial e a Base Neperiana
A função exponencial tem a forma f(x) = aˣ, com a > 0 e a ≠ 1.
* Se a > 1: Estritamente crescente, lim_{x→+∞} aˣ = +∞ e lim_{x→-∞} aˣ = 0 (o eixo x é assíntota horizontal).
* Se 0 < a < 1: Estritamente decrescente.
* A base natural de Euler e ≈ 2,718281828... rege os fenômenos contínuos de crescimento bacteriano, radioatividade e juros compostos contínuos.

### 2. Definição e Propriedades dos Logaritmos
O logaritmo de um número real e positivo N na base b (b > 0, b ≠ 1) é o expoente x ao qual b deve ser elevado para produzir N:
log_b(N) = x ⟺ bˣ = N

Propriedades Fundamentais:
1. log_b(M · N) = log_b(M) + log_b(N) (Logaritmo do produto)
2. log_b(M / N) = log_b(M) - log_b(N) (Logaritmo do quociente)
3. log_b(Mᵏ) = k · log_b(M) (Regra da potência / do tombo)
4. Mudança de Base: log_b(N) = log_c(N) / log_c(b)

### 3. Problema Resolvido: Decaimento Radioativo e Meia-Vida
**Problema**: Uma substância radioativa utilizada em radioterapia possui meia-vida de 8 dias (o tempo necessário para que metade de sua massa inicial decaia). Se um hospital recebe uma amostra de 200 gramas desse isótopo, após quantos dias a massa residual será reduzida a apenas 12,5 gramas?

**Resolução**:
1. A lei do decaimento exponencial é M(t) = M₀ · (1/2)^(t / T_meia).
2. Substituindo os dados: M₀ = 200, T_meia = 8, M(t) = 12,5:
   12,5 = 200 · (1/2)^(t / 8)
3. Dividindo ambos os membros por 200:
   12,5 / 200 = 1 / 16 = (1/2)^(t / 8)
4. Como 16 = 2⁴, temos 1/16 = (1/2)⁴:
   (1/2)⁴ = (1/2)^(t / 8)
5. Igualando os expoentes pela injetividade da função exponencial:
   t / 8 = 4 ⟹ t = 32 dias.
Portanto, serão necessários exatamente 32 dias.`,
      },
      {
        id: "chap-curr-mat-5",
        position: 5,
        title: "Capítulo V — Trigonometria no Ciclo: Relações Fundamentais, Adição de Arcos e Equações Periódicas",
        is_free_preview: true,
        content: `### 1. O Círculo Trigonométrico e as Razões no Ciclo
O ciclo trigonométrico é uma circunferência de raio unitário (R = 1) no plano cartesiano, com origem no ponto A(1, 0) e orientação anti-horária positiva.
* Para qualquer arco x, o ponto P correspondente no ciclo possui coordenadas P(cos x, sen x).
* Pelo Teorema de Pitágoras no triângulo retângulo fundamental de catetos sen x e cos x e hipotenusa 1:
  **sen²(x) + cos²(x) = 1** (Identidade Fundamental da Trigonometria).

Dividindo a identidade fundamental por cos²(x):
tg²(x) + 1 = sec²(x)

Dividindo por sen²(x):
1 + cotg²(x) = cossec²(x)

### 2. Fórmulas de Adição e Arco Duplo
* sen(a ± b) = sen(a)cos(b) ± sen(b)cos(a)
* cos(a ± b) = cos(a)cos(b) ∓ sen(a)sen(b)
* tg(a ± b) = (tg a ± tg b) / (1 ∓ tg a · tg b)
* sen(2a) = 2 sen(a) cos(a)
* cos(2a) = cos²(a) - sen²(a) = 1 - 2 sen²(a) = 2 cos²(a) - 1

### 3. Problema Resolvido: Onda Sonora e Período
**Problema**: Uma onda de som puro gerada por um diapasão produz uma oscilação na pressão do ar descrita pela equação P(t) = P₀ + 4 · sen(200π · t), onde t é o tempo em segundos. Determine a amplitude da onda, sua frequência em Hertz (Hz) e o período da oscilação.

**Resolução**:
1. A forma padrão de uma função harmônica é y(t) = k + A · sen(ω · t + φ).
2. A amplitude de oscilação é o coeficiente multiplicativo da função seno: A = 4 unidades de pressão.
3. A pulsação angular é ω = 200π rad/s.
4. Sabendo que ω = 2π · f:
   200π = 2π · f ⟹ f = 200π / (2π) = 100 Hz.
5. O período T é o inverso da frequência:
   T = 1 / f = 1 / 100 = 0,01 segundos (ou 10 milissegundos).`,
      },
      {
        id: "chap-curr-mat-6",
        position: 6,
        title: "Capítulo VI — Geometria Espacial Métrica: Postulados de Euclides, Prismas, Pirâmides e Corpos Redondos",
        is_free_preview: true,
        content: `### 1. Princípio de Cavalieri e Sólidos Prismáticos
Dois sólidos de mesma altura, apoiados em um mesmo plano, possuem volumes iguais se qualquer plano paralelo ao plano de apoio que os corte determine secções planas de áreas idênticas.

* **Volume de qualquer Prisma ou Cilindro reto/oblíquo**:
  V = A_base · h
  - Cilindro circular reto de raio R e altura h:
    A_base = πR²
    A_lateral = 2πRh
    A_total = 2πR(R + h)
    V = πR²h

### 2. Sólidos Cônicos e Piramidais (Vértice Único)
* **Volume de Pirâmides e Cones**:
  V = (1/3) · A_base · h
  - Cone de raio R, altura h e geratriz g:
    g² = h² + R²
    A_lateral = πRg
    V = (1/3)πR²h

### 3. A Esfera de Arquimedes
Para uma esfera de raio R:
* Área da Superfície Esférica: A = 4πR²
* Volume Esférico: V = (4/3)πR³

### 4. Problema Resolvido: Tanque de Combustível Cilíndrico com Calotas
**Problema**: Um reservatório de combustível tem a forma de um cilindro circular reto de 6 metros de comprimento e raio de base igual a 1,5 metro, finalizado em suas duas extremidades por semiesferas de mesmo raio (formando uma esfera inteira ao unir as duas pontas). Calcule a capacidade volumétrica total desse reservatório em litros (considere π = 3,14).

**Resolução**:
1. Volume do cilindro central:
   V_cilindro = π · R² · h = 3,14 · (1,5)² · 6 = 3,14 · 2,25 · 6 = 42,39 m³.
2. Volume das duas calotas semiesféricas reunidas (uma esfera completa de raio 1,5 m):
   V_esfera = (4/3) · π · R³ = (4/3) · 3,14 · (1,5)³ = (4/3) · 3,14 · 3,375 = 14,13 m³.
3. Volume total do tanque:
   V_total = 42,39 + 14,13 = 56,52 m³.
4. Conversão para litros (1 m³ = 1.000 litros):
   Capacidade = 56,52 · 1.000 = 56.520 litros.`,
      },
      {
        id: "chap-curr-mat-7",
        position: 7,
        title: "Capítulo VII — Análise Combinatória, Triângulo de Pascal e Teoria das Probabilidades",
        is_free_preview: true,
        content: `### 1. Princípio Fundamental da Contagem (Multiplicativo)
Se uma decisão D₁ pode ser tomada de m maneiras distintas e, em seguida, uma decisão D₂ puder ser tomada de n maneiras distintas, o número total de maneiras de tomar sucessivamente as decisões D₁ e D₂ é dado por m · n.

### 2. Agrupamentos Simples
* **Permutação Simples**: P_n = n!
* **Permutação com Elementos Repetidos**: P_n^(a, b, c) = n! / (a! · b! · c!)
* **Arranjos Simples (a ordem importa)**: A(n, p) = n! / (n - p)!
* **Combinações Simples (a ordem NÃO importa)**: C(n, p) = (n p) = n! / [ p! · (n - p)! ]

### 3. Probabilidade Axiomática de Laplace e Probabilidade Condicional
Dado um espaço amostral equiprovável Ω e um evento A ⊆ Ω:
P(A) = n(A) / n(Ω) = (Casos Favoráveis) / (Casos Possíveis)

* **Probabilidade Condicional**:
  P(A | B) = P(A ∩ B) / P(B), para P(B) > 0.
* **Teorema da Multiplicação**:
  P(A ∩ B) = P(B) · P(A | B)
* **Eventos Independentes**: A ocorrência de B não altera a probabilidade de A:
  P(A | B) = P(A) ⟺ P(A ∩ B) = P(A) · P(B).

### 4. Problema Resolvido: Exame Médico e Teorema de Bayes
**Problema**: Uma doença rara acomete 1% de uma população. Um teste diagnóstico acerta 95% das vezes em pessoas doentes (sensibilidade) e dá falso positivo em 2% das pessoas saudáveis (especificidade de 98%). Se um paciente sorteado ao acaso recebe resultado positivo, qual é a probabilidade real de ele estar efetivamente doente?

**Resolução**:
1. Seja D = doente, S = saudável, + = teste positivo.
   P(D) = 0,01; P(S) = 0,99.
   P(+ | D) = 0,95; P(+ | S) = 0,02.
2. Pela Lei da Probabilidade Total:
   P(+) = P(D) · P(+ | D) + P(S) · P(+ | S)
   P(+) = (0,01 · 0,95) + (0,99 · 0,02) = 0,0095 + 0,0198 = 0,0293 (2,93%).
3. Pelo Teorema de Bayes:
   P(D | +) = (P(D) · P(+ | D)) / P(+) = 0,0095 / 0,0293 ≈ 0,3242 (ou 32,4%).
Mesmo com um teste 95% sensível, a chance de estar doente após um único positivo é de apenas cerca de 32% devido à baixa prevalência populacional da patologia.`,
      },
      {
        id: "chap-curr-mat-8",
        position: 8,
        title: "Capítulo VIII — Geometria Analítica Plana: Reta, Circunferência e Posições Relativas",
        is_free_preview: true,
        content: `### 1. Distância Entre Dois Pontos e Ponto Médio
Dados A(x_A, y_A) e B(x_B, y_B) no plano cartesiano ℝ²:
* Distância Euclidiana: d(A, B) = √[ (x_B - x_A)² + (y_B - y_A)² ]
* Ponto Médio M: M = ( (x_A + x_B)/2 , (y_A + y_B)/2 )

### 2. Equações da Reta
* **Equação Geral**: ax + by + c = 0 (com a e b não simultaneamente nulos).
* **Equação Reduzida**: y = mx + q (onde m = -a/b é o coeficiente angular e q = -c/b é o coeficiente linear).
* **Condição de Paralelismo**: Duas retas r e s são paralelas se, e somente se, m_r = m_s.
* **Condição de Perpendicularismo**: Duas retas são perpendiculares se, e somente se, o produto de seus coeficientes angulares for -1: m_r · m_s = -1 ⟹ m_s = -1 / m_r.
* **Distância de um Ponto P(x₀, y₀) a uma Reta r: ax + by + c = 0**:
  d(P, r) = | a·x₀ + b·y₀ + c | / √(a² + b²)

### 3. Equação da Circunferência
A circunferência de centro C(a, b) e raio R é o lugar geométrico dos pontos P(x, y) que distam R de C:
* **Equação Reduzida**: (x - a)² + (y - b)² = R²
* **Equação Geral**: x² + y² - 2ax - 2by + (a² + b² - R²) = 0

### 4. Problema Resolvido: Reta Tangente à Circunferência
**Problema**: Determine a equação da reta tangente à circunferência x² + y² = 25 no ponto P(3, 4).

**Resolução**:
1. O centro da circunferência está na origem C(0, 0) e o raio é R = √25 = 5.
2. O raio que liga o centro C(0, 0) ao ponto de tangência P(3, 4) tem coeficiente angular:
   m_raio = (4 - 0) / (3 - 0) = 4/3.
3. Como a reta tangente é estritamente perpendicular ao raio no ponto de tangência:
   m_tangente = -1 / m_raio = -1 / (4/3) = -3/4.
4. Aplicando a equação fundamental da reta que passa por P(3, 4):
   y - y₀ = m(x - x₀)
   y - 4 = (-3/4)(x - 3)
   4(y - 4) = -3(x - 3) ⟹ 4y - 16 = -3x + 9 ⟹ 3x + 4y - 25 = 0.
Portanto, a equação geral da reta tangente é 3x + 4y - 25 = 0.`,
      },
    ],
  },
  {
    id: "curr-fisica-ensino-medio-completo",
    title: "Física Geral & Experimental: Mecânica, Termologia, Óptica e Eletricidade",
    subtitle: "Disciplina Curricular Integral · 1º ao 3º Ano, ENEM & Pré-Vestibular de Alta Concorrência",
    author: "Prof. Dr. Carlos Eduardo Diniz & Prof. Arthur Ramos",
    discipline: "Física",
    grade_level: "Ensino Médio & Pré-Vestibular",
    description: "Tratado completo de Física Teórica e Experimental cobrindo Cinemática Vetorial, Leis de Newton e Forças Dissipativas, Trabalho e Conservação da Energia Mecânica, Gravitação Universal, Termodinâmica e Ciclos Térmicos, Óptica Geométrica e Ondulatória, Eletrostática, Eletrodinâmica de Circuitos e Eletromagnetismo de Maxwell.",
    cover_url: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=1200&auto=format&fit=crop&q=80",
    year: 2026,
    read_time: 460,
    downloads: 34200,
    rating: 4.97,
    rating_count: 1210,
    chapters: [
      {
        id: "chap-curr-fis-1",
        position: 1,
        title: "Capítulo I — Cinemática Escalar e Vetorial: MRU, MRUV, Queda Livre e Lançamento Oblíquo Bidimensional",
        is_free_preview: true,
        content: `### 1. Grandezas Cinemáticas Fundamentais
* **Velocidade Vetorial Média**: v_m = Δr / Δt, onde Δr é o vetor deslocamento entre a posição inicial e final.
* **Aceleração Vetorial Instantânea**: a = a_t + a_cp
  - A componente tangencial (a_t) varia o módulo da velocidade (a_t = dv/dt).
  - A componente centrípeta (a_cp) varia a direção do vetor velocidade em trajetórias curvas: a_cp = v² / R = ω² · R.

### 2. Movimento Retilíneo Uniformemente Variado (MRUV)
Com aceleração constante:
* v(t) = v₀ + a · t
* S(t) = S₀ + v₀ · t + (1/2) · a · t²
* Equação de Torricelli (independente do tempo): v² = v₀² + 2 · a · ΔS

### 3. Composição de Movimentos: Princípio de Galileu e Lançamento Oblíquo
Em um projétil lançado com velocidade inicial v₀ sob ângulo θ com a horizontal (desprezando a resistência do ar):
* **Eixo Horizontal (Ox)**: Movimento uniforme (a_x = 0):
  v_x = v₀ · cos θ
  x(t) = (v₀ · cos θ) · t
* **Eixo Vertical (Oy)**: Movimento uniformemente variado sob gravidade g (a_y = -g):
  v_y(t) = v₀ · sen θ - g · t
  y(t) = (v₀ · sen θ) · t - (1/2) · g · t²
* **Tempo de Voo Total**: Ocorre quando o projétil retorna ao nível de lançamento (y = 0):
  t_voo = (2 · v₀ · sen θ) / g
* **Alcance Horizontal Máximo (A)**:
  A = x(t_voo) = v_x · t_voo = (v₀ · cos θ) · ((2v₀ · sen θ) / g) = (v₀² · sen(2θ)) / g
  O alcance é máximo quando sen(2θ) = 1 ⟹ 2θ = 90° ⟹ **θ = 45°**.

### 4. Problema Resolvido com Cálculo Detalhado
**Problema**: Um canhão dispara uma cápsula sinalizadora a partir do solo com velocidade v₀ = 50 m/s sob um ângulo de elevação de 30° em relação à horizontal. Adotando g = 10 m/s², calcule a altura máxima atingida e a velocidade do projétil no topo de sua trajetória.

**Resolução**:
1. Componentes da velocidade inicial:
   v_0x = 50 · cos(30°) = 50 · (√3 / 2) = 25√3 ≈ 43,3 m/s.
   v_0y = 50 · sen(30°) = 50 · (1/2) = 25 m/s.
2. Na altura máxima, a velocidade vertical se anula instantaneamente: v_y = 0.
   Aplicando Torricelli no eixo vertical:
   v_y² = v_0y² - 2g · H_max ⟹ 0 = 25² - 2(10) · H_max
   20 · H_max = 625 ⟹ H_max = 625 / 20 = 31,25 metros.
3. No ponto mais alto, como v_y = 0, a velocidade vetorial total do projétil é puramente horizontal:
   v_topo = v_x = v_0x = 25√3 ≈ 43,3 m/s.`,
      },
      {
        id: "chap-curr-fis-2",
        position: 2,
        title: "Capítulo II — Dinâmica Newtoniana, Forças de Atrito, Força Elástica e Planos Inclinados",
        is_free_preview: true,
        content: `### 1. As Três Leis Fundamentais de Newton
1. **1ª Lei (Princípio da Inércia)**: Um corpo mantém seu estado de repouso ou de movimento retilíneo uniforme se a resultante das forças que sobre ele atuam for nula: ∑ F = 0 ⟹ a = 0.
2. **2ª Lei (Princípio Fundamental da Dinâmica)**: A resultante das forças que atuam sobre um ponto material é igual à derivada temporal da sua quantidade de movimento. Para massa invariante: **F_res = m · a** (1 N = 1 kg·m/s²).
3. **3ª Lei (Ação e Reação)**: Toda força que um corpo A exerce sobre um corpo B gera uma força de igual intensidade, mesma direção e sentido oposto aplicada pelo corpo B sobre o corpo A: F_{A→B} = -F_{B→A}. Importante: forças de ação e reação atuam em corpos distintos, nunca se equilibrando entre si.

### 2. Forças de Atrito e Rugosidade de Superfícies
O atrito é uma força de contato eletromagnética decorrente das micro-rugosidades interfaciais:
* **Atrito Estático (f_e)**: Impede o início do escorregamento relativo. Seu valor ajusta-se à força solicitante até atingir o limite de iminência de movimento:
  f_e(max) = μ_e · N (onde N é a força normal de compressão).
* **Atrito Cinético ou Dinâmico (f_c)**: Atua durante o deslizamento relativo:
  f_c = μ_c · N (com μ_c < μ_e).

### 3. Decomposição de Forças no Plano Inclinado
Em um plano inclinado de ângulo θ com a horizontal:
* Força Peso: P = m · g (vertical para baixo).
* Componente paralela ao plano: P_x = m · g · sen θ (tende a fazer o corpo descer).
* Componente perpendicular ao plano: P_y = m · g · cos θ.
* Pelo equilíbrio na direção normal: N = P_y = m · g · cos θ.
* Na iminência de descida por atrito: P_x = f_e(max) ⟹ m · g · sen θ = μ_e · (m · g · cos θ) ⟹ **tg θ = μ_e**.

### 4. Problema Resolvido: Sistema de Blocos com Fio e Polia Ideal
**Problema**: Um bloco A de massa 6 kg repousa sobre uma mesa horizontal com coeficiente de atrito cinético μ_c = 0,2. Ele é conectado por um fio ideal inextensível que passa por uma polia sem atrito a um bloco B de massa 4 kg que pende verticalmente. Adotando g = 10 m/s², determine a aceleração do sistema e a tração no fio.

**Resolução**:
1. Força normal e atrito no bloco A:
   N_A = m_A · g = 6 · 10 = 60 N.
   f_c = μ_c · N_A = 0,2 · 60 = 12 N.
2. Equações do movimento para cada bloco:
   - Para o bloco A: T - f_c = m_A · a ⟹ T - 12 = 6a.
   - Para o bloco B (que desce): P_B - T = m_B · a ⟹ (4 · 10) - T = 4a ⟹ 40 - T = 4a.
3. Somando as duas equações membro a membro:
   (T - 12) + (40 - T) = 6a + 4a
   28 = 10a ⟹ **a = 2,8 m/s²**.
4. Calculando a tração T:
   T - 12 = 6(2,8) = 16,8 ⟹ **T = 28,8 N**.`,
      },
      {
        id: "chap-curr-fis-3",
        position: 3,
        title: "Capítulo III — Trabalho, Energia Mecânica, Teorema da Energia Cinética e Potência",
        is_free_preview: true,
        content: `### 1. Trabalho de uma Força Constante
O trabalho (W ou τ) realizado por uma força constante F cujo ponto de aplicação sofre um deslocamento d é o produto escalar:
W = F · d = |F| · |d| · cos θ (medido em Joules: 1 J = 1 N·m).
* Se 0° ≤ θ < 90°: Trabalho motor (positivo, transfere energia ao corpo).
* Se 90° < θ ≤ 180°: Trabalho resistente (negativo, retira energia do corpo).
* Se θ = 90°: O trabalho é nulo (a força centrípeta nunca realiza trabalho).

### 2. Teorema da Energia Cinética (TEC)
O trabalho da força resultante que atua sobre um ponto material entre duas posições A e B é rigorosamente igual à variação de sua energia cinética:
W_res = ΔE_c = E_c(final) - E_c(inicial) = (1/2)m·v_B² - (1/2)m·v_A²

### 3. Sistemas Conservativos e Energia Mecânica Total
Uma força é dita conservativa (ex: gravidade, força elástica) quando o trabalho realizado por ela entre dois pontos independe da trajetória percorrida:
* Energia Potencial Gravitacional: E_pg = m · g · h
* Energia Potencial Elástica: E_pe = (1/2) · k · x²
Na ausência de forças dissipativas (atrito e resistência do ar):
**E_m(A) = E_m(B)** ⟹ E_c(A) + E_p(A) = E_c(B) + E_p(B)

### 4. Problema Resolvido: O Loop da Montanha-Russa
**Problema**: Um carrinho de massa m desce sem atrito de uma rampa e entra em um loop circular vertical de raio R. Determine a altura mínima H de abandono (a partir do repouso) para que o carrinho consiga completar o loop sem perder o contato com os trilhos no ponto mais alto.

**Resolução**:
1. No ponto mais alto do loop (ponto C, altura 2R), as forças verticais atuando no carrinho para baixo são o Peso P e a Normal N dos trilhos:
   F_cp = P + N = m · (v_topo² / R)
2. Para que o carrinho não perca o contato, a força normal mínima é zero (iminência de descolamento):
   N = 0 ⟹ m · g = m · (v_topo² / R) ⟹ **v_topo² = g · R**.
3. Pela conservação da energia mecânica entre o ponto inicial A (altura H) e o topo C (altura 2R):
   E_m(A) = E_m(C)
   m · g · H = m · g · (2R) + (1/2)m · v_topo²
4. Substituindo v_topo² = g · R:
   g · H = 2gR + (1/2)gR = 2,5gR
   **H = 2,5 R** (ou 5R/2).
Portanto, a altura mínima deve ser duas vezes e meia o raio do loop.`,
      },
      {
        id: "chap-curr-fis-4",
        position: 4,
        title: "Capítulo IV — Termodinâmica: Equivalente Mecânico do Calor, Máquinas Térmicas e Ciclo de Carnot",
        is_free_preview: true,
        content: `### 1. Calorimetria e Mudanças de Estado
* **Calor Sensível (Variação de Temperatura)**: Q = m · c · Δθ (onde c é o calor específico).
* **Calor Latente (Mudança de Fase)**: Q = m · L (ocorre a temperatura constante para substâncias puras).
* Equivalente Mecânico do Calor de Joule: 1 cal ≈ 4,184 J.

### 2. A Primeira Lei da Termodinâmica
A energia não pode ser criada nem destruída, apenas transformada:
**ΔU = Q - W**
* ΔU: Variação da energia interna do gás ideal: ΔU = (3/2) · n · R · ΔT (depende unicamente da temperatura).
* Q: Calor trocado com o meio (Q > 0 se o gás absorve calor; Q < 0 se cede).
* W: Trabalho termodinâmico: W = ∫ P dV. Em transformações isobáricas (pressão constante): W = P · ΔV.

### 3. Segunda Lei da Termodinâmica e Ciclo de Carnot
É impossível construir uma máquina térmica que, operando em ciclos, converta integralmente calor em trabalho mecânico sem rejeitar uma fração para uma fonte fria (Enunciado de Kelvin-Planck).
* **Rendimento de uma Máquina Térmica**:
  η = W / Q_quente = (Q_quente - Q_frio) / Q_quente = 1 - (Q_frio / Q_quente)
* **Teorema de Carnot**: Nenhuma máquina térmica operando entre duas temperaturas fixas (T_quente e T_fria em Kelvin) pode ter rendimento superior ao ciclo ideal reversível de Carnot:
  **η_Carnot = 1 - (T_fria / T_quente)**

### 4. Problema Resolvido: Motor a Combustão
**Problema**: Um motor térmico ideal opera segundo o ciclo de Carnot entre uma fonte quente a 527 °C e uma fonte fria a 127 °C. Em cada ciclo, o motor absorve 6.000 Joules da fonte quente. Determine o rendimento teórico máximo dessa máquina e o trabalho mecânico líquido produzido por ciclo.

**Resolução**:
1. Conversão obrigatória das temperaturas para a escala termodinâmica absoluta Kelvin:
   T_quente = 527 + 273 = 800 K.
   T_fria = 127 + 273 = 400 K.
2. Rendimento de Carnot:
   η = 1 - (T_fria / T_quente) = 1 - (400 / 800) = 1 - 0,50 = 0,50 (ou 50%).
3. Trabalho mecânico útil:
   W = η · Q_quente = 0,50 · 6.000 J = 3.000 Joules.
Os 3.000 J restantes são necessariamente rejeitados para a fonte fria sob forma de calor.`,
      },
      {
        id: "chap-curr-fis-5",
        position: 5,
        title: "Capítulo V — Óptica Geométrica e Ondulatória: Reflexão, Refração, Lentes e Fenômenos de Onda",
        is_free_preview: true,
        content: `### 1. Princípios da Óptica Geométrica
* Propagação retilínea da luz em meios homogêneos e transparentes.
* Independência dos raios luminosos quando se cruzam.
* Reversibilidade dos caminhos ópticos.

### 2. Leis da Refração e Lei de Snell-Descartes
O índice de refração absoluto de um meio é a razão entre a velocidade da luz no vácuo e no meio: n = c / v.
Quando a luz passa do meio 1 para o meio 2:
**n₁ · sen θ₁ = n₂ · sen θ₂**

* **Ângulo Limite e Reflexão Total**:
  Ocorre quando a luz se propaga de um meio mais refringente para um menos refringente (n₁ > n₂). Quando o ângulo de refração atinge 90°:
  sen L = n₂ / n₁. Se o ângulo de incidência for maior que L, não há refração: 100% da luz é refletida internamente (princípio da fibra óptica).

### 3. Equação de Gauss para Espelhos Esféricos e Lentes Delgadas
**1 / f = 1 / p + 1 / p'**
* f: Distância focal (f > 0 para espelho côncavo ou lente convergente; f < 0 para convexo/divergente).
* p: Posição do objeto (distância ao vértice/centro óptico).
* p': Posição da imagem (p' > 0 para imagem real; p' < 0 para virtual).
* **Aumento Linear Transversal**: A = y' / y = -p' / p.

### 4. Fenômenos Ondulatórios: Equação Fundamental e Efeito Doppler
* Equação Fundamental: **v = λ · f** (a frequência f depende unicamente da fonte e não varia ao mudar de meio).
* Interferência e Difração: A capacidade da onda de contornar obstáculos de tamanho comparável ao seu comprimento de onda λ.`,
      },
      {
        id: "chap-curr-fis-6",
        position: 6,
        title: "Capítulo VI — Eletrostática, Campo Elétrico, Potencial e Circuitos de Corrente Contínua",
        is_free_preview: true,
        content: `### 1. Lei de Coulomb e Campo Eletrostático
Duas cargas pontuais puntiformes Q₁ e Q₂ separadas por uma distância d no vácuo interagem com uma força eletrostática de módulo:
F = k₀ · (|Q₁ · Q₂|) / d² (com k₀ ≈ 9 x 10⁹ N·m²/C²).
* Vetor Campo Elétrico gerado por carga pontual Q: E = k₀ · (|Q|) / d² (de afastamento se Q > 0, de aproximação se Q < 0).
* Força sobre carga de prova q imersa no campo: F = q · E.

### 2. Potencial Elétrico e Trabalho da Força Elétrica
O potencial elétrico escalar a uma distância d de uma carga Q é: V = k₀ · Q / d.
O trabalho da força elétrica para transportar uma carga q entre os potenciais V_A e V_B é:
W_{A→B} = q · (V_A - V_B) = q · U_{AB}.

### 3. Circuitos Elétricos e Leis de Kirchhoff
* **1ª Lei de Ohm**: U = R · i
* **2ª Lei de Ohm**: R = ρ · (L / A)
* **Potência Dissipada por Efeito Joule**: P = U · i = R · i² = U² / R
* **1ª Lei de Kirchhoff (Lei dos Nós)**: A soma das correntes que chegam a um nó é igual à soma das correntes que saem: ∑ i_chegam = ∑ i_saem.
* **2ª Lei de Kirchhoff (Lei das Malhas)**: A soma algébrica das diferenças de potencial ao longo de qualquer percurso fechado (malha) de um circuito é identicamente nula: ∑ ΔV = 0.

### 4. Problema Resolvido: Circuito com Ponte de Wheatstone
**Problema**: Um circuito possui quatro resistores dispostos em ponte: R₁ = 10 Ω, R₂ = 20 Ω, R₃ = 15 Ω e um resistor incógnito R_x. Um galvanômetro muito sensível conectado entre os nós intermediários indica corrente nula. Determine o valor de R_x para o equilíbrio da ponte.

**Resolução**:
1. Na condição de equilíbrio de uma ponte de Wheatstone, a corrente no galvanômetro é zero porque os potenciais nos seus dois terminais são estritamente iguais.
2. A condição matemática de equilíbrio é a igualdade dos produtos cruzados das resistências opostas:
   R₁ · R_x = R₂ · R₃
3. Substituindo os valores conhecidos:
   10 · R_x = 20 · 15
   10 · R_x = 300 ⟹ **R_x = 30 Ω**.`,
      },
    ],
  },
  {
    id: "curr-quimica-geral-e-organica",
    title: "Química Essencial: Estrutura Atômica, Estequiometria, Equilíbrio e Funções Orgânicas",
    subtitle: "Disciplina Curricular Integral · Ensino Médio, FUVEST, UNICAMP & ENEM",
    author: "Profª. Dra. Luciana Mendes & Prof. Tiago Barcellos",
    discipline: "Química",
    grade_level: "Ensino Médio & ENEM",
    description: "Manual didático aprofundado e completo de Química cobrindo Modelos Atômicos e Tabela Periódica, Geometria Molecular e Forças Intermoleculares, Cálculo Estequiométrico Avançado com Rendimento e Impurezas, Termoquímica e Lei de Hess, Cinética e Equilíbrio Químico (Le Chatelier, pH e Tampão), Eletroquímica (Pilhas e Eletrólise) e Química Orgânica Estrutural e Reacional.",
    cover_url: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&auto=format&fit=crop&q=80",
    year: 2026,
    read_time: 440,
    downloads: 31900,
    rating: 4.96,
    rating_count: 1140,
    chapters: [
      {
        id: "chap-curr-qui-1",
        position: 1,
        title: "Capítulo I — Mecânica Quântica Atômica, Tabela Periódica, Geometria Molecular e Forças Intermoleculares",
        is_free_preview: true,
        content: `### 1. Evolução dos Modelos Atômicos e Números Quânticos
A descrição atual do átomo fundamenta-se na Mecânica Quântica (De Broglie, Heisenberg e Schrödinger). O elétron possui comportamento dual onda-partícula e é caracterizado por quatro números quânticos:
1. **Número Quântico Principal (n)**: Indica o nível de energia e a distância média do elétron ao núcleo (n = 1, 2, 3, 4, 5, 6, 7).
2. **Número Quântico Secundário ou Azimutal (l)**: Define a forma geométrica do orbital (l = 0 para orbital s; l = 1 para p; l = 2 para d; l = 3 para f).
3. **Número Quântico Magnético (m_l)**: Define a orientação espacial do orbital (varia de -l a +l).
4. **Número Quântico de Spin (m_s)**: Representa o momento angular intrínseco do elétron (-1/2 ou +1/2). Princípio da Exclusão de Pauli: Em um mesmo átomo, dois elétrons nunca podem ter o mesmo conjunto de quatro números quânticos.

### 2. Teoria da Repulsão dos Pares Eletrônicos da Camada de Valência (VSEPR)
A geometria molecular é determinada pelo arranjo que minimiza a repulsão eletrostática mútua entre pares de elétrons ligantes e não-ligantes:
* 2 nuvens eletrônicas em torno do átomo central: **Linear** (ângulo de 180°, ex: BeCl₂, CO₂).
* 3 nuvens: **Trigonal Plana** (ângulo de 120°, ex: BF₃, SO₃). Se houver 1 par isolado: **Angular** (ex: SO₂).
* 4 nuvens: **Tetraédrica** (ângulo de 109°28', ex: CH₄). Se houver 1 par isolado: **Piramidal** (ângulo ≈ 107°, ex: NH₃). Se houver 2 pares isolados: **Angular** (ângulo ≈ 104,5°, ex: H₂O).

### 3. Forças Intermoleculares
* **Dipolo Induzido - Dipolo Induzido (Forças de London)**: Atuam entre moléculas apolares (ex: O₂, CH₄, gases nobres).
* **Dipolo Permanente - Dipolo Permanente**: Atuam entre moléculas polares (ex: HCl, H₂S).
* **Ligações de Hidrogênio**: Casos extremos de atração dipolo-dipolo quando o hidrogênio está covalentemente ligado aos elementos mais eletronegativos e de pequeno raio atômico: Flúor, Oxigênio ou Nitrogênio (**FON**). Responsáveis pelo elevado ponto de ebulição da água e pela estrutura em dupla hélice do DNA.`,
      },
      {
        id: "chap-curr-qui-2",
        position: 2,
        title: "Capítulo II — Cálculo Estequiométrico Avançado: Reagentes Limitantes, Pureza e Rendimento",
        is_free_preview: true,
        content: `### 1. Constantes e Relações Fundamentais
* Número de Avogadro: N_A = 6,022 x 10²³ entidades por mol.
* Massa Molar (M): Massa de 1 mol de substância (expressa em g/mol).
* Volume Molar dos Gases Ideais:
  - Nas CNTP (0 °C = 273 K e 1 atm): V_m = 22,4 L/mol.
  - Na CATP (25 °C = 298 K e 1 atm): V_m ≈ 24,5 L/mol.

### 2. Roteiro Algébrico para Estequiometria Complexa
1. Escrever e balancear a reação por oxirredução ou método das tentativas.
2. Corrigir a massa do reagente com o teor de pureza: m_pura = m_bruta · (% pureza / 100).
3. Determinar o reagente limitante comparando o quociente entre o número de mols disponível e o coeficiente estequiométrico: o menor quociente identifica o reagente que dita o fim da reação.
4. Calcular a quantidade teórica do produto baseando-se estritamente no reagente limitante.
5. Aplicar o rendimento real da reação: m_real = m_teorica · (% rendimento / 100).

### 3. Problema Modelo Resolvido
**Problema**: A ustulação da pirita (FeS₂, massa molar = 120 g/mol) é a primeira etapa na síntese do ácido sulfúrico industrial, ocorrendo segundo a equação:
4 FeS₂ (s) + 11 O₂ (g) → 2 Fe₂O₃ (s) + 8 SO₂ (g).
Uma indústria queima 600 kg de pirita mineral com 80% de pureza em FeS₂, na presença de excesso de oxigênio gasoso. Sabendo que o rendimento do processo é de 90%, qual é o volume de dióxido de enxofre (SO₂, medido nas CNTP) obtido?

**Resolução**:
1. Massa pura de FeS₂:
   m_pura = 600 kg · 0,80 = 480 kg = 480.000 gramas.
2. Número de mols de FeS₂:
   n(FeS₂) = 480.000 g / (120 g/mol) = 4.000 mols de FeS₂.
3. Proporção estequiométrica:
   4 mols de FeS₂ produzem 8 mols de SO₂ (proporção 1 : 2).
   Logo, 4.000 mols de FeS₂ produzem teoricamente:
   n_teorico(SO₂) = 4.000 · 2 = 8.000 mols de SO₂.
4. Considerando o rendimento de 90%:
   n_real(SO₂) = 8.000 · 0,90 = 7.200 mols de SO₂.
5. Convertendo para volume nas CNTP (22,4 L por mol):
   V = 7.200 mols · 22,4 L/mol = 161.280 Litros de SO₂ (ou 161,28 m³).`,
      },
      {
        id: "chap-curr-qui-3",
        position: 3,
        title: "Capítulo III — Termoquímica, Lei de Hess e Cinética Química",
        is_free_preview: true,
        content: `### 1. Entalpia e Processos Endotérmicos vs. Exotérmicos
* **Processos Exotérmicos (ΔH < 0)**: O sistema libera calor para o ambiente (entalpia dos produtos é menor que a dos reagentes: H_p < H_r).
* **Processos Endotérmicos (ΔH > 0)**: O sistema absorve calor do meio (H_p > H_r).

### 2. A Lei de Hess
A variação de entalpia de uma reação química depende unicamente do estado inicial dos reagentes e do estado final dos produtos, sendo independente do número ou da natureza das etapas intermediárias:
**ΔH_global = ∑ ΔH_etapas**
* Ao inverter o sentido de uma equação termoquímica, inverte-se o sinal de ΔH.
* Ao multiplicar os coeficientes estequiométricos por um fator n, multiplica-se o valor de ΔH pelo mesmo fator.

### 3. Cinética Química e Teoria das Colisões
Para que uma reação ocorra, os choques entre as moléculas devem ser eficazes (orientação geométrica favorável e energia cinética igual ou superior à **Energia de Ativação - E_a**).
* **Fatores que Aceleram a Reação**:
  - Aumento da Temperatura: Eleva a fração de moléculas com energia ≥ E_a.
  - Aumento da Concentração / Pressão: Aumenta a frequência de colisões por unidade de tempo.
  - Superfície de Contato: Quanto mais fragmentado o reagente sólido, maior a área exposta.
  - **Catalisadores**: Substâncias que aumentam a velocidade da reação por fornecerem um mecanismo alternativo com **menor energia de ativação**, sem serem consumidos no balanço final e sem alterar o ΔH da reação nem a constante de equilíbrio.`,
      },
      {
        id: "chap-curr-qui-4",
        position: 4,
        title: "Capítulo IV — Equilíbrio Químico, Princípio de Le Chatelier, pH, pOH e Soluções Tampão",
        is_free_preview: true,
        content: `### 1. Condição Dinâmica de Equilíbrio Químico
Um equilíbrio químico é atingido em sistema fechado a temperatura constante quando a velocidade da reação direta iguala a velocidade da reação inversa (v_direta = v_inversa), mantendo as concentrações molares de reagentes e produtos invariáveis no tempo.
* Para a reação genérica aA + bB ⇌ cC + dD:
  Constante de Equilíbrio: **K_c = ([C]ᶜ · [D]ᵈ) / ([A]ᵃ · [B]ᵇ)** (sólidos puros e solventes puros não entram na expressão).

### 2. Princípio da Perturbação de Le Chatelier
Quando um fator externo (concentração, pressão ou temperatura) perturba um sistema em equilíbrio, este desloca-se no sentido que atenua a perturbação imposta:
* Aumento de Temperatura: Desloca no sentido endotérmico (absorve calor).
* Aumento de Pressão Total: Desloca no sentido de menor volume gasoso (menor soma dos coeficientes estequiométricos gasosos).
* Adição de um reagente: Desloca o equilíbrio para a direita (formação de produtos).

### 3. Equilíbrio Iônico da Água, Escala de pH e Tampões
O produto iônico da água a 25 °C é K_w = [H⁺] · [OH⁻] = 1,0 x 10⁻¹⁴.
* **pH = -log₁₀ [H⁺]**
* **pOH = -log₁₀ [OH⁻]**
* Em solução aquosa a 25 °C: **pH + pOH = 14**.
* **Solução Tampão**: Mistura de ácido fraco com seu sal correspondente (ou base fraca com seu sal). Equação de Henderson-Hasselbalch:
  pH = pK_a + log([Sal] / [Ácido]). Resiste a variações abruptas de pH na adição de pequenas quantidades de ácidos fortes ou bases fortes.`,
      },
      {
        id: "chap-curr-qui-5",
        position: 5,
        title: "Capítulo V — Eletroquímica: Potenciais Padrão, Pilhas Galvânicas e Leis da Eletrólise",
        is_free_preview: true,
        content: `### 1. Pilhas Galvânicas (Processos Espontâneos: Energia Química → Energia Elétrica)
* **Ânodo (Polo Negativo)**: Ocorre OXIDAÇÃO (perda de elétrons, corrosão do eletrodo).
* **Cátodo (Polo Positivo)**: Ocorre REDUÇÃO (ganho de elétrons, deposição de massa).
* Mnemônica Universal: **P-O-R-C-A** (Polo positivo reduz no cátodo; polo negativo oxida no ânodo).
* **Força Eletromotriz (d.d.p.) Padrão da Pilha**:
  ΔE° = E°_redução(cátodo) - E°_redução(ânodo) = E°_maior - E°_menor > 0.

### 2. Eletrólise (Processos Não Espontâneos: Energia Elétrica → Energia Química)
Provocada pela injeção forçada de corrente elétrica contínua via gerador externo.
* **Leis Quantitativas de Faraday**:
  A carga elétrica total é Q = i · t (com i em Amperes e t em segundos).
  A constante de Faraday é a carga de 1 mol de elétrons: **1 F = 96.500 Coulombs**.
  Massa depositada ou liberada: m = (M · i · t) / (n · F).`,
      },
      {
        id: "chap-curr-qui-6",
        position: 6,
        title: "Capítulo VI — Química Orgânica Integral: Funções Oxigenadas, Isomeria Espacial e Reações Orgânicas",
        is_free_preview: true,
        content: `### 1. Classificação das Cadeias Carbônicas e Funções Orgânicas
O carbono é tetravalente, realiza ligações sp³, sp² ou sp e forma cadeias estáveis:
* **Álcoois**: Grupo -OH ligado a carbono saturado (ex: etanol, CH₃CH₂OH).
* **Fenóis**: Grupo -OH ligado diretamente a anel aromático benzênico.
* **Aldeídos**: Carbonila terminal -CHO (ex: propanal).
* **Cetonas**: Carbonila entre dois carbonos -CO- (ex: acetona).
* **Ácidos Carboxílicos**: Grupo carboxila -COOH (ex: ácido etanoico).
* **Ésteres**: Derivados de ácidos (-COO-R), sintetizados por esterificação de Fischer: Ácido Carboxílico + Álcool ⇌ Éster + Água.

### 2. Isomeria Plana e Espacial (Estereoisomeria)
* **Isomeria Geométrica (Cis-Trans / E-Z)**: Ocorre em compostos com dupla ligação e ligantes diferentes em cada carbono da insaturação (R₁ ≠ R₂ e R₃ ≠ R₄).
* **Isomeria Óptica (Quiralidade)**: Ocorre na presença de ao menos um **carbono assimétrico ou quiral (C*)**, ligado a quatro grupos químicos inteiramente distintos entre si.
  - A molécula não é sobreponível à sua imagem especular (enantiômeros).
  - Enantiômeros desviam o plano da luz polarizada para a direita (dextrogiro, d) ou para a esquerda (levogiro, l) no mesmo ângulo θ. Mistura equimolar de ambos forma a **mistura racêmica** opticamente inativa.`,
      },
    ],
  },
  {
    id: "curr-biologia-ecologia-genetica",
    title: "Biologia Moderna: Da Célula aos Ecossistemas, Genética e Biotecnologia",
    subtitle: "Disciplina Curricular Integral · Ensino Médio, FUVEST, ENEM & Ciências da Saúde",
    author: "Profª. Helena Nogueira & Prof. Dr. Gabriel Fontes",
    discipline: "Biologia",
    grade_level: "Ensino Médio & ENEM",
    description: "Manual enciclopédico de Biologia para Ensino Médio e Vestibulares de Medicina. Compreende Bioquímica Celular, Membrana Plasmática e Transporte, Bioenergética (Fotossíntese, Fermentação e Respiração Celular com Cadeia Transportadora de Elétrons), Divisão Celular (Mitose e Meiose com Crossing-Over), Genética Mendeliana e Molecular, Teoria Sintética da Evolução e Ecologia Quantitativa.",
    cover_url: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=1200&auto=format&fit=crop&q=80",
    year: 2026,
    read_time: 470,
    downloads: 36700,
    rating: 4.97,
    rating_count: 1350,
    chapters: [
      {
        id: "chap-curr-bio-1",
        position: 1,
        title: "Capítulo I — Bioquímica da Célula, Membrana Plasmática e Mecanismos de Transporte",
        is_free_preview: true,
        content: `### 1. Composição Molecular dos Seres Vivos
A vida baseia-se em compostos orgânicos e inorgânicos altamente ordenados:
* **Água e Sais Minerais**: A água atua como solvente universal devido à sua polaridade acentuada, alto calor específico (amortecedor térmico) e forças de coesão/adesão.
* **Carboidratos (Glicídios)**: Monossacarídeos (glicose, ribose), dissacarídeos (sacarose = glicose + frutose) e polissacarídeos (amido e glicogênio para reserva; celulose e quitina para estrutura).
* **Proteínas e Enzimas**: Polímeros de aminoácidos unidos por ligações peptídicas. As enzimas reduzem a energia de ativação de reações metabólicas e sofrem desnaturação por variações bruscas de pH e temperatura.

### 2. A Membrana Plasmática e o Modelo do Mosaico Fluido (Singer-Nicolson)
Bicamada fosfolipídica anfipática com cabeças hidrofílicas voltadas para o meio aquoso intra e extracelular e caudas hidrofóbicas apolares de ácidos graxos voltadas para o interior. Proteínas integrais e periféricas flutuam dinamicamente na matriz lipídica.

### 3. Fisiologia dos Transportes de Membrana
* **Transporte Passivo (Sem gasto de ATP, a favor do gradiente de concentração)**:
  - Difusão Simples: Passagem direta de pequenas moléculas apolares (O₂, CO₂) pela bicamada.
  - Difusão Facilitada: Passagem de substâncias polares ou íons via proteínas carreadoras (permeases) e canais iônicos (ex: glicose via transportadores GLUT).
  - Osmose: Fluxo espontâneo de solvente (água) do meio hipotônico (menos concentrado em soluto) para o meio hipertônico (mais concentrado em soluto) através de membrana semipermeável.
* **Transporte Ativo (Com consumo direto ou indireto de ATP, contra o gradiente)**:
  - Bomba de Sódio e Potássio (Na⁺/K⁺-ATPase): Bombeia ativamente 3 íons Na⁺ para fora da célula e 2 íons K⁺ para dentro, gerando o gradiente eletroquímico transmissor do impulso nervoso.`,
      },
      {
        id: "chap-curr-bio-2",
        position: 2,
        title: "Capítulo II — Bioenergética Celular: Glicólise, Ciclo de Krebs, Fosforilação Oxidativa e Fotossíntese",
        is_free_preview: true,
        content: `### 1. Respiração Celular Aeróbica
Processo catabólico que oxida a glicose (C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O + energia), dividindo-se em três etapas:
1. **Glicólise (Etapa Anaeróbica no Citosol)**:
   Uma molécula de glicose é clivada em 2 moléculas de piruvato (ácido pirúvico), com rendimento líquido de 2 ATP e 2 NADH.
2. **Ciclo de Krebs ou do Ácido Cítrico (Matriz Mitocondrial)**:
   O piruvato é descarboxilado e acoplado à Coenzima A formando Acetil-CoA. O ciclo promove a desidrogenação oxidativa completa, transferindo elétrons de alta energia para carreadores NAD⁺ e FAD, gerando CO₂ e GTP/ATP.
3. **Fosforilação Oxidativa e Cadeia Respiratória (Cristas Mitocondriais)**:
   Os elétrons de NADH e FADH₂ percorrem complexos proteicos transmembrana (I, II, III e IV), bombeando prótons H⁺ da matriz para o espaço intermembranas. O gradiente eletroquímico gerado força o retorno dos prótons pela enzima **ATP Sintase**, impulsionando a síntese de cerca de 28 a 30 ATPs por molécula de glicose. O oxigênio molecular (O₂) atua como o **aceptor final de elétrons e prótons**, formando água (H₂O).

### 2. Fotossíntese em Vegetais
Processo anabólico autotrófico nos cloroplastos (6 CO₂ + 6 H₂O + luz → C₆H₁₂O₆ + 6 O₂):
* **Fase Fotoquímica (Clara, nos Tilacoides)**: A clorofila absorve fótons de luz, impulsionando a fotólise da água (liberação de O₂) e a síntese de ATP e NADPH.
* **Fase Química (Ciclo de Calvin-Benson, no Estroma)**: Fixação do CO₂ atmosférico catalisada pela enzima RuBisCO, utilizando o ATP e o NADPH da fase clara para produzir glicose.`,
      },
      {
        id: "chap-curr-bio-3",
        position: 3,
        title: "Capítulo III — Genética Clássica Mendeliana, Alelos Múltiplos, Sistema ABO e Fator Rh",
        is_free_preview: true,
        content: `### 1. Primeira Lei de Mendel (Lei da Segregação dos Fatores)
Cada caráter fenotípico é determinado por um par de fatores (alelos) que se separam durante a gametogênese (meiose), de modo que cada gameta recebe apenas um alelo do par.
* Cruzamento monohíbrido padrão (Aa x Aa): Proporção genotípica de 1 AA : 2 Aa : 1 aa e fenotípica de 3 dominantes : 1 recessivo (75% : 25%).

### 2. Segunda Lei de Mendel (Segregação Independente)
Genes localizados em cromossomos homólogos distintos segregam de maneira independente durante a anáfase I da meiose.
* Cruzamento dihíbrido padrão (AaBb x AaBb): Proporção fenotípica clássica de 9 : 3 : 3 : 1.

### 3. Alelos Múltiplos e Tipagem Sanguínea Humana
* **Sistema ABO**: Determinado por três alelos (Iᴬ, Iᴮ e i), onde Iᴬ e Iᴮ são codominantes entre si e ambos são dominantes sobre i:
  - Grupo A: IᴬIᴬ ou Iᴬi (Possui aglutinogênio A na hemácia e aglutinina anti-B no plasma).
  - Grupo B: IᴮIᴮ ou Iᴮi (Aglutinogênio B e anti-A).
  - Grupo AB: IᴬIᴮ (Aglutinogênios A e B; ausência de aglutininas plasmáticas — Receptor Universal).
  - Grupo O: ii (Sem aglutinogênios; possui anti-A e anti-B — Doador Universal).
* **Fator Rh**: Herança monogênica simples. Indivíduos Rh⁺ possuem o antígeno D (genótipo RR ou Rr); indivíduos Rh⁻ não possuem (genótipo rr).
  - **Eritroblastose Fetal**: Ocorre quando mãe Rh⁻ gesta feto Rh⁺ (paternidade Rh⁺). A sensibilização no primeiro parto estimula a produção materna de anticorpos anti-Rh da classe IgG, que em gestações futuras ultrapassam a placenta e destroem as hemácias fetais. Previne-se injetando imunoglobulina anti-Rh na mãe em até 72 horas após o parto.`,
      },
      {
        id: "chap-curr-bio-4",
        position: 4,
        title: "Capítulo IV — Genética Molecular: O Dogma Central, Transcrição, Tradução e Engenharia Genética",
        is_free_preview: true,
        content: `### 1. O Dogma Central da Biologia Molecular
A informação genética flui unidirecionalmente do DNA para o RNA e deste para as Proteínas:
**DNA ──(Replicação)──> DNA ──(Transcrição)──> RNAm ──(Tradução)──> Polipeptídeo**

* **Estrutura do DNA**: Dupla hélice antiparalela (Watson e Crick) unida por pontes de hidrogênio complementares entre bases nitrogenadas: Adenina com Timina (A = T, 2 pontes) e Guanina com Citosina (G ≡ C, 3 pontes).
* **Transcrição**: A enzima RNA Polimerase sintetiza uma fita de RNA mensageiro complementar à fita-molde do DNA. Nos eucariotos ocorre o *splicing* (remoção de íntrons não codificantes e união de éxons).
* **Código Genético Universal e Degenerado**: Cada trinca de nucleotídeos no RNAm (códon) codifica um aminoácido específico trazido pelo RNAt portador do anticódon complementar. O código é degenerado pois múltiplos códons sinônimos codificam o mesmo aminoácido (ex: 64 códons possíveis para 20 aminoácidos). Códon de início universal: AUG (Metionina).`,
      },
      {
        id: "chap-curr-bio-5",
        position: 5,
        title: "Capítulo V — Ecologia: Cadeias Tróficas, Ciclos Biogeoquímicos e Dinâmica de Populações",
        is_free_preview: true,
        content: `### 1. Níveis de Organização Ecológica e Fluxo de Energia
Organismo ⟶ População ⟶ Comunidade (Biocenose) ⟶ Ecossistema ⟶ Biosfera.
* **Fluxo Unidirecional de Energia**: A energia solar capturada pelos produtores fotossintetizantes diminui progressivamente a cada nível trófico (produtores → consumidores primários → secundários → decompositores) devido à dissipação sob forma de calor metabólico (Princípio da Entropia). Pirâmides de energia são SEMPRE eretas.
* **Magnificação Trófica (Bioacumulação)**: Substâncias tóxicas não biodegradáveis (ex: mercúrio, pesticidas organoclorados) concentram-se em níveis crescentes ao longo da cadeia, atingindo concentrações letais máximas nos predadores do topo.

### 2. Ciclos Biogeoquímicos Fundamentais
* **Ciclo do Nitrogênio**:
  1. Fixação: Bactérias fixadoras (*Rhizobium* em leguminosas) convertem N₂ atmosférico em amônia (NH₃/NH₄⁺).
  2. Nitrificação (ocorre no solo em duas etapas):
     - Nitrosação (*Nitrosomonas*): 2 NH₃ + 3 O₂ → 2 NO₂⁻ (nitrito) + 2 H⁺ + 2 H₂O.
     - Nitratação (*Nitrobacter*): 2 NO₂⁻ + O₂ → 2 NO₃⁻ (nitrato assimilável pelas raízes).
  3. Desnitrificação (*Pseudomonas denitrificans*): Bactérias anaeróbicas convertem nitratos de volta em N₂ gasoso, completando o ciclo.`,
      },
    ],
  },
  {
    id: "curr-historia-geral-e-do-brasil",
    title: "História Geral & do Brasil: Da Antiguidade Clássica ao Mundo Contemporâneo",
    subtitle: "Disciplina Curricular Integral · Ensino Médio, FUVEST, UNICAMP & ENEM",
    author: "Prof. Dr. Marcos Vinicius Alencar & Profª. Beatriz Vasconcelos",
    discipline: "História",
    grade_level: "Ensino Médio & ENEM",
    description: "Tratado histórico crítico e aprofundado cobrindo Antiguidade Clássica (Grécia e Roma), Feudalismo e Renascimento Cultural, Formação dos Estados Nacionais e Colonização do Brasil, Iluminismo e Revoluções Burguesas, Brasil Império e a Crise da Escravidão, Século XX (Guerras Mundiais, Nazifascismo, Guerra Fria), Era Vargas, Ditadura Militar e Nova República.",
    cover_url: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=1200&auto=format&fit=crop&q=80",
    year: 2026,
    read_time: 450,
    downloads: 29800,
    rating: 4.98,
    rating_count: 1190,
    chapters: [
      {
        id: "chap-curr-hist-1",
        position: 1,
        title: "Capítulo I — A Antiguidade Clássica: A Democracia Ateniense e as Contradições de Roma",
        is_free_preview: true,
        content: `### 1. O Mundo Grego e a Pólis Ateniense
A civilização grega desenvolveu o conceito revolucionário de *pólis* (cidade-Estado autônoma). Em Atenas, as reformas de Clístenes (508 a.C.) instituíram a **democracia direta**:
* Todos os cidadãos reuniam-se na Assembleia (*Eclésia*) para votar leis e deliberar sobre a paz e a guerra.
* O princípio da *Isegoria* garantia direito igual à palavra; a *Isonomia* garantia igualdade perante a lei.
* **As Contradições Estruturais**: Apenas homens adultos livres, filhos de pais atenienses, eram considerados cidadãos (cerca de 10% da população). Mulheres, estrangeiros residentes (*metecos*) e uma massa monumental de pessoas escravizadas estavam excluídos de qualquer direito político. O ócio dos cidadãos era sustentado diretamente pelo trabalho servil e escravo.

### 2. A República Romana e a Transição para o Império
* Luta de Classes na República: O conflito secular entre os **Patrícios** (aristocracia latifundiária controladora do Senado) e os **Plebeus** (trabalhadores livres e soldados). As revoltas plebeias conquistaram a Lei das Doze Tábuas (450 a.C.) e o Tribunato da Plebe.
* Expansão Militar e Crise: As Guerras Púnicas contra Cartago transformaram o Mediterrâneo em *Mare Nostrum*. O influxo gigantesco de cativos de guerra generalizou o modo de produção escravista, arruinando os pequenos camponeses romanos e alimentando a ascensão dos generais triunviros (Júlio César, Pompeu e Crasso).
* O Principado de Augusto (27 a.C.): Fim da República e início da *Pax Romana*, sustentada pela política do "Pão e Circo" (*Panem et Circenses*) para controlar as massas urbanas.`,
      },
      {
        id: "chap-curr-hist-2",
        position: 2,
        title: "Capítulo II — O Brasil Colônia: O Sistema de Plantation Açucareiro e a Resistência Negra",
        is_free_preview: true,
        content: `### 1. A Estrutura do Sistema Colonial Mercantilista
A colonização portuguesa do Brasil inseriu-se na expansão marítima europeia sob a lógica do **Pacto Colonial (Exclusivo Metropolitano)**.
A economia açucareira do Nordeste organizou-se sob o tripé do **Plantation**:
1. **Latifúndio**: Monopolização concentrada de grandes extensões de terra concedidas pelas sesmarias.
2. **Monocultura de Exportação**: Produção em larga escala de cana-de-açúcar voltada unicamente às necessidades do mercado europeu.
3. **Escravidão como Base Produtiva**: O tráfico transatlântico de africanos escravizados gerou vultosos lucros fiscais para a Coroa e estabeleceu a engrenagem desumanizadora que estruturou a sociedade colonial.

### 2. A Sociedade Patriarcal e os Quilombos como Resistência Política
A casa-grande e a senzala simbolizavam a dominação patriarcal absoluta do senhor de engenho sobre a família, os agregados e os escravizados.
A resistência negra nunca foi passiva: manifestou-se por meio de rebeliões armadas, suicídios, infanticídios, manutenção sincretizada de religiões de matriz africana e a criação de **Quilombos**. O Quilombo dos Palmares, liderado por Ganga Zumba e Zumbi na Serra da Barriga, constituiu a maior comunidade autônoma e multiétnica de resistência anti-escravocrata das Américas durante o século XVII.`,
      },
      {
        id: "chap-curr-hist-3",
        position: 3,
        title: "Capítulo III — O Iluminismo, a Revolução Francesa e as Revoluções Industriais",
        is_free_preview: true,
        content: `### 1. As Luzes contra o Antigo Regime
O Iluminismo europeu do século XVIII questionou os pilares do Absolutismo monárquico de direito divino e do Mercantilismo:
* **John Locke**: Direitos naturais inalienáveis (vida, liberdade e propriedade); contrato social.
* **Montesquieu**: Teoria da separação tripartite dos poderes (Executivo, Legislativo e Judiciário).
* **Rousseau**: Soberania popular e a vontade geral (*Contrato Social*).
* **Adam Smith**: Liberalismo econômico e a mão invisível do mercado contra o protecionismo estatal.

### 2. A Revolução Francesa (1789) e suas Fases
A crise fiscal e social da França dos três Estados culminou na tomada da Bastilha em 14 de julho de 1789.
* Fase da Assembleia Nacional e Declaração dos Direitos do Homem e do Cidadão.
* Fase da Convenção Nacional (1792-1795): Ascensão dos Jacobinos liderados por Robespierre, abolição da escravidão nas colônias, reforma agrária e o Período do Terror.
* Reação Termidoriana e o Golpe do 18 de Brumário de Napoleão Bonaparte.

### 3. A Revolução Industrial Inglesa e o Surgimento do Proletariado
O cercamento dos campos (*Enclosures*) gerou o êxodo rural massivo para os centros urbanos. A máquina a vapor de James Watt (1769) substituiu a manufatura pela maquinofatura, impondo jornadas extenuantes de 16 horas diárias, exploração sistemática do trabalho infantil e originando as primeiras associações sindicais (*Trade Unions*) e o movimento cartista.`,
      },
      {
        id: "chap-curr-hist-4",
        position: 4,
        title: "Capítulo IV — Brasil Império: A Independência, o Segundo Reinado e a Abolição Incompleta",
        is_free_preview: true,
        content: `### 1. A Construção do Estado Nacional Brasileiro
A vinda da Família Real portuguesa em 1808 rompeu o pacto colonial com a Abertura dos Portos às Nações Amigas. A Independência de 1822 foi conduzida pelas elites agrárias conservadoras, preservando a monarquia bragantina, o latifúndio e a escravidão, ao custo da marginalização popular.
* A Constituição Outorgada de 1824 e o Poder Moderador pessoal do Imperador.

### 2. O Segundo Reinado (1840-1889) e a Economia Cafeeira
Sob o governo de D. Pedro II, o café no Vale do Paraíba e no Oeste Paulista tornou-se o motor hegemônico das exportações brasileiras.
* **A Transição do Trabalho Escravo para o Trabalho Imigrante**:
  - Lei Eusébio de Queirós (1850): Extinção do tráfico transatlântico e redirecionamento de capitais para ferrovias e infraestrutura urbana.
  - A Lei de Terras (1850): Proibição da posse de terras públicas devolutas por ocupação, exigindo compra em leilão monetizado para impedir que negros libertos e imigrantes pobres se tornassem proprietários rurais.
  - O Processo Abolicionista Lento e Gradual: Lei do Ventre Livre (1871), Lei dos Sexagenários (1885) e a Lei Áurea (1888), promulgada sem qualquer distribuição de terras, indenização ou inserção cidadã aos negros recém-libertos, legando uma dívida estrutural de desigualdade racial no Brasil contemporâneo.`,
      },
      {
        id: "chap-curr-hist-5",
        position: 5,
        title: "Capítulo V — O Século XX: Guerras Mundiais, Totalitarismos, Guerra Fria e Ditadura Militar no Brasil",
        is_free_preview: true,
        content: `### 1. A Era dos Extremos: Guerras Mundiais e Totalitarismo
A disputa imperialista pelo controle de mercados na África e Ásia detonou a Primeira Guerra Mundial (1914-1918). O Tratado de Versalhes humilhou a Alemanha e semeou o revanchismo. A Crise de 1929 pulverizou o liberalismo econômico clássico, abrindo espaço para a ascensão do Fascismo na Itália e do Nazismo na Alemanha.
* A Segunda Guerra Mundial (1939-1945) e o horror do Holocausto. O desfecho com os bombardeios atômicos sobre Hiroshima e Nagasaki e a bipolarização da Guerra Fria entre EUA e URSS.

### 2. O Brasil: Da Era Vargas à Ditadura Militar
* **A Era Vargas (1930-1945)**: Centralização do poder, industrialização de base (CSN, Vale) e criação da CLT e dos direitos trabalhistas sob tutela estatal corporativista.
* **O Golpe Civil-Militar de 1964 e os Anos de Chumbo**: Deposição do presidente João Goulart. Fechamento do Congresso, edição do Ato Institucional nº 5 (AI-5 em 1968), suspensão do habeas corpus, censura prévia à imprensa e perseguição e tortura a opositores políticos pelo aparato do DOI-CODI.
* O processo de redemocratização lento e seguro (governo Geisel), o movimento das "Diretas Já" (1984) e a promulgação da Constituição Cidadã de 1988, que consolidou o Estado Democrático de Direito no Brasil.`,
      },
    ],
  },
  {
    id: "curr-redacao-literatura-vestibulares",
    title: "Redação Nota 1000 & Literatura Brasileira e Portuguesa",
    subtitle: "Disciplina Curricular Integral · Obras de Referência, Escolas Estéticas & Manual Dissertativo do ENEM",
    author: "Profª. Dra. Mariana Peixoto & Prof. Renato Silveira",
    discipline: "Língua Portuguesa & Redação",
    grade_level: "Ensino Médio & Pré-Vestibular",
    description: "Manual canônico definitivo para provas de Língua Portuguesa, Literatura e Redação nos vestibulares mais disputados do Brasil. Contém o estudo analítico de todas as escolas literárias desde o Classicismo de Camões até o Modernismo e a Literatura Contemporânea, acompanhado de roteiro estrutural passo a passo para a redação dissertativo-argumentativa nota 1000 no ENEM com projeto de texto, operadores argumentativos e propostas de intervenção detalhadas nos 5 elementos obrigatórios.",
    cover_url: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&auto=format&fit=crop&q=80",
    year: 2026,
    read_time: 430,
    downloads: 33100,
    rating: 4.99,
    rating_count: 1490,
    chapters: [
      {
        id: "chap-curr-red-1",
        position: 1,
        title: "Capítulo I — A Estrutura Nota 1000 da Redação Dissertativo-Argumentativa do ENEM",
        is_free_preview: true,
        content: `### 1. As Cinco Competências Avaliativas da Matriz do ENEM
A redação do ENEM é avaliada por dois corretores independentes em cinco competências que somam 1.000 pontos (200 pontos cada):
1. **Competência 1 (Norma Padrão)**: Domínio formal da língua escrita (concordância verbal/nominal, regência, crase, pontuação precisa e vocabulário erudito sem desvios).
2. **Competência 2 (Compreensão do Tema e Repertório Sociocultural)**: Compreender a proposta sem tangenciamento e aplicar conceitos consistentes de outras áreas do conhecimento (Filosofia, Sociologia, História, Literatura). O repertório deve ser **legítimo, produtivo e pertinente** ao tema.
3. **Competência 3 (Projeto de Texto e Argumentação)**: Selecionar, relacionar, organizar e interpretar informações e argumentos em defesa de um ponto de vista com encadeamento lógico e autoria (sem lacunas de raciocínio).
4. **Competência 4 (Coesão Textual e Operadores Interparágrafos)**: Emprego diversificado de conectivos lógicos interparágrafos (ex: *Em primeira análise*, *Ademais*, *Por conseguinte*, *Nesse sentido*) e intraparágrafos sem repetições viciosas.
5. **Competência 5 (Proposta de Intervenção Social)**: Elaboração de solução detalhada para o problema respeitando os Direitos Humanos e articulando impreterivelmente os **5 Elementos Obrigatórios**:
   - **Agente**: Quem executará a ação (ex: Ministério da Educação, Ministério da Saúde).
   - **Ação**: O que será feito (verbo de ação claro).
   - **Meio / Modo**: Por meio de quê (ex: "por intermédio de parcerias público-privadas").
   - **Efeito / Finalidade**: Para que objetivo (ex: "a fim de mitigar a exclusão digital").
   - **Detalhamento**: Uma explicação explicativa aprofundada de um dos quatro elementos anteriores.

### 2. O Esqueleto Canônico de Quatro Parágrafos
* **Parágrafo 1 (Introdução - 6 a 8 linhas)**:
  - Contextualização / Repertório Inicial (Constituição de 1988, filósofo ou alusão literária).
  - Apresentação clara do tema sem recortes truncados.
  - Tese bipartida com os dois eixos argumentativos (D1 e D2) que serão destrinchados nos parágrafos seguintes.
* **Parágrafo 2 (Desenvolvimento 1 - 7 a 9 linhas)**:
  - Tópico Frasal confirmando D1.
  - Repertório sociocultural legítimo fundamentando a causa (ex: Hannah Arendt e a banalidade do mal, Bauman e a modernidade líquida).
  - Análise crítica do impacto social prático.
  - Frase de fechamento do argumento.
* **Parágrafo 3 (Desenvolvimento 2 - 7 a 9 linhas)**:
  - Conectivo aditivo interparágrafo (*Ademais*, *Outrossim*).
  - Tópico Frasal confirmando D2 (geralmente inoperância estatal ou herança sociocultural).
  - Repertório de autoridade (ex: Thomas Hobbes e o contrato social quebrado, Gilberto Dimenstein e o cidadão de papel).
  - Conclusão crítica do segundo problema.
* **Parágrafo 4 (Conclusão - 7 a 9 linhas)**:
  - Conectivo conclusivo (*Portanto*, *Infere-se, dessarte*).
  - Retomada sintética da tese central.
  - Proposta de intervenção completa com os 5 elementos (Agente, Ação, Meio, Efeito e Detalhamento).
  - Fechamento com frase de impacto retomando a alusão utilizada na introdução.`,
      },
      {
        id: "chap-curr-red-2",
        position: 2,
        title: "Capítulo II — Do Classicismo ao Barroco: Camões e Gregório de Matos",
        is_free_preview: true,
        content: `### 1. O Classicismo Renascentista e Luís de Camões
O século XVI marcou o retorno aos ideais de equilíbrio, proporção e racionalidade da Antiguidade greco-romana.
* **Luís Vaz de Camões**:
  - Lírica Filosófica: O soneto decassílabo petrarquiano, o amor platônico idealizado confrontado com o amor sensual terreno, o desconcerto do mundo e as mutações da fortuna (*"Mudam-se os tempos, mudam-se as vontades"*).
  - Épica Nacional (*Os Lusíadas*, 1572): Dez cantos em oitava rima celebrando a viagem de Vasco da Gama às Índias e a coragem civilizatória portuguesa, integrando a mitologia pagã à fé cristã.

### 2. O Barroco e o Conflito Espiritual do Seiscentismo
O Barroco reflete as tensões agônicas da Contra-Reforma católica: a cisão insolúvel entre a fé e a razão, o pecado e a salvação, a carne efêmera e o espírito eterno.
* Figuras de Linguagem Predominantes: Antítese, paradoxo, hipérbato e metáforas conceituais.
* **Cultismo (Gongorismo)**: Jogo sensorial de palavras, rebuscamento formal e ornamentação retórica.
* **Conceptismo (Quevedismo)**: Jogo dialético de ideias, raciocínio lógico e argumentação persuasiva (típica dos sermões do Padre Antônio Vieira).
* **Gregório de Matos Guerra ("O Boca do Inferno")**:
  - Poesia Satírica: Crítica corrosiva e despudorada à hipocrisia das elites coloniais de Salvador, aos governadores corruptos e ao clero devasso.
  - Poesia Lírico-Amorosa e Religiosa: Pedidos desesperados de perdão divino marcados pela culpa existencial (*"Pequei, Senhor, mas não porque hei pecado..."*).`,
      },
      {
        id: "chap-curr-red-3",
        position: 3,
        title: "Capítulo III — O Realismo-Naturalismo de Machado de Assis e Aluísio Azevedo",
        is_free_preview: true,
        content: `### 1. A Ruptura com a Ilusão Romântica
Em oposição ao sentimentalismo idealizado e ao escapismo do Romantismo, o Realismo da segunda metade do século XIX adotou o objetivismo analítico, a denúncia das máscaras sociais da burguesia e a verossimilhança psicológica.

### 2. Machado de Assis: O Cume do Realismo Brasileiro
Fundador da Academia Brasileira de Letras, Machado operou uma revolução formal a partir de *Memórias Póstumas de Brás Cubas* (1881):
* **O Defunto-Autor**: Narrador em primeira pessoa desprovido de escrúpulos morais e sem medo do julgamento dos vivos, expondo as entranhas da elite escravocrata carioca.
* **Digressões Metalinguísticas**: Conversas diretas com o leitor, quebrando a ilusão mimética linear da narrativa.
* **Ironia Fina e Pessimismo Cético**: A teoria do Humanitismo de Quincas Borba (*"Ao vencedor, as batatas!"*) satiriza o darwinismo social e as ilusões do progresso positivista.
* *Dom Casmurro* (1899): O monólogo paranóico e ciumento de Bento Santiago, cuja narrativa manipuladora deixa em eterno mistério insolúvel a culpa ou inocência de Capitu.

### 3. O Naturalismo e o Determinismo Biológico
Enquanto o Realismo foca na dissecação psicológica das elites, o Naturalismo foca no coletivo, nos estratos marginalizados e no determinismo cego (o homem visto como animal biológico governado pelos instintos sexuais e pelo meio ambiente).
* **Aluísio Azevedo (*O Cortiço*, 1890)**: O cortiço São Romão atua como personagem coletivo que animaliza (*zoomorfização*) e corrompe seus habitantes sob o calor tropical do Rio de Janeiro.`,
      },
      {
        id: "chap-curr-red-4",
        position: 4,
        title: "Capítulo IV — O Modernismo de 1922 e a Tríade de Ouro de 1930",
        is_free_preview: true,
        content: `### 1. A Semana de Arte Moderna de 1922 (Fase Heroica / Destrutiva)
Ocorrida no Teatro Municipal de São Paulo, proclamou a libertação estética dos padrões parnasianos rígidos:
* Liberdade formal: Verso livre, poema-piada, abolição da métrica e rima compulsórias e incorporação da oralidade cotidiana brasileira.
* **Oswald de Andrade**: O *Manifesto Antropófago* (1928) — *"Tupi or not tupi, that is the question"*. A metáfora da devoração crítica da cultura estrangeira para digeri-la e fundar uma arte autenticamente brasileira e autônoma.
* **Mário de Andrade (*Macunaíma*, 1928)**: O herói sem nenhum caráter, rapsódia que funde as lendas indígenas e as falas regionais do país.

### 2. A Geração de 1930: O Romance Social e a Alta Poesia
Superada a fase inicial de choque, a segunda fase modernista aprofundou o engajamento sociopolítico e a densidade existencial:
* **Graciliano Ramos (*Vidas Secas*, 1938)**: Prosa desidratada e concisa narrando a via-crúcis da família de retirantes sertanejos (Fabiano, Sinhá Vitória, os meninos e a cadela Baleia) brutalizada pela seca e pela opressão latifundiária.
* **Carlos Drummond de Andrade**: O sentimento do mundo, a gaucheza, o desencanto lúcido com a modernidade e a reflexão ontológica sobre a poesia (*"No meio do caminho tinha uma pedra"*).
* **Clarice Lispector e Guimarães Rosa (Geração de 45)**: A epifania mística no fluxo de consciência de Clarice e a recriação monumental da linguagem sertaneja universalizada em *Grande Sertão: Veredas* (*"O sertão está em toda parte"*).`,
      },
    ],
  },
];
