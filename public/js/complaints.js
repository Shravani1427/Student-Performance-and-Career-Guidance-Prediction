"use strict";

const apiComplaints = window.AppApi;
const escComplaints = (value) =>
  apiComplaints && typeof apiComplaints.escape === "function"
    ? apiComplaints.escape(value)
    : String(value ?? "").replace(/[&<>'"]/g, "");

// Helper to get stored complaints or fallback data
function getStoredComplaints() {
  try {
    const data = localStorage.getItem("system_complaints");
    if (data) return JSON.parse(data);
  } catch (e) {}

  return [
    {
      id: 1,
      studentId: 2,
      studentName: "Purvesh Dilip More",
      category: "Attendance",
      subject: "my attendance has not been marked yet",
      description: "my attendance has not been marked yet",
      status: "resolved",
      adminReply: "Your attendance record has been verified and updated successfully.",
      createdAt: "Submitted: 11 Aug 2026, 10:47 pm"
    }
  ];
}

function saveComplaints(complaints) {
  try {
    localStorage.setItem("system_complaints", JSON.stringify(complaints));
  } catch (e) {}
}

/* =========================================================
   ADD COMPLAINT MODAL (DYNAMIC POPUP WITH "OTHER" OPTION)
========================================================= */
function openComplaintModal() {
  document.getElementById("complaint-modal")?.remove();

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "complaint-modal";

  modal.innerHTML = `
    <div class="modal-card">
      <button class="close-modal" data-action="close-complaint-modal" type="button">×</button>
      
      <span class="eyebrow">SUPPORT</span>
      <h2>Submit a Complaint</h2>
      <p>Report an issue or concern directly to the administration.</p>

      <form id="student-complaint-form" class="form-grid">
        <label>
          <span>Category</span>
          <select name="category" id="complaint-category-select" required>
            <option value="Attendance">Attendance</option>
            <option value="Performance & Marks">Performance & Marks</option>
            <option value="Career Guidance">Career Guidance</option>
            <option value="Account & Login">Account & Login</option>
            <option value="Other">Other (Specify Below)</option>
          </select>
        </label>

        <label>
          <span>Subject / Issue</span>
          <input name="subject" type="text" placeholder="Brief issue title" required>
        </label>

        <!-- Dynamic Other Category Input (Hidden by default) -->
        <label id="other-category-wrap" style="display:none; grid-column: span 2;">
          <span>Specify Other Problem Category</span>
          <input name="otherCategory" type="text" placeholder="Type your custom problem category...">
        </label>

        <label style="grid-column: span 2;">
          <span>Detailed Description</span>
          <textarea name="description" rows="3" placeholder="Explain your concern in detail..." required style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; font-family:inherit;"></textarea>
        </label>

        <button class="button pink form-submit" type="submit">Submit Complaint</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  // Toggle "Other Category" input field visibility
  document.getElementById("complaint-category-select")?.addEventListener("change", function (e) {
    const otherWrap = document.getElementById("other-category-wrap");
    if (otherWrap) {
      if (e.target.value === "Other") {
        otherWrap.style.display = "block";
        otherWrap.querySelector("input").required = true;
      } else {
        otherWrap.style.display = "none";
        otherWrap.querySelector("input").required = false;
      }
    }
  });
}

function closeComplaintModal() {
  document.getElementById("complaint-modal")?.remove();
}

/* =========================================================
   RENDER COMPLAINTS PAGE
========================================================= */
async function renderComplaintsPage() {
  App.renderPage = renderComplaintsPage;

  const pageContent = document.getElementById("page-content");
  if (!pageContent) return;

  const isAdmin = App.session && App.session.role === "admin";
  const currentStudent = App.currentStudent ? App.currentStudent() : {};
  const currentStudentId = currentStudent?.id || App.session?.studentId;

  let complaints = getStoredComplaints();

  // Try live API fetch
  try {
    const response = await apiComplaints.request("/api/complaints");
    const fetched = response?.data || response?.complaints || response;
    if (Array.isArray(fetched) && fetched.length > 0) {
      complaints = fetched;
      saveComplaints(complaints);
    }
  } catch (e) {}

  // Filter complaints based on role
  const displayComplaints = isAdmin
    ? complaints
    : complaints.filter((c) => Number(c.studentId) === Number(currentStudentId));

  // =========================================================
  // ADMIN VIEW
  // =========================================================
  if (isAdmin) {
    pageContent.innerHTML = `
      <div class="page-title">
        <div>
          <span class="eyebrow">SUPPORT CENTER</span>
          <h1>Student Complaints</h1>
          <p>Review student concerns and submit resolutions.</p>
        </div>
        <span class="pill good">${displayComplaints.length} Complaint${displayComplaints.length === 1 ? "" : "s"}</span>
      </div>

      <section class="panel recent">
        <div class="panel-head">
          <div>
            <h2>All Complaints</h2>
            <p>Manage and resolve issues submitted by students.</p>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:16px; padding:10px 0;">
          ${
            displayComplaints.length === 0
              ? `<div style="padding:20px; text-align:center;">No complaints found.</div>`
              : displayComplaints
                  .map((c) => {
                    const statusStr = String(c.status || "pending").toLowerCase();
                    const isResolved = statusStr === "resolved";

                    return `
              <div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:20px;">
                <div style="display:flex; gap:8px; align-items:center; margin-bottom:10px;">
                  <span class="pill">${escComplaints(c.category || "General")}</span>
                  <span class="pill ${isResolved ? "good" : "focus"}">${escComplaints(statusStr)}</span>
                </div>

                <h3 style="margin:0 0 4px 0; font-size:16px;">${escComplaints(c.subject || c.title || "")}</h3>
                <p style="margin:0 0 10px 0; color:#64748b; font-size:13px;">${escComplaints(c.description || "")}</p>
                <small style="color:#94a3b8; display:block; margin-bottom:12px;">Submitted by: ${escComplaints(c.studentName || "Student")}</small>

                <form class="admin-resolve-form" data-complaint-id="${c.id}" style="display:flex; flex-direction:column; gap:10px; background:#f8fafc; padding:12px; border-radius:8px; border:1px solid #e2e8f0;">
                  <textarea name="adminReply" placeholder="Write resolution message for student..." rows="2" style="width:100%; padding:8px; border-radius:6px; border:1px solid #cbd5e1; font-size:13px; font-family:inherit;">${escComplaints(c.adminReply || "")}</textarea>
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <select name="status" style="padding:6px 10px; border-radius:6px; border:1px solid #cbd5e1; font-size:12px;">
                      <option value="resolved" ${isResolved ? "selected" : ""}>Resolved</option>
                      <option value="pending" ${!isResolved ? "selected" : ""}>Pending</option>
                    </select>
                    <button type="submit" class="button pink form-submit">Save Resolution</button>
                  </div>
                </form>
              </div>
            `;
                  })
                  .join("")
          }
        </div>
      </section>
    `;
    return;
  }

  // =========================================================
  // STUDENT VIEW (EXACT NATIVE THEME & CSS)
  // =========================================================
  pageContent.innerHTML = `
    <div class="page-title">
      <div>
        <span class="eyebrow">SUPPORT</span>
        <h1>My Complaints</h1>
        <p>Report any issue you face with performance, career guidance, login, registration, or anything else.</p>
      </div>
      <button class="button pink" data-action="open-complaint-modal" type="button">Submit a Complaint</button>
    </div>

    <section class="panel recent">
      <div class="panel-head">
        <div>
          <h2>My Submitted Complaints</h2>
          <p>You can see the status and admin reply below.</p>
        </div>
        <span class="pill good">${displayComplaints.length} complaint${displayComplaints.length === 1 ? "" : "s"}</span>
      </div>

      <div style="display:flex; flex-direction:column; gap:16px; padding:10px 0;">
        ${
          displayComplaints.length === 0
            ? `<div style="padding:20px; text-align:center;">No complaints submitted yet.</div>`
            : displayComplaints
                .map((c) => {
                  const statusStr = String(c.status || "pending").toLowerCase();
                  const isResolved = statusStr === "resolved";

                  return `
            <div style="background:#fafafa; border:1px solid #f1f1f1; border-radius:12px; padding:20px;">
              <div style="display:flex; gap:8px; align-items:center; margin-bottom:12px;">
                <span class="pill" style="background:#e0f2fe; color:#0284c7;">${escComplaints(c.category || "General")}</span>
                <span class="pill ${isResolved ? "good" : "focus"}">${escComplaints(statusStr)}</span>
              </div>

              <h3 style="margin:0 0 6px 0; font-size:15px; color:#1e293b;">${escComplaints(c.subject || c.title || "")}</h3>
              <p style="margin:0 0 12px 0; color:#64748b; font-size:13px;">${escComplaints(c.description || "")}</p>
              <small style="color:#94a3b8; font-size:12px; display:block;">${c.createdAt || "Submitted: 11 Aug 2026, 10:47 pm"}</small>

              <!-- ADMIN REPLY (IF AVAILABLE) -->
              ${
                c.adminReply
                  ? `
                <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:12px; border-radius:8px; margin-top:14px;">
                  <b style="color:#166534; font-size:12px; display:block; margin-bottom:4px;">Admin Reply:</b>
                  <p style="margin:0; font-size:13px; color:#15803d;">${escComplaints(c.adminReply)}</p>
                </div>
              `
                  : ""
              }
            </div>
          `;
                })
                .join("")
        }
      </div>
    </section>
  `;
}

/* =========================================================
   EVENTS SETUP
========================================================= */
function setupComplaintsEvents() {
  // Modal Trigger Clicks
  document.addEventListener("click", function (event) {
    const actionBtn = event.target.closest("[data-action]");
    if (actionBtn) {
      const action = actionBtn.dataset.action;
      if (action === "open-complaint-modal") {
        openComplaintModal();
        return;
      }
      if (action === "close-complaint-modal") {
        closeComplaintModal();
        return;
      }
    }
  });

  // Form Submissions
  document.addEventListener("submit", async function (event) {
    // 1. STUDENT SUBMIT COMPLAINT
    if (event.target.id === "student-complaint-form") {
      event.preventDefault();

      const currentStudent = App.currentStudent ? App.currentStudent() : {};
      const formData = new FormData(event.target);

      let selectedCategory = formData.get("category");
      if (selectedCategory === "Other") {
        selectedCategory = formData.get("otherCategory") || "Other Problem";
      }

      const newComplaint = {
        id: Date.now(),
        studentId: currentStudent?.id || App.session?.studentId || 2,
        studentName: currentStudent?.name || App.session?.userName || "Student",
        category: selectedCategory,
        subject: formData.get("subject"),
        description: formData.get("description"),
        status: "pending",
        adminReply: "",
        createdAt: "Submitted: " + new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      };

      const complaints = getStoredComplaints();
      complaints.unshift(newComplaint);
      saveComplaints(complaints);

      try {
        await apiComplaints.request("/api/complaints", {
          method: "POST",
          body: JSON.stringify(newComplaint)
        });
      } catch (e) {}

      if (apiComplaints && typeof apiComplaints.toast === "function") {
        apiComplaints.toast("Complaint submitted successfully.");
      }

      closeComplaintModal();
      renderComplaintsPage();
    }

    // 2. ADMIN RESOLVE COMPLAINT
    if (event.target.classList.contains("admin-resolve-form")) {
      event.preventDefault();

      const complaintId = Number(event.target.dataset.complaintId);
      const formData = new FormData(event.target);

      const complaints = getStoredComplaints();
      const target = complaints.find((c) => Number(c.id) === complaintId);

      if (target) {
        target.adminReply = formData.get("adminReply");
        target.status = formData.get("status");
        saveComplaints(complaints);

        try {
          await apiComplaints.request(`/api/complaints/${complaintId}`, {
            method: "PATCH",
            body: JSON.stringify({
              adminReply: target.adminReply,
              status: target.status
            })
          });
        } catch (e) {}

        if (apiComplaints && typeof apiComplaints.toast === "function") {
          apiComplaints.toast("Complaint status updated!");
        }

        renderComplaintsPage();
      }
    }
  });
}

App.onReady(() => {
  App.renderPage = renderComplaintsPage;
  setupComplaintsEvents();
  renderComplaintsPage();
});