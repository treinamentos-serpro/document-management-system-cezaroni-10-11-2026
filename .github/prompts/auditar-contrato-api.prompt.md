---
description: "Audita divergências entre contratos Express e consumidores React/fetch do DMS sem alterar arquivos."
name: auditar-contrato-api
argument-hint: "endpoint, alteração ou 'API completa' para auditar"
agent: agent
---

# Auditar contrato entre API e frontend

Audite a compatibilidade entre o backend e seus consumidores frontend para `${input:escopo:endpoint, alteração ou API completa}`. Esta tarefa é somente leitura: não edite, crie ou formate arquivos.

## Descoberta

1. Leia a especificação aplicável, as rotas e controllers do backend e siga para os services apenas quando necessários para confirmar comportamento, validação ou erros.
2. Localize os consumidores correspondentes em `frontend/src/services` e os componentes que interpretam as respostas e erros.
3. Consulte o proxy do Vite e os testes existentes quando ajudarem a resolver uma incerteza. Não presuma que exista OpenAPI ou cliente gerado.

## Comparação

Compare backend e frontend nas duas direções, verificando somente os caminhos relevantes ao escopo:

- método HTTP e rota; normalize o prefixo `/api` usado pelo frontend, pois o proxy de desenvolvimento o remove antes de encaminhar ao backend;
- cabeçalhos, identificação de usuário e valores padrão;
- formato da requisição, campos obrigatórios e tipo de conteúdo, incluindo `multipart/form-data` e o campo de upload;
- status HTTP, formato JSON, nomes e tipos dos campos retornados;
- formato dos erros, códigos, status e como o frontend os apresenta;
- respostas binárias, tipo de conteúdo, nome de arquivo e tratamento de download;
- limites ou outras restrições que mudem o comportamento observável do cliente.

Considere as convenções do DMS: backend Express/CommonJS organizado em `routes -> controllers -> services -> repositories`; frontend React/Vite usando `fetch`; uploads locais via Multer; metadados em memória; testes backend com `node:test`. `X-User-Id` é um identificador organizacional com fallback `local`, não autenticação.

## Regras de evidência

- Compare os contratos implementados no código, usando a especificação como intenção e apontando quando ela divergir do comportamento real.
- Normalize parâmetros de rota, como `:id`, e compare caminhos equivalentes sem confundir `/api` com a rota registrada pelo Express.
- Não infira correspondência apenas por nomes parecidos. Se não localizar um consumidor, reporte-o como não encontrado no escopo pesquisado.
- Não declare quebra sem evidência do cenário afetado. Distinga divergência comprovada de lacuna que exige confirmação em runtime.
- Para cada afirmação, cite arquivos e símbolos ou linhas relevantes, separando fatos observados de hipóteses.
- Não proponha mudanças em larga escala; recomende a menor correção ou teste que resolva cada divergência confirmada.

## Formato do relatório

1. **Escopo verificado**: endpoints, arquivos backend e consumidores examinados.
2. **Matriz de compatibilidade**: método/rota, contrato do backend, uso no frontend e resultado (`compatível`, `divergência` ou `não localizado`).
3. **Achados**: ordene por severidade (`alta`, `média`, `baixa`); para cada um inclua evidência nos dois lados quando disponível, cenário de falha, impacto e correção mínima. Se não houver divergências, declare isso explicitamente para o escopo examinado.
4. **Limitações**: itens que não foi possível confirmar estaticamente e o próximo teste específico necessário.

Inspiração metodológica: [API Breaking Change Detector do awesome-copilot](https://github.com/github/awesome-copilot/tree/main/skills/api-breaking-change-detector), adaptado de ASP.NET/DTOs para Express, JavaScript e os contratos reais deste projeto.