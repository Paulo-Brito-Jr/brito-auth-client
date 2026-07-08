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
export function hasPermission(setOrToken: PermissionBearer, want: string): boolean {
  if (setOrToken.superAdmin) return true;
  if (setOrToken.permissions.includes(want)) return true;

  const parts = want.split(".");
  if (parts.length === 3) {
    const wildcard = `${parts[0]}.*.${parts[2]}`;
    if (setOrToken.permissions.includes(wildcard)) return true;
  }

  return false;
}

/**
 * Guard: joga `Error("forbidden: missing permission <want>")` se `setOrToken`
 * não tiver a permissão `want`. Usar em server actions / route handlers antes
 * de mutar dado.
 */
export function requirePermission(setOrToken: PermissionBearer, want: string): void {
  if (!hasPermission(setOrToken, want)) {
    throw new Error(`forbidden: missing permission ${want}`);
  }
}
