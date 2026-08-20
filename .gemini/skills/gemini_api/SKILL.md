---
name: 'gemini-api'
description: >
  Provides model selection guidance and coding patterns for the @google/genai
  TypeScript SDK. Use when the application requires AI capabilities (e.g., text/image
  generation, smart features) or when the task involves implementing an "AI-powered"
  feature. The model should prefer this modern SDK over legacy alternatives.
  Do NOT use for general discussions about AI without implementation intent.
  Covers model aliases, streaming, chat, function calling, search and maps
  grounding, Live API, TTS, and API key handling.
---

## @google/genai Models

> [!IMPORTANT] The models listed in this section are the absolute source of
> truth when selecting a model. Even if a specific use case is not listed in the
> examples or sections below, you must still choose one of the models defined
> here, unless the user specifies one.

- If the user provides a full model name that includes hyphens, a version, and
  an optional date (e.g., gemini-2.5-flash-preview-12-2025 or
  gemini-3.1-pro-preview), use it directly.
- If the user provides a common name or alias, use the following full model
  name.
  - gemini flash: 'gemini-flash-latest'
  - gemini lite or flash lite: 'gemini-3.1-flash-lite-preview'
  - gemini pro: 'gemini-3.1-pro-preview'
  - nano banana, or gemini flash image: 'gemini-2.5-flash-image'
  - nano banana 2: 'gemini-3.1-flash-image-preview'
  - nano banana pro, or gemini pro image: 'gemini-3-pro-image-preview'
  - native audio or gemini flash audio: 'gemini-3.1-flash-live-preview'
  - gemini tts or gemini text-to-speech: 'gemini-3.1-flash-tts-preview'
  - Veo or Veo lite: 'veo-3.1-lite-generate-preview'
  - Lyria Clip: 'lyria-3-clip-preview'
  - Lyria Pro: 'lyria-3-pro-preview'
- If the user does not specify any model, select the following model based on
  the task type.
  - Basic Text Tasks (e.g., summarization, proofreading, and simple Q&A):
    'gemini-3-flash-preview'
  - Complex Text Tasks (e.g., advanced reasoning, coding, math, and STEM):
    'gemini-3.1-pro-preview'
  - General Image Generation and Editing Tasks: 'gemini-2.5-flash-image'
  - High-Quality Image Generation and Editing Tasks (supports 512px, 1K, 2K,
    and 4K resolution): 'gemini-3.1-flash-image-preview'
  - High-Quality Video Generation Tasks: 'veo-3.1-generate-preview'
  - General Video Generation Tasks: 'veo-3.1-lite-generate-preview'
  - Real-time audio & video conversation tasks:
    'gemini-3.1-flash-live-preview'
  - Text-to-speech tasks: 'gemini-3.1-flash-tts-preview'
  - Short music clip generation tasks (30s): 'lyria-3-clip-preview'
  - Full-length music generation tasks: 'lyria-3-pro-preview'
  - Embedding tasks: 'gemini-embedding-2-preview'

Do not use the following deprecated models.

- **Prohibited:** `gemini-1.5-flash`
- **Prohibited:** `gemini-1.5-pro`
- **Prohibited:** `gemini-pro`

# Gemini API guidance

## @google/genai Coding Guidelines

Use the `@google/genai` SDK to call Gemini models.

### Calling Gemini API

**Always** call Gemini API from the frontend code of the application. **NEVER**
call Gemini API from the backend.

### Incorrect Usages

Do _not_ use or import the following types from `@google/genai`; these are
deprecated APIs and no longer work.

- **Incorrect** `GoogleGenerativeAI`
- **Incorrect** `google.generativeai`
- **Incorrect** `models.create`
- **Incorrect** `ai.models.create`
- **Incorrect** `models.getGenerativeModel`
- **Incorrect** `genAI.getGenerativeModel`
- **Incorrect** `ai.models.getModel`
- **Incorrect** `ai.models['model_name']`
- **Incorrect** `generationConfig`
- **Incorrect** `GoogleGenAIError`
- **Incorrect** `GenerateContentResult`; **Correct**
  `GenerateContentResponse`.
- **Incorrect** `GenerateContentRequest`; **Correct**
  `GenerateContentParameters`.
- **Incorrect** `SchemaType`; **Correct** `Type`.

When using generate content for text answers, do _not_ define the model first
and call generate content later. You must use `ai.models.generateContent` to
query GenAI with both the model name and prompt.

### API Key

- **Correct API Key Format per Framework:**
  - **Bun (este projeto):**
    `const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });`
    Do **NOT** use: `(import.meta as any).env.VITE_GEMINI_API_KEY`
  - **React (Vite):**
    `const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });`
    Do **NOT** use: `apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY`
  - **Next.js:**
    `const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });`
  - **Angular:**
    `const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });`

- **No UI for API Key:** Do **not** generate any UI elements
  (input fields, forms, prompts, configuration sections) or
  code snippets for entering or managing the API key. Do **not**
  request that the user update the API key in the code. The
  key's availability is handled externally and is a hard
  requirement. The application **must not** ask the user for it
  under any circumstances.

### Import

- Always use `import {GoogleGenAI} from "@google/genai";`.
- **Prohibited:** `import { GoogleGenerativeAI } from "@google/genai";`
- **Prohibited:** `import type { GoogleGenAI} from "@google/genai";`
- **Prohibited:** `declare var GoogleGenAI`.

## Examples

### Generate Content

Generate a response from the model.

```ts
import { GoogleGenAI } from '@google/genai';

// ... initialization ...

const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: 'why is the sky blue?' });

console.log(response.text);
```

Generate content with multiple parts, for example, by sending an image and a
text prompt to the model.

```ts
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

// ... initialization ...

const imagePart = {
  inlineData: {
    // Could be any other IANA standard MIME type for the source data.
    mimeType: 'image/png',
    data: base64EncodeString, // base64 encoded string
  },
};
const textPart = {
  text: promptString, // text prompt
};
const response: GenerateContentResponse = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: { parts: [imagePart, textPart] },
});
console.log(response.text);
```

### Extracting Text Output from `GenerateContentResponse`

When you use `ai.models.generateContent`, it returns a `GenerateContentResponse`
object. The simplest and most direct way to get the generated text content is by
accessing the `.text` property on this object.

#### Correct Method

The `GenerateContentResponse` object features a `text` property (not a method,
so do not call `text()`) that directly returns the string output.

Property definition:

```ts
export class GenerateContentResponse {
 ......

 get text(): string | undefined {
 // Returns the extracted string output.
 }
}
```

Example:

```ts
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

// ... initialization ...

const response: GenerateContentResponse = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: 'why is the sky blue?',
});
const text = response.text; // Do not use response.text()
console.log(text);

const chat: Chat = ai.chats.create({ model: 'gemini-3-flash-preview' });
let streamResponse = await chat.sendMessageStream({ message: 'Tell me a story in 100 words.' });
for await (const chunk of streamResponse) {
  const c = chunk as GenerateContentResponse;
  console.log(c.text); // Do not use c.text()
}
```

### Common Mistakes to Avoid

- **Incorrect:** `const text = response.text();`
- **Incorrect:** `const text = response?.response?.text?;`
- **Incorrect:** `const text = response?.response?.text();`
- **Incorrect:** `const text = response?.response?.text?.()?.trim();`
- **Incorrect:** `const json =
  response.candidates?.[0]?.content?.parts?.[0]?.json;

### System Instruction and Other Model Configs

Generate a response with a system instruction and other model configs.

Note: The `maxOutputTokens` parameter includes both response tokens and thinking
(reasoning) tokens. It is recommended to specify the desired response size
within the `systemInstruction` rather than using `maxOutputTokens`.

```ts
import { GoogleGenAI } from '@google/genai';

// ... initialization ...

const response = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: 'Tell me a story.',
  config: {
    systemInstruction: 'You are a storyteller for kids under 5 years old.',
    topK: 64,
    topP: 0.95,
    temperature: 1,
    responseMimeType: 'application/json',
    seed: 42,
  },
});
console.log(response.text);
```

### Thinking Level

- The `thinkingLevel` parameter controls the model's reasoning behavior. It is
  only available for Gemini 3 series models. Do not use it with other models.
  - ThinkingLevel.HIGH (Default): Maximizes reasoning for complex tasks.
  - ThinkingLevel.LOW: Minimizes latency and cost.
  - ThinkingLevel.MINIMAL: Equivalent to no thinking.
    Default for 'gemini-3.1-flash-lite-preview'.
    Not available for 'gemini-3.1-pro-preview'.
- By default, you do not need to set `thinkingLevel`, as the model
  automatically decides the amount of reasoning based on the complexity of the
  requests.

```ts
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

// ... initialization ...

const response = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: 'Provide a list of 3 famous physicists and their key contributions',
  config: { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } },
});
console.log(response.text);
```

### JSON Response

Ask the model to return a response in JSON format.

The recommended way is to configure a `responseSchema` for the expected output.

See the following available types that can be used in the `responseSchema`.

```ts
export enum Type {
  TYPE_UNSPECIFIED = 'TYPE_UNSPECIFIED',
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  INTEGER = 'INTEGER',
  BOOLEAN = 'BOOLEAN',
  ARRAY = 'ARRAY',
  OBJECT = 'OBJECT',
  NULL = 'NULL',
}
```

- Type.OBJECT cannot be empty; it must contain other properties.
- Do not use `SchemaType`, it is not available from `@google/genai`

```ts
import { GoogleGenAI, Type } from '@google/genai';

// ... initialization ...

const response = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: 'List a few popular cookie recipes, and include the amounts of ingredients.',
  config: {
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          recipeName: { type: Type.STRING, description: 'The name of the recipe.' },
          ingredients: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'The ingredients for the recipe.',
          },
        },
        // propertyOrdering is optional
      },
    },
  },
});

let jsonStr = response.text.trim();
// Parse jsonStr to get the object
```

### Function calling

To let Gemini interact with external systems, you can provide
`FunctionDeclaration` object as `tools`. The model can then return a structured
`FunctionCall` object, asking you to call the function with the provided
arguments.

```ts
import { FunctionDeclaration, GoogleGenAI, Type } from '@google/genai';

// ... initialization ...

// Assuming you have defined a function `controlLight` which takes
// `brightness` and `colorTemperature` as input arguments.
const controlLightFunctionDeclaration: FunctionDeclaration = {
  name: 'controlLight',
  parameters: {
    type: Type.OBJECT,
    description: 'Set the brightness and color temperature of a room light.',
    properties: {
      brightness: {
        type: Type.NUMBER,
        description: 'Light level from 0 to 100. Zero is off and 100 is full brightness.',
      },
      colorTemperature: {
        type: Type.STRING,
        description: 'Color temperature of the light fixture such as `daylight`, `cool` or `warm`.',
      },
    },
    required: ['brightness', 'colorTemperature'],
  },
};
const response = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: 'Dim the lights so the room feels cozy and warm.',
  config: {
    // You can pass multiple functions to the model.
    tools: [{ functionDeclarations: [controlLightFunctionDeclaration] }],
  },
});

// Check for function calls
const functionCalls = response.functionCalls;
if (functionCalls) {
  // Example: [{ name: 'controlLight',
  //   args: { colorTemperature: 'warm', brightness: 25 }, id: '...' }]
  // Extract arguments and execute your function.
}
```

#### Combine Function Calling with the other built-in tools

Gemini 3 series models support combining built-in tools
(e.g., googleSearch, googleMaps, urlContext) with function calling
in the same request. You MUST set `includeServerSideToolInvocations`
to true to enable the tool hybrid mode.

Note: `googleMaps` cannot be used together with the other
built-in tools, e.g., `googleSearch`, `urlContext`.

```ts
import { FunctionDeclaration, GoogleGenAI, Type } from '@google/genai';

// ... initialization ...

const getWeather: FunctionDeclaration = {
  name: 'getWeather',
  description: 'Get the weather in a given location',
  parameters: {
    type: Type.OBJECT,
    properties: { location: { type: Type.STRING, description: 'The city and state, e.g. San Francisco, CA' } },
    required: ['location'],
  },
};

const response1 = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: "What is the northernmost city in the United States? What's the weather like there today?",
  tools: [{ googleSearch: {} }, { functionDeclarations: [getWeather] }],
  // Required when combining built-in tools with function declarations.
  toolConfig: { includeServerSideToolInvocations: true },
});
```

If you need to make additional calls to the model after the first request, you
must append the previous response's content to the next request's contents to
preserve the tool call context.

```ts
const previousContent = response1.candidates?.[0]?.content;
const response2 = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: [previousContent, 'What is the weather like there tomorrow?'],
  tools: [{ googleSearch: {} }, { functionDeclarations: [getWeather] }],
  toolConfig: { includeServerSideToolInvocations: true },
});
```

### Generate Content (Streaming)

Generate a response from the model in streaming mode.

```ts
import { GoogleGenAI } from '@google/genai';

// ... initialization ...

const response = await ai.models.generateContentStream({
  model: 'gemini-3-flash-preview',
  contents: 'Tell me a story in 300 words.',
});

for await (const chunk of response) {
  console.log(chunk.text);
}
```

### Generate Images

### Image Generation and Editing Model

- Generate images using `gemini-2.5-flash-image` by default; switch to Imagen
  models (for example, `imagen-4.0-generate-001`) only if the user explicitly
  requests them.
- Upgrade to `gemini-3.1-flash-image-preview` if the user requests any of the
  following:
  - High-quality images with configurable resolution (512px, 1K, 2K, or 4K).
  - Non-standard aspect ratios: "1:4", "1:8", "4:1", or "8:1".
  - Real-time information using the `googleSearch` tool.
  - Image search: using web images retrieved via Google Image Search as
    context for image generation.
- The `googleSearch` tool is only available to `gemini-3-pro-image-preview`
  and `gemini-3.1-flash-image-preview`; do not use it with
  `gemini-2.5-flash-image`. Within `googleSearch`, `imageSearch` is only
  available to `gemini-3.1-flash-image-preview`.
- When using `gemini-3-pro-image-preview` or `gemini-3.1-flash-image-preview`,
  users **MUST** select their own API key. This step is mandatory before
  accessing the main app. Follow the instructions in the following "API Key
  Selection" section (identical to the Veo video generation process).

### Image Configuration

- `aspectRatio`: Changes the aspect ratio of the generated image. Supported
  values are "1:1", "3:4", "4:3", "9:16", and "16:9". The default is "1:1".
  `gemini-3.1-flash-image-preview` additionally supports "1:4", "1:8", "4:1",
  and "8:1".
- `imageSize`: Changes the size of the generated image. Available for
  `gemini-3-pro-image-preview` (supports "1K", "2K", "4K"; default "1K") and
  `gemini-3.1-flash-image-preview` (supports "512px", "1K", "2K", "4K";
  default "1K").
- **DO NOT** set `responseMimeType`. It is not supported for nano banana
  series models.
- **DO NOT** set `responseSchema`. It is not supported for nano banana series
  models.

### Examples

- Call `generateContent` to generate images with nano banana series models; do
  not use it for Imagen models.
- The output response may contain both image and text parts; you must iterate
  through all parts to find the image part. Do not assume the first part is an
  image part.

```ts
import { GoogleGenAI } from '@google/genai';

// ... initialization ...

const response = await ai.models.generateContent({
  model: 'gemini-3.1-flash-image-preview',
  contents: { parts: [{ text: 'A robot holding a red skateboard.' }] },
  config: {
    imageConfig: { aspectRatio: '1:1', imageSize: '1K' },
    tools: [
      {
        googleSearch: {
          // Optional, only available for `gemini-3-pro-image-preview` and `gemini-3.1-flash-image-preview`.
          searchTypes: {
            webSearch: {},
            imageSearch: {}, // Only available for `gemini-3.1-flash-image-preview`.
          },
        },
      },
    ],
  },
});
for (const part of response.candidates[0].content.parts) {
  // Find the image part, do not assume it is the first part.
  if (part.inlineData) {
    const base64EncodeString: string = part.inlineData.data;
    const imageUrl = `data:image/png;base64,${base64EncodeString}`;
  } else if (part.text) {
    console.log(part.text);
  }
}
```

- Call `generateImages` to generate images with Imagen models; do not use it
  for nano banana series models.

```ts
import { GoogleGenAI } from '@google/genai';

// ... initialization ...

const response = await ai.models.generateImages({
  model: 'imagen-4.0-generate-001',
  prompt: 'A robot holding a red skateboard.',
  config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '1:1' },
});

const base64EncodeString: string = response.generatedImages[0].image.imageBytes;
const imageUrl = `data:image/png;base64,${base64EncodeString}`;
```

### Edit Images

- To edit images using the model, you can prompt with text, images or a
  combination of both.
- Follow the "Image Generation and Editing Model" and "Image Configuration"
  sections defined in the "Generate Images" section.

```ts
import { GoogleGenAI } from '@google/genai';

// ... initialization ...

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash-image',
  contents: {
    parts: [
      {
        inlineData: {
          data: base64ImageData, // base64 encoded string
          mimeType: mimeType, // IANA standard MIME type
        },
      },
      { text: 'can you add a llama next to the image' },
    ],
  },
});
for (const part of response.candidates[0].content.parts) {
  // Find the image part, do not assume it is the first part.
  if (part.inlineData) {
    const base64EncodeString: string = part.inlineData.data;
    const imageUrl = `data:image/png;base64,${base64EncodeString}`;
  } else if (part.text) {
    console.log(part.text);
  }
}
```

### Generate Speech

Transform text input into single-speaker or multi-speaker audio.

#### Single speaker

```ts
import { GoogleGenAI, Modality } from '@google/genai';

// ... initialization ...

const response = await ai.models.generateContent({
  model: 'gemini-3.1-flash-tts-preview',
  contents: [{ parts: [{ text: 'Say cheerfully: Have a wonderful day!' }] }],
  config: {
    responseModalities: [Modality.AUDIO], // Must be an array with a single `Modality.AUDIO` element.
    speechConfig: {
      voiceConfig: {
        // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
        prebuiltVoiceConfig: { voiceName: 'Kore' },
      },
    },
  },
});

const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
if (base64Audio) {
  // ... decode and play audio with sample rate 24000 ...
}
```

#### Multi-speakers

Use it when you need 2 speakers (the number of `speakerVoiceConfig` must equal 2)

```ts
// ... initialization ...

const prompt = `TTS the following conversation between Joe and Jane:
      Joe: How's it going today Jane?
      Jane: Not too bad, how about you?`;

const response = await ai.models.generateContent({
  model: 'gemini-3.1-flash-tts-preview',
  contents: [{ parts: [{ text: prompt }] }],
  config: {
    responseModalities: ['AUDIO'],
    speechConfig: {
      multiSpeakerVoiceConfig: {
        speakerVoiceConfigs: [
          { speaker: 'Joe', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          { speaker: 'Jane', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
        ],
      },
    },
  },
});
const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
if (base64Audio) {
  // ... decode and play audio with sample rate 24000 ...
}
```

### Generate Music

Generate music from a text prompt, optionally combined with an image. Two models
are available:

- `lyria-3-clip-preview` (**Lyria Clip**): Short clips up to 30 seconds.
- `lyria-3-pro-preview` (**Lyria Pro**): Full-length tracks.

Both models use the same streaming API and return audio in the same format.

- Use `generateContentStream` with `responseModalities: [Modality.AUDIO]`.
- The response stream contains both audio (`inlineData`) and text (lyrics and
  metadata) parts. Accumulate the base64-encoded audio chunks, then decode
  into a playable Blob.
- Unlike TTS and Live (which return raw PCM requiring `AudioContext`), these
  models return encoded audio (e.g., WAV). Use `atob` and `Blob` for playback.
- When using Lyria models, users **MUST** select their own API key. Follow the
  instructions in the "API Key Selection" section (under Generate Videos).

#### Text-Only Music Generation

```ts
import { GoogleGenAI, Modality } from '@google/genai';

// ... initialization ...

const response = await ai.models.generateContentStream({
  model: 'lyria-3-clip-preview', // or "lyria-3-pro-preview" for full-length tracks
  contents: 'Generate a 30-second cinematic orchestral track.',
});

let audioBase64 = '';
let lyrics = '';
let mimeType = 'audio/wav';

for await (const chunk of response) {
  const parts = chunk.candidates?.[0]?.content?.parts;
  if (!parts) continue;
  for (const part of parts) {
    if (part.inlineData?.data) {
      if (!audioBase64 && part.inlineData.mimeType) {
        mimeType = part.inlineData.mimeType;
      }
      audioBase64 += part.inlineData.data;
    }
    if (part.text && !lyrics) {
      // The first text part contains the generated lyrics.
      lyrics = part.text;
    }
  }
}

// Decode base64 audio into a playable Blob URL
const binary = atob(audioBase64);
const bytes = new Uint8Array(binary.length);
for (let i = 0; i < binary.length; i++) {
  bytes[i] = binary.charCodeAt(i);
}
const blob = new Blob([bytes], { type: mimeType });
const audioUrl = URL.createObjectURL(blob);
```

#### Image + Text Music Generation

```ts
import { GoogleGenAI, Modality } from '@google/genai';

// ... initialization ...

const response = await ai.models.generateContentStream({
  model: 'lyria-3-clip-preview', // or "lyria-3-pro-preview" for full-length tracks
  contents: {
    parts: [
      { text: 'Generate a 30-second track inspired by this image.' },
      { inlineData: { data: base64ImageData, mimeType: 'image/jpeg' } },
    ],
  },
});

// Process the stream identically to the text-only example above.
```

### Generate Videos

Generate a video from the model.

The aspect ratio can be `16:9` (landscape) or `9:16` (portrait), the resolution
can be 720p, 1080p or 4k, and the number of videos must be 1.

Constraints for the `veo-3.1-lite-generate-preview` model: - It does **not**
support 4K resolution. For 4K, use `veo-3.1-generate-preview` instead. - It does
**not** support video extension. To extend a video, use
`veo-3.1-generate-preview` instead.

Note: The video generation can take a few minutes. Create a set of clear and
reassuring messages to display on the loading screen to improve the user
experience.

```ts
// ... initialization ...

let operation = await ai.models.generateVideos({
  model: 'veo-3.1-lite-generate-preview',
  prompt: 'A neon hologram of a cat driving at top speed',
  config: {
    numberOfVideos: 1,
    resolution: '1080p', // Can be 720p or 1080p.
    aspectRatio: '16:9', // Can be 16:9 (landscape) or 9:16 (portrait)
  },
});

// Poll for completion
while (!operation.done) {
  await new Promise((resolve) => setTimeout(resolve, 10000));
  operation = await ai.operations.getVideosOperation({ operation: operation });
}

const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
// To fetch the video, append the Gemini API key to the `x-goog-api-key` header.
// Use the framework-specific method to get the API key.
const response = await fetch(downloadLink, { method: 'GET', headers: { 'x-goog-api-key': apiKey } });
```

Generate a video with a text prompt and a starting image.

```ts
// ... initialization ...

let operation = await ai.models.generateVideos({
  model: 'veo-3.1-lite-generate-preview',
  prompt: 'A neon hologram of a cat driving at top speed', // prompt is optional
  image: {
    imageBytes: base64EncodeString, // base64 encoded string
    mimeType: 'image/png', // Could be any other IANA standard MIME type for the source data.
  },
  config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '9:16' },
});
while (!operation.done) {
  await new Promise((resolve) => setTimeout(resolve, 10000));
  operation = await ai.operations.getVideosOperation({ operation: operation });
}
const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
// To fetch the video, append the Gemini API key to the `x-goog-api-key` header.
// Use the framework-specific method to get the API key.
const response = await fetch(downloadLink, { method: 'GET', headers: { 'x-goog-api-key': apiKey } });
```

Generate a video with a starting and an ending image.

```ts
// ... initialization ...

let operation = await ai.models.generateVideos({
  model: 'veo-3.1-lite-generate-preview',
  prompt: 'A neon hologram of a cat driving at top speed', // prompt is optional
  image: {
    imageBytes: base64EncodeString, // base64 encoded string
    mimeType: 'image/png', // Could be any other IANA standard MIME type for the source data.
  },
  config: {
    numberOfVideos: 1,
    resolution: '720p',
    lastFrame: {
      imageBytes: base64EncodeString, // base64 encoded string
      mimeType: 'image/png', // Could be any other IANA standard MIME type for the source data.
    },
    aspectRatio: '9:16',
  },
});
while (!operation.done) {
  await new Promise((resolve) => setTimeout(resolve, 10000));
  operation = await ai.operations.getVideosOperation({ operation: operation });
}
const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
// To fetch the video, append the Gemini API key to the `x-goog-api-key` header.
// Use the framework-specific method to get the API key.
const response = await fetch(downloadLink, { method: 'GET', headers: { 'x-goog-api-key': apiKey } });
```

Generate a video with multiple reference images (up to 3). For this feature, the
model must be 'veo-3.1-generate-preview', the aspect ratio must be '16:9', and
the resolution must be '720p'.

```ts
// ... initialization ...

const referenceImagesPayload: VideoGenerationReferenceImage[] = [];
for (const img of refImages) {
  referenceImagesPayload.push({
    image: {
      imageBytes: base64EncodeString, // base64 encoded string
      mimeType: 'image/png', // Could be any other IANA standard MIME type for the source data.
    },
    referenceType: VideoGenerationReferenceType.ASSET,
  });
}
let operation = await ai.models.generateVideos({
  model: 'veo-3.1-generate-preview',
  prompt: 'A video of this character, in this environment, using this item.', // prompt is required
  config: { numberOfVideos: 1, referenceImages: referenceImagesPayload, resolution: '720p', aspectRatio: '16:9' },
});
while (!operation.done) {
  await new Promise((resolve) => setTimeout(resolve, 10000));
  operation = await ai.operations.getVideosOperation({ operation: operation });
}
const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
// To fetch the video, append the Gemini API key to the `x-goog-api-key` header.
// Use the framework-specific method to get the API key.
const response = await fetch(downloadLink, { method: 'GET', headers: { 'x-goog-api-key': apiKey } });
```

Extend a video by adding 7s at the end of it. The resolution must be '720p' and
only 720p videos can be extended, must use the same aspect ratio as the previous
video.

```ts
// ... initialization ...

operation = await ai.models.generateVideos({
  model: 'veo-3.1-generate-preview',
  prompt: 'something unexpected happens', // mandatory
  video: previousOperation.response?.generatedVideos?.[0]?.video, // The video from a previous generation
  config: {
    numberOfVideos: 1,
    resolution: '720p',
    aspectRatio: previousVideo?.aspectRatio, // Use the same aspect ratio
  },
});
while (!operation.done) {
  await new Promise((resolve) => setTimeout(resolve, 5000));
  operation = await ai.operations.getVideosOperation({ operation: operation });
}
const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
// To fetch the video, append the Gemini API key to the `x-goog-api-key` header.
// Use the framework-specific method to get the API key.
const response = await fetch(downloadLink, { method: 'GET', headers: { 'x-goog-api-key': apiKey } });
```

#### API Key Selection

When using the Veo video generation models, users must select their own paid API
key. This is a mandatory step before accessing the main app.

Use `await window.aistudio.hasSelectedApiKey()` to check whether an API key has
been selected. If not, add a button which calls `await
window.aistudio.openSelectKey()` to open a dialog for the user to select their
API key. Assume `window.aistudio.hasSelectedApiKey()` and
`window.aistudio.openSelectKey()` are pre-configured, valid, and accessible in
the execution context.

Race condition: * A race condition can occur where `hasSelectedApiKey()` may not
immediately return true after the user selects a key with `openSelectKey()`. To
mitigate this, you MUST assume the key selection was successful after triggering
`openSelectKey()` and proceed to the app. Do not add delay to mitigate the race
condition. * If the request fails with an error message containing "Requested
entity was not found.", reset the key selection state and prompt the user to
select a key again using `openSelectKey()`. * Create a new `GoogleGenAI`
instance right before making an API call to ensure it always uses the most
up-to-date API key from the dialog. Do not create `GoogleGenAI` when the
component is first rendered.

Important: * A link to the billing documentation
(ai.google.dev/gemini-api/docs/billing) must be provided in the dialog. Users
must select an API key from a paid Google Cloud project. * The selected API key
is available using `process.env.API_KEY`. It is injected automatically, so you
do not need to modify the API key code.

### Live

The Live API enables low-latency, real-time voice interactions with Gemini.

#### Session Setup & Audio Streaming

```ts
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

// ... initialization ...

// Implement audio capture, encoding, decoding, and playback logic using
// Web Audio API.

const sessionPromise = ai.live.connect({
  model: 'gemini-3.1-flash-live-preview',
  callbacks: {
    onopen: () => {
      // Start streaming audio from microphone
      // ... setup audio source and processor ...
      // Inside audio processing callback:
      sessionPromise.then((session) =>
        session.sendRealtimeInput({ audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' } }),
      );
    },
    onmessage: async (message: LiveServerMessage) => {
      // Handle audio output
      const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
      if (base64Audio) {
        // ... decode and play audio ...
      }
      // Handle interruption
      if (message.serverContent?.interrupted) {
        // ... stop playback, clear queue ...
      }
      // Handle tool calls, transcription, etc.
    },
    // ... onerror, onclose ...
  },
  config: {
    responseModalities: [Modality.AUDIO], // Must be [Modality.AUDIO]
    speechConfig: {
      // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
      voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
    },
    systemInstruction: 'You are a helpful assistant.',
  },
});
```

#### Video Streaming

Stream image frames and audio data as separate inputs.

```ts
// ... inside a loop (e.g., requestAnimationFrame or setInterval) ...
// ... capture frame from video element to canvas, convert to blob ...
sessionPromise.then((session) => session.sendRealtimeInput({ video: { data: base64Data, mimeType: 'image/jpeg' } }));
```

#### Audio Transcription

Enable transcription in config:

```ts
config: {
  // ...
  outputAudioTranscription: {}, // Model output
  inputAudioTranscription: {}, // User input
}
```

Handle `outputTranscription` and `inputTranscription` in `onmessage`.

#### Function Calling in Live

Define tools in config and handle `toolCall` in `onmessage`. Send
`functionResponses` back using `session.sendToolResponse`.

#### Live API Rules

- **Streaming Input:** When sending data via `session.sendRealtimeInput`, use
  `audio`, `video`, or `text` fields. The `media` and `mediaChunks` fields are
  **deprecated** and **must not** be used.
  - **Correct:** `session.sendRealtimeInput({ audio: ... })`
  - **Correct:** `session.sendRealtimeInput({ video: ... })`
  - **Incorrect:** `session.sendRealtimeInput({ media: ... })`
- **Audio Sync:** Schedule audio chunks precisely for gapless playback.
- **Cleanup:** Use `session.close()` when finished.
- **Modalities:** `responseModalities` must be `[Modality.AUDIO]`.
- **Raw Audio:** Implement manual PCM encoding/decoding. Do not use
  `AudioContext.decodeAudioData` on raw streams.
- **Session State:** Use `sessionPromise.then(...)` to send data to avoid race
  conditions and stale closures.
- **Video:** Send synchronized image frames and audio.
- **Multimodal Output:** Always handle audio output, even when transcription
  or function calls are enabled.

### Chat

Starts a chat and sends a message to the model.

```ts
import { GoogleGenAI } from '@google/genai';

// ... initialization ...

const chat = ai.chats.create({
  model: 'gemini-3-flash-preview',
  config: { systemInstruction: 'You are a helpful assistant.' },
});

let response: GenerateContentResponse = await chat.sendMessage({ message: 'Hello' });
console.log(response.text);

response = await chat.sendMessage({ message: 'How are you?' });
console.log(response.text);
```

- `chat.sendMessage` only accepts the `message` parameter, do not use
  `contents`.

### Chat (Streaming)

```ts
// ... initialization and chat creation ...

let response = await chat.sendMessageStream({ message: 'Tell me a long story.' });
for await (const chunk of response) {
  const c = chunk as GenerateContentResponse;
  console.log(c.text); // Do not use c.text()
}
```

- `chat.sendMessageStream` only accepts the `message` parameter, do not use
  `contents`.

### Search Grounding

Use Google Search grounding for queries related to recent events or web
information.

```ts
// ... initialization ...

const response = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: 'Who won the last Super Bowl?',
  config: { tools: [{ googleSearch: {} }] },
});

console.log(response.text);

// Extract URLs
const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
if (chunks) {
  // chunks is an array of objects like { web: { uri: '...', title: '...' } }
  // Display these URLs in the UI.
}
```

### Maps Grounding

Use Google Maps grounding for queries that relate to geography or place
information that the user wants. If Google Maps is used, you MUST ALWAYS extract
the URLs from groundingChunks and list them on the web app as links. This
includes `groundingChunks.maps.uri` and
`groundingChunks.maps.placeAnswerSources.reviewSnippets`.

Config rules when using `googleMaps`:

- Where relevant, include the user location, for example by querying
  `navigator.geolocation` in a browser. This is passed in the toolConfig.
- **DO NOT** set `responseMimeType`.
- **DO NOT** set `responseSchema`.

**Correct**

```ts
// ... initialization ...

const response = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: 'What good Italian restaurants are nearby?',
  config: {
    tools: [{ googleMaps: {} }],
    toolConfig: { retrievalConfig: { latLng: { latitude: 37.78193, longitude: -122.40476 } } },
  },
});
console.log(response.text);
/* To get place URLs, in the form [{"maps": {"uri": "", "title": ""},  ... }] */
console.log(response.candidates?.[0]?.groundingMetadata?.groundingChunks);
```

The output response.text may not be in JSON format; do not attempt to parse it
as JSON. Unless specified otherwise, assume it is Markdown and render it as
such.

**Incorrect Config**

```ts
config: {
  tools: [{ googleMaps: {} }],
  responseMimeType: "application/json", // `responseMimeType` is not allowed when using the `googleMaps` tool.
  responseSchema: schema, // `responseSchema` is not allowed when using the `googleMaps` tool.
},
```

### URL Context

The URL context tool lets you provide additional context to the models in the
form of URLs. By including URLs in your request, the model accesses the content
from those pages to inform and enhance its response.

Config rules for using URL Context:

- The tool can process up to 20 URLs per request.

```ts
// ... initialization ...

const response = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: 'Summarize the recent events based on https://www.sfmoma.org',
  config: { tools: [{ urlContext: {} }] },
});
console.log(response.text);
```

### Embed Content

Generate embeddings for multimodal content (text, audio, image, and video).

```ts
import { GoogleGenAI } from '@google/genai';

// ... initialization ...

const result = await ai.models.embedContent({
  model: 'gemini-embedding-2-preview',
  contents: [
    'What is the meaning of life?',
    { inlineData: { data: base64ImageBytes, mimeType: 'image/png' } },
    { inlineData: { data: base64AudioBytes, mimeType: 'audio/mpeg' } },
  ],
});

console.log(result.embeddings);
```

### API Error Handling

- Implement robust handling for API errors (e.g., network issues, 4xx/5xx
  responses).
- Use graceful retry logic (like exponential backoff) to avoid overwhelming
  the backend and improve reliability.
