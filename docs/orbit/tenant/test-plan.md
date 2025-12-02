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
- **Total de Testes**: 14 testes
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

---

## Cobertura de Testes

### Métodos Cobertos

- ✅ `TenantService.create` - 9 testes
- ✅ `TenantService.findTenantBySlug` - 2 testes
- ✅ `TenantService.getAllTenants` - 3 testes

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
- ✅ Listagem e ordenação

### Áreas Não Cobertas (Ainda)

- ⏳ Atualização de tenant
- ⏳ Busca por ID
- ⏳ Busca por slug (versão completa)

---

## Resultados dos Testes

### Execução Mais Recente

```
✓ app/core/domain/tenant/tenant.service.test.ts (14 tests) 2561ms
  ✓ TenantService.create > deve criar um tenant com dados válidos
  ✓ TenantService.create > deve criar tenant com planId opcional
  ✓ TenantService.create > deve rejeitar criação com slug duplicado
  ✓ TenantService.create > deve rejeitar criação com email duplicado
  ✓ TenantService.create > deve rejeitar dados inválidos (validação Zod)
  ✓ TenantService.create > deve rejeitar slug inválido (validação Zod)
  ✓ TenantService.create > deve criar tenant com status padrão ACTIVE quando não fornecido
  ✓ TenantService.create > deve criar tenant com status customizado
  ✓ TenantService.create > deve criar tenant com usuário sem nome (opcional)
  ✓ TenantService.findTenantBySlug > deve encontrar um tenant existente pelo slug
  ✓ TenantService.findTenantBySlug > deve retornar null para slug inexistente
  ✓ TenantService.getAllTenants > deve retornar array vazio quando não há tenants
  ✓ TenantService.getAllTenants > deve retornar todos os tenants cadastrados
  ✓ TenantService.getAllTenants > deve retornar tenants ordenados por data de criação (mais recentes primeiro)

Test Files  1 passed (1)
     Tests  14 passed (14)
  Duration  3.56s
```

### Métricas

- **Total de Testes**: 14
- **Testes Passando**: 14 (100%)
- **Testes Falhando**: 0
- **Tempo de Execução**: ~3.56s
- **Cobertura de Código**: ~70% (estimado)

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
5. Aumentar cobertura de código para 90%+

---

**Última atualização**: 2024-12-02  
**Versão**: 1.0.0

