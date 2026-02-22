const axios = require("axios");

async function testAPI() {
  try {
    // Step 1: Login
    console.log("1. Logging in...");
    const loginRes = await axios.post("http://localhost:5000/api/auth/login", {
      email: "diogo@247barbearia.com",
      password: "12345678",
    });

    const token = loginRes.data.token;
    console.log("   Token obtained:", token.substring(0, 30) + "...");

    // Step 2: Fetch reservations
    console.log("\n2. Fetching reservations...");
    const res = await axios.get(
      "http://localhost:5000/api/admin/reservations",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    console.log(`   Found ${res.data.length} reservations\n`);

    res.data.forEach((r, i) => {
      console.log(`[${i}] Reservation:`);
      console.log(`    Time: ${r.timeSlot}`);
      console.log(`    barberId type: ${typeof r.barberId}`);
      console.log(
        `    barberId is object: ${r.barberId !== null && typeof r.barberId === "object"}`,
      );

      if (r.barberId) {
        console.log(`    barberId._id: ${r.barberId._id}`);
        console.log(`    barberId.name: ${r.barberId.name}`);
        console.log(`    ALL barberId keys:`, Object.keys(r.barberId));
      } else {
        console.log(`    barberId is: ${r.barberId}`);
      }

      console.log(`    Service: ${r.serviceId?.name || "N/A"}\n`);
    });
  } catch (err) {
    console.error("Error:", err.message);
    if (err.response) {
      console.error("Response:", err.response.status, err.response.data);
    }
  }
}

testAPI();
