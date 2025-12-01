# 🗄️ Checklist de Zustand - State Management

**Projeto:** [Nome do Projeto]
**Data:** DD/MM/AAAA

## 1. Estrutura de Stores

- [ ] Stores organizados por domínio
- [ ] Um store por domínio (não misturar responsabilidades)
- [ ] Barrel exports em `index.ts`
- [ ] Interfaces bem definidas

## 2. Uso Correto

- [ ] Zustand usado apenas para estado global
- [ ] Estado de UI (modais, filtros, preferências) em Zustand
- [ ] Dados do servidor em React Query (não em Zustand)
- [ ] Nenhum `useState` para estado compartilhado

## 3. Persistência

- [ ] Persist middleware aplicado quando necessário
- [ ] Nome do storage único e descritivo
- [ ] Apenas dados importantes persistidos
- [ ] Limpeza de storage no signOut

## 4. Performance

- [ ] Selectors implementados para evitar re-renders
- [ ] Não usar todo o store quando apenas uma propriedade é necessária
- [ ] DevTools habilitado em desenvolvimento

## 5. Sincronização

- [ ] Sincronização com autenticação quando aplicável
- [ ] Múltiplas fontes de verdade evitadas
- [ ] Estado consistente entre componentes

## 6. Tipos

- [ ] Interfaces TypeScript bem definidas
- [ ] Tipos exportados e reutilizáveis
- [ ] Actions tipadas corretamente

## Referências

- Ver diretriz completa em: `00_Guidelines/zustand.mdc`

