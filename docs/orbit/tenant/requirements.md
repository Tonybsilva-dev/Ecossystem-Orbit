# Tenant Domain - Requisitos

## Visão Geral

O domínio **Tenant** é responsável pelo gerenciamento de tenants (organizações/clientes) no sistema SaaS Orbit. Cada tenant representa uma organização isolada com seus próprios usuários, configurações e assinaturas.

### Responsabilidades

- Cadastro e gerenciamento de tenants
- Validação de dados de entrada
- Criação automática de usuário owner ao criar tenant
- Operações de leitura otimizadas
- Tratamento de erros e constraints únicas

---

## Requisitos Funcionais

### RF-001: Criação de Tenant

**Descrição**: Sistema deve permitir criar novos tenants com validação completa de dados.

**Regras de Negócio**:
- Todo tenant deve ter um nome único (slug)
- Todo tenant deve ter um usuário owner criado automaticamente
- Slug deve seguir padrão kebab-case (apenas letras minúsculas, números e hífens)
- Slug não pode começar ou terminar com hífen
- Slug não pode conter hífens consecutivos
- Status padrão é `ACTIVE` se não fornecido
- PlanId é opcional (pode ser null)

**Validações**:
- Nome: mínimo 3, máximo 120 caracteres
- Slug: mínimo 3, máximo 50 caracteres, formato kebab-case
- Email do usuário: formato válido de email
- Senha do usuário: mínimo 8, máximo 100 caracteres
- PlanId: UUID válido se fornecido
- Status: enum (ACTIVE, INACTIVE, PAST_DUE)

**Tratamento de Erros**:
- Slug duplicado: mensagem específica "O slug \"{slug}\" já está em uso"
- Email duplicado: mensagem específica "O email \"{email}\" já está cadastrado"
- Dados inválidos: mensagem de validação do Zod em PT-BR

---

### RF-002: Busca de Tenant por ID

**Descrição**: Sistema deve permitir buscar tenant pelo ID único.

**Comportamento**:
- Retorna tenant completo com todos os relacionamentos
- Retorna `null` se tenant não existir
- Não realiza validações adicionais

---

### RF-003: Busca de Tenant por Slug

**Descrição**: Sistema deve permitir buscar tenant pelo slug único.

**Comportamento**:
- Retorna tenant completo com todos os relacionamentos
- Retorna `null` se tenant não existir
- Utiliza índice único do banco para performance

---

### RF-004: Busca Otimizada de Tenant por Slug

**Descrição**: Sistema deve permitir buscar tenant pelo slug retornando apenas campos essenciais.

**Otimização**:
- Retorna apenas: `id`, `name`, `slug`, `status`, `planId`, `createdAt`, `updatedAt`
- Não inclui relacionamentos (users, plan, features)
- Reduz overhead de query para casos onde relacionamentos não são necessários

---

### RF-005: Listagem de Todos os Tenants

**Descrição**: Sistema deve permitir listar todos os tenants cadastrados.

**Comportamento**:
- Retorna array de todos os tenants
- Ordenado por data de criação (mais recentes primeiro)
- Inclui todos os relacionamentos por padrão

---

### RF-006: Atualização de Tenant

**Descrição**: Sistema deve permitir atualizar dados de um tenant existente.

**Regras de Negócio**:
- Todos os campos são opcionais (atualização parcial)
- Campos não fornecidos não são alterados
- Validações aplicadas apenas aos campos fornecidos
- Não permite campos desconhecidos (strict mode)

---

## Modelos de Dados

### Entidade Tenant

```typescript
interface Tenant {
  id: string;              // UUID, gerado automaticamente
  name: string;            // Nome do tenant (3-120 caracteres)
  slug: string;           // Identificador único (3-50 caracteres, kebab-case)
  status: Status;         // ACTIVE | INACTIVE | PAST_DUE
  planId: string | null;  // ID do plano associado (opcional)
  createdAt: DateTime;     // Data de criação
  updatedAt: DateTime;     // Data de última atualização
  
  // Relacionamentos
  plan?: Plan;            // Plano associado
  users: User[];          // Usuários do tenant
  features: TenantFeature[]; // Features específicas do tenant
}
```

### Relacionamentos

- **Tenant → Plan**: Relação opcional (many-to-one)
- **Tenant → User**: Relação obrigatória (one-to-many)
- **Tenant → TenantFeature**: Relação opcional (one-to-many)

### Constraints

- `slug`: Único (unique constraint)
- `planId`: Foreign key para `Plan.id`
- `status`: Enum com valores fixos

---

## APIs e Interfaces

### TenantService.create

```typescript
static async create(data: unknown): Promise<Tenant>
```

**Parâmetros**:
- `data`: Dados do tenant e usuário inicial (validado com Zod)

**Retorno**:
- Tenant criado com `users` e `plan` incluídos

**Exceções**:
- `Error`: Validação falhou ou constraint única violada

---

### TenantService.findById

```typescript
static async findById(id: string): Promise<Tenant | null>
```

**Parâmetros**:
- `id`: UUID do tenant

**Retorno**:
- Tenant encontrado ou `null`

---

### TenantService.findBySlug

```typescript
static async findBySlug(slug: string): Promise<Tenant | null>
```

**Parâmetros**:
- `slug`: Slug único do tenant

**Retorno**:
- Tenant encontrado ou `null`

---

### TenantService.findTenantBySlug

```typescript
static async findTenantBySlug(slug: string): Promise<Partial<Tenant> | null>
```

**Parâmetros**:
- `slug`: Slug único do tenant

**Retorno**:
- Tenant com apenas campos essenciais ou `null`

**Otimização**:
- Usa `select` para retornar apenas campos necessários

---

### TenantService.getAllTenants

```typescript
static async getAllTenants(): Promise<Tenant[]>
```

**Retorno**:
- Array de todos os tenants ordenados por `createdAt` desc

---

### TenantService.update

```typescript
static async update(id: string, data: UpdateTenantInput): Promise<Tenant>
```

**Parâmetros**:
- `id`: UUID do tenant
- `data`: Dados parciais para atualização (validado com Zod)

**Retorno**:
- Tenant atualizado

---

## Casos de Uso

### UC-001: Criar Novo Tenant

**Fluxo Principal**:
1. Sistema recebe dados do tenant e usuário owner
2. Valida dados usando Zod schema
3. Hash da senha do usuário
4. Cria tenant no banco de dados
5. Cria usuário owner associado ao tenant
6. Retorna tenant criado com relacionamentos

**Fluxo Alternativo - Slug Duplicado**:
1. Sistema detecta slug duplicado
2. Lança erro específico: "O slug \"{slug}\" já está em uso"

**Fluxo Alternativo - Email Duplicado**:
1. Sistema detecta email duplicado
2. Lança erro específico: "O email \"{email}\" já está cadastrado"

**Fluxo Alternativo - Dados Inválidos**:
1. Sistema detecta dados inválidos na validação Zod
2. Lança erro com mensagem de validação em PT-BR

---

### UC-002: Buscar Tenant por Slug

**Fluxo Principal**:
1. Sistema recebe slug do tenant
2. Busca tenant no banco de dados
3. Retorna tenant encontrado

**Fluxo Alternativo - Tenant Não Encontrado**:
1. Sistema não encontra tenant com slug fornecido
2. Retorna `null`

---

### UC-003: Listar Todos os Tenants

**Fluxo Principal**:
1. Sistema busca todos os tenants no banco
2. Ordena por data de criação (mais recentes primeiro)
3. Retorna array de tenants

**Fluxo Alternativo - Nenhum Tenant**:
1. Sistema não encontra tenants
2. Retorna array vazio `[]`

---

## Requisitos Não-Funcionais

### Performance

- Busca por slug utiliza índice único do banco
- `findTenantBySlug` otimizado com `select` para reduzir overhead
- Listagem ordenada por índice de data de criação

### Segurança

- Senhas são hasheadas antes de armazenar (bcrypt)
- Validação de entrada com Zod previne SQL injection
- Mensagens de erro não expõem informações sensíveis

### Validação

- Todas as validações em PT-BR
- Mensagens de erro claras e orientadas à ação
- Validação de tipos em tempo de compilação (TypeScript)

---

## Dependências

- **Prisma**: ORM para acesso ao banco de dados
- **Zod**: Validação de schemas
- **bcryptjs**: Hash de senhas
- **PostgreSQL**: Banco de dados

---

**Última atualização**: 2024-12-02  
**Versão**: 1.0.0

