/**
 * Server runtime polyfills for Bun & Node.js environment compatibility
 */
import v8 from 'node:v8';

// Polyfill node:v8 startupSnapshot for Bun (used by bson/mongodb)
if (v8 && (v8 as any).startupSnapshot) {
  try {
    (v8 as any).startupSnapshot.isBuildingSnapshot = () => false;
  } catch {}
}

if (globalThis.process?.getBuiltinModule) {
  const orig = globalThis.process.getBuiltinModule.bind(globalThis.process);
  globalThis.process.getBuiltinModule = function (mod: string) {
    if (mod === 'v8') {
      const v8Mod = orig(mod);
      return {
        ...v8Mod,
        startupSnapshot: {
          isBuildingSnapshot: () => false,
        },
      };
    }
    return orig(mod);
  };
}
