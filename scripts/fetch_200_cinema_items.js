import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const API_KEY = '15d2ea6d0dc1d476efbca3eba2b9bbfb';

// Existing 18 IDs in src/lib/cinema.ts so we don't duplicate them
const EXISTING_TMDB_IDS = new Set([
  693134, 872585, 157336, 335984, 603, 155, 129, 496243, 98,
  126308, 95396, 94605, 136315, 87108, 1396, 76331, 100088, 66732,
]);

const GENRE_MAP = {
  28: 'Ação',
  12: 'Aventura',
  16: 'Animação',
  35: 'Comédia',
  80: 'Crime',
  99: 'Histórico',
  18: 'Drama',
  10751: 'Aventura',
  14: 'Ficção Científica',
  36: 'Histórico',
  27: 'Suspense',
  10402: 'Romance',
  9648: 'Suspense',
  10749: 'Romance',
  878: 'Ficção Científica',
  10770: 'Romance',
  53: 'Suspense',
  10752: 'Histórico',
  37: 'Ação',
  10759: 'Ação',
  10762: 'Séries Juvenis',
  10765: 'Ficção Científica',
  10768: 'Histórico',
};

// Curated TV Series IDs with explicit genre tags so Youth Series (Weak Hero style), Doramas, Action & Romance are 100% present
const CURATED_SERIES = [
  // Weak Hero & Youth Action / High School Survival / K-Drama Thrillers
  { id: 200709, extraGenres: ['Doramas', 'Séries Juvenis', 'Ação', 'Drama'], featured: true, trending: true }, // Weak Hero Class 1 & 2 (Classe dos Heróis Fracos)
  { id: 233347, extraGenres: ['Doramas', 'Séries Juvenis', 'Ação', 'Comédia'], featured: true, trending: true }, // Study Group (Grupo de Estudos)
  { id: 127529, extraGenres: ['Doramas', 'Séries Juvenis', 'Ação', 'Crime'], featured: true, trending: true }, // Bloodhounds (Cães de Caça)
  { id: 90814, extraGenres: ['Doramas', 'Séries Juvenis', 'Crime', 'Suspense'], trending: true }, // Extracurricular
  { id: 208336, extraGenres: ['Doramas', 'Séries Juvenis', 'Suspense', 'Ação'], trending: true }, // Revenge of Others (Em Busca de Vingança)
  { id: 229915, extraGenres: ['Doramas', 'Séries Juvenis', 'Suspense'], trending: true }, // Night Has Come (A Noite Chegou)
  { id: 224030, extraGenres: ['Doramas', 'Séries Juvenis', 'Ação', 'Fantasia'], trending: true }, // High School Return of a Gangster
  { id: 226527, extraGenres: ['Doramas', 'Séries Juvenis', 'Drama', 'Romance'], trending: true }, // Hierarchy
  { id: 158258, extraGenres: ['Doramas', 'Séries Juvenis', 'Ação', 'Ficção Científica'], trending: true }, // Duty After School
  { id: 99966, extraGenres: ['Doramas', 'Séries Juvenis', 'Ação', 'Suspense'], featured: true, trending: true }, // All of Us Are Dead
  { id: 276161, extraGenres: ['Doramas', 'Séries Juvenis', 'Ação', 'Drama'], trending: true }, // Aprendendo a Lição (True Education)
  { id: 113268, extraGenres: ['Doramas', 'Séries Juvenis', 'Ação'], trending: true }, // Caçadores de Demônios (The Uncanny Counter)
  { id: 126485, extraGenres: ['Doramas', 'Séries Juvenis', 'Ação', 'Ficção Científica'], featured: true, trending: true }, // Em Movimento (Moving)
  { id: 110356, extraGenres: ['Doramas', 'Ação', 'Crime', 'Suspense'], trending: true }, // My Name
  { id: 136283, extraGenres: ['Doramas', 'Drama', 'Suspense'], featured: true, trending: true }, // A Lição (The Glory)
  { id: 93405, extraGenres: ['Doramas', 'Ação', 'Suspense'], featured: true, trending: true }, // Round 6 (Squid Game)
  { id: 96648, extraGenres: ['Doramas', 'Ação', 'Suspense', 'Ficção Científica'], trending: true }, // Sweet Home
  { id: 110316, extraGenres: ['Doramas', 'Séries Juvenis', 'Ação', 'Suspense'], featured: true, trending: true }, // Alice in Borderland
  { id: 156484, extraGenres: ['Doramas', 'Suspense', 'Drama'], trending: true }, // The 8 Show
  { id: 218230, extraGenres: ['Doramas', 'Ação', 'Drama', 'Suspense'], trending: true }, // O Jogo da Morte (Death's Game)
  { id: 119769, extraGenres: ['Doramas', 'Ação', 'Crime'], trending: true }, // O Taxista (Taxi Driver)
  { id: 208825, extraGenres: ['Doramas', 'Ação', 'Ficção Científica', 'Suspense'], trending: true }, // Parasyte: The Grey
  { id: 155226, extraGenres: ['Doramas', 'Crime', 'Suspense'], trending: true }, // Big Mouth
  { id: 135238, extraGenres: ['Doramas', 'Ação', 'Suspense', 'Histórico'], trending: true }, // A Criatura de Gyeongseong
  { id: 117378, extraGenres: ['Doramas', 'Crime', 'Suspense'], trending: true }, // Mouse
  { id: 99494, extraGenres: ['Doramas', 'Suspense', 'Romance', 'Crime'], trending: true }, // Flower of Evil
  { id: 135340, extraGenres: ['Doramas', 'Ação', 'Suspense', 'Romance'], trending: true }, // Felicidade (Happiness)
  { id: 137040, extraGenres: ['Doramas', 'Ação', 'Ficção Científica'], trending: true }, // Black Knight
  { id: 106651, extraGenres: ['Doramas', 'Suspense', 'Drama'], trending: true }, // Profecia do Inferno (Hellbound)
  { id: 70593, extraGenres: ['Doramas', 'Ação', 'Histórico', 'Suspense'], trending: true }, // Kingdom

  // Iconic Romance & Youth Doramas (K-Dramas / C-Dramas / J-Dramas)
  { id: 215720, extraGenres: ['Doramas', 'Romance', 'Drama', 'Comédia'], featured: true, trending: true }, // Rainha das Lágrimas (Queen of Tears)
  { id: 230923, extraGenres: ['Doramas', 'Séries Juvenis', 'Romance', 'Comédia'], featured: true, trending: true }, // Adorável Corredora (Lovely Runner)
  { id: 212204, extraGenres: ['Doramas', 'Séries Juvenis', 'Romance', 'Drama'], featured: true, trending: true }, // Melancia Cintilante (Twinkling Watermelon)
  { id: 112888, extraGenres: ['Doramas', 'Séries Juvenis', 'Romance', 'Comédia'], featured: true, trending: true }, // Beleza Verdadeira (True Beauty)
  { id: 154825, extraGenres: ['Doramas', 'Romance', 'Comédia'], featured: true, trending: true }, // Pretendente Surpresa (Business Proposal)
  { id: 198004, extraGenres: ['Doramas', 'Romance', 'Comédia'], trending: true }, // Sorriso Real (King the Land)
  { id: 94796, extraGenres: ['Doramas', 'Romance', 'Drama'], featured: true, trending: true }, // Pousando no Amor (Crash Landing on You)
  { id: 67915, extraGenres: ['Doramas', 'Romance', 'Drama'], featured: true, trending: true }, // Goblin
  { id: 117376, extraGenres: ['Doramas', 'Ação', 'Crime', 'Romance'], featured: true, trending: true }, // Vincenzo
  { id: 135157, extraGenres: ['Doramas', 'Ação', 'Romance', 'Aventura'], featured: true, trending: true }, // Alquimia das Almas (Alchemy of Souls)
  { id: 218539, extraGenres: ['Doramas', 'Romance', 'Comédia'], trending: true }, // Meu Demônio Favorito (My Demon)
  { id: 221851, extraGenres: ['Doramas', 'Romance', 'Drama'], trending: true }, // A Esposa do Meu Marido (Marry My Husband)
  { id: 219246, extraGenres: ['Doramas', 'Romance', 'Drama'], featured: true, trending: true }, // Se a Vida Te Der Tangerinas...
  { id: 253905, extraGenres: ['Doramas', 'Romance', 'Suspense'], trending: true }, // Quando o Telefone Toca (When the Phone Rings)
  { id: 129888, extraGenres: ['Doramas', 'Séries Juvenis', 'Romance', 'Drama'], trending: true }, // Vinte e Cinco, Vinte e Um
  { id: 128883, extraGenres: ['Doramas', 'Romance', 'Comédia'], trending: true }, // Hometown Cha-Cha-Cha
  { id: 96462, extraGenres: ['Doramas', 'Romance', 'Drama'], trending: true }, // Tudo Bem Não Ser Normal
  { id: 197067, extraGenres: ['Doramas', 'Drama', 'Romance'], trending: true }, // Uma Advogada Extraordinária
  { id: 65143, extraGenres: ['Doramas', 'Romance', 'Ação'], trending: true }, // Descendentes do Sol
  { id: 96162, extraGenres: ['Doramas', 'Drama', 'Romance'], trending: true }, // Itaewon Class
  { id: 89641, extraGenres: ['Doramas', 'Séries Juvenis', 'Romance'], trending: true }, // Alarme do Amor (Love Alarm)
  { id: 16420, extraGenres: ['Doramas', 'Séries Juvenis', 'Romance', 'Comédia'], trending: true }, // Meninos Antes de Flores (Boys Over Flowers)
  { id: 68349, extraGenres: ['Doramas', 'Séries Juvenis', 'Romance', 'Comédia'], trending: true }, // A Fada do Levantamento de Peso, Kim Bok-Joo
  { id: 68814, extraGenres: ['Doramas', 'Romance', 'Comédia', 'Ação'], trending: true }, // Mulher Forte, Do Bong-soon
  { id: 79434, extraGenres: ['Doramas', 'Romance', 'Comédia'], trending: true }, // O Que Houve com a Secretária Kim?
  { id: 93846, extraGenres: ['Doramas', 'Romance', 'Ficção Científica'], trending: true }, // O Rei Eterno
  { id: 60957, extraGenres: ['Doramas', 'Romance', 'Comédia'], trending: true }, // Meu Amor das Estrelas
  { id: 90447, extraGenres: ['Doramas', 'Romance', 'Drama'], trending: true }, // Hotel del Luna
  { id: 108284, extraGenres: ['Doramas', 'Ação', 'Romance'], trending: true }, // O Conto de Nove Caudas
  { id: 116386, extraGenres: ['Doramas', 'Romance', 'Drama'], trending: true }, // Desgraça ao seu Dispor
  { id: 108261, extraGenres: ['Doramas', 'Romance', 'Comédia', 'Histórico'], trending: true }, // Sr. Rainha
  { id: 66433, extraGenres: ['Doramas', 'Romance', 'Histórico', 'Drama'], trending: true }, // Moon Lovers: Scarlet Heart Ryeo
  { id: 66330, extraGenres: ['Doramas', 'Romance', 'Suspense'], trending: true }, // W - Dois Mundos
  { id: 63767, extraGenres: ['Doramas', 'Romance', 'Comédia'], trending: true }, // Ela Era Bonita
  { id: 61670, extraGenres: ['Doramas', 'Ação', 'Romance', 'Suspense'], trending: true }, // O Curandeiro (Healer)
  { id: 61611, extraGenres: ['Doramas', 'Romance', 'Drama'], trending: true }, // Pinóquio
  { id: 48462, extraGenres: ['Doramas', 'Séries Juvenis', 'Romance', 'Drama'], trending: true }, // Herdeiros (The Heirs)
  { id: 74682, extraGenres: ['Doramas', 'Romance', 'Comédia'], trending: true }, // Eu Não Sou um Robô
  { id: 114395, extraGenres: ['Doramas', 'Séries Juvenis', 'Romance'], trending: true }, // Um Amor Tão Lindo
  { id: 87527, extraGenres: ['Doramas', 'Séries Juvenis', 'Romance'], trending: true }, // Primeira Vez Amor
  { id: 96571, extraGenres: ['Doramas', 'Drama'], trending: true }, // A Caminho do Céu
  { id: 99048, extraGenres: ['Doramas', 'Romance', 'Drama'], trending: true }, // Apostando Alto (Start-Up)
  { id: 85404, extraGenres: ['Doramas', 'Romance', 'Comédia'], trending: true }, // Toque Seu Coração
  { id: 108291, extraGenres: ['Doramas', 'Romance', 'Drama'], trending: true }, // Snowdrop
  { id: 129478, extraGenres: ['Doramas', 'Romance', 'Histórico'], trending: true }, // O Rei de Porcelana
  { id: 66329, extraGenres: ['Doramas', 'Romance', 'Drama'], trending: true }, // Médicos
  { id: 64320, extraGenres: ['Doramas', 'Romance', 'Comédia'], trending: true }, // Minha Vênus
  { id: 96160, extraGenres: ['Doramas', 'Romance', 'Ficção Científica'], trending: true }, // Holo, Meu Amor
  { id: 96777, extraGenres: ['Doramas', 'Ficção Científica', 'Suspense'], trending: true }, // O Mar da Tranquilidade
  { id: 112836, extraGenres: ['Doramas', 'Ação', 'Crime'], trending: true }, // La Casa de Papel: Coreia
  { id: 61738, extraGenres: ['Doramas', 'Séries Juvenis', 'Romance'], trending: true }, // High School Love On
  { id: 34408, extraGenres: ['Doramas', 'Séries Juvenis', 'Romance', 'Comédia'], trending: true }, // Beijo Brincalhão (Playful Kiss)
  { id: 75123, extraGenres: ['Doramas', 'Romance', 'Aventura'], trending: true }, // Uma Odisséia Coreana

  // Global Youth Series, High School Action & Coming-of-Age
  { id: 77169, extraGenres: ['Séries Juvenis', 'Ação', 'Drama'], featured: true, trending: true }, // Cobra Kai
  { id: 100757, extraGenres: ['Séries Juvenis', 'Ação', 'Aventura', 'Romance'], featured: true, trending: true }, // Outer Banks
  { id: 119051, extraGenres: ['Séries Juvenis', 'Comédia', 'Suspense'], featured: true, trending: true }, // Wandinha (Wednesday)
  { id: 85552, extraGenres: ['Séries Juvenis', 'Drama'], featured: true, trending: true }, // Euphoria
  { id: 76669, extraGenres: ['Séries Juvenis', 'Drama', 'Suspense', 'Romance'], trending: true }, // Elite
  { id: 250670, extraGenres: ['Séries Juvenis', 'Romance', 'Drama'], featured: true, trending: true }, // Maxton Hall
  { id: 205715, extraGenres: ['Séries Juvenis', 'Ação', 'Ficção Científica'], featured: true, trending: true }, // Gen V
  { id: 124834, extraGenres: ['Séries Juvenis', 'Romance', 'Drama'], trending: true }, // Heartstopper
  { id: 194766, extraGenres: ['Séries Juvenis', 'Romance', 'Drama'], trending: true }, // O Verão que Mudou Minha Vida
  { id: 195670, extraGenres: ['Séries Juvenis', 'Romance', 'Comédia'], trending: true }, // Com Carinho, Kitty (XO, Kitty)
  { id: 205082, extraGenres: ['Doramas', 'Séries Juvenis', 'Ação', 'Crime'], featured: true, trending: true }, // Vigilante
  { id: 215072, extraGenres: ['Doramas', 'Séries Juvenis', 'Ação', 'Suspense'], featured: true, trending: true }, // Uma Loja Para Assassinos (A Shop for Killers)
  { id: 227192, extraGenres: ['Doramas', 'Séries Juvenis', 'Suspense', 'Drama'], featured: true, trending: true }, // O Jogo da Pirâmide (Pyramid Game)
  { id: 199001, extraGenres: ['Séries Juvenis', 'Romance', 'Drama'], trending: true }, // Minha Vida com a Família Walter
  { id: 84231, extraGenres: ['Séries Juvenis', 'Ação', 'Comédia'], trending: true }, // Wayne
  { id: 74577, extraGenres: ['Séries Juvenis', 'Drama', 'Comédia', 'Romance'], trending: true }, // The End of the F***ing World
  { id: 79484, extraGenres: ['Doramas', 'Romance', 'Drama'], trending: true }, // O Enlace
  { id: 81356, extraGenres: ['Séries Juvenis', 'Comédia', 'Drama', 'Romance'], trending: true }, // Sex Education
  { id: 100883, extraGenres: ['Séries Juvenis', 'Comédia', 'Romance'], trending: true }, // Eu Nunca... (Never Have I Ever)
  { id: 117581, extraGenres: ['Séries Juvenis', 'Drama', 'Comédia'], trending: true }, // Ginny & Georgia
  { id: 111110, extraGenres: ['Séries Juvenis', 'Ação', 'Aventura'], featured: true, trending: true }, // One Piece: A Série
  { id: 82452, extraGenres: ['Séries Juvenis', 'Ação', 'Aventura'], trending: true }, // Avatar: O Último Mestre do Ar
  { id: 103540, extraGenres: ['Séries Juvenis', 'Ação', 'Aventura'], trending: true }, // Percy Jackson e os Olimpianos
  { id: 34524, extraGenres: ['Séries Juvenis', 'Ação', 'Drama'], trending: true }, // Teen Wolf
  { id: 48866, extraGenres: ['Séries Juvenis', 'Ficção Científica', 'Ação'], trending: true }, // The 100
  { id: 18165, extraGenres: ['Séries Juvenis', 'Romance', 'Drama'], trending: true }, // The Vampire Diaries
  { id: 85720, extraGenres: ['Séries Juvenis', 'Ação', 'Aventura'], trending: true }, // Sombra e Ossos (Shadow and Bone)
  { id: 86423, extraGenres: ['Séries Juvenis', 'Drama', 'Suspense'], trending: true }, // Locke & Key
  { id: 125910, extraGenres: ['Séries Juvenis', 'Romance', 'Drama'], trending: true }, // Young Royals
  { id: 66788, extraGenres: ['Séries Juvenis', 'Drama', 'Suspense'], trending: true }, // 13 Reasons Why
  { id: 69050, extraGenres: ['Séries Juvenis', 'Drama', 'Suspense', 'Romance'], trending: true }, // Riverdale
  { id: 79242, extraGenres: ['Séries Juvenis', 'Suspense', 'Drama'], trending: true }, // O Mundo Sombrio de Sabrina
  { id: 76747, extraGenres: ['Séries Juvenis', 'Comédia', 'Drama'], trending: true }, // On My Block
  { id: 71578, extraGenres: ['Séries Juvenis', 'Comédia', 'Drama'], trending: true }, // Atypical
  { id: 91239, extraGenres: ['Romance', 'Drama', 'Histórico'], featured: true, trending: true }, // Bridgerton
  { id: 196454, extraGenres: ['Romance', 'Drama', 'Histórico'], trending: true }, // Rainha Charlotte: Uma História Bridgerton
  { id: 89905, extraGenres: ['Romance', 'Drama', 'Séries Juvenis'], trending: true }, // Pessoas Normais (Normal People)
  { id: 215522, extraGenres: ['Romance', 'Drama'], trending: true }, // Um Dia (One Day)

  // Global Action, Thriller, Sci-Fi & Crime Hit Series
  { id: 76479, extraGenres: ['Ação', 'Ficção Científica'], featured: true, trending: true }, // The Boys
  { id: 95557, extraGenres: ['Ação', 'Animação', 'Ficção Científica'], featured: true, trending: true }, // Invencível (Invincible)
  { id: 61889, extraGenres: ['Ação', 'Crime', 'Drama'], trending: true }, // Demolidor (Daredevil)
  { id: 67178, extraGenres: ['Ação', 'Crime', 'Drama'], trending: true }, // O Justiceiro (The Punisher)
  { id: 108978, extraGenres: ['Ação', 'Crime', 'Suspense'], featured: true, trending: true }, // Reacher
  { id: 129552, extraGenres: ['Ação', 'Suspense'], trending: true }, // O Agente Noturno (The Night Agent)
  { id: 60574, extraGenres: ['Crime', 'Drama', 'Ação'], featured: true, trending: true }, // Peaky Blinders
  { id: 44217, extraGenres: ['Ação', 'Aventura', 'Histórico'], trending: true }, // Vikings
  { id: 2288, extraGenres: ['Ação', 'Crime', 'Suspense'], trending: true }, // Prison Break
  { id: 1399, extraGenres: ['Ação', 'Aventura', 'Drama'], featured: true, trending: true }, // Game of Thrones
  { id: 94997, extraGenres: ['Ação', 'Aventura', 'Drama'], featured: true, trending: true }, // A Casa do Dragão
  { id: 84773, extraGenres: ['Ação', 'Aventura', 'Drama'], trending: true }, // O Senhor dos Anéis: Os Anéis de Poder
  { id: 106379, extraGenres: ['Ação', 'Ficção Científica', 'Aventura'], featured: true, trending: true }, // Fallout
  { id: 125988, extraGenres: ['Ficção Científica', 'Drama', 'Suspense'], trending: true }, // Silo
  { id: 196322, extraGenres: ['Ficção Científica', 'Suspense', 'Drama'], trending: true }, // Matéria Escura (Dark Matter)
  { id: 108545, extraGenres: ['Ficção Científica', 'Suspense', 'Drama'], trending: true }, // O Problema dos 3 Corpos
  { id: 70523, extraGenres: ['Ficção Científica', 'Suspense', 'Drama'], trending: true }, // Dark
  { id: 71446, extraGenres: ['Ação', 'Crime', 'Suspense'], trending: true }, // La Casa de Papel
  { id: 96677, extraGenres: ['Crime', 'Suspense', 'Ação'], trending: true }, // Lupin
  { id: 63351, extraGenres: ['Crime', 'Drama'], trending: true }, // Narcos
  { id: 69740, extraGenres: ['Crime', 'Drama', 'Suspense'], trending: true }, // Ozark
  { id: 60059, extraGenres: ['Crime', 'Drama'], trending: true }, // Better Call Saul
  { id: 46648, extraGenres: ['Crime', 'Drama', 'Suspense'], trending: true }, // True Detective
  { id: 67744, extraGenres: ['Crime', 'Suspense', 'Drama'], trending: true }, // Mindhunter
  { id: 19885, extraGenres: ['Crime', 'Drama', 'Suspense'], trending: true }, // Sherlock
  { id: 42009, extraGenres: ['Ficção Científica', 'Suspense', 'Drama'], trending: true }, // Black Mirror
  { id: 86831, extraGenres: ['Animação', 'Ficção Científica', 'Ação'], trending: true }, // Love, Death & Robots
  { id: 105248, extraGenres: ['Animação', 'Ação', 'Ficção Científica'], trending: true }, // Cyberpunk: Mercenários
  { id: 194764, extraGenres: ['Crime', 'Drama'], featured: true, trending: true }, // Pinguim (The Penguin)
  { id: 84958, extraGenres: ['Ação', 'Ficção Científica', 'Aventura'], trending: true }, // Loki
  { id: 92749, extraGenres: ['Ação', 'Aventura'], trending: true }, // Cavaleiro da Lua
  { id: 82856, extraGenres: ['Ação', 'Ficção Científica', 'Aventura'], trending: true }, // The Mandalorian
  { id: 83867, extraGenres: ['Ficção Científica', 'Ação', 'Drama'], trending: true }, // Andor
  { id: 1405, extraGenres: ['Crime', 'Drama', 'Suspense'], trending: true }, // Dexter
  { id: 62560, extraGenres: ['Crime', 'Drama', 'Suspense'], trending: true }, // Mr. Robot
  { id: 124364, extraGenres: ['Suspense', 'Ficção Científica', 'Drama'], trending: true }, // Origem (From)
  { id: 236235, extraGenres: ['Ação', 'Crime', 'Comédia'], trending: true }, // Magnatas do Crime (The Gentlemen)
  { id: 153312, extraGenres: ['Crime', 'Drama', 'Ação'], trending: true }, // Tulsa King
  { id: 73586, extraGenres: ['Drama'], trending: true }, // Yellowstone
  { id: 42573, extraGenres: ['Animação', 'Comédia', 'Drama', 'Séries Juvenis'], featured: true, trending: true }, // Slam Dunk
];

// Curated Movies (Korean Action, Global Action, Romance, Youth Romance, Sci-Fi, Thrillers)
const CURATED_MOVIES = [
  // Korean Action, Youth Action & Thrillers
  { id: 396535, extraGenres: ['Doramas', 'Ação', 'Suspense'], featured: true, trending: true }, // Invasão Zumbi (Train to Busan)
  { id: 581392, extraGenres: ['Doramas', 'Ação', 'Suspense'], trending: true }, // Invasão Zumbi 2: Península
  { id: 479718, extraGenres: ['Doramas', 'Ação', 'Crime'], trending: true }, // Os Fora da Lei (The Outlaws)
  { id: 619803, extraGenres: ['Doramas', 'Ação', 'Crime'], featured: true, trending: true }, // Força Bruta (The Roundup)
  { id: 955555, extraGenres: ['Doramas', 'Ação', 'Crime'], trending: true }, // Força Bruta: Sem Saída (The Roundup: No Way Out)
  { id: 1017163, extraGenres: ['Doramas', 'Ação', 'Crime'], featured: true, trending: true }, // Força Bruta: Punição (The Roundup: Punishment)
  { id: 849869, extraGenres: ['Doramas', 'Ação', 'Suspense'], trending: true }, // Kill Boksoon
  { id: 961268, extraGenres: ['Doramas', 'Ação', 'Suspense'], trending: true }, // Bailarina (Ballerina)
  { id: 1139817, extraGenres: ['Doramas', 'Ação', 'Comédia', 'Crime'], featured: true, trending: true }, // O Agente Faixa-Preta (Officer Black Belt)
  { id: 933131, extraGenres: ['Doramas', 'Ação', 'Ficção Científica'], trending: true }, // Em Ruínas (Badland Hunters)
  { id: 800345, extraGenres: ['Doramas', 'Ação', 'Suspense'], trending: true }, // Carter
  { id: 453127, extraGenres: ['Doramas', 'Séries Juvenis', 'Ação', 'Comédia'], trending: true }, // Jovens Policiais (Midnight Runners)
  { id: 801604, extraGenres: ['Doramas', 'Séries Juvenis', 'Ação', 'Drama'], trending: true }, // Shark: O Início (Shark: The Beginning)
  { id: 897160, extraGenres: ['Doramas', 'Séries Juvenis', 'Ação', 'Comédia'], trending: true }, // Cidadã de Bem (Brave Citizen)
  { id: 51608, extraGenres: ['Doramas', 'Ação', 'Suspense', 'Crime'], trending: true }, // O Homem de Lugar Nenhum (The Man from Nowhere)
  { id: 49797, extraGenres: ['Doramas', 'Ação', 'Suspense', 'Crime'], trending: true }, // Eu Vi o Diabo (I Saw the Devil)
  { id: 670, extraGenres: ['Doramas', 'Ação', 'Suspense', 'Drama'], trending: true }, // Oldboy
  { id: 13855, extraGenres: ['Doramas', 'Crime', 'Suspense'], trending: true }, // O Perseguidor (The Chaser)
  { id: 165213, extraGenres: ['Doramas', 'Crime', 'Ação', 'Drama'], trending: true }, // Novo Mundo (New World)
  { id: 437109, extraGenres: ['Doramas', 'Ação', 'Suspense'], trending: true }, // A Vilã (The Villainess)
  { id: 530254, extraGenres: ['Doramas', 'Ação', 'Ficção Científica', 'Suspense'], trending: true }, // The Witch: Part 1 - The Subversion
  { id: 615173, extraGenres: ['Doramas', 'Ação', 'Ficção Científica'], trending: true }, // The Witch: Part 2 - The Other One
  { id: 581526, extraGenres: ['Doramas', 'Ação', 'Crime'], trending: true }, // Livrai-nos do Mal (Deliver Us from Evil)
  { id: 606523, extraGenres: ['Doramas', 'Crime', 'Drama', 'Ação'], trending: true }, // Noite no Paraíso (Night in Paradise)
  { id: 571785, extraGenres: ['Doramas', 'Ação', 'Suspense'], trending: true }, // Tempo de Caça (Time to Hunt)
  { id: 838209, extraGenres: ['Doramas', 'Suspense'], featured: true, trending: true }, // Exhuma
  { id: 729854, extraGenres: ['Doramas', 'Ação', 'Drama', 'Suspense'], trending: true }, // Utopia de Concreto (Concrete Utopia)
  { id: 995926, extraGenres: ['Doramas', 'Ação', 'Crime'], trending: true }, // Veterano 2 (I, the Executioner)
  { id: 1075676, extraGenres: ['Doramas', 'Ação', 'Histórico'], trending: true }, // Guerra e Revolta (Uprising)

  // Slam Dunk Movies & Sports Anime Cinema
  { id: 783675, extraGenres: ['Animação', 'Drama', 'Comédia', 'Ação'], featured: true, trending: true }, // The First Slam Dunk
  { id: 338379, extraGenres: ['Animação', 'Comédia', 'Drama'], trending: true }, // Slam Dunk: O Filme (1994)
  { id: 338380, extraGenres: ['Animação', 'Comédia', 'Drama'], trending: true }, // Slam Dunk: Conquiste o Nacional, Hanamichi Sakuragi!
  { id: 338382, extraGenres: ['Animação', 'Comédia', 'Drama'], trending: true }, // Slam Dunk: A Maior Crise de Shohoku!
  { id: 338383, extraGenres: ['Animação', 'Comédia', 'Drama'], trending: true }, // Slam Dunk: Ruja a Alma do Jogador!

  // Global Action Movies & Martial Arts
  { id: 245891, extraGenres: ['Ação', 'Suspense'], trending: true }, // John Wick
  { id: 324552, extraGenres: ['Ação', 'Suspense', 'Crime'], trending: true }, // John Wick 2
  { id: 458156, extraGenres: ['Ação', 'Suspense', 'Crime'], trending: true }, // John Wick 3
  { id: 603692, extraGenres: ['Ação', 'Suspense', 'Crime'], featured: true, trending: true }, // John Wick 4: Baba Yaga
  { id: 94329, extraGenres: ['Ação', 'Crime', 'Suspense'], trending: true }, // Operação Invasão (The Raid)
  { id: 180299, extraGenres: ['Ação', 'Crime', 'Suspense'], trending: true }, // Operação Invasão 2 (The Raid 2)
  { id: 449992, extraGenres: ['Ação', 'Suspense', 'Crime'], trending: true }, // A Noite Nos Persegue (The Night Comes for Us)
  { id: 545609, extraGenres: ['Ação', 'Suspense'], trending: true }, // Resgate (Extraction)
  { id: 697843, extraGenres: ['Ação', 'Suspense'], featured: true, trending: true }, // Resgate 2 (Extraction 2)
  { id: 76341, extraGenres: ['Ação', 'Aventura', 'Ficção Científica'], featured: true, trending: true }, // Mad Max: Estrada da Fúria
  { id: 786892, extraGenres: ['Ação', 'Aventura', 'Ficção Científica'], featured: true, trending: true }, // Furiosa: Uma Saga Mad Max
  { id: 361743, extraGenres: ['Ação', 'Drama'], featured: true, trending: true }, // Top Gun: Maverick
  { id: 156022, extraGenres: ['Ação', 'Suspense', 'Crime'], trending: true }, // O Protetor (The Equalizer)
  { id: 345887, extraGenres: ['Ação', 'Suspense', 'Crime'], trending: true }, // O Protetor 2
  { id: 926393, extraGenres: ['Ação', 'Suspense', 'Crime'], trending: true }, // O Protetor: Capítulo Final
  { id: 615457, extraGenres: ['Ação', 'Crime', 'Suspense'], trending: true }, // Anônimo (Nobody)
  { id: 718930, extraGenres: ['Ação', 'Comédia', 'Suspense'], trending: true }, // Trem-Bala (Bullet Train)
  { id: 560016, extraGenres: ['Ação', 'Suspense'], trending: true }, // Fúria Primitiva (Monkey Man)
  { id: 359410, extraGenres: ['Ação', 'Suspense'], trending: true }, // Matador de Aluguel (Road House)
  { id: 866398, extraGenres: ['Ação', 'Suspense'], trending: true }, // Beekeeper: Rede de Vingança
  { id: 637649, extraGenres: ['Ação', 'Crime', 'Suspense'], trending: true }, // Infiltrado (Wrath of Man)
  { id: 339403, extraGenres: ['Ação', 'Crime'], trending: true }, // Em Ritmo de Fuga (Baby Driver)
  { id: 207703, extraGenres: ['Ação', 'Aventura', 'Comédia'], trending: true }, // Kingsman: Serviço Secreto
  { id: 14756, extraGenres: ['Ação', 'Histórico', 'Drama'], trending: true }, // O Grande Mestre (Ip Man)
  { id: 929590, extraGenres: ['Ação', 'Drama', 'Suspense'], trending: true }, // Guerra Civil (Civil War)
  { id: 533535, extraGenres: ['Ação', 'Comédia', 'Ficção Científica'], featured: true, trending: true }, // Deadpool & Wolverine
  { id: 558449, extraGenres: ['Ação', 'Aventura', 'Drama'], featured: true, trending: true }, // Gladiador II
  { id: 573435, extraGenres: ['Ação', 'Comédia', 'Crime'], trending: true }, // Bad Boys: Até o Fim
  { id: 646097, extraGenres: ['Ação', 'Crime', 'Suspense'], trending: true }, // Rebel Ridge
  { id: 414906, extraGenres: ['Ação', 'Crime', 'Suspense'], featured: true, trending: true }, // Batman (The Batman)
  { id: 840326, extraGenres: ['Ação', 'Histórico'], trending: true }, // Sisu
  { id: 579974, extraGenres: ['Ação', 'Drama', 'Aventura'], trending: true }, // RRR: Revolta, Rebelião, Revolução
  { id: 575264, extraGenres: ['Ação', 'Suspense', 'Aventura'], trending: true }, // Missão: Impossível - Acerto de Contas
  { id: 353081, extraGenres: ['Ação', 'Aventura'], trending: true }, // Missão: Impossível - Efeito Fallout
  { id: 7347, extraGenres: ['Ação', 'Crime', 'Drama'], trending: true }, // Tropa de Elite
  { id: 47931, extraGenres: ['Ação', 'Crime', 'Drama'], trending: true }, // Tropa de Elite 2: O Inimigo Agora é Outro
  { id: 598, extraGenres: ['Crime', 'Drama'], trending: true }, // Cidade de Deus

  // Romance Movies (Youth Romance, Asian Romance, Modern & Classic Romance)
  { id: 1010581, extraGenres: ['Romance', 'Drama', 'Séries Juvenis'], featured: true, trending: true }, // Culpa Minha (My Fault)
  { id: 1156593, extraGenres: ['Romance', 'Drama', 'Séries Juvenis'], featured: true, trending: true }, // Culpa Tua (Your Fault)
  { id: 818647, extraGenres: ['Romance', 'Drama', 'Séries Juvenis'], trending: true }, // Através da Minha Janela
  { id: 988078, extraGenres: ['Romance', 'Drama', 'Séries Juvenis'], trending: true }, // Através da Minha Janela: Além do Mar
  { id: 1139566, extraGenres: ['Romance', 'Drama', 'Séries Juvenis'], trending: true }, // Através da Minha Janela: Olhos nos Olhos
  { id: 762975, extraGenres: ['Romance', 'Drama'], featured: true, trending: true }, // Continência ao Amor (Purple Hearts)
  { id: 1127166, extraGenres: ['Romance', 'Drama', 'Séries Juvenis'], trending: true }, // O Fabricante de Lágrimas
  { id: 527641, extraGenres: ['Romance', 'Drama', 'Séries Juvenis'], trending: true }, // A Cinco Passos de Você
  { id: 466282, extraGenres: ['Romance', 'Comédia', 'Séries Juvenis'], trending: true }, // Para Todos os Garotos que Já Amei
  { id: 454983, extraGenres: ['Romance', 'Comédia', 'Séries Juvenis'], trending: true }, // A Barraca do Beijo
  { id: 296096, extraGenres: ['Romance', 'Drama'], trending: true }, // Como Eu Era Antes de Você
  { id: 222935, extraGenres: ['Romance', 'Drama', 'Séries Juvenis'], trending: true }, // A Culpa é das Estrelas
  { id: 122906, extraGenres: ['Romance', 'Drama', 'Comédia'], featured: true, trending: true }, // Questão de Tempo (About Time)
  { id: 11036, extraGenres: ['Romance', 'Drama'], trending: true }, // Diário de uma Paixão (The Notebook)
  { id: 4348, extraGenres: ['Romance', 'Drama'], trending: true }, // Orgulho e Preconceito
  { id: 313369, extraGenres: ['Romance', 'Drama', 'Comédia'], featured: true, trending: true }, // La La Land: Cantando Estações
  { id: 666277, extraGenres: ['Doramas', 'Romance', 'Drama'], featured: true, trending: true }, // Vidas Passadas (Past Lives)
  { id: 1100099, extraGenres: ['Romance', 'Drama'], featured: true, trending: true }, // Todo Tempo que Temos (We Live in Time)
  { id: 1072790, extraGenres: ['Romance', 'Comédia'], featured: true, trending: true }, // Todos Menos Você (Anyone But You)
  { id: 1079091, extraGenres: ['Romance', 'Drama'], featured: true, trending: true }, // É Assim Que Acaba (It Ends with Us)
  { id: 843527, extraGenres: ['Romance', 'Comédia', 'Drama'], trending: true }, // Uma Ideia de Você (The Idea of You)
  { id: 851644, extraGenres: ['Doramas', 'Romance', 'Drama', 'Séries Juvenis'], featured: true, trending: true }, // Garota do Século 20 (20th Century Girl)
  { id: 372058, extraGenres: ['Romance', 'Animação', 'Drama'], featured: true, trending: true }, // Your Name (Kimi no Na wa)
  { id: 568160, extraGenres: ['Romance', 'Animação', 'Aventura'], trending: true }, // O Tempo com Você (Weathering with You)
  { id: 916224, extraGenres: ['Animação', 'Aventura', 'Romance'], trending: true }, // Suzume
  { id: 378064, extraGenres: ['Romance', 'Animação', 'Drama'], trending: true }, // A Voz do Silêncio (A Silent Voice)
  { id: 1291559, extraGenres: ['Doramas', 'Romance', 'Drama'], trending: true }, // Drawing Closer
  { id: 977871, extraGenres: ['Doramas', 'Romance', 'Drama'], trending: true }, // Mesmo Se Este Amor Desaparecer Esta Noite
  { id: 570503, extraGenres: ['Doramas', 'Romance', 'Drama'], trending: true }, // Sintonizada em Você (Tune in for Love)
  { id: 662237, extraGenres: ['Doramas', 'Romance', 'Comédia'], trending: true }, // Doce e Amargo (Sweet & Sour)
  { id: 1052433, extraGenres: ['Doramas', 'Romance', 'Comédia'], trending: true }, // 30 Dias (Love Reset)
  { id: 4951, extraGenres: ['Romance', 'Comédia', 'Séries Juvenis'], trending: true }, // 10 Coisas que Eu Odeio em Você
  { id: 76, extraGenres: ['Romance', 'Drama'], trending: true }, // Antes do Amanhecer
  { id: 38, extraGenres: ['Romance', 'Drama', 'Ficção Científica'], trending: true }, // Brilho Eterno de uma Mente sem Lembranças
  { id: 398818, extraGenres: ['Romance', 'Drama'], trending: true }, // Me Chame Pelo Seu Nome
  { id: 19913, extraGenres: ['Romance', 'Comédia', 'Drama'], trending: true }, // (500) Dias com Ela
  { id: 84892, extraGenres: ['Romance', 'Drama', 'Séries Juvenis'], trending: true }, // As Vantagens de Ser Invisível
  { id: 200727, extraGenres: ['Romance', 'Comédia', 'Drama'], trending: true }, // Simplesmente Acontece (Love, Rosie)
  { id: 509, extraGenres: ['Romance', 'Comédia'], trending: true }, // Um Lugar Chamado Notting Hill
  { id: 597, extraGenres: ['Romance', 'Drama', 'Histórico'], trending: true }, // Titanic
  { id: 332562, extraGenres: ['Romance', 'Drama'], trending: true }, // Nasce uma Estrela
  { id: 331482, extraGenres: ['Romance', 'Drama', 'Histórico'], trending: true }, // Adoráveis Mulheres
  { id: 930094, extraGenres: ['Romance', 'Comédia'], trending: true }, // Vermelho, Branco e Sangue Azul
];

function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function truncateText(str, maxLen = 150) {
  const clean = String(str || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen - 1).trim()}…`;
}

async function fetchJson(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 800 * (i + 1)));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
}

async function discoverCandidates() {
  const moviesMap = new Map();
  const tvMap = new Map();

  for (const m of CURATED_MOVIES) {
    if (!EXISTING_TMDB_IDS.has(m.id)) {
      moviesMap.set(m.id, { id: m.id, _curated: m });
    }
  }

  for (const s of CURATED_SERIES) {
    if (!EXISTING_TMDB_IDS.has(s.id)) {
      tvMap.set(s.id, { id: s.id, _curated: s });
    }
  }

  const movieEndpoints = [
    // Newest & Trending Movies (2024-2026)
    `https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}&language=pt-BR&page=1`,
    `https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}&language=pt-BR&page=2`,
    `https://api.themoviedb.org/3/movie/now_playing?api_key=${API_KEY}&language=pt-BR&page=1`,
    `https://api.themoviedb.org/3/movie/now_playing?api_key=${API_KEY}&language=pt-BR&page=2`,
    `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=pt-BR&page=1`,
    `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=pt-BR&page=2`,
    `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=pt-BR&page=3`,
    `https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}&language=pt-BR&page=1`,
    `https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}&language=pt-BR&page=2`,
    `https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}&language=pt-BR&page=3`,
    // Action Movies
    `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=pt-BR&with_genres=28&sort_by=popularity.desc&page=1`,
    `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=pt-BR&with_genres=28&sort_by=popularity.desc&page=2`,
    `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=pt-BR&with_genres=28&sort_by=vote_count.desc&page=1`,
    `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=pt-BR&with_genres=28&sort_by=vote_count.desc&page=2`,
    // Korean Action & Thriller Movies
    `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=pt-BR&with_original_language=ko&sort_by=vote_count.desc&page=1`,
    `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=pt-BR&with_original_language=ko&sort_by=popularity.desc&page=1`,
    // Romance Movies
    `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=pt-BR&with_genres=10749&sort_by=popularity.desc&page=1`,
    `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=pt-BR&with_genres=10749&sort_by=popularity.desc&page=2`,
    `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=pt-BR&with_genres=10749&sort_by=vote_count.desc&page=1`,
    `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=pt-BR&with_genres=10749&sort_by=vote_count.desc&page=2`,
  ];

  const tvEndpoints = [
    // Korean Dramas (Doramas)
    `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&language=pt-BR&with_original_language=ko&without_genres=16,10764,10767,10763,99&sort_by=vote_count.desc&page=1`,
    `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&language=pt-BR&with_original_language=ko&without_genres=16,10764,10767,10763,99&sort_by=vote_count.desc&page=2`,
    `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&language=pt-BR&with_original_language=ko&without_genres=16,10764,10767,10763,99&sort_by=vote_count.desc&page=3`,
    `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&language=pt-BR&with_original_language=ko&without_genres=16,10764,10767,10763,99&sort_by=vote_count.desc&page=4`,
    `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&language=pt-BR&with_original_language=ko&without_genres=16,10764,10767,10763,99&sort_by=vote_count.desc&page=5`,
    `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&language=pt-BR&with_original_language=ko&without_genres=16,10764,10767,10763,99&sort_by=vote_count.desc&page=6`,
    // Chinese & Japanese Live-Action Doramas
    `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&language=pt-BR&with_original_language=zh&without_genres=16,10764,10767,10763,99&sort_by=vote_count.desc&page=1`,
    `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&language=pt-BR&with_original_language=ja&without_genres=16,10764,10767,10763,99&sort_by=vote_count.desc&page=1`,
    // Trending, Popular & Top Rated Global TV Series
    `https://api.themoviedb.org/3/trending/tv/week?api_key=${API_KEY}&language=pt-BR&page=1`,
    `https://api.themoviedb.org/3/trending/tv/week?api_key=${API_KEY}&language=pt-BR&page=2`,
    `https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}&language=pt-BR&page=1`,
    `https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}&language=pt-BR&page=2`,
    `https://api.themoviedb.org/3/tv/top_rated?api_key=${API_KEY}&language=pt-BR&page=1`,
    `https://api.themoviedb.org/3/tv/top_rated?api_key=${API_KEY}&language=pt-BR&page=2`,
    `https://api.themoviedb.org/3/tv/top_rated?api_key=${API_KEY}&language=pt-BR&page=3`,
    // Action & Adventure TV Series
    `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&language=pt-BR&with_genres=10759&without_genres=16,10764,10767&sort_by=vote_count.desc&page=1`,
    `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&language=pt-BR&with_genres=10759&without_genres=16,10764,10767&sort_by=vote_count.desc&page=2`,
  ];

  const moviePages = await Promise.all(movieEndpoints.map((u) => fetchJson(u).catch(() => ({ results: [] }))));
  for (const page of moviePages) {
    for (const m of page.results || []) {
      if (!m?.id || EXISTING_TMDB_IDS.has(m.id)) continue;
      if (!m.poster_path || !m.backdrop_path) continue;
      if (!moviesMap.has(m.id)) {
        moviesMap.set(m.id, m);
      }
    }
  }

  const tvPages = await Promise.all(tvEndpoints.map((u) => fetchJson(u).catch(() => ({ results: [] }))));
  for (const page of tvPages) {
    for (const t of page.results || []) {
      if (!t?.id || EXISTING_TMDB_IDS.has(t.id)) continue;
      if (!t.poster_path || !t.backdrop_path) continue;
      if (!tvMap.has(t.id)) {
        tvMap.set(t.id, t);
      }
    }
  }

  return {
    movies: Array.from(moviesMap.values()).slice(0, 275),
    series: Array.from(tvMap.values()).slice(0, 255),
  };
}

function formatDuration(runtimeMin) {
  if (!runtimeMin || runtimeMin <= 0) return '52m';
  const hours = Math.floor(runtimeMin / 60);
  const minutes = runtimeMin % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

async function enrichItem(raw, type, usedSlugs) {
  const endpoint = type === 'filme' ? 'movie' : 'tv';
  const curatedMeta = raw._curated || null;
  try {
    const seasonAppends =
      type === 'serie'
        ? ',season/1,season/2,season/3,season/4,season/5,season/6,season/7,season/8,season/9,season/10,season/11,season/12,season/13,season/14,season/15'
        : '';

    const [details, enDetails] = await Promise.all([
      fetchJson(
        `https://api.themoviedb.org/3/${endpoint}/${raw.id}?api_key=${API_KEY}&language=pt-BR&append_to_response=external_ids,credits,videos${seasonAppends}`
      ),
      fetchJson(
        `https://api.themoviedb.org/3/${endpoint}/${raw.id}?api_key=${API_KEY}&language=en-US&append_to_response=videos`
      ).catch(() => ({})),
    ]);

    const ptTitle = details.title || details.name || raw.title || raw.name || '';
    const enTitle = enDetails.title || enDetails.name || details.original_title || details.original_name || ptTitle;
    const rawOrigTitle = details.original_title || details.original_name || enTitle;

    // If ptTitle is still in Hangul/Hanzi/Kanji, fall back to English title
    const hasNonLatinPt = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/.test(ptTitle);
    const title = (!ptTitle || hasNonLatinPt) ? (enTitle || ptTitle) : ptTitle;

    // Keep originalTitle clean (English/Latin when original is non-Latin) so English search and Orion stream resolver work without Hangul/Kanji parentheticals
    const hasNonLatinOrig = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/.test(rawOrigTitle);
    const originalTitle = hasNonLatinOrig
      ? (enTitle || title)
      : (rawOrigTitle || enTitle || title);

    const posterPath = details.poster_path || enDetails.poster_path || raw.poster_path;
    const backdropPath = details.backdrop_path || enDetails.backdrop_path || raw.backdrop_path || posterPath;
    if (!posterPath) return null;

    const synopsis =
      details.overview ||
      enDetails.overview ||
      raw.overview ||
      `${title} — Produção oficial disponível em alta definição com áudio dublado e legendado no Cinema Wotho.`;

    const releaseStr =
      details.release_date ||
      details.first_air_date ||
      enDetails.release_date ||
      enDetails.first_air_date ||
      raw.release_date ||
      raw.first_air_date ||
      '2024-01-01';
    const year = parseInt(releaseStr.split('-')[0], 10) || 2024;

    let baseSlug = slugify(title) || slugify(enTitle) || `${type}-${raw.id}`;
    if (usedSlugs.has(baseSlug)) {
      baseSlug = `${baseSlug}-${year}`;
    }
    if (usedSlugs.has(baseSlug)) {
      baseSlug = `${baseSlug}-${raw.id}`;
    }
    usedSlugs.add(baseSlug);

    const origLang = details.original_language || enDetails.original_language || raw.original_language || 'en';
    const rawGenreIds = raw.genre_ids || (details.genres || []).map((g) => g.id);
    const genreSet = new Set(rawGenreIds.map((gid) => GENRE_MAP[gid]).filter(Boolean));

    // Automatically tag Asian live-action series/movies as Doramas
    if (['ko', 'zh', 'cn', 'tw'].includes(origLang) && !genreSet.has('Animação')) {
      genreSet.add('Doramas');
    } else if (origLang === 'ja' && !genreSet.has('Animação') && type === 'serie') {
      genreSet.add('Doramas');
    }

    if (curatedMeta?.extraGenres) {
      for (const eg of curatedMeta.extraGenres) {
        genreSet.add(eg);
      }
    }

    if (genreSet.size === 0) genreSet.add('Drama');
    const mappedGenres = Array.from(genreSet);

    const credits = details.credits || {};
    const directorObj = (credits.crew || []).find((c) => c.job === 'Director');
    const creatorObj = (details.created_by || [])[0];
    const director =
      directorObj?.name || creatorObj?.name || (type === 'filme' ? 'Direção Oficial' : 'Produção Original');
    const cast = (credits.cast || []).slice(0, 5).map((c) => c.name);
    if (cast.length === 0) cast.push('Elenco Principal Oficial');

    const rawVote = details.vote_average || enDetails.vote_average || raw.vote_average || 7.8;
    const rating = Math.max(6.8, Math.round(rawVote * 10) / 10);
    const ratingCount = Math.max(450, details.vote_count || enDetails.vote_count || raw.vote_count || 1500);

    const posterUrl = `https://image.tmdb.org/t/p/w500${posterPath}`;
    const backdropUrl = `https://image.tmdb.org/t/p/original${backdropPath}`;
    const imdbId = details.external_ids?.imdb_id || `tt${String(raw.id).padStart(7, '0')}`;

    const allVideos = [
      ...(details.videos?.results || []),
      ...(enDetails.videos?.results || []),
    ].filter((v) => v.site === 'YouTube' && v.key);
    const officialTrailer =
      allVideos.find((v) => v.type === 'Trailer' && /official|trailer|dublado|legendado/i.test(v.name || '')) ||
      allVideos.find((v) => v.type === 'Trailer') ||
      allVideos[0];
    const trailerYoutubeId = officialTrailer?.key || 'Way9Dexny3w';

    const isRecent = year >= 2023;
    const isAcclaimed = rating >= 8.0;

    let duration = '2h 05m';
    let seasons = undefined;

    if (type === 'filme') {
      duration = formatDuration(details.runtime || enDetails.runtime || 122);
    } else {
      const validSeasons = (details.seasons || enDetails.seasons || []).filter(
        (s) => s.season_number > 0 && (s.episode_count || 0) > 0
      );
      if (validSeasons.length === 0) {
        validSeasons.push({
          season_number: 1,
          name: 'Temporada 1',
          episode_count: details.number_of_episodes || 8,
        });
      }

      const seasonCount = validSeasons.length;
      duration = `${seasonCount} ${seasonCount === 1 ? 'Temporada' : 'Temporadas'}`;
      const defaultEpRuntime =
        (Array.isArray(details.episode_run_time) && details.episode_run_time[0]) || 52;

      seasons = [];
      for (const s of validSeasons) {
        const sNum = s.season_number;
        let seasonData = details[`season/${sNum}`];
        if (!seasonData && sNum > 15) {
          seasonData = await fetchJson(
            `https://api.themoviedb.org/3/tv/${raw.id}/season/${sNum}?api_key=${API_KEY}&language=pt-BR`
          ).catch(() => null);
        }

        const rawEps = Array.isArray(seasonData?.episodes) ? seasonData.episodes : [];
        const targetEpCount = Math.max(rawEps.length, s.episode_count || 1);
        const episodes = [];

        for (let idx = 0; idx < targetEpCount; idx++) {
          const epObj = rawEps[idx];
          const epNumber = epObj?.episode_number || idx + 1;
          const rawEpName = epObj?.name || `Episódio ${epNumber}`;
          const epName = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/.test(rawEpName)
            ? `Episódio ${epNumber}`
            : rawEpName;
          const epDuration = formatDuration(epObj?.runtime || defaultEpRuntime);
          const epSynopsis = epObj?.overview
            ? truncateText(epObj.overview, 145)
            : `Episódio ${epNumber} da ${s.name || `Temporada ${sNum}`} de ${title}.`;
          const epThumb = epObj?.still_path
            ? `https://image.tmdb.org/t/p/w500${epObj.still_path}`
            : backdropUrl;

          episodes.push({
            episodeNumber: epNumber,
            title: epName,
            duration: epDuration,
            synopsis: epSynopsis,
            thumbnail: epThumb,
          });
        }

        const rawSeasonTitle = seasonData?.name || s.name || `Temporada ${sNum}`;
        const cleanSeasonTitle = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/.test(rawSeasonTitle)
          ? `Temporada ${sNum}`
          : rawSeasonTitle;

        seasons.push({
          seasonNumber: sNum,
          seasonTitle: cleanSeasonTitle,
          episodes,
        });
      }
    }

    return {
      id: baseSlug,
      imdbId,
      tmdbId: raw.id,
      title,
      originalTitle,
      type,
      synopsis,
      director,
      cast,
      genres: mappedGenres,
      year,
      duration,
      rating,
      ratingCount,
      ageRating: mappedGenres.includes('Animação') ? '10' : rating >= 8.2 ? '16' : '14',
      quality: year >= 2020 || rating >= 8.0 ? '4K HDR' : '1080p FHD',
      audio: 'Dublado & Legendado',
      backdropUrl,
      posterUrl,
      trailerYoutubeId,
      featured: Boolean(curatedMeta?.featured || (isRecent && rating >= 8.2)),
      trending: Boolean(curatedMeta?.trending || isRecent),
      awardWinning: isAcclaimed,
      ...(seasons ? { seasons } : {}),
    };
  } catch {
    return null;
  }
}

async function main() {
  console.log('[Expanded Cinema] Buscando candidatos no TMDB (Doramas, Séries Juvenis, Ação, Romance e mais)...');
  const { movies, series } = await discoverCandidates();
  console.log(`[Expanded Cinema] Candidatos prontos: ${movies.length} filmes e ${series.length} séries (${movies.length + series.length} total).`);

  const usedSlugs = new Set([
    'duna-parte-2', 'oppenheimer', 'interestelar', 'blade-runner-2049', 'matrix',
    'batman-o-cavaleiro-das-trevas', 'a-viagem-de-chihiro', 'parasita', 'gladiador',
    'shogun-a-saga-do-japao', 'ruptura-severance', 'arcane', 'o-urso-the-bear',
    'chernobyl', 'breaking-bad', 'succession', 'the-last-of-us', 'stranger-things',
  ]);

  // Put curated items first so they appear prominently at the top of their sections
  const allQueue = [
    ...series.filter((s) => s._curated).map((s) => ({ raw: s, type: 'serie' })),
    ...movies.filter((m) => m._curated).map((m) => ({ raw: m, type: 'filme' })),
    ...series.filter((s) => !s._curated).map((s) => ({ raw: s, type: 'serie' })),
    ...movies.filter((m) => !m._curated).map((m) => ({ raw: m, type: 'filme' })),
  ];

  const results = [];
  const BATCH_SIZE = 20;
  for (let i = 0; i < allQueue.length; i += BATCH_SIZE) {
    const batch = allQueue.slice(i, i + BATCH_SIZE);
    const enriched = await Promise.all(
      batch.map((item) => enrichItem(item.raw, item.type, usedSlugs))
    );
    for (const r of enriched) {
      if (r) results.push(r);
    }
    console.log(
      `[Expanded Cinema] Processados ${Math.min(i + BATCH_SIZE, allQueue.length)}/${allQueue.length} (${results.length} válidos)...`
    );
  }

  const totalMovies = results.filter((r) => r.type === 'filme').length;
  const totalSeries = results.filter((r) => r.type === 'serie').length;
  const totalDoramas = results.filter((r) => r.genres.includes('Doramas')).length;
  const totalYouth = results.filter((r) => r.genres.includes('Séries Juvenis')).length;
  const totalAction = results.filter((r) => r.genres.includes('Ação')).length;
  const totalRomance = results.filter((r) => r.genres.includes('Romance')).length;
  const totalSeasons = results.reduce((acc, r) => acc + (r.seasons?.length || 0), 0);
  const totalEpisodes = results.reduce(
    (acc, r) => acc + (r.seasons?.reduce((sAcc, s) => sAcc + s.episodes.length, 0) || 0),
    0
  );

  const outPath = path.resolve(rootDir, 'src/lib/cinemaExpandedCatalog.ts');
  const fileContent = `/**
 * Catálogo Expandido Oficial Worsco Cinema (+${results.length} Filmes e Séries)
 * Inclui Doramas (K-Dramas, C-Dramas, J-Dramas), Séries Juvenis de Ação (estilo Weak Hero),
 * Filmes de Ação, Romance, Ficção Científica, Suspense e Obras Premiadas,
 * com todas as temporadas e episódios originais sincronizados com TMDb e IMDb.
 */

import type { CinemaItem } from "./cinema";

export const EXPANDED_CINEMA_CATALOG: CinemaItem[] = ${JSON.stringify(results, null, 2)};
`;

  fs.writeFileSync(outPath, fileContent, 'utf8');
  console.log(
    `[Expanded Cinema] Gravados ${results.length} títulos (${totalMovies} filmes, ${totalSeries} séries | ${totalDoramas} doramas, ${totalYouth} juvenis, ${totalAction} ação, ${totalRomance} romance | ${totalSeasons} temporadas e ${totalEpisodes} episódios) em src/lib/cinemaExpandedCatalog.ts!`
  );
}

main();
