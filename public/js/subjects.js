"use strict";

const apiSubjects = window.AppApi;
const escSubjects = (value) => (apiSubjects && typeof apiSubjects.escape === "function") 
  ? apiSubjects.escape(value) 
  : String(value ?? "");

function renderSubjectsPage() {
  const student = App.currentStudent();

  if (!student) {
    document.getElementById("page-content").innerHTML =
      '<div class="empty">Student record not found.</div>';
    return;
  }

  const subjects = Array.isArray(student.subjects) && student.subjects.length > 0
    ? student.subjects
    : (App.data && Array.isArray(App.data.subjects) ? App.data.subjects : []);

  const subjectCards = subjects.length > 0
    ? subjects
        .map((sub) => {
          const attendancePct = Number(sub.attendance ?? 75);
          const completionPct = Number(sub.percentage ?? sub.completion ?? 80);
          const acronym = (sub.name || "SB")
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 3);

          return `
            <div class="subject-card clickable-subject" data-subject-id="${sub.id}">
              <div class="subject-card-header">
                <span class="badge-tag">${escSubjects(acronym)}</span>
                <span class="semester-label">Semester ${sub.semester || 5}</span>
              </div>
              <h3 class="subject-title">${escSubjects(sub.name)}</h3>
              <p class="instructor-text">Instructor: <strong>Academic Faculty</strong></p>
              
              <div class="progress-section">
                <div class="progress-labels">
                  <span>Course Completion / Attendance</span>
                  <span class="pct-text">${attendancePct}%</span>
                </div>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" style="width: ${attendancePct}%;"></div>
                </div>
              </div>
            </div>
          `;
        })
        .join("")
    : '<p class="empty">No active subjects registered.</p>';

  document.getElementById("page-content").innerHTML = `
    <style>
      .subjects-container {
        padding: 10px 0;
      }
      .subjects-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 24px;
        margin-top: 20px;
      }
      /* Card Layout & Border Styles */
      .subject-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 24px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .subject-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.08);
        border-color: #cbd5e1;
      }
      .subject-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .badge-tag {
        background: #eff6ff;
        color: #2563eb;
        font-weight: 700;
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 13px;
        letter-spacing: 0.5px;
      }
      .semester-label {
        font-size: 13px;
        color: #64748b;
        font-weight: 500;
      }
      .subject-title {
        font-size: 20px;
        font-weight: 700;
        margin: 0 0 6px 0;
        color: #0f172a;
      }
      .instructor-text {
        font-size: 14px;
        color: #64748b;
        margin: 0 0 20px 0;
      }
      .progress-section {
        margin-top: auto;
      }
      .progress-labels {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 8px;
      }
      .progress-labels span {
        color: #475569;
      }
      .pct-text {
        color: #ec4899;
      }
      .progress-bar-bg {
        height: 8px;
        background: #f1f5f9;
        border-radius: 6px;
        overflow: hidden;
      }
      .progress-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #ec4899, #f43f5e);
        border-radius: 6px;
      }

      /* Modal Overlay & Card Styling */
      .modal-overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
      }
      .modal-overlay.open {
        opacity: 1;
        pointer-events: auto;
      }
      .modal-content {
        background: #ffffff;
        border-radius: 16px;
        width: 90%;
        max-width: 520px;
        padding: 24px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        transform: translateY(20px);
        transition: transform 0.2s ease;
      }
      .modal-overlay.open .modal-content {
        transform: translateY(0);
      }
    </style>

    <div class="subjects-container">
      <div class="page-title">
        <div>
          <span class="eyebrow" style="color: #64748b; font-size: 13px; font-weight: 600;">My Academics</span>
          <h1 style="font-size: 28px; font-weight: 800; margin: 4px 0 8px 0; color: #0f172a;">My Subjects</h1>
          <p style="color: #64748b; font-size: 14px; margin-bottom: 20px;">Overview of your active course modules and subject progress. Click any card for detailed views.</p>
        </div>
      </div>

      <div style="font-weight: 700; color: #334155; font-size: 15px; margin-bottom: 12px;">${subjects.length} Active Modules</div>
      <div class="subjects-grid">${subjectCards}</div>
    </div>

    <!-- Details Modal -->
    <div id="subject-modal" class="modal-overlay">
      <div class="modal-content">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
          <div>
            <span id="modal-subject-code" class="badge-tag">SUB</span>
            <h2 id="modal-subject-title" style="font-size: 20px; font-weight: 700; margin: 8px 0 0 0; color: #0f172a;">Subject Title</h2>
          </div>
          <button id="close-modal" style="border: none; background: #f1f5f9; border-radius: 50%; width: 32px; height: 32px; font-size: 16px; cursor: pointer;">✕</button>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
          <div style="background: #f8fafc; padding: 14px; border-radius: 10px; border: 1px solid #e2e8f0;">
            <div style="font-size: 12px; color: #64748b; font-weight: 600;">ATTENDANCE</div>
            <div id="modal-attendance-value" style="font-size: 22px; font-weight: 800; color: #2563eb; margin-top: 4px;">0%</div>
            <div id="modal-attendance-details" style="font-size: 12px; color: #64748b; margin-top: 2px;">0 / 0 Classes Attended</div>
          </div>
          <div style="background: #f8fafc; padding: 14px; border-radius: 10px; border: 1px solid #e2e8f0;">
            <div style="font-size: 12px; color: #64748b; font-weight: 600;">SYLLABUS COMPLETION</div>
            <div id="modal-completion-value" style="font-size: 22px; font-weight: 800; color: #10b981; margin-top: 4px;">0%</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Modules Completed</div>
          </div>
        </div>

        <h4 style="font-size: 14px; font-weight: 700; margin: 0 0 10px 0; color: #334155;">Module Completion Overview</h4>
        <div id="modal-modules-list" style="display: flex; flex-direction: column; gap: 8px;">
          <!-- Dynamically populated modules -->
        </div>
      </div>
    </div>
  `;

  setupSubjectModalListeners(subjects, student);
}

function setupSubjectModalListeners(subjects, student) {
  const modal = document.getElementById("subject-modal");
  const closeModalBtn = document.getElementById("close-modal");

  if (!modal) return;

  document.querySelectorAll(".clickable-subject").forEach((card) => {
    card.addEventListener("click", () => {
      const subjectId = Number(card.getAttribute("data-subject-id"));
      const subject = subjects.find((s) => Number(s.id) === subjectId);

      if (!subject) return;

      const attendanceRows = Array.isArray(student.attendanceRows)
        ? student.attendanceRows.filter((r) => Number(r.subjectId) === subjectId)
        : [];

      const totalClasses = attendanceRows.length || 12;
      const presentClasses = attendanceRows.length > 0 
        ? attendanceRows.filter((r) => r.status === "present").length 
        : Math.round((Number(subject.attendance || 75) / 100) * totalClasses);

      const attendancePct = Number(subject.attendance ?? Math.round((presentClasses / totalClasses) * 100));
      const completionPct = Number(subject.percentage ?? 85);

      document.getElementById("modal-subject-code").textContent = subject.code || ("SUB-" + subject.id);
      document.getElementById("modal-subject-title").textContent = subject.name;
      document.getElementById("modal-attendance-value").textContent = `${attendancePct}%`;
      document.getElementById("modal-attendance-details").textContent = `${presentClasses} / ${totalClasses} Classes Attended`;
      document.getElementById("modal-completion-value").textContent = `${completionPct}%`;

      const modulesList = document.getElementById("modal-modules-list");
      modulesList.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 12px; border-radius: 8px; font-size: 13px;">
          <span>Unit 1: Fundamentals & Core Concepts</span>
          <span style="color: #10b981; font-weight: 700;">✓ Completed</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 12px; border-radius: 8px; font-size: 13px;">
          <span>Unit 2: Advanced Topics & Operations</span>
          <span style="color: #10b981; font-weight: 700;">✓ Completed</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 12px; border-radius: 8px; font-size: 13px;">
          <span>Unit 3: Practical Implementation & Lab Work</span>
          <span style="color: ${completionPct >= 75 ? "#10b981" : "#f59e0b"}; font-weight: 700;">${completionPct >= 75 ? "✓ Completed" : "⏳ In Progress"}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 12px; border-radius: 8px; font-size: 13px;">
          <span>Unit 4: Final Assessments & Case Studies</span>
          <span style="color: #94a3b8; font-weight: 600;">Upcoming</span>
        </div>
      `;

      modal.classList.add("open");
    });
  });

  closeModalBtn.addEventListener("click", () => modal.classList.remove("open"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("open");
  });
}

App.onReady(() => {
  App.renderPage = renderSubjectsPage;
  renderSubjectsPage();
});