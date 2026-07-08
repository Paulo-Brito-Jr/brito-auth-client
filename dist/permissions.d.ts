/**
 * RBAC do Brito Auth — implementação CANÔNICA única do wildcard.
 *
 * Semântica idêntica ao servidor (brito-auth/src/lib/permissions.ts,
 * `hasPermission`) — se um dia divergir, uma das duas está errada:
 *   1. superAdmin bypassa qualquer checagem.
 *   2. match exato do slug `<app>.<entidade>.<acao>`.
 *   3. wildcard `<app>.*.<acao>` no lado das permissions cobre qualquer
 *      entidade daquele app+ação (só quando `want` tem exatamente 3 partes).
 */
import type { PermissionBearer } from "./types.js";
/**
 * Checa se `setOrToken` (um AppToken decodificado OU qualquer PermissionsSet
 * — ambos satisfazem PermissionBearer estruturalmente) tem a permissão
 * `want`.
 */
export declare function hasPermission(setOrToken: PermissionBearer, want: string): boolean;
/**
 * Guard: joga `Error("forbidden: missing permission <want>")` se `setOrToken`
 * não tiver a permissão `want`. Usar em server actions / route handlers antes
 * de mutar dado.
 */
export declare function requirePermission(setOrToken: PermissionBearer, want: string): void;
//# sourceMappingURL=permissions.d.ts.map