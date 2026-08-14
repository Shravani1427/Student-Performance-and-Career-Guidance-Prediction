"use strict";

/*
=====================================================
REPORTS & ANALYTICS CLIENT MODULE
=====================================================
*/

const apiReports = window.AppApi;

function escReport(value) {
    if (apiReports && typeof apiReports.escape === "function") {
        return apiReports.escape(value);
    }
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function calculateClassMetrics(students) {
    if (!Array.isArray(students) || students.length === 0) {
        return {
            totalStudents: 0,
            avgScore: 0,
            avgAttendance: 0,
            passCount: 0,
            failCount: 0
        };
    }

    let totalScoreSum = 0;
    let totalAttendanceSum = 0;
    let passCount = 0;
    let failCount = 0;

    students.forEach((s) => {
        const perf = s.performance || {};
        const att = s.attendance || {};

        const pct = Number(perf.percentage || 0);
        totalScoreSum += pct;

        const attPct = Number(att.percentage || 0);
        totalAttendanceSum += attPct;

        if (pct >= 40) passCount++;
        else failCount++;
    });

    return {
        totalStudents: students.length,
        avgScore: Math.round((totalScoreSum / students.length) * 10) / 10,
        avgAttendance: Math.round((totalAttendanceSum / students.length) * 10) / 10,
        passCount,
        failCount
    };
}

function renderReportsPage() {
    if (window.App) window.App.renderPage = renderReportsPage;

    const pageContent = document.getElementById("page-content");
    if (!pageContent) return;

    const students = (window.App && window.App.data && Array.isArray(window.App.data.students)) 
        ? window.App.data.students 
        : [];

    const metrics = calculateClassMetrics(students);

    pageContent.innerHTML = `
        <div class="page-title" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px;">
            <div>
                <span class="eyebrow">Export Center</span>
                <h1>Reports & Institutional Analytics</h1>
                <p>Generate, view, and export university analytics and performance metrics.</p>
            </div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <a href="/api/reports/excel" class="button pink" download style="text-decoration:none; display:inline-flex; align-items:center; gap:6px;">
                    ⬇ Complete Excel
                </a>
                <a href="/api/reports/pdf" target="_blank" class="button" style="text-decoration:none; display:inline-flex; align-items:center; gap:6px; background:#4f46e5; color:#fff;">
                    ⎙ Complete PDF
                </a>
            </div>
        </div>

        <!-- STATS OVERVIEW CARDS -->
        <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
            <div class="panel" style="padding: 20px;">
                <span style="color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Total Enrollment</span>
                <h2 style="font-size: 28px; margin: 8px 0 0; color: #0f172a;">${metrics.totalStudents}</h2>
            </div>
            <div class="panel" style="padding: 20px;">
                <span style="color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Class Avg Score</span>
                <h2 style="font-size: 28px; margin: 8px 0 0; color: #ec4899;">${metrics.avgScore}%</h2>
            </div>
            <div class="panel" style="padding: 20px;">
                <span style="color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Avg Attendance</span>
                <h2 style="font-size: 28px; margin: 8px 0 0; color: #3b82f6;">${metrics.avgAttendance}%</h2>
            </div>
            <div class="panel" style="padding: 20px;">
                <span style="color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Passing Rate</span>
                <h2 style="font-size: 28px; margin: 8px 0 0; color: #10b981;">
                    ${metrics.totalStudents > 0 ? Math.round((metrics.passCount / metrics.totalStudents) * 100) : 0}%
                </h2>
            </div>
        </div>

        <!-- EXPORT ACTIONS PANEL -->
        <section class="panel" style="margin-bottom: 24px; padding: 24px;">
            <div class="panel-head" style="margin-bottom: 16px;">
                <div>
                    <h2>Specific Data Exports</h2>
                    <p>Download targeted datasets based on system modules.</p>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
                
                <!-- Students Export Box -->
                <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; background: #fafafa;">
                    <h3 style="margin: 0 0 6px; font-size: 16px;">Student Directory</h3>
                    <p style="margin: 0 0 14px; font-size: 13px; color: #64748b;">Profiles, email, and department data.</p>
                    <div style="display: flex; gap: 8px;">
                        <a href="/api/reports/students/excel" class="button small" style="background:#fff; border:1px solid #cbd5e1; text-decoration:none;">CSV / Excel</a>
                        <a href="/api/reports/students/pdf" target="_blank" class="button small" style="background:#fff; border:1px solid #cbd5e1; text-decoration:none;">PDF</a>
                    </div>
                </div>

                <!-- Attendance Export Box -->
                <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; background: #fafafa;">
                    <h3 style="margin: 0 0 6px; font-size: 16px;">Attendance Summary</h3>
                    <p style="margin: 0 0 14px; font-size: 13px; color: #64748b;">Present, absent, and leave counts.</p>
                    <div style="display: flex; gap: 8px;">
                        <a href="/api/reports/attendance/excel" class="button small" style="background:#fff; border:1px solid #cbd5e1; text-decoration:none;">CSV / Excel</a>
                        <a href="/api/reports/attendance/pdf" target="_blank" class="button small" style="background:#fff; border:1px solid #cbd5e1; text-decoration:none;">PDF</a>
                    </div>
                </div>

                <!-- Performance Export Box -->
                <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; background: #fafafa;">
                    <h3 style="margin: 0 0 6px; font-size: 16px;">Academic Performance</h3>
                    <p style="margin: 0 0 14px; font-size: 13px; color: #64748b;">Exam marks, grades, and records.</p>
                    <div style="display: flex; gap: 8px;">
                        <a href="/api/reports/performance/excel" class="button small" style="background:#fff; border:1px solid #cbd5e1; text-decoration:none;">CSV / Excel</a>
                        <a href="/api/reports/performance/pdf" target="_blank" class="button small" style="background:#fff; border:1px solid #cbd5e1; text-decoration:none;">PDF</a>
                    </div>
                </div>

            </div>
        </section>

        <!-- STUDENT PERFORMANCE OVERVIEW TABLE -->
        <section class="panel recent">
            <div class="panel-head">
                <div>
                    <h2>Student Performance Directory</h2>
                    <p>Live summary of all enrolled student metrics.</p>
                </div>
                <span class="pill good">${students.length} Total</span>
            </div>
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Department</th>
                            <th>Average Score</th>
                            <th>Attendance</th>
                            <th>Grade</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${
                            students.length === 0
                                ? `<tr><td colspan="7" style="text-align:center; padding:30px; color:#64748b;">No student records found in database.</td></tr>`
                                : students.map((s) => {
                                    const pct = Number(s.performance?.percentage || 0);
                                    const att = Number(s.attendance?.percentage || 0);
                                    const grade = s.performance?.grade || "N/A";
                                    const passed = pct >= 40;

                                    return `
                                        <tr>
                                            <td><strong>${escReport(s.studentCode || ("STU-" + s.id))}</strong></td>
                                            <td>${escReport(s.name)}</td>
                                            <td>${escReport(s.department || s.course || "General")}</td>
                                            <td><strong>${pct}%</strong></td>
                                            <td>${att}%</td>
                                            <td><span class="rc-grade">${escReport(grade)}</span></td>
                                            <td><span class="pill ${passed ? "good" : "focus"}">${passed ? "Pass" : "At Risk"}</span></td>
                                        </tr>
                                    `;
                                }).join("")
                        }
                    </tbody>
                </table>
            </div>
        </section>
    `;
}

// Attach listener to initialize once layout.js resolves app data
if (window.App && typeof window.App.onReady === "function") {
    window.App.onReady(function () {
        renderReportsPage();
    });
} else {
    document.addEventListener("DOMContentLoaded", renderReportsPage);
}