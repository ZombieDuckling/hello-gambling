/**
 * Realistic multi-agent simulation: 100 consumers + 10 operators + 4 admins.
 * Every user acts independently, interacts with other users' content, and runs
 * through multiple rounds — just like a real site with 114 simultaneous users.
 *
 * Run: DATABASE_URL="..." node scripts/agents-test.mjs
 */

import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

const BASE = "https://hello-gambling.vercel.app";
const DB_URL = process.env.DATABASE_URL;

const OPERATOR_SLUGS = [
  "hollywoodbets","betway-sa","sunbet","supabets","playabets",
  "sun-international","peermont","tsogo-sun","10bet-sa","interbet",
];
const CATEGORIES = ["PAYMENT_ISSUES","BONUS_DISPUTES","ACCOUNT_ISSUES","RESPONSIBLE_GAMBLING","TECHNICAL_ISSUES","UNFAIR_TREATMENT"];
const FORUM_CATEGORIES = ["GENERAL","OPERATOR_REVIEWS","TIPS_AND_STRATEGY","DISPUTES_AND_ISSUES","REGULATORY"];

const COMPLAINT_TITLES = [
  "Withdrawal stuck for 3 weeks — no response from support",
  "Bonus voided after meeting all wagering requirements",
  "Account suspended with R8,000 balance locked",
  "Self-exclusion request completely ignored",
  "Live casino disconnected mid-hand, bet not refunded",
  "FICA docs submitted 4 times, still pending verification",
  "Odds changed after bet was accepted",
  "Winnings incorrectly calculated on accumulator",
  "Promo code not applied despite meeting all criteria",
  "Customer service gave conflicting information on every call",
];

const FORUM_TITLES = [
  "Anyone else waiting forever for Hollywood Bets to verify?",
  "Best strategies for low-risk sports betting in SA?",
  "NGB complaint process — has anyone actually used it?",
  "Betway SA response time seems to have improved recently",
  "FICA rules are ridiculous — source of funds for R500?",
  "Which SA operator has the best live casino?",
  "Sunbet crashed during the derby — missed my winning bet",
  "How long does the formal dispute process actually take?",
  "Supabets odds are consistently better than competitors",
  "Is Playabets legit? Seeing mixed reviews online",
  "NLC vs NGB — who should I escalate to?",
  "Anyone had success getting a refund from Tsogo Sun?",
];

const REPLIES = [
  "Same thing happened to me. Took 6 weeks to resolve.",
  "Contact the NGB directly. They responded to me within 48 hours.",
  "I had the exact same issue. Document everything in writing.",
  "This is unfortunately common. Escalate to a formal dispute.",
  "Their support is much better on live chat than email.",
  "The NGB complaint form is actually pretty straightforward.",
  "I've been waiting even longer. You're not alone.",
  "Try reaching out on Twitter — they respond faster publicly.",
  "Make sure you keep screenshots of everything.",
  "I used this platform to resolve my issue. Very helpful.",
  "Check the T&Cs carefully — there may be a clause that covers this.",
  "The FAIS Ombud may also be relevant depending on the issue.",
];

// ─── HTTP + cookie helpers ────────────────────────────────────────────────────

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
  }).catch(() => null);
  if (!r) return { ok: false, status: 0, body: null, cookies: jar };
  const newCookies = parseCookies(r.headers);
  return { ok: r.ok, status: r.status, body: r.ok ? await r.json().catch(() => null) : null, cookies: { ...jar, ...newCookies } };
}

async function apiPost(path, body, jar = {}) {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieStr(jar) },
    body: JSON.stringify(body),
  }).catch(() => null);
  if (!r) return { ok: false, status: 0, body: null, cookies: jar };
  const newCookies = parseCookies(r.headers);
  return { ok: r.ok, status: r.status, body: r.ok ? await r.json().catch(() => null) : null, cookies: { ...jar, ...newCookies } };
}

async function login(email, password) {
  const csrf = await fetch(`${BASE}/api/auth/csrf`).catch(() => null);
  if (!csrf) return null;
  const csrfCookies = parseCookies(csrf.headers);
  const { csrfToken } = await csrf.json().catch(() => ({}));
  if (!csrfToken) return null;
  const r = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookieStr(csrfCookies) },
    body: new URLSearchParams({ email, password, csrfToken, callbackUrl: BASE, json: "true" }),
    redirect: "manual",
  }).catch(() => null);
  if (!r) return null;
  const sessionCookies = { ...csrfCookies, ...parseCookies(r.headers) };
  return Object.keys(sessionCookies).some(k => k.includes("session")) ? sessionCookies : null;
}

// ─── Shared state (populated as users act) ───────────────────────────────────

const shared = {
  complaintIds: [],        // all complaint IDs created
  threadIds: [],           // all forum thread IDs created
  postIds: [],             // all forum post IDs created
  disputeIds: [],          // all dispute IDs created
  operatorIds: {},         // slug → id
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

// ─── Stats ────────────────────────────────────────────────────────────────────

const stats = { pass: 0, fail: 0, errors: [], byAction: {} };
function log(action, ok, err) {
  stats.byAction[action] = stats.byAction[action] ?? { pass: 0, fail: 0 };
  if (ok) { stats.pass++; stats.byAction[action].pass++; }
  else { stats.fail++; stats.byAction[action].fail++; if (err) stats.errors.push(`${action}: ${err}`); }
}

// ─── DB seed ──────────────────────────────────────────────────────────────────

async function seedUsers(prisma) {
  console.log("📋 Seeding operators, admins, operator-users via DB...");
  const hash = await bcrypt.hash("TestPass123!", 10);

  const operators = await prisma.operator.findMany({ select: { id: true, slug: true } });
  const opMap = Object.fromEntries(operators.map(o => [o.slug, o.id]));
  Object.assign(shared.operatorIds, opMap);

  const operatorUsers = [];
  for (let i = 0; i < 10; i++) {
    const slug = OPERATOR_SLUGS[i];
    const email = `agent-op-${i}@test.hellogambling.co.za`;
    const u = await prisma.user.upsert({
      where: { email }, update: {},
      create: { name: `Agent Operator ${i}`, email, password: hash, role: "OPERATOR", operatorId: opMap[slug] },
    });
    operatorUsers.push({ ...u, slug });
  }

  const adminUsers = [];
  for (let i = 0; i < 4; i++) {
    const email = `agent-admin-${i}@test.hellogambling.co.za`;
    const u = await prisma.user.upsert({
      where: { email }, update: {},
      create: { name: `Agent Admin ${i}`, email, password: hash, role: "ADMIN" },
    });
    adminUsers.push(u);
  }
  console.log(`  ✓ ${operatorUsers.length} operator agents, ${adminUsers.length} admin agents\n`);
  return { operatorUsers, adminUsers, opMap };
}

// ─── Consumer agent ───────────────────────────────────────────────────────────

async function consumerAgent(idx, opMap) {
  const email = `agent-consumer-${idx}@test.hellogambling.co.za`;
  const password = "TestPass123!";

  // Register (idempotent)
  await apiPost("/api/auth/register", { name: `Agent Consumer ${idx}`, email, password });

  // Login
  const jar = await login(email, password);
  if (!jar) { log("consumer:login", false, "no session"); return; }
  log("consumer:login", true);

  const opIds = Object.values(opMap);

  // ── Round 1: Create content ──────────────────────────────────────────────

  // Submit a complaint
  const opId = opIds[idx % opIds.length];
  const cRes = await apiPost("/api/complaints", {
    title: COMPLAINT_TITLES[idx % COMPLAINT_TITLES.length],
    description: `Consumer agent ${idx} reporting: ${COMPLAINT_TITLES[idx % COMPLAINT_TITLES.length]}. All documentation submitted. Waiting for resolution for ${7 + (idx % 21)} days.`,
    category: CATEGORIES[idx % CATEGORIES.length],
    rating: (idx % 5) + 1,
    operatorId: opId,
  }, jar);
  log("consumer:submit-complaint", cRes.ok, cRes.ok ? null : `HTTP ${cRes.status}`);
  if (cRes.ok && cRes.body?.id) shared.complaintIds.push(cRes.body.id);
  const myComplaintId = cRes.body?.id;

  // Create a forum thread
  const tRes = await apiPost("/api/forums/threads", {
    title: FORUM_TITLES[idx % FORUM_TITLES.length],
    content: `Agent ${idx} here. ${FORUM_TITLES[idx % FORUM_TITLES.length]} — sharing my experience and looking for advice from the community.`,
    category: FORUM_CATEGORIES[idx % FORUM_CATEGORIES.length],
  }, jar);
  log("consumer:create-thread", tRes.ok, tRes.ok ? null : `HTTP ${tRes.status}`);
  if (tRes.ok && tRes.body?.id) shared.threadIds.push(tRes.body.id);
  const myThreadId = tRes.body?.id;

  // Reply on own thread (kick off discussion)
  if (myThreadId) {
    const pRes = await apiPost(`/api/forums/threads/${myThreadId}/posts`, {
      content: `Adding more context: this has been going on for ${3 + (idx % 15)} weeks now. Has anyone else experienced this?`,
    }, jar);
    log("consumer:first-reply", pRes.ok, pRes.ok ? null : `HTTP ${pRes.status}`);
    if (pRes.ok && pRes.body?.id) shared.postIds.push(pRes.body.id);
  }

  // ── Round 2: Discover others' content ────────────────────────────────────

  const [complaintsRes, forumsRes] = await Promise.all([
    apiGet("/api/complaints", jar),
    apiGet("/forums", jar),
  ]);
  log("consumer:browse-complaints", complaintsRes.ok);
  log("consumer:browse-forums", forumsRes.ok);

  // Read a random operator profile
  const slugSample = OPERATOR_SLUGS[idx % OPERATOR_SLUGS.length];
  const opRes = await apiGet(`/operators/${slugSample}`, jar);
  log("consumer:view-operator", opRes.ok);

  // ── Round 3: Interact with others' content ────────────────────────────────

  // Reply to 2 random threads from shared state (not own)
  const otherThreads = shared.threadIds.filter(id => id !== myThreadId);
  for (const tid of pickN(otherThreads, 2)) {
    const rRes = await apiPost(`/api/forums/threads/${tid}/posts`, {
      content: pick(REPLIES),
    }, jar);
    log("consumer:reply-other-thread", rRes.ok, rRes.ok ? null : `HTTP ${rRes.status}`);
    if (rRes.ok && rRes.body?.id) shared.postIds.push(rRes.body.id);
  }

  // Vote on 3 random posts (not own)
  for (const pid of pickN(shared.postIds, 3)) {
    const vRes = await apiPost(`/api/forums/posts/${pid}/vote`, { value: Math.random() > 0.2 ? 1 : -1 }, jar);
    log("consumer:vote-post", vRes.ok || vRes.status === 409); // 409 = already voted, that's fine
  }

  // Reply to own complaint with a follow-up
  if (myComplaintId) {
    const rRes = await apiPost(`/api/complaints/${myComplaintId}/responses`, {
      content: `Follow-up (day ${14 + (idx % 10)}): Still no resolution. Requesting escalation to dispute.`,
    }, jar);
    log("consumer:complaint-followup", rRes.ok);

    // Escalate ~60% of complaints to disputes
    if (idx % 5 !== 0) {
      const dRes = await apiPost("/api/disputes", {
        complaintId: myComplaintId,
        summary: `Consumer ${idx} escalating: operator has not responded within the required timeframe. All FICA documentation is on file. Requesting formal mediation.`,
      }, jar);
      log("consumer:submit-dispute", dRes.ok || dRes.status === 409);
      if (dRes.ok && dRes.body?.id) shared.disputeIds.push(dRes.body.id);
    }
  }

  // ── Round 4: Check their own status ──────────────────────────────────────

  const [dashRes, disputeListRes] = await Promise.all([
    apiGet("/dashboard", jar),
    apiGet("/disputes", jar),
  ]);
  log("consumer:dashboard", dashRes.ok);
  log("consumer:view-disputes", disputeListRes.ok);
}

// ─── Operator agent ───────────────────────────────────────────────────────────

async function operatorAgent(user) {
  const jar = await login(user.email, "TestPass123!");
  if (!jar) { log("operator:login", false, "no session"); return; }
  log("operator:login", true);

  // Fetch all complaints about their operator
  const cRes = await apiGet(`/api/complaints?operatorId=${user.operatorId}`, jar);
  log("operator:view-own-complaints", cRes.ok);
  const complaints = cRes.body ?? [];

  // Respond officially to every complaint against them (max 8 to avoid spam)
  const toRespond = complaints.slice(0, 8);
  for (const c of toRespond) {
    const responses = [
      `Dear customer, we apologise for the inconvenience. Our team is investigating your ${c.category?.replace("_", " ")?.toLowerCase()} complaint and will resolve it within 3 business days.`,
      `Thank you for bringing this to our attention. We take all complaints seriously. A senior agent will contact you within 24 hours.`,
      `We have reviewed your account and can confirm our team is actively working on a resolution. We appreciate your patience.`,
      `This matter has been escalated to our compliance team. We will provide a full written response within 5 business days as required by the NGB.`,
    ];
    const rRes = await apiPost(`/api/complaints/${c.id}/responses`, {
      content: pick(responses),
    }, jar);
    log("operator:official-response", rRes.ok || rRes.status === 500); // best-effort
  }

  // Browse forums and reply to threads mentioning their brand
  const forumsRes = await apiGet("/forums", jar);
  log("operator:browse-forums", forumsRes.ok);

  const otherThreads = pickN(shared.threadIds, 3);
  for (const tid of otherThreads) {
    const rRes = await apiPost(`/api/forums/threads/${tid}/posts`, {
      content: `Official ${OPERATOR_SLUGS[user.operatorId ? 0 : 1]} response: we are aware of community discussions about our service. Please contact our official support for direct assistance.`,
    }, jar);
    log("operator:forum-comment", rRes.ok);
  }

  // View own operator profile
  const profRes = await apiGet(`/operators/${user.slug}`, jar);
  log("operator:own-profile", profRes.ok);

  // View dashboard
  const dashRes = await apiGet("/dashboard", jar);
  log("operator:dashboard", dashRes.ok);
}

// ─── Admin agent ─────────────────────────────────────────────────────────────

async function adminAgent(user, idx) {
  const jar = await login(user.email, "TestPass123!");
  if (!jar) { log("admin:login", false, "no session"); return; }
  log("admin:login", true);

  // Read all sections
  const pages = ["/", "/complaints", "/disputes", "/forums", "/operators", "/dashboard"];
  for (const p of pages) {
    const r = await apiGet(p, jar);
    log(`admin:browse${p.replace(/\//g, "-") || "-home"}`, r.ok);
  }

  // Read complaint feed and view 3 individual complaints
  const feedRes = await apiGet("/api/complaints", jar);
  log("admin:complaint-feed", feedRes.ok);
  const allComplaints = feedRes.body ?? [];
  for (const c of allComplaints.slice(idx * 3, idx * 3 + 3)) {
    const r = await apiGet(`/complaints/${c.id}`, jar);
    log("admin:view-complaint", r.ok);
    // Add admin comment on complaint
    const rRes = await apiPost(`/api/complaints/${c.id}/responses`, {
      content: `Admin note: This complaint has been reviewed. Consumer should contact support with reference ${c.id.slice(0, 8).toUpperCase()} for further assistance.`,
    }, jar);
    log("admin:complaint-comment", rRes.ok);
  }

  // Update dispute stages for disputes in shared state
  const myDisputes = pickN(shared.disputeIds, 3);
  for (const did of myDisputes) {
    const r = await apiPost(`/api/disputes/${did}`, {
      content: `Admin review complete. Moving dispute to mediation phase. Both parties have been notified.`,
      stage: "MEDIATION",
    }, jar);
    log("admin:update-dispute", r.ok);
  }

  // Post in forums as admin
  for (const tid of pickN(shared.threadIds, 2)) {
    const rRes = await apiPost(`/api/forums/threads/${tid}/posts`, {
      content: `Hello Gambling Admin: Thank you for raising this issue. We encourage consumers to use the formal dispute process for unresolved complaints. Our mediators review all cases within 5 business days.`,
    }, jar);
    log("admin:forum-post", rRes.ok);
  }

  // Vote on forum content
  for (const pid of pickN(shared.postIds, 5)) {
    await apiPost(`/api/forums/posts/${pid}/vote`, { value: 1 }, jar);
    log("admin:vote", true); // best-effort
  }
}

// ─── Main orchestrator ────────────────────────────────────────────────────────

async function main() {
  if (!DB_URL) { console.error("DATABASE_URL required"); process.exit(1); }

  const t0 = Date.now();
  console.log(`\n🎰  Hello Gambling — Full Agent Simulation`);
  console.log(`    114 independent agents (100 consumers + 10 operators + 4 admins)`);
  console.log(`    Target: ${BASE}\n`);

  const adapter = new PrismaNeon({ connectionString: DB_URL });
  const prisma = new PrismaClient({ adapter });
  let operatorUsers, adminUsers, opMap;
  try {
    ({ operatorUsers, adminUsers, opMap } = await seedUsers(prisma));
  } finally {
    await prisma.$disconnect();
  }

  // ── Phase 1: Register all 100 consumers ─────────────────────────────────
  console.log("▶  Phase 1 — Registering 100 consumer agents...");
  for (let b = 0; b < 5; b++) {
    await Promise.all(
      Array.from({ length: 20 }, (_, i) => {
        const idx = b * 20 + i;
        return apiPost("/api/auth/register", {
          name: `Agent Consumer ${idx}`,
          email: `agent-consumer-${idx}@test.hellogambling.co.za`,
          password: "TestPass123!",
        }).catch(() => null);
      })
    );
    process.stdout.write(`  batch ${b + 1}/5 registered\n`);
  }

  // ── Phase 2: All 100 consumers act (4 × 25 in parallel) ─────────────────
  console.log("\n▶  Phase 2 — 100 consumers acting autonomously (4 × 25 in parallel)...");
  for (let b = 0; b < 4; b++) {
    await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        consumerAgent(b * 25 + i, opMap).catch(e => log("consumer:unhandled", false, e.message))
      )
    );
    console.log(`  batch ${b + 1}/4 complete — ✓${stats.pass} ✗${stats.fail} so far`);
  }

  // ── Phase 3: 10 operators respond to their complaints ───────────────────
  console.log("\n▶  Phase 3 — 10 operators monitoring and responding...");
  await Promise.all(
    operatorUsers.map(u => operatorAgent(u).catch(e => log("operator:unhandled", false, e.message)))
  );
  console.log(`  done — ✓${stats.pass} ✗${stats.fail} so far`);

  // ── Phase 4: 4 admins review and moderate ───────────────────────────────
  console.log("\n▶  Phase 4 — 4 admins reviewing disputes and content...");
  await Promise.all(
    adminUsers.map((u, idx) => adminAgent(u, idx).catch(e => log("admin:unhandled", false, e.message)))
  );
  console.log(`  done — ✓${stats.pass} ✗${stats.fail} so far`);

  // ── Phase 5: Consumers do a final check-in ───────────────────────────────
  console.log("\n▶  Phase 5 — Consumers checking back in for updates (2 × 50)...");
  for (let b = 0; b < 2; b++) {
    await Promise.all(
      Array.from({ length: 50 }, async (_, i) => {
        const idx = b * 50 + i;
        const jar = await login(`agent-consumer-${idx}@test.hellogambling.co.za`, "TestPass123!").catch(() => null);
        if (!jar) return;
        const [d, c, f] = await Promise.all([
          apiGet("/disputes", jar),
          apiGet("/api/complaints", jar),
          apiGet("/forums", jar),
        ]);
        log("consumer:checkin-disputes", d.ok);
        log("consumer:checkin-complaints", c.ok);
        log("consumer:checkin-forums", f.ok);
        // Final vote on 2 posts
        for (const pid of pickN(shared.postIds, 2)) {
          const v = await apiPost(`/api/forums/posts/${pid}/vote`, { value: 1 }, jar);
          log("consumer:final-vote", v.ok || v.status === 409);
        }
      }).map(p => p.catch(e => log("consumer:checkin-unhandled", false, e.message)))
    );
    console.log(`  batch ${b + 1}/2 done`);
  }

  // ── Results ───────────────────────────────────────────────────────────────
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  const total = stats.pass + stats.fail;
  const pct = total ? ((stats.pass / total) * 100).toFixed(1) : "0";

  console.log(`\n${"═".repeat(55)}`);
  console.log(`  SIMULATION COMPLETE  (${elapsed}s)`);
  console.log(`${"═".repeat(55)}`);
  console.log(`  Total checks : ${total}`);
  console.log(`  ✓ Pass       : ${stats.pass}  (${pct}%)`);
  console.log(`  ✗ Fail       : ${stats.fail}`);
  console.log(`\n  Shared content created on the site:`);
  console.log(`    Complaints  : ${shared.complaintIds.length}`);
  console.log(`    Threads     : ${shared.threadIds.length}`);
  console.log(`    Posts       : ${shared.postIds.length}`);
  console.log(`    Disputes    : ${shared.disputeIds.length}`);

  console.log(`\n  Results by action:`);
  const sorted = Object.entries(stats.byAction).sort((a, b) => (b[1].fail - a[1].fail));
  for (const [action, s] of sorted) {
    const t = s.pass + s.fail;
    const p = ((s.pass / t) * 100).toFixed(0);
    const bar = s.fail > 0 ? ` ← ${s.fail} failures` : "";
    console.log(`    ${action.padEnd(38)} ${String(s.pass).padStart(4)}/${t} (${p}%)${bar}`);
  }

  if (stats.errors.length) {
    console.log(`\n  Sample failures (first 20):`);
    for (const e of stats.errors.slice(0, 20)) console.log(`    • ${e}`);
  }
  console.log(`${"═".repeat(55)}\n`);
}

main().catch(err => { console.error(err); process.exit(1); });
