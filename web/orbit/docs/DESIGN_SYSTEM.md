# Orbit UI System: "The Command Center" (Blueprint)
**Baseado na arquitetura do "Heritage Cut" (BarberFlow), mas otimizado para densidade e controle.**

## Conceito Central: "Precision Control"
Ao contrário do BarberFlow, que evoca conforto e estilo vintage, o Orbit deve evocar **precisão, tecnologia e escala**.
É um painel de controle de satélites (SaaS), não uma barbearia.
- **Mood**: High-Tech, Crisp, Data-Dense.
- **Densidade**: Alta. Mais informações por pixel quadrado que o BarberFlow.
- **Formas**: Mais "técnicas" e funcionais.

---

## 1. A Paleta de Cores (The Void)

### Cores Primárias (Backgrounds)
- **Void Black (#020617 - Slate 950):** O fundo não é apenas escuro, é profundo.
- **Orbital Gray (#0f172a - Slate 900):** Para Sidebar e Cards. Levemente mais claro para criar camadas sem bordas excessivas.
- **Panel Gray (#1e293b - Slate 800):** Para inputs e áreas secundárias.

### Cor de Ação (Accent)
- **Quantum Violet (#7c3aed - Violet 600):** A cor principal. Vibrante, digital, "elétrica". Substitui o "Couro" do BarberFlow.
- **Data Blue (#3b82f6 - Blue 500):** Para links e informações informativas.

### Cores Semânticas
- **Success:** Emerald 500 (#10b981) - Nítido.
- **Error:** Rose 500 (#f43f5e) - Laser.
- **Warning:** Amber 400 (#fbbf24).

---

## 2. Tipografia (The Code)

### Títulos (Headings)
- **Fonte:** Inter (Tight Tracking) ou JetBrains Mono (para dados).
- **Estilo:** Sem Serifa, técnico.
- **Diferença do BarberFlow:** Não usamos Serifas. Títulos são funcionais, muitas vezes em CAIXA ALTA (UPPERCASE) com `tracking-wider` para parecerem rótulos de painel.

### Corpo (Body)
- **Fonte:** Inter.
- **Tamanho:** Base reduzida. Onde o BarberFlow usa `text-base` (16px), o Orbit usa `text-sm` (14px). Onde usa `sm`, usamos `xs`.

---

## 3. Elementos de UI (Componentes Mirror)

### Cards (Compactados)
- **Estrutura:** Igual ao BarberFlow (Header, Body, Footer).
- **Style:** Fundo `Slate 900`, Borda fina `Slate 800`.
- **Raio:** `rounded-md` (6px). Menos arredondado que o BarberFlow, mais "bloco de construção".
- **Padding:** Reduzido. `p-4` em vez de `p-6`.

### Botões
- **Altura:** `h-8` ou `h-9` (Compacto) vs `h-10+` do BarberFlow.
- **Style:** Fundo `Violet 600`, texto Branco. Hover: `Violet 500`.
- **Raio:** `rounded` (4px).

### Sidebar
- **Estrutura:** Igual ao BarberFlow (Backoffice Header, Nav Items, Footer).
- **Diferença:** Item height menor (`py-1.5` ou `py-2`). Font size `text-xs` ou `text-sm`.

---

## 4. Comparativo Direto

| Elemento | BarberFlow (Heritage) | Orbit (Command Center) |
| :--- | :--- | :--- |
| **Primary Color** | Saddle Leather (Amber) | Quantum Violet |
| **Background** | Slate 900 (Vintage) | Slate 950 (Void) |
| **Font Heading** | Playfair Display (Serif) | Inter (Sans/Mono) |
| **Card Radius** | `rounded-lg` / `rounded-xl` | `rounded-md` |
| **Density** | Comfortable (Airy) | Compact (Dense) |
| **Vibe** | "Gentleman's Club" | "Space Station Admin" |

---

## 5. Implementação Global
Para transformar o Orbit, devemos:
1.  **Refatorar Layout:** Adotar a estrutura de Sidebar + Header + Content Area do BarberFlow.
2.  **Compactar:** Reduzir paddings e font-sizes globalmente.
3.  **Recolorir:** Trocar a paleta "Glass/Aurora" pela paleta "Void/Violet".