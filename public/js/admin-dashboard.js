"use strict";

document.addEventListener("DOMContentLoaded", () => {
    if (window.App && typeof App.onReady === "function") {
        App.onReady(initDashboard);
    } else {
        setTimeout(initDashboard, 300);
    }
});

async function initDashboard() {
    let rawData = [];

    // 1. Fetch data from backend API
    try {
        const response = await window.AppApi.request("/api/admin/students");
        // Handle different response structures (array or wrapped object)
        if (Array.isArray(response)) {
            rawData = response;
        } else if (response && Array.isArray(response.data)) {
            rawData = response.data;
        } else if (response && Array.isArray(response.students)) {
            rawData = response.students;
        }
    } catch (e) {
        console.warn("API fetch failed, checking local storage...");
    }

    // 2. Fallback to LocalStorage if API returned empty
    if (!Array.isArray(rawData) || rawData.length === 0) {
        const stored = localStorage.getItem("studentsList") || localStorage.getItem("students");
        if (stored) {
            try {
                rawData = JSON.parse(stored);
            } catch (err) {}
        }
    }

    // 3. Normalize student fields to guarantee calculation works
    const students = (rawData || []).map((s, idx) => {
        const name = s.name || s.fullName || "Unknown Student";
        const email = s.email || "";
        const studentCode = s.studentCode || s.id || `STU-000${idx + 1}`;
        const department = s.department || s.course || "Not specified";
        
        // Extract performance percentage safely
        let perfPct = 0;
        if (typeof s.performance === "object" && s.performance !== null) {
            perfPct = Number(s.performance.percentage || s.performance.obtainedMarks || 0);
        } else {
            perfPct = Number(s.perfPct || s.performance || 0);
        }

        // Extract attendance percentage safely
        let attendancePct = 0;
        if (typeof s.attendance === "object" && s.attendance !== null) {
            attendancePct = Number(s.attendance.percentage || s.attendance.present || 0);
        } else {
            attendancePct = Number(s.attendancePct || s.attendance || 0);
        }

        return {
            studentCode,
            name,
            email,
            department,
            perfPct,
            attendancePct
        };
    });

    if (students.length === 0) return;

    // =====================================================
    // UPDATE TOP STAT CARDS (NUMBERS)
    // =====================================================
    const totalEl = document.getElementById("dashTotalStudents");
    const attEl = document.getElementById("dashAvgAttendance");
    const perfEl = document.getElementById("dashAvgPerformance");

    if (totalEl) {
        totalEl.textContent = students.length;
    }

    const totalAttendanceSum = students.reduce((acc, curr) => acc + curr.attendancePct, 0);
    const avgAttendance = Math.round(totalAttendanceSum / students.length);
    if (attEl) {
        attEl.textContent = `${avgAttendance}%`;
    }

    const totalPerformanceSum = students.reduce((acc, curr) => acc + curr.perfPct, 0);
    const avgPerformance = Math.round(totalPerformanceSum / students.length);
    if (perfEl) {
        perfEl.textContent = `${avgPerformance}%`;
    }

    // =====================================================
    // RENDER RECENT STUDENTS TABLE
    // =====================================================
    const tbody = document.getElementById("recentStudentsTableBody");
    if (!tbody) return;

    tbody.innerHTML = students.slice(0, 5).map(s => {
        let badgeClass = "badge-danger";
        let badgeText = `${s.perfPct}% Needs Improvement`;

        if (s.perfPct >= 70) {
            badgeClass = "badge-success";
            badgeText = `${s.perfPct}% Good`;
        } else if (s.perfPct >= 40) {
            badgeClass = "badge-warning";
            badgeText = `${s.perfPct}% Average`;
        }

        return `
            <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 16px;">
                    <strong style="color: #1e293b; display: block;">${escapeHtml(s.name)}</strong>
                    <small style="color: #94a3b8;">${escapeHtml(s.email)}</small>
                </td>
                <td style="padding: 16px; color: #64748b; font-weight: 500;">${escapeHtml(s.studentCode)}</td>
                <td style="padding: 16px; color: #64748b;">${escapeHtml(s.department)}</td>
                <td style="padding: 16px;">
                    <span class="badge ${badgeClass}">${badgeText}</span>
                </td>
                <td style="padding: 16px; font-weight: 700; color: #1e293b;">${s.attendancePct}%</td>
            </tr>
        `;
    }).join("");
}

function escapeHtml(str) {
    return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}