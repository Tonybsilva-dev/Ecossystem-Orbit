# 🏗️ Checklist de Arquitetura - Zustand + React Query

**Projeto:** [Nome do Projeto]
**Data:** DD/MM/AAAA

## 1. Separação de Responsabilidades

- [ ] Zustand configurado apenas para estado de UI (modais, filtros, preferências)
- [ ] React Query configurado para dados do servidor (requisições HTTP)
- [ ] Services criados como funções puras (sem gerenciamento de estado)
- [ ] Nenhuma requisição HTTP dentro de stores Zustand

## 2. Estrutura de Diretórios

- [ ] Estrutura de domínios criada (`domains/[domain]/[subdomain]/`)
- [ ] Hooks React Query organizados em `hooks/`
- [ ] Services organizados em `services/`
- [ ] Stores Zustand organizados em `stores/` (apenas UI state)
- [ ] Types e validations separados

## 3. React Query Configuration

- [ ] QueryClient configurado com `staleTime` apropriado
- [ ] `gcTime` configurado para cache
- [ ] `refetchOnWindowFocus` configurado conforme necessidade
- [ ] Error handling implementado nos hooks

## 4. Zustand Stores

- [ ] Stores criados apenas para estado de UI
- [ ] Persist middleware aplicado quando necessário
- [ ] DevTools habilitado em desenvolvimento
- [ ] Selectors implementados para performance

## 5. Services

- [ ] Services retornam apenas Promises
- [ ] Tratamento de erro padronizado
- [ ] Tipos TypeScript definidos para requests/responses
- [ ] Nenhum estado gerenciado nos services

## 6. Integração

- [ ] Hooks React Query integrados com services
- [ ] Stores Zustand sincronizados quando necessário
- [ ] Error boundaries configurados
- [ ] Loading states implementados

## Referências

- Ver diretriz completa em: `00_Guidelines/architecture.mdc`

