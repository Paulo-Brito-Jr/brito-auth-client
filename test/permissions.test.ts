import { test } from "node:test";
import assert from "node:assert/strict";
import { hasPermission, requirePermission } from "../src/permissions.ts";
import type { PermissionBearer } from "../src/types.ts";

const bearer = (permissions: string[], superAdmin = false): PermissionBearer => ({
  permissions,
  superAdmin,
});

test("superAdmin bypassa qualquer checagem, mesmo sem permissões", () => {
  const su = bearer([], true);
  assert.equal(hasPermission(su, "financas.transacao.write"), true);
  assert.equal(hasPermission(su, "qualquer.coisa.aqui"), true);
});

test("match exato do slug de 3 partes", () => {
  const b = bearer(["financas.transacao.write"]);
  assert.equal(hasPermission(b, "financas.transacao.write"), true);
  assert.equal(hasPermission(b, "financas.transacao.read"), false);
});

test("wildcard <app>.*.<acao> cobre qualquer entidade daquele app+ação", () => {
  const b = bearer(["financas.*.read"]);
  assert.equal(hasPermission(b, "financas.transacao.read"), true);
  assert.equal(hasPermission(b, "financas.conta.read"), true);
});

test("wildcard respeita a AÇÃO — read não cobre write", () => {
  const b = bearer(["financas.*.read"]);
  assert.equal(hasPermission(b, "financas.transacao.write"), false);
});

test("wildcard NÃO vaza entre apps diferentes", () => {
  const b = bearer(["financas.*.read"]);
  assert.equal(hasPermission(b, "agenda.tarefa.read"), false);
});

test("wildcard só se aplica a `want` de exatamente 3 partes", () => {
  const b = bearer(["financas.*.read"]);
  // 2 partes: não expande wildcard
  assert.equal(hasPermission(b, "financas.read"), false);
  // 4 partes: não expande wildcard
  assert.equal(hasPermission(b, "financas.transacao.linha.read"), false);
});

test("uma permissão literal de 2 partes só casa exata", () => {
  const b = bearer(["admin.panel"]);
  assert.equal(hasPermission(b, "admin.panel"), true);
  assert.equal(hasPermission(b, "admin.panel.open"), false);
});

test("conjunto vazio nega tudo (sem superAdmin)", () => {
  const b = bearer([]);
  assert.equal(hasPermission(b, "financas.transacao.read"), false);
});

test("requirePermission não joga quando a permissão existe", () => {
  const b = bearer(["financas.transacao.write"]);
  assert.doesNotThrow(() => requirePermission(b, "financas.transacao.write"));
});

test("requirePermission joga com a mensagem esperada quando falta", () => {
  const b = bearer(["financas.transacao.read"]);
  assert.throws(
    () => requirePermission(b, "financas.transacao.write"),
    /forbidden: missing permission financas\.transacao\.write/,
  );
});

test("requirePermission passa livre pra superAdmin", () => {
  const su = bearer([], true);
  assert.doesNotThrow(() => requirePermission(su, "o.que.for"));
});
