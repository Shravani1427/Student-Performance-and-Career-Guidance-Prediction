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
    if (window.AppApi && typeof window.AppApi.escape === "function") {
        return window.AppApi.escape(String(value ?? ""));
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
    return Number.isFinite(number) ? number : fallback;
}

/* =====================================================
   STUDENT TABLE ROW RENDERER
   ===================================================== */

function studentRows(students) {
    if (!Array.isArray(students) || students.length === 0) {
        return `
            <div class="empty-state" style="text-align: center; padding: 40px 20px; color: #64748b;">
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
                        <th>Semester</th>
                        <th>Performance</th>
                        <th>Attendance</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${students
                        .map((student) => {
                            const name = student.name || "Unknown Student";
                            const email = student.email || "";
                            const studentCode =
                                student.studentCode ||
                                `STU-${String(student.id || 0).padStart(4, "0")}`;
                            const department =
                                student.department ||
                                student.course ||
                                "Information Technology";
                            const semester = student.semester || 1;

                            const performance = student.performance || {
                                percentage: 0,
                                level: "New Student",
                                grade: "N/A"
                            };

                            const attendance = student.attendance || {
                                percentage: 0
                            };

                            return `
                                <tr>
                                    <td>
                                        <div class="student-cell" style="display: flex; align-items: center; gap: 12px;">
                                            <div class="avatar" style="width: 36px; height: 36px; border-radius: 50%; background: #eff6ff; color: #2563eb; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                                                ${eStudents(name.charAt(0).toUpperCase())}
                                            </div>
                                            <div>
                                                <strong>${eStudents(name)}</strong>
                                                <br>
                                                <small style="color: #64748b;">${eStudents(email)}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="badge badge-code">${eStudents(studentCode)}</span>
                                    </td>
                                    <td>${eStudents(department)}</td>
                                    <td>Semester ${eStudents(semester)}</td>
                                    <td>
                                        <strong>${safeNumber(performance.percentage)}%</strong>
                                        <br>
                                        <small style="color: #64748b;">${eStudents(performance.level || "N/A")}</small>
                                    </td>
                                    <td>
                                        <strong>${safeNumber(attendance.percentage)}%</strong>
                                    </td>
                                    <td>
                                        <div style="display: flex; gap: 6px;">
                                            <button
                                                class="button small"
                                                data-view-student="${eStudents(student.id)}"
                                                type="button"
                                            >
                                                View
                                            </button>
                                            <button
                                                class="button small danger"
                                                data-delete-student="${eStudents(student.id)}"
                                                type="button"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        })
                        .join("")}
                </tbody>
            </table>
        </div>
    `;
}

/* =====================================================
   RENDER STUDENTS PAGE
   ===================================================== */

function renderStudentsPage() {
    if (window.App) {
        window.App.renderPage = renderStudentsPage;
    }

    const students =
        window.App && Array.isArray(window.App.data?.students)
            ? window.App.data.students
            : [];

    const departments = [
        "All departments",
        ...new Set(
            students
                .map((s) => s.department || s.course)
                .filter(Boolean)
        )
    ];

    const contentEl = document.getElementById("page-content");
    if (!contentEl) return;

    contentEl.innerHTML = `
        <div class="page-title" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <div>
                <span class="eyebrow" style="color: #ff2f86; font-size: 11px; font-weight: 800; letter-spacing: 1px;">
                    ADMINISTRATION
                </span>
                <h1 style="margin: 4px 0 6px; font-size: 26px; color: #172554;">Student Management</h1>
                <p style="margin: 0; color: #64748b; font-size: 14px;">
                    Manage registered student profiles, access, departments and semester records.
                </p>
            </div>
            <button class="button pink" data-action="open-add-student" type="button">
                + Add Student
            </button>
        </div>

        <div id="students-message"></div>

        <section class="panel filter-panel" style="margin-bottom: 20px;">
            <div style="display: flex; gap: 14px; align-items: center; flex-wrap: wrap;">
                <div class="search" style="flex: 1; min-width: 240px; position: relative;">
                    <input
                        id="student-search"
                        placeholder="Search by name, email or student ID…"
                        style="width: 100%; height: 40px; padding: 0 12px; border-radius: 8px; border: 1px solid #cbd5e1;"
                    >
                </div>
                <select id="department-filter" style="height: 40px; border-radius: 8px; border: 1px solid #cbd5e1; padding: 0 12px;">
                    ${departments
                        .map(
                            (dept) => `
                            <option value="${eStudents(dept)}">
                                ${eStudents(dept)}
                            </option>
                        `
                        )
                        .join("")}
                </select>
                <span id="student-count" class="count" style="font-weight: bold; color: #475569;">
                    ${students.length} student${students.length === 1 ? "" : "s"}
                </span>
            </div>
        </section>

        <section class="panel">
            <div class="panel-head" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div>
                    <h2 style="margin: 0; font-size: 18px; color: #172554;">All Students</h2>
                    <p style="margin: 4px 0 0; color: #64748b; font-size: 12px;">Complete student directory</p>
                </div>
                <span class="pill good" style="background: #dcfce7; color: #15803d; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;">
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
    document.getElementById("student-modal")?.remove();

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "student-modal";

    modal.innerHTML = `
        <div class="modal-card">
            <button class="close-modal" data-action="close-modal" type="button">×</button>
            <span class="eyebrow">New record</span>
            <h2>Add student</h2>
            <p>Create login credentials and student profile.</p>

            <form id="add-student-form" class="form-grid">
                <label>
                    <span>Full name</span>
                    <input name="fullName" placeholder="e.g. John Doe" required>
                </label>

                <label>
                    <span>Email</span>
                    <input name="email" type="email" placeholder="e.g. john@college.edu" required>
                </label>

                <label>
                    <span>Mobile Phone</span>
                    <input name="mobile" type="tel" placeholder="e.g. 9876543210">
                </label>

                <label>
                    <span>Password</span>
                    <input name="password" type="password" value="student123" required>
                </label>

                <label>
                    <span>Department</span>
                    <select name="department" required>
                        <option value="Information Technology">Information Technology</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Data Science">Data Science</option>
                        <option value="Artificial Intelligence">Artificial Intelligence</option>
                    </select>
                </label>

                <label>
                    <span>Semester</span>
                    <input name="semester" type="number" min="1" max="8" value="1" required>
                </label>

                <button class="button pink form-submit" type="submit" style="margin-top: 10px;">
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
    const search = (
        document.getElementById("student-search")?.value || ""
    ).toLowerCase().trim();

    const department =
        document.getElementById("department-filter")?.value || "All departments";

    const students =
        window.App && Array.isArray(window.App.data?.students)
            ? window.App.data.students
            : [];

    const filtered = students.filter((student) => {
        const name = String(student.name || "").toLowerCase();
        const email = String(student.email || "").toLowerCase();
        const studentCode = String(
            student.studentCode || `STU-${student.id}` || ""
        ).toLowerCase();
        const dept = String(student.department || student.course || "");

        const matchesSearch =
            !search ||
            name.includes(search) ||
            email.includes(search) ||
            studentCode.includes(search);

        const matchesDepartment =
            department === "All departments" || dept === department;

        return matchesSearch && matchesDepartment;
    });

    const table = document.getElementById("student-table");
    const count = document.getElementById("student-count");

    if (table) {
        table.innerHTML = studentRows(filtered);
    }

    if (count) {
        count.textContent = `${filtered.length} student${filtered.length === 1 ? "" : "s"}`;
    }
}

/* =====================================================
   CREATE STUDENT (API POST CALL)
   ===================================================== */

async function createStudent(form) {
    const formData = new FormData(form);

    const name = String(formData.get("fullName") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const phone = String(formData.get("mobile") || "").trim();
    const department = String(formData.get("department") || "Information Technology").trim();
    const semester = Number(formData.get("semester") || 1);

    if (!name) {
        if (apiStudents?.toast) apiStudents.toast("Full name is required.", true);
        return;
    }

    if (!email) {
        if (apiStudents?.toast) apiStudents.toast("Email is required.", true);
        return;
    }

    if (!password) {
        if (apiStudents?.toast) apiStudents.toast("Password is required.", true);
        return;
    }

    const payload = {
        name,
        email,
        password,
        phone: phone || null,
        department,
        course: department,
        semester,
        role: "student"
    };

    if (apiStudents && typeof apiStudents.request === "function") {
        await apiStudents.request("/api/students", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
    } else {
        const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
        const res = await fetch("/api/students", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to create student.");
        }
    }

    document.getElementById("student-modal")?.remove();

    if (window.App && typeof window.App.reload === "function") {
        await window.App.reload("Student added successfully.");
    } else {
        window.location.reload();
    }
}

/* =====================================================
   PAGE EVENT LISTENERS
   ===================================================== */

if (window.App && typeof window.App.onReady === "function") {
    window.App.onReady(() => {
        initStudentsModule();
    });
} else {
    document.addEventListener("DOMContentLoaded", initStudentsModule);
}

function initStudentsModule() {
    renderStudentsPage();

    const pageContent = document.getElementById("page-content");
    if (!pageContent) return;

    // Search input
    pageContent.addEventListener("input", (event) => {
        if (event.target.id === "student-search") {
            filterStudents();
        }
    });

    // Department filter
    pageContent.addEventListener("change", (event) => {
        if (event.target.id === "department-filter") {
            filterStudents();
        }
    });

    // Global page click actions
    pageContent.addEventListener("click", async (event) => {
        const action = event.target.closest("[data-action]")?.dataset.action;

        if (action === "open-add-student") {
            addStudentModal();
            return;
        }

        if (action === "close-modal") {
            document.getElementById("student-modal")?.remove();
            return;
        }

        // View single student performance
        const viewButton = event.target.closest("[data-view-student]");
        if (viewButton) {
            const studentId = Number(viewButton.dataset.viewStudent);
            if (studentId) {
                if (window.App) {
                    window.App.selectedStudentId = studentId;
                }
                window.location.href = `/performance.html?studentId=${studentId}`;
                return;
            }
        }

        // Delete student
        const deleteButton = event.target.closest("[data-delete-student]");
        if (deleteButton) {
            const studentId = Number(deleteButton.dataset.deleteStudent);
            if (!studentId) return;

            const students = window.App?.data?.students || [];
            const student = students.find((item) => Number(item.id) === studentId);
            const studentName = student ? student.name : "this student";

            if (window.confirm(`Are you sure you want to delete ${studentName}?`)) {
                try {
                    if (apiStudents && typeof apiStudents.request === "function") {
                        await apiStudents.request(`/api/students/${studentId}`, {
                            method: "DELETE"
                        });
                    } else {
                        const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
                        await fetch(`/api/students/${studentId}`, {
                            method: "DELETE",
                            headers: {
                                ...(token ? { Authorization: `Bearer ${token}` } : {})
                            }
                        });
                    }

                    if (window.App && typeof window.App.reload === "function") {
                        await window.App.reload("Student deleted successfully.");
                    } else {
                        window.location.reload();
                    }
                } catch (error) {
                    console.error("Delete student error:", error);
                    if (apiStudents?.toast) {
                        apiStudents.toast(error.message || "Unable to delete student.", true);
                    }
                }
            }
        }
    });

    // Form submit listener on modal
    document.body.addEventListener("submit", async (event) => {
        if (event.target.id !== "add-student-form") return;

        event.preventDefault();

        const submitButton = event.target.querySelector(".form-submit");

        try {
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = "Saving...";
            }

            await createStudent(event.target);
        } catch (error) {
            console.error("❌ Add student error:", error);

            if (apiStudents?.toast) {
                apiStudents.toast(error.message || "Unable to add student.", true);
            } else {
                alert(error.message || "Unable to add student.");
            }

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Save student";
            }
        }
    });
}