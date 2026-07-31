import { getAuthToken } from "./post"

const FRIENDS_URL = `http://localhost:8000/friends`;
const USERS_URL = `http://localhost:8000/users`;

export async function getAllFriends() {
    try {
        const response = await fetch(`${FRIENDS_URL}/`, {
            method: 'GET',
            headers: getAuthToken()
        });
        if (!response.ok) throw new Error("Error in getting friends");
        return await response.json();
    } catch (error) {
        console.error("Error in getting friends", error);
    }
}

export async function getAllRequests() {
    try {
        const response = await fetch(`${FRIENDS_URL}/requests`, {
            method: 'GET',
            headers: getAuthToken()
        });
        if (!response.ok) throw new Error("Error in getting requests");
        return await response.json();
    } catch (error) {
        console.error("Error in getting requests", error);
    }
}

export async function getSentRequests() {
    try {
        const response = await fetch(`${FRIENDS_URL}/sent-requests`, {
            method: 'GET',
            headers: getAuthToken()
        });
        if (!response.ok) throw new Error("Error in getting sent requests");
        return await response.json();
    } catch (error) {
        console.error("Error in getting sent requests", error);
    }
}

export async function findPeople() {
    try {
        const response = await fetch(`${USERS_URL}/`, {
            method: 'GET',
            headers: getAuthToken()
        });
        if (!response.ok) throw new Error("Error in finding people");
        return await response.json();
    } catch (error) {
        console.error("Error in finding people", error);
    }
}

export async function sendRequest(user_id) {
    try {
        const response = await fetch(`${FRIENDS_URL}/request/${user_id}`, {
            method: 'POST',
            headers: getAuthToken()
        });
        if (!response.ok) throw new Error("Error sending request");
        return await response.json();
    } catch (error) {
        console.error("Error sending request", error);
    }
}

export async function acceptRequest(friendship_id) {
    try {
        const response = await fetch(`${FRIENDS_URL}/${friendship_id}/accept`, {
            method: 'PUT',
            headers: getAuthToken()
        });
        if (!response.ok) throw new Error("Error accepting request");
        return await response.json();
    } catch (error) {
        console.error("Error accepting request", error);
    }
}

export async function rejectRequest(friendship_id) {
    try {
        const response = await fetch(`${FRIENDS_URL}/${friendship_id}/reject`, {
            method: 'DELETE',
            headers: getAuthToken()
        });
        if (!response.ok) throw new Error("Error rejecting/removing friend");
        return true;
    } catch (error) {
        console.error("Error rejecting/removing friend", error);
    }
}