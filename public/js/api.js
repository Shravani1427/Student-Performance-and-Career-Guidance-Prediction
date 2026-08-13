"use strict";

/*
=========================================================
API CONFIGURATION
Student Performance & Career Guidance System
Backend: Node.js + Express.js + MySQL
=========================================================
*/

// Dynamic Port Resolution: Handles local development ports (3000, 5500) pointing to Express on 5000
const getDynamicApiUrl = () => {
    if (typeof window !== "undefined" && window.location) {
        const port = window.location.port;
        // If frontend is running on local dev server ports, route API calls to Express on port 5000
        if (port === "3000" || port === "5500" || port === "8080" || port === "127.0.0.1") {
            return "http://localhost:5000/api";
        }
        // For production or when served directly by Express
        if (window.location.protocol.startsWith("http")) {
            return `${window.location.origin}/api`;
        }
    }
    return "http://localhost:5000/api";
};

window.AppApi = {

    // Backend URL base dynamically configured to target Express server on Port 5000
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
            // Strip leading /api if present to avoid duplicating base path
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
                `Unable to connect to backend server at ${this.API_URL}. Please ensure Express.js is running.`
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
            
            // Show toast error message if element exists
            this.toast("Session expired. Please log in again.", true);

            // Clean up invalid tokens
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            // Avoid infinite redirect loop if already on index/login page
            if (window.location.pathname !== "/index.html" && window.location.pathname !== "/") {
                setTimeout(() => {
                    window.location.href = "/index.html";
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

        window.location.href = "/index.html";
    }

};


// =====================================================
// CONFIRM API LOADED
// =====================================================

console.log("API.JS LOADED SUCCESSFULLY");
console.log("Backend API Endpoint:", window.AppApi.API_URL);