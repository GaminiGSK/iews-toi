const key = "AIzaSyChPOMe6tCoxVOwgxwszhRaWr4Vsbw3iB0";

async function list() {
    try {
        console.log("Listing models via REST (fetch)...");
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await res.json();

        if (data.error) {
            console.error("API Error:", JSON.stringify(data.error, null, 2));
        } else {
            console.log("Models:", data.models?.map(m => m.name));
        }
    } catch (e) {
        console.error("Network Error:", e);
    }
}
list();
