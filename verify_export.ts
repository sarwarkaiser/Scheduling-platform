
// using native fetch

async function verify() {
    try {
        const url = "http://localhost:3001/api/schedules/export?programId=prog-1&startDate=2024-07-01&endDate=2024-07-14&format=csv";
        console.log('Fetching:', url);
        const res = await fetch(url);
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Body:', text);
    } catch (e) {
        console.error(e);
    }
}

verify();
