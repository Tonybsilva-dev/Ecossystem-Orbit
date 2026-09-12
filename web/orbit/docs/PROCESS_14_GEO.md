# 🗺️ Checklist de GEO - Geolocalização e Mapas

**Projeto:** [Nome do Projeto]
**Data:** DD/MM/AAAA

## 1. Mapas e Visualização

- [ ] Biblioteca de mapas escolhida (Leaflet, Mapbox, Google Maps)
- [ ] Mapa inicializado com centro e zoom configurados
- [ ] Tile layer configurado
- [ ] Marcadores implementados com popups informativos
- [ ] Controles de zoom e navegação funcionais
- [ ] Responsividade em mobile e desktop testada
- [ ] Ajuste automático de view para mostrar todos os marcadores

## 2. Geolocalização do Usuário

- [ ] Solicitação de permissão implementada
- [ ] Tratamento de erros (permissão negada, timeout, indisponível)
- [ ] Mensagens amigáveis para o usuário
- [ ] Opções de geolocalização configuradas (enableHighAccuracy, timeout)
- [ ] Rastreamento contínuo implementado quando necessário
- [ ] Cleanup de watchers no unmount

## 3. Geocodificação

- [ ] Geocodificação (endereço → coordenadas) implementada
- [ ] Reverse geocoding (coordenadas → endereço) implementado
- [ ] Service de geocodificação criado
- [ ] Tratamento de erros e fallbacks
- [ ] Rate limiting respeitado (especialmente com APIs gratuitas)

## 4. Autocomplete de Endereços

- [ ] Autocomplete implementado com debounce
- [ ] Mínimo de caracteres configurado (recomendado: 3)
- [ ] Limite de sugestões configurado
- [ ] Loading state durante busca
- [ ] Seleção de sugestão funcional
- [ ] Limpeza de sugestões ao limpar input

## 5. Cálculo de Distâncias

- [ ] Função de cálculo de distância implementada (Haversine)
- [ ] Busca por raio funcional
- [ ] Ordenação por distância implementada
- [ ] Formatação de distâncias (km/m) configurada
- [ ] Distância exibida nos marcadores quando aplicável

## 6. Performance

- [ ] Lazy loading de bibliotecas de mapas
- [ ] Debounce em buscas de endereços (300ms recomendado)
- [ ] Cache de geocodificação implementado
- [ ] Limpeza de recursos (watchers, listeners, marcadores)
- [ ] Otimização de renderização de múltiplos marcadores

## 7. Privacidade e Permissões

- [ ] Consentimento de localização solicitado
- [ ] Política de privacidade clara sobre uso de localização
- [ ] Dados de localização não compartilhados sem consentimento
- [ ] Permissão verificada antes de usar geolocalização
- [ ] Feedback visual quando permissão negada

## 8. Acessibilidade

- [ ] Controles de mapa acessíveis por teclado
- [ ] Aria-labels em marcadores e controles
- [ ] Navegação por teclado funcional
- [ ] Screen reader compatibility

## Referências

- Ver diretriz completa em: `02_Biblioteca_Tecnica/00_Guidelines/geo.mdc`

