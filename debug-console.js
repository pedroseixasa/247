// This is a test file to debug in browser console
// Run this in browser DevTools console after navigation to admin panel

async function testReservationsAPI() {
  const token = localStorage.getItem("admin_token");
  console.log(
    "Using token:",
    token ? token.substring(0, 30) + "..." : "NOT FOUND",
  );

  const response = await fetch("/api/admin/reservations", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  console.log("API Response:", data);

  if (data.length > 0) {
    console.log("\nFirst Reservation:");
    console.log("Full object:", data[0]);
    console.log("barberId:", data[0].barberId);
    console.log("barberId type:", typeof data[0].barberId);
    if (data[0].barberId) {
      console.log("barberId._id:", data[0].barberId._id);
      console.log("barberId.name:", data[0].barberId.name);
      console.log("barberId keys:", Object.keys(data[0].barberId));
    }
  }
}

testReservationsAPI();
