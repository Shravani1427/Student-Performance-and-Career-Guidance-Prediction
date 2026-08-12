"use strict";

const apiDashboard = window.AppApi;
const escDashboard = (value) =>
  apiDashboard && typeof apiDashboard.escape === "function"
    ? apiDashboard.escape(value)
    : String(value ?? "");

function isCareerCompleted(student) {
  if (!student) return false;

  const id = student.id;

  // 1. Check direct student object properties
  if (
    student.guidance ||
    (Array.isArray(student.recommendations) && student.recommendations.length > 0)
  ) {
    return true;
  }

  // 2. Check simple completed flag in localStorage
  if (localStorage.getItem(`career_completed_${id}`) === "true") {
    return true;
  }

  // 3. Check JSON structure saved by career.js (career_assessment_ID)
  try {
    const rawKeyData = localStorage.getItem(`career_assessment_${id}`);
    if (rawKeyData) {
      const parsed = JSON.parse(rawKeyData);
      if (parsed && parsed.completed) {
        return true;
      }
    }
  } catch (e) {
    console.warn("Error reading assessment key:", e);
  }

  // 4. Fallback check for any default key stored
  try {
    const defaultData = localStorage.getItem("career_assessment_default");
    if (defaultData) {
      const parsedDefault = JSON.parse(defaultData);
      if (parsedDefault && parsedDefault.completed) {
        return true;
      }
    }
  } catch (e) {}

  return false;
}

function renderStudentDashboard() {
  console.log("📊 Rendering Student Dashboard...");
  const root = document.getElementById("page-content");
  if (!root) return;

  const student =
    window.App && typeof window.App.currentStudent === "function"
      ? window.App.currentStudent()
      : null;

  if (!student) {
    root.innerHTML =
      '<div class="empty" style="padding:24px; text-align:center;">Student record not found.</div>';
    return;
  }

  // Check completion status
  const completed = isCareerCompleted(student);

  const guidanceStatusText = completed ? "Completed" : "Pending";
  const guidanceSubtext = completed ? "Test Completed" : "Take your test";
  const guidanceColor = completed ? "#10b981" : "#111827";

  const attendancePct = student.attendance ? student.attendance.percentage : 67;
  const performancePct = student.performance ? student.performance.percentage : 41.67;
  const subjectsCount = Array.isArray(student.subjects) ? student.subjects.length : 3;

  root.innerHTML = `
    <style>
      .dashboard-container {
        padding: 8px 0;
        font-family: inherit;
      }
      .welcome-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }
      .welcome-header h2 {
        font-size: 26px;
        font-weight: 800;
        color: #0f172a;
        margin: 0;
      }
      .welcome-header p {
        color: #64748b;
        margin: 4px 0 0 0;
        font-size: 14px;
      }
      .btn-view-profile {
        background: #ffffff;
        border: 1.5px solid #ec4899;
        color: #ec4899;
        padding: 8px 18px;
        border-radius: 8px;
        font-weight: 700;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .btn-view-profile:hover {
        background: #ec4899;
        color: #ffffff;
      }

      /* Stats Grid */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
        margin-bottom: 24px;
      }
      .stat-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 20px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }
      .stat-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      .stat-icon {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      }
      .stat-value {
        font-size: 26px;
        font-weight: 800;
      }
      .stat-label {
        font-size: 13px;
        font-weight: 700;
        color: #334155;
        margin-top: 4px;
      }
      .stat-subtext {
        font-size: 12px;
        color: #94a3b8;
        margin-top: 2px;
      }

      /* Lower Dashboard Layout */
      .charts-grid {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 20px;
      }
      .dashboard-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 24px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
      }
      .todo-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 0;
        border-bottom: 1px solid #f1f5f9;
      }
      .todo-item:last-child {
        border-bottom: none;
      }
    </style>

    <div class="dashboard-container">
      <div class="welcome-header">
        <div>
          <span class="eyebrow" style="color:#ec4899; font-size:12px; font-weight:700; text-transform:uppercase;">My Workspace</span>
          <h2>Welcome back, ${escDashboard(student.name.split(" ")[0])}!</h2>
          <p>Keep your momentum going. Your next milestone is closer than you think.</p>
        </div>
        <button class="btn-view-profile" onclick="window.location.href='/profile.html'">View profile →</button>
      </div>

      <div class="stats-grid">
        <!-- 1. Attendance Card -->
        <div class="stat-card" onclick="window.location.href='/attendance.html'">
          <div class="stat-header">
            <div class="stat-icon" style="background:#eff6ff; color:#2563eb;">🔄</div>
          </div>
          <div class="stat-value" style="color:#0f172a;">${attendancePct}%</div>
          <div class="stat-label">My Attendance</div>
          <div class="stat-subtext">${student.attendance?.present || 2} classes present</div>
        </div>

        <!-- 2. Performance Card -->
        <div class="stat-card" onclick="window.location.href='/performance.html'">
          <div class="stat-header">
            <div class="stat-icon" style="background:#fdf2f8; color:#ec4899;">📊</div>
          </div>
          <div class="stat-value" style="color:#0f172a;">${performancePct}%</div>
          <div class="stat-label">My Percentage</div>
          <div class="stat-subtext">${student.performance?.level || "Average"}</div>
        </div>

        <!-- 3. Subjects Card -->
        <div class="stat-card" onclick="window.location.href='/subjects.html'">
          <div class="stat-header">
            <div class="stat-icon" style="background:#f5f3ff; color:#8b5cf6;">🏃</div>
          </div>
          <div class="stat-value" style="color:#0f172a;">${subjectsCount}</div>
          <div class="stat-label">Subjects</div>
          <div class="stat-subtext">This semester</div>
        </div>

        <!-- 4. Career Guidance Card -->
        <div class="stat-card" onclick="window.location.href='/career.html'">
          <div class="stat-header">
            <div class="stat-icon" style="background:#fef3c7; color:#d97706;">🎯</div>
          </div>
          <div class="stat-value" style="color:${guidanceColor};">${guidanceStatusText}</div>
          <div class="stat-label">Career Guidance</div>
          <div class="stat-subtext">${guidanceSubtext}</div>
        </div>
      </div>

      <!-- Lower Section -->
      <div class="charts-grid">
        <div class="dashboard-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <h3 style="margin:0; font-size:16px; font-weight:700;">Subject performance</h3>
            <a href="/performance.html" style="color:#2563eb; text-decoration:none; font-size:13px; font-weight:600;">Details →</a>
          </div>
          <div style="height: 220px;">
            <canvas id="student-perf-chart"></canvas>
          </div>
        </div>

        <div class="dashboard-card">
          <h3 style="margin:0 0 16px 0; font-size:16px; font-weight:700;">Stay on track</h3>
          <div class="todo-item">
            <div>
              <strong style="font-size:14px; display:block;">Complete your profile</strong>
              <small style="color:#64748b;">Add phone number and course details</small>
            </div>
            <a href="/profile.html" style="color:#64748b; text-decoration:none;">→</a>
          </div>
          <div class="todo-item">
            <div>
              <strong style="font-size:14px; display:block;">Take career guidance test</strong>
              <small style="color:${completed ? "#10b981" : "#64748b"}; font-weight:${completed ? "700" : "400"};">
                ${completed ? "✓ Test Completed" : "10 questions • one-time only"}
              </small>
            </div>
            <a href="/career.html" style="color:#64748b; text-decoration:none;">→</a>
          </div>
        </div>
      </div>
    </div>
  `;

  drawStudentChart(student);
}

function drawStudentChart(student) {
  const canvas = document.getElementById("student-perf-chart");
  if (!canvas || typeof Chart === "undefined") return;

  const subjects = student.subjects || [];
  const labels = subjects.map((s) => s.name || "Subject");
  const data = subjects.map((s) => s.percentage || s.obtained || 0);

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: labels.length > 0 ? labels : ["DBMS", "OSY"],
      datasets: [
        {
          data: data.length > 0 ? data : [75, 50],
          backgroundColor: "#ec4899",
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 100 },
      },
    },
  });
}

// Execution triggers
if (window.App && window.App.data) {
  window.App.renderPage = renderStudentDashboard;
  renderStudentDashboard();
} else if (window.App && typeof window.App.onReady === "function") {
  window.App.onReady(() => {
    window.App.renderPage = renderStudentDashboard;
    renderStudentDashboard();
  });
}