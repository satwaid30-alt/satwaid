async function ping() {
    try {
        const res = await fetch('http://localhost:4000/shops');
        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Data count:", data.data?.length);
    } catch (err) {
        console.error("Fetch failed:", err.message);
    }
}

ping();
