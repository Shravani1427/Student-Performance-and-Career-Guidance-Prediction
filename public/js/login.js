"use strict";

console.log("LOGIN.JS IS WORKING");

document.addEventListener("DOMContentLoaded", function () {

    // =====================================================
    // GET HTML ELEMENTS
    // =====================================================

    const loginForm = document.getElementById("login-form");
    const emailInput = document.getElementById("login-email");
    const passwordInput = document.getElementById("login-password");
    const loginError = document.getElementById("login-error");
    const togglePassword = document.getElementById("toggle-password");
    const submitButton = document.querySelector(".submit-button");
    const roleButtons = document.querySelectorAll(".role-tabs button");


    // =====================================================
    // CHECK LOGIN FORM
    // =====================================================

    if (!loginForm) {
        console.error("ERROR: login-form was not found.");
        return;
    }


    // =====================================================
    // STUDENT / ADMIN ROLE BUTTONS
    // =====================================================

    roleButtons.forEach(function (button) {
        button.addEventListener("click", function (event) {
            event.preventDefault();

            roleButtons.forEach(function (item) {
                item.classList.remove("selected");
            });

            button.classList.add("selected");

            if (loginError) {
                loginError.textContent = "";
                loginError.classList.add("hidden");
            }

            console.log("Selected role:", button.dataset.role);
        });
    });


    // =====================================================
    // SHOW / HIDE PASSWORD
    // =====================================================

    if (togglePassword) {
        togglePassword.addEventListener("click", function (event) {
            event.preventDefault();

            if (passwordInput.type === "password") {
                passwordInput.type = "text";
            } else {
                passwordInput.type = "password";
            }
        });
    }


    // =====================================================
    // LOGIN FORM SUBMIT
    // =====================================================

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        console.log("LOGIN BUTTON CLICKED");

        const selectedButton = document.querySelector(".role-tabs button.selected");
        const selectedRole = selectedButton ? selectedButton.dataset.role : "student";

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        console.log("Selected role:", selectedRole);
        console.log("Email:", email);

        if (!email) {
            showError("Please enter your email address.");
            emailInput.focus();
            return;
        }

        if (!password) {
            showError("Please enter your password.");
            passwordInput.focus();
            return;
        }

        if (loginError) {
            loginError.textContent = "";
            loginError.classList.add("hidden");
        }

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Signing in...";
        }

        try {

            const endpoint = selectedRole === "admin" ? "/auth/admin-login" : "/auth/login";

            console.log("Sending request via AppApi to:", endpoint);

            // Use AppApi wrapper if available, fallback to direct fetch
            let result;
            if (window.AppApi && typeof window.AppApi.request === "function") {
                result = await window.AppApi.request(endpoint, {
                    method: "POST",
                    body: JSON.stringify({ email, password })
                });
            } else {
                const response = await fetch(`/api${endpoint}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({ email, password })
                });

                result = await response.json();

                if (!response.ok || result.success === false) {
                    throw new Error(result.message || `Login failed with status ${response.status}`);
                }
            }

            console.log("BACKEND RESPONSE:", result);

            const token = result.token || result.auth_token;

            if (!token) {
                console.error("Server response does not contain token:", result);
                throw new Error("Login response did not contain an authentication token.");
            }

            // Save under both storage keys for complete compatibility
            localStorage.setItem("auth_token", token);
            localStorage.setItem("token", token);

            if (result.user) {
                localStorage.setItem("auth_user", JSON.stringify(result.user));
                localStorage.setItem("user", JSON.stringify(result.user));
            }

            console.log("LOGIN SUCCESSFUL");
            console.log("Logged-in user:", result.user);

            if (selectedRole === "admin") {
                window.location.href = "/admin-dashboard.html";
            } else {
                window.location.href = "/student-dashboard.html";
            }

        } catch (error) {

            console.error("LOGIN ERROR:", error);

            if (error instanceof TypeError) {
                showError("Cannot connect to the backend server. Please check your network connection.");
            } else {
                showError(error.message || "Login failed. Please try again.");
            }

        } finally {

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Login";
            }

        }

    });


    // =====================================================
    // SHOW ERROR MESSAGE
    // =====================================================

    function showError(message) {
        console.error("LOGIN MESSAGE:", message);

        if (loginError) {
            loginError.textContent = message;
            loginError.classList.remove("hidden");
        } else {
            alert(message);
        }
    }

});