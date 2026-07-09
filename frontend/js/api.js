// InternshipX API Client
// Crafted by ByteForge

async function apiRequest(endpoint, method = "GET", body = null) {

    const options = {
        method,
        headers: {
            "Content-Type": "application/json"
        }
    };

    // Add JWT if available
    const token = localStorage.getItem("token");

    if (token) {
        options.headers.Authorization = `Bearer ${token}`;
    }

    // Add request body
    if (body) {
        options.body = JSON.stringify(body);
    }

    try {

        const response = await fetch(CONFIG.API_URL + endpoint, options);

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Something went wrong.");
        }

        return data;

    } catch (error) {

        console.error(error);

        throw error;

    }

}