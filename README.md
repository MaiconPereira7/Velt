[README (2).md](https://github.com/user-attachments/files/29728258/README.2.md)
# Velt

![Angular](https://img.shields.io/badge/Angular-19-DD0031?logo=angular&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black)
![Groq](https://img.shields.io/badge/Groq-Llama_3.3-F55036?logo=groq&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

🇧🇷 Português | [🇺🇸 English](README.en.md)

> **🔗 Live:** [velt-tan.vercel.app](https://velt-tan.vercel.app)

Plataforma de gestão financeira pessoal com carteira de criptomoedas e inteligência artificial — acompanhe seu patrimônio, controle entradas e saídas, e converse com uma IA que conhece seus dados financeiros de verdade.

## Sobre o projeto

Velt é um projeto full-stack construído para praticar e demonstrar arquitetura de software de verdade, não só "fazer funcionar". Alguns pontos que valem destacar tecnicamente:

- **Clean Architecture no backend** — controllers não conhecem Firestore, e use cases não conhecem Express. A camada de domínio (`domain/`) define contratos de repositório; a implementação concreta (`infra/firestore/`) fica isolada e é trocável sem tocar em regra de negócio. Um `container.ts` funciona como composition root, deixando explícito onde as peças se conectam.
- **Providers de IA intercambiáveis** — a interface `AiProvider` define o contrato; existem implementações para Groq (Llama 3.3 70B), OpenAI (GPT-4o mini) e Gemini (2.0 Flash). O `container.ts` detecta automaticamente qual API key está disponível e injeta o provider correto, com fallback para análise determinística (sem custo, sem chamada externa). Trocar de IA é mudar uma variável de ambiente, não uma linha de código.
- **Validação e segurança de ponta a ponta** — schemas Zod validam todo body de entrada, erros de domínio viram `AppError` com status HTTP correto (400/401/409) capturados por um error handler central, e rotas de autenticação têm rate limiting contra força bruta.
- **Frontend reativo com Angular moderno** — componentes standalone, signals para estado local e `computed` para valores derivados, guards funcionais para rotas protegidas, e configuração de ambiente (`environment.ts`/`environment.prod.ts`) para builds de produção.
- **Separação de contratos** — o modelo de dados do frontend (`core/models`) e o `AuthResponse`/`JwtPayload` do backend são definidos e mantidos em sincronia deliberadamente, mesmo sendo dois projetos TypeScript independentes.

## Funcionalidades

- Cadastro e login com autenticação JWT
- **Dashboard** — visão geral do patrimônio (cripto + saldo em conta), P&L, transações recentes
- **Carteira** — cadastro de ativos cripto (BTC, ETH, SOL, etc.) com cotação ao vivo via CoinGecko
- **Finanças** — controle de entradas e saídas, categorização de gastos, taxa de poupança
- **Velt AI** — chat com inteligência artificial que analisa seus dados financeiros reais (portfólio, gastos, volatilidade) e responde perguntas livres. Não é um chatbot genérico — é um assistente que conhece seus números
- **Insights** — análises automáticas de diversificação, gastos e volatilidade (com ou sem IA)
- **Perfil** — dados da conta e resumo consolidado

## Stack

| Camada | Tecnologia |
|---|---|
| **Frontend** | Angular 19 (standalone components, signals), SCSS |
| **Backend** | Node.js + Express + TypeScript, Clean Architecture |
| **Banco de dados** | Firebase Firestore |
| **IA** | Groq (Llama 3.3 70B) · OpenAI (GPT-4o mini) · Gemini (2.0 Flash) |
| **Autenticação** | JWT (`jsonwebtoken`) |
| **Validação** | Zod |
| **Cotação de cripto** | CoinGecko API (com cache e fallback) |
| **Deploy** | Render (API) + Vercel (frontend) |

## Arquitetura da IA

```
Usuário digita pergunta no chat
        ↓
Frontend POST /insights/chat { question }
        ↓
Backend busca ativos + transações + preços do usuário
        ↓
Monta contexto financeiro (portfólio com P&L, gastos por categoria, taxa de poupança)
        ↓
Envia pro provider ativo (Groq/OpenAI/Gemini) com system prompt financeiro
        ↓
Resposta renderizada no chat
```

O sistema seleciona o provider automaticamente por prioridade: **Groq → OpenAI → Gemini → Determinístico**. Se nenhuma API key estiver configurada, os insights funcionam via regras determinísticas (sem custo).

## Estrutura do projeto

```
Velt/
├── server/                 # API REST (Express + TypeScript + Firestore)
│   └── src/
│       ├── controllers/    # Camada HTTP
│       ├── useCases/       # Regras de negócio
│       │   ├── auth/       # Login, registro
│       │   ├── crypto/     # CRUD de ativos
│       │   ├── finance/    # CRUD de transações
│       │   └── insights/   # Análise e chat com IA
│       ├── services/       # Providers de IA (Groq, OpenAI, Gemini), preços, insights
│       ├── domain/         # Entidades e contratos de repositório
│       ├── infra/firestore/# Implementação concreta dos repositórios
│       ├── validators/     # Schemas Zod
│       └── utils/          # JWT, hash, error handling, rate limit
└── web/                    # Frontend (Angular 19)
    └── src/app/
        ├── core/           # Services, guards, interceptors, config, models
        ├── pages/          # Dashboard, carteira, finanças, insights, perfil, auth
        └── shared/         # Componentes e pipes reutilizáveis
```

## Como rodar

### Pré-requisitos

- Node.js 20+
- Um projeto Firebase com Firestore habilitado e uma chave de conta de serviço

### Backend

```bash
cd server
npm install
cp .env.example .env   # preencha com seus valores (veja abaixo)
npm run dev
```

O servidor sobe em `http://localhost:3333`.

### Variáveis de ambiente (`server/.env`)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `JWT_SECRET` | ✅ | Chave secreta para tokens JWT |
| `PORT` | | Porta do servidor (padrão `3333`) |
| `CORS_ORIGIN` | | Origem(ns) permitida(s) pelo CORS, separadas por vírgula. Use `*` para aceitar qualquer origem |
| `FIREBASE_PROJECT_ID` | ✅ | ID do projeto no Firebase |
| `FIREBASE_CLIENT_EMAIL` | ✅ | E-mail da conta de serviço |
| `FIREBASE_PRIVATE_KEY` | ✅ | Chave privada da conta de serviço (com `\n` escapados) |
| `GROQ_API_KEY` | | Chave da API Groq — [console.groq.com/keys](https://console.groq.com/keys) |
| `GROQ_MODEL` | | Modelo Groq (padrão: `llama-3.3-70b-versatile`) |
| `OPENAI_API_KEY` | | Chave da API OpenAI |
| `OPENAI_MODEL` | | Modelo OpenAI (padrão: `gpt-4o-mini`) |
| `GEMINI_API_KEY` | | Chave da API Gemini — [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `GEMINI_MODEL` | | Modelo Gemini (padrão: `gemini-2.0-flash`) |

> As variáveis de IA são opcionais. Sem nenhuma delas, os insights funcionam no modo determinístico (sem custo). Prioridade: Groq → OpenAI → Gemini → Determinístico.

### Frontend

```bash
cd web
npm install
npm start
```

A aplicação sobe em `http://localhost:4200`.

## Deploy

O projeto está em produção usando:

| Serviço | Função | URL |
|---|---|---|
| **Render** (free tier) | API REST | `https://velt-bc7a.onrender.com` |
| **Vercel** | Frontend Angular | [velt-tan.vercel.app](https://velt-tan.vercel.app) |

> **Nota:** o free tier do Render suspende a instância após 15min de inatividade. A primeira requisição pode levar ~30s para o servidor acordar.

## Dados de exemplo para testar

Após criar sua conta, experimente cadastrar:

**Carteira:**
- 0.05 BTC a R$ 300.000,00 (preço médio)
- 2.5 ETH a R$ 14.000,00
- 500 ADA a R$ 3,50
- 100 SOL a R$ 800,00

**Finanças:**
- Entrada: Salário, R$ 8.000,00
- Saída: Aluguel (Moradia), R$ 2.500,00
- Saída: Supermercado (Alimentação), R$ 1.200,00
- Saída: Uber (Transporte), R$ 350,00

**Perguntas para o Velt AI:**
- "Analise minha diversificação de carteira"
- "Como estão meus gastos este mês?"
- "Minha carteira está muito concentrada em um ativo?"
- "Me dá uma estratégia de DCA pra esse mês"

## Testes

```bash
cd server && npm test              # testes unitários (Vitest)
cd server && npx tsc --noEmit      # verificação de tipos
cd web && npx tsc --noEmit -p tsconfig.app.json
```

## Licença

MIT — veja [LICENSE](LICENSE).
