"use strict";

/* =====================================================
   STUDENT MANAGEMENT
   Student Performance & Career Guidance System
   ===================================================== */

const apiStudents = window.AppApi;


/* =====================================================
   ESCAPE HTML
   ===================================================== */

const eStudents = (value) => {

    if (
        window.AppApi &&
        typeof window.AppApi.escape === "function"
    ) {
        return window.AppApi.escape(
            String(value ?? "")
        );
    }

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};


/* =====================================================
   SAFE NUMBER
   ===================================================== */

function safeNumber(value, fallback = 0) {

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}


/* =====================================================
   STUDENT TABLE
   ===================================================== */

function studentRows(students) {

    if (
        !Array.isArray(students) ||
        students.length === 0
    ) {

        return `
            <div class="empty-state">
                <p>No students found.</p>
            </div>
        `;

    }


    return `

        <div class="table-wrap">

            <table>

                <thead>

                    <tr>
                        <th>Student</th>
                        <th>Student ID</th>
                        <th>Department</th>
                        <th>Performance</th>
                        <th>Attendance</th>
                        <th>Actions</th>
                    </tr>

                </thead>

                <tbody>

                    ${students.map((student) => {

                        const name =
                            student.name ||
                            "Unknown Student";

                        const email =
                            student.email ||
                            "";

                        const studentCode =
                            student.studentCode ||
                            student.id ||
                            "N/A";

                        const department =
                            student.department ||
                            "Information Technology";

                        const performance =
                            student.performance || {
                                percentage: 0,
                                level: "N/A"
                            };

                        const attendance =
                            student.attendance || {
                                percentage: 0
                            };


                        return `

                            <tr>

                                <td>

                                    <div class="student-cell">

                                        <div class="avatar">
                                            ${eStudents(
                                                name
                                                    .charAt(0)
                                                    .toUpperCase()
                                            )}
                                        </div>

                                        <div>

                                            <strong>
                                                ${eStudents(name)}
                                            </strong>

                                            <small>
                                                ${eStudents(email)}
                                            </small>

                                        </div>

                                    </div>

                                </td>


                                <td>
                                    ${eStudents(studentCode)}
                                </td>


                                <td>
                                    ${eStudents(
                                        department.replace(
                                            "Information Technology",
                                            "IT"
                                        )
                                    )}
                                </td>


                                <td>

                                    <strong>
                                        ${safeNumber(
                                            performance.percentage
                                        )}%
                                    </strong>

                                    <small>
                                        ${eStudents(
                                            performance.level ||
                                            "N/A"
                                        )}
                                    </small>

                                </td>


                                <td>
                                    ${safeNumber(
                                        attendance.percentage
                                    )}%
                                </td>


                                <td>

                                    <button
                                        class="button small"
                                        data-view-student="${eStudents(
                                            student.id
                                        )}"
                                    >
                                        View
                                    </button>

                                    <button
                                        class="button small danger"
                                        data-delete-student="${eStudents(
                                            student.id
                                        )}"
                                    >
                                        Delete
                                    </button>

                                </td>

                            </tr>

                        `;

                    }).join("")}

                </tbody>

            </table>

        </div>

    `;
}


/* =====================================================
   RENDER STUDENT PAGE
   ===================================================== */

function renderStudentsPage() {

    App.renderPage = renderStudentsPage;


    const students =
        Array.isArray(App.data.students)
            ? App.data.students
            : [];


    const departments = [
        "All departments",
        ...new Set(
            students
                .map(
                    (student) =>
                        student.department
                )
                .filter(Boolean)
        )
    ];


    document.getElementById(
        "page-content"
    ).innerHTML = `

        <div class="page-title">

            <div>

                <span class="eyebrow">
                    Administration
                </span>

                <h1>
                    Student Management
                </h1>

                <p>
                    Manage profiles, access,
                    departments and semester details.
                </p>

            </div>

            <button
                class="button pink"
                data-action="open-add-student"
            >
                + Add Student
            </button>

        </div>


        <div id="students-message"></div>


        <section class="panel filter-panel">

            <div class="search">

                ⌕

                <input
                    id="student-search"
                    placeholder="Search by name, email or student ID…"
                >

            </div>


            <select id="department-filter">

                ${departments.map(
                    (department) => `
                        <option value="${eStudents(
                            department
                        )}">
                            ${eStudents(
                                department
                            )}
                        </option>
                    `
                ).join("")}

            </select>


            <span
                id="student-count"
                class="count"
            >
                ${students.length} students
            </span>

        </section>


        <section class="panel">

            <div class="panel-head">

                <div>

                    <h2>
                        All Students
                    </h2>

                    <p>
                        Complete student directory
                    </p>

                </div>

                <span class="pill good">
                    Live database
                </span>

            </div>


            <div id="student-table">

                ${studentRows(students)}

            </div>

        </section>

    `;
}


/* =====================================================
   ADD STUDENT MODAL
   ===================================================== */

function addStudentModal() {

    document
        .getElementById("student-modal")
        ?.remove();


    const modal =
        document.createElement("div");

    modal.className = "modal";
    modal.id = "student-modal";


    modal.innerHTML = `

        <div class="modal-card">

            <button
                class="close-modal"
                data-action="close-modal"
                type="button"
            >
                ×
            </button>


            <span class="eyebrow">
                New record
            </span>


            <h2>
                Add student
            </h2>


            <p>
                Create login access and an
                academic profile.
            </p>


            <form
                id="add-student-form"
                class="form-grid"
            >


                <label>

                    <span>
                        Student ID
                    </span>

                    <input
                        name="studentCode"
                        required
                    >

                </label>


                <label>

                    <span>
                        Full name
                    </span>

                    <input
                        name="fullName"
                        required
                    >

                </label>


                <label>

                    <span>
                        Email
                    </span>

                    <input
                        name="email"
                        type="email"
                        required
                    >

                </label>


                <label>

                    <span>
                        Mobile
                    </span>

                    <input
                        name="mobile"
                        type="tel"
                    >

                </label>


                <label>

                    <span>
                        Password
                    </span>

                    <input
                        name="password"
                        type="password"
                        value="student123"
                        required
                    >

                </label>


                <label>

                    <span>
                        Department
                    </span>

                    <select name="department">

                        <option>
                            Information Technology
                        </option>

                        <option>
                            Computer Science
                        </option>

                        <option>
                            Data Science
                        </option>

                    </select>

                </label>


                <label>

                    <span>
                        Semester
                    </span>

                    <input
                        name="semester"
                        type="number"
                        min="1"
                        max="8"
                        value="5"
                        required
                    >

                </label>


                <button
                    class="button pink form-submit"
                    type="submit"
                >
                    Save student
                </button>


            </form>

        </div>

    `;


    document.body.appendChild(modal);
}


/* =====================================================
   FILTER STUDENTS
   ===================================================== */

function filterStudents() {

    const search =
        (
            document.getElementById(
                "student-search"
            )?.value || ""
        ).toLowerCase();


    const department =
        document.getElementById(
            "department-filter"
        )?.value ||
        "All departments";


    const students =
        Array.isArray(App.data.students)
            ? App.data.students
            : [];


    const filtered =
        students.filter((student) => {

            const name =
                student.name || "";

            const email =
                student.email || "";

            const studentCode =
                student.studentCode ||
                student.id ||
                "";


            const searchable =
                `${name} ${email} ${studentCode}`
                    .toLowerCase();


            const matchesSearch =
                searchable.includes(search);


            const matchesDepartment =
                department ===
                    "All departments" ||
                student.department ===
                    department;


            return (
                matchesSearch &&
                matchesDepartment
            );

        });


    const table =
        document.getElementById(
            "student-table"
        );


    const count =
        document.getElementById(
            "student-count"
        );


    if (table) {

        table.innerHTML =
            studentRows(filtered);

    }


    if (count) {

        count.textContent =
            `${filtered.length} students`;

    }

}


/* =====================================================
   CREATE STUDENT
   ===================================================== */

async function createStudent(form) {

    const formData =
        new FormData(form);

    const name =
        String(
            formData.get("fullName") || ""
        ).trim();


    const email =
        String(
            formData.get("email") || ""
        ).trim();


    const password =
        String(
            formData.get("password") || ""
        );


    const phone =
        String(
            formData.get("mobile") || ""
        ).trim();


    const studentCode =
        String(
            formData.get("studentCode") || ""
        ).trim();


    const department =
        String(
            formData.get("department") || ""
        ).trim();


    const semester =
        Number(
            formData.get("semester") || 0
        );


    if (!name) {
        apiStudents.toast("Full name is required.", true);
        return;
    }

    if (!email) {
        apiStudents.toast("Email is required.", true);
        return;
    }

    if (!password) {
        apiStudents.toast("Password is required.", true);
        return;
    }


    const payload = {
        name: name,
        email: email,
        password: password,
        phone: phone,
        studentCode: studentCode,
        department: department,
        semester: semester
    };


    await apiStudents.request(
        "/api/students",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        }
    );


    document
        .getElementById("student-modal")
        ?.remove();


    await App.reload(
        "Student added successfully."
    );

}


/* =====================================================
   PAGE EVENTS
   ===================================================== */

App.onReady(() => {

    App.renderPage =
        renderStudentsPage;


    renderStudentsPage();


    /* ===============================================
       SEARCH
       =============================================== */

    document
        .getElementById("page-content")
        .addEventListener(
            "input",
            (event) => {

                if (
                    event.target.id ===
                    "student-search"
                ) {

                    filterStudents();

                }

            }
        );


    /* ===============================================
       DEPARTMENT FILTER
       =============================================== */

    document
        .getElementById("page-content")
        .addEventListener(
            "change",
            (event) => {

                if (
                    event.target.id ===
                    "department-filter"
                ) {

                    filterStudents();

                }

            }
        );


    /* ===============================================
       BUTTON EVENTS (VIEW, DELETE, ADD)
       =============================================== */

    document
        .getElementById("page-content")
        .addEventListener(
            "click",
            async (event) => {


                /* OPEN ADD STUDENT */

                const action =
                    event.target.closest(
                        "[data-action]"
                    )?.dataset.action;


                if (
                    action ===
                    "open-add-student"
                ) {

                    addStudentModal();

                    return;

                }


                /* CLOSE MODAL */

                if (
                    action ===
                    "close-modal"
                ) {

                    document
                        .getElementById(
                            "student-modal"
                        )
                        ?.remove();

                    return;

                }


                /* VIEW STUDENT (ADDED HANDLER) */

                const viewButton =
                    event.target.closest(
                        "[data-view-student]"
                    );

                if (viewButton) {

                    const studentId =
                        Number(
                            viewButton.dataset
                                .viewStudent
                        );

                    if (studentId) {

                        console.log(
                            "🔍 Viewing student ID:",
                            studentId
                        );

                        if (window.App) {
                            window.App.selectedStudentId = studentId;
                        }

                        // Redirect to the performance page with studentId query param
                        window.location.href = `/performance.html?studentId=${studentId}`;

                        return;
                    }

                }


                /* DELETE STUDENT */

                const deleteButton =
                    event.target.closest(
                        "[data-delete-student]"
                    );


                if (deleteButton) {

                    const studentId =
                        Number(
                            deleteButton.dataset
                                .deleteStudent
                        );


                    const student =
                        App.data.students.find(
                            (item) =>
                                Number(item.id) ===
                                studentId
                        );


                    if (
                        student &&
                        window.confirm(
                            `Delete ${student.name}?`
                        )
                    ) {

                        try {

                            await apiStudents.request(
                                `/api/students/${studentId}`,
                                {
                                    method: "DELETE"
                                }
                            );


                            await App.reload(
                                "Student deleted successfully."
                            );

                        } catch (error) {

                            console.error(
                                "Delete student error:",
                                error
                            );


                            apiStudents.toast(
                                error.message ||
                                    "Unable to delete student.",
                                true
                            );

                        }

                    }

                }

            }
        );


    /* ===============================================
       ADD STUDENT FORM SUBMIT
       =============================================== */

    document.body.addEventListener(
        "submit",
        async (event) => {

            if (
                event.target.id !==
                "add-student-form"
            ) {

                return;

            }


            event.preventDefault();


            const submitButton =
                event.target.querySelector(
                    ".form-submit"
                );


            try {

                if (submitButton) {

                    submitButton.disabled =
                        true;

                    submitButton.textContent =
                        "Saving...";

                }


                await createStudent(
                    event.target
                );


            } catch (error) {

                console.error(
                    "❌ Add student error:",
                    error
                );


                apiStudents.toast(
                    error.message ||
                        "Unable to add student.",
                    true
                );


                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        "Save student";

                }

            }

        }
    );

});