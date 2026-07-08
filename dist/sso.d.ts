/**
 * Handshake SSO do Brito Auth — mesmo padrão já em produção em
 * brito-skynet/lib/brito-auth-sso.ts, agenda-brito/src/app/login/page.tsx,
 * rodizio-maranata, maranata-escala, acampamento-maranata (todos consumindo
 * `/api/sso/start` e `/api/sso/logout` do brito-auth com query params fixos
 * `app` + `return`).
 */
import type { AppToken } from "./types.js";
/** Default do Brito Auth em produção. Overridável via `britoAuthUrl` em cada chamada. */
export declare const DEFAULT_BRITO_AUTH_URL = "https://auth.britos.app";
export type SsoUrlOptions = {
    /** App id estável, cadastrado em SSO_CLIENTS no brito-auth (ex: "agenda-brito"). */
    app: string;
    /** URL absoluta de volta pro app cliente depois do handshake (precisa ter origin whitelisted no brito-auth). */
    returnUrl: string;
    /** Default DEFAULT_BRITO_AUTH_URL (https://auth.britos.app). */
    britoAuthUrl?: string;
};
/**
 * Monta a URL de handshake SSO: GET /api/sso/start?app=<app>&return=<returnUrl>.
 *
 * Se o usuário já tiver sessão no Brito Auth, ele é redirecionado de volta
 * pra `returnUrl` com `?st=<jwt-efêmero-60s>` — trocar por AppToken via
 * `verifyBritoToken`. Sem sessão, o brito-auth manda pro próprio /login e
 * volta aqui depois.
 *
 * Ver brito-auth/src/app/api/sso/start/route.ts.
 */
export declare function ssoStartUrl(opts: SsoUrlOptions): string;
/**
 * Monta a URL de logout global: GET /api/sso/logout?app=<app>&return=<returnUrl>.
 *
 * Encerra a sessão NextAuth do Brito Auth (não só o cookie local do app) —
 * sem isso, o próximo handshake devolveria um `st` novo silenciosamente e o
 * usuário "voltaria" logado sozinho.
 *
 * Ver brito-auth/src/app/api/sso/logout/route.ts.
 */
export declare function ssoLogoutUrl(opts: SsoUrlOptions): string;
export type VerifyBritoTokenOptions = {
    /** Default DEFAULT_BRITO_AUTH_URL (https://auth.britos.app). */
    britoAuthUrl?: string;
};
/**
 * Troca o token efêmero `st` (recebido em `<returnUrl>?st=...` depois do
 * handshake) pelo AppToken completo, via POST /api/auth/verify.
 *
 * Devolve `null` (nunca joga) se o token for inválido/expirado ou a request
 * falhar — trate como "sem sessão" no caller.
 *
 * IMPORTANTE: hoje a maioria dos apps clientes (brito-skynet, rodizio-maranata
 * etc.) só extrai `{sub, email, name}` da resposta e descarta
 * roles/permissions/superAdmin. Esta função tipa a resposta COMPLETA — prefira
 * usá-la e checar `hasPermission(token, ...)` direto, em vez de um segundo GET
 * em /api/permissions/me.
 */
export declare function verifyBritoToken(st: string, opts?: VerifyBritoTokenOptions): Promise<AppToken | null>;
//# sourceMappingURL=sso.d.ts.map