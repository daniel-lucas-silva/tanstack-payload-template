import type { CollectionConfig } from 'payload';

import { adminOnlyField, admins, authenticated, isUser, legacyKeyStrategy, selfOrAdmin } from '../access';

/**
 * A collection de auth "tudo ligado": estratégia customizada, API keys,
 * lockout, expiração de token, login por username, saveToJWT e field access.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    // Login por username (além de email). As 3 combinações possíveis:
    //   { requireEmail: true,  allowEmailLogin: false } — email obrigatório
    //   { requireEmail: false, allowEmailLogin: true  } — email OU username
    //   { requireEmail: false, allowEmailLogin: false } — só username
    loginWithUsername: { requireEmail: true, allowEmailLogin: true },
    // Lockout: após N tentativas falhas, bloqueia por lockTime ms.
    maxLoginAttempts: 5,
    lockTime: 5 * 60 * 1000,
    // Quanto tempo o JWT vale (segundos).
    tokenExpiration: 7200,
    // Gera chaves de API por usuário (header `Authorization: users API-Key <key>`).
    useAPIKey: true,
    // Sessões server-side (revogáveis), com claim `sid` no JWT.
    useSessions: true,
    // Não devolve o token no corpo das respostas (só cookie/header).
    removeTokenFromResponses: true,
    // Estratégia customizada, AO LADO da local.
    strategies: [{ name: 'legacy-key', authenticate: legacyKeyStrategy }],
    // Verificação de email e reset de senha exigem `email:` (adapter) no
    // buildConfig — descomente quando tiver o RESEND_API_KEY:
    // verify: true,
    // forgotPassword: { expiration: 60 * 60 * 1000 },
  },
  access: {
    // `admin` controla quem pode ENTRAR no painel (aqui irrelevante, mas
    // demonstra o tipo). Recebe `{ slug, req }` — e só aceita BOOLEAN (não Where).
    admin: ({ req }) => {
      const user = req.user;
      return isUser(user) && (user.roles?.includes('admin') ?? false);
    },
    create: () => true, // registro aberto
    read: authenticated,
    update: selfOrAdmin,
    delete: admins,
    // `unlock` decide quem pode desbloquear uma conta. Aqui: só a si mesmo.
    unlock: ({ req }) => {
      const user = req.user;
      if (!user) return false;
      return { id: { equals: user.id } };
    },
  },
  fields: [
    { name: 'name', type: 'text' },
    // `saveToJWT` grava o campo DENTRO do token, evitando um lookup no banco
    // a cada request. Funciona com select/hasMany e dentro de group/tab.
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: ['admin', 'editor', 'viewer'],
      defaultValue: ['viewer'],
      saveToJWT: true,
    },
    // Field-level access: campo visível/gravável só por admin.
    // Aplica-se a TODA leitura do doc (find, findByID, /me, JWT).
    { name: 'salary', type: 'number', access: { read: adminOnlyField, update: adminOnlyField } },
    // Campo usado pela estratégia customizada acima.
    { name: 'legacyKey', type: 'text', unique: true },
  ],
};
