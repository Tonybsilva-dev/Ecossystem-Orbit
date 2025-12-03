# Tenant Domain - Plano de Testes

## Visão Geral

Este documento descreve a estratégia de testes, casos de teste e cobertura para o domínio **Tenant**.

### Estratégia de Testes

- **Testes Unitários**: Testes isolados de cada método do `TenantService`
- **Testes de Integração**: Testes com banco de dados real (usando Prisma)
- **Ferramenta**: Vitest
- **Abordagem**: Testes baseados em dados reais com limpeza antes/depois de cada teste

### Cobertura de Testes

- **Cobertura Atual**: 100% dos métodos públicos
- **Total de Testes**: 24 testes (14 para create/read + 10 para searchTenants)
- **Status**: ✅ Todos os testes passando

---

## Testes Unitários

### TenantService.create

#### TC-001: Criar Tenant com Dados Válidos
- **Descrição**: Deve criar tenant com todos os dados válidos
- **Entrada**: Dados completos de tenant e usuário
- **Saída Esperada**: Tenant criado com ID, usuário owner associado, senha hasheada
- **Validações**:
  - Tenant possui ID gerado
  - Nome e slug corretos
  - Status ACTIVE por padrão
  - Usuário owner criado com role OWNER
  - Senha foi hasheada
- **Status**: ✅ Passando

#### TC-002: Criar Tenant com PlanId Opcional
- **Descrição**: Deve criar tenant sem plano associado
- **Entrada**: Dados de tenant com planId null
- **Saída Esperada**: Tenant criado com planId null
- **Status**: ✅ Passando

#### TC-003: Rejeitar Slug Duplicado
- **Descrição**: Deve lançar erro ao tentar criar tenant com slug já existente
- **Entrada**: Dados de tenant com slug duplicado
- **Saída Esperada**: Erro "O slug \"{slug}\" já está em uso"
- **Status**: ✅ Passando

#### TC-004: Rejeitar Email Duplicado
- **Descrição**: Deve lançar erro ao tentar criar tenant com email já cadastrado
- **Entrada**: Dados de tenant com email duplicado
- **Saída Esperada**: Erro "O email \"{email}\" já está cadastrado"
- **Status**: ✅ Passando

#### TC-005: Rejeitar Dados Inválidos (Validação Zod)
- **Descrição**: Deve lançar erro ao fornecer dados inválidos
- **Entrada**: Dados com nome muito curto, email inválido, senha muito curta
- **Saída Esperada**: Erro de validação Zod
- **Status**: ✅ Passando

#### TC-006: Rejeitar Slug Inválido
- **Descrição**: Deve lançar erro ao fornecer slug com formato inválido
- **Entrada**: Slug com espaços e maiúsculas
- **Saída Esperada**: Erro mencionando "kebab-case"
- **Status**: ✅ Passando

#### TC-007: Status Padrão ACTIVE
- **Descrição**: Deve usar status ACTIVE quando não fornecido
- **Entrada**: Dados de tenant sem status
- **Saída Esperada**: Tenant criado com status ACTIVE
- **Status**: ✅ Passando

#### TC-008: Status Customizado
- **Descrição**: Deve aceitar status customizado
- **Entrada**: Dados de tenant com status INACTIVE
- **Saída Esperada**: Tenant criado com status INACTIVE
- **Status**: ✅ Passando

#### TC-009: Usuário Sem Nome (Opcional)
- **Descrição**: Deve criar tenant com usuário sem nome
- **Entrada**: Dados de tenant com usuário sem campo name
- **Saída Esperada**: Tenant criado, usuário com name null
- **Status**: ✅ Passando

---

### TenantService.findTenantBySlug

#### TC-010: Encontrar Tenant Existente
- **Descrição**: Deve encontrar tenant pelo slug e retornar apenas campos essenciais
- **Entrada**: Slug de tenant existente
- **Saída Esperada**: Tenant com campos: id, name, slug, status, planId, createdAt, updatedAt
- **Validações**:
  - Retorna apenas campos essenciais
  - Não inclui relacionamentos (users, plan, features)
- **Status**: ✅ Passando

#### TC-011: Retornar Null para Slug Inexistente
- **Descrição**: Deve retornar null quando slug não existe
- **Entrada**: Slug inexistente
- **Saída Esperada**: null
- **Status**: ✅ Passando

---

### TenantService.getAllTenants

#### TC-012: Retornar Array Vazio
- **Descrição**: Deve retornar array vazio quando não há tenants
- **Entrada**: Nenhuma (banco limpo)
- **Saída Esperada**: Array vazio []
- **Status**: ✅ Passando

#### TC-013: Retornar Todos os Tenants
- **Descrição**: Deve retornar todos os tenants cadastrados
- **Entrada**: Múltiplos tenants criados
- **Saída Esperada**: Array com todos os tenants
- **Validações**:
  - Array contém todos os tenants criados
  - Ordenado por data de criação (mais recentes primeiro)
- **Status**: ✅ Passando

#### TC-014: Verificar Ordenação
- **Descrição**: Deve retornar tenants ordenados por data de criação (mais recentes primeiro)
- **Entrada**: Múltiplos tenants criados com delay
- **Saída Esperada**: Array ordenado corretamente
- **Status**: ✅ Passando

---

## Casos de Teste por Funcionalidade

### Criação de Tenant

| ID | Cenário | Entrada | Saída Esperada | Status |
|----|---------|---------|----------------|--------|
| TC-001 | Dados válidos completos | Todos os campos válidos | Tenant criado com sucesso | ✅ |
| TC-002 | PlanId opcional | planId: null | Tenant criado sem plano | ✅ |
| TC-003 | Slug duplicado | Slug já existente | Erro específico | ✅ |
| TC-004 | Email duplicado | Email já cadastrado | Erro específico | ✅ |
| TC-005 | Dados inválidos | Campos com valores inválidos | Erro de validação | ✅ |
| TC-006 | Slug inválido | Slug com formato incorreto | Erro de validação | ✅ |
| TC-007 | Status padrão | Sem status fornecido | Status ACTIVE | ✅ |
| TC-008 | Status customizado | Status INACTIVE | Status INACTIVE | ✅ |
| TC-009 | Usuário sem nome | Sem campo name | name: null | ✅ |

### Busca de Tenant

| ID | Cenário | Entrada | Saída Esperada | Status |
|----|---------|---------|----------------|--------|
| TC-010 | Buscar por slug (otimizado) | Slug existente | Tenant com campos essenciais | ✅ |
| TC-011 | Slug inexistente | Slug não cadastrado | null | ✅ |

### Listagem de Tenants

| ID | Cenário | Entrada | Saída Esperada | Status |
|----|---------|---------|----------------|--------|
| TC-012 | Nenhum tenant | Banco vazio | Array vazio | ✅ |
| TC-013 | Múltiplos tenants | Vários tenants criados | Array com todos | ✅ |
| TC-014 | Ordenação | Tenants com timestamps diferentes | Ordenado corretamente | ✅ |

### Busca Full-Text (searchTenants)

| ID | Cenário | Entrada | Saída Esperada | Status |
|----|---------|---------|----------------|--------|
| TC-015 | Buscar por nome | Query "Acme" | Tenants com "Acme" no nome | ✅ |
| TC-016 | Buscar por slug | Query "enterprise" | Tenants com "enterprise" no slug | ✅ |
| TC-017 | Busca case-insensitive | Query "acme" (minúsculas) | Encontra "ACME" (maiúsculas) | ✅ |
| TC-018 | Nenhum resultado | Query inexistente | Array vazio | ✅ |
| TC-019 | Ordenação alfabética | Query "Company" | Resultados ordenados por nome | ✅ |
| TC-020 | Busca parcial | Query "prise" (substring) | Encontra "Enterprise" | ✅ |
| TC-021 | Query vazia | Query "" | Erro de validação | ✅ |
| TC-022 | Query apenas espaços | Query "   " | Erro de validação | ✅ |
| TC-023 | Trim automático | Query "  test  " | Remove espaços e busca | ✅ |
| TC-024 | Busca em múltiplos campos | Query "tech" | Encontra em name e slug | ✅ |

---

## Cobertura de Testes

### Métodos Cobertos

- ✅ `TenantService.create` - 9 testes
- ✅ `TenantService.findTenantBySlug` - 2 testes
- ✅ `TenantService.getAllTenants` - 3 testes
- ✅ `TenantService.searchTenants` - 10 testes

### Métodos Não Cobertos (Ainda)

- ⏳ `TenantService.findById` - Não testado ainda
- ⏳ `TenantService.findBySlug` - Não testado ainda
- ⏳ `TenantService.update` - Não testado ainda
- ⏳ `TenantService.list` - Não testado ainda

### Áreas de Cobertura

- ✅ Validação de entrada (Zod)
- ✅ Criação de tenant
- ✅ Criação de usuário owner
- ✅ Hash de senha
- ✅ Tratamento de erros (constraints únicas)
- ✅ Busca otimizada por slug
- ✅ Busca full-text por nome e slug (searchTenants)
- ✅ Listagem e ordenação

### Áreas Não Cobertas (Ainda)

- ⏳ Atualização de tenant
- ⏳ Busca por ID
- ⏳ Busca por slug (versão completa)

---

## Resultados dos Testes

### Execução Mais Recente

```
✓ app/core/domain/tenant/tenant.service.test.ts (24 tests) 5590ms
  ✓ TenantService.create > deve criar um tenant com dados válidos
  ✓ TenantService.create > deve criar tenant com planId opcional
  ✓ TenantService.create > deve rejeitar criação com slug duplicado
  ✓ TenantService.create > deve rejeitar criação com email duplicado
  ✓ TenantService.create > deve rejeitar dados inválidos (validação Zod)
  ✓ TenantService.create > deve rejeitar slug inválido (validação Zod)
  ✓ TenantService.create > deve criar tenant com status padrão ACTIVE quando não fornecido
  ✓ TenantService.create > deve criar tenant com status customizado
  ✓ TenantService.create > deve criar tenant com usuário sem nome (opcional)
  ✓ TenantService.searchTenants > deve retornar tenants que correspondem à busca por nome
  ✓ TenantService.searchTenants > deve retornar tenants que correspondem à busca por slug
  ✓ TenantService.searchTenants > deve fazer busca case-insensitive
  ✓ TenantService.searchTenants > deve retornar array vazio quando nenhum tenant corresponde
  ✓ TenantService.searchTenants > deve retornar resultados ordenados por nome (ascendente)
  ✓ TenantService.searchTenants > deve fazer busca parcial (substring)
  ✓ TenantService.searchTenants > deve lançar erro quando query está vazia
  ✓ TenantService.searchTenants > deve lançar erro quando query contém apenas espaços
  ✓ TenantService.searchTenants > deve fazer trim da query antes de buscar
  ✓ TenantService.searchTenants > deve buscar em ambos os campos (name e slug) simultaneamente
  ✓ TenantService.findTenantBySlug > deve encontrar um tenant existente pelo slug
  ✓ TenantService.findTenantBySlug > deve retornar null para slug inexistente
  ✓ TenantService.getAllTenants > deve retornar array vazio quando não há tenants
  ✓ TenantService.getAllTenants > deve retornar todos os tenants cadastrados
  ✓ TenantService.getAllTenants > deve retornar tenants ordenados por data de criação (mais recentes primeiro)

Test Files  1 passed (1)
     Tests  24 passed (24)
  Duration  5.59s
```

### Métricas

- **Total de Testes**: 24
- **Testes Passando**: 24 (100%)
- **Testes Falhando**: 0
- **Tempo de Execução**: ~5.59s
- **Cobertura de Código**: ~80% (estimado)

---

## Observações

### Limpeza de Dados

Todos os testes utilizam `beforeEach` e `afterEach` para garantir isolamento:
- Limpeza de dados de teste antes e depois de cada teste
- Filtros por prefixo "test-" para evitar conflitos
- Limpeza em cascata (users → tenants)

### Dados de Teste

- Prefixo "test-" usado em todos os dados de teste
- Emails: `test-*@example.com`
- Slugs: `test-*`
- Isolamento completo entre testes

### Próximos Passos

1. Adicionar testes para `findById`
2. Adicionar testes para `findBySlug` (versão completa)
3. Adicionar testes para `update`
4. Adicionar testes para `list`
5. ✅ Implementar busca full-text (searchTenants) - **Concluído**
6. Aumentar cobertura de código para 90%+

---

## Detalhes dos Testes de Busca Full-Text

### TenantService.searchTenants

#### TC-015: Retornar tenants que correspondem à busca por nome
- **Descrição**: Deve retornar apenas tenants cujo nome contém a query de busca
- **Setup**: Criar múltiplos tenants com nomes diferentes
- **Entrada**: Query "Acme"
- **Saída Esperada**: Array com tenants que têm "Acme" no nome, ordenados por nome
- **Validações**:
  - Retorna apenas tenants que correspondem
  - Não retorna tenants que não correspondem
  - Resultados ordenados por nome (ascendente)
- **Status**: ✅ Passando

#### TC-016: Retornar tenants que correspondem à busca por slug
- **Descrição**: Deve retornar tenants cujo slug contém a query de busca
- **Setup**: Criar múltiplos tenants com slugs diferentes
- **Entrada**: Query "enterprise"
- **Saída Esperada**: Array com tenants que têm "enterprise" no slug
- **Status**: ✅ Passando

#### TC-017: Fazer busca case-insensitive
- **Descrição**: Deve encontrar tenants independente de maiúsculas/minúsculas
- **Setup**: Criar tenant com nome em maiúsculas
- **Entrada**: Query "acme" (minúsculas)
- **Saída Esperada**: Encontra tenant com "ACME" no nome
- **Status**: ✅ Passando

#### TC-018: Retornar array vazio quando nenhum tenant corresponde
- **Descrição**: Deve retornar array vazio quando a query não encontra resultados
- **Setup**: Criar tenant com nome diferente
- **Entrada**: Query "xyz-nonexistent-123"
- **Saída Esperada**: Array vazio `[]`
- **Status**: ✅ Passando

#### TC-019: Retornar resultados ordenados por nome (ascendente)
- **Descrição**: Deve retornar resultados ordenados alfabeticamente por nome
- **Setup**: Criar múltiplos tenants com nomes em ordem diferente
- **Entrada**: Query "Company"
- **Saída Esperada**: Array ordenado alfabeticamente (Alpha, Beta, Zebra)
- **Status**: ✅ Passando

#### TC-020: Fazer busca parcial (substring)
- **Descrição**: Deve encontrar tenants usando substring da query
- **Setup**: Criar tenant com nome "Enterprise Solutions Inc"
- **Entrada**: Query "prise" (substring)
- **Saída Esperada**: Encontra o tenant
- **Status**: ✅ Passando

#### TC-021: Lançar erro quando query está vazia
- **Descrição**: Deve lançar erro de validação quando query é vazia
- **Entrada**: Query ""
- **Saída Esperada**: Erro contendo "vazia"
- **Status**: ✅ Passando

#### TC-022: Lançar erro quando query contém apenas espaços
- **Descrição**: Deve lançar erro quando query tem apenas espaços (após trim)
- **Entrada**: Query "   "
- **Saída Esperada**: Erro contendo "vazia"
- **Status**: ✅ Passando

#### TC-023: Fazer trim da query antes de buscar
- **Descrição**: Deve remover espaços no início e fim da query antes de buscar
- **Setup**: Criar tenant
- **Entrada**: Query "  Trim Test  " (com espaços)
- **Saída Esperada**: Encontra o tenant (trim aplicado)
- **Status**: ✅ Passando

#### TC-024: Buscar em ambos os campos (name e slug) simultaneamente
- **Descrição**: Deve buscar em name E slug, retornando tenants que correspondem em qualquer um dos campos
- **Setup**: Criar tenants onde um tem match no nome e outro no slug
- **Entrada**: Query "tech"
- **Saída Esperada**: Array com ambos os tenants (um match no nome, outro no slug)
- **Status**: ✅ Passando

### Resumo dos Testes de Busca Full-Text

- **Total de Testes**: 10
- **Testes Passando**: 10 ✅
- **Testes Falhando**: 0
- **Cobertura**: 
  - Busca por nome
  - Busca por slug
  - Busca case-insensitive
  - Busca parcial (substring)
  - Ordenação alfabética
  - Validação de entrada (vazia, apenas espaços)
  - Trim automático
  - Busca em múltiplos campos simultaneamente

### Observações Técnicas

- A busca usa `contains` com `mode: 'insensitive'` do Prisma
- Índices foram adicionados nos campos `name` e `slug` para otimização
- A validação é feita com Zod antes da busca
- Os resultados são sempre ordenados por nome (ascendente)
- A função faz trim automático da query antes de buscar

---

**Última atualização**: 2024-12-03  
**Versão**: 2.0.0

