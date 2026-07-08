/**
 * Checa se `setOrToken` (um AppToken decodificado OU qualquer PermissionsSet
 * — ambos satisfazem PermissionBearer estruturalmente) tem a permissão
 * `want`.
 */
export function hasPermission(setOrToken, want) {
    if (setOrToken.superAdmin)
        return true;
    if (setOrToken.permissions.includes(want))
        return true;
    const parts = want.split(".");
    if (parts.length === 3) {
        const wildcard = `${parts[0]}.*.${parts[2]}`;
        if (setOrToken.permissions.includes(wildcard))
            return true;
    }
    return false;
}
/**
 * Guard: joga `Error("forbidden: missing permission <want>")` se `setOrToken`
 * não tiver a permissão `want`. Usar em server actions / route handlers antes
 * de mutar dado.
 */
export function requirePermission(setOrToken, want) {
    if (!hasPermission(setOrToken, want)) {
        throw new Error(`forbidden: missing permission ${want}`);
    }
}
//# sourceMappingURL=permissions.js.map