const axios = require('axios');

const BASE_URL = 'http://localhost:4002/api';

// Axios instance that sends cookies
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  validateStatus: () => true, // don't throw on non-2xx
});

async function testRoutes() {
  console.log('🧪 Testing Course API Endpoints...\n');

  // ── 1. GET /api/courses ──────────────────────────────────
  const allRes = await api.get('/courses');
  if (allRes.status === 200) {
    console.log(`✅ GET /api/courses          → ${allRes.status} (${allRes.data.length} courses)`);
  } else {
    console.log(`❌ GET /api/courses          → ${allRes.status}:`, allRes.data?.message);
  }

  // ── 2. GET /api/courses/:id ──────────────────────────────
  if (allRes.status === 200 && allRes.data.length > 0) {
    const courseId = allRes.data[0]._id;
    const oneRes = await api.get(`/courses/${courseId}`);
    if (oneRes.status === 200) {
      console.log(`✅ GET /api/courses/:id      → ${oneRes.status} ("${oneRes.data.title}")`);
    } else {
      console.log(`❌ GET /api/courses/:id      → ${oneRes.status}:`, oneRes.data?.message);
    }
  } else {
    console.log('⚠️  GET /api/courses/:id      → skipped (no courses in DB)');
  }

  // ── 3. POST /api/courses (admin-only, expects 401/403 without auth) ──
  const createRes = await api.post('/courses', {});
  if (createRes.status === 401 || createRes.status === 403) {
    console.log(`✅ POST /api/courses         → ${createRes.status} (auth guard working)`);
  } else {
    console.log(`⚠️  POST /api/courses         → ${createRes.status}:`, createRes.data?.message);
  }

  // ── 4. PUT /api/courses/:id (admin-only) ─────────────────
  const fakeId = '000000000000000000000000';
  const putRes = await api.put(`/courses/${fakeId}`, {});
  if (putRes.status === 401 || putRes.status === 403) {
    console.log(`✅ PUT /api/courses/:id      → ${putRes.status} (auth guard working)`);
  } else {
    console.log(`⚠️  PUT /api/courses/:id      → ${putRes.status}:`, putRes.data?.message);
  }

  // ── 5. DELETE /api/courses/:id (admin-only) ──────────────
  const delRes = await api.delete(`/courses/${fakeId}`);
  if (delRes.status === 401 || delRes.status === 403) {
    console.log(`✅ DELETE /api/courses/:id   → ${delRes.status} (auth guard working)`);
  } else {
    console.log(`⚠️  DELETE /api/courses/:id   → ${delRes.status}:`, delRes.data?.message);
  }

  // ── 6. GET /api/enrollments/check/:courseId (needs auth) ─
  const checkRes = await api.get(`/enrollments/check/${fakeId}`);
  if (checkRes.status === 401) {
    console.log(`✅ GET /api/enrollments/check/:id → ${checkRes.status} (auth guard working)`);
  } else {
    console.log(`⚠️  GET /api/enrollments/check/:id → ${checkRes.status}:`, checkRes.data?.message);
  }

  // ── 7. GET /api/enrollments/myenrollments (needs auth) ───
  const myRes = await api.get('/enrollments/myenrollments');
  if (myRes.status === 401) {
    console.log(`✅ GET /api/enrollments/myenrollments → ${myRes.status} (auth guard working)`);
  } else {
    console.log(`⚠️  GET /api/enrollments/myenrollments → ${myRes.status}:`, myRes.data?.message);
  }

  console.log('\n🏁 Testing complete!');
  console.log('\n📋 Full endpoint summary:');
  console.log('   GET    /api/courses                      → public');
  console.log('   GET    /api/courses/:id                  → public');
  console.log('   POST   /api/courses                      → admin only');
  console.log('   PUT    /api/courses/:id                  → admin only');
  console.log('   DELETE /api/courses/:id                  → admin only');
  console.log('   GET    /api/enrollments/myenrollments    → auth required');
  console.log('   GET    /api/enrollments/check/:courseId  → auth required');
  console.log('   POST   /api/enrollments                  → auth required');
  console.log('   PATCH  /api/enrollments/progress         → auth required');
}

testRoutes().catch(console.error);
