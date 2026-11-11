# Wotho — Plataforma de Cultura, Livros, Notícias e Streaming

> **URL Oficial**: [https://wotho.vercel.app](https://wotho.vercel.app)  
> **Descrição**: Livros, notícias globais, streaming e webtoons, com um espaço para acompanhar as últimas novidades sobre cultura, literatura e grandes ideias.

---

## 🌟 Sobre a Wotho

A **Wotho** é uma plataforma digital brasileira integrada que conecta leitura, entretenimento cinematográfico e jornalismo crítico em um ambiente de alta fidelidade visual, com arquitetura Mobile-First, PWA e proteção rigorosa anti-redirecionamento.

### 📚 Seções Principais

1. **Livros Digitais**:
   - Leitor imersivo no navegador com suporte a texto integral e PDFs originais.
   - Bestsellers modernos canônicos (*Hábitos Atômicos*, *A Psicologia Financeira*, *Pai Rico, Pai Pobre*, *1984*, *O Homem Mais Rico da Babilônia*, etc.).
   - Acervo curricular completo para o ENEM e artigos científicos revisados por pares.

2. **Cinema & Séries**:
   - Acervo com mais de 200 produções consagradas do cinema mundial e séries completas.
   - Player unificado 1080p FHD com **Áudio Oficial Dublado em Português (PT-BR)** e opção de áudio original com legendas em português.
   - Proxy nativo com suporte a HTTP Range (206 Partial Content) e isolamento Sandbox contra abas intrusivas e pop-ups.

3. **Portal de Animes & Mangás**:
   - Catálogo com mais de 39 animes consagrados (*Solo Leveling*, *Sousou no Frieren*, *Demon Slayer*, *Jujutsu Kaisen*, *Chainsaw Man*, *Attack on Titan*, etc.).
   - Reprodução nativa HLS com episódios dublados em português (PT-BR) e legendados.
   - Leitor de mangás integrado aos episódios.

4. **Webtoons & Comics**:
   - Leitura vertical contínua em formato scroll de alta resolução.
   - Histórias populares de ação, fantasia e romance.

5. **Portal de Notícias Globais**:
   - Feed jornalístico atualizado em tempo real com categorias dedicadas: Cultura, Futebol, Mercado/Negócios, Tecnologia e Entretenimento.
   - Artigos opinativos, reportagens investigativas e persistência local.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Framer Motion.
- **Player & Streaming**: Hls.js, HTML5 Native Media API, proxies seguros com sanitização de cabeçalhos.
- **Backend & APIs**: Node.js, Express via middleware Vite, TMDb API, Vidstuck Orion multi-audio stream resolver.
- **Banco de Dados & Autenticação**: Firebase Firestore & Firebase Auth.
- **SEO & Descoberta**: OpenGraph tags, Twitter Cards, Schema.org (JSON-LD), Robots.txt e Sitemap.xml canônico.

---

## 🔍 SEO & Metadados

- **Domínio Canônico**: `https://wotho.vercel.app/`
- **Sitemap**: [https://wotho.vercel.app/sitemap.xml](https://wotho.vercel.app/sitemap.xml) (mais de 1.100 URLs canônicas indexadas)
- **Robots.txt**: [https://wotho.vercel.app/robots.txt](https://wotho.vercel.app/robots.txt)
- **OpenGraph & Twitter Cards**: Configurados para geração de cards ricos em redes sociais (WhatsApp, X/Twitter, Discord, Facebook, Slack, Telegram).
- **Schema.org**: `WebSite`, `Organization`, `WebApplication` e `ItemList` integrados.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js 18+ ou 20+
- npm ou bun

### Instalação

```bash
# Clone o repositório
git clone https://github.com/Beliziobn/wesrt.git

# Acesse o diretório
cd wesrt

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

O aplicativo estará disponível em `http://localhost:3000`.

### Build de Produção

```bash
npm run build
```

---

## 📄 Licença

&copy; 2026 **Wotho**. Todos os direitos reservados.
