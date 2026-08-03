import { API_BASE_URL } from "../config.js";
import { apiFetch } from "./apiFetch.js";

export const Base_url = `${API_BASE_URL}/posts`;

export async function GetAllUserPosts(skip = 0, limit = 20) {
    try {
        const response = await apiFetch(`${Base_url}?skip=${skip}&limit=${limit}`, {
            method: "GET",
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Error while getting Posts");
        }
        return await response.json();
    } catch (error) {
        console.error("GetAllUserPosts:", error);
        throw error; // ← re-throw so the component can show an error message
    }
}

export async function GetPost(postId) {
    try {
        const response = await apiFetch(`${Base_url}/${postId}`, {
            method: "GET",
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Error while getting Post");
        }
        return await response.json();
    } catch (error) {
        console.error("GetPost:", error);
        throw error;
    }
}

export async function GetAllFeedPosts(skip = 0, limit = 20) {
    try {
        const response = await apiFetch(`${Base_url}/feed?skip=${skip}&limit=${limit}`, {
            method: "GET",
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Error while getting Feed Posts");
        }
        return await response.json();
    } catch (error) {
        console.error("GetAllFeedPosts:", error);
        throw error;
    }
}

export async function CreatePost(post) {
    try {
        const response = await apiFetch(Base_url, {
            method: "POST",
            body: JSON.stringify(post),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Error in creating post");
        }
        return await response.json();
    } catch (error) {
        console.error("CreatePost:", error);
        throw error;
    }
}

export async function UpdatePost(post) {
    try {
        const response = await apiFetch(`${Base_url}/${post.id}`, {
            method: "PUT",
            body: JSON.stringify({ title: post.title, content: post.content }),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Error in updating post");
        }
        return await response.json();
    } catch (error) {
        console.error("UpdatePost:", error);
        throw error;
    }
}

export async function DeletePost(postId) {
    try {
        const response = await apiFetch(`${Base_url}/${postId}`, {
            method: "DELETE",
            // No body on DELETE — the ID is already in the URL
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Error in deleting post");
        }
        return true; // 204 No Content → success
    } catch (error) {
        console.error("DeletePost:", error);
        throw error;
    }
}

export async function LikePost(postId) {
    try {
        const response = await apiFetch(`${Base_url}/${postId}/like`, {
            method: "POST",
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Error in liking post");
        }
        return await response.json();
    } catch (error) {
        console.error("LikePost:", error);
        throw error;
    }
}

export async function UnlikePost(postId) {
    try {
        const response = await apiFetch(`${Base_url}/${postId}/like`, {
            method: "DELETE",
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Error in unliking post");
        }
        return true;
    } catch (error) {
        console.error("UnlikePost:", error);
        throw error;
    }
}

export async function SharePost(postId, friendId) {
    try {
        const response = await apiFetch(`${Base_url}/${postId}/share/${friendId}`, {
            method: "POST",
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Error in sharing post");
        }
        return await response.json();
    } catch (error) {
        console.error("SharePost:", error);
        throw error;
    }
}
