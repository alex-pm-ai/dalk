# Relatório de Testes de Usabilidade — Mindfast (ex-DALK)

> **Atualização (07/08/2026):** todos os itens abaixo foram corrigidos na
> branch `rebrand/mindfast` (commits `ecbdad5`, `90a9480`, `795cd79`,
> `cdcd087`, `cb5a2ed`), exceto **"esqueci minha senha"**, que ficou
> deliberadamente de fora — exigiria um serviço de e-mail no backend que não
> existe hoje. Os ícones do cabeçalho foram removidos (em vez de ganhar
> função) e o Dashboard vazio agora mostra uma orientação para o novo
> usuário.

**Data:** 07/08/2026
**Ambiente:** local (`http://localhost:5173` + API local em `:3333`), branch `rebrand/mindfast`
**Conta de teste:** `alex.local@teste.com` (assinatura Mensal ativa via MockGateway)
**Método:** navegação manual por todas as telas do menu lateral, inspeção de console/rede do navegador, teste de responsividade em viewport mobile (375×812)

## Fluxos mapeados

| Fluxo | Telas envolvidas | Resultado |
|---|---|---|
| Cadastro → Login → Paywall → Pagamento mock → Acesso liberado | Login, Assinar | Funciona de ponta a ponta (testado em sessão anterior) |
| Ver progresso do dia | Dashboard | OK, mas todos os dados zerados sem nenhuma orientação de "primeiro uso" |
| Ver desempenho histórico | Desempenho | OK, mas gráficos com cor fora do padrão visual (ver #3) |
| Consultar histórico de sessões | Histórico | OK, bom estado vazio |
| Cadastrar simulado | Simulados → modal "Adicionar Simulado" | Formulário funciona, mas modal com cor antiga (ver #1) |
| Planejar revisão intensiva pré-prova | Foco Prova | Lista de conteúdo carrega, mas com bug de dados (ver #2) |
| Gerenciar tarefas + Pomodoro | To-Do & Pomodoro | Funciona |
| Ajustar algoritmo de repetição espaçada | Configuração de revisão | Funciona, boa clareza visual das faixas (Atenção/Bom/Excelente) |
| Adicionar revisão | Sidebar → modal "Adicionar Nova Revisão" | Funciona, mesmo bug visual do modal (ver #1) |
| Uso em celular | Todas as telas | **Não funcional** (ver #5) |

## Problemas técnicos (bugs)

### 1. Modais e painéis pequenos ainda usam a cor antiga do tema — **Alta prioridade**
`Modal.tsx` e outros 3 arquivos ficaram com hex fixo (`#111827`, `#1a2035`) que não foi atualizado durante o rebranding para Mindfast — enquanto o resto da tela já está no novo tom escuro/verde, esses elementos aparecem com fundo azulado, quebrando a consistência visual.

Ocorrências exatas:
- `src/components/ui/Modal.tsx:25` — fundo de todo modal (afeta "Adicionar Revisão" e "Adicionar Simulado")
- `src/components/modals/AddRevisaoModal.tsx:156,171` — pílulas "TOTAL"/"ACERTOS"
- `src/pages/FocoProva.tsx:133` — pílula "VEZES"
- `src/pages/Desempenho.tsx:99` e `src/pages/Simulados.tsx:89` — painéis de detalhe

### 2. Chave duplicada em `src/data/areas.ts` — **Média prioridade**
O item **"Transtorno bipolar"** aparece duas vezes na lista de subáreas de "Clínica Médica". Isso gera warning do React (`Encountered two children with the same key`) em qualquer tela que renderize essa lista (confirmado em Configuração de Revisão/Foco Prova) e pode causar itens duplicados ou sumindo da lista de seleção — comportamento não garantido pelo React.

### 3. Gráficos (Recharts) não seguem a nova identidade visual — **Alta prioridade**
As cores dos gráficos em **Desempenho** e **Simulados** estão fixas em hexadecimal direto no código (não usam os tokens do Tailwind, por isso o rebranding anterior não alcançou esses arquivos):
- Linha "Questões" em Desempenho: azul `#3b82f6` (deveria ser o verde-amarelo `primary`)
- Linhas de grade dos gráficos: `#1e2a3b` (cor de borda antiga, antes da troca pra `rgba(255,255,255,0.09)`)
- Radar chart em Simulados: `#818cf8` (indigo)

Resultado: as telas com gráfico são as que mais "destoam" visualmente do resto do app já rebrandado.

### 4. Chamadas de autenticação duplicadas ao carregar o app — **Baixa prioridade**
Toda vez que o app carrega, `/auth/me` e `/auth/refresh` disparam **duas vezes cada** (visível na aba de rede: 2× 401 em `/auth/me` → 2× `/auth/refresh` → 3× `/auth/me` bem-sucedido). Provavelmente efeito do `StrictMode` do React 19 em ambiente de desenvolvimento combinado com a falta de proteção contra chamadas concorrentes em `authStore.carregarMe()`. Não deve afetar o build de produção, mas consome ciclos de rotação de refresh token sem necessidade a cada carregamento — vale um guard (ex.: promise em andamento) se o time notar isso em produção também.

### 5. Layout não funciona em celular — **Alta prioridade / risco de produto**
Testado em viewport de 375×812 (tamanho de celular comum): a barra lateral (`Sidebar`, `fixed w-52`) não colapsa nem se transforma em menu, e o conteúdo principal (deslocado com `ml-52`) fica espremido numa coluna de ~170px. Cards de estatística ficam cortados/sobrepostos e aparece scroll horizontal. Não existe nenhum breakpoint responsivo no CSS do layout principal (`App.tsx`, `Sidebar.tsx`) — é uma limitação estrutural, não um ajuste pontual.

Relevante: a própria página de vendas do protótipo Mindfast lista **"Acesso via web e mobile"** como recurso incluso — hoje isso não é verdade no app real.

## Achados de UX/UI (não são bugs, mas valem discussão)

- **Ícones do cabeçalho sem função**: o ícone de livro e o de sino (notificações), presentes em todas as telas, não têm nenhuma ação ao clicar — dão a impressão de recursos quebrados ou incompletos. Se não há funcionalidade planejada a curto prazo, considerar removê-los até terem propósito.
- **Ícones sem rótulo acessível**: os mesmos dois ícones do cabeçalho e as flechas de navegação do calendário/semana não têm `aria-label`/`title` — prejudica leitores de tela e não tem custo para corrigir.
- **Sem "esqueci minha senha"** na tela de login — caminho padrão que usuários esperam, hoje inexistente.
- **Dashboard zerado sem orientação**: um usuário novo (sem nenhuma revisão/simulado cadastrado) vê três cards zerados e uma meta de "0/153" sem nenhuma dica de por-onde-começar (ex.: um CTA "Cadastre sua primeira revisão"). Comparar com os bons estados vazios de Histórico e Simulados, que pelo menos têm uma mensagem clara — o Dashboard poderia ter algo parecido.

## Pontos positivos

- Estados vazios de **Histórico** e **Simulados** são claros e bem resolvidos ("Nenhuma sessão encontrada" / "Nenhum simulado registrado").
- Tela de **Configuração de Revisão** comunica bem as faixas de aproveitamento com cor + barra de progresso (Atenção/Bom/Excelente).
- O fluxo completo de assinatura (cadastro → paywall → Pix mock → liberação) funciona sem fricção.
- Onde o rebranding foi aplicado (telas principais, botões, badges, sidebar), o resultado é visualmente consistente e o contraste texto/fundo no botão primário está correto.

## Recomendação de prioridade

1. Corrigir as 6 ocorrências de cor antiga (#1) e as cores dos gráficos (#3) — são o gap mais visível do rebranding e rápidos de corrigir.
2. Corrigir a chave duplicada em `areas.ts` (#2) — trivial, evita comportamento imprevisível.
3. Decidir o que fazer com os ícones mortos do cabeçalho (remover ou implementar).
4. Layout mobile (#5) é o item de maior esforço, mas também o de maior impacto se "acesso via mobile" for uma promessa real do produto — vale uma conversa à parte sobre prioridade/prazo.
