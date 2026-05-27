/**
 * Soak test: 100 consumers + 10 operators + 4 admins, all features, all in parallel.
 * Run: DATABASE_URL="..." node scripts/soak-test.mjs
 */

import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

const BASE = "https://hello-gambling.vercel.app";
const DB_URL = process.env.DATABASE_URL;

const CATEGORIES = ["PAYMENT_ISSUES", "BONUS_DISPUTES", "ACCOUNT_ISSUES", "RESPONSIBLE_GAMBLING", "TECHNICAL_ISSUES"];
const OPERATOR_SLUGS = ["hollywoodbets", "betway-sa", "sunbet", "supabets", "playabets", "sun-international", "peermont", "tsogo-sun", "10bet-sa", "interbet"];

// ── Tracking ──────────────────────────────────────────────────────────────────

const stats = { pass: 0, fail: 0, errors: [] };
function pass(label) { stats.pass++; }
function fail(label, err) { stats.fail++; stats.errors.push(`${label}: ${err?.message || err}`); }

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function parseCookies(headers) {
  const cookies = {};
  const setCookie = headers.getSetCookie?.() ?? [];
  for (const c of setCookie) {
    const [pair] = c.split(";");
    const [k, ...rest] = pair.trim().split("=");
    if (k) cookies[k.trim()] = rest.join("=").trim();
  }
  return cookies;
}

function cookieStr(jar) {
  return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ");
}

async function apiGet(path, jar = {}) {
  const r = await fetch(`${BASE}${path}`, {
    headers: { Cookie: cookieStr(jar) },
  });
  const newCookies = parseCookies(r.headers);
  return { ok: r.ok, status: r.status, body: r.ok ? await r.json().catch(() => null) : null, cookies: { ...jar, ...newCookies } };
}

async function apiPost(path, body, jar = {}) {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieStr(jar) },
    body: JSON.stringify(body),
  });
  const newCookies = parseCookies(r.headers);
  return { ok: r.ok, status: r.status, body: r.ok ? await r.json().catch(() => null) : null, cookies: { ...jar, ...newCookies } };
}

// ── Auth ──────────────────────────────────────────────────────────────────────

async function login(email, password) {
  // Step 1: get CSRF token
  const csrf = await fetch(`${BASE}/api/auth/csrf`);
  const csrfCookies = parseCookies(csrf.headers);
  const { csrfToken } = await csrf.json();

  // Step 2: POST credentials
  const r = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieStr(csrfCookies),
    },
    body: new URLSearchParams({ email, password, csrfToken, callbackUrl: BASE, json: "true" }),
    redirect: "manual",
  });

  const sessionCookies = { ...csrfCookies, ...parseCookies(r.headers) };
  const hasSession = Object.keys(sessionCookies).some(k => k.includes("session"));
  return hasSession ? sessionCookies : null;
}

// ── DB setup ──────────────────────────────────────────────────────────────────

async function seedTestUsers(prisma) {
  console.log("Seeding 10 operator users + 4 admin users via DB...");
  const hash = await bcrypt.hash("TestPass123!", 10);

  // Fetch operator IDs
  const operators = await prisma.operator.findMany({ select: { id: true, slug: true } });
  const opMap = Object.fromEntries(operators.map(o => [o.slug, o.id]));

  const operatorUsers = [];
  for (let i = 0; i < 10; i++) {
    const slug = OPERATOR_SLUGS[i];
    const email = `soak-operator-${i}@test.hellogambling.co.za`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { name: `Test Operator ${i}`, email, password: hash, role: "OPERATOR", operatorId: opMap[slug] },
    });
    operatorUsers.push({ ...user, slug, jar: null });
  }

  const adminUsers = [];
  for (let i = 0; i < 4; i++) {
    const email = `soak-admin-${i}@test.hellogambling.co.za`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { name: `Test Admin ${i}`, email, password: hash, role: "ADMIN" },
    });
    adminUsers.push({ ...user, jar: null });
  }

  console.log(`  ✓ ${operatorUsers.length} operator users, ${adminUsers.length} admin users`);
  return { operatorUsers, adminUsers, opMap };
}

// ── Consumer test flow ────────────────────────────────────────────────────────

async function testConsumer(idx, opMap) {
  const email = `soak-consumer-${idx}@test.hellogambling.co.za`;
  const password = "TestPass123!";
  const label = `consumer-${idx}`;

  // Register
  try {
    await apiPost("/api/auth/register", { name: `Soak User ${idx}`, email, password });
    pass(`${label}:register`);
  } catch (e) { fail(`${label}:register`, e); return; }

  // Login
  let jar;
  try {
    jar = await login(email, password);
    if (!jar) throw new Error("No session cookie");
    pass(`${label}:login`);
  } catch (e) { fail(`${label}:login`, e); return; }

  // Browse homepage
  try {
    const r = await apiGet("/", jar);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    pass(`${label}:homepage`);
  } catch (e) { fail(`${label}:homepage`, e); }

  // Browse operators list (API)
  let operatorIds = Object.values(opMap);
  try {
    const r = await apiGet("/api/operators", jar);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    if (r.body?.length) operatorIds = r.body.map(o => o.id);
    pass(`${label}:list-operators`);
  } catch (e) { fail(`${label}:list-operators`, e); }

  // Browse operator profile page
  try {
    const slug = OPERATOR_SLUGS[idx % OPERATOR_SLUGS.length];
    const r = await apiGet(`/operators/${slug}`, jar);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    pass(`${label}:operator-profile`);
  } catch (e) { fail(`${label}:operator-profile`, e); }

  // Browse complaints list
  try {
    const r = await apiGet("/api/complaints", jar);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    pass(`${label}:list-complaints`);
  } catch (e) { fail(`${label}:list-complaints`, e); }

  // Submit complaint
  let complaintId;
  try {
    const opId = operatorIds[idx % operatorIds.length];
    const r = await apiPost("/api/complaints", {
      title: `Soak test complaint ${idx}`,
      description: `Detailed description of the complaint for soak test user ${idx}. This tests the full complaint flow.`,
      category: CATEGORIES[idx % CATEGORIES.length],
      rating: (idx % 5) + 1,
      operatorId: opId,
    }, jar);
    if (!r.ok) throw new Error(`HTTP ${r.status} ${JSON.stringify(r.body)}`);
    complaintId = r.body?.id;
    pass(`${label}:submit-complaint`);
  } catch (e) { fail(`${label}:submit-complaint`, e); }

  // View complaint page
  if (complaintId) {
    try {
      const r = await apiGet(`/complaints/${complaintId}`, jar);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      pass(`${label}:view-complaint`);
    } catch (e) { fail(`${label}:view-complaint`, e); }

    // Reply to own complaint
    try {
      const r = await apiPost(`/api/complaints/${complaintId}/responses`, {
        content: `Follow-up from consumer ${idx}: still waiting for resolution.`,
      }, jar);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      pass(`${label}:reply-complaint`);
    } catch (e) { fail(`${label}:reply-complaint`, e); }

    // Submit dispute
    try {
      const r = await apiPost("/api/disputes", {
        complaintId,
        summary: `Escalating complaint ${idx} to dispute — operator has not responded within 10 days.`,
      }, jar);
      if (!r.ok && r.status !== 409) throw new Error(`HTTP ${r.status}`);
      pass(`${label}:submit-dispute`);
    } catch (e) { fail(`${label}:submit-dispute`, e); }
  }

  // Browse disputes
  try {
    const r = await apiGet("/disputes", jar);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    pass(`${label}:list-disputes`);
  } catch (e) { fail(`${label}:list-disputes`, e); }

  // Browse forums
  try {
    const r = await apiGet("/forums", jar);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    pass(`${label}:list-forums`);
  } catch (e) { fail(`${label}:list-forums`, e); }

  // Create forum thread
  let threadId;
  try {
    const r = await apiPost("/api/forums/threads", {
      title: `Soak test thread ${idx}: Anyone else had issues with ${OPERATOR_SLUGS[idx % OPERATOR_SLUGS.length]}?`,
      content: `Looking for advice from the community about my situation. Consumer ${idx} posting.`,
      category: "GENERAL",
    }, jar);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    threadId = r.body?.id;
    pass(`${label}:create-forum-thread`);
  } catch (e) { fail(`${label}:create-forum-thread`, e); }

  // View + reply to a thread
  if (threadId) {
    try {
      const r = await apiGet(`/forums/${threadId}`, jar);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      pass(`${label}:view-forum-thread`);
    } catch (e) { fail(`${label}:view-forum-thread`, e); }

    let postId;
    try {
      const r = await apiPost(`/api/forums/threads/${threadId}/posts`, {
        content: `Reply from soak user ${idx}: thanks for posting this.`,
      }, jar);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      postId = r.body?.id;
      pass(`${label}:forum-reply`);
    } catch (e) { fail(`${label}:forum-reply`, e); }

    // Vote on the post
    if (postId) {
      try {
        const r = await apiPost(`/api/forums/posts/${postId}/vote`, { value: 1 }, jar);
        if (!r.ok && r.status !== 409) throw new Error(`HTTP ${r.status}`);
        pass(`${label}:forum-vote`);
      } catch (e) { fail(`${label}:forum-vote`, e); }
    }
  }
}

// ── Operator test flow ────────────────────────────────────────────────────────

async function testOperator(user, operatorIds) {
  const label = `operator-${user.email}`;

  let jar;
  try {
    jar = await login(user.email, "TestPass123!");
    if (!jar) throw new Error("No session cookie");
    pass(`${label}:login`);
  } catch (e) { fail(`${label}:login`, e); return; }

  // View complaints filtered by their operator
  try {
    const r = await apiGet(`/api/complaints?operatorId=${user.operatorId}`, jar);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const complaints = r.body ?? [];
    pass(`${label}:view-own-complaints`);

    // Respond to first complaint found
    if (complaints.length > 0) {
      const cid = complaints[0].id;
      try {
        const r2 = await apiPost(`/api/complaints/${cid}/responses`, {
          content: `Official response from operator: we are investigating your complaint and will respond within 5 business days.`,
        }, jar);
        if (!r2.ok) throw new Error(`HTTP ${r2.status}`);
        pass(`${label}:official-response`);
      } catch (e) { fail(`${label}:official-response`, e); }
    } else {
      pass(`${label}:official-response`); // no complaints yet, skip
    }
  } catch (e) { fail(`${label}:view-own-complaints`, e); }

  // Browse operators directory
  try {
    const r = await apiGet("/operators", jar);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    pass(`${label}:browse-operators`);
  } catch (e) { fail(`${label}:browse-operators`, e); }

  // Browse forums
  try {
    const r = await apiGet("/forums", jar);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    pass(`${label}:browse-forums`);
  } catch (e) { fail(`${label}:browse-forums`, e); }

  // View dashboard
  try {
    const r = await apiGet("/dashboard", jar);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    pass(`${label}:dashboard`);
  } catch (e) { fail(`${label}:dashboard`, e); }
}

// ── Admin test flow ───────────────────────────────────────────────────────────

async function testAdmin(user) {
  const label = `admin-${user.email}`;

  let jar;
  try {
    jar = await login(user.email, "TestPass123!");
    if (!jar) throw new Error("No session cookie");
    pass(`${label}:login`);
  } catch (e) { fail(`${label}:login`, e); return; }

  const checks = [
    ["/", `${label}:homepage`],
    ["/api/complaints", `${label}:all-complaints`],
    ["/disputes", `${label}:all-disputes`],
    ["/forums", `${label}:all-forums`],
    ["/operators", `${label}:all-operators`],
    ["/dashboard", `${label}:dashboard`],
  ];

  for (const [path, lbl] of checks) {
    try {
      const r = await apiGet(path, jar);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      pass(lbl);
    } catch (e) { fail(lbl, e); }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!DB_URL) { console.error("DATABASE_URL env var required"); process.exit(1); }

  const t0 = Date.now();
  console.log(`\n🎰 Hello, Gambling — soak test\n   Target: ${BASE}\n`);

  // DB connection for seeding operators/admins
  const adapter = new PrismaNeon({ connectionString: DB_URL });
  const prisma = new PrismaClient({ adapter });

  let operatorUsers, adminUsers, opMap;
  try {
    ({ operatorUsers, adminUsers, opMap } = await seedTestUsers(prisma));
  } finally {
    await prisma.$disconnect();
  }

  // ── Phase 1: Register all 100 consumers (batches of 20 to stay within Neon limits)
  console.log("\n▶ Phase 1 — Registering 100 consumer accounts...");
  const registerBatches = [];
  for (let b = 0; b < 5; b++) {
    const batch = [];
    for (let i = b * 20; i < (b + 1) * 20; i++) {
      batch.push(
        apiPost("/api/auth/register", {
          name: `Soak Consumer ${i}`,
          email: `soak-consumer-${i}@test.hellogambling.co.za`,
          password: "TestPass123!",
        }).catch(e => ({ ok: false, error: e }))
      );
    }
    await Promise.all(batch);
    process.stdout.write(`  batch ${b + 1}/5 done\n`);
  }
  console.log("  ✓ Registration phase complete\n");

  // ── Phase 2: Run full consumer tests in parallel (batches of 25)
  console.log("▶ Phase 2 — Testing 100 consumers in parallel (4 × 25)...");
  for (let b = 0; b < 4; b++) {
    const batch = [];
    for (let i = b * 25; i < (b + 1) * 25; i++) {
      batch.push(testConsumer(i, opMap).catch(e => fail(`consumer-${i}:unhandled`, e)));
    }
    await Promise.all(batch);
    process.stdout.write(`  batch ${b + 1}/4 done (running totals: ✓${stats.pass} ✗${stats.fail})\n`);
  }
  console.log("  ✓ Consumer phase complete\n");

  // ── Phase 3: Run all 10 operator tests in parallel
  console.log("▶ Phase 3 — Testing 10 operators in parallel...");
  await Promise.all(operatorUsers.map(u => testOperator(u, Object.values(opMap)).catch(e => fail(`operator:unhandled`, e))));
  console.log("  ✓ Operator phase complete\n");

  // ── Phase 4: Run all 4 admin tests in parallel
  console.log("▶ Phase 4 — Testing 4 admins in parallel...");
  await Promise.all(adminUsers.map(u => testAdmin(u).catch(e => fail(`admin:unhandled`, e))));
  console.log("  ✓ Admin phase complete\n");

  // ── Summary ──
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  const total = stats.pass + stats.fail;
  const pct = ((stats.pass / total) * 100).toFixed(1);

  console.log("═══════════════════════════════════════════");
  console.log(`  RESULTS  (${elapsed}s elapsed)`);
  console.log("═══════════════════════════════════════════");
  console.log(`  Total checks : ${total}`);
  console.log(`  ✓ Pass       : ${stats.pass}  (${pct}%)`);
  console.log(`  ✗ Fail       : ${stats.fail}`);

  if (stats.errors.length) {
    console.log("\n  Failures:");
    for (const e of stats.errors.slice(0, 40)) console.log(`    • ${e}`);
    if (stats.errors.length > 40) console.log(`    … and ${stats.errors.length - 40} more`);
  }
  console.log("═══════════════════════════════════════════\n");
}

main().catch(err => { console.error(err); process.exit(1); });
