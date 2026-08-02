import { API_BASE_URL } from "../config.js";
import { getAuthToken } from "./post.js";

// No more duplicate getAuthToken definition — imported from the single source.
const Base_url = `${API_BASE_URL}/comments`;

export async function AddComment(comment) {
    try {
        const response = await fetch(`${Base_url}/${comment.post_id}`, {
            method: "POST",
            headers: getAuthToken(),
            body: JSON.stringify({ content: comment.content }), // send only what the schema expects
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Error in adding comment");
        }
        return await response.json();
    } catch (error) {
        console.error("AddComment:", error);
        throw error;
    }
}

export async function UpdateComment(comment) {
    try {
        const response = await fetch(`${Base_url}/${comment.id}`, {
            method: "PUT",
            headers: getAuthToken(),
            body: JSON.stringify({ content: comment.content }), // only send content
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Error in updating comment");
        }
        return await response.json(); // return the updated comment so caller can verify
    } catch (error) {
        console.error("UpdateComment:", error);
        throw error;
    }
}

export async function DeleteComment(comment_id) {
    try {
        const response = await fetch(`${Base_url}/${comment_id}`, {
            method: "DELETE",
            headers: getAuthToken(),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Error in deleting comment");
        }
        return true;
    } catch (error) {
        console.error("DeleteComment:", error);
        throw error;
    }
}