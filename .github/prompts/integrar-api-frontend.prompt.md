---
description: "Integra uma funcionalidade React com um endpoint existente do backend usando fetch."
name: integrar-api-frontend
argument-hint: "recurso, contrato da API e comportamento esperado"
agent: agent
---

# Integrar API no frontend

Implemente a integração frontend para `${input:recurso:recurso}` usando o contrato da API e o comportamento esperado descritos aqui:

${input:contrato:informe endpoints, entradas, respostas e estados da interface}

Antes de editar:

- Inspecione as rotas/controllers do backend e a especificação relacionada para confirmar caminhos, formatos e erros reais.
- Leia a página, os componentes e os serviços frontend existentes; siga suas convenções e preserve funcionalidades atuais.

Requisitos:

- Centralize chamadas HTTP com `fetch` em `frontend/src/services`, usando o prefixo `/api` e o proxy existente do Vite.
- Construa ou atualize componentes funcionais React com Hooks, reutilizando componentes adequados e evitando duplicação.
- Represente estados de carregamento, sucesso, lista vazia e erro conforme o fluxo; forneça ações de recuperação quando aplicável.
- Respeite os contratos do backend. Para `FormData`, não defina manualmente o cabeçalho `Content-Type`; para downloads, trate a resposta binária corretamente.
- Mantenha mensagens visíveis ao usuário em português, acessibilidade básica e o estilo já adotado no projeto.
- Não adicione dependências nem altere backend, contratos de API ou configuração do Vite sem necessidade demonstrável.

Validação:

- Execute `npm --prefix frontend run build`.
- Corrija falhas introduzidas pela mudança e informe quaisquer requisitos que não puderam ser verificados.