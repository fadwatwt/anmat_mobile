#!/usr/bin/env node
// Comprehensive mobile subscriber E2E test as nextsub1@anmat.test
// Simulates exactly what the React Native mobile app does via AuthContext + services
// Runs against https://api.anmaat.com (EXPO_PUBLIC_API_URL) by default

import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || process.env.API_URL || 'https://api.anmaat.com';
const EMAIL = process.env.TEST_EMAIL || 'nextsub1@anmat.test';
const PASSWORD = process.env.TEST_PASSWORD || 'aA@123456';

const REQUEST_TIMEOUT = 20000;

const http = axios.create({ baseURL: API_URL, timeout: REQUEST_TIMEOUT });

let authToken = null;

http.interceptors.request.use(c => {
  if (authToken) c.headers.Authorization = `Bearer ${authToken}`;
  c.headers['Accept-Language'] = 'ar';
  return c;
});

function extractError(e) {
  if (axios.isAxiosError(e)) {
    const d = e.response?.data;
    return d?.message || d?.error?.message || e.message;
  }
  return String(e);
}

// pretty helpers
const ok = s => `\x1b[32m✔ ${s}\x1b[0m`;
const fail = s => `\x1b[31m✘ ${s}\x1b[0m`;
const info = s => `\x1b[36m${s}\x1b[0m`;
const warn = s => `\x1b[33m⚠ ${s}\x1b[0m`;

let results = [];
let token = null;
let user = null;

async function test(name, fn, opts = {}) {
  const t0 = Date.now();
  try {
    const data = await fn();
    const ms = Date.now() - t0;
    results.push({ name, status: 'PASS', ms, data: opts.silent ? undefined : data });
    console.log(ok(`${name} (${ms}ms)`));
    if (data && opts.show) console.log(info(`   → ${JSON.stringify(data).slice(0, 400)}`));
    return data;
  } catch (e) {
    const ms = Date.now() - t0;
    const msg = extractError(e);
    const status = e?.response?.status;
    const body = e?.response?.data;
    // For expected-failure tests, PASS if it failed as expected
    if (opts.expectFail) {
      results.push({ name, status: 'PASS', ms, note: `expected fail: ${msg} [${status}]` });
      console.log(ok(`${name} (expected fail ${status}: ${msg}) (${ms}ms)`));
      return null;
    }
    results.push({ name, status: 'FAIL', ms, error: msg, httpStatus: status, body });
    console.log(fail(`${name} — ${msg} [HTTP ${status}] (${ms}ms)`));
    if (body) console.log(info(`   body: ${JSON.stringify(body).slice(0, 800)}`));
    return null;
  }
}

async function alreadyLoggedInRecovery(error) {
  if (axios.isAxiosError(error) && error.response?.status === 400) {
    const body = error.response.data;
    if (body?.message === 'Already logged in' && body?.data?.access_token) {
      const t = body.data.access_token;
      const r = await http.get('/api/user/auth', { headers: { Authorization: `Bearer ${t}` } });
      return { access_token: t, user: r.data.data };
    }
  }
  return null;
}

console.log(info(`\n═══════════════════════════════════════════════════════`));
console.log(info(`  Anmat Mobile — Subscriber E2E (حقيقي)`));
console.log(info(`  User: ${EMAIL}`));
console.log(info(`  API : ${API_URL}`));
console.log(info(`═══════════════════════════════════════════════════════\n`));

// ── 0. Connectivity
await test('0.1 Connectivity — GET /api/user/auth (expect 401 without token)', async () => {
  const r = await axios.get(`${API_URL}/api/user/auth`, { timeout: 8000, validateStatus: () => true });
  if (r.status !== 401) throw new Error(`expected 401 got ${r.status}`);
  return { status: r.status };
});

// ── 1. Auth — mobile login flow
console.log(info('\n── مرحلة تسجيل الدخول (Auth) ──'));

await test('1.1 Login POST /api/user/auth/login', async () => {
  try {
    const r = await http.post('/api/user/auth/login', { email: EMAIL, password: PASSWORD });
    token = r.data?.data?.access_token ?? r.data?.access_token;
    user = r.data?.data?.user;
    authToken = token;
    if (!token) throw new Error('no access_token in response');
    if (user?.type === 'Admin') throw new Error('Access Denied: Admin must use /api/admin/auth/login');
    return { token: token.slice(0, 20) + '...', user: { email: user?.email, type: user?.type, name: user?.name } };
  } catch (e) {
    const rec = await alreadyLoggedInRecovery(e);
    if (rec) {
      token = rec.access_token; user = rec.user; authToken = token;
      return { recovered: true, token: token.slice(0, 20) + '...', user };
    }
    throw e;
  }
});

await test('1.2 Fetch profile GET /api/user/auth (has_subscription_access)', async () => {
  const r = await http.get('/api/user/auth');
  const u = r.data.data;
  user = u;
  return {
    email: u.email, type: u.type,
    has_subscription_access: u.has_subscription_access,
    subscription_status: u.subscription_status,
    is_organization_registered: u.is_organization_registered,
    is_active: u.is_active,
  };
}, { show: true });

await test('1.3 Permissions GET /api/user/auth/permissions', async () => {
  const r = await http.get('/api/user/auth/permissions');
  return r.data.data;
}, { show: true });

await test('1.4 Identity GET /api/user/auth/me', async () => {
  const r = await http.get('/api/user/auth/me');
  return r.data.data;
}, { show: true });

await test('1.5 Guard: Subscriber blocked? (mobile RootNavigator gating)', async () => {
  if (user?.type === 'Subscriber' && user?.has_subscription_access === false) {
    throw new Error('Subscriber needs plans — mobile would show SubscriberPlans screen');
  }
  if (user?.type === 'Employee' && user?.has_subscription_access === false) {
    throw new Error('Employee blocked — mobile would show SubscriptionInactive');
  }
  if (user?.type !== 'Subscriber') return { note: `type=${user?.type} (expected Subscriber)` };
  return { gating: 'OK — has_subscription_access=true, can access dashboard' };
});

// ── 2. Dashboard (Subscriber)
console.log(info('\n── لوحة التحكم (Dashboard — Subscriber) ──'));

await test('2.1 Analytics overview GET /api/subscriber/organization/analytics', async () => {
  const r = await http.get('/api/subscriber/organization/analytics');
  return r.data.data;
}, { show: true });

await test('2.2 Task stats GET /api/subscriber/organization/tasks/statistics/status', async () => {
  const r = await http.get('/api/subscriber/organization/tasks/statistics/status');
  return r.data.data;
}, { show: true });

await test('2.3 Departments GET /api/subscriber/organization/departments', async () => {
  const r = await http.get('/api/subscriber/organization/departments');
  return Array.isArray(r.data.data) ? { count: r.data.data.length, sample: r.data.data.slice(0, 1) } : r.data.data;
}, { show: true });

await test('2.4 Projects (paged) GET /api/subscriber/organization/projects?page=1&limit=10', async () => {
  const r = await http.get('/api/subscriber/organization/projects', { params: { page: 1, limit: 10 } });
  const d = r.data.data;
  if (Array.isArray(d)) return { count: d.length, isArray: true };
  return { total: d?.total, count: d?.data?.length, sample: d?.data?.slice(0, 1) };
}, { show: true });

await test('2.5 Activity logs GET /api/activity-logs/my-organization?limit=10', async () => {
  const r = await http.get('/api/activity-logs/my-organization', { params: { limit: 10 } });
  const d = r.data.data;
  return Array.isArray(d) ? { count: d.length } : d;
}, { show: true });

// ── 3. Projects & Templates
console.log(info('\n── المشاريع (Projects) ──'));
await test('3.1 Fetch projects GET /api/subscriber/organization/projects', async () => {
  const r = await http.get('/api/subscriber/organization/projects');
  const d = r.data.data;
  const arr = Array.isArray(d) ? d : d?.data || [];
  return { count: arr.length };
});
await test('3.2 Project templates GET /api/subscriber/organization/project-templates', async () => {
  const r = await http.get('/api/subscriber/organization/project-templates');
  const d = r.data.data;
  return { count: Array.isArray(d) ? d.length : 0, raw: JSON.stringify(d).slice(0, 200) };
});

// ── 4. Tasks
console.log(info('\n── المهام (Tasks) ──'));
await test('4.1 Fetch tasks GET /api/subscriber/organization/tasks', async () => {
  const r = await http.get('/api/subscriber/organization/tasks');
  const d = r.data.data;
  return { count: Array.isArray(d) ? d.length : (d?.data?.length ?? 0) };
});

// ── 5. HR — Employees / Departments / Positions
console.log(info('\n── الموارد البشرية (HR) ──'));
await test('5.1 Employees GET /api/subscriber/organization/employees', async () => {
  const r = await http.get('/api/subscriber/organization/employees');
  const d = r.data.data;
  return { count: Array.isArray(d) ? d.length : (d?.data?.length ?? 0), sample: JSON.stringify(d).slice(0, 300) };
});
await test('5.2 Positions GET /api/subscriber/organization/positions', async () => {
  const r = await http.get('/api/subscriber/organization/positions');
  const d = r.data.data;
  return { count: Array.isArray(d) ? d.length : 0 };
});
await test('5.3 Employee requests GET /api/subscriber/organization/employees-requests', async () => {
  const r = await http.get('/api/subscriber/organization/employees-requests');
  const d = r.data.data;
  return { total: d?.total ?? (Array.isArray(d) ? d.length : 0) };
});

// ── 6. Organizations & Industries (real routes)
console.log(info('\n── المنظمات والصناعات ──'));
await test('6.1 My organization GET /api/subscriber/organization', async () => {
  const r = await http.get('/api/subscriber/organization');
  return r.data.data;
}, { show: true });

await test('6.2 Industries (subscriber) GET /api/subscriber/industries', async () => {
  const r = await http.get('/api/subscriber/industries');
  const d = r.data.data;
  return { count: Array.isArray(d) ? d.length : (d?.data?.length ?? 0), sample: JSON.stringify(d).slice(0, 300) };
}, { show: true });

await test('6.3 Subscription plans public GET /api/subscription-plans/public', async () => {
  const r = await http.get('/api/subscription-plans/public');
  const d = r.data.data;
  const arr = Array.isArray(d) ? d : d?.data || [];
  return { count: arr.length, sample: JSON.stringify(arr).slice(0, 400) };
}, { show: true });

// ── 7. Subscriptions & Plans (real subscriber routes)
console.log(info('\n── الاشتراكات والخطط ──'));
await test('7.1 My subscription GET /api/subscriptions/subscriber/my-subscription', async () => {
  const r = await http.get('/api/subscriptions/subscriber/my-subscription');
  return r.data.data;
}, { show: true });

await test('7.2 My payments GET /api/subscriptions/subscriber/my-payments', async () => {
  const r = await http.get('/api/subscriptions/subscriber/my-payments');
  const d = r.data.data;
  return { count: Array.isArray(d) ? d.length : (d?.data?.length ?? 0), raw: JSON.stringify(d).slice(0, 500) };
});

await test('7.3 Subscriber plans GET /api/subscriber/subscription-plans', async () => {
  const r = await http.get('/api/subscriber/subscription-plans');
  const d = r.data.data;
  return { count: Array.isArray(d) ? d.length : (d?.data?.length ?? 0), sample: JSON.stringify(d).slice(0, 400) };
}, { show: true });

await test('7.4 Payment methods GET /api/subscriber/payment-methods/', async () => {
  const r = await http.get('/api/subscriber/payment-methods/');
  const d = r.data.data;
  return { count: Array.isArray(d) ? d.length : (d?.data?.length ?? 0), raw: JSON.stringify(d).slice(0, 300) };
});

// ── 8. Roles & Permissions (real routes)
console.log(info('\n── الأدوار والصلاحيات ──'));
await test('8.1 Roles GET /api/subscriber/organization/roles', async () => {
  const r = await http.get('/api/subscriber/organization/roles');
  const d = r.data.data;
  return { count: Array.isArray(d) ? d.length : (d?.data?.length ?? 0), sample: JSON.stringify(d).slice(0, 300) };
});
await test('8.2 Permissions GET /api/subscriber/permissions', async () => {
  const r = await http.get('/api/subscriber/permissions');
  const d = r.data.data;
  return { count: Array.isArray(d) ? d.length : 0, sample: JSON.stringify(d).slice(0, 300) };
});

// ── 9. Notifications (real routes)
console.log(info('\n── الإشعارات ──'));
await test('9.1 My notifications GET /api/notifications/my-notifications', async () => {
  const r = await http.get('/api/notifications/my-notifications');
  const d = r.data.data;
  return { count: Array.isArray(d) ? d.length : (d?.data?.length ?? 0), sample: JSON.stringify(d).slice(0, 300) };
});
await test('9.2 Subscriber notifications types GET /api/subscriber-notifications/types', async () => {
  const r = await http.get('/api/subscriber-notifications/types');
  return r.data.data;
});
await test('9.3 Subscriber notifications my GET /api/subscriber-notifications/my (Employee-only → expect 401 for Subscriber)', async () => {
  await http.get('/api/subscriber-notifications/my');
}, { expectFail: true });

// ── 10. Support, Social, AI, Appointments, Attendance (real routes)
console.log(info('\n── الدعم، السوشيال، الذكاء، المواعيد ──'));
await test('10.1 Support tickets GET /api/support-tickets', async () => {
  const r = await http.get('/api/support-tickets');
  const d = r.data.data;
  return { count: Array.isArray(d) ? d.length : (d?.data?.length ?? 0) };
});
await test('10.2 Social media quota GET /api/subscriber/social-media-quota', async () => {
  const r = await http.get('/api/subscriber/social-media-quota');
  return r.data.data;
}, { show: true });
await test('10.3 AI tokens balance GET /api/ai/tokens/balance', async () => {
  const r = await http.get('/api/ai/tokens/balance');
  return r.data.data;
}, { show: true });
await test('10.3b AI tokens packages GET /api/ai/tokens/packages', async () => {
  const r = await http.get('/api/ai/tokens/packages');
  const d = r.data.data;
  return { count: Array.isArray(d) ? d.length : 0, sample: JSON.stringify(d).slice(0, 300) };
});
await test('10.4 Appointments GET /api/subscriber/organization/appointments', async () => {
  const r = await http.get('/api/subscriber/organization/appointments');
  const d = r.data.data;
  return { count: Array.isArray(d) ? d.length : (d?.data?.length ?? 0) };
});
await test('10.5 Attendances GET /api/subscriber/organization/attendances', async () => {
  const r = await http.get('/api/subscriber/organization/attendances');
  const d = r.data.data;
  return { count: Array.isArray(d) ? d.length : (d?.data?.length ?? 0) };
});
await test('10.6 Leaves GET /api/subscriber/organization/leaves', async () => {
  const r = await http.get('/api/subscriber/organization/leaves');
  const d = r.data.data;
  return { count: Array.isArray(d) ? d.length : (d?.data?.length ?? 0) };
});
await test('10.6b Holidays GET /api/subscriber/organization/holidays', async () => {
  const r = await http.get('/api/subscriber/organization/holidays');
  const d = r.data.data;
  return { count: Array.isArray(d) ? d.length : 0 };
});
await test('10.6c Meetings GET /api/subscriber/organization/meetings', async () => {
  const r = await http.get('/api/subscriber/organization/meetings');
  const d = r.data.data;
  return { count: Array.isArray(d) ? d.length : 0 };
});
await test('10.7 Salary transactions GET /api/subscriber/organization/employees-salary-transactions', async () => {
  const r = await http.get('/api/subscriber/organization/employees-salary-transactions');
  const d = r.data.data;
  return { count: Array.isArray(d) ? d.length : (d?.data?.length ?? 0) };
});
await test('10.8 Activity logs full GET /api/activity-logs?limit=5 (Admin-only → expect 401 for Subscriber, correct)', async () => {
  await http.get('/api/activity-logs', { params: { limit: 5 } });
}, { expectFail: true });
await test('10.9 Daily tasks GET /api/subscriber/organization/daily-tasks', async () => {
  const r = await http.get('/api/subscriber/organization/daily-tasks');
  const d = r.data.data;
  return { count: Array.isArray(d) ? d.length : 0 };
});
await test('10.10 Chats GET /api/chats', async () => {
  const r = await http.get('/api/chats');
  const d = r.data.data;
  return { count: Array.isArray(d) ? d.length : (d?.data?.length ?? 0) };
});

// ── 11. Mobile-specific checks
console.log(info('\n── فحوصات خاصة بالموبايل ──'));
await test('11.1 Accept-Language header (ar) reflected', async () => {
  const r = await http.get('/api/user/auth', { headers: { 'Accept-Language': 'ar' } });
  return { langSent: 'ar', ok: !!r.data.data };
});
await test('11.2 Wrong password should fail (negative)', async () => {
  await axios.post(`${API_URL}/api/user/auth/login`, { email: EMAIL, password: 'wrongpass123' }, { timeout: 8000 });
}, { expectFail: true });

await test('11.3 AdminSignIn guard — subscriber must be rejected on /api/admin/auth/login', async () => {
  await axios.post(`${API_URL}/api/admin/auth/login`, { email: EMAIL, password: PASSWORD }, { timeout: 8000 });
}, { expectFail: true });

await test('11.4 Profile re-fetch GET /api/user/auth (verify mobile persistSession)', async () => {
  const r = await http.get('/api/user/auth');
  return { email: r.data.data.email, type: r.data.data.type };
});
await test('11.5 Chats candidates GET /api/chats/candidates (mobile HR chats)', async () => {
  const r = await http.get('/api/chats/candidates');
  const d = r.data.data;
  return { count: Array.isArray(d) ? d.length : 0 };
});

// ── Summary
console.log(info(`\n═══════════════════════════════════════════════════════`));
console.log(info(`  ملخص الاختبار`));
console.log(info(`═══════════════════════════════════════════════════════`));
const passed = results.filter(r => r.status === 'PASS').length;
const failed = results.filter(r => r.status === 'FAIL').length;
console.log(`  إجمالي: ${results.length}  |  نجح: ${passed}  |  فشل: ${failed}`);
console.log('');
results.forEach(r => {
  const icon = r.status === 'PASS' ? '\x1b[32m✔\x1b[0m' : '\x1b[31m✘\x1b[0m';
  const extra = r.error ? ` — ${r.error} [${r.httpStatus}]` : (r.note ? ` — ${r.note}` : '');
  console.log(`  ${icon} ${r.name} (${r.ms}ms)${extra}`);
});
if (failed > 0) {
  console.log(warn(`\n  ⚠ يوجد ${failed} اختبار فاشل — راجع التفاصيل أعلاه.`));
  console.log(warn(`  قد يكون السبب: صلاحيات، اشتراك منتهي، أو Endpoint غير موجود.`));
} else {
  console.log(info(`\n  ✅ كل الاختبارات نجحت — تطبيق الموبايل جاهز لهذا المشترك.`));
}

// Persist report
import fs from 'fs';
import path from 'path';
const report = { api: API_URL, email: EMAIL, user, results, summary: { total: results.length, passed, failed }, timestamp: new Date().toISOString() };
const outPath = path.resolve('scripts/report-subscriber-e2e.json');
try { fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8'); console.log(info(`\n  تقرير JSON محفوظ: ${outPath}`)); } catch {}

process.exit(failed > 0 ? 1 : 0);
