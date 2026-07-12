

async function apiRequest(endpoint, method = "GET", body = null) {

    const timeoutMs = CONFIG.REQUEST_TIMEOUT_MS || 20000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const options = {
        method,
        signal: controller.signal,
        headers: {}
    };

    if (!(body instanceof FormData)) {
        options.headers["Content-Type"] = "application/json";
    }

    const token = sessionStorage.getItem("token");

    if (token) {
        options.headers.Authorization = `Bearer ${token}`;
    }

    if (body) {
        options.body = body instanceof FormData ? body : JSON.stringify(body);
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

window.showConfirmModal = function(title, message, confirmText = "Yes", cancelText = "No") {
    return new Promise((resolve) => {
        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.backgroundColor = "rgba(15, 23, 42, 0.5)";
        overlay.style.backdropFilter = "blur(8px)";
        overlay.style.webkitBackdropFilter = "blur(8px)";
        overlay.style.zIndex = "99999";
        overlay.style.display = "flex";
        overlay.style.justifyContent = "center";
        overlay.style.alignItems = "center";
        overlay.style.padding = "20px";
        overlay.style.opacity = "0";
        overlay.style.transition = "opacity 0.2s ease-out";

        const modal = document.createElement("div");
        modal.style.backgroundColor = "#ffffff";
        modal.style.width = "100%";
        modal.style.maxWidth = "400px";
        modal.style.borderRadius = "16px";
        modal.style.padding = "28px";
        modal.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
        modal.style.border = "1px solid #e2e8f0";
        modal.style.transform = "scale(0.95)";
        modal.style.transition = "transform 0.2s ease-out";
        modal.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

        modal.innerHTML = `
            <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1.25rem; font-weight: 700; color: #0f172a; line-height: 1.2;">${title}</h3>
            <p style="margin-top: 0; margin-bottom: 24px; font-size: 0.95rem; color: #475569; line-height: 1.5;">${message}</p>
            <div style="display: flex; justify-content: flex-end; gap: 12px;">
                <button id="customConfirmCancelBtn" style="padding: 10px 18px; border-radius: 10px; border: 1px solid #e2e8f0; background: #ffffff; color: #475569; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.15s ease;">${cancelText}</button>
                <button id="customConfirmOkBtn" style="padding: 10px 18px; border-radius: 10px; border: none; background: #2563eb; color: #ffffff; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.15s ease; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">${confirmText}</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.style.opacity = "1";
            modal.style.transform = "scale(1)";
        });

        const cleanup = (value) => {
            overlay.style.opacity = "0";
            modal.style.transform = "scale(0.95)";
            setTimeout(() => {
                document.body.removeChild(overlay);
                resolve(value);
            }, 200);
        };

        const cancelBtn = modal.querySelector("#customConfirmCancelBtn");
        const confirmBtn = modal.querySelector("#customConfirmOkBtn");

        cancelBtn.addEventListener("click", () => cleanup(false));
        confirmBtn.addEventListener("click", () => cleanup(true));

        cancelBtn.addEventListener("mouseenter", () => {
            cancelBtn.style.backgroundColor = "#f8fafc";
            cancelBtn.style.borderColor = "#cbd5e1";
        });
        cancelBtn.addEventListener("mouseleave", () => {
            cancelBtn.style.backgroundColor = "#ffffff";
            cancelBtn.style.borderColor = "#e2e8f0";
        });
        confirmBtn.addEventListener("mouseenter", () => {
            confirmBtn.style.backgroundColor = "#1d4ed8";
        });
        confirmBtn.addEventListener("mouseleave", () => {
            confirmBtn.style.backgroundColor = "#2563eb";
        });
    });
};

window.showAlertModal = function(title, message, buttonText = "OK") {
    return new Promise((resolve) => {
        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.backgroundColor = "rgba(15, 23, 42, 0.5)";
        overlay.style.backdropFilter = "blur(8px)";
        overlay.style.webkitBackdropFilter = "blur(8px)";
        overlay.style.zIndex = "99999";
        overlay.style.display = "flex";
        overlay.style.justifyContent = "center";
        overlay.style.alignItems = "center";
        overlay.style.padding = "20px";
        overlay.style.opacity = "0";
        overlay.style.transition = "opacity 0.2s ease-out";

        const modal = document.createElement("div");
        modal.style.backgroundColor = "#ffffff";
        modal.style.width = "100%";
        modal.style.maxWidth = "400px";
        modal.style.borderRadius = "16px";
        modal.style.padding = "28px";
        modal.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
        modal.style.border = "1px solid #e2e8f0";
        modal.style.transform = "scale(0.95)";
        modal.style.transition = "transform 0.2s ease-out";
        modal.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

        modal.innerHTML = `
            <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1.25rem; font-weight: 700; color: #0f172a; line-height: 1.2;">${title}</h3>
            <p style="margin-top: 0; margin-bottom: 24px; font-size: 0.95rem; color: #475569; line-height: 1.5;">${message}</p>
            <div style="display: flex; justify-content: flex-end;">
                <button id="customAlertOkBtn" style="padding: 10px 24px; border-radius: 10px; border: none; background: #2563eb; color: #ffffff; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.15s ease; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">${buttonText}</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.style.opacity = "1";
            modal.style.transform = "scale(1)";
        });

        const cleanup = () => {
            overlay.style.opacity = "0";
            modal.style.transform = "scale(0.95)";
            setTimeout(() => {
                document.body.removeChild(overlay);
                resolve();
            }, 200);
        };

        const confirmBtn = modal.querySelector("#customAlertOkBtn");
        confirmBtn.addEventListener("click", cleanup);

        confirmBtn.addEventListener("mouseenter", () => {
            confirmBtn.style.backgroundColor = "#1d4ed8";
        });
        confirmBtn.addEventListener("mouseleave", () => {
            confirmBtn.style.backgroundColor = "#2563eb";
        });
    });
};