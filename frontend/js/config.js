// InternshipX Configuration
// Crafted by ByteForge

const isLocalFrontend = ["localhost", "127.0.0.1"].includes(window.location.hostname);

const CONFIG = {
    API_URL: isLocalFrontend
        ? "http://127.0.0.1:5000/api"
        : "https://internshipx.onrender.com/api",
    REQUEST_TIMEOUT_MS: 20000
};
