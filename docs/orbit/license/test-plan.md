# License Domain - Plano de Testes

## Visão Geral

Este documento descreve a estratégia de testes, casos de teste e cobertura para o domínio **License**.

### Estratégia de Testes

- **Testes de Integração**: Testes com banco de dados real (usando Prisma)
- **Ferramenta**: Vitest
- **Abordagem**: Testes baseados em dados reais com limpeza antes/depois de cada teste
- **Isolamento**: Cada teste cria seus próprios dados e limpa após execução

### Cobertura de Testes

- **Cobertura Atual**: 100% da função `resolvePermissions`
- **Total de Testes**: 7 testes
- **Status**: ✅ Todos os testes passando

---

## Testes de Integração

### resolvePermissions

#### TC-001: Tenant com Apenas Plano Base
- **Descrição**: Deve retornar apenas features do plano quando tenant não tem overrides
- **Setup**: Criar plano com features ['COUPONS', 'WHATSAPP', 'EMAIL'] e tenant associado
- **Entrada**: ID do tenant
- **Saída Esperada**: ['COUPONS', 'WHATSAPP', 'EMAIL']
- **Validações**:
  - Array contém exatamente 3 features
  - Todas as features do plano estão presentes
  - Ordem não importa (Set não garante ordem)
- **Status**: ✅ Passando

#### TC-002: Tenant sem Plano
- **Descrição**: Deve retornar array vazio quando tenant não tem plano
- **Setup**: Criar tenant sem plano associado
- **Entrada**: ID do tenant
- **Saída Esperada**: []
- **Validações**:
  - Array está vazio
  - Não lança erro
- **Status**: ✅ Passando

#### TC-003: Tenant com Plano e Overrides
- **Descrição**: Deve combinar features do plano com overrides do tenant
- **Setup**: 
  - Criar plano com ['COUPONS', 'WHATSAPP']
  - Criar tenant com plano
  - Adicionar override 'ADVANCED_ANALYTICS'
- **Entrada**: ID do tenant
- **Saída Esperada**: ['COUPONS', 'WHATSAPP', 'ADVANCED_ANALYTICS']
- **Validações**:
  - Array contém features do plano
  - Array contém features de override
  - Total de 3 features
- **Status**: ✅ Passando

#### TC-004: Tenant sem Plano mas com Overrides
- **Descrição**: Deve retornar apenas features de override quando tenant não tem plano
- **Setup**:
  - Criar tenant sem plano
  - Adicionar overrides ['CUSTOM_FEATURE_1', 'CUSTOM_FEATURE_2']
- **Entrada**: ID do tenant
- **Saída Esperada**: ['CUSTOM_FEATURE_1', 'CUSTOM_FEATURE_2']
- **Validações**:
  - Array contém apenas overrides
  - Não contém features de plano
- **Status**: ✅ Passando

#### TC-005: Remover Duplicatas
- **Descrição**: Deve remover duplicatas quando override repete feature do plano
- **Setup**:
  - Criar plano com ['COUPONS', 'WHATSAPP']
  - Criar tenant com plano
  - Adicionar override 'COUPONS' (duplicata) e 'NEW_FEATURE'
- **Entrada**: ID do tenant
- **Saída Esperada**: ['COUPONS', 'WHATSAPP', 'NEW_FEATURE'] (sem duplicata)
- **Validações**:
  - Array contém 3 features (não 4)
  - 'COUPONS' aparece apenas uma vez
  - Verificação: `permissions.filter(p => p === 'COUPONS').length === 1`
- **Status**: ✅ Passando

#### TC-006: Tenant Não Encontrado
- **Descrição**: Deve lançar erro quando tenant não existe
- **Setup**: Nenhum (usar ID inexistente)
- **Entrada**: UUID inexistente
- **Saída Esperada**: Erro "Tenant with id \"{id}\" not found"
- **Validações**:
  - Erro é lançado
  - Mensagem contém ID fornecido
- **Status**: ✅ Passando

#### TC-007: Múltiplos Overrides com Unicidade
- **Descrição**: Deve garantir unicidade mesmo com múltiplos overrides
- **Setup**:
  - Criar plano com ['BASE_FEATURE']
  - Criar tenant com plano
  - Adicionar múltiplos overrides ['FEATURE_1', 'FEATURE_2', 'FEATURE_3']
- **Entrada**: ID do tenant
- **Saída Esperada**: ['BASE_FEATURE', 'FEATURE_1', 'FEATURE_2', 'FEATURE_3']
- **Validações**:
  - Array contém 4 features
  - Todas as features estão presentes
  - Sem duplicatas
- **Status**: ✅ Passando

---

## Casos de Teste por Funcionalidade

### Resolução de Permissões

| ID | Cenário | Setup | Entrada | Saída Esperada | Status |
|----|---------|-------|---------|----------------|--------|
| TC-001 | Tenant com plano | Plano com 3 features | tenantId | Array com 3 features | ✅ |
| TC-002 | Tenant sem plano | Tenant sem plano | tenantId | Array vazio | ✅ |
| TC-003 | Plano + overrides | Plano + 1 override | tenantId | Array combinado | ✅ |
| TC-004 | Apenas overrides | Sem plano, 2 overrides | tenantId | Array com overrides | ✅ |
| TC-005 | Remover duplicatas | Plano + override duplicado | tenantId | Array sem duplicatas | ✅ |
| TC-006 | Tenant inexistente | Nenhum | UUID inválido | Erro | ✅ |
| TC-007 | Múltiplos overrides | Plano + 3 overrides | tenantId | Array único | ✅ |

---

## Cobertura de Testes

### Funções Cobertas

- ✅ `resolvePermissions` - 7 testes

### Áreas de Cobertura

- ✅ Resolução com plano base
- ✅ Resolução sem plano
- ✅ Combinação de plano e overrides
- ✅ Remoção de duplicatas
- ✅ Tratamento de erro (tenant não encontrado)
- ✅ Múltiplos overrides
- ✅ Unicidade de features

### Áreas Não Cobertas (Ainda)

- ⏳ Validação de acesso público (`ValidateAccessInput`/`ValidateAccessOutput`)
- ⏳ Cache de permissões resolvidas
- ⏳ Performance com muitos overrides
- ⏳ Validação de formato de features

---

## Resultados dos Testes

### Execução Mais Recente

```
✓ app/domains/license/license.engine.test.ts (7 tests) 1151ms
  ✓ resolvePermissions > deve retornar features do plano base quando tenant tem apenas plano
  ✓ resolvePermissions > deve retornar array vazio quando tenant não tem plano
  ✓ resolvePermissions > deve combinar features do plano base com overrides do tenant
  ✓ resolvePermissions > deve retornar apenas features de override quando tenant não tem plano
  ✓ resolvePermissions > deve remover duplicatas quando override repete feature do plano
  ✓ resolvePermissions > deve lançar erro quando tenant não existe
  ✓ resolvePermissions > deve retornar features únicas mesmo com múltiplos overrides

Test Files  1 passed (1)
     Tests  7 passed (7)
  Duration  2.26s
```

### Métricas

- **Total de Testes**: 7
- **Testes Passando**: 7 (100%)
- **Testes Falhando**: 0
- **Tempo de Execução**: ~2.26s
- **Cobertura de Código**: ~100% (função `resolvePermissions`)

---

## Observações

### Limpeza de Dados

Todos os testes utilizam `beforeEach` e `afterEach` para garantir isolamento:
- Limpeza de `TenantFeature` (com filtro por tenant slug)
- Limpeza de `User` (com filtro por email prefixo "test-")
- Limpeza de `Tenant` (com filtro por slug prefixo "test-")
- Limpeza de `Plan` (com filtro por name prefixo "Test Plan")

### Dados de Teste

- Prefixo "test-" usado em todos os dados de teste
- Emails: `test-*@example.com`
- Slugs: `test-*`
- Plan names: `Test Plan *`
- Isolamento completo entre testes

### Dependências entre Testes

- Testes dependem de `TenantService.create` para criar dados
- Testes dependem de Prisma para criar Plans e TenantFeatures
- Cada teste é independente e pode rodar isoladamente

---

## Próximos Passos

1. Implementar validação de acesso público (`ValidateAccessInput`/`ValidateAccessOutput`)
2. Adicionar testes de performance com muitos overrides
3. Implementar cache de permissões resolvidas
4. Adicionar validação de formato de features
5. Adicionar testes de integração com API pública

---

**Última atualização**: 2024-12-02  
**Versão**: 1.0.0

