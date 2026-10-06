// API de la demonlist. Guarda en Netlify Blobs.
// GET  /api/data          -> { state }   (público: lo ve cualquiera)
// GET  /api/img/<id>      -> imagen subida
// POST /api/check         -> { ok }      (contraseña en cabecera x-edit-password)
// POST /api/data          -> guarda { baseRev, state } si la contraseña es correcta
// POST /api/img           -> sube { data: "data:image/jpeg;base64,..." }
import { getStore } from "@netlify/blobs";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";

const STORE = "demonlist";
const MAX_STATE = 1_500_000;      // bytes del JSON
const MAX_IMG = 700_000;          // bytes de una imagen subida
const IMG_URL = /^(img\/[A-Za-z0-9._\/-]{1,120}|\/api\/img\/[a-f0-9]{16,40})$/;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

function samePassword(given, expected) {
  const a = createHash("sha256").update(String(given || "")).digest();
  const b = createHash("sha256").update(String(expected)).digest();
  return timingSafeEqual(a, b);
}

const str = (v, max) => typeof v === "string" && v.length <= max;

function checkLevel(L) {
  if (!L || typeof L !== "object") return "nivel inválido";
  if (!str(L.id, 80) || !L.id) return "id de nivel inválido";
  if (!str(L.name, 80) || !L.name.trim()) return "nombre de nivel inválido";
  if (!str(L.creator, 60) || !str(L.a, 60) || !str(L.diff, 30) || !str(L.date, 12)) return "campo de nivel demasiado largo";
  if (!str(L.notes, 600) || !str(L.video, 300)) return "campo de nivel demasiado largo";
  if (typeof L.n !== "number" || !Number.isFinite(L.n) || L.n < 0 || L.n > 1e9) return "intentos inválidos";
  if (L.video && !/^https?:\/\//i.test(L.video)) return "el video debe ser un link http(s)";
  if (L.img && !IMG_URL.test(L.img)) return "imagen inválida";
  if (L.meme !== undefined && L.meme !== 0 && L.meme !== 1 && typeof L.meme !== "boolean") return "meme inválido";
  return null;
}

function checkState(s) {
  if (!s || typeof s !== "object") return "estado inválido";
  if (!s.site || !str(s.site.title, 60) || !str(s.site.tag, 160)) return "datos del sitio inválidos";
  if (s.site.avatar && !IMG_URL.test(s.site.avatar)) return "avatar inválido";
  if (!Array.isArray(s.players) || s.players.length < 1 || s.players.length > 6) return "jugadores inválidos";
  const ids = new Set();
  for (const p of s.players) {
    if (!p || !/^p\d{1,2}$/.test(p.id) || ids.has(p.id)) return "id de jugador inválido";
    ids.add(p.id);
    if (!str(p.name, 40) || !p.name.trim()) return "nombre de jugador inválido";
    if (!Array.isArray(p.levels) || p.levels.length > 300) return "lista de niveles inválida";
    const seen = new Set();
    for (const L of p.levels) {
      const err = checkLevel(L);
      if (err) return err;
      if (seen.has(L.id)) return "id de nivel repetido";
      seen.add(L.id);
    }
  }
  return null;
}

export default async (req) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/?/, "").replace(/\/$/, "");
  const store = getStore(STORE);

  try {
    if (req.method === "GET" && path === "data") {
      const state = await store.get("state", { type: "json" });
      return json({ state: state || null });
    }

    if (req.method === "GET" && path.startsWith("img/")) {
      const id = path.slice(4);
      if (!/^[a-f0-9]{16,40}$/.test(id)) return new Response("Bad request", { status: 400 });
      const r = await store.getWithMetadata("img-" + id, { type: "arrayBuffer" });
      if (!r) return new Response("Not found", { status: 404 });
      return new Response(r.data, {
        headers: { "content-type": (r.metadata && r.metadata.type) || "image/jpeg", "cache-control": "public, max-age=31536000, immutable" },
      });
    }

    if (req.method === "POST") {
      const expected = process.env.EDIT_PASSWORD;
      if (!expected) return json({ error: "Falta configurar EDIT_PASSWORD en Netlify." }, 503);
      if (!samePassword(req.headers.get("x-edit-password"), expected)) return json({ error: "Contraseña incorrecta." }, 401);

      if (path === "check") return json({ ok: true });

      if (path === "data") {
        const raw = await req.text();
        if (raw.length > MAX_STATE + 2000) return json({ error: "Demasiados datos." }, 413);
        let body;
        try { body = JSON.parse(raw); } catch { return json({ error: "JSON inválido." }, 400); }
        const err = checkState(body.state);
        if (err) return json({ error: err }, 400);
        const current = await store.get("state", { type: "json" });
        const curRev = (current && current.rev) || 0;
        if ((body.baseRev || 0) !== curRev) return json({ error: "conflict", state: current }, 409);
        const next = { ...body.state, rev: curRev + 1 };
        if (JSON.stringify(next).length > MAX_STATE) return json({ error: "Demasiados datos." }, 413);
        await store.setJSON("state", next);
        return json({ ok: true, rev: next.rev });
      }

      if (path === "img") {
        let body;
        try { body = await req.json(); } catch { return json({ error: "JSON inválido." }, 400); }
        const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec((body && body.data) || "");
        if (!m) return json({ error: "Imagen inválida." }, 400);
        const bytes = Buffer.from(m[2], "base64");
        if (!bytes.length || bytes.length > MAX_IMG) return json({ error: "La imagen es demasiado grande." }, 413);
        const id = randomUUID().replace(/-/g, "").slice(0, 24);
        await store.set("img-" + id, bytes, { metadata: { type: m[1] } });
        return json({ ok: true, url: "/api/img/" + id });
      }
    }

    return json({ error: "No encontrado." }, 404);
  } catch (e) {
    console.error(e);
    return json({ error: "Error del servidor." }, 500);
  }
};

export const config = { path: "/api/*" };
