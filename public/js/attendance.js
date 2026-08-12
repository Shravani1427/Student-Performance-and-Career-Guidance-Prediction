"use strict";

const apiAttendance = window.AppApi;
const escAttendance = (value) =>
  apiAttendance && typeof apiAttendance.escape === "function"
    ? apiAttendance.escape(value)
    : String(value ?? "").replace(/[&<>'"]/g, "");

/* =====================================================
   PERSISTENT STORAGE HELPERS (DAILY ATTENDANCE)
===================================================== */
function getPersistentAttendance(studentId) {
  try {
    const key = `persistent_daily_attendance_${studentId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

function savePersistentAttendance(studentId, records) {
  try {
    const key = `persistent_daily_attendance_${studentId}`;
    localStorage.setItem(key, JSON.stringify(records));
  } catch (e) {
    console.warn("Could not save to localStorage:", e);
  }
}

/* =====================================================
   SEARCHABLE STUDENT SELECTOR COMPONENT (FOR ADMIN)
===================================================== */
function attendanceStudentSelector(currentStudent) {
  if (App.session && App.session.role !== "admin") return "";

  const students = (App.data && Array.isArray(App.data.students)) ? App.data.students : [];
  if (students.length === 0) return "";

  const options = students
    .map(
      (item) =>
        `<option value="${item.id}" ${
          Number(item.id) === Number(currentStudent.id) ? "selected" : ""
        }>${escAttendance(item.name)}</option>`
    )
    .join("");

  return `
    <div class="student-search-container" style="display: flex; gap: 10px; align-items: center; margin-left: auto;">
      <input 
        type="text" 
        id="attendance-student-search-input" 
        placeholder="🔍 Search student..." 
        style="padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; outline: none; font-size: 14px; width: 180px; background: #ffffff;"
      >
      <select id="student-selector" style="padding: 8px 12px; border-radius: 8px; border: 1px solid #3b82f6; outline: none; font-size: 14px; font-weight: 600; background: #ffffff; cursor: pointer; color: #1e293b;">
        ${options}
      </select>
    </div>
  `;
}

/* =====================================================
   RENDER DAILY ATTENDANCE PAGE
===================================================== */
async function renderAttendancePage() {
  const student = App.currentStudent ? App.currentStudent() : null;

  if (!student) {
    document.getElementById("page-content").innerHTML =
      '<div class="empty">Student record not found.</div>';
    return;
  }

  // 1. Fetch Daily Attendance Records (Backend API + Persistent LocalStorage Fallback)
  let attendanceRecords = getPersistentAttendance(student.id);

  try {
    const response = await apiAttendance.request(`/api/attendance?studentId=${student.id}`);
    const fetched = response?.data || response?.attendance || response;
    if (Array.isArray(fetched) && fetched.length > 0) {
      attendanceRecords = fetched;
      savePersistentAttendance(student.id, fetched);
    }
  } catch (err) {
    console.warn("Using local persistent daily attendance records.");
  }

  student.attendanceRows = attendanceRecords;

  // 2. Calculate Stats
  const totalDays = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(
    (r) => String(r.status).toLowerCase() === "present"
  ).length;
  const absentCount = totalDays - presentCount;
  const percentage = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

  const isAdmin = App.session && App.session.role === "admin";

  // 3. Admin Form (Daily Attendance without Subject Dropdown)
  const adminForm = isAdmin
    ? `<section class="panel recent" style="margin-top:24px;">
          <div class="panel-head">
            <div>
              <h2>Mark Daily Attendance</h2>
              <p>Admin can mark full-day attendance for students.</p>
            </div>
          </div>
          <form id="attendance-form" class="form-grid">
            <label>
              <span>Student</span>
              <select name="studentId" id="attendance-student" style="padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1;">
                ${(App.data && Array.isArray(App.data.students) ? App.data.students : [student])
                  .map(
                    (item) =>
                      `<option value="${item.id}" ${
                        Number(item.id) === Number(student.id) ? "selected" : ""
                      }>${escAttendance(item.name)}</option>`
                  )
                  .join("")}
              </select>
            </label>
            <label>
              <span>Attendance Date</span>
              <input name="attendanceDate" type="date" value="${new Date()
                .toISOString()
                .slice(0, 10)}" required style="padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1;">
            </label>
            <label>
              <span>Day Status</span>
              <select name="status" style="padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1;">
                <option value="present">Present (Full Day)</option>
                <option value="absent">Absent</option>
              </select>
            </label>
            <button class="button pink form-submit">Save Day Attendance</button>
          </form>
        </section>`
    : "";

  // 4. Render Main HTML
  document.getElementById("page-content").innerHTML = `
  <div class="page-title" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px;">
    <div>
      <span class="eyebrow">${isAdmin ? "Administration" : "My academics"}</span>
      <h1>${isAdmin ? `Daily Attendance · ${escAttendance(student.name)}` : "My Daily Attendance"}</h1>
      <p>Overall day-level college attendance summary and history.</p>
    </div>
    ${attendanceStudentSelector(student)}
  </div>

  <section class="attendance-banner">
    <div>
      <span class="eyebrow" style="color:#b7d3ff">Daily Attendance Health</span>
      <h2>${percentage}% <small>overall attendance</small></h2>
      <div class="progress"><b style="width:${percentage}%;background:linear-gradient(90deg,#ff70ae,#f9b6d4)"></b></div>
      <p>${presentCount} present days out of ${totalDays} total working days.</p>
    </div>
    <div class="attendance-counts">
      <span><b>${totalDays}</b><small>Total Days</small></span>
      <span><b>${presentCount}</b><small>Present Days</small></span>
      <span><b>${absentCount}</b><small>Absent Days</small></span>
    </div>
  </section>

  <div class="grid-two">
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>Attendance Chart</h2>
          <p>Present vs Absent Days</p>
        </div>
      </div>
      <div class="chart-box-wrap tall">
        <canvas id="attendance-chart"></canvas>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>Daily History</h2>
          <p>Recent attendance entries</p>
        </div>
      </div>

      <div class="record-list">
        ${
          attendanceRecords.length === 0
            ? '<div class="empty" style="padding:20px;text-align:center;color:#888;">No daily attendance records marked yet.</div>'
            : attendanceRecords
                .slice(-9)
                .reverse()
                .map((row) => {
                  const statusLower = String(row.status).toLowerCase();

                  return `<div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #f1f5f9;">
                    <div style="display:flex; align-items:center; gap:12px;">
                      <span class="record-status ${statusLower}" style="width:28px; height:28px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; background:${statusLower === "present" ? "#dcfce7" : "#ffe4e6"}; color:${statusLower === "present" ? "#166534" : "#991b1b"}">
                        ${statusLower === "present" ? "✓" : "×"}
                      </span>
                      <div>
                        <b>Full Day Attendance</b>
                        <small style="display:block; color:#64748b; font-size:12px;">📅 ${row.date || row.attendanceDate}</small>
                      </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:12px;">
                      <strong style="color:${statusLower === "present" ? "#16a34a" : "#dc2626"}; text-transform:capitalize;">${row.status}</strong>
                      ${
                        isAdmin
                          ? `<button class="table-button delete-button" data-delete-attendance="${row.id}" style="padding:4px 8px; font-size:11px; background:#ef4444; color:#fff; border:none; border-radius:4px; cursor:pointer;">Delete</button>`
                          : ""
                      }
                    </div>
                  </div>`;
                })
                .join("")
        }
      </div>
    </section>
  </div>
  ${adminForm}`;

  // 5. Render Chart
  if (typeof ChartTools !== "undefined") {
    ChartTools.clear();
    ChartTools.draw(
      "attendance-chart",
      "doughnut",
      ["Present Days", "Absent Days"],
      [presentCount, absentCount],
      ["#2563eb", "#fce7f3"]
    );
  }
}

/* =====================================================
   EVENT LISTENERS
===================================================== */
App.onReady(() => {
  App.renderPage = renderAttendancePage;
  renderAttendancePage();

  const pageContent = document.getElementById("page-content");
  if (!pageContent) return;

  // 1. Live Student Search Input
  pageContent.addEventListener("input", function (event) {
    if (event.target.id === "attendance-student-search-input") {
      const searchTerm = event.target.value.toLowerCase().trim();
      const selector = document.getElementById("student-selector");

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
              renderAttendancePage();
            }
          }
        }
      }
    }
  });

  // 2. Switch Student Selector Dropdown
  pageContent.addEventListener("change", async (event) => {
    if (event.target.id === "student-selector" || event.target.id === "attendance-student") {
      const chosenId = Number(event.target.value);
      if (window.App) {
        window.App.selectedStudentId = chosenId;
        if (typeof window.App.chooseStudent === "function") {
          window.App.chooseStudent(chosenId);
        } else {
          renderAttendancePage();
        }
      }
    }
  });

  // 3. Save Daily Attendance Form
  pageContent.addEventListener("submit", async (event) => {
    if (event.target.id !== "attendance-form") return;
    event.preventDefault();

    const formData = Object.fromEntries(new FormData(event.target).entries());
    const student = App.currentStudent ? App.currentStudent() : { id: Number(formData.studentId) };

    const newRecord = {
      id: Date.now(),
      studentId: Number(formData.studentId),
      date: formData.attendanceDate || new Date().toISOString().slice(0, 10),
      status: formData.status
    };

    const existing = getPersistentAttendance(student.id);

    // Replace if record exists for same date, or push new
    const updated = existing.filter((r) => (r.date || r.attendanceDate) !== newRecord.date);
    updated.push(newRecord);
    savePersistentAttendance(student.id, updated);

    try {
      await apiAttendance.request("/api/attendance", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      if (apiAttendance && typeof apiAttendance.toast === "function") {
        apiAttendance.toast("Daily attendance saved!");
      }
    } catch (error) {
      if (apiAttendance && typeof apiAttendance.toast === "function") {
        apiAttendance.toast("Daily attendance saved locally.");
      }
    }

    renderAttendancePage();
  });

  // 4. Delete Record Button
  pageContent.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-delete-attendance]");
    if (!button || !window.confirm("Delete this day record?")) return;

    const recordId = Number(button.dataset.deleteAttendance);
    const student = App.currentStudent ? App.currentStudent() : {};

    let existing = getPersistentAttendance(student.id);
    existing = existing.filter((r) => Number(r.id) !== recordId);
    savePersistentAttendance(student.id, existing);

    try {
      await apiAttendance.request(`/api/attendance/${recordId}`, {
        method: "DELETE",
      });
    } catch (error) {}

    if (apiAttendance && typeof apiAttendance.toast === "function") {
      apiAttendance.toast("Attendance record deleted.");
    }

    renderAttendancePage();
  });
});