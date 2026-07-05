# Velt

![Angular](https://img.shields.io/badge/Angular-19-DD0031?logo=angular&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

🇧🇷 Português | [🇺🇸 English](README.en.md)

Plataforma de gestão financeira pessoal com carteira de criptomoedas — acompanhe seu patrimônio, controle entradas e saídas, e receba insights automáticos sobre seus hábitos financeiros.

## Sobre o projeto

Velt é um projeto full-stack construído para praticar e demonstrar arquitetura de software de verdade, não só "fazer funcionar". Alguns pontos que valem destacar tecnicamente:

- **Clean Architecture no backend** — controllers não conhecem Firestore, e use cases não conhecem Express. A camada de domínio (`domain/`) define contratos de repositório; a implementação concreta (`infra/firestore/`) fica isolada e é trocável sem tocar em regra de negócio. Um `container.ts` funciona como composition root, deixando explícito onde as peças se conectam.
- **Validação e segurança de ponta a ponta** — schemas Zod validam todo body de entrada, erros de domínio viram `AppError` com status HTTP correto (400/401/409) capturados por um error handler central, e rotas de autenticação têm rate limiting contra força bruta.
- **Frontend reativo com Angular moderno** — componentes standalone, signals para estado local e `computed` para valores derivados, guards funcionais para rotas protegidas, e configuração de ambiente (`environment.ts`/`environment.prod.ts`) para builds de produção.
- **Separação de contratos** — o modelo de dados do frontend (`core/models`) e o `AuthResponse`/`JwtPayload` do backend são definidos e mantidos em sincronia deliberadamente, mesmo sendo dois projetos TypeScript independentes.

## Funcionalidades

- Cadastro e login com autenticação JWT
- **Dashboard** — visão geral do patrimônio (cripto + saldo em conta), P&L, transações recentes
- **Carteira** — cadastro de ativos cripto (BTC, ETH, SOL, etc.) com cotação ao vivo
- **Finanças** — controle de entradas e saídas, categorização de gastos, taxa de poupança
- **Insights** — análises automáticas sobre os dados financeiros do usuário
- **Perfil** — dados da conta e resumo consolidado

## Stack

- **Frontend:** Angular 19 (standalone components, signals), SCSS
- **Backend:** Node.js + Express + TypeScript, arquitetura em camadas (controllers → use cases → repositórios)
- **Banco de dados:** Firebase Firestore
- **Autenticação:** JWT (via `jsonwebtoken`)
- **Validação:** Zod
- **Cotação de cripto:** CoinGecko (com cache e fallback simulado se o backend estiver offline)

## Estrutura do projeto

```
Velt/
├── server/     # API REST (Express + TypeScript + Firestore)
│   └── src/
│       ├── controllers/    # Camada HTTP
│       ├── useCases/       # Regras de negócio (testáveis sem Express/Firestore)
│       ├── domain/         # Entidades e contratos de repositório
│       ├── infra/firestore/# Implementação concreta dos repositórios
│       ├── validators/     # Schemas Zod
│       └── utils/          # JWT, hash, error handling, rate limit, etc.
└── web/        # Frontend (Angular)
    └── src/app/
        ├── core/       # Services, guards, interceptors, config, models
        ├── pages/      # Telas (dashboard, carteira, financas, insights, perfil, login, register)
        └── shared/     # Componentes e pipes reutilizáveis (sidebar, formatação)
```

## Como rodar

### Pré-requisitos

- Node.js 20+
- Um projeto Firebase com Firestore habilitado e uma chave de conta de serviço (Service Account)

### Backend

```bash
cd server
npm install
cp .env.example .env   # preencha com seus valores (veja abaixo)
npm run dev
```

O servidor sobe em `http://localhost:3333`.

Variáveis de ambiente (`server/.env`):

| Variável | Descrição |
|---|---|
| `JWT_SECRET` | Chave secreta para assinar os tokens JWT (gere um valor aleatório forte) |
| `PORT` | Porta do servidor (padrão `3333`) |
| `CORS_ORIGIN` | Origem permitida pelo CORS (URL do frontend) |
| `FIREBASE_PROJECT_ID` | ID do projeto no Firebase |
| `FIREBASE_CLIENT_EMAIL` | E-mail da conta de serviço do Firebase |
| `FIREBASE_PRIVATE_KEY` | Chave privada da conta de serviço (entre aspas, com `\n` escapados) |

### Frontend

```bash
cd web
npm install
npm start
```

A aplicação sobe em `http://localhost:4200`.

## Verificação de tipos

```bash
cd server && npx tsc --noEmit
cd web && npx tsc --noEmit -p tsconfig.app.json
```

## Licença

MIT — veja [LICENSE](LICENSE).
