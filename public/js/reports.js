"use strict";

(function () {

    console.log("📊 REPORTS.JS LOADED");

    // =====================================================
    // CONFIGURATION
    // =====================================================

    const api = window.AppApi;
    const REPORT_API = "/api/reports";

    let currentRange = "1m";
    let customStartDate = "";
    let customEndDate = "";


    // =====================================================
    // HTML ESCAPE
    // =====================================================

    function escapeHtml(value) {
        if (api && typeof api.escape === "function") {
            return api.escape(String(value ?? ""));
        }

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    // =====================================================
    // GET PAGE CONTAINER
    // =====================================================

    function getContainer() {
        return (
            document.getElementById("page-content") ||
            document.getElementById("reports-container") ||
            document.getElementById("app-root")
        );
    }


    // =====================================================
    // DATE FORMAT
    // =====================================================

    function formatDate(date) {
        if (!date) return "";

        const d = new Date(date);

        if (Number.isNaN(d.getTime())) {
            return date;
        }

        return d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }


    // =====================================================
    // DOWNLOAD / OPEN REPORT
    // =====================================================

    function openReport(url) {
        console.log("📄 Opening report:", url);

        const token =
            localStorage.getItem("auth_token") ||
            localStorage.getItem("token");

        if (token) {
            console.log("🔐 Authentication token available");
        }

        window.open(url, "_blank");
    }


    // =====================================================
    // BUILD URL (WITH CACHE BUSTING)
    // =====================================================

    function buildUrl(endpoint, params) {
        let url = REPORT_API + endpoint;

        const query = new URLSearchParams();

        if (params) {
            Object.keys(params).forEach(function (key) {
                const value = params[key];

                if (
                    value !== undefined &&
                    value !== null &&
                    value !== ""
                ) {
                    query.append(key, value);
                }
            });
        }

        // Cache buster to ensure newly added records download immediately
        query.append("_t", Date.now().toString());

        const queryString = query.toString();

        if (queryString) {
            url += "?" + queryString;
        }

        return url;
    }


    // =====================================================
    // REPORT CARD TEMPLATE
    // =====================================================

    function reportCard(options) {
        return `
            <div class="report-card">
                <div class="report-card-icon ${escapeHtml(options.color || "")}">
                    ${escapeHtml(options.icon || "▤")}
                </div>

                <div class="report-card-content">
                    <h3>${escapeHtml(options.title)}</h3>
                    <p>${escapeHtml(options.description)}</p>

                    <div class="report-card-actions">
                        <button
                            type="button"
                            class="report-btn report-btn-pdf"
                            data-action="pdf"
                            data-endpoint="${escapeHtml(options.pdf)}"
                        >
                            <span>▣</span>
                            Download PDF
                        </button>

                        <button
                            type="button"
                            class="report-btn report-btn-excel"
                            data-action="excel"
                            data-endpoint="${escapeHtml(options.excel)}"
                        >
                            <span>▤</span>
                            Download Excel
                        </button>
                    </div>
                </div>
            </div>
        `;
    }


    // =====================================================
    // COMPLETE PAGE HTML
    // =====================================================

    function renderReportsPage() {
        const container = getContainer();

        if (!container) {
            console.error("❌ Reports container not found.");
            return;
        }

        console.log("🧾 Rendering reports page...");

        const studentCount =
            window.App?.data?.students?.length ||
            window.App?.data?.overview?.totalStudents ||
            "—";

        const subjectCount =
            window.App?.data?.subjects?.length ||
            window.App?.data?.overview?.totalSubjects ||
            "—";

        container.innerHTML = `
            <div class="reports-page">
                <!-- PAGE HEADER -->
                <div class="reports-header">
                    <div>
                        <div class="reports-eyebrow">
                            ADMINISTRATION
                        </div>
                        <h1>Reports & Analytics</h1>
                        <p>
                            Generate, download and manage live student academic and directory reports.
                        </p>
                    </div>

                    <div class="reports-header-icon">
                        ▤
                    </div>
                </div>

                <!-- FILTER SECTION -->
                <div class="reports-filter-card">
                    <div class="filter-title">
                        <div class="filter-icon">◷</div>
                        <div>
                            <h3>Report Period</h3>
                            <p>Select date filter ranges for attendance and summary exports.</p>
                        </div>
                    </div>

                    <div class="filter-controls">
                        <div class="filter-group">
                            <label for="report-range">Time Range</label>
                            <select id="report-range">
                                <option value="1m">Last 1 Month</option>
                                <option value="3m">Last 3 Months</option>
                                <option value="6m">Last 6 Months</option>
                                <option value="1y">Last 1 Year</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>

                        <div class="filter-group custom-date-group" id="custom-start-group" style="display:none;">
                            <label for="custom-start-date">Start Date</label>
                            <input type="date" id="custom-start-date">
                        </div>

                        <div class="filter-group custom-date-group" id="custom-end-group" style="display:none;">
                            <label for="custom-end-date">End Date</label>
                            <input type="date" id="custom-end-date">
                        </div>

                        <button type="button" id="apply-report-filter" class="apply-filter-btn">
                            Apply Filter
                        </button>
                    </div>
                </div>

                <!-- REPORT SUMMARY -->
                <div class="report-summary-grid">
                    <div class="summary-box">
                        <span class="summary-icon">♙</span>
                        <div>
                            <strong>Student Profiles</strong>
                            <small id="summaryStudentCount">${escapeHtml(studentCount)} Total Registered</small>
                        </div>
                    </div>

                    <div class="summary-box">
                        <span class="summary-icon">◔</span>
                        <div>
                            <strong>Attendance Tracking</strong>
                            <small>Filtered summary by period</small>
                        </div>
                    </div>

                    <div class="summary-box">
                        <span class="summary-icon">▥</span>
                        <div>
                            <strong>Academic Performance</strong>
                            <small id="summarySubjectCount">${escapeHtml(subjectCount)} Total Subjects Tracked</small>
                        </div>
                    </div>
                </div>

                <!-- REPORTS GRID -->
                <div class="reports-section">
                    <div class="section-heading">
                        <div>
                            <h2>Available Reports</h2>
                            <p>Download reports in PDF (printable) or Excel (CSV) format.</p>
                        </div>
                    </div>

                    <div class="reports-grid">
                        <!-- ALL STUDENTS -->
                        ${reportCard({
                            title: "All Students Report",
                            description: "Download complete directory of registered students including ID, name, email and department.",
                            icon: "♙",
                            color: "pink",
                            pdf: "/students/pdf",
                            excel: "/students/excel"
                        })}

                        <!-- ATTENDANCE -->
                        ${reportCard({
                            title: "Attendance Report",
                            description: "View student attendance metrics including present, absent, half-day and leave days.",
                            icon: "◔",
                            color: "blue",
                            pdf: "/attendance/pdf",
                            excel: "/attendance/excel"
                        })}

                        <!-- PERFORMANCE -->
                        ${reportCard({
                            title: "Performance Report",
                            description: "Download complete student grades, total marks, and subject evaluation marks.",
                            icon: "▥",
                            color: "purple",
                            pdf: "/performance/pdf",
                            excel: "/performance/excel"
                        })}

                        <!-- COMPLETE DIRECTORY -->
                        ${reportCard({
                            title: "Complete College Report",
                            description: "Master student directory containing student IDs, departments, enrollment timestamps, and contacts.",
                            icon: "▤",
                            color: "green",
                            pdf: "/pdf",
                            excel: "/excel"
                        })}
                    </div>
                </div>

                <!-- INFORMATION -->
                <div class="reports-info">
                    <div class="info-icon">ℹ</div>
                    <div>
                        <strong>Live Database Sync</strong>
                        <p>
                            PDF reports open instantly with browser print dialogs. Excel reports download directly as CSV spreadsheets populated directly from the SQL database.
                        </p>
                    </div>
                </div>
            </div>
        `;

        attachEvents();
        injectStyles();

        console.log("✅ Reports page rendered successfully.");
    }


    // =====================================================
    // EVENTS
    // =====================================================

    function attachEvents() {
        const rangeSelect = document.getElementById("report-range");
        const startGroup = document.getElementById("custom-start-group");
        const endGroup = document.getElementById("custom-end-group");
        const startInput = document.getElementById("custom-start-date");
        const endInput = document.getElementById("custom-end-date");
        const applyButton = document.getElementById("apply-report-filter");

        // Range selector toggle
        if (rangeSelect) {
            rangeSelect.value = currentRange;

            rangeSelect.addEventListener("change", function () {
                currentRange = this.value;

                if (currentRange === "custom") {
                    if (startGroup) startGroup.style.display = "flex";
                    if (endGroup) endGroup.style.display = "flex";
                } else {
                    if (startGroup) startGroup.style.display = "none";
                    if (endGroup) endGroup.style.display = "none";
                }
            });
        }

        // Apply filter button
        if (applyButton) {
            applyButton.addEventListener("click", function () {
                customStartDate = startInput ? startInput.value : "";
                customEndDate = endInput ? endInput.value : "";

                if (currentRange === "custom") {
                    if (!customStartDate || !customEndDate) {
                        showMessage("Please select both start date and end date.", "error");
                        return;
                    }

                    if (customStartDate > customEndDate) {
                        showMessage("Start date cannot be after end date.", "error");
                        return;
                    }
                }

                showMessage("Report period updated successfully.", "success");
            });
        }

        // Report buttons delegation
        const buttons = document.querySelectorAll(".report-btn");

        buttons.forEach(function (button) {
            button.addEventListener("click", function () {
                const endpoint = button.dataset.endpoint;

                if (!endpoint) {
                    console.error("❌ Report endpoint missing.");
                    return;
                }

                let params = null;

                if (endpoint.includes("/attendance/")) {
                    params = getDateParams();
                }

                const url = buildUrl(endpoint, params);
                openReport(url);
            });
        });
    }


    // =====================================================
    // DATE PARAMETERS
    // =====================================================

    function getDateParams() {
        const params = {
            range: currentRange
        };

        if (currentRange === "custom") {
            if (customStartDate) params.startDate = customStartDate;
            if (customEndDate) params.endDate = customEndDate;
        }

        return params;
    }


    // =====================================================
    // MESSAGE BANNER
    // =====================================================

    function showMessage(message, type) {
        const existing = document.getElementById("reports-message");
        if (existing) existing.remove();

        const div = document.createElement("div");
        div.id = "reports-message";
        div.className = "reports-message " + (type || "success");

        div.innerHTML = `
            <span>${type === "error" ? "⚠" : "✓"}</span>
            <span>${escapeHtml(message)}</span>
        `;

        const container = getContainer();
        if (container) {
            container.prepend(div);
        }

        setTimeout(function () {
            if (div.parentNode) {
                div.remove();
            }
        }, 3500);
    }


    // =====================================================
    // STYLES INJECTION
    // =====================================================

    function injectStyles() {
        if (document.getElementById("reports-page-styles")) {
            return;
        }

        const style = document.createElement("style");
        style.id = "reports-page-styles";

        style.textContent = `
            .reports-page {
                width: 100%;
                max-width: 1250px;
                margin: 0 auto;
                padding: 28px 30px 40px;
                box-sizing: border-box;
            }

            .reports-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 20px;
                margin-bottom: 25px;
            }

            .reports-eyebrow {
                color: #ff2f86;
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 1.5px;
                margin-bottom: 6px;
            }

            .reports-header h1 {
                margin: 0;
                font-size: 30px;
                line-height: 1.2;
                color: #172554;
                font-weight: 800;
            }

            .reports-header p {
                margin: 8px 0 0;
                color: #64748b;
                font-size: 14px;
            }

            .reports-header-icon {
                width: 58px;
                height: 58px;
                border-radius: 18px;
                background: linear-gradient(135deg, #ff3d91, #2364e8);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 25px;
                box-shadow: 0 10px 25px rgba(37, 99, 235, 0.18);
            }

            .reports-filter-card {
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 18px;
                padding: 20px;
                margin-bottom: 22px;
                box-shadow: 0 8px 25px rgba(15, 23, 42, 0.05);
            }

            .filter-title {
                display: flex;
                align-items: center;
                gap: 13px;
                margin-bottom: 18px;
            }

            .filter-icon {
                width: 42px;
                height: 42px;
                border-radius: 12px;
                background: #eff6ff;
                color: #2563eb;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
            }

            .filter-title h3 {
                margin: 0;
                color: #172554;
                font-size: 16px;
            }

            .filter-title p {
                margin: 4px 0 0;
                color: #64748b;
                font-size: 12px;
            }

            .filter-controls {
                display: flex;
                align-items: flex-end;
                gap: 14px;
                flex-wrap: wrap;
            }

            .filter-group {
                display: flex;
                flex-direction: column;
                gap: 7px;
                min-width: 190px;
            }

            .filter-group label {
                font-size: 12px;
                color: #475569;
                font-weight: 700;
            }

            .filter-group select,
            .filter-group input {
                height: 42px;
                border: 1px solid #cbd5e1;
                border-radius: 10px;
                padding: 0 12px;
                background: white;
                color: #1e293b;
                outline: none;
                font-size: 13px;
            }

            .filter-group select:focus,
            .filter-group input:focus {
                border-color: #2563eb;
                box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
            }

            .apply-filter-btn {
                height: 42px;
                border: 0;
                border-radius: 10px;
                padding: 0 20px;
                background: #2563eb;
                color: white;
                font-weight: 700;
                cursor: pointer;
                transition: .2s ease;
            }

            .apply-filter-btn:hover {
                transform: translateY(-1px);
                background: #1d4ed8;
            }

            .report-summary-grid {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 16px;
                margin-bottom: 26px;
            }

            .summary-box {
                display: flex;
                align-items: center;
                gap: 14px;
                padding: 17px;
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 15px;
                box-shadow: 0 5px 20px rgba(15, 23, 42, 0.04);
            }

            .summary-icon {
                width: 43px;
                height: 43px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #fdf2f8;
                color: #ec4899;
                border-radius: 12px;
                font-size: 20px;
            }

            .summary-box strong {
                display: block;
                color: #172554;
                font-size: 14px;
            }

            .summary-box small {
                display: block;
                margin-top: 4px;
                color: #64748b;
                font-size: 11px;
            }

            .reports-section {
                margin-top: 10px;
            }

            .section-heading {
                margin-bottom: 16px;
            }

            .section-heading h2 {
                margin: 0;
                color: #172554;
                font-size: 20px;
            }

            .section-heading p {
                margin: 5px 0 0;
                color: #64748b;
                font-size: 13px;
            }

            .reports-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 18px;
            }

            .report-card {
                display: flex;
                gap: 17px;
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 17px;
                padding: 20px;
                min-height: 185px;
                box-sizing: border-box;
                box-shadow: 0 7px 25px rgba(15, 23, 42, 0.05);
                transition: transform .2s ease, box-shadow .2s ease;
            }

            .report-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
            }

            .report-card-icon {
                flex: 0 0 48px;
                width: 48px;
                height: 48px;
                border-radius: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 22px;
                font-weight: bold;
            }

            .report-card-icon.pink { background: #fce7f3; color: #db2777; }
            .report-card-icon.blue { background: #dbeafe; color: #2563eb; }
            .report-card-icon.purple { background: #ede9fe; color: #7c3aed; }
            .report-card-icon.green { background: #dcfce7; color: #16a34a; }

            .report-card-content {
                flex: 1;
                min-width: 0;
            }

            .report-card h3 {
                margin: 2px 0 7px;
                color: #172554;
                font-size: 17px;
            }

            .report-card p {
                margin: 0;
                color: #64748b;
                line-height: 1.55;
                font-size: 12px;
                min-height: 57px;
            }

            .report-card-actions {
                display: flex;
                gap: 9px;
                flex-wrap: wrap;
                margin-top: 15px;
            }

            .report-btn {
                height: 37px;
                padding: 0 12px;
                border-radius: 9px;
                border: 1px solid transparent;
                cursor: pointer;
                font-size: 11px;
                font-weight: 700;
                display: inline-flex;
                align-items: center;
                gap: 6px;
                transition: .2s ease;
            }

            .report-btn:hover { transform: translateY(-1px); }
            .report-btn-pdf { color: #be123c; background: #fff1f2; border-color: #fecdd3; }
            .report-btn-pdf:hover { background: #ffe4e6; }
            .report-btn-excel { color: #15803d; background: #f0fdf4; border-color: #bbf7d0; }
            .report-btn-excel:hover { background: #dcfce7; }

            .reports-info {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                margin-top: 22px;
                padding: 16px;
                background: #eff6ff;
                border: 1px solid #bfdbfe;
                border-radius: 14px;
                color: #1e40af;
            }

            .info-icon {
                width: 30px;
                height: 30px;
                flex: 0 0 30px;
                border-radius: 50%;
                background: #dbeafe;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 800;
            }

            .reports-info strong {
                display: block;
                font-size: 13px;
                margin-bottom: 4px;
            }

            .reports-info p {
                margin: 0;
                font-size: 11px;
                line-height: 1.5;
            }

            .reports-message {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 12px 15px;
                border-radius: 10px;
                margin-bottom: 16px;
                font-size: 13px;
                font-weight: 600;
            }

            .reports-message.success { background: #ecfdf5; border: 1px solid #a7f3d0; color: #047857; }
            .reports-message.error { background: #fff1f2; border: 1px solid #fecdd3; color: #be123c; }

            @media (max-width: 900px) {
                .report-summary-grid, .reports-grid { grid-template-columns: 1fr; }
            }

            @media (max-width: 650px) {
                .reports-page { padding: 20px 15px 30px; }
                .reports-header { align-items: flex-start; }
                .reports-header h1 { font-size: 24px; }
                .reports-header-icon { width: 45px; height: 45px; border-radius: 13px; }
                .filter-controls { display: grid; grid-template-columns: 1fr; }
                .filter-group, .apply-filter-btn { width: 100%; }
                .report-card { flex-direction: column; }
                .report-card-icon { flex-basis: 48px; }
            }
        `;

        document.head.appendChild(style);
    }


    // =====================================================
    // INITIALIZATION
    // =====================================================

    function initReports() {
        console.log("📊 Initializing Reports page...");

        const page = document.documentElement.dataset.page || "";

        if (page && page !== "reports") {
            console.log("Reports page not active.");
            return;
        }

        if (window.App && typeof window.App.onReady === "function") {
            window.App.onReady(function () {
                console.log("✅ App ready. Rendering reports.");
                renderReportsPage();
            });
        } else {
            console.warn("⚠ App.onReady unavailable. Rendering directly.");
            renderReportsPage();
        }
    }


    // =====================================================
    // START
    // =====================================================

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initReports);
    } else {
        initReports();
    }

})();