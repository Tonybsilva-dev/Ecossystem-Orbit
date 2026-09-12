# 💈 BarberFlow - Gestão de Barbearia Premium

<div align="center">

![BarberFlow](https://img.shields.io/badge/Status-Development-orange?style=for-the-badge)
![React Router](https://img.shields.io/badge/React_Router-v7-blue?style=for-the-badge&logo=react-router)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v3-38B2AC?style=for-the-badge&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-v6-green?style=for-the-badge&logo=prisma)

<center>

<img src="public/assets//icons/barber-flow-icon.png" alt="BarberFlow" title="BarberFlow" width="160">

![BarberFlow](https://img.shields.io/badge/BarberFlow-v1.0-blue?style=for-the-badge)

</center>

**Uma experiência digital "Old School" com tecnologia de ponta para o Flavinho Cabelereiro 🇧🇷**

[🌐 Ver Demo](https://barber-flow.vercel.app/) • [📅 Agendar](https://barber-flow.vercel.app/schedule) • [🛒 Loja](https://barber-flow.vercel.app/loja)

</div>

---

## 📖 Sobre o Projeto

### 🎯 O Desafio

Modernizar uma barbearia clássica, trazendo a elegância e a tradição do corte para o mundo digital. O objetivo era criar não apenas um site de agendamento, mas um **ecossistema completo** que gerencie horários, comercialize produtos premium e ofereça uma gestão financeira clara para o proprietário, tudo com uma estética "Vintage Industrial" impecável.

### 💡 A Solução

Uma aplicação web robusta (PWA) que combina **Agendamento Inteligente**, **E-commerce de Produtos** e **Dashboard Administrativo**. O sistema guia o cliente por um fluxo de agendamento intuitivo (wizard), permite a compra de produtos de manutenção (pomadas, óleos) e entrega aos barbeiros um painel de controle total sobre seus atendimentos e faturamento.

### 💰 Valor do Projeto

**Em Aberto** - Projeto em desenvolvimento contínuo, evoluindo para atender às necessidades crescentes do negócio.

---

## ✨ Funcionalidades Principais

### 📅 Sistema de Agendamento (Booking Wizard)

- **Fluxo Guiado**: Passo a passo intuitivo (Serviço -> Profissional -> Data/Hora -> Confirmação)
- **Seleção Visual**: Cards interativos para escolha de serviços e barbeiros
- **Calendário Inteligente**: Bloqueio automático de horários passados e indisponíveis
- **Resumo em Tempo Real**: Feedback visual das escolhas antes da confirmação
- **Confirmação com Confete**: Feedback positivo ao finalizar o agendamento

### 🛍️ E-commerce Integrado (Loja)

- **Vitrine Premium**: Listagem de produtos com filtros por categoria (Cabelo, Barba, Acessórios)
- **Carrinho Slide-over**: Drawer lateral para gestão rápida de itens sem sair da página
- **Persistence State**: O carrinho não se perde ao recarregar a página (Zustand + LocalStorage)
- **Checkout Fluido**: Processo simplificado de finalização de compra com simulação de pagamento
- **Feedback Visual**: Animações de sucesso e feedback tátil

### 📊 Dashboard Administrativo (Backoffice)

- **KPIs em Tempo Real**: Cards com métricas vitais (Faturamento, Agendamentos, Novos Clientes)
- **Gestão de Agendamentos**: Lista completa com status (Pendente, Confirmado, Concluído)
- **Controle de Acesso (RBAC)**: Interface exclusiva para Admins e Barbeiros (protegida via Auth)
- **Feed de Atividade**: Log de ações recentes na barbearia

### 🔐 Autenticação & Segurança

- **Login Híbrido**: Suporte a Google (Clientes) e Email/Senha (Staff)
- **Proteção de Rotas**: Middleware de verificação de cargos (Role-Based Access Control)
- **Validação Rigorosa**: Formulários blindados com Zod e React Hook Form

---

## 🚀 Destaques Técnicos

### Arquitetura e Performance

- ✅ **Domain-Driven Design (DDD)**: Estrutura organizada por features (`auth`, `scheduling`, `catalog`, `shop-management`)
- ✅ **React Router 7**: Utilização das últimas features de roteamento do React
- ✅ **State Management**: Zustand para gerenciamento global leve e performático
- ✅ **Server-Side Logic**: API Routes integradas (Hono) para operações seguras
- ✅ **Database**: Prisma ORM com PostgreSQL (Supabase) para integridade de dados

### Design System (The "Soul")

- ✅ **Paleta "Classic Cuts"**: Navy (#0f172a), Leather (#b45309), Chrome (#e2e8f0)
- ✅ **Tipografia Contrastante**: Playfair Display (Serifa/Títulos) vs Inter (Sans/UI)
- ✅ **Componentes Atômicos**: Botões, Inputs e Cards padronizados e reutilizáveis
- ✅ **Micro-interações**: Hover states, transições de gaveta e feedbacks de clique

### Otimização e Qualidade

- ✅ **Linting & Formatting**: Husky + Lint-staged configurados (ESLint + Prettier)
- ✅ **Type Safety**: TypeScript estrito em todo o projeto
- ✅ **Responsividade**: Layouts fluidos que funcionam do mobile ao desktop

---

## 🛠️ Stack Tecnológica

### Core

- **Framework**: React Router v7 com Vite
- **Linguagem**: TypeScript 5.0
- **Estilo**: Tailwind CSS v3 com Design System estendido
- **Ícones**: Lucide React

### Backend & Data

- **ORM**: Prisma (PostgreSQL)
- **Auth**: BetterAuth (RBAC System)
- **API**: Hono (Node Server)
- **Validação**: Zod
- **Licenciamento**: Integração com [`api-orbit`](https://github.com/[USUARIO]/api-orbit) — control plane que valida a licença da barbearia, resolve planos/features e sincroniza o tenant no signup

### State & UX

- **State**: Zustand (com Persist Middleware)
- **Forms**: React Hook Form + Resolvers
- **Animações**: Framer Motion

---

## 📦 Instalação e Desenvolvimento

### Pré-requisitos

- Node.js 20+
- pnpm
- Banco de dados PostgreSQL (Local ou Supabase)
- [`api-orbit`](https://github.com/[USUARIO]/api-orbit) rodando (licenciamento e planos dependem dele)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/Tonybsilva-dev/barber-flow.git

# Entre no diretório
cd barber-flow

# Instale as dependências
pnpm install
```

### Configuração do Ambiente

Crie um arquivo `.env` na raiz (veja `.env.example`):

```env
DATABASE_URL="postgresql://user:pass@host:5432/db"
BETTER_AUTH_SECRET="sua_chave_secreta"
BETTER_AUTH_URL="http://localhost:5180"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# api-orbit (control plane de tenants/licenças)
ORBIT_API_URL="http://localhost:4001"
ORBIT_API_SECRET="mesma-chave-do-api-orbit"
VITE_ORBIT_API_URL="http://localhost:4001"
SERVER_PORT="3333"
```

### Desenvolvimento

```bash
# Setup do Banco
pnpm db:push
pnpm db:seed # Popula barbearia inicial

# Inicie o servidor de desenvolvimento (Frontend + Backend)
pnpm dev
```

Aplicação disponível em `http://localhost:5180`

---

## 📂 Estrutura do Projeto

```
src/
├── app/                 # Configurações globais (Routes, Layouts)
├── features/            # Domínios da aplicação (DDD)
│   ├── auth/            # Autenticação e RBAC
│   ├── catalog/         # Loja e Checkout
│   ├── scheduling/      # Sistema de Agendamento
│   └── shop-management/ # Dashboard Admin
├── server/              # Backend API (Hono)
├── shared/              # Código compartilhado
│   ├── ui/              # Design System (Button, Drawer, etc)
│   └── utils/           # Utilitários (Formatters, Classes)
└── main.tsx            # Entry point
```

---

## 🎨 Design System

### Paleta de Cores

```css
--color-shop-900: #0f172a; /* Midnight Slate (Fundo) */
--color-leather-700: #b45309; /* Saddle Leather (Ação Primária) */
--color-chrome-100: #f1f5f9; /* Polished Silver (Texto/Ícones) */
--color-chrome-400: #94a3b8; /* Brushed Steel (Texto Secundário) */
```

### Tipografia

- **Display**: Playfair Display (Elegância clássica)
- **UI**: Inter (Legibilidade moderna)

---

## 💰 Precificação e Justificativa de Valor

### 📊 Classificação do Projeto

Este projeto é um **Sistema de Gestão Completo (SaaS-like)**, superando em muito a complexidade de sites institucionais ou landing pages. Ele integra múltiplos fluxos de negócio críticos (Financeiro, Agenda, Estoque).

### 💵 Breakdown de Estimativa (Por Módulo)

| Módulo                    | Valor Estimado | Justificativa                                                    |
| ------------------------- | -------------- | ---------------------------------------------------------------- |
| **Core & Design System**  | R$ 3.000       | Branding, UI Kit reuseável, Arquitetura DDD                      |
| **Módulo de Agendamento** | R$ 4.000       | Lógica complexa de horários, validações, wizard                  |
| **E-commerce & Checkout** | R$ 3.500       | Carrinho persistente, catálogo, fluxo de pagamento               |
| **Painel Administrativo** | R$ 5.000       | Dashboards, gestão de dados, proteção de rotas, RBAC, Relatórios |
| **TOTAL**                 | **A Definir**  | Valor final dependerá do escopo concluído                        |

---

### 🏆 Diferenciais Premium

#### 1️⃣ **Complexidade Técnica (40% do valor)**

**Agendamento Wizard**

- Lógica de estado complexa para garantir consistência entre passos.
- Prevenção de conflitos de horário.

**Arquitetura Híbrida**

- Backend for Frontend (BFF) com Hono para segurança e performance.
- Integração profunda com Prisma para type-safety end-to-end.

#### 2️⃣ **Design & UX (30% do valor)**

**Estética "Gentleman's Club"**

- A interface não parece um software genérico; tem personalidade.
- Uso de texturas (noise), sombras profundas e cores masculinas.
- Animações de entrada e saída (Framer Motion) para sensação de fluidez.

---

## 👨‍💻 Desenvolvedor

**Tony Silva**
Full Stack Software Engineer

- 🌐 Portfolio: [acesse aqui](https://antonio-s-eng.vercel.app/)
- 💼 LinkedIn: [acesse aqui](https://linkedin.com/in/tony-silva)
- 📧 Email: contato@antoniobsilva.com.br

---

<div align="center">

**BarberFlow - Cortando código com estilo 💈**

[⬆ Voltar ao topo](#-barberflow---gestão-de-barbearia-premium)

</div>
