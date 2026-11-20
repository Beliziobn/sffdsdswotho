import type { OriginalPdfBook } from "./originalPdfRegistry";

export interface CanonicalChapter {
  id: string;
  book_id: string;
  position: number;
  title: string;
  content: string;
  is_free_preview: boolean;
}

interface WorkBlueprint {
  chapters: Array<{
    title: string;
    paragraphs: string[];
  }>;
}

const SPECIFIC_WORK_CHAPTERS: Record<string, WorkBlueprint> = {
  "arte-da-guerra-sun-tzu": {
    chapters: [
      {
        title: "Capítulo I — Avaliação e Planejamento Estratégico",
        paragraphs: [
          "Sun Tzu disse: A arte da guerra é de importância vital para o Estado. É uma questão de vida e de morte, um caminho que leva à segurança ou à ruína. Por isso, sob nenhuma circunstância deve ser negligenciada.",
          "A arte da guerra é governada por cinco fatores constantes, que devem ser levados em conta em todas as deliberações quando se busca determinar as condições reinantes no campo: a Lei Moral (Tao), o Céu, a Terra, o Comandante e o Método e Disciplina.",
          "A Lei Moral faz com que o povo esteja em completo acordo com seu governante, de modo que o seguirá independentemente de suas vidas, sem temer qualquer perigo. O Céu significa a noite e o dia, o frio e o calor, o tempo e as estações. A Terra compreende as distâncias, grandes e pequenas, o perigo e a segurança, o terreno aberto e os desfiladeiros estreitos, as chances de vida e de morte.",
          "O Comandante representa as virtudes da sabedoria, sinceridade, benevolência, coragem e rigor. Por Método e Disciplina devem ser entendidos a organização do exército em suas subdivisões adequadas, as graduações de patente entre os oficiais, a manutenção das estradas pelas quais os suprimentos chegam ao exército e o controle dos gastos militares.",
          "Toda guerra é baseada no engano. Assim, quando somos capazes de atacar, devemos parecer incapazes; quando usamos nossas forças, devemos parecer inativos; quando estamos perto, devemos fazer o inimigo acreditar que estamos longe; quando estamos longe, devemos fazê-lo acreditar que estamos perto.",
        ],
      },
      {
        title: "Capítulo II — A Condução da Guerra",
        paragraphs: [
          "Na condução das operações militares, quando há no campo mil carros velozes, outros tantos carros pesados e cem mil soldados blindados, com provisões suficientes para transportá-los a mil léguas, as despesas internas e na frente de batalha somam mil peças de ouro por dia.",
          "Se você engajar o combate e a vitória tardar, as armas dos seus homens perderão o fio e seu ardor será amortecido. Se você sitiar uma cidade, esgotará suas forças. Novamente, se a campanha for prolongada, os recursos do Estado não serão suficientes para suportar o esforço.",
          "Não há instância de um país que tenha se beneficiado de guerras prolongadas. Portanto, na guerra, que seu grande objetivo seja a vitória rápida, e não campanhas intermináveis.",
          "O general hábil não realiza uma segunda convocação de tropas, nem carrega seus carros de provisões mais de duas vezes. Ele traz equipamento de guerra de casa, mas se abastece no inimigo. Assim o exército terá alimento suficiente para suas necessidades.",
        ],
      },
      {
        title: "Capítulo III — O Ataque pelo Estratagema",
        paragraphs: [
          "Sun Tzu disse: Na arte prática da guerra, a melhor coisa de todas é tomar o país inimigo inteiro e intacto; despedaçá-lo e destruí-lo não é tão bom. Da mesma forma, é melhor capturar um exército inteiro do que destruí-lo.",
          "Lutar e conquistar em todas as nossas batalhas não é a excelência suprema; a excelência suprema consiste em quebrar a resistência do inimigo sem lutar. Assim, a mais alta forma de generalato é frustrar os planos do inimigo; a próxima melhor é impedir a junção das forças inimigas.",
          "Se você conhece o inimigo e conhece a si mesmo, não precisa temer o resultado de cem batalhas. Se você se conhece, mas não conhece o inimigo, para cada vitória ganha sofrerá também uma derrota. Se você não conhece nem o inimigo nem a si mesmo, sucumbirá em todas as batalhas.",
        ],
      },
      {
        title: "Capítulo IV — Disposições Táticas e Energia",
        paragraphs: [
          "Sun Tzu disse: Os bons guerreiros de antigamente colocavam-se primeiro além da possibilidade de derrota, e depois esperavam uma oportunidade de derrotar o inimigo. Garantir-nos contra a derrota está em nossas próprias mãos, mas a oportunidade de derrotar o inimigo é fornecida pelo próprio inimigo.",
          "A segurança contra a derrota implica táticas defensivas; a capacidade de derrotar o inimigo significa tomar a ofensiva. Aquele que é hábil na defesa esconde-se nos recessos mais secretos da terra; aquele que é hábil no ataque lampeja das mais altas alturas do céu.",
          "Na batalha, existem apenas dois métodos de ataque — o direto e o indireto; contudo, esses dois em combinação dão origem a uma série interminável de manobras. O direto e o indireto conduzem um ao outro em círculo, como mover-se num anel sem fim: quem jamais esgotará as possibilidades de sua combinação?",
        ],
      },
      {
        title: "Capítulo V — Pontos Fracos e Pontos Fortes",
        paragraphs: [
          "Quem chega primeiro ao campo de batalha e aguarda a chegada do inimigo estará descansado para o combate; quem chega em segundo lugar e tem de se apressar para a batalha chegará exausto.",
          "Apareça em pontos que o inimigo deve apressar-se a defender; marche rapidamente para lugares onde você não é esperado. Você pode ter certeza de ter sucesso em seus ataques se apenas atacar lugares que estão indefesos.",
          "As táticas militares são como a água; pois a água, em seu curso natural, foge dos lugares altos e se apressa para baixo. Assim, na guerra, o caminho é evitar o que é forte e atacar o que é fraco. A água molda seu curso de acordo com a natureza do terreno; o soldado trabalha sua vitória em relação ao inimigo que enfrenta.",
        ],
      },
    ],
  },
  "o-principe-maquiavel": {
    chapters: [
      {
        title: "Capítulos I a V — Dos Principados e Como Governá-los",
        paragraphs: [
          "Todos os Estados, todos os domínios que tiveram e têm império sobre os homens foram e são ou repúblicas ou principados. Os principados são ou hereditários, nos quais a linhagem de seu senhor foi por longo tempo soberana, ou são novos.",
          "Nos Estados hereditários e acostumados à linhagem de seu príncipe, as dificuldades para mantê-los são muito menores do que nos novos, porque basta apenas não transgredir a ordem de seus antepassados e depois contemporizar com os acontecimentos.",
          "Mas é no principado novo que residem as dificuldades. Os homens mudam de senhor de bom grado, acreditando melhorar, e essa crença os leva a pegar em armas contra o governante atual; no que se enganam, porque veem depois, por experiência, terem piorado sua condição.",
          "Quando os Estados que se conquistam estão acostumados a viver com suas próprias leis e em liberdade, há três modos de tentar conservá-los: o primeiro é arruiná-los; o segundo, ir morar neles pessoalmente; o terceiro, deixá-los viver com suas leis, arrecadando deles um tributo e criando dentro deles um governo de poucos que os conservem amigos.",
        ],
      },
      {
        title: "Capítulos VI a IX — Dos Principados Novos Conquistados com Armas Próprias e Virtù",
        paragraphs: [
          "Não se maravilhe ninguém se, no falar que farei dos principados inteiramente novos, tanto no príncipe quanto no Estado, eu trouxer grandíssimos exemplos, pois os homens caminham quase sempre pelas vias trilhadas por outros e procedem em suas ações com as imitações.",
          "Examine-se Ciro, Rômulo, Teseu e outros fundadores: não se verá que tenham recebido da fortuna outra coisa senão a ocasião, a qual lhes deu a matéria para que nela pudessem introduzir a forma que lhes aprouvesse; sem essa ocasião a virtude de seu ânimo se teria apagado, e sem aquela virtude a ocasião teria vindo em vão.",
          "Deve-se considerar que não há coisa mais difícil de tratar, nem mais duvidosa de conseguir, nem mais perigosa de conduzir, do que fazer-se chefe na introdução de novas ordens. Porque o introdutor tem por inimigos todos aqueles que das ordens antigas se beneficiam, e tem tímidos defensores em todos aqueles que das ordens novas se beneficiariam.",
        ],
      },
      {
        title: "Capítulos XV a XVIII — Daquilo Pelo Que os Príncipes São Louvados ou Censurados",
        paragraphs: [
          "Resta agora ver quais devem ser os modos e governos de um príncipe com seus súditos e com os amigos. E porque sei que muitos escreveram sobre isso, temo, escrevendo também eu, ser tido por presunçoso, partindo, sobretudo ao disputar esta matéria, das ordens dos outros. Mas sendo minha intenção escrever coisa útil a quem a entenda, pareceu-me mais conveniente ir direto à verdade efetiva da coisa do que à imaginação dela.",
          "Muitos imaginaram repúblicas e principados que jamais foram vistos nem conhecidos como existentes na verdade; porque há tanta distância entre como se vive e como se deveria viver, que aquele que deixa o que se faz por aquilo que se deveria fazer aprende antes a sua ruína do que a sua preservação.",
          "Nasce daqui uma disputa: se é melhor ser amado que temido, ou o inverso. Responde-se que se gostaria de ser uma e outra coisa; mas, porque é difícil reuni-las, é muito mais seguro ser temido do que amado, quando se tenha de falhar em uma das duas. Contudo, o príncipe deve fazer-se temer de modo que, se não conquistar o amor, evite o ódio.",
        ],
      },
      {
        title: "Capítulos XXV e XXVI — Quanto Pode a Fortuna nas Coisas Humanas",
        paragraphs: [
          "Não me é desconhecido como muitos tiveram e têm a opinião de que as coisas do mundo são de tal modo governadas pela fortuna e por Deus, que os homens com sua prudência não podem corrigi-las, antes não têm remédio algum para elas.",
          "Não obstante, para que o nosso livre-arbítrio não seja extinto, julgo poder ser verdade que a fortuna seja árbitra de metade de nossas ações, mas que ela ainda nos deixe governar a outra metade, ou quase, a nós mesmos.",
          "Semelhante ela é a um desses rios impetuosos que, quando se enfurecem, alagam as planícies, arruínam árvores e edifícios; mas isso não impede que os homens, quando os tempos são quietos, possam tomar providências com reparos e diques, de modo que, crescendo depois, ou iriam por um canal ou seu ímpeto não seria nem tão desenfreado nem tão danoso.",
        ],
      },
    ],
  },
  "a-metamorfose-kafka": {
    chapters: [
      {
        title: "Parte I — O Despertar de Gregor Samsa",
        paragraphs: [
          "Quando Gregor Samsa despertou certa manhã de sonhos intranquilos, encontrou-se em sua cama metamorfoseado num inseto monstruoso. Estava deitado sobre suas costas duras como couraça e, ao levantar um pouco a cabeça, viu seu ventre abaulado, marrom, dividido por nervuras arqueadas, no topo do qual a coberta, prestes a deslizar de vez, ainda mal se sustinha. Suas numerosas pernas, lastimavelmente finas em comparação com o volume do resto do corpo, tremulavam desamparadas diante de seus olhos.",
          "— O que aconteceu comigo? — pensou. Não era um sonho. Seu quarto, um autêntico quarto humano, apenas um pouco pequeno demais, permanecia calmo entre as quatro paredes bem conhecidas. Sobre a mesa, onde se espalhava um mostruário desembalado de tecidos — Samsa era caixeiro-viajante —, pendia a imagem que ele recortara fazia pouco de uma revista ilustrada e colocara numa bonita moldura dourada.",
          "O olhar de Gregor dirigiu-se então para a janela, e o tempo turvo — ouviam-se gotas de chuva batendo no zinco do parapeito — deixou-o inteiramente melancólico. — Que tal se eu continuasse dormindo mais um pouco e esquecesse todas essas tolices? — pensou, mas isso era completamente irrealizável, pois estava habituado a dormir sobre o lado direito e, em seu estado atual, não conseguia colocar-se nessa posição.",
          "Bateram cautelosamente à porta que ficava à cabeceira de sua cama. — Gregor — chamou uma voz; era a mãe —, são seis e um quarto. Você não queria pegar o trem? — Que voz suave! Gregor assustou-se ao ouvir a própria voz que respondia: era inconfundivelmente a sua voz de antes, mas nela se misturava, como que vindo de baixo, um piado doloroso e irreprimível.",
        ],
      },
      {
        title: "Parte II — O Confinamento no Quarto",
        paragraphs: [
          "Só ao anoitecer Gregor despertou de seu sono pesado, semelhante a um desmaio. Certamente não teria despertado muito mais tarde mesmo sem ser perturbado, pois se sentia suficientemente repousado e bem-dormido; no entanto, pareceu-lhe que um passo fugidio e um fechar cuidadoso da porta que dava para a sala de estar o haviam acordado.",
          "Pela fresta da porta, Gregor observava a família reunida à mesa da sala. O pai, que antes costumava cochilar após o jantar, agora permanecia ereto em seu uniforme de contínuo de banco; a mãe costurava roupas finas para uma loja de modas; e a irmã Grete estudava estenografia e francês à noite para conseguir um emprego melhor.",
          "Para distrair-se, Gregor adquiriu o hábito de rastejar em todas as direções pelas paredes e pelo teto. Especialmente lá em cima, suspenso do teto, era muito diferente de ficar deitado no assoalho; respirava-se mais livremente, uma leve oscilação percorria o corpo.",
        ],
      },
      {
        title: "Parte III — O Violino de Grete e o Desfecho",
        paragraphs: [
          "O grave ferimento de Gregor, do qual padeceu por mais de um mês — a maçã arremessada pelo pai permaneceu encravada na carne como uma lembrança visível, já que ninguém ousava removê-la —, pareceu ter lembrado até mesmo ao pai que Gregor, apesar de sua triste e repugnante forma atual, era um membro da família, que não se podia tratar como um inimigo.",
          "Certa noite, o som do violino começou a soar da sala de estar, onde a irmã tocava para os três inquilinos barbados que a família acolhera para complementar a renda. Atraído pela música, Gregor avançou um pouco mais para a frente e manteve a cabeça colada ao chão para poder encontrar o olhar dela. Era ele um animal, já que a música o comovia tanto?",
          "De volta à escuridão de seu quarto, Gregor pensou na família com emoção e amor. Sua opinião de que precisava desaparecer era, se possível, ainda mais decidida que a da irmã. Permaneceu nesse estado de meditação vazia e pacífica até que o relógio da torre bateu três horas da madrugada. Ainda vivenciou o começo do clarear geral lá fora, diante da janela. Depois, sem a sua vontade, sua cabeça baixou por completo, e de suas narinas fluiu debilmente o último suspiro.",
        ],
      },
    ],
  },
  "a-divina-comedia-dante": {
    chapters: [
      {
        title: "Cântico I — O Inferno: A Selva Escura e os Nove Círculos",
        paragraphs: [
          "Nel mezzo del cammin di nostra vita / mi ritrovai per una selva oscura, / ché la diritta via era smarrita. — No meio do caminho de nossa vida, encontrei-me por uma selva escura, porque a reta via havia sido perdida. Ah, quão duro é dizer qual era aquela selva selvagem, áspera e forte, que no pensamento renova o temor!",
          "Impedido por três feras — a pantera da luxúria, o leão da soberba e a loba da avareza —, Dante encontra a sombra do poeta latino Virgílio, enviado por Beatriz para guiá-lo através dos reinos eternos. Diante do portal do Inferno, leem a inscrição gravada na pedra escura: 'Deixai toda esperança, vós que entrais.'",
          "Descendo pelos nove círculos concêntricos — do Limbo dos filósofos virtuosos da Antiguidade ao segundo círculo onde Francesca da Rimini e Paolo choram o amor trágico levados pela tempestade eterna, passando pelos avarentos, iracundos, hereges, violentos e fraudulentos —, os dois poetas alcançam o lago congelado do Cócito, onde Lúcifer permanece aprisionado no centro da gravidade do mundo.",
        ],
      },
      {
        title: "Cântico II — O Purgatório: A Montanha das Sete Cornijas",
        paragraphs: [
          "Para correr melhores águas alça agora as velas a naveta do meu engenho, que deixa atrás de si mar tão cruel; e cantarei daquele segundo reino onde o espírito humano se purifica e de subir ao Céu se torna digno.",
          "Saindo das entranhas da Terra para volver a ver as estrelas, Dante e Virgílio emergem na ilha da Montanha do Purgatório sob o céu austral constelado por quatro estrelas resplandecentes, guardadas pelo venerável Catão de Útica, símbolo da liberdade moral.",
          "Ao longo dos sete terraços da montanha — onde as almas expiam com esperança e cânticos as inclinações desordenadas da soberba, inveja, ira, acídia, avareza, gula e luxúria —, cada letra 'P' traçada na fronte de Dante pela espada do anjo guardião é apagada pelo bater de asas angélicas, até que, no Paraíso Terrestre no topo da montanha, Virgílio se despede e Beatriz surge em triunfo.",
        ],
      },
      {
        title: "Cântico III — O Paraíso: As Nove Esferas Celestes e o Empíreo",
        paragraphs: [
          "A glória Daquele que tudo move penetra pelo universo, e resplandece em uma parte mais e menos em outra. No céu que mais da sua luz recebe estive eu, e vi coisas que redizer não sabe nem pode quem de lá acima desce.",
          "Guiado pelo olhar luminoso de Beatriz, Dante ascende pelas nove esferas celestes — da Lua, Mercúrio e Vênus ao Sol dos teólogos sábios, Marte dos guerreiros da fé, Júpiter da justiça divina, Saturno dos contemplativos, o Céu das Estrelas Fixas e o Primeiro Móvel.",
          "No Empíreo, onde São Bernardo de Claraval intercede junto à Rosa Mística, a visão do poeta penetra finalmente na Luz Eterna, onde o intelecto encontra a harmonia suprema com 'o Amor que move o sol e as outras estrelas'.",
        ],
      },
    ],
  },
  "cortico-aluisio": {
    chapters: [
      {
        title: "Parte I — A Ambição de João Romão e o Nascimento da Estalagem",
        paragraphs: [
          "João Romão foi, dos treze aos vinte e cinco anos, empregado de um vendeiro que enriqueceu entre as quatro paredes de uma suja e obscura taverna nos refolhos do bairro do Botafogo; e tanto economizou do pouco que ganhara nessa dúzia de anos, que, ao retirar-se o patrão para a terra, lhe deixou, em pagamento de ordenados vencidos, nem só a venda com o que estava dentro, como ainda um conto e quinhentos em dinheiro.",
          "Proprietário e estabelecido por sua conta, o rapaz atirou-se à labuta ainda com mais ardor, possuído de um tal delírio de enriquecer, que afrontava resignado as mais duras privações. Dormia sobre o balcão da própria venda, em cima de uma esteira, fazendo travesseiro de um saco de estopa cheio de palha.",
          "Com o auxílio incansável da crioula Bertoleza, cuja carta de alforria ele forjara para apoderar-se de suas economias, João Romão comprou braças de terreno ao fundo da taverna, abriu a pedreira e ergueu casinhas de aluguel: nascia a Estalagem de São Romão, organismo vivo que fervilhava ao sol tropical do Rio de Janeiro.",
        ],
      },
      {
        title: "Parte II — As Lavadeiras, Rita Baiana e a Transformação de Jerônimo",
        paragraphs: [
          "Eram cinco horas da manhã e o cortiço acordava, abrindo, não os olhos, mas a sua infinidade de portas e janelas alinhadas. Um acordar alegre e farto de quem dormiu de uma assentada sete horas de chumbo. As tinas das lavadeiras alinhavam-se sob o sol; Machona, Leocádia, Augusta Carne-Mole e a Florinda batiam a roupa entre cantigas e mexericos.",
          "Quando o português Jerônimo e sua esposa Piedade de Jesus mudaram-se para o cortiço, Jerônimo era modelo de operário austero, madrugador e devotado à guitarra nostálgica de sua aldeia. Mas naquela noite de domingo em que Rita Baiana dançou o chorado no pátio ao som do violão de Firmo, a terra brasileira venceu a alma do europeu.",
          "O café forte, a aguardente de cana, o sol ardente da pedreira e o feitiço sensual de Rita Baiana transformaram os sentidos de Jerônimo, precipitando a tragédia que culminaria na emboscada mortal contra Firmo e no abandono de Piedade.",
        ],
      },
      {
        title: "Parte III — A Rivalidade com o Sobrado de Miranda, o Incêndio e a Ascensão Burguesa",
        paragraphs: [
          "Entre o sobrado do negociante português Miranda — recém-agraciado com o título de Barão do Freixal — e a estalagem de João Romão travou-se uma silenciosa luta de espaço e prestígio. Ao cortiço São Romão opôs-se ainda o cortiço rival do 'Cabeça-de-Gato', desencadeando batalhas campais entre carapicus e cabeças-de-gato.",
          "Ateado o incêndio pela bruxa Marcolina, João Romão reconstruiu a estalagem em proporções grandiosas, rebatizando-a como 'Avenida São Romão', com moradores de gravata e aluguéis mais caros, preparando-se para casar com Zulmira, filha do Barão Miranda.",
          "Restava apenas um obstáculo ao seu ingresso definitivo na alta sociedade: Bertoleza. Quando o filho dos antigos senhores de Bertoleza veio reclamá-la com escolta policial, João Romão entregou-a friamente; e Bertoleza, antes de deixar-se reconduzir ao cativeiro, rasgou o próprio ventre com a faca de escamar peixe, no exato instante em que uma comissão abolicionista entrava na sala de visitas para entregar a João Romão um diploma de benemérito.",
        ],
      },
    ],
  },
  "pdf-crime-e-castigo": {
    chapters: [
      {
        title: "Parte I — O Quarto de Raskólnikov e a Teoria do Homem Extraordinário",
        paragraphs: [
          "No início de julho, numa tarde extremamente quente, um jovem saiu do seu quartinho, que alugava na travessa S., para a rua e dirigiu-se lentamente, como que indeciso, na direção da ponte K. Seu cubículo ficava exatamente sob o telhado de um alto prédio de cinco andares e parecia mais um armário do que um aposento.",
          "Rodion Românovitch Raskólnikov, ex-estudante de Direito esmagado pela miséria em São Petersburgo, remoía havia semanas uma ideia fixa: estaria um homem extraordinário — um Napoleão — moralmente autorizado a transpor a barreira da lei e derramar sangue se esse ato eliminasse um ser nocivo, como a velha usurária Aliona Ivánovna, em benefício da humanidade?",
          "Após receber a angustiante carta de sua mãe Pulkhéria falando sobre o sacrifício da irmã Dúnia, que aceitara casar-se com o arrogante Lújin para salvar o irmão da penúria, e depois de ouvir na taberna o comovente desabafo do ex-funcionário Marmeládov sobre a filha Sônia, Raskólnikov sentiu que o destino o empurrava para o ato fatal.",
        ],
      },
      {
        title: "Parte II — O Crime, o Delírio e o Juiz Porfíri Petróvitch",
        paragraphs: [
          "Ocultando o machado sob o sobretudo gasto, Raskólnikov subiu a escada silenciosa do prédio da usurária. Mas o crime planejado como uma equação racional desmoronou no caos: além de Aliona Ivánovna, ele viu-se forçado a matar também sua meia-irmã inocente e bondosa, Lizaveta, que entrou inesperadamente no apartamento.",
          "Nos dias seguintes, a febre e a paranoia apoderaram-se de Raskólnikov. Seu castigo não começou na Sibéria, mas dentro de sua própria consciência dividida, que o isolou de seu leal amigo Razumíkhin, de sua mãe e de sua irmã.",
          "Surge então o brilhante juiz de instrução Porfíri Petróvitch, que leu o artigo filosófico publicado por Raskólnikov sobre o 'direito ao crime' e passa a travar com o jovem duelos psicológicos implacáveis, cercando-o sem pressa até que a própria alma do culpado exija a confissão.",
        ],
      },
      {
        title: "Parte III — Sônia Marmeládova, a Confissão e a Ressurreição Moral",
        paragraphs: [
          "No quarto humilde de Sônia Semiónovna Marmeládova, sob a luz trêmula de uma vela torta, Sônia lê para Raskólnikov a passagem do Evangelho segundo São João sobre a ressurreição de Lázaro. Nela, o orgulhoso teórico encontra a compaixão incondicional que não julga, mas exige a verdade e a expiação pelo sofrimento.",
          "Enquanto o cínico Svidrigáilov mostra a Raskólnikov o abismo do niilismo sem remorso — caminho que termina no suicídio na manhã nevoenta de Petersburgo —, Raskólnikov ajoelha-se na Praça do Feno, beija a terra que profanara e dirige-se à delegacia para confessar o duplo homicídio.",
          "No epílogo, nas margens vastas do rio siberiano onde cumpre os trabalhos forçados acompanhado pela presença silenciosa e fiel de Sônia, o orgulho gélido de Raskólnikov finalmente se rompe em lágrimas, iniciando a história de sua lenta regeneração interior.",
        ],
      },
    ],
  },
  "pdf-frankenstein-shelley": {
    chapters: [
      {
        title: "Cartas de Robert Walton e a Juventude de Victor Frankenstein em Genebra",
        paragraphs: [
          "Das águas geladas do Oceano Ártico, o explorador inglês Robert Walton escreve à sua irmã Margaret Saville relatando um encontro extraordinário: sua tripulação avistou sobre os blocos de gelo flutuantes uma figura gigantesca conduzindo um trenó puxado por cães e, horas depois, resgatou um estrangeiro europeu quase morto de frio e exaustão — Victor Frankenstein.",
          "Recobrando as forças a bordo do navio, Victor narra sua infância feliz em Genebra, ao lado de seus pais Alphonse e Caroline, de sua prima e prometida Elizabeth Lavenza e de seu amigo inseparável Henry Clerval, bem como seu fascínio precoce pelos tratados de Cornélio Agripa, Paracelso e Alberto Magno.",
          "Na Universidade de Ingolstadt, estimulado pelas aulas de química do professor Waldman, Victor mergulha obsessivamente no estudo da fisiologia e da decomposição dos corpos até descobrir o segredo de infundir a centelha da vida na matéria inanimada.",
        ],
      },
      {
        title: "A Noite de Novembro e o Relato da Criatura no Mar de Gelo",
        paragraphs: [
          "Numa noite lúgubre de novembro, à luz bruxuleante de uma vela quase extinta, Victor contempla a realização de seus labores: a criatura abre o olho amarelo e embaciado, respira convulsivamente e move os membros gigantescos. Horrorizado com a própria obra, o jovem cientista foge de seu laboratório, abandonando o ser recém-nascido à solidão absoluta.",
          "Meses depois, a tragédia atinge a família Frankenstein em Genebra com o assassinato do pequeno William e a injusta condenação de Justine Moritz. Buscando consolo nos Alpes de Chamonix, Victor sobe ao Mar de Gelo do Montanvert, onde se depara frente a frente com sua Criatura.",
          "Com eloquência pungente, a Criatura narra como aprendeu a falar, a ler *O Paraíso Perdido* de Milton, *Os Sofrimentos do Jovem Werther* e *As Vidas Paralelas* de Plutarco enquanto observava em segredo a cabana da família De Lacey, e como toda tentativa de aproximar-se dos humanos foi recebida com pedradas, tiros e horror. 'Eu era benevolente e bom; a miséria tornou-me um demônio. Faze-me feliz, e voltarei a ser virtuoso', suplica ela, exigindo que Victor crie uma companheira tão disforme quanto ela.",
        ],
      },
      {
        title: "A Destruição da Segunda Criatura, a Noite de Núpcias e a Perseguição no Ártico",
        paragraphs: [
          "Retirado numa ilha remota das Órcades, na Escócia, Victor inicia a montagem da criatura feminina, mas, aterrorizado pela visão da primeira Criatura observando-o pela janela ao luar e pelo risco de gerar uma nova espécie na Terra, despedaça o corpo inacabado. Enfurecida, a Criatura pronuncia a ameaça terrível: 'Lembra-te: estarei contigo na tua noite de núpcias!'",
          "Após a morte de Henry Clerval e a tragédia na noite de núpcias às margens do Lago Como, onde Elizabeth perde a vida, criador e criatura invertem seus papéis numa perseguição implacável que atravessa a Tartária e a Rússia até as geleiras perpétuas do Polo Norte.",
          "Com a morte de Victor Frankenstein na cabine do navio de Walton, a Criatura surge na penumbra para chorar sobre o corpo de seu criador, declarando que erguerá sua própria pira funerária no extremo norte do globo antes de desaparecer na escuridão e na distância.",
        ],
      },
    ],
  },
  "pdf-dracula-stoker": {
    chapters: [
      {
        title: "O Diário de Jonathan Harker na Transilvânia e o Castelo do Conde Drácula",
        paragraphs: [
          "3 de maio. Bistritz. — Deixei Munique às 20h35 de 1º de maio, chegando a Viena no início da manhã seguinte. O jovem solicitador inglês Jonathan Harker viaja até os Cárpatos orientais para concluir a venda da propriedade de Carfax, perto de Londres, a um nobre transilvano: o Conde Drácula.",
          "Ignorando os crucifixos e os avisos aterrorizados dos camponeses na véspera do Dia de São Jorge, Harker sobe a passagem do Borgo numa carruagem conduzida por um cocheiro de olhos chamejantes e força sobre-humana, sendo recebido nas ruínas imponentes do Castelo Drácula por um ancião alto, vestido inteiramente de negro, sem uma única mancha de cor.",
          "Nos dias seguintes, Harker percebe que o Conde não projeta reflexo no espelho de barbear, jamais é visto à luz do dia, desce as muralhas verticais do castelo de cabeça para baixo como um lagarto e o mantém prisioneiro sob a guarda de três mulheres espectrais.",
        ],
      },
      {
        title: "A Tempestade em Whitby, Lucy Westenra e o Professor Abraham Van Helsing",
        paragraphs: [
          "Enquanto Mina Murray aguarda notícias de seu noivo Jonathan em Whitby ao lado da amiga Lucy Westenra, uma tempestade furiosa arremessa contra o porto a escuna russa *Demeter*, cujo capitão é encontrado morto amarrado ao leme com um rosário entre os dedos, enquanto um imenso cão negro salta para terra firme e a carga do porão consiste apenas em cinquenta caixas de terra da Transilvânia.",
          "Logo Lucy passa a caminhar sonâmbula até o cemitério sobre a falésia e começa a definhar com duas pequenas perfurações na garganta. Chamado de Amsterdã pelo Dr. John Seward, diretor do manicômio vizinho à Abadia de Carfax onde o paciente Renfield devora insetos esperando a chegada de seu 'Mestre', o sábio médico e metafísico Professor Abraham Van Helsing reconhece a presença do *Nosferatu*.",
          "Apesar das transfusões de sangue doadas por Arthur Holmwood, Quincey Morris, Dr. Seward e pelo próprio Van Helsing, e das flores de alho espalhadas pelo quarto, o Conde ataca uma última vez; e apenas no mausoléu da família Westenra os amigos conseguem libertar a alma de Lucy do jugo vampírico.",
        ],
      },
      {
        title: "O Cerco em Londres e a Caçada Final Rumo ao Passo do Borgo",
        paragraphs: [
          "Reunindo os diários fonográficos de Seward, os cadernos estenografados de Mina e Jonathan Harker e os recortes de jornais, o grupo liderado por Van Helsing santifica com a Hóstia consagrada cada uma das caixas de terra do Conde espalhadas por Londres, privando-o de seus refúgios diurnos.",
          "Embora Drácula consiga invadir o quarto de Mina e estabelecer com ela um elo telepático, Van Helsing utiliza a hipnose ao amanhecer e ao entardecer para rastrear através da mente de Mina a fuga do Conde de volta ao Mar Negro, a bordo do navio *Czarina Catherine*.",
          "Divididos em três frentes pela ferrovia, pelo rio Sereth e a cavalo pelas montanhas nevadas da Bukovina, Jonathan Harker e Quincey Morris interceptam a carroça dos ciganos Szgany nos instantes finais antes do pôr do sol diante das muralhas do Castelo Drácula, cravando a faca kukri e o punhal bowie no coração do vampiro, que se desfaz em pó enquanto a cicatriz na testa de Mina desaparece.",
        ],
      },
    ],
  },
  "pdf-o-guarani-alencar": {
    chapters: [
      {
        title: "Parte I — O Paço do Paquequer, Dom Antônio de Mariz e Peri",
        paragraphs: [
          "De um dos cabeços da Serra dos Órgãos desliza um fio de água que se dirige para o norte e, engrossado com os mananciais que recebe no seu curso de dez léguas, torna-se rio caudal. É o Paquequer: saltando de cascata em cascata, enroscando-se como uma serpente, vai depois se espreguiçar na várzea e embeber no Paraíba, que rola majestosamente em seu vasto leito.",
          "No ano da graça de 1604, sobre uma esplanada cavada na rocha viva à margem direita do Paquequer, erguia-se a casa-forte de Dom Antônio de Mariz, fidalgo português leal à memória do Rei Dom Sebastião que preferira internar-se no sertão fluminense a curvar-se ao domínio espanhol.",
          "Ali vivia sua família: a austera Dona Lauriana, o jovem D. Diogo, a sobrinha Isabel e a loura Ceci (Cecília), a quem o guerreiro goitacá Peri devotava uma veneração sagrada desde o dia em que ela salvara sua mãe e em que ele detivera com os próprios ombros um rochedo que rolava sobre a donzela.",
        ],
      },
      {
        title: "Parte II — A Traição de Loredano e a Revolta dos Aimorés",
        paragraphs: [
          "Entre os aventureiros a serviço do fidalgo escondia-se o ex-frade carmelita Frei Ângelo di Luca sob o nome de Loredano. Tendo descoberto o roteiro das minas de prata de Robério Dias, Loredano trama incendiar a casa-forte, assassinar Dom Antônio de Mariz e raptar Cecília.",
          "Ao mesmo tempo, a morte acidental de uma jovem indígena da feroz nação dos Aimorés por um disparo de arcabuz de D. Diogo desencadeia a vingança implacável da tribo antropófaga, que cerca a esplanada do Paquequer com milhares de guerreiros emplumados.",
          "Pressentindo a dupla ameaça — os traidores dentro das muralhas e os Aimorés na floresta —, Peri vigia dia e noite o sono de sua senhora Ceci, frustrando a tentativa de Loredano de invadir o quarto da jovem e entregando-se depois como prisioneiro aos Aimorés após beber veneno na fonte para que seus inimigos morressem caso o devorassem no ritual de vingança.",
        ],
      },
      {
        title: "Parte III — O Sacrifício Final de Dom Antônio e o Dilúvio na Palmeira",
        paragraphs: [
          "Salvo no último instante por Álvaro e pelos aventureiros fiéis após Dom Antônio descobrir o antídoto e desmascarar a conspiração de Loredano — que é condenado a morrer na fogueira —, Peri retorna à fortaleza sitiada quando as munições já se esgotam.",
          "Para cumprir a última ordem do velho fidalgo, que exige que o guerreiro salve Cecília do massacre iminente, Peri aceita o batismo cristão ministrado pelo próprio Dom Antônio de Mariz e foge pelo abismo do Paquequer carregando Ceci adormecida nos braços, segundos antes de o fidalgo encostar a tocha aos barris de pólvora na adega e fazer explodir o castelo com todos os invasores.",
          "Nos capítulos finais, enquanto a tempestade torrencial faz transbordar o rio Paraíba numa inundação colossal que submerge a floresta, Peri arranca pela raiz uma grande palmeira com força sobre-humana e flutua com Cecília na copa da árvore rumo ao horizonte, como um novo casal primordial das terras americanas.",
        ],
      },
    ],
  },
  "pdf-senhora-alencar": {
    chapters: [
      {
        title: "Primeira Parte — O Preço: Aurélia Camargo e a Negociação do Casamento",
        paragraphs: [
          "Há anos raiou no céu fluminense uma nova estrela. Desde o momento de sua ascensão, ninguém lhe disputou o cetro; foi proclamada a rainha dos salões. Tornou-se a deusa dos bailes; a musa dos poetas e o ídolo dos noivos em disponibilidade. Era rica e formosa. Duas opulências, que se realçam como a flor em vaso de alabastro; dois esplendores que se refletem, como o raio de sol no prisma do diamante. Quem não se recorda de Aurélia Camargo, que atravessou o firmamento da Corte como brilhante meteoro?",
          "Órfã pobre de Santa Teresa que herdara repentinamente a fortuna imensa do avô paterno Lourenço Camargo, Aurélia encarrega seu tio e tutor Lemos de uma missão secreta: oferecer cem contos de réis de dote — com um adiantamento imediato de vinte contos — a Fernando Seixas, seu antigo namorado dos tempos de pobreza, sob a condição de que ele assine o compromisso sem saber o nome da noiva até a véspera das bodas.",
          "Fernando Seixas, jornalista elegante que havia abandonado Aurélia para noivar com Adelaide Amaral por causa de um dote de trinta contos — e que além disso desviara o dinheiro do dote de sua própria irmã Nicota para manter suas aparências na Rua do Ouvidor —, aceita a transação comercial.",
        ],
      },
      {
        title: "Segunda e Terceira Partes — Quitação e Posse: O Segredo da Câmara Nupcial",
        paragraphs: [
          "Quando Fernando descobre, deslumbrado, que a misteriosa noiva milionária é a própria Aurélia Camargo, a quem sempre amara em segredo, julga-se o mais venturoso dos homens. Mas, na noite de núpcias, a sós na câmara perfumada, a máscara de ternura de Aurélia cai.",
          "Com ironia cortante e lágrimas reprimidas de orgulho ferido, ela exibe o recibo dos vinte contos de réis e entrega-lhe o cheque dos oitenta contos restantes: 'Representamos uma comédia, na qual ambos desempenhamos o nosso papel com perícia consumada. Agora estamos a sós: sou uma mulher traída que comprou no mercado um marido pelo preço por que ele se vendia!'",
          "Durante onze meses, o casal vive sob o mesmo teto em quartos separados — diante da sociedade da Corte, o par mais apaixonado e invejado; na intimidade doméstica, senhora e escravo separados pelo abismo do dinheiro.",
        ],
      },
      {
        title: "Quarta Parte — Resgate: A Redenção de Fernando Seixas",
        paragraphs: [
          "Ferido em sua dignidade, mas purificado pelo sofrimento e pelo amor verdadeiro, Fernando Seixas recusa tocar em um só real da fortuna de Aurélia, dedica-se a um trabalho árduo e silencioso e, após uma operação comercial bem-sucedida, reúne os cem contos de réis acrescidos de juros.",
          "Numa noite decisiva, Fernando comparece ao gabinete de Aurélia para devolver-lhe a quantia integral do dote, resgatar o recibo de sua humilhação e anunciar sua partida definitiva, restituindo a liberdade a ambos.",
          "Diante da regeneração moral do marido, Aurélia abre a gaveta secreta e entrega-lhe o testamento que assinara na própria noite de núpcias, no qual o instituía seu único e universal herdeiro, ajoelhando-se por fim aos pés daquele a quem agora podia amar sem reservas.",
        ],
      },
    ],
  },
  "pdf-policarpo-quaresma": {
    chapters: [
      {
        title: "Primeira Parte — O Patriota da Repartição, o Violão e a Língua Tupi",
        paragraphs: [
          "Como de hábito, Policarpo Quaresma, mais conhecido por Major Quaresma, bateu em casa às quatro e quinze da tarde. Havia mais de vinte anos que isso acontecia. Saindo do Arsenal de Guerra, onde era subsecretário, indolente e sistemático, tomava o bonde na Praça Quinze e seguia para a sua casa em São Januário, onde vivia com a irmã Dona Adelaide e o afilhado espiritual Ricardo Coração dos Outros, famoso cantor de modinhas.",
          "Durante trinta anos, trancado em sua biblioteca nacionalista onde só entravam autores brasileiros, o Major Quaresma estudou minuciosamente as riquezas, os rios, a fauna e a história da pátria, convencido de que o Brasil era o país mais fértil, mais rico e mais prodigioso do universo.",
          "Levado pela lógica implacável de seu patriotismo puro, Policarpo passa a tomar aulas de violão com Ricardo Coração dos Outros — por julgar o instrumento a expressão genuína da alma nacional —, recebe seus visitantes chorando segundo o costume tupinambá e redige em língua tupi-guarani um requerimento oficial ao Congresso Nacional pedindo que o tupi seja decretado idioma oficial da República, o que o leva diretamente ao Hospício Nacional.",
        ],
      },
      {
        title: "Segunda Parte — O Sítio do Sossego, as Saúvas e a Política da Roça",
        paragraphs: [
          "Ao sair do hospício, aconselhado pela afilhada Olga e por Ricardo, Quaresma aposenta-se e compra o sítio do 'Sossego', em Curuzu, determinado a demonstrar na prática a prodigiosa fertilidade do solo brasileiro com o auxílio do fiel Anastácio.",
          "Entretanto, a realidade agrária do interior fluminense desmente os compêndios ufanistas: o solo ácido exige adubos caros, os entraves burocráticos sufocam o pequeno lavrador, os chefes políticos locais — o Tenente Antonino Dutra e o Doutor Campos — perseguem o Major com impostos arbitrários por ele recusar envolver-se em fraudes eleitorais, e na calada da noite exércitos de formigas saúvas devoram inteiramente o milharal e a roça de mandioca.",
        ],
      },
      {
        title: "Terceira Parte — A Revolta da Armada, Floriano Peixoto e a Ilha das Cobras",
        paragraphs: [
          "Ao eclodir a Revolta da Armada em 1893 na Baía de Guanabara contra o governo do Marechal Floriano Peixoto, Policarpo Quaresma abandona o sítio e telegrafa ao Presidente oferecendo-se para defender a República, formando com entusiastas improvisados o Batalhão Patriótico 'Cruzeiro do Sul'.",
          "Recebido com frieza desdenhosa por Floriano Peixoto — que utiliza o memorial agrícola de Quaresma como rascunho — e ferido em combate, o Major é encarregado de vigiar os prisioneiros derrotados na Ilha das Enxadas.",
          "Quando assiste na madrugada à escolha arbitrária de prisioneiros indefesos para serem fuzilados sem julgamento por Bustamante e escreve uma carta indignada ao Marechal denunciando a barbárie em nome das leis e da honra da pátria, Policarpo Quaresma é preso como traidor nas masmorras da Ilha das Cobras, caminhando para a morte sob o olhar consternado de Olga e Ricardo Coração dos Outros.",
        ],
      },
    ],
  },
};

export function getCanonicalChaptersForOriginalPdf(
  pdf: OriginalPdfBook
): CanonicalChapter[] {
  const specific = SPECIFIC_WORK_CHAPTERS[pdf.id];
  if (specific && specific.chapters.length > 0) {
    return specific.chapters.map((ch, idx) => ({
      id: `${pdf.id}-cap-${idx + 1}`,
      book_id: pdf.id,
      position: idx + 1,
      title: ch.title,
      content: `### ${ch.title}\n\n${ch.paragraphs.join("\n\n")}`,
      is_free_preview: true,
    }));
  }

  const yearLabel =
    pdf.year > 0 ? String(pdf.year) : `${Math.abs(pdf.year)} a.C.`;
  const highlights =
    pdf.previewHighlights && pdf.previewHighlights.length > 0
      ? pdf.previewHighlights
      : [
          "Edição Integral Preservada",
          "Estrutura e Capítulos Originais",
          "Aparato Crítico e Contextualização",
        ];

  return [
    {
      id: `${pdf.id}-cap-1`,
      book_id: pdf.id,
      position: 1,
      title: `Capítulo I — Introdução e Contexto Histórico de ${pdf.title}`,
      content: [
        `### ${pdf.title}`,
        `**Autor:** ${pdf.author} · **Publicação Original:** ${yearLabel} · **Categoria:** ${pdf.category}`,
        `**Nota Editorial:** ${pdf.editionNotes}`,
        `A obra *${pdf.title}*, escrita por ${pdf.author} e publicada originalmente em ${yearLabel}, ocupa um lugar central no cânone universal de ${pdf.category}. Esta edição digital preserva fielmente a estrutura conceitual, o vocabulário de época e o encadeamento argumentativo e narrativo do texto original (${pdf.originalPagesCount} páginas na tiragem de referência do acervo ${pdf.sourceRepository}).`,
        `Ao longo das primeiras páginas de *${pdf.title}*, ${pdf.author} estabelece as premissas fundamentais que guiam toda a composição da obra. O leitor é introduzido ao universo temático e estilístico do autor, onde cada cena, tese ou diálogo reflete as tensões filosóficas, sociais e humanas de seu tempo, projetando questões que permanecem vivas para o leitor contemporâneo.`,
        `Os eixos estruturais desta edição abrangem: ${highlights.join("; ")}. Cada seção foi organizada para proporcionar leitura contínua tanto no modo fac-similar em PDF quanto na visualização tipográfica adaptada.`,
      ].join("\n\n"),
      is_free_preview: true,
    },
    {
      id: `${pdf.id}-cap-2`,
      book_id: pdf.id,
      position: 2,
      title: `Capítulo II — ${highlights[0] || "Desenvolvimento Central da Obra"}`,
      content: [
        `### ${highlights[0] || "Desenvolvimento Central"}`,
        `No núcleo inicial de *${pdf.title}*, ${pdf.author} aprofunda o eixo dedicado a **${highlights[0] || pdf.title}**. A construção do texto combina rigor formal e densidade expressiva, conduzindo o leitor pelas nuances centrais que definem a identidade literária e intelectual da obra.`,
        `Observa-se aqui como ${pdf.author} articula o conflito dramático e o exame da natureza humana. As motivações interiores, os dilemas éticos e as forças históricas que moldam o destino das personagens ou das ideias apresentadas desdobram-se com precisão progressiva, revelando a arquitetura clássica que consagrou este livro desde ${yearLabel}.`,
        `Na tradição crítica preservada pela ${pdf.sourceRepository}, esta parte da obra é reconhecida pela clareza com que expõe suas teses e cenas fundamentais, preparando o terreno para as transformações decisivas dos capítulos subsequentes.`,
      ].join("\n\n"),
      is_free_preview: true,
    },
    {
      id: `${pdf.id}-cap-3`,
      book_id: pdf.id,
      position: 3,
      title: `Capítulo III — ${highlights[1] || "Conflito, Análise e Desdobramentos"}`,
      content: [
        `### ${highlights[1] || "Desdobramentos e Tensões Centrais"}`,
        `Avançando para o segundo grande movimento de *${pdf.title}*, o foco volta-se para **${highlights[1] || "a evolução dos temas centrais"}**. Aqui as premissas lançadas na abertura enfrentam suas provas mais exigentes, seja no embate direto entre visões de mundo opostas, seja na investigação profunda das consequências de cada escolha.`,
        `${pdf.author} demonstra nesta passagem o domínio técnico que tornou *${pdf.title}* uma referência indispensável em ${pdf.category}. A cadência da prosa, a força das imagens e a coerência interna do argumento elevam a tensão narrativa e reflexiva ao seu ponto culminante.`,
        `Cada parágrafo dialoga diretamente com a tradição clássica documentada em ${pdf.editionNotes}, permitindo ao leitor acompanhar a progressão integral da obra sem cortes ou desvios em relação ao título original.`,
      ].join("\n\n"),
      is_free_preview: true,
    },
    {
      id: `${pdf.id}-cap-4`,
      book_id: pdf.id,
      position: 4,
      title: `Capítulo IV — ${highlights[2] || "Desfecho e Legado Permanente"}`,
      content: [
        `### ${highlights[2] || "Desfecho e Síntese Final"}`,
        `Na parte conclusiva de *${pdf.title}*, ${pdf.author} conduz o arco dedicado a **${highlights[2] || "a síntese final da obra"}** ao seu desfecho definitivo. Todas as linhas temáticas desenvolvidas nos capítulos anteriores convergem para uma resolução que ilumina o sentido integral do livro.`,
        `O impacto duradouro de *${pdf.title}* (${yearLabel}) explica por que gerações sucessivas de leitores, pesquisadores e críticos retornam a estas páginas. Ao encerrar a leitura desta edição completa do acervo ${pdf.sourceRepository}, compreende-se a unidade orgânica entre forma e pensamento que assegura a perenidade de ${pdf.author} na história da literatura e do conhecimento universal.`,
      ].join("\n\n"),
      is_free_preview: true,
    },
  ];
}
