"use strict";

const apiDashboard = window.AppApi;

function escDashboard(value) {
  return apiDashboard && typeof apiDashboard.escape === "function"
    ? apiDashboard.escape(value)
    : String(value ?? "").replace(/[&<>'"]/g, "");
}

async function renderStudentDashboard() {
  App.renderPage = renderStudentDashboard;

  const pageContent = document.getElementById("page-content");
  if (!pageContent) return;

  const student = App.currentStudent ? App.currentStudent() : {};
  const firstName = (student.name || "Student").split(" ")[0];

  // Calculate live summary metrics
  const attendancePct = student.attendance?.percentage || 67;
  const performancePct = student.performance?.percentage || 41.67;
  const subjectsCount = Array.isArray(student.subjects) ? student.subjects.length : 3;

  pageContent.innerHTML = `
    <div class="page-title">
      <div>
        <span class="eyebrow">MY WORKSPACE</span>
        <h1>Welcome back, ${escDashboard(firstName)}!</h1>
        <p>Keep your momentum going. Your next milestone is closer than you think.</p>
      </div>
      <a href="profile.html" class="button white" style="border:1px solid #e2e8f0; text-decoration:none; padding:8px 16px; border-radius:8px; color:#ec4899; font-weight:600;">View profile →</a>
    </div>

    <!-- 4 CLICKABLE SUMMARY METRIC CARDS -->
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:20px; margin-bottom:24px;">
      
      <!-- 1. MY ATTENDANCE -->
      <a href="attendance.html" class="panel metric-card" style="background:#fff; border-radius:16px; padding:20px; border:1px solid #e2e8f0; text-decoration:none; color:inherit; display:block; transition:transform 0.2s, box-shadow 0.2s; cursor:pointer;">
        <div style="width:36px; height:36px; background:#eff6ff; border-radius:10px; display:flex; align-items:center; justify-content:center; margin-bottom:12px; color:#2563eb; font-weight:bold;">⏱️</div>
        <h2 style="font-size:26px; margin:0 0 4px 0; color:#0f172a; font-weight:700;">${attendancePct}%</h2>
        <b style="font-size:13px; color:#334155; display:block;">My Attendance</b>
        <small style="color:#94a3b8; font-size:12px;">Class record status</small>
      </a>

      <!-- 2. MY PERCENTAGE -->
      <a href="performance.html" class="panel metric-card" style="background:#fff; border-radius:16px; padding:20px; border:1px solid #e2e8f0; text-decoration:none; color:inherit; display:block; transition:transform 0.2s, box-shadow 0.2s; cursor:pointer;">
        <div style="width:36px; height:36px; background:#fdf2f8; border-radius:10px; display:flex; align-items:center; justify-content:center; margin-bottom:12px; color:#ec4899; font-weight:bold;">📊</div>
        <h2 style="font-size:26px; margin:0 0 4px 0; color:#0f172a; font-weight:700;">${performancePct}%</h2>
        <b style="font-size:13px; color:#334155; display:block;">My Percentage</b>
        <small style="color:#94a3b8; font-size:12px;">Average academic score</small>
      </a>

      <!-- 3. SUBJECTS -->
      <a href="subjects.html" class="panel metric-card" style="background:#fff; border-radius:16px; padding:20px; border:1px solid #e2e8f0; text-decoration:none; color:inherit; display:block; transition:transform 0.2s, box-shadow 0.2s; cursor:pointer;">
        <div style="width:36px; height:36px; background:#f0fdf4; border-radius:10px; display:flex; align-items:center; justify-content:center; margin-bottom:12px; color:#16a34a; font-weight:bold;">🏃</div>
        <h2 style="font-size:26px; margin:0 0 4px 0; color:#0f172a; font-weight:700;">${subjectsCount}</h2>
        <b style="font-size:13px; color:#334155; display:block;">Subjects</b>
        <small style="color:#94a3b8; font-size:12px;">This semester</small>
      </a>

      <!-- 4. CAREER GUIDANCE -->
      <a href="career.html" class="panel metric-card" style="background:#fff; border-radius:16px; padding:20px; border:1px solid #e2e8f0; text-decoration:none; color:inherit; display:block; transition:transform 0.2s, box-shadow 0.2s; cursor:pointer;">
        <div style="width:36px; height:36px; background:#fef3c7; border-radius:10px; display:flex; align-items:center; justify-content:center; margin-bottom:12px; color:#d97706; font-weight:bold;">🎯</div>
        <h2 style="font-size:22px; margin:0 0 4px 0; color:#16a34a; font-weight:700;">Completed</h2>
        <b style="font-size:13px; color:#334155; display:block;">Career Guidance</b>
        <small style="color:#94a3b8; font-size:12px;">Test Completed</small>
      </a>

    </div>

    <!-- CHARTS & TRACKING ROW -->
    <div class="grid-two" style="display:grid; grid-template-columns: 2fr 1fr; gap:20px;">
      <section class="panel" style="background:#fff; border-radius:16px; padding:20px; border:1px solid #e2e8f0;">
        <div class="panel-head" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <div>
            <h2 style="margin:0; font-size:16px; color:#0f172a;">Subject performance</h2>
          </div>
          <a href="performance.html" style="font-size:13px; color:#ec4899; text-decoration:none; font-weight:600;">Details →</a>
        </div>
        <div class="chart-box-wrap" style="height:250px;">
          <canvas id="subject-performance-chart"></canvas>
        </div>
      </section>

      <section class="panel" style="background:#fff; border-radius:16px; padding:20px; border:1px solid #e2e8f0;">
        <div class="panel-head" style="margin-bottom:16px;">
          <h2 style="margin:0; font-size:16px; color:#0f172a;">Stay on track</h2>
        </div>
        <div style="display:flex; flex-direction:column; gap:16px;">
          <a href="profile.html" style="display:flex; justify-content:space-between; align-items:center; text-decoration:none; color:inherit; padding:12px; background:#f8fafc; border-radius:10px; border:1px solid #f1f5f9;">
            <div>
              <b style="font-size:13px; color:#0f172a; display:block;">Complete your profile</b>
              <small style="color:#64748b; font-size:12px;">Add phone number and course details</small>
            </div>
            <span style="color:#94a3b8;">→</span>
          </a>

          <a href="career.html" style="display:flex; justify-content:space-between; align-items:center; text-decoration:none; color:inherit; padding:12px; background:#f0fdf4; border-radius:10px; border:1px solid #bbf7d0;">
            <div>
              <b style="font-size:13px; color:#166534; display:block;">Take career guidance test</b>
              <small style="color:#15803d; font-size:12px;">✓ Test Completed</small>
            </div>
            <span style="color:#16a34a;">→</span>
          </a>
        </div>
      </section>
    </div>
  `;

  // Draw chart
  if (typeof ChartTools !== "undefined") {
    try {
      ChartTools.clear();
      ChartTools.draw(
        "subject-performance-chart",
        "bar",
        ["DBMS", "OSY", "DBMS"],
        [75, 50, 0],
        ["#ec4899"]
      );
    } catch (e) {}
  }
}

App.onReady(() => {
  App.renderPage = renderStudentDashboard;
  renderStudentDashboard();
});