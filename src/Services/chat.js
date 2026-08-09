import { API_BASE_URL } from "../config.js";
import { apiFetch } from "./apiFetch.js";

const CHAT_URL = `${API_BASE_URL}/chat`;

export async function getConversations() {
    try {
        const response = await apiFetch(`${CHAT_URL}/conversations`, {
            method: "GET",
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Error fetching conversations");
        }
        return await response.json();
    } catch (error) {
        console.error("getConversations:", error);
        throw error;
    }
}

export async function getMessages(friendId, cursor = null) {
    try {
        let url = `${CHAT_URL}/${friendId}?limit=20`;
        if (cursor) {
            url += `&cursor=${cursor}`;
        }
        const response = await apiFetch(url, {
            method: "GET",
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Error fetching messages");
        }
        return await response.json();
    } catch (error) {
        console.error("getMessages:", error);
        throw error;
    }
}

export async function sendMessage(receiverId, content) {
    try {
        const response = await apiFetch(`${CHAT_URL}/message`, {
            method: "POST",
            body: JSON.stringify({ receiver_id: receiverId, content }),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Error sending message");
        }
        // Returns full message with real DB id — used for dedup
        return await response.json();
    } catch (error) {
        console.error("sendMessage:", error);
        throw error;
    }
}

export async function shareToDM(receiverId, postId) {
    try {
        const response = await apiFetch(`${CHAT_URL}/share`, {
            method: "POST",
            body: JSON.stringify({ receiver_id: receiverId, post_id: postId }),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Error sharing post");
        }
        return await response.json();
    } catch (error) {
        console.error("shareToDM:", error);
        throw error;
    }
}

export async function markRead(friendId, messageId) {
    try {
        const response = await apiFetch(`${CHAT_URL}/${friendId}/read`, {
            method: "PATCH",
            body: JSON.stringify({ message_id: messageId }),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Error marking read");
        }
        return await response.json();
    } catch (error) {
        console.error("markRead:", error);
        throw error;
    }
}
