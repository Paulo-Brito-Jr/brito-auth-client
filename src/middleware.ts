/**
 * Guard de SSO pra proxy.ts/middleware.ts do app cliente — espelha o padrão
 * já em produção em brito-skynet/proxy.ts e casa-inteligente/web/proxy.ts:
 * sem sessão local -> redireciona pro handshake SSO com
 * `return=<finishPath>?next=<pathname original>`.
 *
 * Framework-agnóstico de propósito: opera só com `Request`/`Response` padrão
 * do fetch (funciona em Next 16 proxy.ts, que aceita `Response` puro como
 * retorno de middleware, e em qualquer outro runtime fetch-standard). Esta
 * lib não sabe COMO o app guarda sessão (cookie Supabase, cookie NextAuth
 * próprio, etc.) — quem chama decide `hasSession` e passa pronto.
 */
import { ssoStartUrl } from "./sso.js";

export type SsoGuardOptions = {
  /** App id estável, cadastrado em SSO_CLIENTS no brito-auth (ex: "agenda-brito"). */
  appId: string;
  /** Default DEFAULT_BRITO_AUTH_URL (https://auth.britos.app). */
  britoAuthUrl?: string;
  /** Prefixes de path que NUNCA redirecionam pro SSO (ex: ["/login", "/api/"]). */
  skipPrefixes?: string[];
  /** Rota local que troca o `st` pelo AppToken e cria a sessão do app. Default "/api/sso/finish". */
  finishPath?: string;
};

/**
 * Factory: devolve uma função guard `(request, hasSession) => Response | null`.
 *
 * - `null`     -> a request pode seguir (tem sessão OU o path está em `skipPrefixes`).
 * - `Response` -> redirect (307) pro handshake SSO; o caller deve devolver isto direto.
 *
 * Uso (Next 16 `proxy.ts`, no padrão do brito-skynet):
 * ```ts
 * import { createSsoGuard } from "@paulo-brito-jr/auth-client/middleware";
 *
 * const guard = createSsoGuard({
 *   appId: "agenda-brito",
 *   skipPrefixes: ["/login", "/api/", "/_next"],
 * });
 *
 * export async function proxy(request: NextRequest) {
 *   const { response, userId } = await updateSession(request); // lib de sessão do PRÓPRIO app
 *   const redirect = guard(request, Boolean(userId));
 *   if (redirect) return redirect;
 *   return response;
 * }
 * ```
 */
export function createSsoGuard(opts: SsoGuardOptions) {
  const { appId, britoAuthUrl, skipPrefixes = [], finishPath = "/api/sso/finish" } = opts;

  return function ssoGuard(request: Request, hasSession: boolean): Response | null {
    if (hasSession) return null;

    const url = new URL(request.url);
    if (skipPrefixes.some((prefix) => url.pathname.startsWith(prefix))) return null;

    const finishUrl = new URL(finishPath, url.origin);
    finishUrl.searchParams.set("next", url.pathname + url.search);

    const target = ssoStartUrl({ app: appId, returnUrl: finishUrl.toString(), britoAuthUrl });
    return Response.redirect(target, 307);
  };
}
