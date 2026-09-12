💈 Manual de Identidade Visual & UI: "The Heritage Cut"
Conceito Central: Industrial Vintage Moderno. A aplicação não deve parecer um "software", deve parecer uma extensão do ambiente físico da barbearia: masculino, sólido, confiável e atemporal. Evitamos o minimalismo estéril (branco total) e o "tech neon" (cyberpunk). Buscamos a elegância do couro, do aço e da madeira escura.

1. A Paleta de Cores (The Atmosphere)
   A base da aplicação é escura (Dark Mode by Default), evocando a intimidade e a exclusividade de um clube de cavalheiros.

Cores Primárias (Estrutura)
Midnight Slate (#0f172a - Slate 900): A cor de fundo principal. Não é preto absoluto, é um azul-acinzentado profundo, lembrando paredes pintadas em tons industriais.

Deep Charcoal (#1e293b - Slate 800): Para cartões, surfaces e menus laterais. Cria profundidade sem contraste agressivo.

Cores de Ação (Destaque)
Saddle Leather (#b45309 - Amber 700/800): A cor principal de interação (Botões, Links ativos). Remete ao couro envelhecido das cadeiras de barbeiro clássicas. Transmite calor e conforto.

Burnished Gold (#d4af37): Usado para detalhes de luxo: bordas finas, ícones de fidelidade (Coroas, Estrelas), status "Premium".

Chrome Silver (#94a3b8 - Slate 400): Para textos secundários, ícones inativos e linhas divisórias. Lembra o aço das tesouras e navalhas.

Cores Semânticas (Status)
Sucesso: Um verde floresta desaturado (#15803d). Nada de "verde neon".

Erro/Atenção: Um vermelho tijolo ou vinho (#b91c1c).

2. Tipografia (The Voice)
   A tipografia deve criar um contraste entre o "Tradicional" (Títulos) e o "Funcional" (Leitura).

Títulos (Headings): A Autoridade
Fonte: Playfair Display ou Cinzel.

Uso: Nomes de seções, Preços, Nomes dos Barbeiros.

Estilo: Serifada, elegante, com peso (Bold) para impor presença.

Exemplo: "O CORTE CLÁSSICO"

Corpo (Body): A Clareza
Fonte: Inter, Geist Sans ou DM Sans.

Uso: Textos longos, descrições de produtos, inputs de formulário, horários.

Estilo: Sans-serif moderna, geométrica, altamente legível em telas pequenas.

3. Elementos de UI (Componentes)
   Aqui definimos a "física" dos objetos na tela.

Botões (CTAs)
Forma: Cantos levemente arredondados (rounded-sm ou 2px). Evite botões totalmente redondos (rounded-full), pois queremos uma sensação de solidez, não de "fofura".

Estilo: Fundo Saddle Leather, texto branco ou creme.

Detalhe de Luxo: Uma borda interna sutil (inset shadow) ou uma borda dupla fina para lembrar molduras de espelhos antigos.

Estado (Hover/Active): Não muda de cor drasticamente; ele "afunda" ou fica levemente mais escuro, simulando um interruptor físico pesado.

Cartões (Cards)
Superfície: Deep Charcoal.

Borda: Uma borda muito fina (1px) na cor Slate 700 ou Chrome Silver com baixa opacidade.

Sombra: Sombras difusas e escuras para dar a impressão de que o cartão está "flutuando" levemente sobre a parede escura.

Imagens e Fotos
Tratamento: As fotos dos cortes e produtos não devem ser "cruas". Aplique uma leve vinheta (bordas escurecidas) via CSS e talvez um filtro de desaturação leve (90% de cor) para uniformizar o visual.

4. Movimento e Interação (Motion & Feel)
   Como usaremos Framer Motion, a animação dita a percepção de qualidade.

As Transições: Devem ser "Pesadas e Suaves" (Ease-out).

Exemplo: Ao abrir o menu lateral, ele não "aparece"; ele desliza como uma porta de correr pesada e bem lubrificada.

Microinterações:

Ao selecionar um horário: O clique deve ter um feedback visual imediato e firme.

Ao completar um agendamento: Use confetes metálicos (Gold/Silver) ao invés de coloridos.

5. Linguagem e Tom (Copywriting)
   Como a aplicação "fala" com o usuário?

Tom: Respeitoso, Masculino, Direto.

Não use: "Bora cortar?", "E aí, beleza?", "Ops, deu erro".

Use: "Agende seu momento", "Bem-vindo, Cavalheiro", "Não foi possível confirmar".

Nomenclaturas:

Em vez de "Carrinho", use "Sua Seleção" ou "Comanda".

Em vez de "Admin", use "Gestão" ou "Backoffice".

6. Exemplo de Aplicação (Cenário)
   Imagine a Tela de Agendamento:

Fundo: Azul escuro profundo (Slate 900) com uma textura de ruído (noise) quase imperceptível (3% de opacidade).

Topo: Título "Selecione o Profissional" em Playfair Display, cor Branco Antigo (#f1f5f9).

Lista: Fotos dos barbeiros em preto e branco (que ficam coloridas ao serem selecionadas).

Botão de Ação: Um bloco sólido marrom couro (Amber 700) com o texto "Confirmar Horário" em caixa alta, fonte sem serifa.

Este manual é o "Norte Magnético" do seu design. Sempre que tiver dúvida se um botão deve ser rosa ou azul, ou se a fonte deve ser fina ou grossa, consulte este "Soul".
