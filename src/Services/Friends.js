import { API_BASE_URL } from "../config.js";
import { apiFetch } from "./apiFetch.js";

const FRIENDS_URL = `${API_BASE_URL}/friends`;
const USERS_URL = `${API_BASE_URL}/users`;

export async function getAllFriends() {
    try {
        const response = await apiFetch(`${FRIENDS_URL}/`, {
            method: "GET",
        });
        if (!response.ok) throw new Error("Error in getting friends");
        return await response.json();
    } catch (error) {
        console.error("getAllFriends:", error);
        throw error;
    }
}

export async function getAllRequests() {
    try {
        const response = await apiFetch(`${FRIENDS_URL}/requests`, {
            method: "GET",
        });
        if (!response.ok) throw new Error("Error in getting requests");
        return await response.json();
    } catch (error) {
        console.error("getAllRequests:", error);
        throw error;
    }
}

export async function getSentRequests() {
    try {
        const response = await apiFetch(`${FRIENDS_URL}/sent-requests`, {
            method: "GET",
        });
        if (!response.ok) throw new Error("Error in getting sent requests");
        return await response.json();
    } catch (error) {
        console.error("getSentRequests:", error);
        throw error;
    }
}

export async function findPeople() {
    try {
        const response = await apiFetch(`${USERS_URL}/`, {
            method: "GET",
        });
        if (!response.ok) throw new Error("Error in finding people");
        return await response.json();
    } catch (error) {
        console.error("findPeople:", error);
        throw error;
    }
}

export async function sendRequest(user_id) {
    try {
        const response = await apiFetch(`${FRIENDS_URL}/request/${user_id}`, {
            method: "POST",
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Error sending request");
        }
        return await response.json();
    } catch (error) {
        console.error("sendRequest:", error);
        throw error;
    }
}

export async function acceptRequest(friendship_id) {
    try {
        const response = await apiFetch(`${FRIENDS_URL}/${friendship_id}/accept`, {
            method: "PUT",
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Error accepting request");
        }
        return await response.json();
    } catch (error) {
        console.error("acceptRequest:", error);
        throw error;
    }
}

export async function rejectRequest(friendship_id) {
    try {
        const response = await apiFetch(`${FRIENDS_URL}/${friendship_id}/reject`, {
            method: "DELETE",
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Error rejecting/removing friend");
        }
        return true;
    } catch (error) {
        console.error("rejectRequest:", error);
        throw error;
    }
}