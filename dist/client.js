/**
 * Chamadas REST diretas ao Brito Auth (fora do handshake SSO) — refresh de
 * permissões, revalidação servidor-a-servidor, e listagem de membros.
 */
import { DEFAULT_BRITO_AUTH_URL } from "./sso.js";
/**
 * GET /api/permissions/me — roles/permissions efetivas + superAdmin do
 * usuário dono do `bearer`. Útil pra refrescar o conjunto de permissões sem
 * reissue de JWT (ex: uma role foi concedida depois que o token foi emitido).
 *
 * Joga se a resposta não for ok (401 = bearer inválido/expirado).
 */
export async function fetchPermissionsMe(opts) {
    const base = opts.britoAuthUrl ?? DEFAULT_BRITO_AUTH_URL;
    const r = await fetch(new URL("/api/permissions/me", base), {
        headers: { Authorization: `Bearer ${opts.bearer}` },
        cache: "no-store",
    });
    if (!r.ok)
        throw new Error(`fetchPermissionsMe: ${r.status}`);
    return (await r.json());
}
/**
 * GET /api/permissions/lookup?email=<email> — roles/permissions/superAdmin
 * de UM OUTRO usuário (não depende do usuário ter um token vivo). Resolve o
 * buraco do handshake SSO (token de 60s) e do /api/permissions/me (exige
 * sessão do próprio usuário): o BACKEND do app cliente revalida direto com o
 * brito-auth, autenticado com token de serviço.
 *
 * Devolve `null` se o email não corresponder a nenhum usuário conhecido
 * (404 — não é erro, é resposta válida). Joga pra qualquer outro status não-ok
 * (401 = token de serviço errado, 503 = brito-auth sem a env configurada).
 */
export async function fetchPermissionsByEmail(opts) {
    const base = opts.britoAuthUrl ?? DEFAULT_BRITO_AUTH_URL;
    const u = new URL("/api/permissions/lookup", base);
    u.searchParams.set("email", opts.email);
    const r = await fetch(u, {
        headers: { Authorization: `Bearer ${opts.lookupToken}` },
        cache: "no-store",
    });
    if (r.status === 404)
        return null;
    if (!r.ok)
        throw new Error(`fetchPermissionsByEmail: ${r.status}`);
    return (await r.json());
}
/**
 * GET /api/members — lista de membros da família (fonte única, sem userId;
 * todos os apps leem daqui). Devolve `Member[]` já desembrulhado do envelope
 * `{members: [...]}`.
 */
export async function fetchMembers(opts) {
    const base = opts.britoAuthUrl ?? DEFAULT_BRITO_AUTH_URL;
    const r = await fetch(new URL("/api/members", base), {
        headers: { Authorization: `Bearer ${opts.bearer}` },
        cache: "no-store",
    });
    if (!r.ok)
        throw new Error(`fetchMembers: ${r.status}`);
    const body = (await r.json());
    return body.members;
}
//# sourceMappingURL=client.js.map