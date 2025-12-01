# ⚡ Checklist de Performance - Core Web Vitals

**Projeto:** [Nome do Projeto]
**Data:** DD/MM/AAAA

## 1. Core Web Vitals

- [ ] LCP (Largest Contentful Paint) < 2.5 segundos
- [ ] FCP (First Contentful Paint) < 1.8 segundos
- [ ] CLS (Cumulative Layout Shift) < 0.1
- [ ] INP (Interaction to Next Paint) < 200ms
- [ ] TBT (Total Blocking Time) < 200ms
- [ ] Speed Index < 3.4 segundos

## 2. Otimização de Imagens

- [ ] Todas as imagens têm `alt` e `title`
- [ ] Formatos modernos (WebP, AVIF) implementados
- [ ] Lazy loading em imagens abaixo da dobra
- [ ] Dimensões explícitas (width/height) para prevenir CLS
- [ ] Responsive images com `srcSet` quando necessário
- [ ] `fetchpriority="high"` apenas para imagens hero críticas

## 3. Code Splitting

- [ ] Rotas com lazy loading implementadas
- [ ] Componentes pesados com lazy loading
- [ ] Suspense boundaries apropriados
- [ ] Preload de rotas prováveis (on hover)

## 4. Cache

- [ ] React Query configurado com `staleTime` apropriado
- [ ] Memoização de cálculos pesados (`useMemo`)
- [ ] React.memo para componentes com props estáveis
- [ ] HTTP Cache Headers configurados no backend

## 5. Otimização de Rede

- [ ] Debounce em buscas e inputs
- [ ] Paginação ou infinite scroll para listas grandes
- [ ] Prefetch de dados prováveis
- [ ] Otimistic updates quando apropriado
- [ ] Request deduplication (React Query automático)

## 6. Bundle Size

- [ ] Bundle size analisado e otimizado
- [ ] Tree shaking funcionando corretamente
- [ ] Dependências não utilizadas removidas
- [ ] Imports específicos (não `import *`)
- [ ] Dynamic imports para bibliotecas grandes

## 7. Renderização

- [ ] CSS crítico inline ou preload
- [ ] Render-blocking JavaScript removido
- [ ] Fontes otimizadas com preload
- [ ] Preconnect/DNS-prefetch para recursos externos

## 8. Monitoramento

- [ ] Web Vitals configurado e enviando métricas
- [ ] Performance monitoring (Sentry/analytics)
- [ ] Lighthouse CI configurado
- [ ] Bundle analyzer configurado

## Referências

- Ver diretriz completa em: `00_Guidelines/performance.mdc`

