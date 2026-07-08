# @paulo-brito-jr/auth-client

Cliente canônico de **SSO + RBAC** do [Brito Auth](https://auth.britos.app) pros
apps da família Brito (Agenda&Tarefas, Finanças, Brito's Skynet, Casa
Inteligente, apps Maranata etc). Decodifica/verifica o JWT, expõe
`hasPermission`/`requirePermission` com wildcard, monta as URLs de handshake
SSO, e dá um guard pronto pra `proxy.ts`/`middleware.ts`.

Estrutura (dist/ com declarations, exports map por subpath) espelha o
[`brito-ai-kit`](https://github.com/Paulo-Brito-Jr/brito-ai-kit). Lógica de
JWT/RBAC é uma evolução tipada do rascunho `packages/auth-client`
(`@brito/auth-client`) que vivia dentro do repo `brito-auth` — ver
[Aposentadoria do rascunho](#aposentadoria-do-rascunho-antigo) abaixo.

## Instalação (consumo canônico: git submodule)

Este pacote **não é publicado no npm**. Cada app cliente traz o repo como
submodule em `vendor/` e aponta o `package.json` pra ele via `file:` — mesmo
padrão já usado pelo `brito-ai-kit` em `agenda-brito` e `brito-skynet`.

```bash
# na raiz do app cliente
git submodule add https://github.com/Paulo-Brito-Jr/brito-auth-client.git vendor/brito-auth-client
```

```jsonc
// package.json do app cliente
{
  "dependencies": {
    "@paulo-brito-jr/auth-client": "file:vendor/brito-auth-client"
  }
}
```

```bash
pnpm install
```

Como o `dist/` já vem **commitado** no repo, o app cliente NUNCA precisa
rodar build deste pacote — só `pnpm install` depois de clonar/atualizar o
submodule.

Pra atualizar depois:

```bash
cd vendor/brito-auth-client && git pull origin main && cd ../..
pnpm install
```

## API

### Tipos (`.`)

```ts
type AppToken = {
  sub: string;
  email: string;
  name?: string;
  roles: string[];
  permissions: string[];
  superAdmin: boolean;
};

type PermissionsSet = { email: string; roles: string[]; permissions: string[]; superAdmin: boolean };
type PermissionsMeResponse = PermissionsSet;      // GET /api/permissions/me
type PermissionsLookupResponse = PermissionsSet;  // GET /api/permissions/lookup

type Member = {
  id: string; name: string; icon: string; color: string;
  isShared: boolean; isParent: boolean;
  email: string | null; monthlyAllowance: number | null; order: number;
};
```

### JWT local (`.`)

```ts
import { verifyAppToken } from "@paulo-brito-jr/auth-client";

// Só funciona se o app tiver o MESMO JWT_SECRET do brito-auth (modo "trusted").
const token = await verifyAppToken(jwt, process.env.JWT_SECRET!);
// token: AppToken { sub, email, name?, roles[], permissions[], superAdmin }
```

### Permissões / RBAC (`.` ou `@paulo-brito-jr/auth-client/permissions`)

```ts
import { hasPermission, requirePermission } from "@paulo-brito-jr/auth-client/permissions";

hasPermission(token, "rodizio.ministro.editar");     // exato
hasPermission(token, "rodizio.ministro.editar");     // wildcard: token tem "rodizio.*.editar"
hasPermission(token, "qualquer.coisa.aqui");         // sempre true se token.superAdmin

requirePermission(token, "skynet.tarefas.remover");  // joga Error se faltar
```

`hasPermission`/`requirePermission` aceitam **qualquer** objeto com
`permissions[]` + `superAdmin` — `AppToken`, `PermissionsMeResponse` e
`PermissionsLookupResponse` servem igual (tipo `PermissionBearer`,
estrutural). Semântica **idêntica** ao servidor
(`brito-auth/src/lib/permissions.ts`): superAdmin bypassa tudo; wildcard
`<app>.*.<acao>` cobre qualquer entidade daquele app+ação.

Não importa `jose` — pode rodar em qualquer runtime (inclusive Edge) sem
pull de dependência extra.

### SSO (`.` ou `@paulo-brito-jr/auth-client/sso`)

```ts
import { ssoStartUrl, ssoLogoutUrl, verifyBritoToken } from "@paulo-brito-jr/auth-client/sso";

// 1. App sem sessão redireciona pro handshake
const finishUrl = new URL("/api/sso/finish", origin);
finishUrl.searchParams.set("next", "/tasks");
redirect(ssoStartUrl({ app: "agenda-brito", returnUrl: finishUrl.toString() }));

// 2. brito-auth redireciona de volta pra <finishUrl>?st=<jwt-60s>
// 3. rota /api/sso/finish do app troca o st pelo AppToken completo:
export async function GET(req: NextRequest) {
  const st = req.nextUrl.searchParams.get("st");
  const next = req.nextUrl.searchParams.get("next") ?? "/";
  if (!st) return NextResponse.json({ erro: "token ausente" }, { status: 400 });

  const token = await verifyBritoToken(st); // AppToken | null — já vem com roles/permissions/superAdmin
  if (!token) return NextResponse.json({ erro: "token inválido" }, { status: 401 });

  await signInWithBritoUser(token); // cria a sessão local do app (NextAuth, Supabase, cookie próprio...)
  return NextResponse.redirect(new URL(next, req.url));
}

// Logout global (limpa a sessão do brito-auth também, não só a local)
redirect(ssoLogoutUrl({ app: "agenda-brito", returnUrl: "https://agenda.britos.app/login" }));
```

`britoAuthUrl` é opcional em toda a API — default `https://auth.britos.app`.

**Nota:** hoje os apps clientes (`brito-skynet`, `rodizio-maranata`,
`maranata-escala`, `acampamento-maranata`...) chamam `POST /api/auth/verify` e
só extraem `{sub, email, name}`, descartando `roles`/`permissions`/
`superAdmin` que a resposta JÁ traz. `verifyBritoToken` tipa a resposta
**completa** — ao migrar pra este pacote, prefira checar `hasPermission(token,
...)` direto em vez de um segundo GET em `/api/permissions/me`.

### Permissões via REST / membros (`.`)

```ts
import { fetchPermissionsMe, fetchPermissionsByEmail, fetchMembers } from "@paulo-brito-jr/auth-client";

// Refresh sem reissue de JWT (usuário logado, tem o próprio bearer)
const mine = await fetchPermissionsMe({ bearer: appToken });

// Revalidação servidor-a-servidor (SÓ backend — token de serviço, nunca no browser)
// GET /api/permissions/lookup?email=... (PERMISSIONS_LOOKUP_TOKEN, fallback SKYNET_ADMIN_TOKEN)
const other = await fetchPermissionsByEmail({
  email: "jubrito@gmail.com",
  lookupToken: process.env.PERMISSIONS_LOOKUP_TOKEN!,
});
// null se o email não corresponder a nenhum usuário (404) — não joga nesse caso

const members = await fetchMembers({ bearer: appToken }); // Member[]
```

### Guard de middleware (`.` ou `@paulo-brito-jr/auth-client/middleware`)

Framework-agnóstico: opera só com `Request`/`Response` do fetch padrão — não
sabe COMO o app guarda sessão (Supabase, cookie NextAuth próprio, etc.); quem
chama resolve `hasSession` e passa pronto. Mesmo padrão já em produção em
`brito-skynet/proxy.ts` e `casa-inteligente/web/proxy.ts`.

```ts
// src/proxy.ts (Next 16) — estilo cookie-jose (checa cookie próprio direto)
import { NextResponse, type NextRequest } from "next/server";
import { createSsoGuard } from "@paulo-brito-jr/auth-client/middleware";

const guard = createSsoGuard({
  appId: "agenda-brito",
  skipPrefixes: ["/login", "/api/", "/_next"],
});

export async function proxy(request: NextRequest) {
  const hasSession = Boolean(
    request.cookies.get("authjs.session-token") ??
      request.cookies.get("__Secure-authjs.session-token"),
  );
  const redirect = guard(request, hasSession);
  if (redirect) return redirect;
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

```ts
// estilo NextAuth credentials — sessão resolvida via lib própria (ex: Supabase updateSession)
import { createSsoGuard } from "@paulo-brito-jr/auth-client/middleware";
import { updateSession } from "@/lib/supabase/middleware";

const guard = createSsoGuard({ appId: "brito-skynet", skipPrefixes: ["/login", "/api/", "/observador/"] });

export async function proxy(request: NextRequest) {
  const { response, userId } = await updateSession(request);
  const redirect = guard(request, Boolean(userId));
  return redirect ?? response;
}
```

## Build

```bash
pnpm install   # só jose (dependency) + typescript (devDependency), nada mais
pnpm build     # tsc -p tsconfig.build.json -> dist/ (com .d.ts)
pnpm typecheck # tsc --noEmit
```

`dist/` é **commitado** (mesmo padrão do `brito-ai-kit`) — consumidores via
submodule nunca precisam buildar.

## Pendências

- **`lint:strict` é um stub no-op.** Não há `node_modules` com eslint num
  repo novo, e a política de dependências do Paulo proíbe instalar algo além
  de `jose`+`typescript` sem autorização explícita — então o script existe
  só pra não quebrar o `.githooks/pre-push` (que sempre roda
  `$RUN lint:strict`), mas não faz lint de verdade ainda. Quando o Paulo
  autorizar, configurar eslint (`eslint-config-next` não se aplica aqui — é
  pacote puro, sem Next; usar um flat config simples tipo o do
  `brito-ai-kit`/`brito-auth`) e trocar o stub por `eslint --max-warnings 0`.
- **Publicação em registry:** não configurada de propósito — o consumo
  canônico é submodule + `file:`, não `npm install`. Se algum dia precisar
  publicar (ex: GitHub Packages, como o `brito-ai-kit` faz em
  `.github/workflows/publish.yml`), replicar aquele workflow aqui.
- **`/api/permissions/lookup`** foi implementado em paralelo a este pacote
  (L99 Onda 3.B, `brito-auth` commit `feat(permissions): endpoint
  /api/permissions/lookup...`) — o shape tipado aqui (`PermissionsLookupResponse`)
  já bate com a implementação real (`computePermissionsFor`, mesmo shape de
  `/api/permissions/me`), mas vale reconferir se o contrato mudar antes do
  primeiro app migrar de verdade.

## Aposentadoria do rascunho antigo

O rascunho `packages/auth-client` (`@brito/auth-client`, workspace interno do
repo `brito-auth`) é **substituído** por este pacote. Ele:

- não tinha build (`main`/`types` apontavam pro `.ts` cru);
- só cobria `verifyAppToken`/`hasPermission`/`requirePermission`/`fetchPermissionsMe`;
- não tinha SSO (`ssoStartUrl`/`ssoLogoutUrl`/`verifyBritoToken`), lookup por
  email, `fetchMembers`, nem o guard de middleware.

**Nada foi apagado** — `brito-auth/packages/auth-client` continua existindo e
não é consumido por nenhum workspace hoje. A aposentadoria acontece quando o
`brito-auth` (e os apps clientes, um a um) migrarem pra importar deste pacote
via `vendor/brito-auth-client` em vez do workspace local ou de cópias soltas
de `lib/brito-auth-sso.ts`/`lib/brito-auth.ts` espalhadas em
`brito-skynet`, `rodizio-maranata`, `maranata-escala`, `acampamento-maranata`,
`agenda-brito`, `casa-inteligente`.

## Slugs de permissão

`<app>.<entidade>.<acao>` — ex: `skynet.tarefas.editar`,
`pastoral.compromisso.remover`, `rodizio.ministro.criar`. Wildcard
`<app>.*.<acao>` cobre qualquer entidade do app. Roles seedadas no Brito
Auth: `super-admin` (bypass total via `superAdmin=true`), `viewer-global`
(lê tudo). Roles específicas por app são criadas em
`auth.britos.app/admin/permissoes`.
