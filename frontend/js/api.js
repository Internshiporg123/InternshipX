// InternshipX API Client
// Crafted by ByteForge

async function apiRequest(endpoint, method = "GET", body = null) {

    const timeoutMs = CONFIG.REQUEST_TIMEOUT_MS || 20000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const options = {
        method,
        signal: controller.signal,
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
        const contentType = response.headers.get("content-type") || "";

        const data = contentType.includes("application/json")
            ? await response.json()
            : { message: await response.text() };

        if (!response.ok) {
            throw new Error(data.message || "Something went wrong.");
        }

        return data;

    } catch (error) {

        console.error(error);

        if (error.name === "AbortError") {
            throw new Error("The server is taking too long. Please try again in a moment.");
        }

        if (error instanceof TypeError) {
            throw new Error("Could not connect to the server. Please try again in a moment.");
        }

        throw error;

    } finally {

        clearTimeout(timeoutId);

    }

}
