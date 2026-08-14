"use strict";

/*
=====================================================
PERFORMANCE PAGE WITH LIVE STUDENT SEARCH & SUBJECT SELECT
=====================================================
*/

const apiPerformance = window.AppApi;

if (!apiPerformance) {
    console.error("AppApi is not loaded. Check api.js before performance.js.");
}

function escPerformance(value) {
    if (apiPerformance && typeof apiPerformance.escape === "function") {
        return apiPerformance.escape(value);
    }
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function gradeFor(pct) {
    pct = Number(pct) || 0;
    if (pct >= 90) return "A+";
    if (pct >= 80) return "A";
    if (pct >= 70) return "B+";
    if (pct >= 60) return "B";
    if (pct >= 40) return "C";
    return "F";
}

function passOrFail(pct) {
    return Number(pct) >= 40 ? "Pass" : "Fail";
}

/* =====================================================
   SEARCHABLE STUDENT SELECTOR COMPONENT
===================================================== */

function performanceStudentSelector(currentStudent) {
    const isAdmin = window.App && window.App.session && window.App.session.role === "admin";
    if (!isAdmin) return "";

    const students = (window.App && window.App.data && Array.isArray(window.App.data.students)) ? window.App.data.students : [];
    if (students.length === 0) return "";

    const currentId = currentStudent ? Number(currentStudent.id) : 0;

    const options = students
        .map(
            (item) =>
                `<option value="${item.id}" ${
                    Number(item.id) === currentId ? "selected" : ""
                }>${escPerformance(item.name)}</option>`
        )
        .join("");

    return `
        <div class="student-search-container" style="display: flex; gap: 10px; align-items: center; margin-left: auto;">
            <div style="position: relative;">
                <input 
                    type="text" 
                    id="student-search-input" 
                    placeholder="🔍 Search student name..." 
                    style="padding: 8px 12px; border-radius: 8px; border: 1px solid #ccc; outline: none; font-size: 14px; width: 200px;"
                >
            </div>

            <select id="performance-student-selector" style="padding: 8px 12px; border-radius: 8px; border: 1px solid #4f46e5; outline: none; font-size: 14px; font-weight: 600; background: #fff; cursor: pointer; color: #333;">
                ${options}
            </select>
        </div>
    `;
}

/* =====================================================
   SUBJECT DROPDOWN GENERATOR (FOR ADD ACADEMIC RECORD)
===================================================== */

function getSubjectDropdownOptions(student) {
    let availableSubjects = [];

    if (window.App && window.App.data && Array.isArray(window.App.data.subjects) && window.App.data.subjects.length > 0) {
        availableSubjects = window.App.data.subjects;
    } else if (student && Array.isArray(student.subjects) && student.subjects.length > 0) {
        availableSubjects = student.subjects;
    } else if (window.App && window.App.data && Array.isArray(window.App.data.students)) {
        const map = new Map();
        window.App.data.students.forEach((s) => {
            (s.subjects || []).forEach((sub) => {
                if (sub && (sub.name || sub.id)) {
                    map.set(sub.name || sub.id, sub);
                }
            });
        });
        availableSubjects = Array.from(map.values());
    }

    if (availableSubjects.length === 0) {
        return `<option value="">No subjects found</option>`;
    }

    let html = `<option value="">Select Subject</option>`;
    availableSubjects.forEach((sub) => {
        const subjectName = typeof sub === "string" ? sub : (sub.name || sub.subject_name || "Subject");
        html += `<option value="${escPerformance(subjectName)}">${escPerformance(subjectName)}</option>`;
    });

    return html;
}

function normalizePerformance(row) {
    if (!row) return null;
    const obtained = Number(row.marks_obtained ?? row.marksObtained ?? 0);
    const total = Number(row.total_marks ?? row.totalMarks ?? 100);
    const percentage = total > 0 ? Math.round((obtained / total) * 100 * 100) / 100 : 0;

    return {
        id: Number(row.id || 0),
        name: row.subject_name || row.subjectName || "Unknown Subject",
        code: row.subject_code || row.subjectCode || `SUB-${row.id || "0"}`,
        semester: Number(row.semester || 1),
        total: total,
        obtained: obtained,
        internal: Number(row.internal_marks ?? row.internalMarks ?? 0),
        practical: Number(row.practical_marks ?? row.practicalMarks ?? 0),
        assignment: Number(row.assignment_marks ?? row.assignmentMarks ?? 0),
        percentage: percentage,
        attendance: Number(row.attendance ?? 0),
        academicYear: row.academic_year || row.academicYear || ""
    };
}

function calculatePerformance(subjects) {
    if (!Array.isArray(subjects) || subjects.length === 0) {
        return { totalMarks: 0, obtainedMarks: 0, percentage: 0, average: 0, level: "No Data", grade: "F" };
    }

    const totalMarks = subjects.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const obtainedMarks = subjects.reduce((sum, item) => sum + Number(item.obtained || 0), 0);
    const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100 * 100) / 100 : 0;
    const average = subjects.length > 0 ? Math.round(obtainedMarks / subjects.length) : 0;

    let level = "Needs Improvement";
    if (percentage >= 90) level = "Excellent";
    else if (percentage >= 75) level = "Very Good";
    else if (percentage >= 60) level = "Good";
    else if (percentage >= 40) level = "Average";

    return { totalMarks, obtainedMarks, percentage, average, level, grade: gradeFor(percentage) };
}

async function loadStudent(studentId) {
    if (!studentId) return { id: 0, name: "Student" };
    try {
        const response = await apiPerformance.request(`/api/students/${studentId}`);
        return response?.data || response?.student || response || { id: studentId, name: "Student" };
    } catch (e) {
        console.warn(`Could not load student profile for ${studentId}:`, e);
        return { id: studentId, name: "Student" };
    }
}

async function loadPerformance(studentId) {
    if (!studentId) return [];
    try {
        const response = await apiPerformance.request(`/api/performance?studentId=${studentId}`);
        const rows = response?.performance || response?.data || (Array.isArray(response) ? response : []);
        return Array.isArray(rows) ? rows.map(normalizePerformance).filter(Boolean) : [];
    } catch (e) {
        console.warn(`Could not load performance records for ${studentId}:`, e);
        return [];
    }
}

function getCurrentStudentId() {
    if (window.App && window.App.selectedStudentId) {
        return Number(window.App.selectedStudentId);
    }
    if (window.App && window.App.session && window.App.session.studentId) {
        return Number(window.App.session.studentId);
    }
    if (window.App && window.App.data && Array.isArray(window.App.data.students) && window.App.data.students.length > 0) {
        return Number(window.App.data.students[0].id);
    }
    try {
        const user = JSON.parse(localStorage.getItem("auth_user") || localStorage.getItem("user") || "{}");
        return Number(user.id || user.student_id || 0);
    } catch (error) {
        return 0;
    }
}

function improvementTips(student) {
    const subjects = Array.isArray(student.subjects) ? student.subjects : [];
    const tips = [];

    const weak = subjects.filter((s) => Number(s.percentage) < 60).sort((a, b) => Number(a.percentage) - Number(b.percentage));
    const strong = subjects.filter((s) => Number(s.percentage) >= 75).sort((a, b) => Number(b.percentage) - Number(a.percentage));

    if (subjects.length === 0) {
        tips.push("No performance records are available yet. Add academic marks to receive personalized suggestions.");
        return tips;
    }

    if (weak.length === 0) {
        tips.push("All subjects are above 60%. Keep up the great work!");
    } else {
        weak.forEach((subject) => {
            tips.push(`Focus more on ${escPerformance(subject.name)} (${subject.percentage}%). Review notes and practice problems.`);
        });
    }

    if (strong.length > 0) {
        tips.push(`Strongest subject is ${escPerformance(strong[0].name)} (${strong[0].percentage}%).`);
    }

    return tips;
}

function renderReportCard(student) {
    const subjects = Array.isArray(student.subjects) ? student.subjects : [];

    if (subjects.length === 0) {
        return `
            <section class="panel recent">
                <div class="panel-head">
                    <div>
                        <h2>Semester Report Card</h2>
                        <p>No academic records available yet.</p>
                    </div>
                </div>
                <div style="padding:20px; color:#64748b;">Add performance records to generate the report card.</div>
            </section>
        `;
    }

    const totalObt = subjects.reduce((sum, s) => sum + Number(s.obtained || 0), 0);
    const totalMax = subjects.reduce((sum, s) => sum + Number(s.total || 0), 0);
    const overallPct = totalMax > 0 ? Math.round((totalObt / totalMax) * 100 * 100) / 100 : 0;
    const overallGrade = gradeFor(overallPct);
    const passed = subjects.filter((s) => Number(s.percentage) >= 40).length;
    const failed = subjects.length - passed;
    const tips = improvementTips(student);

    return `
        <section class="panel recent">
            <div class="panel-head">
                <div>
                    <h2>Semester Report Card</h2>
                    <p>Summary of academic standing.</p>
                </div>
                <span class="pill ${failed === 0 ? "good" : "focus"}">
                    ${failed === 0 ? "All Clear" : `${failed} subject(s) below passing`}
                </span>
            </div>

            <div class="report-card-grid">
                <div class="report-card-summary">
                    <div class="rc-big-grade">
                        <span>${overallGrade}</span>
                        <small>Grade</small>
                    </div>
                    <div class="rc-stats">
                        <div><b>${overallPct}%</b><small>Overall</small></div>
                        <div><b>${passed}/${subjects.length}</b><small>Passed</small></div>
                        <div><b>${totalObt}/${totalMax}</b><small>Total marks</small></div>
                    </div>
                </div>

                <div class="report-card-subjects">
                    <div class="rc-subject-header">
                        <span>Subject</span>
                        <span>Marks</span>
                        <span>%</span>
                        <span>Grade</span>
                        <span>Status</span>
                    </div>

                    ${subjects
                        .map((subject) => {
                            const pct = Number(subject.percentage || 0);
                            const grade = gradeFor(pct);
                            const status = passOrFail(pct);
                            return `
                                <div class="rc-subject-row ${status === "Fail" ? "rc-fail" : ""}">
                                    <span>${escPerformance(subject.name)}</span>
                                    <span>${subject.obtained}/${subject.total}</span>
                                    <span>${pct}%</span>
                                    <span class="rc-grade">${grade}</span>
                                    <span class="pill ${status === "Pass" ? "good" : "focus"}">${status}</span>
                                </div>
                            `;
                        })
                        .join("")}
                </div>
            </div>

            <div class="improvement-section">
                <div class="panel-head">
                    <div>
                        <h2>Improvement Tips</h2>
                        <p>Suggestions based on performance.</p>
                    </div>
                </div>
                <div class="tips-list">
                    ${tips.map((tip, i) => `<div class="tip-item"><span class="tip-number">${String(i + 1).padStart(2, "0")}</span><p>${tip}</p></div>`).join("")}
                </div>
            </div>
        </section>
    `;
}

async function renderPerformancePage() {
    if (window.App) window.App.renderPage = renderPerformancePage;
    const pageContent = document.getElementById("page-content");
    if (!pageContent) return;

    try {
        const studentId = getCurrentStudentId();
        const studentData = studentId ? await loadStudent(studentId) : { id: 0, name: "Student" };
        const subjects = studentId ? await loadPerformance(studentId) : [];

        const performance = calculatePerformance(subjects);

        const student = {
            id: Number(studentData.id || studentId),
            name: studentData.name || "Student",
            email: studentData.email || "",
            phone: studentData.phone || "",
            semester: Number(studentData.semester || subjects[0]?.semester || 1),
            subjects: Array.isArray(subjects) ? subjects : [],
            performance: performance
        };

        const sortedSubjects = student.subjects.slice().sort((a, b) => Number(b.percentage) - Number(a.percentage));
        const highest = sortedSubjects.length > 0 ? sortedSubjects[0] : null;

        const isAdmin = window.App && window.App.session && window.App.session.role === "admin";

        const adminForm = isAdmin
            ? `
                <section class="panel recent">
                    <div class="panel-head">
                        <div>
                            <h2>Add Academic Record</h2>
                            <p>Add marks and attendance for ${escPerformance(student.name)}.</p>
                        </div>
                    </div>
                    <form id="performance-form" class="form-grid">
                        <input type="hidden" name="studentId" value="${student.id}">
                        
                        <label>
                            <span>Subject name</span>
                            <select name="subjectName" required style="padding: 10px; border-radius: 8px; border: 1px solid #ccc; outline: none;">
                                ${getSubjectDropdownOptions(student)}
                            </select>
                        </label>

                        <label><span>Semester</span><input name="semester" type="number" min="1" max="8" value="${student.semester}" required></label>
                        <label><span>Total marks</span><input name="totalMarks" type="number" min="1" value="100" required></label>
                        <label><span>Marks obtained</span><input name="marksObtained" type="number" min="0" value="0" required></label>
                        <label><span>Attendance %</span><input name="attendance" type="number" min="0" max="100" value="75" required></label>
                        <label><span>Academic year</span><input name="academicYear" type="text" value="${new Date().getFullYear()}"></label>
                        <button class="button pink form-submit" type="submit">Save Marks</button>
                    </form>
                </section>
            `
            : "";

        pageContent.innerHTML = `
            <div class="page-title" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px;">
                <div>
                    <span class="eyebrow">${isAdmin ? "Academic Analytics" : "My Academics"}</span>
                    <h1>${isAdmin ? "Performance · " + escPerformance(student.name) : "My Academic Performance"}</h1>
                    <p>${isAdmin ? "Review detailed marks and performance levels for this student." : "Understand your strengths."}</p>
                </div>
                ${performanceStudentSelector(student)}
            </div>

            <section class="performance-banner">
                <div>
                    <span class="eyebrow">Overall Percentage</span>
                    <b>${performance.percentage}%</b>
                    <p>Performance level: <strong>${escPerformance(performance.level)}</strong></p>
                </div>
                <div class="donut" style="--degree:${performance.percentage * 3.6}deg">
                    <span><b>${performance.percentage}%</b><small>overall</small></span>
                </div>
                <div class="performance-mini">
                    <span>Average marks <b>${performance.average}</b></span>
                    <span>Highest subject <b>${highest ? escPerformance(highest.name) : "—"}</b></span>
                    <span>Semester <b>${student.semester}</b></span>
                </div>
            </section>

            <div class="grid-two equal">
                <section class="panel">
                    <div class="panel-head"><div><h2>Subject-wise Marks</h2><p>Strength overview.</p></div></div>
                    <div class="chart-box-wrap tall"><canvas id="marks-chart"></canvas></div>
                </section>
                <section class="panel">
                    <div class="panel-head"><div><h2>Performance Mix</h2><p>Marks distribution.</p></div></div>
                    <div class="chart-box-wrap tall"><canvas id="mix-chart"></canvas></div>
                </section>
            </div>

            <section class="panel recent">
                <div class="panel-head">
                    <div><h2>Marks Breakdown</h2><p>Academic records database.</p></div>
                    <span class="pill good">${student.subjects.length ? student.subjects.length + " Records" : "No Records"}</span>
                </div>
                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Subject</th><th>Semester</th><th>Obtained</th><th>Percentage</th><th>Grade</th><th>Attendance</th>
                                ${isAdmin ? "<th>Actions</th>" : ""}
                            </tr>
                        </thead>
                        <tbody>
                            ${
                                student.subjects.length === 0
                                    ? `<tr><td colspan="${isAdmin ? 7 : 6}" style="text-align:center;padding:30px;color:#64748b;">No performance records found for ${escPerformance(student.name)}.</td></tr>`
                                    : student.subjects.map((s) => `
                                        <tr>
                                            <td><strong>${escPerformance(s.name)}</strong></td>
                                            <td>${s.semester}</td>
                                            <td><strong>${s.obtained}/${s.total}</strong></td>
                                            <td>${s.percentage}%</td>
                                            <td><span class="rc-grade">${gradeFor(s.percentage)}</span></td>
                                            <td>${s.attendance}%</td>
                                            ${isAdmin ? `<td><button type="button" class="table-button delete-button" data-delete-performance="${s.id}">Delete</button></td>` : ""}
                                        </tr>
                                    `).join("")
                            }
                        </tbody>
                    </table>
                </div>
            </section>

            ${renderReportCard(student)}
            ${adminForm}
        `;

        if (typeof ChartTools !== "undefined") {
            try {
                ChartTools.clear();
                if (student.subjects.length > 0) {
                    ChartTools.draw("marks-chart", "bar", student.subjects.map((item) => item.name), student.subjects.map((item) => Number(item.percentage)), ["#ec4899"]);
                    ChartTools.draw("mix-chart", "doughnut", student.subjects.slice(0, 5).map((item) => item.name), student.subjects.slice(0, 5).map((item) => Number(item.obtained)), ["#2563eb", "#ec4899", "#8b5cf6", "#38bdf8", "#f97316"]);
                }
            } catch (err) {
                console.warn("Chart rendering skipped:", err);
            }
        }
    } catch (error) {
        console.error("Render performance page error:", error);
        pageContent.innerHTML = `<section class="panel"><div style="padding:20px;"><h2>Unable to load performance</h2><p>${escPerformance(error.message)}</p></div></section>`;
    }
}

function setupPerformanceEvents() {
    const pageContent = document.getElementById("page-content");
    if (!pageContent) return;

    // Live search filter
    pageContent.addEventListener("input", function (event) {
        if (event.target.id === "student-search-input") {
            const searchTerm = event.target.value.toLowerCase().trim();
            const selector = document.getElementById("performance-student-selector");

            if (selector) {
                let firstMatch = null;

                Array.from(selector.options).forEach((option) => {
                    const studentName = option.text.toLowerCase();
                    if (searchTerm !== "" && studentName.includes(searchTerm)) {
                        option.style.display = "";
                        if (!firstMatch) firstMatch = option;
                    } else if (searchTerm === "") {
                        option.style.display = "";
                    } else {
                        option.style.display = "none";
                    }
                });

                if (firstMatch && firstMatch.value !== selector.value) {
                    selector.value = firstMatch.value;
                    const chosenId = Number(firstMatch.value);
                    
                    if (window.App) {
                        window.App.selectedStudentId = chosenId;
                        if (typeof window.App.chooseStudent === "function") {
                            window.App.chooseStudent(chosenId);
                        } else {
                            renderPerformancePage();
                        }
                    }
                }
            }
        }
    });

    // Dropdown change
    pageContent.addEventListener("change", function (event) {
        if (event.target.id === "performance-student-selector") {
            const chosenId = Number(event.target.value);
            if (window.App) {
                window.App.selectedStudentId = chosenId;
                if (typeof window.App.chooseStudent === "function") {
                    window.App.chooseStudent(chosenId);
                } else {
                    renderPerformancePage();
                }
            }
        }
    });

    // Form submit
    pageContent.addEventListener("submit", async function (event) {
        if (event.target.id !== "performance-form") return;
        event.preventDefault();

        const form = event.target;
        const values = Object.fromEntries(new FormData(form).entries());

        values.studentId = Number(values.studentId);
        values.semester = Number(values.semester);
        values.totalMarks = Number(values.totalMarks);
        values.marksObtained = Number(values.marksObtained);
        values.attendance = Number(values.attendance);

        try {
            await apiPerformance.request("/api/performance", { method: "POST", body: JSON.stringify(values) });
            if (window.App && typeof window.App.reload === "function") {
                await window.App.reload("Performance record saved successfully.");
            } else {
                await renderPerformancePage();
            }
        } catch (error) {
            if (apiPerformance && typeof apiPerformance.toast === "function") {
                apiPerformance.toast(error.message, true);
            }
        }
    });

    // Delete record
    pageContent.addEventListener("click", async function (event) {
        const button = event.target.closest("[data-delete-performance]");
        if (!button) return;

        const id = button.dataset.deletePerformance;
        if (!window.confirm("Delete this performance record?")) return;

        try {
            await apiPerformance.request(`/api/performance/${id}`, { method: "DELETE" });
            if (window.App && typeof window.App.reload === "function") {
                await window.App.reload("Performance record deleted successfully.");
            } else {
                await renderPerformancePage();
            }
        } catch (error) {
            if (apiPerformance && typeof apiPerformance.toast === "function") {
                apiPerformance.toast(error.message, true);
            }
        }
    });
}

if (window.App && typeof window.App.onReady === "function") {
    window.App.onReady(function () {
        window.App.renderPage = renderPerformancePage;
        setupPerformanceEvents();
        renderPerformancePage();
    });
}