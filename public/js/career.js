"use strict";

const apiCareer = window.AppApi;
const escCareer = (value) =>
  apiCareer && typeof apiCareer.escape === "function"
    ? apiCareer.escape(value)
    : String(value ?? "").replace(/[&<>'"]/g, "");

// Default 10 Assessment Questions Fallback
const DEFAULT_QUESTIONS = [
  {
    id: 1,
    question: "Which type of tasks do you enjoy the most?",
    options: [
      { label: "Writing code & building web software", track: "Software Development" },
      { label: "Analyzing datasets & extracting insights", track: "Data Science" },
      { label: "Managing database queries & storage", track: "Database Management" },
      { label: "Designing user interfaces & user experiences", track: "UI/UX Design" }
    ]
  },
  {
    id: 2,
    question: "How do you approach solving a technical problem?",
    options: [
      { label: "Debugging step-by-step using logic & code", track: "Software Development" },
      { label: "Looking for patterns in data and statistics", track: "Data Science" },
      { label: "Optimizing structure, indexes & data flow", track: "Database Management" },
      { label: "Visualizing customer journey and ease of use", track: "UI/UX Design" }
    ]
  },
  {
    id: 3,
    question: "Which programming language or tool sounds most appealing?",
    options: [
      { label: "JavaScript, React, Node.js", track: "Software Development" },
      { label: "Python, Pandas, Machine Learning", track: "Data Science" },
      { label: "SQL, MySQL, MongoDB", track: "Database Management" },
      { label: "Figma, Adobe XD, CSS Styling", track: "UI/UX Design" }
    ]
  },
  {
    id: 4,
    question: "What kind of project would you prefer working on?",
    options: [
      { label: "Building an end-to-end full stack web application", track: "Software Development" },
      { label: "Creating predictive statistical models for market trends", track: "Data Science" },
      { label: "Setting up a high-availability cloud database cluster", track: "Database Management" },
      { label: "Redesigning a mobile app interface to make it sleek", track: "UI/UX Design" }
    ]
  },
  {
    id: 5,
    question: "Which metric defines success for you?",
    options: [
      { label: "Clean, error-free, and high-performance code", track: "Software Development" },
      { label: "High accuracy and actionable business insights", track: "Data Science" },
      { label: "Zero data loss and maximum database uptime", track: "Database Management" },
      { label: "Great user feedback and intuitive navigation", track: "UI/UX Design" }
    ]
  },
  {
    id: 6,
    question: "Where do you prefer to spend most of your development time?",
    options: [
      { label: "Building features, API endpoints & web architecture", track: "Software Development" },
      { label: "Cleaning data, running algorithms & creating charts", track: "Data Science" },
      { label: "Writing optimized database queries and triggers", track: "Database Management" },
      { label: "Refining visual layouts, color palettes & typography", track: "UI/UX Design" }
    ]
  },
  {
    id: 7,
    question: "What environment do you thrive in?",
    options: [
      { label: "Agile software development teams building apps", track: "Software Development" },
      { label: "Research & analytics units solving complex data problems", track: "Data Science" },
      { label: "IT infrastructure & backend database operations", track: "Database Management" },
      { label: "Creative digital design and product strategy teams", track: "UI/UX Design" }
    ]
  },
  {
    id: 8,
    question: "Which subject module did you enjoy most in college?",
    options: [
      { label: "Object Oriented Programming & Web Technologies", track: "Software Development" },
      { label: "Statistics, Probability & Data Analytics", track: "Data Science" },
      { label: "Database Management Systems (DBMS)", track: "Database Management" },
      { label: "Human-Computer Interaction & Graphics", track: "UI/UX Design" }
    ]
  },
  {
    id: 9,
    question: "What is your main technical goal for the next 2 years?",
    options: [
      { label: "Become a Full Stack Software Developer", track: "Software Development" },
      { label: "Become a Data Analyst or Data Scientist", track: "Data Science" },
      { label: "Master Database Administration & Backend Architecture", track: "Database Management" },
      { label: "Become a Product Designer / UI-UX Engineer", track: "UI/UX Design" }
    ]
  },
  {
    id: 10,
    question: "How do you handle project feedback?",
    options: [
      { label: "Refactor code to make it more modular and scalable", track: "Software Development" },
      { label: "Validate data sources and re-train models", track: "Data Science" },
      { label: "Tune query execution plans and schema constraints", track: "Database Management" },
      { label: "Iterate on wireframes based on user feedback", track: "UI/UX Design" }
    ]
  }
];

// Get storage key for a student
function getStudentKey(studentId) {
  return `career_assessment_${studentId || "default"}`;
}

// Get saved assessment state for a student
function getSavedAssessment(studentId) {
  try {
    const key = getStudentKey(studentId);
    const data = localStorage.getItem(key);
    if (data) return JSON.parse(data);

    // Fallback check on student object inside App data
    const currentStudent = App.currentStudent ? App.currentStudent() : null;
    if (currentStudent && currentStudent.guidance) {
      return {
        completed: true,
        result: currentStudent.guidance,
        permissionRequested: false,
        submittedAt: "Saved"
      };
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Save assessment result for a student (Updates local storage AND App state)
function saveAssessment(studentId, result) {
  try {
    const key = getStudentKey(studentId);
    const assessmentObj = {
      completed: true,
      result: result,
      permissionRequested: false,
      submittedAt: new Date().toLocaleDateString()
    };

    localStorage.setItem(key, JSON.stringify(assessmentObj));
    localStorage.setItem(`career_completed_${studentId}`, "true");

    // Sync directly with current student state so Dashboard updates instantly
    const currentStudent = App.currentStudent ? App.currentStudent() : null;
    if (currentStudent) {
      currentStudent.guidance = result;
      if (!Array.isArray(currentStudent.recommendations)) {
        currentStudent.recommendations = [];
      }
      currentStudent.recommendations.push(result);
    }
  } catch (e) {
    console.error("Error saving assessment:", e);
  }
}

// Request permission to retake
function requestRetakePermission(studentId) {
  try {
    const key = getStudentKey(studentId);
    const existing = getSavedAssessment(studentId);
    if (existing) {
      existing.permissionRequested = true;
      localStorage.setItem(key, JSON.stringify(existing));
    }
  } catch (e) {}
}

// Admin approve retake / reset test status
function resetStudentAssessment(studentId) {
  try {
    const key = getStudentKey(studentId);
    localStorage.removeItem(key);
    localStorage.removeItem(`career_completed_${studentId}`);

    const student = (App.data?.students || []).find((s) => Number(s.id) === Number(studentId));
    if (student) {
      student.guidance = null;
      student.recommendations = [];
    }
  } catch (e) {}
}

/* =========================================================
   ADMIN CAREER DASHBOARD VIEW
========================================================= */
function renderAdminCareerDashboard() {
  const pageContent = document.getElementById("page-content");
  if (!pageContent) return;

  const students = (App.data && Array.isArray(App.data.students)) ? App.data.students : [];

  const studentResults = students.map((s) => {
    const saved = getSavedAssessment(s.id);
    return {
      student: s,
      assessment: saved
    };
  });

  const pendingRequests = studentResults.filter(
    (item) => item.assessment && item.assessment.completed && item.assessment.permissionRequested
  );

  pageContent.innerHTML = `
    <div class="page-title">
      <div>
        <span class="eyebrow">ADMINISTRATION</span>
        <h1>Career Guidance & Assessment Portal</h1>
        <p>Monitor student assessment results, tracks, and approve retake requests.</p>
      </div>
      <span class="pill good">Admin Dashboard</span>
    </div>

    ${
      pendingRequests.length > 0
        ? `
          <section class="panel" style="background:#fff7ed; border:1px solid #f97316; border-radius:16px; padding:20px; margin-bottom:24px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <b style="color:#c2410c; font-size:16px;">⚠️ ${pendingRequests.length} Student(s) Requesting Assessment Retake</b>
                <p style="margin:4px 0 0 0; color:#ea580c; font-size:13px;">Review students below who want to retake their career guidance test.</p>
              </div>
            </div>
          </section>
        `
        : ""
    }

    <section class="panel recent">
      <div class="panel-head">
        <div>
          <h2>Student Career Assessment Results</h2>
          <p>Detailed view of recommended career tracks and permission status.</p>
        </div>
      </div>

      <div class="table-wrap">
        <table style="width:100%; border-collapse:collapse;">
          <thead>
            <tr style="background:#f8fafc; border-bottom:2px solid #e2e8f0; text-align:left; font-size:12px; color:#475569;">
              <th style="padding:12px 16px;">Student</th>
              <th style="padding:12px 16px;">Department</th>
              <th style="padding:12px 16px;">Status</th>
              <th style="padding:12px 16px;">Recommended Career Track</th>
              <th style="padding:12px 16px;">Match Score</th>
              <th style="padding:12px 16px; text-align:right;">Actions / Permission</th>
            </tr>
          </thead>
          <tbody>
            ${
              studentResults.length === 0
                ? `<tr><td colspan="6" style="text-align:center; padding:30px; color:#64748b;">No students found in system.</td></tr>`
                : studentResults
                    .map((item) => {
                      const s = item.student;
                      const a = item.assessment;

                      let statusBadge = `<span class="pill" style="background:#f1f5f9; color:#64748b;">Not Attempted</span>`;
                      let trackName = "—";
                      let scoreText = "—";

                      if (a && a.completed) {
                        trackName = `<b style="color:#1e1b4b;">${escCareer(a.result?.track || "Completed")}</b>`;
                        scoreText = `<span style="color:#2563eb; font-weight:700;">${a.result?.matchPercentage || 80}%</span>`;

                        if (a.permissionRequested) {
                          statusBadge = `<span class="pill" style="background:#fef3c7; color:#b45309; border:1px solid #f59e0b;">⏳ Retake Requested</span>`;
                        } else {
                          statusBadge = `<span class="pill good">✓ Completed</span>`;
                        }
                      }

                      return `
                        <tr style="border-bottom:1px solid #f1f5f9;">
                          <td style="padding:12px 16px;">
                            <strong>${escCareer(s.name)}</strong>
                            <div style="font-size:11px; color:#64748b;">${escCareer(s.email)}</div>
                          </td>
                          <td style="padding:12px 16px; font-size:13px; color:#475569;">${escCareer(s.department || "IT")}</td>
                          <td style="padding:12px 16px;">${statusBadge}</td>
                          <td style="padding:12px 16px; font-size:13px;">${trackName}</td>
                          <td style="padding:12px 16px; font-size:13px;">${scoreText}</td>
                          <td style="padding:12px 16px; text-align:right;">
                            ${
                              a && a.completed
                                ? `<button class="button small ${a.permissionRequested ? "pink" : "secondary"}" data-approve-retake="${s.id}" style="padding:6px 12px; font-size:12px;">
                                    ${a.permissionRequested ? "✓ Approve Retake Permission" : "Reset Test"}
                                   </button>`
                                : `<span style="font-size:12px; color:#94a3b8;">Pending Student Attempt</span>`
                            }
                          </td>
                        </tr>
                      `;
                    })
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

/* =========================================================
   STUDENT CAREER GUIDANCE VIEW
========================================================= */
async function renderStudentCareerPage() {
  const pageContent = document.getElementById("page-content");
  if (!pageContent) return;

  const currentStudent = App.currentStudent ? App.currentStudent() : {};
  const studentId = currentStudent?.id || App.session?.studentId;
  const savedState = getSavedAssessment(studentId);

  // IF ALREADY ATTEMPTED
  if (savedState && savedState.completed) {
    const res = savedState.result || {};

    pageContent.innerHTML = `
      <div class="page-title">
        <div>
          <span class="eyebrow">DISCOVER YOUR DIRECTION</span>
          <h1>My Career Guidance</h1>
          <p>Your assessment has been submitted successfully.</p>
        </div>
        <span class="pill good">Assessment Completed</span>
      </div>

      <section class="panel" style="background: linear-gradient(135deg, #1e1b4b, #312e81); border-radius:16px; padding:28px; color:#fff; margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px;">
          <div>
            <span style="font-size:12px; color:#a5b4fc; text-transform:uppercase; letter-spacing:1px; font-weight:600;">YOUR RECOMMENDED CAREER PATH</span>
            <h2 style="margin:6px 0; font-size:26px; color:#fff;">${escCareer(res.track || "Software Development")}</h2>
            <p style="margin:0; font-size:14px; color:#c7d2fe;">Assessed on ${savedState.submittedAt || "Recent Session"}</p>
          </div>
          <div style="background:rgba(255,255,255,0.15); padding:14px 22px; border-radius:12px; text-align:center;">
            <b style="font-size:28px; color:#38bdf8;">${res.matchPercentage || 80}%</b>
            <small style="display:block; font-size:11px; color:#e0e7ff;">Match Score</small>
          </div>
        </div>
        <hr style="border:none; border-top:1px solid rgba(255,255,255,0.15); margin:20px 0;">
        <div>
          <b style="font-size:13px; color:#a5b4fc; display:block; margin-bottom:6px;">RECOMMENDED SKILLS TO MASTER:</b>
          <span style="background:rgba(255,255,255,0.1); padding:8px 14px; border-radius:6px; font-size:13px; display:inline-block;">${escCareer(res.skills || "JavaScript, React, Node.js")}</span>
        </div>
      </section>

      <section class="panel" style="background:#fff; border-radius:16px; padding:24px; border:1px solid #e2e8f0; text-align:center;">
        <h3 style="margin:0 0 8px 0; color:#0f172a; font-size:18px;">Want to retake the assessment?</h3>
        <p style="color:#64748b; font-size:14px; margin:0 0 20px 0;">
          Assessments are restricted to <b>one attempt per student</b>. If you wish to retake it, request permission from your administrator.
        </p>

        ${
          savedState.permissionRequested
            ? `
              <div style="display:inline-block; background:#fef3c7; border:1px solid #f59e0b; color:#92400e; padding:12px 24px; border-radius:8px; font-weight:600; font-size:14px;">
                ⏳ Retake Permission Requested. Waiting for Admin Approval...
              </div>
            `
            : `
              <button id="request-retake-btn" class="button pink" style="padding:12px 24px; font-size:14px; cursor:pointer;">
                🙋 Request Permission from Admin to Retake
              </button>
            `
        }
      </section>
    `;
    return;
  }

  // FIRST TIME QUESTIONNAIRE FOR STUDENT
  pageContent.innerHTML = `
    <div class="page-title">
      <div>
        <span class="eyebrow">DISCOVER YOUR DIRECTION</span>
        <h1>Career Guidance</h1>
        <p>Answer 10 questions and discover careers that match your interests.</p>
      </div>
    </div>

    <section class="panel" style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; padding:16px 20px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <b style="color:#1d4ed8; font-size:15px;">Career Assessment (Single Attempt)</b>
        <p style="margin:4px 0 0 0; color:#3b82f6; font-size:13px;">Select the options that best represent your technical preferences.</p>
      </div>
      <span style="background:#3b82f6; color:#fff; padding:6px 14px; border-radius:20px; font-weight:600; font-size:13px;">
        10 Questions
      </span>
    </section>

    <form id="career-assessment-form">
      <div style="display:flex; flex-direction:column; gap:20px;">
        ${DEFAULT_QUESTIONS
          .map(
            (q, idx) => `
          <div class="panel" style="background:#fff; border-radius:16px; padding:20px; border:1px solid #e2e8f0;">
            <h3 style="margin:0 0 14px 0; font-size:15px; color:#0f172a;">
              <span style="color:#ec4899; margin-right:8px;">Q${idx + 1}.</span> ${escCareer(q.question)}
            </h3>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:12px;">
              ${q.options
                .map(
                  (opt) => `
                <label style="display:flex; align-items:center; gap:10px; padding:12px 14px; border:1px solid #cbd5e1; border-radius:10px; cursor:pointer; background:#f8fafc; transition:all 0.2s;">
                  <input type="radio" name="question_${q.id}" value="${opt.track}" required style="accent-color:#ec4899;">
                  <span style="font-size:13px; color:#334155; font-weight:500;">${escCareer(opt.label)}</span>
                </label>
              `
                )
                .join("")}
            </div>
          </div>
        `
          )
          .join("")}
      </div>

      <div style="margin-top:24px; text-align:right;">
        <button type="submit" class="button pink" style="padding:12px 28px; font-size:15px; cursor:pointer;">
          Submit Assessment & See Results
        </button>
      </div>
    </form>
  `;
}

function calculateCareerRecommendation(formData) {
  const scores = {};
  for (const [key, track] of formData.entries()) {
    if (key.startsWith("question_")) {
      scores[track] = (scores[track] || 0) + 1;
    }
  }

  let topTrack = "Software Development";
  let maxScore = 0;

  for (const [track, count] of Object.entries(scores)) {
    if (count > maxScore) {
      maxScore = count;
      topTrack = track;
    }
  }

  const percentages = Math.round((maxScore / 10) * 100);

  return {
    track: topTrack,
    matchPercentage: percentages > 0 ? percentages : 80,
    skills:
      topTrack === "Data Science"
        ? "Python, SQL, Machine Learning, Data Analytics, Pandas"
        : topTrack === "Database Management"
        ? "MySQL, PostgreSQL, Query Optimization, Database Indexing"
        : topTrack === "UI/UX Design"
        ? "Figma, CSS3, Wireframing, User Research, Prototyping"
        : "JavaScript, React, Node.js, Express, REST APIs"
  };
}

async function renderCareerPage() {
  App.renderPage = renderCareerPage;

  const isAdmin = App.session && App.session.role === "admin";
  if (isAdmin) {
    renderAdminCareerDashboard();
  } else {
    renderStudentCareerPage();
  }
}

function setupCareerEvents() {
  const pageContent = document.getElementById("page-content");
  if (!pageContent) return;

  // 1. STUDENT FORM SUBMISSION
  pageContent.addEventListener("submit", async function (event) {
    if (event.target.id !== "career-assessment-form") return;
    event.preventDefault();

    const currentStudent = App.currentStudent ? App.currentStudent() : {};
    const studentId = currentStudent?.id || App.session?.studentId;

    const formData = new FormData(event.target);
    const result = calculateCareerRecommendation(formData);

    // Save Assessment State locally and globally
    saveAssessment(studentId, result);

    // Optional: Send result to backend API if available
    if (apiCareer && typeof apiCareer.request === "function") {
      try {
        await apiCareer.request("/api/career", {
          method: "POST",
          body: JSON.stringify({
            studentId: Number(studentId),
            recommendation: result.track,
            skills: result.skills,
            score: result.matchPercentage
          })
        });
      } catch (err) {
        console.warn("Backend career save endpoint fallback:", err);
      }
    }

    if (apiCareer && typeof apiCareer.toast === "function") {
      apiCareer.toast("Assessment submitted successfully!");
    }

    renderCareerPage();
  });

  // 2. CLICK EVENTS (REQUEST PERMISSION & ADMIN APPROVAL)
  pageContent.addEventListener("click", function (event) {
    // STUDENT REQUEST RETAKE
    if (event.target.id === "request-retake-btn") {
      const currentStudent = App.currentStudent ? App.currentStudent() : {};
      const studentId = currentStudent?.id || App.session?.studentId;

      requestRetakePermission(studentId);
      if (apiCareer && typeof apiCareer.toast === "function") {
        apiCareer.toast("Retake permission request sent to Admin.");
      }
      renderCareerPage();
    }

    // ADMIN APPROVE RETAKE / RESET
    const approveBtn = event.target.closest("[data-approve-retake]");
    if (approveBtn) {
      const targetStudentId = Number(approveBtn.dataset.approveRetake);
      resetStudentAssessment(targetStudentId);

      if (apiCareer && typeof apiCareer.toast === "function") {
        apiCareer.toast("Retake permission granted. Student assessment reset.");
      }
      renderCareerPage();
    }
  });
}

App.onReady(() => {
  App.renderPage = renderCareerPage;
  setupCareerEvents();
  renderCareerPage();
});