import { API_BASE_URL } from "../config.js";
import { apiFetch } from "./apiFetch.js";

const Base_Url = `${API_BASE_URL}/users`;

export async function Signup(name, email, password) {
    try {
        const response = await fetch(`${Base_Url}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.detail || "Signup failed");
        }
        return await response.json();
    } catch (error) {
        console.error("Signup:", error);
        throw error; // propagate to SignUp.jsx so the form can display the message
    }
}

export async function loginUser(email, password) {
    try {
        const response = await fetch(`${Base_Url}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.detail || "Login failed");
        }
        const data = await response.json();
        localStorage.setItem("token", data.token);
        return data;
    } catch (error) {
        console.error("loginUser:", error);
        throw error;
    }
}

export async function getUserName() {
    try {
        const response = await apiFetch(`${Base_Url}/me`, {
            method: "GET",
        });
        if (!response.ok) {
            throw new Error("Could not fetch current user");
        }
        return await response.json();
    } catch (error) {
        console.error("getUserName:", error);
        throw error;
    }
}