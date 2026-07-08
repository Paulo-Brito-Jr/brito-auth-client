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
export declare function createSsoGuard(opts: SsoGuardOptions): (request: Request, hasSession: boolean) => Response | null;
//# sourceMappingURL=middleware.d.ts.map