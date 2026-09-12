# 🔒 Checklist de Segurança

**Projeto:** [Nome do Projeto]
**Data:** DD/MM/AAAA

## 1. Autenticação e Tokens

- [ ] Tokens nunca logados no console/Sentry
- [ ] Rotação de tokens via refresh implementada
- [ ] Cookies configurados com `secure` em produção
- [ ] `sameSite` configurado corretamente (`lax` ou `strict`)
- [ ] Interceptor de Auth trata 401 com refresh
- [ ] Interceptor não ejeta usuário em 404/429

## 2. Sentry e Logs

- [ ] `Authorization` removido de headers capturados
- [ ] Dados sensíveis sanitizados em `beforeSend`
- [ ] Logs verbosos apenas em `development`
- [ ] PII (Personally Identifiable Information) não logado

## 3. Headers de Segurança

- [ ] Content-Security-Policy configurado
- [ ] `X-Frame-Options: DENY`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy` configurado
- [ ] HSTS configurado em HTTPS

## 4. CORS/CSRF

- [ ] CORS configurado no backend
- [ ] Credenciais não enviadas para domínios não confiáveis
- [ ] Token CSRF considerado para ações sensíveis (se aplicável)

## 5. XSS (Cross-Site Scripting)

- [ ] `dangerouslySetInnerHTML` evitado
- [ ] Se necessário, sanitização com DOMPurify
- [ ] Inputs validados e normalizados (trim, limites, whitelist)

## 6. Storage

- [ ] Zustand ↔ cookies/localStorage sincronizado com parcimônia
- [ ] Múltiplas fontes de verdade evitadas
- [ ] SignOut limpa todas as chaves espelhadas

## 7. Validações

- [ ] Schemas Zod atualizados e reusados via merge/extend
- [ ] Validação no cliente e servidor
- [ ] Mensagens de erro amigáveis

## 8. Checklist de Pull Request

- [ ] Não há logs com tokens/PII
- [ ] Interceptor não ejeta usuário em 404/429
- [ ] CSP revisada quando adicionar novas origens
- [ ] Novos endpoints têm tratamento de erro adequado

## Referências

- Ver diretriz completa em: `00_Guidelines/security.mdc`

