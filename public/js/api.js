"use strict";

/*
=========================================================
API CONFIGURATION
Student Performance & Career Guidance System

Frontend: HTML + CSS + JavaScript
Backend: Node.js + Express.js + MySQL

Deployment:
Frontend -> Vercel
Backend  -> Vercel

Vercel URL:
https://student-performance-and-career-guid.vercel.app
=========================================================
*/


// =========================================================
// 1. API URL CONFIGURATION
// =========================================================
//
// IMPORTANT:
// Frontend and backend are deployed on the SAME Vercel
// domain.
//
// Therefore we use a relative API URL:
//
// /api
//
// This automatically becomes:
//
// https://student-performance-and-career-guid.vercel.app/api
// =========================================================

const getDynamicApiUrl = () => {

    if (
        typeof window !== "undefined" &&
        window.location
    ) {

        const hostname =
            window.location.hostname;

        const port =
            window.location.port;


        console.log(
            "Current hostname:",
            hostname
        );

        console.log(
            "Current port:",
            port
        );


        // =================================================
        // LOCAL DEVELOPMENT
        // =================================================

        if (
            hostname === "localhost" ||
            hostname === "127.0.0.1"
        ) {

            console.log(
                "LOCAL DEVELOPMENT MODE"
            );


            return "http://localhost:5000/api";
        }


        // =================================================
        // VERCEL PRODUCTION
        // =================================================

        console.log(
            "VERCEL PRODUCTION MODE"
        );


        return "/api";
    }


    // =====================================================
    // FALLBACK
    // =====================================================

    return "/api";
};


// =========================================================
// 2. GLOBAL API OBJECT
// =========================================================

window.AppApi = {

    // API base URL
    API_URL: getDynamicApiUrl(),


    // =====================================================
    // COMMON API REQUEST FUNCTION
    // =====================================================

    async request(url, options = {}) {

        let endpoint;


        // =================================================
        // COMPLETE URL
        // =================================================

        if (
            url.startsWith("http://") ||
            url.startsWith("https://")
        ) {

            endpoint = url;

        } else {

            let cleanUrl = url;


            // =================================================
            // REMOVE /api
            // Prevent /api/api
            // =================================================

            if (
                cleanUrl.startsWith("/api")
            ) {

                cleanUrl =
                    cleanUrl.substring(4);
            }


            // =================================================
            // MAKE SURE URL STARTS WITH /
            // =================================================

            if (
                !cleanUrl.startsWith("/")
            ) {

                cleanUrl =
                    "/" + cleanUrl;
            }


            endpoint =
                this.API_URL + cleanUrl;
        }


        // =================================================
        // HEADERS
        // =================================================

        const headers = {

            "Content-Type":
                "application/json",

            "Accept":
                "application/json",

            ...(options.headers || {})
        };


        // =================================================
        // JWT TOKEN
        // =================================================

        const token =
            localStorage.getItem("auth_token") ||
            localStorage.getItem("token") ||
            localStorage.getItem("jwt");


        if (token) {

            headers.Authorization =
                `Bearer ${token}`;
        }


        // =================================================
        // DEBUG LOG
        // =================================================

        console.log(
            "=========================================="
        );

        console.log(
            "API REQUEST:",
            options.method || "GET"
        );

        console.log(
            "API ENDPOINT:",
            endpoint
        );

        console.log(
            "=========================================="
        );


        // =================================================
        // SEND REQUEST
        // =================================================

        let response;


        try {

            response = await fetch(
                endpoint,
                {
                    ...options,
                    headers: headers
                }
            );

        } catch (networkError) {

            console.error(
                "NETWORK ERROR:",
                networkError
            );


            throw new Error(
                `Unable to connect to backend server.

Backend:
${this.API_URL}

Please make sure your Vercel backend is deployed and running.`
            );
        }


        // =================================================
        // READ RESPONSE
        // =================================================

        let data = {};


        try {

            data = await response.json();

        } catch (jsonError) {

            console.warn(
                "Server did not return JSON response."
            );
        }


        // =================================================
        // RESPONSE DEBUG
        // =================================================

        console.log(
            "API RESPONSE STATUS:",
            response.status
        );

        console.log(
            "API RESPONSE DATA:",
            data
        );


        // =================================================
        // HANDLE 401
        // =================================================

        if (
            response.status === 401
        ) {

            console.warn(
                "Authentication token is invalid or expired."
            );


            this.toast(
                "Session expired. Please log in again.",
                true
            );


            // Remove invalid tokens

            localStorage.removeItem(
                "auth_token"
            );

            localStorage.removeItem(
                "auth_user"
            );

            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "user"
            );

            localStorage.removeItem(
                "jwt"
            );


            // =================================================
            // AVOID REDIRECT LOOP
            // =================================================

            if (
                window.location.pathname !==
                    "/login.html" &&

                window.location.pathname !==
                    "/" &&

                window.location.pathname !==
                    "/index.html"
            ) {

                setTimeout(
                    () => {

                        window.location.href =
                            "/login.html";

                    },
                    1500
                );
            }


            throw new Error(
                data.message ||
                data.error ||
                "Invalid or expired authentication token."
            );
        }


        // =================================================
        // HANDLE OTHER ERRORS
        // =================================================

        if (!response.ok) {

            console.error(
                "API ERROR:",
                response.status,
                data
            );


            throw new Error(
                data.message ||
                data.error ||
                `Request failed with status ${response.status}.`
            );
        }


        // =================================================
        // SUCCESS
        // =================================================

        return data;
    },


    // =====================================================
    // ESCAPE HTML
    // =====================================================

    escape(value) {

        return String(
            value ?? ""
        ).replace(
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


    // =====================================================
    // DATE FORMAT
    // =====================================================

    date(value) {

        if (!value) {

            return "—";
        }


        try {

            return new Date(
                value
            ).toLocaleDateString();

        } catch (error) {

            return "—";
        }
    },


    // =====================================================
    // TOAST MESSAGE
    // =====================================================

    toast(message, error = false) {

        const element =
            document.getElementById("toast");


        if (!element) {

            console.warn(
                "Toast element not found."
            );

            return;
        }


        element.textContent =
            message;


        element.className =
            `toast show${error ? " error" : ""}`;


        window.clearTimeout(
            window.AppApi.toastTimer
        );


        window.AppApi.toastTimer =
            window.setTimeout(

                function () {

                    element.className =
                        "toast";

                },

                3200
            );
    },


    // =====================================================
    // LOGOUT
    // =====================================================

    logout() {

        console.log(
            "Logging out..."
        );


        localStorage.removeItem(
            "auth_token"
        );

        localStorage.removeItem(
            "auth_user"
        );

        localStorage.removeItem(
            "token"
        );

        localStorage.removeItem(
            "user"
        );

        localStorage.removeItem(
            "jwt"
        );


        window.location.href =
            "/login.html";
    }

};


// =========================================================
// CONFIRM API.JS LOADED
// =========================================================

console.log(
    "=========================================="
);

console.log(
    "API.JS LOADED SUCCESSFULLY"
);

console.log(
    "Backend API Endpoint:",
    window.AppApi.API_URL
);

console.log(
    "=========================================="
);