---
name: gemini-connect
description: >
  Provides special guidance on how to use the Gemini API for Gemini Connect.
  The model requests require specialized handling compared to using
  @google/genai TypeScript SDK. Use when the author wants to use Gemini Connect
  for their AI (LLM, GenAI, etc.) capabilities for text generation, or when the
  user's request mentions Gemini, Gemini API, @google/genai, or the GenAI SDK.
  Gemini Connect requires using an OAuth Client and the
  https://www.googleapis.com/auth/generative-language.peruserquota scope. If
  the user explicitly mentions wanting to use "Gemini Connect" or a
  corresponding `auth-utils.ts` using an OAuth client with the mentioned scope
  exists, assume the user wants to use Gemini Connect.
---

## Authentication

> [!IMPORTANT]
> **Do not use Firebase for creating OAuth brands or clients, and do not prompt the user to create a brand and client in Cloud Console.** The OAuth client
> setup in Cloud's console has already been done at this point. Assume OAuth client setup already exists and client id secret is provided in the
> environment. You may inform the user about it, but do not ask them to perform any setup actions.

When calling Gemini's generate content on behalf of the app's user, use a normal
fetch call instead of the SDK. You can handle both authentication and the API
call directly on the client side.

> [!IMPORTANT] You MUST always request the
> `https://www.googleapis.com/auth/generative-language.peruserquota` scope in
> the OAuth token request.

### 1. Client-Side Authentication (GIS)

To handle authentication on the client side, use the **Google Identity Services (GIS)** library to obtain an access token.

If the applet does not have a "Sign in with Google" button already, you MUST add
one. You MUST style this button to resemble the official "Sign in with Google"
button style. Here is an example of how to add the button:

```html
<button class="gsi-material-button">
  <div class="gsi-material-button-state"></div>
  <div class="gsi-material-button-content-wrapper">
    <div class="gsi-material-button-icon">
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        style="display: block;"
      >
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        ></path>
        <path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        ></path>
        <path
          fill="#FBBC05"
          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        ></path>
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        ></path>
        <path fill="none" d="M0 0h48v48H0z"></path>
      </svg>
    </div>
    <span class="gsi-material-button-contents">Sign in with Google</span>
    <span style="display: none;">Sign in with Google</span>
  </div>
</button>
```

After the user signs in, use the access token to fetch the user info from
"https://www.googleapis.com/oauth2/v3/userinfo". Replace the "Sign in with
Google button" with the user's profile picture. When the profile is clicked,
show the user's name, email, and allow the user to sign out.

Make sure the GIS library is loaded in your HTML (e.g., in `index.html`):

```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

> [!IMPORTANT] You **MUST** implement in-memory caching for the access token.
> Always check for a valid, non-expired cached token before calling
> `requestAccessToken()` to prevent redundant OAuth popups during the same user
> session.

Here is an example of how to use GIS to get the access token on the client:

```typescript
declare const google: any; // If @types/google.accounts is not installed

const CLIENT_ID = '<CLIENT_ID secret>';
const SCOPES = ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/generative-language.peruserquota'].join(
  ' ',
);

export const getAccessToken = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.access_token) {
            resolve(response.access_token);
          } else {
            reject(new Error('Failed to get access token: ' + (response.error || 'Unknown error')));
          }
        },
      });
      client.requestAccessToken();
    } catch (error) {
      reject(error);
    }
  });
};
```

### 2. Client-Side API Call

> [!IMPORTANT]
>
> - **Supported models** for Gemini Connect are limited to:
>   - Gemini 3 Flash Preview (`gemini-3-flash-preview`)
>   - Gemini 3.1 Flash Lite Preview (`gemini-3.1-flash-lite-preview`)
>   - Gemini 3.1 Flash Image Preview (`gemini-3.1-flash-image-preview`)
>   - Gemini 3.1 Flash TTS Preview (`gemini-3.1-flash-tts-preview`)
>   - Gemini 3.1 Pro Preview (`gemini-3.1-pro-preview`)
>   - Gemini 3 Pro Image Preview (`gemini-3-pro-image-preview`)
> - **Unsupported Models**: If the user specifies a model not listed above, you MUST notify them that Gemini Connect is not supported for that model.
> - **Authentication**: Do **NOT** use the Gemini API key for this call. You MUST use the OAuth access token in the `Authorization` header.
> - **Data Extraction**: Refer to the `gemini-api` skill for how to extract part data (e.g., text, image, audio) from the `GenerateContentResponse`.

Here is an example of how to call the Gemini API using the access token obtained above:

```typescript
import { GenerateContentResponse } from '@google/genai';

export class QuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

export const generateContent = async (
  accessToken: string,
  request: { model: string; contents: any; generationConfig?: any },
): Promise<
  Omit<GenerateContentResponse, 'text' | 'data' | 'functionCalls' | 'executableCode' | 'codeExecutionResult'>
> => {
  const url = `https://generativelanguage.googleapis.com/v1alpha/models/${request.model}:generateContentPerUserQuota`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
    body: JSON.stringify({ contents: request.contents, generationConfig: request.generationConfig }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('API Error:', errorData);

    if (response.status === 429 || errorData.error?.status === 'RESOURCE_EXHAUSTED') {
      throw new QuotaExceededError(errorData.error?.message || 'Quota exceeded. Please upgrade.');
    }

    throw new Error(errorData.error?.message || 'Failed to get a response from the API.');
  }

  return response.json();
};
```

## CLIENT_ID

For the client id, use `process.env.GEMINI_CLIENT_ID` (Bun inlines
`process.env.*` at build time — no Vite `import.meta.env`, no `NEXT_PUBLIC_*`).

## API Error Handling & Quota UI

Whenever you build or modify an application that mentions "Gemini Connect", uses
the `https://www.googleapis.com/auth/generative-language.peruserquota` scope, or
specifically makes API calls using the `generateContentPerUserQuota` method via
the Gemini API per-user quota endpoint, you MUST implement the following error
handling and UI logic:

### 1. Error Interception & Handling

- Implement a global API error handler (e.g., using a `fetch` wrapper or a
  centralized error state context) for these specific endpoint calls.
- If the API returns a `429 Too Many Requests` status code, you must intercept
  it and handle it internally as a `402 Payment Required` equivalent state
  (e.g., by throwing a `QuotaExceededError` as shown in the example above).
- When this state occurs, you MUST block the current flow and display the
  "Quota Upgrade Notification" component to the user.

### 2. Component Display & Adaptability

The component must be adaptable and responsive to different layouts while
maintaining consistent styling:

- **Apps with a prompt input component:** Display the notification just above
  the input, as a pop-up, or as a bottom sheet.
- **Apps without a prompt input (e.g., AI features activated by button
  clicks):** Display the notification as a pop-up, toast, or overlay.

### 3. Exact Component Specifications

The component MUST strictly follow these styling and content rules to ensure
consistency across all apps:

> [!NOTE] The styling specifications below use Tailwind CSS classes as examples.
> If the target application uses a different styling system (e.g., plain CSS,
> CSS modules, styled-components), you must adapt these styles to achieve the
> equivalent visual result.

- **Wrapper:** A container with a conic-gradient border (`conic-gradient(from
0deg at 50% 50%, #323336 19.35%, #4285F4 31.96%, #1AA64A 53.75%, #323336
74.94%, #FCBD00 81.08%, #DB372D 89.49%, #323336 100%)`).
- **Card Body:** Inner card supporting light/dark mode (`bg-white
dark:bg-[#141414]`, rounded corners, appropriate padding).
- **Title:** "Upgrade to continue your flow" (styled with `text-gray-900
dark:text-[#d4d4d4]`, `text-sm`, `font-normal`).
- **Description:** "You’ve reached your AI usage limit for the day, you can
  wait for it to reset or upgrade to continue and unlock even more." (styled
  with `text-gray-600 dark:text-[#8c8c8c]`, `text-sm`, `font-normal`).
- **Action Button:** An anchor tag styled as a button labeled "Continue to
  upgrade" that opens `https://one.google.com/ai?utm_source=ai_studio` in a
  new tab (`target="_blank" rel="noopener noreferrer"`, styled with
  `bg-gray-100 dark:bg-[#323232]`, `text-gray-900 dark:text-[#fcfcfc]`, with
  appropriate borders and hover states).

> [!TIP] The link `https://one.google.com/ai?utm_source=ai_studio` may not
> automatically select the correct account if the user is signed into multiple
> Google Accounts. If the application has access to the user's account index or
> identifier, consider dynamically constructing the URL (e.g.,
> `https://one.google.com/u/N/ai...`) to ensure it opens for the correct
> account.
