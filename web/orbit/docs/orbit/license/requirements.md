# License Domain - Requisitos

## Visão Geral

O domínio **License** é responsável pelo sistema de licenciamento e controle de features (permissões) do Orbit. Este domínio gerencia quais features estão disponíveis para cada tenant baseado em seu plano de assinatura e overrides específicos.

### Responsabilidades

- Resolução de permissões/features por tenant
- Combinação de features do plano base com overrides
- Validação de acesso e capabilities
- Desacoplamento entre engine de licenciamento e tipos Prisma

---

## Requisitos Funcionais

### RF-001: Resolução de Permissões (Features)

**Descrição**: Sistema deve calcular o conjunto final de features disponíveis para um tenant.

**Regras de Negócio**:
- Features do plano base são incluídas automaticamente
- Features de override do tenant são adicionadas ao conjunto
- Duplicatas são removidas automaticamente (usando Set)
- Tenant sem plano retorna apenas features de override
- Tenant sem plano e sem overrides retorna array vazio

**Fluxo de Resolução**:
1. Buscar tenant e plano associado
2. Extrair features base do plano (ou array vazio)
3. Buscar overrides específicos do tenant
4. Combinar ambos em conjunto único
5. Retornar array de features únicas

**Tratamento de Erros**:
- Tenant não encontrado: lança erro "Tenant with id \"{id}\" not found"

---

### RF-002: Definição de Tipos de Licenciamento

**Descrição**: Sistema deve definir tipos TypeScript para contratos de licenciamento.

**Tipos Definidos**:
- `ValidateAccessInput`: Entrada para validação pública
- `ValidateAccessOutput`: Saída da validação
- `Capability`: Alias para string de capability
- `LicenseValidationContext`: Contexto interno para validação

---

## Modelos de Dados

### Entidade Plan

```typescript
interface Plan {
  id: string;              // UUID
  name: string;           // Nome único do plano
  features: string[];     // Array de features (e.g., ['COUPONS', 'WHATSAPP'])
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

### Entidade TenantFeature

```typescript
interface TenantFeature {
  id: string;             // UUID
  tenantId: string;       // ID do tenant
  feature: string;        // Nome da feature (e.g., 'COUPONS', 'WHATSAPP')
  createdAt: DateTime;
}
```

### Relacionamentos

- **Tenant → Plan**: Relação opcional (many-to-one)
- **Tenant → TenantFeature**: Relação opcional (one-to-many)

### Constraints

- `Plan.name`: Único (unique constraint)
- `TenantFeature(tenantId, feature)`: Único (unique constraint)

---

## APIs e Interfaces

### resolvePermissions

```typescript
async function resolvePermissions(tenantId: string): Promise<string[]>
```

**Parâmetros**:
- `tenantId`: UUID do tenant

**Retorno**:
- Array de strings únicas representando features disponíveis

**Exceções**:
- `Error`: Tenant não encontrado

**Exemplo de Retorno**:
```typescript
['COUPONS', 'WHATSAPP', 'EMAIL', 'ADVANCED_ANALYTICS']
```

---

### ValidateAccessInput

```typescript
interface ValidateAccessInput {
  licenseKey: string;  // Chave de licença
  origin: string;      // Domínio de origem da requisição
}
```

**Uso**: Interface para entrada da API pública de validação de licença.

---

### ValidateAccessOutput

```typescript
interface ValidateAccessOutput {
  valid: boolean;              // Se a licença é válida
  capabilities: Capability[];   // Lista de capabilities disponíveis
}
```

**Uso**: Interface para saída da API pública de validação de licença.

---

### LicenseValidationContext

```typescript
interface LicenseValidationContext {
  tenantStatus: string;              // Status do tenant (ACTIVE, INACTIVE, etc.)
  planFeatures: string[];            // Features do plano base
  tenantFeatureOverrides: string[];  // Features de override do tenant
}
```

**Uso**: Contexto interno para desacoplar engine de tipos Prisma.

---

## Casos de Uso

### UC-001: Resolver Permissões - Tenant com Plano

**Fluxo Principal**:
1. Sistema recebe ID do tenant
2. Busca tenant e plano associado
3. Extrai features do plano (ex: ['COUPONS', 'WHATSAPP'])
4. Busca overrides do tenant
5. Combina features do plano com overrides
6. Retorna array único de features

**Exemplo**:
- Plano: ['COUPONS', 'WHATSAPP']
- Overrides: ['ADVANCED_ANALYTICS']
- Resultado: ['COUPONS', 'WHATSAPP', 'ADVANCED_ANALYTICS']

---

### UC-002: Resolver Permissões - Tenant sem Plano

**Fluxo Principal**:
1. Sistema recebe ID do tenant
2. Busca tenant (sem plano)
3. Retorna array vazio para features do plano
4. Busca overrides do tenant
5. Retorna apenas features de override

**Exemplo**:
- Plano: null
- Overrides: ['CUSTOM_FEATURE_1', 'CUSTOM_FEATURE_2']
- Resultado: ['CUSTOM_FEATURE_1', 'CUSTOM_FEATURE_2']

---

### UC-003: Resolver Permissões - Tenant sem Plano e sem Overrides

**Fluxo Principal**:
1. Sistema recebe ID do tenant
2. Busca tenant (sem plano)
3. Busca overrides (nenhum encontrado)
4. Retorna array vazio

**Exemplo**:
- Plano: null
- Overrides: []
- Resultado: []

---

### UC-004: Remover Duplicatas

**Fluxo Principal**:
1. Sistema combina features do plano e overrides
2. Usa Set para garantir unicidade
3. Retorna array sem duplicatas

**Exemplo**:
- Plano: ['COUPONS', 'WHATSAPP']
- Overrides: ['COUPONS', 'NEW_FEATURE']
- Resultado: ['COUPONS', 'WHATSAPP', 'NEW_FEATURE'] (sem duplicata de COUPONS)

---

### UC-005: Tenant Não Encontrado

**Fluxo Alternativo**:
1. Sistema recebe ID de tenant inexistente
2. Busca tenant no banco
3. Não encontra tenant
4. Lança erro: "Tenant with id \"{id}\" not found"

---

## Requisitos Não-Funcionais

### Performance

- Uso de `Set` para remoção eficiente de duplicatas
- Query otimizada com `select` para buscar apenas campo `feature` dos overrides
- Busca única do tenant com include do plano (1 query)

### Segurança

- Validação de existência do tenant antes de processar
- Mensagens de erro não expõem informações sensíveis
- Desacoplamento de tipos Prisma para maior segurança de tipos

### Escalabilidade

- Lógica stateless (sem estado compartilhado)
- Pode ser facilmente cacheada (resultado por tenantId)
- Suporta múltiplos tenants simultaneamente

---

## Dependências

- **Prisma**: ORM para acesso ao banco de dados
- **Tenant Domain**: Depende de estrutura de Tenant, Plan e TenantFeature
- **PostgreSQL**: Banco de dados

---

## Integrações

### Com Tenant Domain

- Utiliza modelo `Tenant` do Prisma
- Utiliza modelo `Plan` do Prisma
- Utiliza modelo `TenantFeature` do Prisma
- Não depende diretamente de `TenantService` (usa Prisma diretamente)

---

## Notas de Implementação

### Decisões de Design

1. **Uso de Set para Unicidade**: Decisão de usar `Set<string>` para garantir features únicas sem necessidade de lógica adicional de remoção de duplicatas.

2. **Desacoplamento de Prisma**: Tipos `LicenseValidationContext` permitem desacoplar a engine de tipos Prisma, facilitando testes e manutenção.

3. **Query Otimizada**: Uso de `select` em `TenantFeature.findMany` para buscar apenas o campo necessário, reduzindo overhead.

4. **Tratamento de Null**: Plano opcional tratado com `tenant.plan?.features || []` para evitar erros quando tenant não tem plano.

---

**Última atualização**: 2024-12-02  
**Versão**: 1.0.0

