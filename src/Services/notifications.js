const API_URL = "http://localhost:8000"; // Assuming the backend is running on 8000

export const GetNotifications = async () => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/notifications/`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error("Failed to fetch notifications");
    }

    return await response.json();
};

export const ReadNotification = async (id) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error("Failed to read notification");
    }

    return await response.json();
};

export const DeleteNotification = async (id) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/notifications/${id}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error("Failed to delete notification");
    }
};
