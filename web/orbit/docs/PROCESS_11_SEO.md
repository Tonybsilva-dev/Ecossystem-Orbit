# 🔍 Checklist de SEO

**Projeto:** [Nome do Projeto]
**Data:** DD/MM/AAAA

## 1. Meta Tags Essenciais

- [ ] Title tag (50-60 caracteres, único por página)
- [ ] Meta description (120-160 caracteres)
- [ ] Meta keywords (relevantes ao conteúdo)
- [ ] Canonical URL configurada
- [ ] Meta robots (`index, follow` ou `noindex, nofollow`)
- [ ] Meta author e publisher

## 2. Open Graph e Social

- [ ] og:title
- [ ] og:description
- [ ] og:image (URL completa)
- [ ] og:url
- [ ] og:type
- [ ] og:site_name
- [ ] og:locale (pt_BR)
- [ ] twitter:card
- [ ] twitter:title
- [ ] twitter:description
- [ ] twitter:image

## 3. Schema.org

- [ ] Schema.org markup (JSON-LD) implementado
- [ ] Tipo apropriado definido (WebPage, Article, Product, etc.)
- [ ] Dados estruturados validados

## 4. Imagens

- [ ] Todas as imagens têm alt text descritivo
- [ ] Todas as imagens têm title attribute
- [ ] Nomes de arquivo descritivos
- [ ] Imagens otimizadas (WebP, lazy loading)

## 5. Links

- [ ] Todos os links têm title attribute
- [ ] Links externos têm `rel="noopener noreferrer"`
- [ ] Links internos corretos e funcionais
- [ ] Anchor text descritivo (não "clique aqui")

## 6. Headers (H1-H6)

- [ ] Um único H1 por página
- [ ] Hierarquia H1 → H2 → H3 → H4 (sem pular níveis)
- [ ] Headers descritivos e semânticos

## 7. HTML Base

- [ ] Lang correto no `<html>` tag (pt-BR)
- [ ] Charset UTF-8
- [ ] Viewport meta tag configurado

## 8. JavaScript SEO

- [ ] Conteúdo crítico renderizado no HTML inicial
- [ ] History API usado corretamente (não hash navigation)
- [ ] Sem soft 404s (páginas não encontradas retornam 404 real)
- [ ] Structured data em JSON-LD (não depende de JS)
- [ ] Links importantes usam `<a>` tags (não apenas JavaScript)

## 9. Core Web Vitals (SEO)

- [ ] LCP < 2.5 segundos
- [ ] FID < 100 milissegundos
- [ ] CLS < 0.1

## Referências

- Ver diretriz completa em: `00_Guidelines/seo.mdc`

