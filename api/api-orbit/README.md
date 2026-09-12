<div align="center">

# Api Orbit - Control Plane Multi-Tenant

![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow?style=for-the-badge)
![Fastify](https://img.shields.io/badge/Fastify-5.x-black?style=for-the-badge&logo=fastify)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma)

**Control plane real da plataforma Orbit — tenants, planos, assinaturas, kill switch e IA 🇧🇷**

[Documentação](#-funcionalidades-detalhadas) • [Repositório da UI Admin](https://github.com/[USUARIO]/orbit)

</div>

---

## 📖 Sobre o Projeto

### 🎯 O Desafio

O [Orbit](https://github.com/[USUARIO]/orbit) nasceu como uma aplicação única (UI admin + regra de negócio + banco no mesmo processo). Conforme mais produtos (tenants) passaram a depender dele — cada um com seu próprio app rodando de forma independente — misturar UI e control plane no mesmo deploy virou um risco: um bug na tela de admin não pode derrubar a validação de licença de quem já está em produção.

### 💡 A Solução

Extração da lógica de negócio do Orbit pra uma API dedicada, sem UI, com um único operador autenticado por secret compartilhado:

1. **Core Tenant Management**: Ciclo de vida completo dos tenants (clientes da plataforma) — CRUD, busca full-text, kill switch.
2. **Licensing Engine**: Validação de licença e resolução de feature flags com latência baixa, consumida publicamente por qualquer tenant app.
3. **Billing**: Produtos, planos, features e assinaturas — o operador é o único que cria/edita planos e cancela assinaturas.
4. **AI Orchestration (AIO)**: Gateway de IA (OpenAI + Google Gemini) com retry e fallback automático.

### 💰 Valor do Projeto

**Control plane enterprise-ready** — a mesma plataforma SaaS Multi-Tenant do Orbit, agora como serviço isolado: escala, versiona e faz deploy independente da UI que a consome.

---

## ✨ Funcionalidades Principais

### 🏢 Core Tenant Management

- **CRUD Completo**: Criação, leitura, atualização de Tenants com validação rigorosa via Zod.
- **Busca Full-Text**: Busca por nome ou slug, case-insensitive, com índices no banco.
- **Kill Switch**: `POST /tenants/:id/status` — bloqueia/libera acesso do tenant instantaneamente (reflete na próxima chamada de `/validate`).
- **Gestão de Assinatura**: Associação de tenants a planos, com lógica de upgrade/downgrade.

### 🔐 Licensing Engine

- **Validação de Licença**: `GET /validate` — endpoint público, valida `licenseKey` + `Origin`.
- **Feature Flag Resolution**: Combina features do plano base com overrides específicos do tenant.
- **Cache Inteligente**: `Cache-Control` com `stale-while-revalidate` só em respostas válidas.

### 💳 Billing (Produtos, Planos, Assinaturas)

- **Self-Service Signup**: `POST /subscriptions` — público, cria tenant + usuário + assinatura (usado no onboarding dos tenant apps).
- **Gestão de Planos**: CRUD de produtos, planos, features e limites de uso — só o operador.
- **Analytics**: MRR aproximado e churn rate por produto.

### 🤖 AI Orchestration (AIO)

- **AI Client Gateway**: Cliente HTTP resiliente com múltiplos providers.
- **Retry + Fallback**: Backoff exponencial no provider primário, troca automática pro fallback.

---

## 🚀 Destaques Técnicos

### Arquitetura

- ✅ **Serviço isolado**: sem UI, sem sessão de browser — só API, autenticada por secret compartilhado
- ✅ **Separação pública / operador**: rotas de tenant apps (validate, products, subscriptions) vs. rotas de gestão (tenants, planos, kill switch), cada uma com seu próprio contrato de auth
- ✅ **Prisma + PostgreSQL**: único serviço da plataforma com acesso ao banco
- ✅ **Docker multi-stage**: imagem final sem devDependencies, usuário non-root

### Segurança

- ✅ **Helmet**: security headers por padrão
- ✅ **Rate Limiting**: proteção contra abuso/força bruta
- ✅ **CORS**: liberado pra chamadas públicas dos tenant apps (validate, products)
- ✅ **Secret único**: todo o superfície de gestão (tenants/planos/assinaturas) atrás do mesmo `ORBIT_API_SECRET` — um único operador gerencia a plataforma inteira

---

## 🛠️ Stack Tecnológica

### Core

- **Framework**: Fastify 5.x
- **Linguagem**: TypeScript 5.9 (strict mode)
- **Validação**: Zod

### Dados

- **Database**: PostgreSQL
- **ORM**: Prisma (Migrations, Type Safety)
- **Auth**: bcryptjs (hash de senha) + secret compartilhado (server-to-server)

### AI

- **AI SDK**: Vercel AI SDK
- **Providers**: OpenAI (GPT-4o) e Google Gemini (1.5 Flash)

### Qualidade de Código

- **Linter/Formatter**: Biome
- **Testes**: Vitest (unitários, use-cases com repositórios mockados)
- **Git Hooks**: Husky + Commitlint (Conventional Commits)

---

## 📦 Instalação e Desenvolvimento

### Pré-requisitos

- Node.js 20+
- pnpm
- PostgreSQL 14+ (local ou remoto)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/[USUARIO]/api-orbit.git
cd api-orbit

# Instale as dependências
pnpm install

# Configure as variáveis de ambiente
cp .env.example .env
# Preencha DATABASE_URL, ORBIT_API_SECRET (16+ chars) e, opcionalmente,
# OPENAI_API_KEY / GOOGLE_GEMINI_API_KEY
```

### Banco de Dados

```bash
# Aplique as migrations
pnpm exec prisma migrate deploy

# Popule o admin inicial + produto BarberFlow + planos
pnpm db:seed
```

O seed cria o operador padrão (`admin@orbit.com` / `admin123` — troque em produção via `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`) e o catálogo de planos usado pelos tenant apps.

### Desenvolvimento

```bash
pnpm dev
```

API disponível em `http://localhost:4001`

### Testes e Qualidade

```bash
pnpm test              # watch mode
pnpm run test:run      # uma vez
pnpm run test:coverage # com relatório de cobertura
pnpm run check         # lint + format (Biome)
pnpm run qa            # pipeline completo: check + test + typecheck
```

### Build para Produção

```bash
pnpm run build
pnpm start
```

---

## 📂 Estrutura do Projeto

```
src/
├── core/
│   ├── domain/              # Entities, repository interfaces, schemas Zod
│   │   ├── tenant/ product/ plan/ feature/ subscription/ user/
│   │   └── value-objects/   # Password
│   ├── application/
│   │   └── use-cases/       # Regra de negócio, testável com repos mockados
│   └── infra/
│       ├── persistence/     # Implementações Prisma dos repositórios
│       ├── auth/            # BcryptPasswordHasher
│       └── ai/              # AI Client Gateway
├── app/
│   └── http/
│       ├── server.ts        # Bootstrap Fastify (helmet, cors, rate-limit)
│       ├── container.ts     # DI: repositório -> use-case
│       ├── routes/          # tenant, product, subscription, license, auth, ai
│       ├── middlewares/     # requireOperator, errorHandler
│       └── errors/          # AppError e subclasses (404/400/401/409)
├── shared/
│   ├── env.ts               # Validação de env vars (Zod)
│   └── db.ts                # Prisma Client singleton
└── index.ts                 # Entry point
tests/unit/                  # Testes dos use-cases (repositórios mockados)
prisma/
├── schema.prisma
├── migrations/
└── seed.ts
```

Camadas: `core/domain` não depende de nada (regra pura); `core/application` depende só de `domain` (via interface de repositório); `core/infra` implementa as interfaces de `domain` com Prisma; `app/http` conecta tudo (container faz o wiring, rotas chamam use-cases).

---

## 📊 Funcionalidades Detalhadas

### Rotas Públicas

| Rota | Descrição |
|---|---|
| `GET /validate?licenseKey=` | Valida licença — usado pelos tenant apps no boot |
| `GET /products/:slug` | Planos ativos de um produto — usado no onboarding |
| `POST /subscriptions` | Self-service: cria tenant + usuário + assinatura |
| `POST /tenants/sync` *(secret)* | Sincroniza tenant no signup do usuário final |
| `POST /auth/login` | Autentica o operador (email + senha) |

### Rotas do Operador (`Authorization: Bearer <ORBIT_API_SECRET>`)

| Recurso | Rotas |
|---|---|
| Tenants | `GET/POST/PATCH /tenants`, `GET /tenants/search`, `POST /tenants/:id/status` (kill switch), `POST /tenants/:id/subscriptions` |
| Produtos | `GET/POST/PATCH/DELETE /products`, `GET /products/:id/full`, `GET /products/:id/analytics` |
| Planos | `POST /products/:id/plans`, `PATCH/DELETE /plans/:id` |
| Features | `GET/POST /products/:id/features`, `PATCH/DELETE /features/:id` |
| Assinaturas | `GET /subscriptions`, `GET /subscriptions/:id`, `POST /subscriptions/:id/cancel`, `DELETE /subscriptions/:id` |
| IA | `POST /ai/completion` |
| Operador | `GET /auth/users/:id` |

**Exemplo — validação de licença:**

```json
GET /validate?licenseKey=LIC-XXXX
Origin: https://cliente.exemplo.com

200 OK
{ "valid": true, "capabilities": ["COUPONS", "WHATSAPP"], "limits": { "max_barbers": 3 } }
```

---

## 🚀 Deploy

### Docker

```bash
docker build -t api-orbit .

docker run -p 4001:4001 \
  -e DATABASE_URL="postgresql://..." \
  -e ORBIT_API_SECRET="..." \
  api-orbit
```

Veja `docker/docker-compose.yml` no monorepo pra subir `api-orbit` + `orbit` + Postgres juntos (inclui um serviço `api-orbit-migrate` que roda as migrations antes do boot).

### Variáveis de Ambiente

```env
DATABASE_URL="postgresql://user:password@localhost:5432/orbit"
ORBIT_API_SECRET="troque-por-uma-chave-forte-com-16+chars"
OPENAI_API_KEY=""
GOOGLE_GEMINI_API_KEY=""
NODE_ENV="development"
PORT="4001"
HOST="0.0.0.0"
```

---

## 📝 Licença

Serviço interno da plataforma Orbit — control plane de tenants, licenças e assinaturas.

---

## 👨‍💻 Desenvolvedor

**Antonio S.**
Full Stack Developer

- 🌐 Portfolio: [acesse aqui](#)
- 💼 LinkedIn: [acesse aqui](#)
- 📧 Email: <[SEU_EMAIL]>

---

<div align="center">

**Desenvolvido com ❤️ e muito ☕**

[⬆ Voltar ao topo](#api-orbit---control-plane-multi-tenant)

</div>
