/**
 * @paulo-brito-jr/auth-client — tipos compartilhados
 *
 * Espelham os shapes reais emitidos pelo Brito Auth. Qualquer mudança de
 * contrato do lado do servidor (brito-auth) precisa ser refletida aqui:
 *   - AppToken            <- brito-auth/src/lib/jwt.ts (issueAppToken/verifyAppToken)
 *   - PermissionsSet      <- brito-auth/src/lib/permissions.ts (computePermissionsFor)
 *   - Member              <- brito-auth prisma/schema.prisma (model Member)
 */

/**
 * Payload do JWT emitido pelo Brito Auth (HS256, issuer=brito-auth,
 * audience=brito-apps). É o mesmo shape devolvido por:
 *   - POST /api/auth/verify (campo `user`)
 *   - o `st` do handshake SSO, depois de decodificado
 */
export type AppToken = {
  sub: string;
  email: string;
  name?: string;
  roles: string[];
  permissions: string[];
  superAdmin: boolean;
};

/**
 * Qualquer objeto que carregue `permissions[]` + `superAdmin` serve pro
 * hasPermission/requirePermission. AppToken e PermissionsSet satisfazem isto
 * estruturalmente — não precisa converter um no outro pra checar permissão.
 */
export type PermissionBearer = Pick<AppToken, "permissions" | "superAdmin">;

/**
 * Conjunto efetivo de permissões de um usuário (roles resolvidas + overrides
 * aplicados). Mesmo shape devolvido por:
 *   - GET /api/permissions/me      (usuário do bearer/sessão atual)
 *   - GET /api/permissions/lookup  (usuário arbitrário, por email, canal servidor-a-servidor)
 */
export type PermissionsSet = {
  email: string;
  roles: string[];
  permissions: string[];
  superAdmin: boolean;
};

/** Alias semântico — resposta de GET /api/permissions/me. */
export type PermissionsMeResponse = PermissionsSet;

/** Alias semântico — resposta de GET /api/permissions/lookup?email=. */
export type PermissionsLookupResponse = PermissionsSet;

/**
 * Um membro da família (fonte única, sem userId — GET /api/members).
 * Espelha o `select` da rota + o model Member do prisma/schema.prisma.
 */
export type Member = {
  id: string;
  name: string;
  icon: string;
  color: string;
  isShared: boolean;
  isParent: boolean;
  email: string | null;
  monthlyAllowance: number | null;
  order: number;
};

/** Envelope bruto de GET /api/members (fetchMembers já desembrulha pra Member[]). */
export type MembersResponse = {
  members: Member[];
};
