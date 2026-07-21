// test-security.js
// Script to test security and multi-tenant isolation in API Routes

const baseUrl = 'http://localhost:3000'; // Assume local test server or adapt to URL

async function runTests() {
  console.log("== Running Security Tests ==");
  
  console.log("\\n1. Testing /api/db without Token");
  try {
    const res = await fetch(`${baseUrl}/api/db`);
    const data = await res.json();
    if (res.status === 200 && data.properties && !data.teamMembers) {
      console.log("✅ Passed: Unauthenticated request returned public catalog successfully.");
    } else {
      console.log("❌ Failed: Unauthenticated request should return public catalog.", res.status, data);
    }
  } catch (e) {
    console.log("❌ Failed: Connection error", e.message);
  }

  console.log("\\n2. Testing /api/billing/folios without Token");
  try {
    const res = await fetch(`${baseUrl}/api/billing/folios`, { method: 'POST', body: JSON.stringify({}) });
    if (res.status === 401) {
      console.log("✅ Passed: Unauthenticated request to billing rejected with 401.");
    } else {
      console.log("❌ Failed: Billing API allowed unauthenticated request.", res.status);
    }
  } catch (e) {
    console.log("❌ Failed: Connection error", e.message);
  }
}

runTests().then(() => console.log("\\nTests complete."));
