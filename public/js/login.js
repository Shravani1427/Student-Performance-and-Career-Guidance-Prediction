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

    if (togglePassword && passwordInput) {
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

        const email = emailInput ? emailInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";

        console.log("Selected role:", selectedRole);
        console.log("Email:", email);

        if (!email) {
            showError("Please enter your email address.");
            if (emailInput) emailInput.focus();
            return;
        }

        if (!password) {
            showError("Please enter your password.");
            if (passwordInput) passwordInput.focus();
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
            let result;

            // Use AppApi wrapper if available, otherwise direct fetch
            if (window.AppApi && typeof window.AppApi.request === "function") {
                result = await window.AppApi.request(endpoint, {
                    method: "POST",
                    body: JSON.stringify({ email, password, role: selectedRole })
                });
            } else {
                const response = await fetch(`/api${endpoint}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({ email, password, role: selectedRole })
                });

                // Safely parse JSON response
                const text = await response.text();
                try {
                    result = JSON.parse(text);
                } catch (e) {
                    throw new Error(`Server returned unexpected response (${response.status})`);
                }

                if (!response.ok || result.success === false) {
                    throw new Error(result.message || `Login failed with status ${response.status}`);
                }
            }

            console.log("BACKEND RESPONSE:", result);

            // Extract JWT Token
            const token = result.token || result.auth_token || result.accessToken;

            if (!token) {
                console.error("Server response does not contain token:", result);
                throw new Error("Login response did not contain an authentication token.");
            }

            // Save tokens to localStorage
            localStorage.setItem("auth_token", token);
            localStorage.setItem("token", token);

            // Save user profile data
            const user = result.user || result.admin || result.student || { email, role: selectedRole };
            localStorage.setItem("auth_user", JSON.stringify(user));
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem("role", selectedRole);

            console.log("LOGIN SUCCESSFUL");
            console.log("Logged-in user:", user);

            // Role-based Redirection
            if (selectedRole === "admin") {
                window.location.href = "/admin-dashboard.html";
            } else {
                window.location.href = "/student-dashboard.html";
            }

        } catch (error) {
            console.error("LOGIN ERROR:", error);

            if (error instanceof TypeError && error.message.includes("fetch")) {
                showError("Cannot connect to the backend server. Please check your network connection.");
            } else {
                showError(error.message || "Login failed. Please verify your credentials and try again.");
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