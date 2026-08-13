const BASE_URL = 'http://localhost:4021/api/v1';

async function runTests() {
  console.log('==================================================');
  console.log('STARTING PHASE 1 ENDPOINT TESTS FOR SIKHOAI');
  console.log('==================================================\n');

  // Test 1: Unauthenticated request
  console.log('1. Testing Unauthenticated Request to /explain...');
  try {
    const unauthRes = await fetch(`${BASE_URL}/ai/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Explain WebSockets',
        learningStyle: 'academic',
        depth: 'standard',
        examples: 'minimal',
        language: 'en'
      })
    });
    console.log(`   Response Status: ${unauthRes.status}`);
    const unauthData = await unauthRes.json();
    console.log(`   Response Body:`, JSON.stringify(unauthData));
    if (unauthRes.status === 401 || unauthRes.status === 403) {
      console.log('   ✅ PASSED: Unauthorized request rejected correctly.\n');
    } else {
      console.log('   ❌ FAILED: Should reject unauthorized request with 401/403.\n');
    }
  } catch (err) {
    console.error('   ❌ FAILED with network error:', err);
  }

  // 2. Login to get access token
  console.log('2. Authenticating as seeded student sneha@gmail.com...');
  let token = '';
  try {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sneha@gmail.com',
        password: 'Password123!'
      })
    });
    const loginData = (await loginRes.json()) as any;
    if (loginRes.status === 200 && loginData.success && loginData.data?.accessToken) {
      token = loginData.data.accessToken;
      console.log(`   ✅ PASSED: Successfully authenticated. Token prefix: Bearer ${token.substring(0, 15)}...\n`);
    } else {
      console.log('   ❌ FAILED: Authentication failed.', loginData);
      return;
    }
  } catch (err) {
    console.error('   ❌ FAILED with network error:', err);
    return;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Test 3: Missing Query Parameter Validation
  console.log('3. Testing validation for missing query parameter...');
  try {
    const missingRes = await fetch(`${BASE_URL}/ai/explain`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        learningStyle: 'academic',
        depth: 'standard',
        examples: 'minimal',
        language: 'en'
      })
    });
    console.log(`   Response Status: ${missingRes.status}`);
    const data = await missingRes.json();
    console.log(`   Response Body:`, JSON.stringify(data));
    if (missingRes.status === 400) {
      console.log('   ✅ PASSED: Rejected missing query correctly.\n');
    } else {
      console.log('   ❌ FAILED: Should reject missing query with 400.\n');
    }
  } catch (err) {
    console.error('   ❌ FAILED with network error:', err);
  }

  // Test 4: Invalid Enum Values Validation
  console.log('4. Testing validation for invalid preference enum...');
  try {
    const invalidEnumRes = await fetch(`${BASE_URL}/ai/explain`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        query: 'WebSockets',
        learningStyle: 'super-visual', // invalid enum
        depth: 'standard',
        examples: 'minimal',
        language: 'en'
      })
    });
    console.log(`   Response Status: ${invalidEnumRes.status}`);
    const data = await invalidEnumRes.json();
    console.log(`   Response Body:`, JSON.stringify(data));
    if (invalidEnumRes.status === 400) {
      console.log('   ✅ PASSED: Rejected invalid learningStyle value correctly.\n');
    } else {
      console.log('   ❌ FAILED: Should reject invalid learningStyle enum with 400.\n');
    }
  } catch (err) {
    console.error('   ❌ FAILED with network error:', err);
  }

  // Target Test 1: Academic, Standard, Few (minimal) examples, English
  console.log('5. Testing Target Case 1: Academic / Standard / English...');
  await testExplainScenario({
    query: 'WebSockets',
    learningStyle: 'academic',
    depth: 'standard',
    examples: 'minimal',
    language: 'English'
  }, authHeaders);

  // Target Test 2: Visual, Standard, Balanced examples, English
  console.log('6. Testing Target Case 2: Visual / Standard / English...');
  await testExplainScenario({
    query: 'WebSockets',
    learningStyle: 'visual',
    depth: 'standard',
    examples: 'balanced',
    language: 'English'
  }, authHeaders);

  // Target Test 3: Practical, Deep, More (example-heavy) examples, English
  console.log('7. Testing Target Case 3: Practical / Deep / English...');
  await testExplainScenario({
    query: 'WebSockets',
    learningStyle: 'practical',
    depth: 'deep',
    examples: 'example-heavy',
    language: 'English'
  }, authHeaders);

  // Target Test 4: Beginner, Quick, Few (minimal) examples, Telugu
  console.log('8. Testing Target Case 4: Beginner / Quick / Telugu...');
  await testExplainScenario({
    query: 'WebSockets',
    learningStyle: 'beginner',
    depth: 'quick',
    examples: 'minimal',
    language: 'Telugu'
  }, authHeaders);

  console.log('==================================================');
  console.log('TEST COMPLETE');
  console.log('==================================================');
}

async function testExplainScenario(payload: any, headers: any) {
  try {
    const res = await fetch(`${BASE_URL}/ai/explain`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    console.log(`   Response Status: ${res.status}`);
    const data = (await res.json()) as any;
    
    if (res.status !== 200 || !data.success) {
      console.log('   ❌ FAILED: Success flag or status was invalid', data);
      return;
    }

    const val = data.data;
    console.log(`   Response Topic: ${val.topic}`);
    console.log(`   Response Preferences:`, JSON.stringify(val.preferences));
    console.log(`   Number of Blocks: ${val.blocks?.length}`);
    
    // Check blocks details
    const hasDef = val.blocks.some((b: any) => b.id === 'definition');
    const hasHow = val.blocks.some((b: any) => b.id === 'how-it-works');
    const hasEx = val.blocks.some((b: any) => b.id === 'example');
    const hasTake = val.blocks.some((b: any) => b.id === 'takeaways');

    if (hasDef && hasHow && hasEx && hasTake) {
      console.log('   ✅ PASSED: All stable block IDs present.');
    } else {
      console.log('   ❌ FAILED: Missing one or more required block IDs (definition, how-it-works, example, takeaways).');
    }

    // Verify Zod schema properties
    let schemaValid = true;
    for (const b of val.blocks) {
      if (!b.id || !b.type || !b.title) {
        schemaValid = false;
      }
      if (b.type === 'takeaways' && (!b.items || !Array.isArray(b.items))) {
        schemaValid = false;
      }
    }
    if (schemaValid) {
      console.log('   ✅ PASSED: Zod block fields structure verified.\n');
    } else {
      console.log('   ❌ FAILED: Blocks validation schema failed.\n');
    }

  } catch (err) {
    console.error('   ❌ FAILED with network error:', err);
  }
}

runTests();
