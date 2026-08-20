# Decisão e Relatório 02 — Estrutura e Especificação do `metadata.json` no Google AI Studio

> Guia de referência técnica sobre como o arquivo `metadata.json` é interpretado pela plataforma Google AI Studio / Antigravity Agent, e como configurá-lo para que a IA opere sem atrito com o template.

---

## 1. Schema Oficial do `metadata.json`

O arquivo `metadata.json` fica na **raiz do projeto** e possui apenas 4 propriedades oficiais reconhecidas pela plataforma:

```json
{
  "name": "Nome do Aplicativo ou Template",
  "description": "Descrição detalhada da proposta de valor e propósito do applet",
  "requestFramePermissions": [
    "camera",
    "microphone",
    "geolocation"
  ],
  "majorCapabilities": [
    "MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"
  ]
}
```

---

## 2. Detalhamento de cada campo

### A. `name` (string)
- **O que é**: O nome de exibição do applet no painel, aba do navegador e no cabeçalho da plataforma Google AI Studio Build.
- **Como a IA é treinada para tratá-lo**:
  - Se estiver vazio `""` ou com placeholder genérico (`"Untitled"`, `"My App"`), a IA é instruída a substituí-lo no primeiro turno por um nome descritivo e literal.
  - **Se já possuir um nome real e significativo** (ex: `"Fullstack Payload TanStack Template"`), as diretrizes do sistema proíbem terminantemente a IA de renomeá-lo.
  - **Dica para o template**: Defina o nome oficial e imutável do template aqui.

### B. `description` (string)
- **O que é**: Descrição em texto do que o projeto faz.
- **Como a IA trata**: Atualiza o texto se o propósito do applet evoluir, mas serve de âncora contextual primária para a IA entender a proposta do projeto ao iniciar uma conversa.
- **Dica para o template**: Coloque uma descrição sucinta que reforça a stack (ex: *"Starter template for Bun + Payload 3.88 API-only + TanStack Router/Query/Store/Form"*).

### C. `requestFramePermissions` (array de strings)
- **O que é**: Lista de permissões de hardware/navegador que o iframe da plataforma AI Studio deve conceder via o atributo `allow` do iframe do preview.
- **Valores suportados**:
  - `"camera"`: Acesso à webcam/câmera (via `navigator.mediaDevices.getUserMedia`).
  - `"microphone"`: Acesso a microfone/áudio.
  - `"geolocation"`: Acesso à localização geográfica (`navigator.geolocation`).
- **Comportamento**: Se o app não precisa de hardware, mantenha `[]`. Se precisar de algum, adicione apenas o estritamente necessário.

### D. `majorCapabilities` (array de strings)
- **O que é**: Flags de capacidades de plataforma suportadas pelo ambiente.
- **Valores reconhecidos**:
  - `"MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"`: Obrigatório/Padrão no ecossistema AI Studio. Sinaliza ao orquestrador que integrações de IA e Gemini são executadas via backend/servidor de forma segura.
- **Comportamento**: Deve ser mantido sempre presente no template.

---

## 3. O que NUNCA deve ir no `metadata.json`

- **Variáveis de Ambiente / Secrets**: Nunca insira chaves, URIs de banco (`MONGODB_URI`) ou segredos aqui. Variáveis pertencem exclusivamente ao `.env.example` e ao painel de Secrets da plataforma.
- **Campos inventados/arbitrários**: A plataforma rejeita ou ignora propriedades fora do schema (`scripts`, `version`, `author`, `framework`, etc.).

---

## 4. Otimizando o Template para a IA do AI Studio

A IA do Google AI Studio lê uma hierarquia clara de instruções. Ao montar o seu template, o comportamento da IA é guiado por:

1. **`AGENTS.md` / `GEMINI.md`**: São lidos e **injetados diretamente nos System Instructions** do agente. É o local ideal para fixar as regras rígidas (ex: *"não use fetch direto"*, *"Payload 3.88 API-only"*, *"use Bun"*).
2. **`metadata.json`**: Fornece a identidade e as permissões de iframe para o host do AI Studio.
3. **`.env.example`**: Sinaliza para a interface do AI Studio quais chaves de configuração devem ser preenchidas pelo usuário.
4. **`docs/`**: Documentação numerada sequencial para histórico de planos e relatórios.
