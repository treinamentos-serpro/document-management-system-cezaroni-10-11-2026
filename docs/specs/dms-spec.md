# Especificação - Document Management System

## 1. Objetivo

Entregar uma aplicação web local que permita organizar documentos por usuário, enviar arquivos, consultar seus metadados e baixar os arquivos armazenados no filesystem da aplicação.

## 2. Escopo

### Dentro do escopo

- Enviar um arquivo por requisição.
- Listar os metadados dos documentos associados ao usuário da requisição.
- Baixar um documento pelo identificador, respeitando o usuário da requisição.
- Armazenar arquivos em `backend/storage` por padrão, usando Multer com `diskStorage`.
- Manter os metadados em memória durante a execução do processo.
- Disponibilizar uma interface React para upload, listagem e download.
- Exibir estados de carregamento, lista vazia e erros na interface.

### Fora do escopo

- Armazenamento em nuvem, bancos de dados ou provedores de upload externos.
- Persistência ou recuperação de metadados após reiniciar o backend.
- Versionamento, edição, exclusão ou compartilhamento de documentos.
- Autenticação, autorização de produção ou gestão de contas de usuário.
- Upload em lote, pesquisa, paginação e pré-visualização de arquivos.
- Garantia de recuperação de arquivos órfãos deixados no filesystem.

## 3. Premissas e termos

- O backend é uma aplicação Node.js com Express, escrita em JavaScript CommonJS. O frontend usa React e Vite com JavaScript ESM.
- Para esta fase, o identificador do proprietário é recebido no cabeçalho `X-User-Id`. Quando ausente, usa-se o identificador `local`.
- `X-User-Id` é somente um identificador de organização, não uma credencial. Qualquer cliente pode informá-lo; portanto, o mecanismo não oferece isolamento seguro nem substitui autenticação. O uso previsto é local/de desenvolvimento.
- A API do backend usa os caminhos descritos abaixo sem prefixo. Durante o desenvolvimento, o frontend chama `/api/...` e o proxy do Vite remove `/api` antes de encaminhar a chamada ao backend.
- O valor inicial do limite de upload é 10 MiB por arquivo, configurável por variável de ambiente. Não há lista de tipos permitidos nesta fase; o nome e o tipo MIME fornecidos pelo cliente não são considerados confiáveis para construir caminhos no filesystem.

## 4. Requisitos funcionais

| ID | Requisito | Critério de aceite |
| --- | --- | --- |
| RF-01 | Receber um documento via `POST /upload` em `multipart/form-data`, no campo `file`. | Uma requisição válida armazena exatamente um arquivo local e responde com os metadados criados. |
| RF-02 | Identificar o proprietário da requisição pelo cabeçalho `X-User-Id`, usando `local` quando ausente. | O valor é associado ao documento e usado para filtrar listagem e download. |
| RF-03 | Validar o arquivo enviado. | Rejeitar arquivo ausente, vazio ou acima do limite configurado com erro HTTP apropriado; não manter arquivo parcial após falha. |
| RF-04 | Gerar um identificador único para cada documento. | O identificador não depende do nome original e é usado como nome seguro do arquivo armazenado. |
| RF-05 | Listar os documentos do proprietário atual por `GET /documents`. | A resposta contém somente documentos associados ao proprietário da requisição, ordenados do mais recente para o mais antigo. |
| RF-06 | Baixar um documento por `GET /documents/:id/download`. | O arquivo é retornado como anexo com o nome original, somente quando pertence ao proprietário atual. |
| RF-07 | Não revelar a existência de documentos de outro proprietário. | Identificador inexistente, de outro proprietário ou sem arquivo correspondente resulta em `404`. |
| RF-08 | Apresentar as operações principais na interface web. | O usuário consegue enviar arquivo, ver a lista atualizada e iniciar o download; erros e lista vazia são comunicados em português. |

## 5. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Todo conteúdo de arquivo é gravado exclusivamente no filesystem local, usando Multer `diskStorage`; o diretório padrão é `backend/storage`. |
| RNF-02 | Os metadados são mantidos em memória. A lista fica vazia após reiniciar o processo, mesmo que arquivos permaneçam no diretório. |
| RNF-03 | Configurações operacionais, incluindo porta, diretório de armazenamento e tamanho máximo do arquivo, vêm de variáveis de ambiente com valores padrão documentados. |
| RNF-04 | O backend segue o fluxo de dependências `routes -> controllers -> services -> repositories`; camadas internas não dependem de Express, Multer ou React. |
| RNF-05 | Erros esperados são tratados nas fronteiras HTTP e retornam formato consistente, sem expor caminhos locais ou stack traces ao cliente. |
| RNF-06 | O nome físico do arquivo é gerado pela aplicação e não permite traversal de diretório nem sobrescrita baseada em entrada do cliente. |
| RNF-07 | A interface chama a API por `fetch` sob o prefixo `/api`; chamadas de upload enviam `FormData` sem definir manualmente o cabeçalho `Content-Type`. |
| RNF-08 | Testes de backend usam o runner nativo `node:test` e não dependem de serviços externos. |

## 6. Modelo de dados

### Metadados públicos do documento

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | string | Sim | Identificador único, gerado pelo backend. |
| `originalName` | string | Sim | Nome original fornecido no upload; usado apenas para exibição e nome do download. |
| `size` | number | Sim | Tamanho do arquivo em bytes. Deve ser maior que zero. |
| `uploadedAt` | string | Sim | Data e hora do upload em ISO 8601 UTC. |
| `owner` | string | Sim | Identificador obtido de `X-User-Id` ou `local`. |

O repositório de metadados mantém os registros em memória, indexados por `id`. O armazenamento físico usa um nome derivado exclusivamente do identificador gerado pelo backend, dentro do diretório configurado. O caminho físico não é retornado pela API.

### Ciclo de vida e consistência

- O registro de metadados é criado somente depois de o upload local concluir e passar pelas validações.
- Se a criação do registro falhar depois de o Multer gravar o arquivo, o arquivo recém-gravado deve ser removido.
- Se o arquivo físico não existir no momento do download, responder `404`; não retornar um caminho interno.
- O reinício do processo descarta os metadados. Arquivos remanescentes não são listados nem recuperados automaticamente nesta versão.

## 7. Contratos de API

### Convenções comuns

- `Content-Type` de respostas JSON: `application/json; charset=utf-8`.
- `X-User-Id` é opcional; se omitido ou vazio, o proprietário é `local`. O backend deve normalizar espaços em branco e rejeitar valor inválido conforme validação da camada HTTP.
- Formato dos erros JSON:

```json
{
  "error": {
    "code": "FILE_REQUIRED",
    "message": "Envie um arquivo no campo file."
  }
}
```

As mensagens são em português. O campo `code` é estável para uso pelo frontend; detalhes internos e caminhos do servidor não devem ser incluídos.

### `POST /upload`

Envia um arquivo e cria os metadados correspondentes.

- Cabeçalho opcional: `X-User-Id: identificador-do-usuario`.
- Entrada: `multipart/form-data`, com um arquivo no campo `file`.
- Limite padrão: 10 MiB, substituído por `MAX_FILE_SIZE_BYTES` quando configurado.
- Sucesso: `201 Created`.

```json
{
  "document": {
    "id": "uuid-gerado-pelo-backend",
    "originalName": "relatorio.pdf",
    "size": 48213,
    "uploadedAt": "2026-11-10T12:30:00.000Z",
    "owner": "local"
  }
}
```

Erros previstos:

| HTTP | `code` | Situação |
| --- | --- | --- |
| 400 | `FILE_REQUIRED` | Campo `file` ausente. |
| 400 | `FILE_EMPTY` | Arquivo com tamanho zero. |
| 400 | `INVALID_UPLOAD` | Multipart inválido, campo inesperado ou mais de um arquivo. |
| 413 | `FILE_TOO_LARGE` | Arquivo acima de `MAX_FILE_SIZE_BYTES`. |
| 500 | `INTERNAL_ERROR` | Falha inesperada ao armazenar ou registrar o documento. |

### `GET /documents`

Lista os documentos do proprietário associado à requisição.

- Cabeçalho opcional: `X-User-Id`.
- Sucesso: `200 OK`, inclusive quando não houver documentos.

```json
{
  "documents": [
    {
      "id": "uuid-gerado-pelo-backend",
      "originalName": "relatorio.pdf",
      "size": 48213,
      "uploadedAt": "2026-11-10T12:30:00.000Z",
      "owner": "local"
    }
  ]
}
```

A lista é ordenada por `uploadedAt` decrescente. Em caso de empate, a ordem deve ser determinística por `id`. Uma lista vazia é representada como `{"documents": []}`.

### `GET /documents/:id/download`

Retorna o conteúdo binário como anexo.

- Cabeçalho opcional: `X-User-Id`.
- Sucesso: `200 OK`, com `Content-Type: application/octet-stream` e `Content-Disposition: attachment` contendo o nome original sanitizado para cabeçalho HTTP.
- `404 Not Found`: documento inexistente, pertencente a outro proprietário ou cujo arquivo não está disponível.
- `500 Internal Server Error`: falha inesperada de leitura.

O backend deve transmitir o arquivo sem carregar todo o conteúdo na memória. O nome original nunca é usado como caminho no filesystem.

## 8. Decisões arquiteturais

### Backend

- `routes/`: registra endpoints, configura middleware HTTP e delega aos controllers. A configuração do Multer `diskStorage`, incluindo destino, limite e nome físico seguro, pertence à borda HTTP (por exemplo, middleware de upload próximo às rotas).
- `controllers/`: lê parâmetros, cabeçalhos e `req.file`, aplica validações de formato da requisição, chama os services e converte resultados/erros para status e respostas HTTP.
- `services/`: concentra regras de negócio, como atribuição do proprietário, validação do documento, coordenação entre arquivo e metadados e política de listagem/download. Não importa Express nem Multer.
- `repositories/`: encapsula os metadados em memória e o acesso ao filesystem local necessário para localizar, ler ou remover arquivos. Não conhece HTTP.
- `app.js`: compõe as dependências, registra middleware global e rotas, preserva o endpoint `/health` e exporta o app para testes. O listener só inicia quando o módulo é executado diretamente.
- Dependências seguem `routes -> controllers -> services -> repositories`. Composição e injeção simples são preferidas a contêineres ou abstrações adicionais.

### Frontend

- Componentes funcionais com React Hooks organizados em `components/`, `pages/` e `services/` conforme a necessidade real.
- Um serviço de API centraliza chamadas `fetch` para `/api/upload`, `/api/documents` e `/api/documents/:id/download`.
- Os componentes de interface não duplicam regras de transporte nem conhecem caminhos físicos do backend.
- Upload usa `FormData`; download trata a resposta binária e permite salvá-la como anexo.

### Armazenamento e configuração

| Variável | Padrão | Uso |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP do backend. |
| `STORAGE_DIR` | `backend/storage` | Diretório local de arquivos; deve ser resolvido de modo independente do diretório corrente do processo. |
| `MAX_FILE_SIZE_BYTES` | `10485760` | Tamanho máximo por arquivo (10 MiB). |

Nenhuma variável ou integração para armazenamento externo deve ser adicionada nesta fase. O diretório deve ser criado quando necessário e os erros de permissão/escrita devem ser tratados.

## 9. Plano de execução

As etapas abaixo descrevem trabalho futuro. Esta especificação não executa nem altera arquivos de backend ou frontend.

1. **Consolidar contratos e configuração**: confirmar a premissa de `X-User-Id`, limite de upload e formato de erros; definir valores padrão e resolução do diretório local.
2. **Estruturar a API backend**: criar rotas, controllers e services com dependências explícitas; manter `/health` e a exportação do app para testes.
3. **Implementar upload e repositórios locais**: configurar Multer `diskStorage`, gerar nomes físicos seguros, validar o arquivo e registrar metadados em memória, incluindo compensação em caso de falha.
4. **Implementar listagem e download**: filtrar por proprietário, ordenar resultados, transmitir arquivo como anexo e mapear indisponibilidade para `404`.
5. **Construir a interface React**: implementar upload, listagem, download, atualização após envio e estados de carregamento, vazio e erro consumindo o proxy `/api`.
6. **Validar contratos e integração**: cobrir sucesso, validações, isolamento lógico por proprietário, erros de filesystem e reinício/perda dos metadados com testes `node:test`; executar build do frontend e testes do backend.
7. **Revisar documentação operacional**: documentar execução local, variáveis de ambiente, limites conhecidos e a ausência de autenticação e persistência de metadados.

## 10. Critérios de conclusão

- Os três endpoints e seus contratos de sucesso/erro estão implementados conforme esta especificação.
- Os arquivos são gravados somente no filesystem local usando Multer `diskStorage`; metadados permanecem em memória.
- Listagem e download consideram o proprietário lógico sem alegar que `X-User-Id` fornece autenticação.
- O frontend permite upload, listagem e download usando a API pelo prefixo `/api` no desenvolvimento.
- Os testes cobrem fluxos principais e falhas esperadas; `npm test` no backend e `npm run build` no frontend concluem sem erros.
- Não foram introduzidos armazenamento externo, banco de dados ou dependências sem necessidade justificada.