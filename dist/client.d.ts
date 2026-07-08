import type { Member, PermissionsLookupResponse, PermissionsMeResponse } from "./types.js";
export type FetchPermissionsMeOptions = {
    /** Default DEFAULT_BRITO_AUTH_URL (https://auth.britos.app). */
    britoAuthUrl?: string;
    /** App token (JWT) do usuário logado — vira `Authorization: Bearer <bearer>`. */
    bearer: string;
};
/**
 * GET /api/permissions/me — roles/permissions efetivas + superAdmin do
 * usuário dono do `bearer`. Útil pra refrescar o conjunto de permissões sem
 * reissue de JWT (ex: uma role foi concedida depois que o token foi emitido).
 *
 * Joga se a resposta não for ok (401 = bearer inválido/expirado).
 */
export declare function fetchPermissionsMe(opts: FetchPermissionsMeOptions): Promise<PermissionsMeResponse>;
export type FetchPermissionsByEmailOptions = {
    /** Default DEFAULT_BRITO_AUTH_URL (https://auth.britos.app). */
    britoAuthUrl?: string;
    email: string;
    /**
     * Token de SERVIÇO (não é o JWT de um usuário) — comparado no brito-auth
     * contra `PERMISSIONS_LOOKUP_TOKEN` (fallback `SKYNET_ADMIN_TOKEN`). Nunca
     * exponha esse token pro browser — chame isto só do backend do app cliente.
     */
    lookupToken: string;
};
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
export declare function fetchPermissionsByEmail(opts: FetchPermissionsByEmailOptions): Promise<PermissionsLookupResponse | null>;
export type FetchMembersOptions = {
    /** Default DEFAULT_BRITO_AUTH_URL (https://auth.britos.app). */
    britoAuthUrl?: string;
    /** App token (JWT) do usuário logado — vira `Authorization: Bearer <bearer>`. */
    bearer: string;
};
/**
 * GET /api/members — lista de membros da família (fonte única, sem userId;
 * todos os apps leem daqui). Devolve `Member[]` já desembrulhado do envelope
 * `{members: [...]}`.
 */
export declare function fetchMembers(opts: FetchMembersOptions): Promise<Member[]>;
//# sourceMappingURL=client.d.ts.map