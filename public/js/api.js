"use strict";

/*
=========================================================
API CONFIGURATION
Student Performance & Career Guidance System
Backend: Node.js + Express.js + MySQL
Compatible with: Vercel Serverless & Local Development
=========================================================
*/

// Dynamic URL Resolution: Uses relative '/api' on Vercel/Production or localhost:5000 fallback
const getDynamicApiUrl = () => {
    if (typeof window !== "undefined" && window.location) {
        const hostname = window.location.hostname;
        const port = window.location.port;

        // If developing locally with VS Code Live Server (port 5500/3000), direct to Express backend
        if ((hostname === "localhost" || hostname === "127.0.0.1") && (port === "5500" || port === "3000" || port === "8080")) {
            return "http://localhost:5000/api";
        }

        // On Vercel production and standard express server, use relative path
        return "/api";
    }
    return "/api";
};

window.AppApi = {

    // Backend URL base
    API_URL: getDynamicApiUrl(),

    /*
    =====================================================
    COMMON API REQUEST FUNCTION
    =====================================================
    */

    async request(url, options = {}) {

        // Build clean API endpoint URL
        let endpoint;

        if (url.startsWith("http://") || url.startsWith("https://")) {
            endpoint = url;
        } else {
            // Normalize path to avoid double "/api/api"
            let cleanUrl = url;
            if (cleanUrl.startsWith("/api")) {
                cleanUrl = cleanUrl.substring(4);
            }
            if (!cleanUrl.startsWith("/")) {
                cleanUrl = "/" + cleanUrl;
            }

            endpoint = this.API_URL + cleanUrl;
        }

        /*
        =================================================
        HEADERS
        =================================================
        */

        const headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            ...(options.headers || {})
        };

        /*
        =================================================
        JWT TOKEN
        =================================================
        */

        const token = localStorage.getItem("auth_token") || 
                      localStorage.getItem("token") || 
                      localStorage.getItem("jwt");

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        console.log(
            "API REQUEST:",
            options.method || "GET",
            endpoint
        );

        /*
        =================================================
        SEND REQUEST
        =================================================
        */

        let response;

        try {
            response = await fetch(endpoint, {
                ...options,
                headers: headers
            });
        } catch (networkError) {
            console.error("NETWORK ERROR:", networkError);
            throw new Error(
                `Unable to connect to backend server at ${endpoint}. Please ensure the server is active.`
            );
        }

        /*
        =================================================
        READ RESPONSE
        =================================================
        */

        let data = {};

        try {
            data = await response.json();
        } catch (jsonError) {
            console.warn("Server did not return JSON response.");
        }

        console.log(
            "API RESPONSE:",
            response.status,
            data
        );

        /*
        =================================================
        HANDLE ERROR & EXPIRATION (401)
        =================================================
        */

        if (response.status === 401) {
            console.warn("Authentication token is invalid or expired. Redirecting to login...");
            
            this.toast("Session expired. Please log in again.", true);

            // Clean up invalid tokens
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            // Avoid infinite redirect loop if already on login/root page
            if (window.location.pathname !== "/login.html" && window.location.pathname !== "/" && window.location.pathname !== "/index.html") {
                setTimeout(() => {
                    window.location.href = "/login.html";
                }, 1500);
            }

            throw new Error(data.message || "Invalid or expired authentication token.");
        }

        if (!response.ok) {
            throw new Error(
                data.message || `Request failed with status ${response.status}.`
            );
        }

        return data;
    },

    /*
    =====================================================
    ESCAPE HTML
    =====================================================
    */

    escape(value) {
        return String(value ?? "").replace(
            /[&<>'"]/g,
            function (character) {
                const entities = {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    "'": "&#39;",
                    '"': "&quot;"
                };
                return entities[character];
            }
        );
    },

    /*
    =====================================================
    DATE FORMAT
    =====================================================
    */

    date(value) {
        if (!value) {
            return "—";
        }
        return new Date(value).toLocaleDateString();
    },

    /*
    =====================================================
    TOAST MESSAGE
    =====================================================
    */

    toast(message, error = false) {
        const element = document.getElementById("toast");

        if (!element) {
            return;
        }

        element.textContent = message;
        element.className = `toast show${error ? " error" : ""}`;

        window.clearTimeout(window.AppApi.toastTimer);

        window.AppApi.toastTimer = window.setTimeout(
            function () {
                element.className = "toast";
            },
            3200
        );
    },

    /*
    =====================================================
    LOGOUT
    =====================================================
    */

    logout() {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href = "/login.html";
    }

};

// =====================================================
// CONFIRM API LOADED
// =====================================================

console.log("API.JS LOADED SUCCESSFULLY");
console.log("Backend API Endpoint:", window.AppApi.API_URL);