
// =====================================================
// REGISTER.JS
// Student Performance & Career Guidance System
// =====================================================

const API_URL = "http://localhost:5000/api";

console.log("✅ register.js loaded");


document.addEventListener("DOMContentLoaded", () => {

    console.log("✅ Register page loaded");


    const form = document.getElementById("register-form");

    const passwordInput =
        document.getElementById("register-password");

    const togglePassword =
        document.getElementById("toggle-register-password");

    const errorBox =
        document.getElementById("register-error");

    const successBox =
        document.getElementById("register-success");

    const submitButton =
        document.querySelector(".register-submit");


    // =====================================================
    // CHECK FORM
    // =====================================================

    if (!form) {

        console.error(
            "❌ register-form NOT FOUND"
        );

        return;

    }

    console.log(
        "✅ register-form found"
    );


    // =====================================================
    // PASSWORD TOGGLE
    // =====================================================

    if (togglePassword && passwordInput) {

        togglePassword.addEventListener(
            "click",
            () => {

                if (
                    passwordInput.type === "password"
                ) {

                    passwordInput.type = "text";

                    togglePassword.textContent = "●";

                } else {

                    passwordInput.type = "password";

                    togglePassword.textContent = "◌";

                }

            }
        );

    }


    // =====================================================
    // REGISTER FORM SUBMIT
    // =====================================================

    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            console.log(
                "================================="
            );

            console.log(
                "🚀 REGISTER BUTTON CLICKED"
            );


            // =================================================
            // CLEAR MESSAGES
            // =================================================

            if (errorBox) {

                errorBox.textContent = "";

                errorBox.classList.add("hidden");

            }


            if (successBox) {

                successBox.textContent = "";

                successBox.classList.add("hidden");

            }


            // =================================================
            // GET FORM VALUES
            // =================================================

            const name =
                document
                    .getElementById("register-name")
                    .value
                    .trim();

            const email =
                document
                    .getElementById("register-email")
                    .value
                    .trim();

            const password =
                document
                    .getElementById("register-password")
                    .value;

            const phone =
                document
                    .getElementById("register-phone")
                    .value
                    .trim();

            const course =
                document
                    .getElementById("register-course")
                    .value
                    .trim();

            const semester =
                document
                    .getElementById("register-semester")
                    .value;


            console.log("Name:", name);
            console.log("Email:", email);
            console.log("Phone:", phone);
            console.log("Course:", course);
            console.log("Semester:", semester);


            // =================================================
            // VALIDATION
            // =================================================

            if (
                !name ||
                !email ||
                !password ||
                !phone ||
                !course ||
                !semester
            ) {

                showError(
                    "Please fill in all fields."
                );

                return;

            }


            if (password.length < 6) {

                showError(
                    "Password must contain at least 6 characters."
                );

                return;

            }


            if (!/^[0-9]{10}$/.test(phone)) {

                showError(
                    "Please enter a valid 10-digit phone number."
                );

                return;

            }


            // =================================================
            // DISABLE BUTTON
            // =================================================

            if (submitButton) {

                submitButton.disabled = true;

                submitButton.textContent =
                    "Creating Account...";

            }


            // =================================================
            // SEND REQUEST
            // =================================================

            try {

                console.log(
                    "📡 Sending registration request..."
                );

                console.log(
                    "API:",
                    `${API_URL}/auth/register`
                );


                const response =
                    await fetch(
                        `${API_URL}/auth/register`,
                        {

                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                name: name,

                                email: email,

                                password: password,

                                phone: phone,

                                course: course,

                                semester:
                                    Number(semester)

                            })

                        }
                    );


                console.log(
                    "HTTP STATUS:",
                    response.status
                );


                const data =
                    await response.json();


                console.log(
                    "BACKEND RESPONSE:",
                    data
                );


                // =================================================
                // REGISTRATION FAILED
                // =================================================

                if (
                    !response.ok ||
                    !data.success
                ) {

                    showError(
                        data.message ||
                        "Registration failed."
                    );

                    resetButton();

                    return;

                }


                // =================================================
                // REGISTRATION SUCCESS
                // =================================================

                console.log(
                    "✅ REGISTRATION SUCCESSFUL"
                );


                // Save token

                if (data.token) {

                    localStorage.setItem(
                        "token",
                        data.token
                    );

                    console.log(
                        "✅ Token saved"
                    );

                }


                // Save user

                if (data.user) {

                    localStorage.setItem(
                        "user",
                        JSON.stringify(
                            data.user
                        )
                    );

                    console.log(
                        "✅ User saved"
                    );

                }


                showSuccess(
                    "Account created successfully!"
                );


                // =================================================
                // REDIRECT
                // =================================================

                setTimeout(
                    () => {

                        window.location.href =
                            "/student-dashboard.html";

                    },
                    1000
                );


            } catch (error) {

                console.error(
                    "❌ REGISTRATION ERROR:",
                    error
                );


                showError(
                    "Cannot connect to the backend. Make sure the Express server is running on port 5000."
                );


                resetButton();

            }

        }
    );


    // =====================================================
    // ERROR MESSAGE
    // =====================================================

    function showError(message) {

        if (!errorBox) {

            alert(message);

            return;

        }


        errorBox.textContent =
            message;

        errorBox.classList.remove(
            "hidden"
        );

    }


    // =====================================================
    // SUCCESS MESSAGE
    // =====================================================

    function showSuccess(message) {

        if (!successBox) {

            alert(message);

            return;

        }


        successBox.textContent =
            message;

        successBox.classList.remove(
            "hidden"
        );

    }


    // =====================================================
    // RESET BUTTON
    // =====================================================

    function resetButton() {

        if (!submitButton) {
            return;
        }

        submitButton.disabled = false;

        submitButton.textContent =
            "Create Account";

    }

});

