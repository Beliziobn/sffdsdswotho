export const QUANTICA_ARTICLE = {
  id: "sci-computacao-quantica-decoerencia",
  title: "Supressão de Decoerência em Qubits Supercondutores via Códigos de Superfície",
  subtitle: "Artigo Científico Peer-Reviewed · Física Quântica & Computação de Baixa Temperatura",
  author: "Dr. Alexei Morozov, Dra. Sofia L. Chen & Dr. Marcos V. Ribeiro",
  institution: "Laboratório de Dispositivos Quânticos & Instituto de Física Teórica",
  field: "Física Quântica",
  doi: "10.1103/PhysRevX.2026.041029",
  description: "Trabalho experimental aprofundado sobre arquiteturas de qubits supercondutores do tipo Transmon com aplicação de códigos de correção de erros de superfície (Surface Codes), demonstrando supressão de ruído térmico, dinâmica de quasi-partículas e preservação de coerência quântica acima do limiar crítico de tolerância a falhas.",
  cover_url: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&auto=format&fit=crop&q=80",
  published_at: "2026-03-14",
  read_time: 75,
  peer_reviewed: true,
  downloads: 24800,
  rating: 4.98,
  rating_count: 820,
  chapters: [
    {
      id: "sci-quant-1",
      position: 1,
      title: "1. Abstract Estruturado, Contexto e Questões de Pesquisa",
      is_free_preview: true,
      content: `### RESUMO ESTRUTURADO

**Contexto:** A construção de computadores quânticos tolerantes a falhas (*fault-tolerant quantum computing*) enfrenta o obstáculo persistente da decoerência quântica. Em circuitos supercondutores baseados em junções Josephson do tipo Transmon, flutuações de carga residual em dois níveis (TLS - *Two-Level Systems*), ruído de fluxo magnético $1/f$ e rajadas de quase-partículas provocadas por radiação ionizante ambiental rompem a superposição quântica antes que algoritmos profundos de Shor ou simulação de química quântica possam ser executados.

**Objetivo:** Demonstrar experimentalmente a supressão exponencial da taxa de erro lógico em um processador de 72 qubits supercondutores Transmon acoplados em malha planar quadrada bidimensional, através da implementação sustentada de um código de superfície topológico com distância variável de $d = 3$ a $d = 5$.

**Métodos:** Operamos o dispositivo em um refrigerador de diluição com base criogênica de $11,8 \\pm 0,2 \\text{ mK}$. A extração de síndrome de erro foi realizada através de ciclos consecutivos de estabilizadores de peso 4 nos operadores de Pauli $X$ (detecção de inversão de fase) e $Z$ (detecção de inversão de bit) intercalados por portas CNOT de fluxo adiabático e leitura ressonante multiplexada com amplificadores paramétricos TWPA.

**Resultados:** Com distância topológica $d = 5$, a taxa de erro lógico por ciclo de estabilizador decaiu para $\\epsilon_L = 0,114\\%$, marcando a primeira vez que um qubit lógico supercondutor operou com fidelidade superior à média de seus qubits físicos individuais por um fator de ganho de $3,8\\times$.

**Palavras-Chave:** Computação Quântica, Qubits Transmon, Código de Superfície, Decoerência, Junções Josephson, Correção de Erros Quânticos.`,
    },
    {
      id: "sci-quant-2",
      position: 2,
      title: "2. Fundamentação Teórica: Biofísica do Transmon e o Código de Superfície",
      is_free_preview: true,
      content: `### 2. Fundamentação Teórica e Hamiltoniano do Transmon

O qubit Transmon é uma variante do circuito oscilador não-linear de Cooper-Pair Box (CPB), projetado especificamente para operar no regime de grande razão entre a energia Josephson $E_J$ e a energia de carga eletrostática $E_C$:
$$\\frac{E_J}{E_C} \\gg 1 \\quad (\\text{tipicamente entre } 50 \\text{ e } 85)$$
O Hamiltoniano quântico efetivo do sistema pode ser escrito como:
$$\\hat{H} = 4 E_C (\\hat{n} - n_g)^2 - E_J \\cos(\\hat{\\phi})$$
onde $\\hat{n}$ é o operador do número de pares de Cooper transferidos através da barreira isolante de óxido de alumínio ($\\text{AlO}_x$), $n_g = C_g V_g / (2e)$ é a carga de polarização da porta externa e $\\hat{\\phi}$ é a diferença de fase quântica da função de onda supercondutora através da junção.

No regime Transmon ($E_J/E_C \\gg 1$), a dispersão de carga nos autovalores de energia decai exponencialmente:
$$\\Delta E_k \\propto (-1)^k E_C 2^{4k+5} \\sqrt{\\frac{2}{\\pi}} \\left(\\frac{E_J}{2E_C}\\right)^{\\frac{k}{2} + \\frac{3}{4}} \\exp\\left(-\\sqrt{\\frac{8E_J}{E_C}}\\right)$$
Esse decaimento exponencial anula a sensibilidade do qubit ao ruído de carga eletrostática de baixa frequência em ordens de magnitude. A não-linearidade residual da junção Josephson preserva uma anarmonicidade fraca:
$$\\alpha = \\omega_{12} - \\omega_{01} \\approx -E_C / \\hbar$$
permitindo o endereçamento seletivo dos dois níveis lógicos $|0\\rangle$ e $|1\\rangle$ através de micro-ondas de controle na faixa de $4 \\text{ a } 6 \\text{ GHz}$ sem transições espúrias para estados excitados superiores $|2\\rangle$.

#### Topologia do Código de Superfície (Surface Code)
O código de superfície distribui um estado quântico lógico bidimensional $|\psi_L\\rangle = \\alpha |0_L\\rangle + \\beta |1_L\\rangle$ em uma rede planar de $N = d^2 + (d - 1)^2$ qubits físicos.
A rede é dividida em dois tipos de qubits:
1. **Qubits de Dados:** Armazenam a função de onda entrelaçada do estado lógico.
2. **Qubits de Ancilla (Medição):** Situados nos vértices e no centro de cada plaqueta quadrada, responsáveis pela medição dos operadores estabilizadores:
   - Estabilizadores de Vértice (Plachetas $X$): $\\hat{S}_v = \\bigotimes_{i \\in v} \\hat{\\sigma}_x^{(i)}$
   - Estabilizadores de Plaqueta (Plachetas $Z$): $\\hat{S}_p = \\bigotimes_{j \\in p} \\hat{\\sigma}_z^{(j)}$

Como todos os estabilizadores comutam mutuamente ($[\\hat{S}_i, \\hat{S}_j] = 0$) e comutam com os operadores lógicos $\\hat{X}_L$ e $\\hat{Z}_L$, a medição contínua dos autovalores de $\\hat{S}_i \\in \\{+1, -1\\}$ revela a localização espacial de erros de inversão de fase e de bit sem colapsar a superposição da informação lógica codificada.`,
    },
    {
      id: "sci-quant-3",
      position: 3,
      title: "3. Metodologia Experimental: Fabricação, Criogenia e Calibração DRAG",
      is_free_preview: true,
      content: `### 3. Protocolo Experimental e Infraestrutura Instrumental

#### Fabricação do Dispositivo Quântico
O processador de 72 qubits foi manufaturado em ambiente de sala limpa Classe 100 sobre substrato de safira de alta resistividade ($C$-plane, $\\epsilon_r \\approx 10$).
1. **Metalização de Tântalo:** Deposição de filme fino de tântalo ($\alpha$-Ta) de $120 \\text{ nm}$ via pulverização catódica por feixe de íons (IBS) sob temperatura de $500^\\circ\\text{C}$ para minimizar defeitos intersticiais.
2. **Litografia por Feixe de Elétrons (EBL):** Definição das geometrias das junções Josephson com feixe de elétrons de $100 \\text{ keV}$ em bicamada de resina MMA/PMMA.
3. **Evaporação Angular de Dolan (Técnica de Sombras):** Evaporação em dois ângulos de alumínio puro com passo intermediário de oxidação térmica estática controlada ($P_{\\text{O}_2} = 50 \\text{ mbar}$, $t = 15 \\text{ min}$) para crescimento de camada barreira de $\\text{AlO}_x$ com espessura uniforme de $1,2 \\text{ nm}$.

#### Arquitetura Criogênica
O chip foi instalado no estágio de mistura de um refrigerador de diluição BlueFors XLD operando a $11,8 \\text{ mK}$. A blindagem contra perturbações eletromagnéticas incluiu:
- Três camadas concêntricas de Cryoperm de alta permeabilidade magnética;
- Blindagem supercondutora de chumbo e cobre isento de oxigênio (OFHC);
- Filtros atenuadores de infravermelho e filtros passa-baixa de pó de ferro e cobre em todas as 84 linhas semirrígidas coaxiais de controle.

#### Otimização de Portas Quânticas via DRAG (Derivative Removal by Adiabatic Gate)
Para eliminar transições induzidas para o estado não-computacional $|2\\rangle$, os pulsos de controle gaussiano em quadratura foram modelados por:
$$\\Omega_x(t) = A \\exp\\left(-\\frac{t^2}{2\\sigma^2}\\right), \\quad \\Omega_y(t) = -\\frac{\\beta}{\\alpha} \\frac{d\\Omega_x(t)}{dt}$$
A calibração fina via *Randomized Benchmarking* (RB) e *Interleaved RB* forneceu:
- Tempo de porta de 1 qubit: $20 \\text{ ns}$ com fidelidade média $\\mathcal{F}_{1Q} = 99,94 \\pm 0,02\\%$.
- Tempo de porta CZ de 2 qubits (sintonização adiabática de fluxo em barramentos ressonantes acoplados): $38 \\text{ ns}$ com fidelidade média $\\mathcal{F}_{2Q} = 99,62 \\pm 0,05\\%$.`,
    },
    {
      id: "sci-quant-4",
      position: 4,
      title: "4. Análise de Síndrome, Decodificação MWPM e Supressão Exponencial",
      is_free_preview: true,
      content: `### 4. Extração de Síndromes e Decodificação em Tempo Real

A validação do código de superfície exigiu a execução contínua de até 50 ciclos consecutivos de medição de estabilizadores sem interrupção criogênica.

> • **Ciclo k-1:** [ Medição de Plaqueta Z ] --> Autovalor = +1 (Sem erro)  
> • **Ciclo k:** [ Inversão de Bit Espúria ] --> Autovalor = -1 (Defeito Detectado)  
> • **Ciclo k+1:** [ Medição de Plaqueta Z ] --> Autovalor = -1 (Extremidade do Erro)

Um erro em um qubit de dados gera um par de defeitos nos estabilizadores adjacentes na malha espaciotemporal tridimensional ($2\\text{D espaciais} + 1\\text{D temporal}$).

#### O Algoritmo de Emparelhamento Perfeito de Peso Mínimo (MWPM)
Utilizamos uma implementação acelerada em GPU/FPGA do algoritmo de Blossom de Jack Edmonds para emparelhar os vértices de defeito no grafo espaciotemporal.
O peso de uma aresta entre dois defeitos $u$ e $v$ é dado pela distância manhattan renormalizada pela taxa de probabilidade de erro:
$$w(u, v) = -\\ln\\left(P_{\\text{erro}}(u, v)\\right)$$
O decodificador calcula a configuração mais provável de erros físicos compatível com a síndrome observada com latência de processamento de $1,4 \\text{ }\\mu\\text{s}$.

#### Comparação de Distâncias de Código ($d = 3$ vs $d = 5$):
- **Código $d = 3$ (17 Qubits físicos):** Taxa de erro lógico por ciclo de estabilizador de $\\epsilon_{L, 3} = 0,42\\%$.
- **Código $d = 5$ (49 Qubits físicos):** Taxa de erro lógico por ciclo de $\\epsilon_{L, 5} = 0,114\\%$.

A razão de supressão $\\Lambda = \\epsilon_{L, 3} / \\epsilon_{L, 5} = 3,68$ confirma o comportamento escalar exponencial previsto pela mecânica estatística:
$$\\epsilon_L \\propto \\left(\\frac{p}{p_{\\text{th}}}\\right)^{\\frac{d+1}{2}}$$
provando que a qualidade das portas físicas do dispositivo ultrapassou o limiar de tolerância a falhas ($p < p_{\\text{th}} \\approx 0,75\\%$).`,
    },
    {
      id: "sci-quant-5",
      position: 5,
      title: "5. Discussão Crítica, Limitações Físicas e Perspectivas Futuras",
      is_free_preview: true,
      content: `### 5. Discussão dos Mecanismos Físicos e Limitações

Apesar do sucesso na demonstração de supressão de erro, identificamos eventos correlacionados raros que desafiam a hipótese de ruído i.i.d. (independente e identicamente distribuído):
1. **Rajadas de Quase-partículas por Raios Cósmicos:** Impactos de múons secundários no substrato de safira geram fônons acústicos de alta energia ($> 2\\Delta_{\\text{Al}} \\approx 360 \\text{ }\\mu\\text{eV}$) que quebram pares de Cooper em larga escala por todo o chip, induzindo eventos de erro correlacionados em múltiplos qubits separados por até $4 \\text{ mm}$.
2. **Armadilhas de Quase-partículas:** A inclusão de filmes de alumínio de gap normal na periferia das linhas de terra reduziu o tempo de residência das quase-partículas de $45 \\text{ }\\mu\\text{s}$ para $3,2 \\text{ }\\mu\\text{s}$.

#### Conclusões Finais:
O estudo demonstra que a computação quântica escalável em circuitos supercondutores é viável sob a topologia de códigos de superfície planares, fornecendo o arcabouço tecnológico necessário para a implementação de portas lógicas transversais não-Clifford (como a porta T via destilação de estados mágicos) em arquiteturas de próxima geração.

### REFERÊNCIAS BIBLIOGRÁFICAS
1. Fowler, A. G., Mariantoni, M., Martinis, J. M., & Cleland, A. N. (2012). Surface codes: Towards practical large-scale quantum computation. *Physical Review A*, 86(3), 032324.
2. Barends, R., et al. (2014). Superconducting quantum circuits at the surface code threshold for fault tolerance. *Nature*, 508(7497), 500-503.
3. Krinner, S., et al. (2022). Realizing repeated quantum error correction in a distance-three surface code. *Nature*, 605(7911), 669-674.
4. Google Quantum AI. (2023). Suppressing quantum errors by scaling a quantum logical qubit. *Nature*, 614(7949), 676-681.
5. McEwen, M., et al. (2022). Resolving catastrophic error bursts from cosmic rays in large arrays of superconducting qubits. *Science*, 377(6612), 1385-1389.`,
    },
  ],
};
