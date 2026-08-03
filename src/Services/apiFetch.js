export const getAuthToken = () => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
};

export async function apiFetch(url, options = {}) {
    // Automatically attach auth headers
    const headers = {
        ...getAuthToken(),
        ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    // Global 401 Interceptor
    if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("current_user_id");
        window.location.href = "/"; // Force redirect to login
        throw new Error("Session expired");
    }

    return response;
}
