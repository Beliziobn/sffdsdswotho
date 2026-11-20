import LegalLayout from "@/components/legal/LegalLayout";

const Terms = () => (
  <LegalLayout title="Termos e Condições de Uso" updatedAt="20 de novembro de 2026">
    <p>
      Bem-vindo à <strong>Wotho</strong> (acessível em{" "}
      <a href="https://wotho.vercel.app" className="underline">
        https://wotho.vercel.app
      </a>
      ). Estes Termos e Condições de Uso regulam o acesso e a utilização da nossa plataforma digital de
      leitura de livros no navegador, artigos científicos, conteúdos curriculares e preparatórios para o
      ENEM, portal de notícias globais, webtoons e catálogo cultural. Ao navegar ou utilizar qualquer
      funcionalidade da Wotho, o utilizador declara ter lido, compreendido e aceite integralmente estes
      Termos.
    </p>

    <h2>1. Objeto e Acesso à Plataforma</h2>
    <p>
      A Wotho disponibiliza um ambiente digital de leitura, jornalismo informativo e curadoria cultural
      acessível diretamente pelo navegador web. A grande maioria do nosso acervo literário, jornalístico e
      educativo é de acesso público e gratuito, sem obrigatoriedade de criação de conta ou subscrição paga
      para consulta das obras e reportagens.
    </p>

    <h2>2. Propriedade Intelectual e Direitos Autorais</h2>
    <ul>
      <li>
        <strong>Obras em Domínio Público e Licenças Abertas:</strong> Os clássicos da literatura universal e
        luso-brasileira disponibilizados na biblioteca provêm de acervos oficiais de domínio público (como o
        Project Gutenberg, Biblioteca Nacional e Archive.org) ou possuem autorização editorial expressa.
      </li>
      <li>
        <strong>Conteúdo Editorial Original:</strong> As análises críticas, sínteses de capítulos, artigos
        científicos comentados, guias de estudo para o ENEM, reportagens jornalísticas, design de interface e
        código-fonte da plataforma são propriedade intelectual da Wotho ou dos seus respetivos autores e
        estão protegidos pelas leis de direitos autorais aplicáveis.
      </li>
      <li>
        <strong>Direitos de Terceiros (DMCA / Remoção de Conteúdo):</strong> Respeitamos rigorosamente a
        propriedade intelectual de terceiros. Caso qualquer autor, editora ou detentor de direitos identifique
        conteúdo que considere violar direitos autorais, pode solicitar a revisão ou remoção imediata através
        do e-mail{" "}
        <a href="mailto:contato@wotho.vercel.app" className="underline">
          contato@wotho.vercel.app
        </a>
        .
      </li>
    </ul>

    <h2>3. Cadastro e Responsabilidades do Utilizador</h2>
    <p>
      Quando o utilizador opta por criar uma conta pessoal na Wotho, compromete-se a fornecer informações
      verdadeiras e atualizadas, bem como a zelar pela confidencialidade da sua palavra-passe. O utilizador
      é o único responsável pelas atividades realizadas na sua conta e deve comunicar imediatamente qualquer
      suspeita de utilização não autorizada.
    </p>

    <h2>4. Conduta Permitida e Vedações</h2>
    <p>Ao utilizar a Wotho, o utilizador compromete-se a não praticar qualquer ato que viole a lei ou a estabilidade técnica do serviço, sendo expressamente proibido:</p>
    <ul>
      <li>
        Utilizar robôs automatizados, scripts de extração em massa (scraping) ou ferramentas que sobrecarreguem
        a infraestrutura da plataforma.
      </li>
      <li>
        Gerar cliques artificiais, impressões fraudulentas ou qualquer forma de tráfego inválido nos espaços
        publicitários exibidos no site (em estrita conformidade com as políticas do Google AdSense).
      </li>
      <li>
        Tentar contornar sistemas de segurança, autenticação ou distribuir código malicioso.
      </li>
      <li>
        Publicar comentários, avaliações ou conteúdos ilícitos, difamatórios, discriminatórios ou que violem
        direitos de terceiros.
      </li>
    </ul>

    <h2>5. Publicidade e Links para Sites de Terceiros</h2>
    <p>
      A Wotho pode exibir anúncios publicitários geridos por parceiros certificados, como o{" "}
      <strong>Google AdSense</strong>, além de conter referências e hiperligações para fontes jornalísticas e
      bibliográficas externas. A exibição de publicidade é sempre claramente identificada e separada do
      conteúdo editorial, cumprindo os padrões <em>Better Ads Standards</em>. A Wotho não se responsabiliza
      pelas práticas de privacidade ou conteúdos de sites externos pertencentes a terceiros.
    </p>

    <h2>6. Privacidade e Proteção de Dados</h2>
    <p>
      O tratamento de dados pessoais e a utilização de cookies regem-se pela nossa{" "}
      <a href="/privacidade" className="underline">
        Política de Privacidade e Cookies (/privacidade)
      </a>
      , que constitui parte integrante destes Termos de Uso.
    </p>

    <h2>7. Disponibilidade do Serviço e Alterações</h2>
    <p>
      Empenhamo-nos em manter a plataforma disponível de forma contínua e segura, mas não garantimos a
      ausência absoluta de interrupções técnicas decorrentes de manutenção ou fatores externos. A Wotho
      reserva-se o direito de atualizar estes Termos de Uso periodicamente para refletir melhorias no serviço
      ou alterações legislativas, indicando sempre a data da última atualização no topo desta página.
    </p>

    <h2>8. Atendimento e Contacto</h2>
    <p>
      Para esclarecer quaisquer dúvidas sobre estes Termos de Uso, envie uma mensagem através da nossa página
      de{" "}
      <a href="/contato" className="underline">
        Contato (/contato)
      </a>{" "}
      ou para o e-mail{" "}
      <a href="mailto:contato@wotho.vercel.app" className="underline">
        contato@wotho.vercel.app
      </a>
      .
    </p>
  </LegalLayout>
);

export default Terms;
