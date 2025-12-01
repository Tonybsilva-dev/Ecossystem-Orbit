# ✅ Checklist de Validações - Zod + React Hook Form

**Projeto:** [Nome do Projeto]
**Data:** DD/MM/AAAA

## 1. Schemas Atômicos

- [ ] Schemas atômicos criados e reutilizáveis (id, name, description, url, etc.)
- [ ] Blocos comuns definidos (timestamp, base, etc.)
- [ ] Composição via `.merge()` e `.extend()` implementada
- [ ] Nenhuma duplicação de schemas similares

## 2. Reuso entre Create/Update

- [ ] Schema base criado
- [ ] Schema de update estende o base
- [ ] Schema de create reutiliza o update (omit/extend)
- [ ] Tipos derivados com `z.infer`

## 3. Mensagens

- [ ] Mensagens em PT-BR
- [ ] Mensagens curtas e orientadas à ação
- [ ] Mensagens não técnicas
- [ ] `required_error` definido para campos obrigatórios

## 4. Integração com React Hook Form

- [ ] `zodResolver` configurado
- [ ] `mode: onChange` em formulários de edição
- [ ] `mode: onSubmit` em fluxos críticos
- [ ] Erros mapeados para UI com `FormMessage`
- [ ] Atributos ARIA configurados

## 5. Validações de Arquivo/Upload

- [ ] Validação de tamanho no cliente
- [ ] Validação de tipo no cliente
- [ ] Backend continua autoridade final
- [ ] Mensagens de erro claras

## 6. Organização

- [ ] Schemas expostos via `validations/index.ts` (barrel export)
- [ ] Organização por domínio
- [ ] `.strict()` aplicado quando necessário

## 7. Anti-padrões Evitados

- [ ] Nenhuma duplicação de schemas
- [ ] Validação não apenas no submit (feedback imediato)
- [ ] Regras de negócio complexas não no schema (service/usecase)

## Referências

- Ver diretriz completa em: `00_Guidelines/validations.mdc`

