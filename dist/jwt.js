/**
 * Verificação LOCAL (sem round-trip de rede) do JWT emitido pelo Brito Auth.
 *
 * Use isto quando o app cliente tiver acesso ao mesmo `JWT_SECRET` do
 * brito-auth (modo "trusted"/monorepo). Pra apps que só recebem o token
 * efêmero `st` do handshake SSO (caso comum — a maioria dos apps NÃO tem o
 * JWT_SECRET), use `verifyBritoToken` de `./sso.js` (POST /api/auth/verify).
 */
import { jwtVerify } from "jose";
/** Issuer fixo do Brito Auth — precisa casar com brito-auth/src/lib/jwt.ts. */
export const BRITO_AUTH_ISSUER = "brito-auth";
/** Audience fixa do Brito Auth — precisa casar com brito-auth/src/lib/jwt.ts. */
export const BRITO_AUTH_AUDIENCE = "brito-apps";
/**
 * Valida um JWT emitido pelo Brito Auth (HS256, issuer=brito-auth,
 * audience=brito-apps) e devolve o AppToken decodificado.
 *
 * `secret` precisa ser IDÊNTICO ao `JWT_SECRET` configurado no brito-auth.
 * Joga (via jose) se o token for inválido, expirado, ou tiver issuer/audience
 * incorretos.
 */
export async function verifyAppToken(token, secret) {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key, {
        issuer: BRITO_AUTH_ISSUER,
        audience: BRITO_AUTH_AUDIENCE,
    });
    return {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        roles: payload.roles ?? [],
        permissions: payload.permissions ?? [],
        superAdmin: payload.superAdmin ?? false,
    };
}
//# sourceMappingURL=jwt.js.map