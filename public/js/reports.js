"use strict";

const apiReports = window.AppApi;

// Helper to construct backend API URLs correctly for Local and Vercel Production
function getBackendUrl(path) {
  const base = (window.AppApi && window.AppApi.API_URL) ? window.AppApi.API_URL : "/api";
  
  let cleanPath = path;
  if (cleanPath.startsWith("/api")) {
    cleanPath = cleanPath.substring(4);
  }
  if (!cleanPath.startsWith("/")) {
    cleanPath = "/" + cleanPath;
  }

  return `${base}${cleanPath}`;
}

/* =========================================================
   DATE RANGE MODAL POPUP
========================================================= */
function openDateFilterModal(reportType, format) {
  document.getElementById("report-date-modal")?.remove();

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "report-date-modal";

  const titles = {
    all: "Complete College Report",
    students: "Student Profiles Report",
    attendance: "Daily Attendance Report",
    performance: "Performance Report"
  };

  modal.innerHTML = `
    <div class="modal-card" style="max-width: 440px;">
      <button class="close-modal" id="close-date-modal-btn" type="button">×</button>
      
      <span class="eyebrow">EXPORT CENTER</span>
      <h2>${titles[reportType] || "Export Report"}</h2>
      <p style="margin-bottom: 16px; color: #64748b; font-size: 13px;">
        Select the timeframe for this <b>${format.toUpperCase()}</b> download:
      </p>

      <form id="export-date-range-form" style="display: flex; flex-direction: column; gap: 14px;">
        <label>
          <span style="font-size: 13px; font-weight: 600; color: #334155;">Select Time Range</span>
          <select id="timeframe-select" name="range" required style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1; font-family: inherit;">
            <option value="1m">Last 1 Month</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last 1 Year</option>
            <option value="custom">Custom Date Range...</option>
          </select>
        </label>

        <!-- CUSTOM DATE RANGE INPUTS -->
        <div id="custom-date-container" style="display: none; grid-template-columns: 1fr 1fr; gap: 10px;">
          <label>
            <span style="font-size: 12px; color: #475569;">From Date</span>
            <input type="date" name="startDate" id="start-date-input" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1;">
          </label>
          <label>
            <span style="font-size: 12px; color: #475569;">To Date</span>
            <input type="date" name="endDate" id="end-date-input" value="${new Date().toISOString().slice(0, 10)}" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1;">
          </label>
        </div>

        <button class="button pink form-submit" type="submit" style="margin-top: 8px; padding: 12px; font-size: 14px;">
          📥 Download ${format.toUpperCase()}
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  // Toggle custom dates
  document.getElementById("timeframe-select")?.addEventListener("change", (e) => {
    const customWrap = document.getElementById("custom-date-container");
    if (customWrap) {
      if (e.target.value === "custom") {
        customWrap.style.display = "grid";
        document.getElementById("start-date-input").required = true;
        document.getElementById("end-date-input").required = true;
      } else {
        customWrap.style.display = "none";
        document.getElementById("start-date-input").required = false;
        document.getElementById("end-date-input").required = false;
      }
    }
  });

  // Handle Close
  document.getElementById("close-date-modal-btn")?.addEventListener("click", () => modal.remove());

  // Handle Form Submit Download Trigger
  document.getElementById("export-date-range-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const range = formData.get("range");
    const startDate = formData.get("startDate") || "";
    const endDate = formData.get("endDate") || "";

    const path = `/reports/${reportType === "all" ? "" : reportType + "/"}${format}?range=${range}`;
    let downloadUrl = getBackendUrl(path);

    if (range === "custom") {
      downloadUrl += `&startDate=${startDate}&endDate=${endDate}`;
    }

    console.log("📥 Downloading report from:", downloadUrl);
    window.open(downloadUrl, "_blank");
    modal.remove();
  });
}

/* =========================================================
   RENDER REPORTS PAGE
========================================================= */
async function renderReportsPage() {
  if (window.App) {
    window.App.renderPage = renderReportsPage;
  }

  const pageContent = document.getElementById("page-content");
  if (!pageContent) return;

  pageContent.innerHTML = `
    <div class="page-title">
      <div>
        <span class="eyebrow">EXPORT CENTER</span>
        <h1>Reports & Analytics</h1>
        <p>Download clean reports for meetings, reviews, and academic documentation.</p>
      </div>
      <span class="pill good">Admin Only</span>
    </div>

    <!-- COMPLETE COLLEGE REPORT HEADER BANNER -->
    <section class="panel" style="background: linear-gradient(135deg, #3b82f6, #ec4899); border-radius: 16px; padding: 28px; color: #fff; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
        <div>
          <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; opacity: 0.9;">COMPLETE COLLEGE REPORT</span>
          <h2 style="margin: 4px 0; font-size: 24px; color: #fff;">Everything in one place</h2>
          <p style="margin: 0; opacity: 0.9; font-size: 13px;">Export the latest student, attendance, and performance data.</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="button white" data-export-type="all" data-export-format="excel" style="background: #fff; color: #2563eb; font-weight: 700; border: none; padding: 10px 18px; border-radius: 8px; cursor: pointer;">
            Download Excel
          </button>
          <button class="button white" data-export-type="all" data-export-format="pdf" style="background: #fff; color: #ec4899; font-weight: 700; border: none; padding: 10px 18px; border-radius: 8px; cursor: pointer;">
            Download PDF
          </button>
        </div>
      </div>
    </section>

    <!-- 3 SUB-MODULE CARDS -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px;">
      
      <!-- STUDENT REPORT -->
      <section class="panel" style="background: #fff; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0;">
        <div style="font-size: 20px; margin-bottom: 8px;">👤</div>
        <h3 style="margin: 0 0 4px 0; font-size: 16px; color: #0f172a;">Student Report</h3>
        <p style="margin: 0 0 16px 0; font-size: 12px; color: #64748b;">Profiles, departments and contact details.</p>
        <div style="display: flex; gap: 12px; font-size: 13px; font-weight: 600;">
          <a href="#" data-export-type="students" data-export-format="excel" style="color: #2563eb; text-decoration: none;">Excel →</a>
          <a href="#" data-export-type="students" data-export-format="pdf" style="color: #ec4899; text-decoration: none;">PDF</a>
        </div>
      </section>

      <!-- ATTENDANCE REPORT -->
      <section class="panel" style="background: #fff; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0;">
        <div style="font-size: 20px; margin-bottom: 8px;">⏱️</div>
        <h3 style="margin: 0 0 4px 0; font-size: 16px; color: #0f172a;">Attendance Report</h3>
        <p style="margin: 0 0 16px 0; font-size: 12px; color: #64748b;">Present, absent and percentage summaries.</p>
        <div style="display: flex; gap: 12px; font-size: 13px; font-weight: 600;">
          <a href="#" data-export-type="attendance" data-export-format="excel" style="color: #2563eb; text-decoration: none;">Excel →</a>
          <a href="#" data-export-type="attendance" data-export-format="pdf" style="color: #ec4899; text-decoration: none;">PDF</a>
        </div>
      </section>

      <!-- PERFORMANCE REPORT -->
      <section class="panel" style="background: #fff; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0;">
        <div style="font-size: 20px; margin-bottom: 8px;">📊</div>
        <h3 style="margin: 0 0 4px 0; font-size: 16px; color: #0f172a;">Performance Report</h3>
        <p style="margin: 0 0 16px 0; font-size: 12px; color: #64748b;">Marks by subject and academic levels.</p>
        <div style="display: flex; gap: 12px; font-size: 13px; font-weight: 600;">
          <a href="#" data-export-type="performance" data-export-format="excel" style="color: #2563eb; text-decoration: none;">Excel →</a>
          <a href="#" data-export-type="performance" data-export-format="pdf" style="color: #ec4899; text-decoration: none;">PDF</a>
        </div>
      </section>

    </div>
  `;
}

function setupReportsEvents() {
  document.addEventListener("click", function (event) {
    const btn = event.target.closest("[data-export-type]");
    if (btn) {
      event.preventDefault();
      const type = btn.dataset.exportType;
      const format = btn.dataset.exportFormat;
      openDateFilterModal(type, format);
    }
  });
}

if (window.App && typeof window.App.onReady === "function") {
  window.App.onReady(() => {
    window.App.renderPage = renderReportsPage;
    setupReportsEvents();
    renderReportsPage();
  });
} else {
  document.addEventListener("DOMContentLoaded", () => {
    setupReportsEvents();
    renderReportsPage();
  });
}