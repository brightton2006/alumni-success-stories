import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function testRealtimeFlow() {
  console.log('🧪 Starting Real-Time Database Connection Test Suite...\n');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ TEST ${total} PASSED: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ TEST ${total} FAILED: ${message}`);
    }
  }

  try {
    // 1. Admin Login
    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@successstory.com', password: 'admin123' })
    });
    const adminLoginData = await adminLoginRes.json();
    const token = adminLoginData.token;

    // TEST 1: SSE Stream Endpoint Reachability
    const streamRes = await fetch(`${API_BASE}/realtime/stream`, {
      headers: { Accept: 'text/event-stream' }
    });
    assert(streamRes.ok && streamRes.headers.get('content-type')?.includes('text/event-stream'), 'SSE Stream endpoint (/api/realtime/stream) returns 200 OK with text/event-stream content-type');

    // TEST 2: Polling Endpoint Reachability
    const pollRes = await fetch(`${API_BASE}/realtime/poll`);
    const pollData = await pollRes.json();
    assert(pollRes.ok && pollData.success === true && Array.isArray(pollData.events), 'Real-time polling endpoint (/api/realtime/poll) returns valid event array');

    // TEST 3: Real-Time Event Broadcast on Story Creation via HTTP API
    const timestampBefore = new Date(Date.now() - 1000).toISOString();
    const createStoryRes = await fetch(`${API_BASE}/admin/stories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        storyTitle: 'Realtime Live SSE Verification Story',
        personName: 'Live Stream Tester',
        fullStory: 'Testing real-time live database event broadcasting across connected clients.',
        category: 'Technology & Engineering'
      })
    });
    const createStoryData = await createStoryRes.json();
    const createdStory = createStoryData.story;

    const pollAfterInsert = await fetch(`${API_BASE}/realtime/poll?since=${encodeURIComponent(timestampBefore)}`);
    const pollDataAfter = await pollAfterInsert.json();
    const insertEvent = pollDataAfter.events.find(e => e.type === 'STORIES_CREATED' && (e.item?.id === createdStory?.id || e.item?._id === createdStory?.id));
    assert(createStoryRes.ok && insertEvent !== undefined, 'Database mutation via API (POST /api/admin/stories) automatically triggered real-time event broadcast (STORIES_CREATED)');

    // TEST 4: Real-Time Event Broadcast on Story Update via HTTP API
    const updateTimestamp = new Date(Date.now() - 1000).toISOString();
    const updateStoryRes = await fetch(`${API_BASE}/admin/stories/${createdStory.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        storyTitle: 'Updated Realtime Title via API',
        personName: 'Live Stream Tester',
        fullStory: 'Updated full story content for real-time verification.'
      })
    });

    const pollAfterUpdate = await fetch(`${API_BASE}/realtime/poll?since=${encodeURIComponent(updateTimestamp)}`);
    const pollDataUpdate = await pollAfterUpdate.json();
    const updateEvent = pollDataUpdate.events.find(e => e.type === 'STORIES_UPDATED' && (e.id === createdStory.id || e.item?.id === createdStory.id));
    assert(updateStoryRes.ok && updateEvent !== undefined, 'Database mutation via API (PUT /api/admin/stories/:id) automatically triggered real-time event broadcast (STORIES_UPDATED)');

    // TEST 5: Real-Time Event Broadcast on Story Deletion via HTTP API
    const deleteTimestamp = new Date(Date.now() - 1000).toISOString();
    const deleteStoryRes = await fetch(`${API_BASE}/admin/stories/${createdStory.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const pollAfterDelete = await fetch(`${API_BASE}/realtime/poll?since=${encodeURIComponent(deleteTimestamp)}`);
    const pollDataDelete = await pollAfterDelete.json();
    const deleteEvent = pollDataDelete.events.find(e => e.type === 'STORIES_DELETED' && e.id === createdStory.id);
    assert(deleteStoryRes.ok && deleteEvent !== undefined, 'Database mutation via API (DELETE /api/admin/stories/:id) automatically triggered real-time event broadcast (STORIES_DELETED)');

    console.log(`\n========================================`);
    console.log(`RESULTS: ${passed} / ${total} TESTS PASSED`);
    console.log(`========================================\n`);

    process.exit(passed === total ? 0 : 1);
  } catch (err) {
    console.error('Real-time test execution failed:', err);
    process.exit(1);
  }
}

testRealtimeFlow();
