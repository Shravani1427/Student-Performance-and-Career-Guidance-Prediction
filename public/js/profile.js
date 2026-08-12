"use strict";

const apiProfile = window.AppApi;
const escProfile = (value) => (apiProfile && typeof apiProfile.escape === "function") 
  ? apiProfile.escape(value) 
  : String(value ?? "");

function renderProfilePage() {
  const root = document.getElementById("page-content");
  if (!root) return;

  const student = (window.App && typeof window.App.currentStudent === "function") 
    ? window.App.currentStudent() 
    : null;

  if (!student) {
    root.innerHTML = '<div class="empty" style="padding: 32px; text-align: center; color: #64748b;">Student profile record not found.</div>';
    return;
  }

  const initial = escProfile((student.name || "S").charAt(0).toUpperCase());

  root.innerHTML = `
    <style>
      .profile-wrapper {
        max-width: 900px;
        margin: 0 auto;
        padding: 8px 0 32px 0;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      }
      
      .profile-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
        overflow: hidden;
        margin-top: 16px;
      }

      /* Hero Banner Header */
      .profile-banner {
        background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%);
        border-bottom: 1px solid #e2e8f0;
        padding: 28px 32px;
        display: flex;
        align-items: center;
        gap: 24px;
      }

      .profile-avatar-large {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        font-weight: 800;
        box-shadow: 0 6px 16px rgba(236, 72, 153, 0.25);
        border: 3px solid #ffffff;
        flex-shrink: 0;
      }

      .profile-banner-info h2 {
        margin: 0;
        font-size: 22px;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: -0.3px;
      }

      .profile-banner-info p {
        margin: 4px 0 10px 0;
        color: #64748b;
        font-size: 14px;
        font-weight: 500;
      }

      .profile-tags {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .profile-tag {
        background: #ffffff;
        border: 1px solid #cbd5e1;
        color: #334155;
        font-size: 12px;
        font-weight: 600;
        padding: 3px 10px;
        border-radius: 20px;
      }

      .profile-tag.highlight {
        background: #eff6ff;
        border-color: #bfdbfe;
        color: #2563eb;
      }

      /* Form Body */
      .profile-form-body {
        padding: 32px;
      }

      .form-section-title {
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        color: #ec4899;
        margin-bottom: 18px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .form-section-title::after {
        content: '';
        flex: 1;
        height: 1px;
        background: #f1f5f9;
      }

      .profile-form-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
        margin-bottom: 28px;
      }

      .form-field {
        display: flex;
        flex-direction: column;
      }

      .form-field.full-width {
        grid-column: span 2;
      }

      .form-field label {
        font-size: 13px;
        font-weight: 600;
        color: #334155;
        margin-bottom: 6px;
      }

      .form-input {
        background: #ffffff;
        border: 1.5px solid #e2e8f0;
        border-radius: 10px;
        padding: 11px 14px;
        font-size: 14px;
        font-weight: 500;
        color: #0f172a;
        outline: none;
        transition: all 0.2s ease;
      }

      .form-input:hover {
        border-color: #cbd5e1;
      }

      .form-input:focus {
        border-color: #ec4899;
        box-shadow: 0 0 0 3.5px rgba(236, 72, 153, 0.12);
      }

      .form-input[readonly], .form-input[disabled] {
        background: #f8fafc;
        border-color: #e2e8f0;
        color: #64748b;
        cursor: not-allowed;
        font-weight: 600;
      }

      /* Actions */
      .form-actions-bar {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        padding-top: 20px;
        border-top: 1px solid #f1f5f9;
      }

      .btn-save-profile {
        background: linear-gradient(135deg, #ec4899 0%, #e11d48 100%);
        color: #ffffff;
        border: none;
        padding: 12px 32px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(236, 72, 153, 0.25);
        transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
      }

      .btn-save-profile:hover {
        opacity: 0.95;
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(236, 72, 153, 0.35);
      }

      .btn-save-profile:active {
        transform: translateY(0);
      }

      @media (max-width: 640px) {
        .profile-form-grid {
          grid-template-columns: 1fr;
        }
        .form-field.full-width {
          grid-column: span 1;
        }
        .profile-banner {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    </style>

    <div class="profile-wrapper">
      <div class="page-title">
        <div>
          <span class="eyebrow" style="color: #64748b; font-size: 13px; font-weight: 600;">Account Settings</span>
          <h1 style="font-size: 28px; font-weight: 800; margin: 4px 0 2px 0; color: #0f172a;">My Profile</h1>
          <p style="color: #64748b; font-size: 14px; margin: 0;">Manage your student identification and contact preferences.</p>
        </div>
      </div>

      <div class="profile-card">
        <!-- Hero Header -->
        <div class="profile-banner">
          <div class="profile-avatar-large">${initial}</div>
          <div class="profile-banner-info">
            <h2>${escProfile(student.name)}</h2>
            <p>${escProfile(student.email)}</p>
            <div class="profile-tags">
              <span class="profile-tag highlight">ID: ${escProfile(student.studentCode || "STU-000" + student.id)}</span>
              <span class="profile-tag">${escProfile(student.department || student.course || "Computer Engineering")}</span>
              <span class="profile-tag">Semester ${escProfile(student.semester || 1)}</span>
            </div>
          </div>
        </div>

        <!-- Editable Form -->
        <form id="profile-edit-form" class="profile-form-body">
          
          <div class="form-section-title">Personal Details</div>
          <div class="profile-form-grid">
            <div class="form-field">
              <label>Full Name</label>
              <input type="text" name="name" class="form-input" value="${escProfile(student.name)}" required />
            </div>

            <div class="form-field">
              <label>Email Address</label>
              <input type="email" name="email" class="form-input" value="${escProfile(student.email)}" required />
            </div>

            <div class="form-field">
              <label>Phone Number</label>
              <input type="tel" name="phone" class="form-input" value="${escProfile(student.phone || student.mobile || "")}" placeholder="Enter phone number" />
            </div>

            <div class="form-field">
              <label>Student ID (Read-only)</label>
              <input type="text" class="form-input" value="${escProfile(student.studentCode || "STU-000" + student.id)}" readonly />
            </div>
          </div>

          <div class="form-section-title">Academic Information</div>
          <div class="profile-form-grid">
            <div class="form-field">
              <label>Department / Program</label>
              <input type="text" name="course" class="form-input" value="${escProfile(student.department || student.course || "Computer Engineering")}" required />
            </div>

            <div class="form-field">
              <label>Current Semester</label>
              <input type="number" name="semester" min="1" max="8" class="form-input" value="${escProfile(student.semester || 1)}" required />
            </div>
          </div>

          <div class="form-actions-bar">
            <button type="submit" class="btn-save-profile">Save Changes</button>
          </div>

        </form>
      </div>
    </div>
  `;

  attachProfileFormListener();
}

function attachProfileFormListener() {
  const form = document.getElementById("profile-edit-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const updatedPayload = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      course: formData.get("course"),
      semester: Number(formData.get("semester")),
    };

    try {
      if (apiProfile && typeof apiProfile.request === "function") {
        await apiProfile.request("/api/students/profile", {
          method: "PUT",
          body: JSON.stringify(updatedPayload),
        });
      }

      // Update Local Storage User Object
      const savedUser = localStorage.getItem("auth_user") || localStorage.getItem("user");
      if (savedUser) {
        const userObj = JSON.parse(savedUser);
        userObj.name = updatedPayload.name;
        userObj.email = updatedPayload.email;
        localStorage.setItem("auth_user", JSON.stringify(userObj));
        localStorage.setItem("user", JSON.stringify(userObj));
      }

      // Toast feedback
      if (apiProfile && typeof apiProfile.toast === "function") {
        apiProfile.toast("Profile updated successfully!");
      }

      // Reload global state
      if (window.App && typeof window.App.reload === "function") {
        await window.App.reload("Profile updated successfully!");
      } else {
        renderProfilePage();
      }

    } catch (error) {
      console.error("Profile update error:", error);
      if (apiProfile && typeof apiProfile.toast === "function") {
        apiProfile.toast(error.message || "Failed to update profile", true);
      }
    }
  });
}

// Global initialization triggers
if (window.App && window.App.data) {
  window.App.renderPage = renderProfilePage;
  renderProfilePage();
} else if (window.App && typeof window.App.onReady === "function") {
  window.App.onReady(() => {
    window.App.renderPage = renderProfilePage;
    renderProfilePage();
  });
}