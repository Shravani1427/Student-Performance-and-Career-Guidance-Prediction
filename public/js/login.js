"use strict";

console.log("LOGIN.JS IS WORKING");

document.addEventListener("DOMContentLoaded", function () {

    // =====================================================
    // BACKEND API URL
    // =====================================================

    const STUDENT_LOGIN_URL =
        "http://localhost:5000/api/auth/login";

    const ADMIN_LOGIN_URL =
        "http://localhost:5000/api/auth/admin-login";


    // =====================================================
    // GET HTML ELEMENTS
    // =====================================================

    const loginForm =
        document.getElementById("login-form");

    const emailInput =
        document.getElementById("login-email");

    const passwordInput =
        document.getElementById("login-password");

    const loginError =
        document.getElementById("login-error");

    const togglePassword =
        document.getElementById("toggle-password");

    const submitButton =
        document.querySelector(".submit-button");

    const roleButtons =
        document.querySelectorAll(".role-tabs button");


    // =====================================================
    // CHECK LOGIN FORM
    // =====================================================

    if (!loginForm) {

        console.error(
            "ERROR: login-form was not found."
        );

        return;
    }


    // =====================================================
    // STUDENT / ADMIN ROLE BUTTONS
    // =====================================================

    roleButtons.forEach(function (button) {

        button.addEventListener("click", function (event) {

            event.preventDefault();


            // Remove selected from all buttons

            roleButtons.forEach(function (item) {

                item.classList.remove("selected");

            });


            // Select clicked button

            button.classList.add("selected");


            // Clear previous error

            if (loginError) {

                loginError.textContent = "";

                loginError.classList.add("hidden");

            }


            console.log(
                "Selected role:",
                button.dataset.role
            );

        });

    });


    // =====================================================
    // SHOW / HIDE PASSWORD
    // =====================================================

    if (togglePassword) {

        togglePassword.addEventListener(
            "click",
            function (event) {

                event.preventDefault();


                if (
                    passwordInput.type ===
                    "password"
                ) {

                    passwordInput.type =
                        "text";

                } else {

                    passwordInput.type =
                        "password";

                }

            }
        );

    }


    // =====================================================
    // LOGIN FORM SUBMIT
    // =====================================================

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            console.log(
                "LOGIN BUTTON CLICKED"
            );


            // =================================================
            // GET SELECTED ROLE
            // =================================================

            const selectedButton =
                document.querySelector(
                    ".role-tabs button.selected"
                );


            const selectedRole =
                selectedButton
                    ? selectedButton.dataset.role
                    : "student";


            // =================================================
            // GET EMAIL AND PASSWORD
            // =================================================

            const email =
                emailInput.value.trim();

            const password =
                passwordInput.value;


            console.log(
                "Selected role:",
                selectedRole
            );

            console.log(
                "Email:",
                email
            );


            // =================================================
            // VALIDATE EMAIL
            // =================================================

            if (!email) {

                showError(
                    "Please enter your email address."
                );

                emailInput.focus();

                return;
            }


            // =================================================
            // VALIDATE PASSWORD
            // =================================================

            if (!password) {

                showError(
                    "Please enter your password."
                );

                passwordInput.focus();

                return;
            }


            // =================================================
            // CLEAR OLD ERROR
            // =================================================

            if (loginError) {

                loginError.textContent = "";

                loginError.classList.add(
                    "hidden"
                );

            }


            // =================================================
            // DISABLE LOGIN BUTTON
            // =================================================

            if (submitButton) {

                submitButton.disabled = true;

                submitButton.textContent =
                    "Signing in...";

            }


            try {

                // =================================================
                // SELECT CORRECT LOGIN API
                // =================================================

                let loginURL;


                if (
                    selectedRole ===
                    "admin"
                ) {

                    loginURL =
                        ADMIN_LOGIN_URL;

                } else {

                    loginURL =
                        STUDENT_LOGIN_URL;

                }


                console.log(
                    "Sending request to:",
                    loginURL
                );


                // =================================================
                // SEND LOGIN REQUEST
                // =================================================

                const response =
                    await fetch(
                        loginURL,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Accept":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    email:
                                        email,

                                    password:
                                        password
                                })
                        }
                    );


                // =================================================
                // HTTP STATUS
                // =================================================

                console.log(
                    "HTTP STATUS:",
                    response.status
                );


                // =================================================
                // READ SERVER RESPONSE
                // =================================================

                let result = {};

                try {

                    result =
                        await response.json();

                } catch (jsonError) {

                    console.error(
                        "Could not read JSON response:",
                        jsonError
                    );

                }


                console.log(
                    "BACKEND RESPONSE:",
                    result
                );


                // =================================================
                // HANDLE HTTP ERRORS
                // =================================================

                if (!response.ok) {

                    throw new Error(
                        result.message ||
                        `Login failed. Server returned ${response.status}.`
                    );

                }


                // =================================================
                // HANDLE success:false
                // =================================================

                if (
                    result.success ===
                    false
                ) {

                    throw new Error(
                        result.message ||
                        "Invalid email or password."
                    );

                }


                // =================================================
                // CHECK AUTHENTICATION TOKEN
                // =================================================

                if (!result.token) {

                    console.error(
                        "Server response does not contain token:",
                        result
                    );


                    throw new Error(
                        "Login response did not contain an authentication token."
                    );

                }


                // =================================================
                // SAVE JWT TOKEN
                // =================================================

                localStorage.setItem(
                    "auth_token",
                    result.token
                );


                // =================================================
                // SAVE USER INFORMATION
                // =================================================

                if (result.user) {

                    localStorage.setItem(
                        "auth_user",
                        JSON.stringify(
                            result.user
                        )
                    );

                }


                console.log(
                    "LOGIN SUCCESSFUL"
                );


                console.log(
                    "Logged-in user:",
                    result.user
                );


                // =================================================
                // REDIRECT USER
                // =================================================

                if (
                    selectedRole ===
                    "admin"
                ) {

                    window.location.href =
                        "/admin-dashboard.html";

                } else {

                    window.location.href =
                        "/student-dashboard.html";

                }

            } catch (error) {

                // =================================================
                // LOGIN ERROR
                // =================================================

                console.error(
                    "LOGIN ERROR:",
                    error
                );


                // =================================================
                // FETCH / CONNECTION ERROR
                // =================================================

                if (
                    error instanceof TypeError
                ) {

                    showError(
                        "Cannot connect to the Express backend. Please make sure the backend is running on port 5000."
                    );

                } else {

                    showError(
                        error.message ||
                        "Login failed. Please try again."
                    );

                }

            } finally {

                // =================================================
                // ENABLE BUTTON AGAIN
                // =================================================

                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        "Login";

                }

            }

        }
    );


    // =====================================================
    // SHOW ERROR MESSAGE
    // =====================================================

    function showError(message) {

        console.error(
            "LOGIN MESSAGE:",
            message
        );


        if (loginError) {

            loginError.textContent =
                message;

            loginError.classList.remove(
                "hidden"
            );

        } else {

            alert(message);

        }

    }

});