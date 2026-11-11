export const BIOLOGIA_BOOK = {
  id: "curr-biologia-ecologia-genetica",
  title: "Biologia Moderna: Da Bioquímica Molecular à Evolução e Ecossistemas Globais",
  subtitle: "Tratado Curricular Completo · Fisiologia Celular, Genômica, Dinâmica Ecológica e Hereditariedade",
  author: "Profª. Dra. Helena Nogueira & Prof. Dr. Gabriel Fontes",
  discipline: "Biologia",
  grade_level: "Ensino Médio & Pré-Vestibular",
  description: "Tratado exaustivo de Ciências Biológicas abrangendo Bioquímica Celular, Biologia Molecular e Engenharia Genética, Citologia e Organelas, Bioenergética (Fotossíntese e Respiração Celular Aeróbia), Divisão Celular (Mitose e Meiose), Genética Mendeliana e Pós-Mendeliana, Epigenética, Fisiologia Humana Comparada, Imunologia, Teoria Sintética da Evolução, Zoologia, Botânica e Ecologia de Populações e Biomas com esquemas didáticos aprofundados.",
  cover_url: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=1200&auto=format&fit=crop&q=80",
  year: 2026,
  read_time: 430,
  downloads: 34100,
  rating: 4.98,
  rating_count: 1390,
  chapters: [
    {
      id: "bio-cap-1",
      position: 1,
      title: "Capítulo I — A Célula Viva: Arquitetura da Membrana Plasmática, Transportes e Biofísica",
      is_free_preview: true,
      content: `### 1. O Modelo do Mosaico Fluido (Singer & Nicolson, 1972)

A membrana plasmática de todas as células eucarióticas e procarióticas é uma estrutura dinâmica e semipermeável de aproximadamente $7,5 \\text{ a } 10 \\text{ nm}$ de espessura.
- **Bicamada Fosfolipídica Anfipática:** Cada molécula de fosfolipídio possui uma cabeça polar hidrofílica (grupo fosfato carregado eletricamente associado a glicerol) voltada para os meios aquosos intra e extracelular, e duas caudas apolares hidrofóbicas (ácidos graxos saturados e insaturados) voltadas para o interior da bicamada.
- **Fluidez da Membrana:** As ligações duplas cis nos ácidos graxos criam dobras nas caudas que impedem a compactação cristalina. Nas células animais, o **colesterol** atua como um regulador homeostático bidirecional: em altas temperaturas, restringe o movimento excessivo dos fosfolipídios; em baixas temperaturas, impede o congelamento e a rigidez.
- **Proteínas Integrais (Transmembrana) e Periféricas:** Atuam como canais iônicos seletivos (aquaporinas para água), bombas ativas, receptores de sinalização hormonal acoplados à proteína G e enzimas de ancoragem.
- **Glicocálix (Glicolipídios e Glicoproteínas):** Rede de carboidratos voltada para a face extracelular, responsável pelo reconhecimento célula-célula (rejeição de transplantes), adesão tecidual e especificidade de antígenos do sistema ABO.

### 2. Mecanismos Biofísicos de Transporte Transmembrana
1. **Transporte Passivo (Sem Gasto de ATP — a favor do gradiente eletroquímico):**
   - **Difusão Simples:** Passagem de gases apolares minúsculos ($\\text{O}_2$, $\\text{CO}_2$, $\\text{N}_2$) e moléculas lipossolúveis diretamente pela bicamada lipídica. A taxa segue a Lei de Fick.
   - **Difusão Facilitada:** Passagem de íons e moléculas polares (como a glicose pelos transportadores GLUT) mediada por proteínas carreadoras (*permeases*) ou canais iônicos, exibindo cinética de saturação.
   - **Osmose:** Movimento espontâneo de solvente (água) de uma região de menor concentração de soluto (meio hipotônico) para uma região de maior concentração de soluto (meio hipertônico) através de uma membrana semipermeável.
     - *Em células animais (hemácias):* em meio hipotônico sofrem lise osmótica (hemólise); em meio hipertônico murcham (crenação).
     - *Em células vegetais:* possuem parede celular rígida de celulose. Em meio hipotônico, acumulam água no vacúolo até atingirem o estado de **turgência**, onde a pressão de turgor interna ($PT$) equilibra a pressão osmótica ($PO$), impedindo o rompimento ($DPD = PO - PT = 0$). Em meio hipertônico, sofrem **plasmólise**.

2. **Transporte Ativo Primário e Secundário (Com consumo de energia metabólica):**
   - **Bomba de Sódio-Potássio ($\\text{Na}^+/\\text{K}^+$-ATPase):** Proteína transmembrana com atividade enzimática de hidrólise de ATP. A cada molécula de ATP consumida, transporta **3 íons $\\text{Na}^+$ para fora da célula** e **2 íons $\\text{K}^+$ para dentro**, ambos contra seus respectivos gradientes eletroquímicos de concentração.
   - *Importância Biológica Vital:*
     - Manutenção do potencial elétrico de repouso da membrana neuronal ($\\approx -70 \\text{ mV}$), essencial para a condução do impulso nervoso.
     - Controle do volume osmótico celular (sem a bomba, a célula incharia e se romperia).
     - Criação do gradiente de sódio que alimenta o **transporte ativo secundário** (como o cotransporte de glicose no epitélio intestinal).`,
    },
    {
      id: "bio-cap-2",
      position: 2,
      title: "Capítulo II — Bioenergética Celular: Glicólise, Ciclo de Krebs, Fosforilação Oxidativa e Fotossíntese",
      is_free_preview: true,
      content: `### 1. Respiração Celular Aeróbia: O Catabolismo da Glicose

A oxidação completa de uma molécula de glicose para geração de trifosfato de adenosina (ATP) ocorre segundo a equação global:
$$\\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2 \\to 6\\text{CO}_2 + 6\\text{H}_2\\text{O} + \\approx 30-32\\text{ ATP}$$
O processo é dividido em três fases metabolicamente coordenadas:

1. **Glicólise (Fase Anaeróbia, no Citosol/Hialoplasma):**
   - A glicose ($6\\text{C}$) é ativada pelo consumo de 2 ATPs e clivada enzimaticamente em duas moléculas de piruvato ($3\\text{C}$).
   - Saldo líquido: $2 \\text{ ATP}$ (por fosforilação ao nível do substrato) e $2 \\text{ NADH} + 2\\text{H}^+$.
   - Na ausência de $\\text{O}_2$, o piruvato segue para **fermentação láctica** (músculos sob esforço anóxico, bactérias do iogurte) ou **fermentação alcoólica** (leveduras *Saccharomyces*, gerando etanol e $\\text{CO}_2$), regenerando o $\\text{NAD}^+$ indispensável para a continuidade da glicólise.

2. **Ciclo de Krebs ou Ciclo do Ácido Cítrico (na Matriz Mitocondrial):**
   - O piruvato entra na mitocôndria, sofre descarboxilação oxidativa pela enzima piruvato desidrogenase, gerando $\\text{NADH}$, $\\text{CO}_2$ e Acetil-Coenzima A ($2\\text{C}$).
   - O Acetil-CoA combina-se com o oxaloacetato ($4\\text{C}$), formando o citrato ($6\\text{C}$). Ao longo de uma cascata cíclica de 8 reações enzimáticas, o citrato é gradualmente oxidado e regenerado a oxaloacetato.
   - Saldo por molécula de glicose (2 voltas do ciclo): $4 \\text{ CO}_2$, $6 \\text{ NADH}$, $2 \\text{ FADH}_2$ e $2 \\text{ GTP}$ (equivalentes a 2 ATP).

3. **Cadeia Transportadora de Elétrons e Fosforilação Oxidativa (nas Cristas Mitocondriais):**
   - Os elétrons de alta energia transportados pelo $\\text{NADH}$ e $\\text{FADH}_2$ são transferidos sequencialmente através de complexos proteicos de óxido-redução (Complexos I, II, III, Citocromo c e Complexo IV).
   - A passagem exergônica dos elétrons bombeia ativamente prótons ($\text{H}^+$) da matriz para o espaço intermembrana, gerando uma força próton-motriz eletroquímica extrema (Hipótese Quimiosmótica de Peter Mitchell, Prêmio Nobel de 1978).
   - O oxigênio molecular ($\text{O}_2$) atua como o **aceptor final de elétrons** na respiração aeróbia, combinando-se com prótons para formar água ($\text{H}_2\text{O}$). Sem oxigênio, a cadeia trava e a mitocôndria para de produzir ATP.
   - Os prótons retornam à matriz passando pelo canal catalítico da **ATP Sintase**, cuja rotação mecânica fosforila o ADP em ATP com altíssimo rendimento (cerca de 26 a 28 ATPs nesta fase).

### 2. A Fotossíntese: O Motor Bioenergético da Biosfera
$$6\\text{CO}_2 + 12\\text{H}_2\\text{O} \\xrightarrow{\\text{luz e clorofila}} \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2 + 6\\text{H}_2\\text{O}$$
- **Fase Fotoquímica (Reações Claras, nos Tilacoides):** Fótons de luz excitam elétrons da clorofila $a$ nos fotossistemas II e I. Ocorre a **fotólise da água** (Reação de Hill: $2\\text{H}_2\\text{O} \\to 4\\text{H}^+ + 4e^- + \\text{O}_2$), comprovando que **todo o oxigênio liberado na atmosfera provém da quebra da água**, e não do dióxido de carbono. Há geração de ATP (fotofosforilação) e $\\text{NADPH}$.
- **Fase Enzimática (Reações de Escuro / Ciclo de Calvin-Benson, no Estroma):** A enzima **RuBisCO** catalisa a fixação do $\\text{CO}_2$ atmosférico na ribulose-1,5-bisfosfato, consumindo o ATP e o $\\text{NADPH}$ gerados na fase clara para produzir trioses fosfato (G3P) que dão origem à glicose, amido e sacarose.`,
    },
    {
      id: "bio-cap-3",
      position: 3,
      title: "Capítulo III — O Dogma Central da Biologia Molecular: Replicação, Transcrição e Tradução Genética",
      is_free_preview: true,
      content: `### 1. Estrutura dos Ácidos Nucleicos e o Modelo de Watson & Crick (1953)

O DNA (Ácido Desoxirribonucleico) é um polímero de nucleotídeos formado por três componentes:
1. Uma base nitrogenada: Púricas com anel duplo (Adenina e Guanina) ou Pirimídicas com anel simples (Citosina e Timina no DNA; Uracila no RNA).
2. Uma pentose (Desoxirribose no DNA, sem oxigênio no carbono 2'; Ribose no RNA).
3. Um grupo fosfato esterificado no carbono 5'.

- **Regra de Chargaff:** Em qualquer molécula de DNA dupla-fita, a quantidade de adenina é igual à de timina ($A = T$), e a de guanina é igual à de citosina ($G = C$), o que implica $\\frac{A + G}{T + C} = 1$.
- **Pareamento Complementar de Bases:**
  - $A = T$ unidos por **duas ligações de hidrogênio**.
  - $G \\equiv C$ unidos por **três ligações de hidrogênio** (regiões ricas em G-C são mais termicamente estáveis e exigem maior temperatura de desnaturação).
- **Antiparalelismo das Fitas:** Uma fita corre no sentido $5' \\to 3'$ e a fita complementar corre no sentido inverso $3' \\to 5'$.

### 2. Replicação Semiconservativa do DNA (Meselson & Stahl, 1958)
Cada fita original serve de molde para a síntese de uma fita recém-sintetizada:
- A enzima **Helicase** desenrola a dupla-hélice quebrando as pontes de hidrogênio.
- A **Topoisomerase (Girase)** alivia a tensão torsional à frente da forquilha de replicação.
- A **DNA Polimerase III** sintetiza a nova fita exclusivamente no sentido **$5' \\to 3'$**, exigindo um primer de RNA sintetizado pela Primase.
  - Fita Contínua (*Leading Strand*): sintetizada de forma ininterrupta em direção à forquilha.
  - Fita Descontínua (*Lagging Strand*): sintetizada em pequenos fragmentos descontínuos denominados **Fragmentos de Okazaki**, posteriormente unidos covalentemente pela enzima **DNA Ligase**.

### 3. Transcrição e Processamento do RNA em Eucariotos
A síntese de RNA mensageiro a partir de uma fita molde de DNA é catalisada pela **RNA Polimerase II**.
- Em eucariotos, o transcrito primário (pré-RNAm) passa pelo processamento pós-transcricional no núcleo:
  1. Adição do Cap 5' (7-metilguanosina) que protege contra degradação e orienta a ligação ao ribossomo.
  2. Adição da cauda Poli-A na extremidade 3'.
  3. **Splicing (Corte e Emenda):** Remoção dos íntrons (regiões não-codificantes) e união dos éxons (regiões codificantes) pelo complexo do spliceossomo.
  - **Splicing Alternativo:** Um único gene pode gerar múltiplos transcritos maduros diferentes combinando éxons de maneiras variadas, o que explica como o genoma humano, com apenas $\\approx 20.000$ genes, produz mais de $100.000$ proteínas distintas.

### 4. O Código Genético e a Tradução Ribossômica
A informação genética é lida em trincas de nucleotídeos denominadas **códons**.
- **Universalidade:** O mesmo códon codifica o mesmo aminoácido em praticamente todas as formas de vida na Terra, demonstrando a ancestralidade comum universal.
- **Degeneração ou Redundância:** Existem 64 códons possíveis ($4^3 = 64$) para apenas 20 aminoácidos proteicos. Logo, múltiplos códons diferentes podem codificar o mesmo aminoácido (ex: UUU e UUC codificam fenilalanina).
- Códon de Iniciação: $\\text{AUG}$ (codifica Metionina).
- Códons de Parada (*Stop Codons*): $\\text{UAA}$, $\\text{UAG}$ e $\\text{UGA}$ (não codificam aminoácidos, sinalizam o fim da síntese proteica).`,
    },
    {
      id: "bio-cap-4",
      position: 4,
      title: "Capítulo IV — Genética Mendeliana, Herança do Sistema ABO e Engenharia Genômica",
      is_free_preview: true,
      content: `### 1. As Leis de Gregor Mendel (1865)

1. **Primeira Lei (Lei da Segregação dos Fatores):**
Cada caráter é condicionado por um par de fatores (alelos) que se segregam durante a meiose na formação dos gametas, de modo que cada gameta é puro e contém apenas um membro do par.
- Cruzamento monohíbrido ($Aa \\times Aa$):
  - Proporção Genotípica: $1 AA : 2 Aa : 1 aa$ ($25\\% AA, 50\\% Aa, 25\\% aa$).
  - Proporção Fenotípica (com dominância completa): $3 [A] : 1 [a]$ ($75\\%$ dominante, $25\\%$ recessivo).

2. **Segunda Lei (Lei da Segregação Independente):**
Genes localizados em cromossomos homólogos distintos segregam-se de forma independente durante a anáfase I da meiose.
- Cruzamento di-híbrido ($AaBb \\times AaBb$):
  - Proporção Fenotípica clássica: $9 : 3 : 3 : 1$.
  - Quando os genes estão situados no mesmo cromossomo, dizemos que estão em **Ligação Gênica (Linkage)**, segregando juntos a menos que ocorra permutação (*crossing-over*) na prófase I. A taxa de recombinação (em centimorgans ou unidades de recombinação) é diretamente proporcional à distância física entre os loci gênicos no cromossomo.

### 2. O Sistema ABO e a Imunogenética Transfusional
O sistema ABO é um caso clássico de **alelos múltiplos (polialelia)** e **codominância**:
- Alelos: $I^A$ (produz enzima que adiciona N-acetilgalactosamina à substância H na membrana da hemácia), $I^B$ (adiciona galactose) e $i$ (alelo nulo recessivo que não adiciona carboidrato).
- Relação de Dominância: $I^A = I^B > i$.

| Fenótipo (Grupo) | Genótipos Possíveis | Aglutinogênio na Hemácia | Aglutinina no Plasma |
|---|---|---|---|
| Grupo A | $I^A I^A$ ou $I^A i$ | Antígeno A | Anti-B |
| Grupo B | $I^B I^B$ ou $I^B i$ | Antígeno B | Anti-A |
| Grupo AB | $I^A I^B$ | Antígenos A e B | Nenhuma (Receptor Universal) |
| Grupo O | $ii$ | Nenhum | Anti-A e Anti-B (Doador Universal) |

*Regra Cardeal de Transfusão:* As hemácias do doador não podem possuir aglutinogênios contra os quais o plasma do receptor contenha aglutininas correspondentes, sob risco de hemólise intravascular aguda e insuficiência renal.

### 3. Fator Rh e Eritroblastose Fetal (Doença Hemolítica do Recém-Nascido)
- O antígeno D é condicionado por alelo dominante ($R$).
- A patologia ocorre quando:
  1. Mãe é obrigatoriamente $\\text{Rh}^-$ ($rr$).
  2. Pai é $\\text{Rh}^+$ ($RR$ ou $Rr$), gerando feto $\\text{Rh}^+$.
  3. No primeiro parto de feto $\\text{Rh}^+$, há contato acidental do sangue fetal com o materno, sensibilizando a mãe para a produção de anticorpos da classe **IgG anti-Rh**.
  4. Em uma segunda gestação de feto $\\text{Rh}^+$, os anticorpos IgG maternos (que atravessam livremente a barreira placentária) destroem as hemácias do feto.
  - Prevenção: Injeção de imunoglobulina anti-Rh (soro anti-D) na mãe $\\text{Rh}^-$ até 72 horas após o primeiro parto para destruir as hemácias fetais antes da sensibilização.`,
    },
    {
      id: "bio-cap-5",
      position: 5,
      title: "Capítulo V — Ecologia: Dinâmica Trófica, Ciclos Biogeoquímicos e Impactos Ambientais Globais",
      is_free_preview: true,
      content: `### 1. Níveis Tróficos e Fluxo Energético nos Ecossistemas

- **Produtores (Autótrofos):** Vegetais, fitoplâncton e bactérias quimiossintetizantes que convertem energia inorgânica em energia química de biomassa.
- **Consumidores:** Primários (herbívoros), Secundários, Terciários e Topo de Cadeia.
- **Decompositores:** Fungos e bactérias heterótrofos saprófagos que degradam matéria orgânica morta em compostos minerais assimiláveis.

#### O Fluxo Unidirecional e Decrescente da Energia
Enquanto a matéria é continuamente reciclada na biosfera, **a energia NÃO se recicla**. A cada nível trófico consecutivo, cerca de $90\\%$ da energia útil é perdida na forma de calor metabólico (respiração celular, manutenção fisiológica e fezes), restando apenas cerca de $10\\%$ disponível para o nível seguinte (Lei dos Dez Por Cento de Lindeman). Por isso, cadeias alimentares terrestres raramente ultrapassam 4 ou 5 níveis tróficos.

### 2. Ciclos Biogeoquímicos Globais
1. **Ciclo do Carbono:**
   - Fixação: fotossíntese retira $\\text{CO}_2$ da atmosfera e o incorpora em moléculas orgânicas.
   - Devolução: respiração celular, decomposição e a queima de combustíveis fósseis (carvão, petróleo e gás natural acumulados no Carbonífero) devolvem $\\text{CO}_2$ à atmosfera, exacerbando o efeito estufa e a acidificação oceânica.

2. **Ciclo do Nitrogênio (O Ciclo Biológico mais cobrado em vestibulares):**
   O gás nitrogênio ($\text{N}_2$) compõe $78\\%$ da atmosfera terrestre, mas é biologicamente inerte para plantas e animais devido à sua fortíssima ligação tripla covalente ($N \\equiv N$). O ciclo depende criticamente de quatro grupos de bactérias:
   - **Fixação Biológica:** Bactérias mutualísticas do gênero *Rhizobium* (associadas às raízes de leguminosas) e cianobactérias de vida livre convertem $\\text{N}_2$ gasoso em amônia ($\\text{NH}_3 / \\text{NH}_4^+$) pela ação do complexo enzimático da nitrogenase.
   - **Nitrificação (Processo Quimiossintetizante em 2 etapas no solo):**
     1. *Nitrosação:* Bactérias *Nitrosomonas* oxidam amônia a nitrito:
$$2\\text{NH}_3 + 3\\text{O}_2 \\to 2\\text{NO}_2^- + 2\\text{H}^+ + 2\\text{H}_2\\text{O} + \\text{energia}$$
     2. *Nitratação:* Bactérias *Nitrobacter* oxidam nitrito ao nitrato assimilável pelas raízes vegetais:
$$2\\text{NO}_2^- + \\text{O}_2 \\to 2\\text{NO}_3^- + \\text{energia}$$
   - **Assimilação:** Vegetais absorvem nitrato ($\\text{NO}_3^-$) para sintetizar aminoácidos, proteínas e nucleotídeos.
   - **Desnitrificação:** Em ambientes anóxicos e alagados, bactérias anaeróbias facultativas do gênero *Pseudomonas* reduzem nitratos de volta a gás $\\text{N}_2$, devolvendo o elemento à atmosfera e fechando o ciclo global.

### 3. Fenômenos de Degradação Ambiental Contemporâneos
- **Magnificação Trófica (Bioacumulação):** Substâncias tóxicas, não-biodegradáveis e lipossolúveis (como metais pesados mercúrio/chumbo e pesticidas organoclorados como o DDT) não são metabolizadas nem excretadas pelos organismos. Consequentemente, sua concentração por unidade de biomassa aumenta progressivamente ao longo da cadeia alimentar, atingindo teores letais nos **predadores de topo**.
- **Eutrofização Cultural de Corpos D'água:**
  1. Despejo excessivo de esgoto doméstico rico em matéria orgânica ou fertilizantes agrícolas ricos em N e P em lagos e rios.
  2. Proliferação explosiva de algas e cianobactérias na superfície (floração ou *bloom*).
  3. A camada superficial de algas bloqueia a penetração da luz solar, impedindo a fotossíntese da vegetação submersa, que morre.
  4. Bactérias aeróbias decompõem a massa vegetal morta, consumindo avidamente todo o oxigênio dissolvido na água (DBO dispara, OD cai a zero).
  5. Morte em massa de peixes por asfixia, seguida pela proliferação de bactérias anaeróbias que liberam gases fétidos e tóxicos ($\text{H}_2\text{S}$ e metano).`,
    },
  ],
};
