// Smoke test script to verify frontend-backend connection
async function testConnection() {
  console.log("🔍 Testing Backend Connection...\n");

  try {
    console.log("1. Testing backend health endpoint...");
    const healthResponse = await fetch("http://localhost:5000/api/health");
    const healthData = await healthResponse.json();
    console.log("✅ Backend Health:", healthData);

    console.log("\n2. Testing main backend endpoint...");
    const mainResponse = await fetch("http://localhost:5000/");
    const mainData = await mainResponse.json();
    console.log("✅ Main Endpoint:", mainData);

    console.log("\n3. Testing contact endpoint validation...");
    const invalidContactResponse = await fetch("http://localhost:5000/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: "",
        lastName: "",
        email: "invalid-email",
        message: "short",
      }),
    });

    const invalidContactData = await invalidContactResponse.json();
    console.log("✅ Contact Validation Response:", invalidContactData);

    console.log("\n🎉 Smoke test completed.");
  } catch (error) {
    console.error("❌ Connection test failed:", error.message);
    console.log("\n🔧 Troubleshooting steps:");
    console.log("1. Make sure backend is running: npm run dev (in backend folder)");
    console.log("2. Check if port 5000 is available");
    console.log("3. Verify no firewall is blocking the connection");
  }
}

testConnection();
