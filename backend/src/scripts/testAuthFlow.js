import http from 'http';

const request = (path, method = 'GET', body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (postData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path,
      method,
      headers: reqHeaders
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

async function runTests() {
  console.log('🧪 Starting Authentication & User Profile Test Suite...\n');
  let passedCount = 0;
  let totalTests = 10;

  try {
    // TEST 1: Valid USER email + password
    console.log('Test 1: Valid USER email + password login...');
    const userLogin = await request('/api/auth/login', 'POST', {
      email: 'user@successstory.com',
      password: 'user123'
    });
    if (userLogin.status === 200 && userLogin.body.success && userLogin.body.user.role === 'USER' && userLogin.body.user.fullName) {
      console.log('  ✅ SUCCESS: User logged in, token returned, actual name:', userLogin.body.user.fullName);
      passedCount++;
    } else {
      console.error('  ❌ FAILED: User login response invalid', userLogin);
    }
    const userToken = userLogin.body?.token;

    // TEST 2: Valid ADMIN email + password
    console.log('\nTest 2: Valid ADMIN email + password login...');
    const adminLogin = await request('/api/auth/login', 'POST', {
      email: 'admin@successstory.com',
      password: 'admin123'
    });
    if (adminLogin.status === 200 && adminLogin.body.success && adminLogin.body.user.role === 'ADMIN' && adminLogin.body.user.fullName) {
      console.log('  ✅ SUCCESS: Admin logged in, token returned, actual admin name:', adminLogin.body.user.fullName);
      passedCount++;
    } else {
      console.error('  ❌ FAILED: Admin login response invalid', adminLogin);
    }
    const adminToken = adminLogin.body?.token;

    // TEST 3: Wrong password
    console.log('\nTest 3: Wrong password login attempt...');
    const wrongPass = await request('/api/auth/login', 'POST', {
      email: 'user@successstory.com',
      password: 'wrongpassword999'
    });
    if (wrongPass.status === 401 && wrongPass.body.error === 'Invalid email or password.') {
      console.log('  ✅ SUCCESS: Rejected with message:', wrongPass.body.error);
      passedCount++;
    } else {
      console.error('  ❌ FAILED: Wrong password check', wrongPass);
    }

    // TEST 4: Wrong email
    console.log('\nTest 4: Wrong email login attempt...');
    const wrongEmail = await request('/api/auth/login', 'POST', {
      email: 'nonexistent_user_999@domain.com',
      password: 'user123'
    });
    if (wrongEmail.status === 401 && wrongEmail.body.error === 'Invalid email or password.') {
      console.log('  ✅ SUCCESS: Rejected with message:', wrongEmail.body.error);
      passedCount++;
    } else {
      console.error('  ❌ FAILED: Wrong email check', wrongEmail);
    }

    // TEST 5: Refresh after login / token validation GET /api/auth/me
    console.log('\nTest 5: Validate token & restore session (GET /api/auth/me)...');
    const meRes = await request('/api/auth/me', 'GET', null, {
      Authorization: `Bearer ${userToken}`
    });
    if (meRes.status === 200 && meRes.body.success && meRes.body.user.fullName === 'Alex Morgan') {
      console.log('  ✅ SUCCESS: Session restored for user:', meRes.body.user.fullName);
      passedCount++;
    } else {
      console.error('  ❌ FAILED: Session restore failed', meRes);
    }

    // TEST 6: Logout API call
    console.log('\nTest 6: Logout API call...');
    const logoutRes = await request('/api/auth/logout', 'POST');
    if (logoutRes.status === 200 && logoutRes.body.success) {
      console.log('  ✅ SUCCESS: Logout endpoint returned success');
      passedCount++;
    } else {
      console.error('  ❌ FAILED: Logout endpoint failed', logoutRes);
    }

    // TEST 7: USER tries /admin API (/api/admin/users)
    console.log('\nTest 7: USER account attempting to access /api/admin/users...');
    const userAdminAccess = await request('/api/admin/users', 'GET', null, {
      Authorization: `Bearer ${userToken}`
    });
    if (userAdminAccess.status === 403) {
      console.log('  ✅ SUCCESS: USER blocked with 403 Forbidden:', userAdminAccess.body.error);
      passedCount++;
    } else {
      console.error('  ❌ FAILED: USER was not blocked from admin API!', userAdminAccess);
    }

    // TEST 8: Expired / invalid token
    console.log('\nTest 8: Invalid token access attempt...');
    const invalidTokenRes = await request('/api/auth/me', 'GET', null, {
      Authorization: 'Bearer invalid_garbage_token_12345'
    });
    if (invalidTokenRes.status === 401) {
      console.log('  ✅ SUCCESS: Invalid token rejected with 401 status');
      passedCount++;
    } else {
      console.error('  ❌ FAILED: Invalid token was not rejected with 401', invalidTokenRes);
    }

    // TEST 9: Profile Auto-Fetch GET /api/users/profile
    console.log('\nTest 9: Auto-fetch full database profile (GET /api/users/profile)...');
    const profileRes = await request('/api/users/profile', 'GET', null, {
      Authorization: `Bearer ${userToken}`
    });
    if (profileRes.status === 200 && profileRes.body.success && profileRes.body.user.email === 'user@successstory.com') {
      console.log('  ✅ SUCCESS: Profile fetched from database. Name:', profileRes.body.user.fullName, 'Mobile:', profileRes.body.user.mobile);
      passedCount++;
    } else {
      console.error('  ❌ FAILED: Profile fetch failed', profileRes);
    }

    // TEST 10: Profile Update PUT /api/users/profile
    console.log('\nTest 10: Profile update (PUT /api/users/profile)...');
    const newMobile = `+1 (555) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const updateRes = await request('/api/users/profile', 'PUT', {
      fullName: 'Alex Morgan',
      mobile: newMobile
    }, {
      Authorization: `Bearer ${userToken}`
    });
    if (updateRes.status === 200 && updateRes.body.success && updateRes.body.user.mobile === newMobile) {
      console.log('  ✅ SUCCESS: Profile updated in DB! Updated mobile:', updateRes.body.user.mobile);
      passedCount++;
    } else {
      console.error('  ❌ FAILED: Profile update failed', updateRes);
    }

    console.log(`\n========================================`);
    console.log(`RESULTS: ${passedCount} / ${totalTests} TESTS PASSED`);
    console.log(`========================================\n`);

    if (passedCount === totalTests) {
      process.exit(0);
    } else {
      process.exit(1);
    }

  } catch (err) {
    console.error('💥 Test suite execution error:', err);
    process.exit(1);
  }
}

runTests();
