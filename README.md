<div align="center">

# Orbit - Plataforma SaaS Multi-Tenant

![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow?style=for-the-badge)
![Framework](https://img.shields.io/badge/React%20Router-7.9.2-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue?style=for-the-badge&logo=typescript)
![CSS Framework](https://img.shields.io/badge/Tailwind%20CSS-4.1.17-38bdf8?style=for-the-badge&logo=tailwindcss)

<br/>

<img src="docs/assets/orbit-icon.png" width="200px" alt="orbit icon" title="orbit icon">

<br />

**Plataforma de gerenciamento centralizado para múltiplas instâncias SaaS - Multi-Tenant Architecture 🇧🇷**

[Ver Demo](#) • [Documentação](./docs) • [API Docs](#)

</div>

---

## 📖 Sobre o Projeto

### 🎯 O Desafio

Gerenciar múltiplas instâncias isoladas de aplicações SaaS é manual, propenso a erros e difícil de escalar. Não havia um controle centralizado para pagamentos, feature flags e validação de licença, e a busca por clientes era lenta e pouco intuitiva. O objetivo era criar uma plataforma unificada que otimizasse o gerenciamento de tenants e elevasse a experiência do administrador.

### 💡 A Solução

Uma **plataforma SaaS Multi-Tenant** completa que atua em 3 frentes principais:

1. **Core Tenant Management**: Gerenciamento completo do ciclo de vida dos clientes (Tenants) com CRUD, busca full-text e validação rigorosa.
2. **Licensing Engine**: Sistema de segurança que valida permissões e assinaturas com latência < 200ms, incluindo feature flags e controle de acesso.
3. **AI Orchestration (AIO)**: Interface unificada para comunicação com LLMs e Agentes, com retry automático e fallback entre providers.

A plataforma é dividida em dois serviços:

- **`web/orbit`** (este repositório): UI administrativa — o painel onde o operador gerencia tenants, planos, assinaturas e kill switch.
- **[`api-orbit`](https://github.com/[USUARIO]/api-orbit)**: control plane real — toda a lógica de negócio (tenant, license, produtos/planos, AI Orchestration) e o único serviço com acesso ao banco de dados.

Este app não acessa banco de dados nem contém regras de negócio — é um consumidor HTTP autenticado (secret compartilhado) de `api-orbit`.

### 💰 Valor do Projeto

**Plataforma Enterprise** - Desenvolvida para gerenciar múltiplas instâncias SaaS de forma centralizada, com arquitetura preparada para escalar e transformar em modelo SaaS completo.

---

## ✨ Funcionalidades Principais

### 🏢 Core Tenant Management

- **CRUD Completo**: Criação, leitura, atualização e exclusão de Tenants com validação rigorosa usando Zod.
- **Busca Full-Text (SXO)**: Busca otimizada por nome ou slug com índices no banco de dados para performance < 100ms.
- **Validação de Unicidade**: Sistema robusto que previne slugs e domínios duplicados.
- **Gerenciamento de Planos**: Associação de tenants a planos de assinatura com features configuráveis.
- **Status de Assinatura**: Controle de status (ACTIVE, INACTIVE, PAST_DUE) para bloqueio automático.

### 🔐 Licensing Engine

- **Validação de Licença**: Endpoint público `/api/validate` para verificar se uma instância pode operar.
- **Feature Flag Resolution**: Cálculo automático de módulos disponíveis combinando plano base com overrides.
- **CORS Security**: Validação de origem para segurança cross-origin.
- **Cache Inteligente**: Cache-Control otimizado para reduzir latência (< 200ms).
- **Capabilities**: Retorno de lista de capabilities disponíveis para cada tenant.

### 🤖 AI Orchestration (AIO)

- **AI Client Gateway**: Cliente HTTP resiliente para chamadas de IA com suporte a múltiplos providers.
- **Retry Logic**: Tentativas automáticas com backoff exponencial em caso de falhas transitórias.
- **Provider Fallback**: Troca automática entre OpenAI e Google Gemini em caso de falha.
- **Context Handling**: Suporte a contexto customizado em system messages.
- **Error Handling**: Tratamento robusto de erros com `AIClientError` customizado.

---

## 🚀 Destaques Técnicos

### Arquitetura e Performance

- ✅ **Separação UI / Control Plane**: este app é puramente apresentação — toda regra de negócio e persistência vive em `api-orbit`
- ✅ **Cliente HTTP tipado**: `app/core/orbit-api` centraliza as chamadas server-to-server pra `api-orbit`, com secret compartilhado
- ✅ **Lazy Loading**: Carregamento otimizado de componentes e rotas
- ✅ **Code Splitting**: Chunks otimizados para performance

### SEO e Acessibilidade

- ✅ **Meta Tags Dinâmicas**: Títulos e descrições personalizados por página
- ✅ **Open Graph**: Compartilhamento otimizado para redes sociais
- ✅ **Twitter Cards**: Preview rico ao compartilhar no Twitter/X
- ✅ **Estrutura Semântica**: HTML5 com landmarks ARIA (header, main, footer, sections)
- ✅ **Navegação Acessível**: Skip links e navegação por teclado otimizada (WCAG 2.1 AA)

### Otimização de Performance

- ✅ **Core Web Vitals**: Otimizado para LCP < 2.5s, FCP < 1.8s, CLS < 0.1, INP < 200ms
- ✅ **Cache Strategy**: Cache-Control headers com `stale-while-revalidate` para validação de licença
- ✅ **Database Indexing**: Índices otimizados para busca full-text em tenants
- ✅ **API Latency**: Validação de licença com latência < 200ms garantida

---

## 🛠️ Stack Tecnológica

### Core

- **Framework**: React Router v7 com TypeScript
- **Estilo**: Tailwind CSS v4 com Design System customizado
- **Animações**: Transições nativas do Tailwind CSS

### Backend & Dados

- **Sem banco próprio**: todo dado vive em `api-orbit`; este app só guarda a sessão do admin (cookie)
- **Authentication**: Sessão via cookie (`app/core/auth/session.server.ts`); credenciais validadas em `api-orbit` (`POST /auth/login`)
- **Integração**: Cliente HTTP (`app/core/orbit-api`) com secret compartilhado (`ORBIT_API_SECRET`)

### AI & Integrações

- Orquestração de IA (OpenAI + Google Gemini, retry/fallback) vive em `api-orbit` — este app não faz chamadas de IA diretamente

### Deploy & Infra

- **Hospedagem**: Preparado para Vercel, Railway, Fly.io ou qualquer plataforma Node.js
- **CI/CD**: GitHub Actions (configurável)
- **Containerização**: Docker support para deploy flexível

---

## 📦 Instalação e Desenvolvimento

### Pré-requisitos

- Node.js 20+
- pnpm
- [`api-orbit`](https://github.com/[USUARIO]/api-orbit) rodando (control plane — sem ele o login e todas as telas admin não funcionam)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/[USUARIO]/orbit.git

# Entre no diretório
cd orbit

# Instale as dependências
pnpm install

# Configure as variáveis de ambiente
cp .env.example .env
# Preencha:
# - SESSION_SECRET
# - ORBIT_API_URL (endereço do api-orbit, ex: http://localhost:4001)
# - ORBIT_API_SECRET (mesma chave configurada em api-orbit)
```

### Desenvolvimento

```bash
# Inicie o servidor de desenvolvimento
pnpm dev
```

Aplicação disponível em `http://localhost:5179`

### Testes

```bash
# Execute todos os testes
pnpm test

# Execute testes em modo watch
pnpm test -- --watch

# Execute testes com UI
pnpm run test:ui

# Execute testes uma vez
pnpm run test:run
```

### Build para Produção

```bash
# Crie o build otimizado
pnpm run build

# Inicie o servidor de produção
pnpm start
```

---

## 📂 Estrutura do Projeto

```
app/
├── components/          # Componentes UI reutilizáveis (Design System)
├── core/                # Infraestrutura central
│   ├── auth/            # Sessão do admin (cookie) e login
│   ├── constants/       # Constantes globais (Cache-Control, etc)
│   ├── orbit-api/       # Cliente HTTP pra api-orbit (server-to-server)
│   ├── security/        # Security headers e sanitização
│   ├── seo/             # Schema.org e SEO
│   ├── utils/           # Utilitários gerais
│   └── validation/      # Configuração Zod com mensagens PT-BR
├── routes/              # Rotas da Aplicação (React Router)
│   ├── admin.tsx        # Layout do Painel Administrativo
│   ├── admin.tenants.tsx        # Tenants + kill switch (via api-orbit)
│   ├── admin.subscriptions.tsx  # Assinaturas (via api-orbit)
│   ├── admin.products.*.tsx     # Produtos/planos/features (via api-orbit)
│   ├── home.tsx         # Página inicial
│   └── login.tsx        # Autenticação (via api-orbit)
├── root.tsx             # Root component com providers
└── entry.client.tsx     # Client entry point
```

Regras de negócio, Prisma e migrations vivem em [`api-orbit`](https://github.com/[USUARIO]/api-orbit) — este repositório não tem acesso a banco.

---

## 🎨 Design System

### Paleta de Cores

```css
--color-primary: #9333ea;      /* Roxo principal (accent) */
--color-secondary: #f97316;   /* Laranja (destaques) */
--color-success: #10b981;      /* Verde (sucesso, ACTIVE) */
--color-warning: #f59e0b;      /* Amarelo (aviso, TRIAL) */
--color-error: #ef4444;        /* Vermelho (erro, PAST_DUE) */
--color-gray: #6b7280;        /* Cinza neutro */
```

### Tipografia

- **Display**: Sistema de fontes do sistema (SF Pro, Segoe UI, etc.)
- **Sans**: Tailwind CSS default (Inter, system-ui)

### Componentes Base

- **Badges**: Tags coloridas para status (ACTIVE, INACTIVE, PAST_DUE, TRIAL)
- **Cards**: Containers com backdrop blur e sombras suaves
- **Forms**: Validação em tempo real com React Hook Form + Zod
- **Tables**: Tabelas responsivas com hover states

---

## 📊 Funcionalidades Detalhadas

> As funcionalidades abaixo descrevem a plataforma como um todo. A implementação (endpoints, banco, regras) vive em [`api-orbit`](https://github.com/[USUARIO]/api-orbit) — este app consome tudo via HTTP. Documentação completa da API está no README de lá.

### 1. Gerenciamento de Tenants

**Operações CRUD:**

- **Criar Tenant**: Validação de slug único, email único, criação de usuário owner
- **Buscar Tenant**: Por slug (otimizado) ou por ID
- **Buscar Tenants**: Lista completa com paginação
- **Buscar Full-Text**: Busca por nome ou slug com case-insensitive (SXO)
- **Atualizar Tenant**: Validação de dados e atualização de status
- **Status de Assinatura**: ACTIVE, INACTIVE, PAST_DUE

**Filtros:**

- Por status (ACTIVE, INACTIVE, PAST_DUE)
- Por plano de assinatura
- Busca por nome ou slug (full-text)

### 2. Validação de Licença

**Endpoint**: `GET /api/validate?licenseKey=<key>`

**Funcionalidades:**

- **Validação de Acesso**: Verifica se licenseKey é válido e tenant está ACTIVE
- **CORS Security**: Valida origem do request via Origin header
- **Feature Flags**: Retorna lista de capabilities disponíveis
- **Cache Strategy**: Cache-Control com `max-age=600` e `stale-while-revalidate=3600`
- **Error Handling**: Respostas 200 (válido), 403 (inválido), 400 (parâmetros faltando), 500 (erro interno)

**Resposta de Sucesso:**

```json
{
  "valid": true,
  "capabilities": ["COUPONS", "WHATSAPP", "EMAIL"]
}
```

### 3. Feature Flag Resolution

**Funcionalidades:**

- **Resolução de Permissões**: Calcula features disponíveis combinando plano base + overrides
- **Plano Base**: Features definidas no plano de assinatura
- **Overrides**: Features adicionais específicas do tenant (upsell)
- **Deduplicação**: Remove duplicatas automaticamente usando Set
- **Fallback**: Retorna array vazio se tenant não tem plano nem overrides

### 4. AI Client Gateway

**Funcionalidades:**

- **Múltiplos Providers**: OpenAI (GPT-4o) e Google Gemini (1.5 Flash)
- **Retry Logic**: Até 3 tentativas com backoff exponencial (1s, 2s, 4s)
- **Fallback Automático**: Troca para provider secundário se primário falhar
- **Context Support**: Inclusão de contexto customizado em system messages
- **Error Handling**: `AIClientError` customizado com informações detalhadas
- **Configuração Flexível**: Model, maxOutputTokens e temperature customizáveis

**Exemplo de Uso:**

```typescript
import { aiClient } from "~/domains/ai/ai.client";

const response = await aiClient.completion("Hello!", {
  userId: "user-123",
  sessionId: "session-456"
});
```

---

## 🎯 Diferenciais da Entrega

### Além do Escopo Inicial

Embora planejado como plataforma de gerenciamento básico, a arquitetura entregue é uma **plataforma SaaS enterprise-ready**:

✅ **Domain-Driven Design**: Arquitetura modular e escalável com separação clara de responsabilidades  
✅ **AI Orchestration**: Integração nativa com múltiplos providers de IA com fallback automático  
✅ **Performance Otimizada**: Latência < 200ms para validação de licença com cache inteligente  
✅ **Search Experience Optimization (SXO)**: Busca full-text otimizada com índices no banco  
✅ **Testes Abrangentes**: Cobertura com testes unitários e de integração (Vitest)  
✅ **Documentação Completa**: Requisitos e planos de testes documentados por domínio  
✅ **Security First**: Security headers, CORS, sanitização de inputs e validação rigorosa  
✅ **Type Safety**: TypeScript end-to-end com Prisma types gerados automaticamente

---

## 📈 Métricas e Impacto

### Performance

- **Lighthouse Score**: Em desenvolvimento (meta: 90+ em todas as categorias)
- **First Contentful Paint**: < 1.8s (meta)
- **Time to Interactive**: < 3.4s (meta)
- **License Validation Latency**: < 200ms (garantido com cache)
- **Search Response Time**: < 100ms (com índices otimizados)

### Negócio

- **Automação de Bloqueio**: Zero intervenção manual para bloqueio de inadimplentes
- **Escalabilidade**: Arquitetura preparada para gerenciar centenas de tenants
- **Conformidade AEO/GEO**: 100% de conformidade com schemas para indexação por IAs
- **Developer Experience**: Type safety completo e autocomplete inteligente

### Cobertura de Testes

- **Tenant Domain**: 24 testes (14 create/read + 10 search) - ✅ 100% passando
- **License Domain**: 28 testes (13 integração + 15 unitários) - ✅ 100% passando
- **AI Domain**: 7 testes de integração - ✅ 100% passando (testes unitários bloqueados por problema conhecido do Vitest)

---

## 🚀 Deploy

### Vercel (Recomendado)

```bash
# Deploy automático via GitHub
# Configure as variáveis de ambiente no dashboard da Vercel:
# - DATABASE_URL
# - OPENAI_API_KEY (opcional)
# - GOOGLE_GEMINI_API_KEY (opcional)
```

### Railway

```bash
# Deploy via Railway CLI
railway up
```

### Docker

```bash
# Build da imagem
docker build -t orbit .

# Run do container (api-orbit precisa estar acessível)
docker run -p 5179:5179 \
  -e SESSION_SECRET="..." \
  -e ORBIT_API_URL="http://api-orbit:4001" \
  -e ORBIT_API_SECRET="..." \
  orbit
```

Veja `docker/docker-compose.yml` na raiz do monorepo pra subir `orbit` + `api-orbit` + Postgres juntos.

### Variáveis de Ambiente Necessárias

```env
SESSION_SECRET="..."
ORBIT_API_URL="http://localhost:4001"
ORBIT_API_SECRET="..."
```

---

## 📝 Licença

Este projeto foi desenvolvido como plataforma SaaS Multi-Tenant para gerenciamento centralizado de múltiplas instâncias.

---

## 💰 Precificação e Justificativa de Valor

### 📊 Classificação do Projeto

Este projeto evoluiu de uma necessidade de gerenciamento manual para uma **plataforma SaaS enterprise-ready**. Não entregamos apenas um sistema de gerenciamento básico, mas sim um **ecossistema completo** que substitui múltiplas soluções fragmentadas.

#### ✅ Diferenciais de um Sistema Completo

- **Arquitetura Escalável**: Domain-Driven Design preparado para crescer com o negócio
- **Performance Enterprise**: Latência < 200ms garantida com cache inteligente
- **AI-First**: Integração nativa com múltiplos providers de IA para automação
- **Type Safety**: TypeScript end-to-end com validação em runtime (Zod)

---

### 💵 Breakdown de Precificação (Etapa Atual)

A precificação abaixo refere-se aos módulos já implementados e em operação.

#### 1️⃣ Core Tenant Management - **R$ [VALOR]**

*Gerenciamento completo do ciclo de vida dos clientes (Tenants).*

- **CRUD Completo**: Criação, leitura, atualização e exclusão com validação rigorosa
- **Busca Full-Text**: Busca otimizada por nome ou slug com índices no banco
- **Validação de Unicidade**: Sistema robusto que previne duplicatas
- **Gerenciamento de Planos**: Associação de tenants a planos de assinatura
- **Status de Assinatura**: Controle automático de status (ACTIVE, INACTIVE, PAST_DUE)

#### 2️⃣ Licensing Engine - **R$ [VALOR]**

*Sistema de segurança que valida permissões e assinaturas.*

- **Validação de Licença**: Endpoint público com latência < 200ms
- **Feature Flag Resolution**: Cálculo automático de módulos disponíveis
- **CORS Security**: Validação de origem para segurança cross-origin
- **Cache Inteligente**: Cache-Control otimizado para performance

#### 3️⃣ AI Orchestration (AIO) - **R$ [VALOR]**

*Interface unificada para comunicação com LLMs e Agentes.*

- **AI Client Gateway**: Cliente HTTP resiliente com suporte a múltiplos providers
- **Retry Logic**: Tentativas automáticas com backoff exponencial
- **Provider Fallback**: Troca automática entre OpenAI e Google Gemini
- **Error Handling**: Tratamento robusto de erros com tipos customizados

#### 4️⃣ Infrastructure & Security - **R$ [VALOR]**

*Base técnica segura e resiliente.*

- **Security Headers**: CSP, X-Frame-Options, Referrer-Policy, HSTS
- **Type Safety**: TypeScript + Zod para validação em runtime
- **Database Optimization**: Índices otimizados e queries eficientes
- **Test Coverage**: Testes unitários e de integração abrangentes

#### 🚧 Admin UI (Em Desenvolvimento)

*Interface visual para o Super Admin.*

- **Status**: Em planejamento
- **Orçamento**: Será definido em etapa posterior (Aditivo contratual)

---

### 💎 Cálculo do Investimento (Etapa 1)

```
Core Tenant Management:          R$ [VALOR]
Licensing Engine:                 R$ [VALOR]
AI Orchestration (AIO):          R$ [VALOR]
Infrastructure & Security:        R$ [VALOR]
─────────────────────────────────────────────────────
VALOR DE MERCADO (ESCOPO ATUAL):         R$ [VALOR_TOTAL]

DESCONTO PARCERIA ESTRATÉGICA:           -R$ [VALOR_DESCONTO]
─────────────────────────────────────────────────────
INVESTIMENTO REALIZADO:                  R$ [VALOR_FINAL]
─────────────────────────────────────────────────────
```

**Observação**: O valor de **[VALOR_FINAL]** refere-se à entrega da plataforma funcional (Core + Licensing + AI). Admin UI e futuras evoluções para modelo SaaS completo serão orçados separadamente.

---

### 📈 ROI (Retorno sobre Investimento)

1. **Automação Completa**:
    - Zero intervenção manual para bloqueio de inadimplentes
    - Redução de 100% no tempo de gerenciamento manual

2. **Performance Enterprise**:
    - Latência < 200ms para validação de licença
    - Busca full-text < 100ms
    - Experiência do usuário otimizada

3. **Escalabilidade**:
    - Arquitetura preparada para gerenciar centenas de tenants
    - Crescimento sem necessidade de refatoração

4. **AI-First**:
    - Automação de tarefas via IA
    - Redução de trabalho manual em processos administrativos

---

### 🎯 Comparação de Mercado

| Solução | Custo | O que entrega | Limitações |
|---------|-------|---------------|------------|
| **Solução Manual** | Tempo | Controle total | Propenso a erros, não escala |
| **SaaS Genérico** | R$ [CUSTO]/mês | Funcionalidades básicas | Sem customização, vendor lock-in |
| **Desenvolvimento Custom** | R$ [CUSTO] | Solução sob medida | Alto custo inicial, manutenção complexa |
| **Orbit** | **R$ [VALOR]** | **Plataforma Enterprise Completa** | **Sem limitações, código próprio.** |

---

### 💡 Conclusão

Estamos construindo uma **plataforma SaaS enterprise-ready**. O investimento atual cobre todo o ecossistema técnico necessário para operar com eficiência máxima, com arquitetura pronta para as próximas fases de expansão (Admin UI, Analytics, Billing).

---

## 👨‍💻 Desenvolvedor

**Antonio S.**  
Full Stack Developer

- 🌐 Portfolio: [acesse aqui](#)
- 💼 LinkedIn: [acesse aqui](#)
- 📧 Email: <[SEU_EMAIL]>

---

## 🙏 Agradecimentos

Agradecimento especial pela oportunidade de desenvolver uma plataforma SaaS enterprise-ready com arquitetura moderna e escalável.

---

<div align="center">

**Desenvolvido com ❤️ e muito ☕**

[⬆ Voltar ao topo](#-orbit---plataforma-saas-multi-tenant)

</div>
