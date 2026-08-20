---
name: 'google-maps-platform'
description: >
  Provides architectural guidance and generates production-ready code for
  applications using Google Maps Platform. Specializes in building
  software with location APIs and SDKs such as Places API (New), Routes API, and Address
  Validation API, utilizing modern React patterns. Dynamically retrieves
  documentation and code context via the rpc_action tool to provide accurate
  implementation details. Use this skill
  when you need to implement any location-based application task or solution,
  such as a Store Locator, Checkout/shipping experiences with address
  validation, data visualizations on maps, or directions routing logic in a React
  application.
---

## Objective

Provide production-ready code patterns for Google Maps Platform integrations.
The goal is to help users go from zero to a working, polished map application
using modern GMP APIs, ensuring clean and minimal code.

## API Product Mapping

Use this use-case-to-product mapping to pick the right GMP products for common
mapping scenarios:

| Use Case                                   | Products                                 |
| ------------------------------------------ | ---------------------------------------- |
| Store locator / local discovery            | Map + Places API (New) — Nearby Search + |
| : : Routes API + AdvancedMarkers :         |
| Address entry / checkout                   | Places API (New) — Autocomplete          |
| : : (PlaceAutocompleteElement) + Address : |
| : : Validation API :                       |
| Data visualization (heatmaps,              | Map + deck.gl overlay (via               |
| : clusters) : `@deck.gl/google-maps`) :    |
| Directions / routing                       | Map + Routes API (Route.computeRoutes) + |
| : : createPolylines() :                    |
| Place search / details                     | Places API (New) — Text Search / Place   |
| : : Details via useMapsLibrary('places') : |

## Dynamic Documentation & Code Search

When you need the latest GMP code patterns, library versions, or specific API implementation details that are not covered in your static knowledge, you MUST use the `rpc_action` tool.

**Technical Details for `rpc_action`:**

- **service_name:** "gmp"
- **method_name:** "RetrieveCodeAssistContext"
- **arguments:** `{ "query": "string" }` (e.g., `{ "query": "React Advanced Markers clickable example" }`)

**Usage Guidelines:** 1. Identify the specific technical gap (e.g., "How do I
use the new Places Autocomplete in React?"). 2. Call `rpc_action` with
`service_name="gmp"` and `method_name="RetrieveCodeAssistContext"`. 3. Use the
returned context to generate accurate, up-to-date code.

## Knowledge Synthesis

The `rpc_action` tool provides general, up-to-date documentation for Google Maps
Platform. However, you MUST always prioritize and apply the environment-specific
rules defined in the **Constitution** and **Critical Failures** sections of this
skill.

For example: If the RPC tool provides a code sample using legacy
`DirectionsService` or omitting the required env-var build config, you MUST
refactor that code to use `Route.computeRoutes` and ensure `process.env` is
inlined at build time as specified in this skill.

> **STACK DO PROJETO: Bun apenas** — sem Vite, sem vite.config.ts, sem
> `import.meta.env`. O build é feito por `Bun.build` (build.ts) com
> `env: 'inline'`, então `process.env.<VAR>` é substituído em build time.
> NUNCA crie `vite.config.ts`.

## Constitution

SYSTEM RULES — Violating any rule produces a broken app:

1.  **API KEY SETUP (MANDATORY — EVERY FIRST RESPONSE MUST DO ALL THREE):** When
    the user has not yet provided an API key, you MUST do ALL THREE of the
    following. Skipping any one causes the user to get stuck:

    **A) TRIGGER THE "ENTER YOUR ENVIRONMENT VARIABLE TO CONTINUE" POPUP:** To
    enable the "Enter your environment variable to continue" popup, your
    application code MUST reference `process.env.GOOGLE_MAPS_PLATFORM_KEY`.
    Since the build is Bun (`Bun.build` com `env: 'inline'` in build.ts), the
    `process.env` value is inlined at build time — no vite.config.ts needed.
    Without that reference, the key from AI Studio Secrets will be invisible.

    **B) INCLUDE SETUP INSTRUCTIONS IN YOUR TEXT REPLY:** Your chat response
    MUST also include these instructions in case the popup doesn't appear:

    > **To add your API key:** 1. Get an API key:
    > https://console.cloud.google.com/google/maps-apis/start 2. When the
    > **"Enter your environment variable to continue"** popup appears, paste
    > your API key and press **Enter**. 3. Or manually: Open **Settings** (⚙️
    > gear icon, top-right corner) → **Secrets** → type
    > `GOOGLE_MAPS_PLATFORM_KEY` → **Enter** → paste key → **Enter**. 4. The app
    > rebuilds automatically - no page reload needed.

    **C) RENDER SPLASH SCREEN IN CODE:** The app MUST display a splash screen
    with setup instructions when `hasValidKey` is false (see 2D Map skeleton).

    **CRITICAL:** AIS secrets are injected at **build time**. After adding a
    secret, the user presses Enter and the app rebuilds automatically. Do NOT
    include a "reload page" button — a browser reload will NOT pick up the new
    key.

2.  **ATTRIBUTION:** ALL code MUST include `internalUsageAttributionIds` with
    value `gmp_mcp_codeassist_v1_aistudio` on every `<Map>` component.

3.  **FRAMEWORK POLICY:**

    - React → MUST use `@vis.gl/react-google-maps` (never `google-map-react`
      or `@react-google-maps/api`).
    - Angular → MUST use `@angular/google-maps`
      (https://github.com/angular/components/tree/main/src/google-maps).
    - Always use `version="weekly"`.

4.  **COST AWARENESS:** GMP is pay-as-you-go with per-SKU free usage caps:

    - Essentials: 10K free calls/month (map loads, geocoding, basic place
      fields)
    - Pro: 5K free calls/month (places with ratings/hours/phone)
    - Enterprise: 1K free calls/month (places with reviews, atmosphere data)
    - Places API (New) fields determine billing tier — request only what you
      need (see Places API (New) Field Reference).
    - Pricing: https://developers.google.com/maps/billing-and-pricing/pricing

5.  **NO LLM PLACE DATA:** All place data MUST come from GMP APIs, not LLM
    knowledge. DO NOT call any LLM to summarize or search for places.

## Critical Failures

MEMORIZE — These are the top runtime-error vectors. Violating ANY rule causes
silent failure or crash:

CF1 — CORS TRAP: Client-side `fetch()` to `googleapis.com` is BLOCKED by CORS.
ALWAYS use SDK wrappers (e.g., `importLibrary('places')`,
`importLibrary('routes')`).

CF2 — MAP HEIGHT COLLAPSE: `<Map>` (and `<gmp-map>`) needs explicit CSS height
(e.g., `height: '100vh'`). It silently collapses to 0x0 otherwise.

CF3 — INVISIBLE MARKERS: Custom HTML markers need explicit CSS sizing (`width:
40px; height: 40px;`). Without it they render at 0x0.

CF4 — SCHEMA HALLUCINATION: Places API (New) — Place Details uses `displayName`
(NOT `name`), `formattedAddress` (NOT `formatted_address`), `location` (NOT
`geometry.location`). `displayName` is a string in the JS SDK (unlike REST where
it's `{text, languageCode}`).

CF5 — LATLNG TRAP: Prefer POJO `{lat, lng}` literals. When class instance
required, use `new google.maps.LatLng(lat, lng)`. `LatLng` is from
`importLibrary("core")`, NOT `"maps"`.

CF6 — DEPRECATED PROPERTY TRAP: `PinElement.element` deprecated → use
`marker.appendChild(pin)`. `PinElement.glyph` deprecated → use `glyphText` or
`glyphSrc`. `AdvancedMarkerElement.content` (property setter) deprecated → use
`.appendChild()`. Use `addEventListener('gmp-click')` with `gmpClickable: true`
(GA since v3.62).

CF7 — DEPRECATED APIS: - NEVER use `DirectionsService` or `DirectionsRenderer`.
Use `Route.computeRoutes()` via `useMapsLibrary('routes')` in React or
`importLibrary('routes')` in vanilla JS. - NEVER use `HeatmapLayer` from the
visualization library (deprecated May 2025, removal May 2026). Use deck.gl
`HeatmapLayer` via `@deck.gl/aggregation-layers` with `GoogleMapsOverlay`.

CF8 — WEB COMPONENT PROPERTY vs ATTRIBUTE TRAP: React doesn't pass props as
properties to Web Components — it stringifies them into HTML attributes. For any
GMP web component used in React (e.g., `PlaceAutocompleteElement`), mount it
imperatively via `useRef` + `useEffect` and set properties directly on the DOM
element. NEVER pass complex objects (Circle, LatLngBounds, arrays) as JSX
attributes.

CF9 — PLACES API (NEW) FIELDS REQUIRED: `fetchFields()` (Place Details),
`searchByText()` (Text Search), `searchNearby()` (Nearby Search) all require a
`fields` array. Properties are `undefined` until fetched. Only request fields
you need (affects billing tier — see Places API (New) Field Reference below).

CF10 — NEARBY SEARCH REQUIRES `locationRestriction` with `{center, radius}` (max
50,000m). It does NOT accept `locationBias`. This is for `Place.searchNearby()`
only.

CF11 — TEXT SEARCH uses `textQuery` (NOT `query` or `text`). This is for
`Place.searchByText()` only.

CF12 — PHOTOS TRAP: Photos use `place.photos[0].getURI({maxWidth: 400})` — it's
`getURI()` NOT `getUrl()`. Photos are available via Place Details
`fetchFields({fields: ['photos']})`.

CF13 — ROUTE.COMPUTEROUTES FIELDS: `Route.computeRoutes()` requires a `fields`
array. Use `['path']` for basic polyline, `['speedPaths']` for traffic-colored
polylines. Must also pass `travelMode` (string: `'DRIVING'`, `'WALKING'`,
`'BICYCLING'`, `'TRANSIT'`).

CF14 — ENV VAR INLINE: process.env.GOOGLE_MAPS_PLATFORM_KEY will be undefined
in the browser, and the API key from AI Studio Secrets will NOT be accessible,
UNLESS the Bun build inlines it: build.ts uses `Bun.build` with
`env: 'inline'`, which substitutes `process.env.*` at build time. Ensure the
code references `process.env.GOOGLE_MAPS_PLATFORM_KEY` (never
`import.meta.env`/VITE_ vars — the project has no Vite).

## Code Skeletons

### Bun Build Config (inlined env — see Constitution Rule 2)

The project builds with Bun, not Vite. `build.ts` must include
`env: 'inline'` so `process.env.*` is substituted at build time:

```ts
await Bun.build({
  entrypoints: ['./index.ts'],
  outdir: './dist',
  target: 'bun',
  format: 'esm',
  packages: 'bundle',
  env: 'inline', // inlines process.env.* at build time (no vite.config.ts)
});
```

### React 2D Map (With Mandatory API Key Splash Screen)

```tsx
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

export default function App() {
  if (!hasValidKey) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 520 }}>
          <h2>Google Maps API Key Required</h2>
          <p>
            <strong>Step 1:</strong>{' '}
            <a href="https://console.cloud.google.com/google/maps-apis/start" target="_blank" rel="noopener">
              Get an API Key
            </a>
          </p>
          <p>
            <strong>Step 2:</strong> Add your key as a secret in AI Studio:
          </p>
          <ul style={{ textAlign: 'left', lineHeight: '1.8' }}>
            <li>
              Open <strong>Settings</strong> (⚙️ gear icon, <strong>top-right corner</strong>)
            </li>
            <li>
              Select <strong>Secrets</strong>
            </li>
            <li>
              Type <code>GOOGLE_MAPS_PLATFORM_KEY</code> as the secret name, press <strong>Enter</strong>
            </li>
            <li>
              Paste your API key as the value, press <strong>Enter</strong>
            </li>
          </ul>
          <p>The app rebuilds automatically after you add the secret.</p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <Map
        defaultCenter={{ lat: 37.42, lng: -122.08 }}
        defaultZoom={12}
        mapId="DEMO_MAP_ID"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100vh' }}
      >
        <AdvancedMarker position={{ lat: 37.42, lng: -122.08 }}>
          <Pin background="#4285F4" glyphColor="#fff" />
        </AdvancedMarker>
      </Map>
    </APIProvider>
  );
}
```

### React Places API (New) — Text Search + Markers

```tsx
import { useEffect, useState } from 'react';
import { AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

function PlaceSearch({ query }: { query: string }) {
  const placesLib = useMapsLibrary('places');
  const map = useMap();
  const [places, setPlaces] = useState<google.maps.places.Place[]>([]);

  useEffect(() => {
    if (!placesLib || !query) return;
    placesLib.Place.searchByText({
      textQuery: query,
      fields: ['displayName', 'location', 'formattedAddress'],
      locationBias: map?.getCenter(),
      maxResultCount: 8,
    }).then(({ places }) => setPlaces(places));
  }, [placesLib, query]);

  return (
    <>
      {places.map((p) => (
        <AdvancedMarker key={p.id} position={p.location} title={p.displayName} />
      ))}
    </>
  );
}
```

### React Routes computeRoutes + Polylines

```tsx
import { useEffect, useRef } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

function RouteDisplay({
  origin,
  destination,
}: {
  origin: string | google.maps.LatLngLiteral;
  destination: string | google.maps.LatLngLiteral;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!routesLib || !map) return;
    // Clear previous route
    polylinesRef.current.forEach((p) => p.setMap(null));

    routesLib.Route.computeRoutes({
      origin,
      destination,
      travelMode: 'DRIVING',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    }).then(({ routes }) => {
      if (routes?.[0]) {
        const newPolylines = routes[0].createPolylines();
        newPolylines.forEach((p) => p.setMap(map));
        polylinesRef.current = newPolylines;
        if (routes[0].viewport) map.fitBounds(routes[0].viewport);
      }
    });

    return () => polylinesRef.current.forEach((p) => p.setMap(null));
  }, [routesLib, map, origin, destination]);

  return null;
}
```

### React deck.gl Overlay

```tsx
import { useEffect } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { GoogleMapsOverlay } from '@deck.gl/google-maps';

function DeckGlOverlay({ layers }: { layers: any[] }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const overlay = new GoogleMapsOverlay({ layers });
    overlay.setMap(map);
    return () => overlay.setMap(null);
  }, [map, layers]);
  return null;
}
```

### React Marker + InfoWindow (useAdvancedMarkerRef anchor pattern)

```tsx
import { useState } from 'react';
import { AdvancedMarker, InfoWindow, Pin, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';

function MarkerWithInfoWindow({
  position,
  title,
  children,
}: {
  position: google.maps.LatLngLiteral;
  title: string;
  children?: React.ReactNode;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(false);

  return (
    <>
      <AdvancedMarker ref={markerRef} position={position} onClick={() => setOpen(true)}>
        <Pin background="#4285F4" glyphColor="#fff" />
      </AdvancedMarker>
      {open && (
        <InfoWindow anchor={marker} onCloseClick={() => setOpen(false)}>
          <strong>{title}</strong>
          {children}
        </InfoWindow>
      )}
    </>
  );
}
```

### React Address Validation

```tsx
import { useMapsLibrary } from '@vis.gl/react-google-maps';

// Inside a component:
const addressValidationLib = useMapsLibrary('addressValidation');

// In an async handler:
const result = await addressValidationLib.AddressValidation.fetchAddressValidation({
  address: { regionCode: 'US', addressLines: ['1600 Amphitheatre Pkwy'] },
});
console.log(result.verdict);
```

## Workflow

1.  **GATHER CONTEXT (RPC)**: If the request involves complex or new GMP features, use `rpc_action` (service_name: "gmp", method_name: "RetrieveCodeAssistContext") to get fresh documentation.
2.  **ENV VAR & API KEY SETUP**: Ensure the app references
    `process.env.GOOGLE_MAPS_PLATFORM_KEY` and that build.ts has `env: 'inline'`
    (Bun inlines `process.env.*` at build time — no vite.config.ts). Instruct
    the user on adding the key in AI Studio Secrets.
3.  **CODE GENERATION**: Synthesize the RPC response with the rules in this skill. Use `useMapsLibrary()` hooks for Places and Routes. Follow all critical failures strictly.
4.  **COST**: When using Places API (New), request only the fields needed for the UI to minimize billing tier impact.
