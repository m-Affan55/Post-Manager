import { API_BASE_URL } from "../config.js";
import { apiFetch } from "./apiFetch.js";

const NOTIF_URL = `${API_BASE_URL}/notifications`;

export const GetNotifications = async (skip = 0, limit = 20) => {
    const response = await apiFetch(`${NOTIF_URL}/?skip=${skip}&limit=${limit}`, {
        method: "GET",
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to fetch notifications");
    }

    return await response.json();
};

export const ReadNotification = async (id) => {
    const response = await apiFetch(`${NOTIF_URL}/${id}/read`, {
        method: "PUT",
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to read notification");
    }

    return await response.json();
};

// FEAT-6: Mark all notifications as read
export const ReadAllNotifications = async () => {
    const response = await apiFetch(`${NOTIF_URL}/read-all`, {
        method: "PUT",
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to mark all notifications as read");
    }

    return await response.json();
};

export const DeleteNotification = async (id) => {
    const response = await apiFetch(`${NOTIF_URL}/${id}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to delete notification");
    }
};
