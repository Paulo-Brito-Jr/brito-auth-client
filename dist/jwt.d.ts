import type { AppToken } from "./types.js";
/** Issuer fixo do Brito Auth — precisa casar com brito-auth/src/lib/jwt.ts. */
export declare const BRITO_AUTH_ISSUER = "brito-auth";
/** Audience fixa do Brito Auth — precisa casar com brito-auth/src/lib/jwt.ts. */
export declare const BRITO_AUTH_AUDIENCE = "brito-apps";
/**
 * Valida um JWT emitido pelo Brito Auth (HS256, issuer=brito-auth,
 * audience=brito-apps) e devolve o AppToken decodificado.
 *
 * `secret` precisa ser IDÊNTICO ao `JWT_SECRET` configurado no brito-auth.
 * Joga (via jose) se o token for inválido, expirado, ou tiver issuer/audience
 * incorretos.
 */
export declare function verifyAppToken(token: string, secret: string): Promise<AppToken>;
//# sourceMappingURL=jwt.d.ts.map