"use strict";

/*
=========================================================
 ADMIN SUBJECTS MANAGEMENT
=========================================================

 API:
 GET    /api/subjects
 GET    /api/subjects/:id
 POST   /api/subjects
 PUT    /api/subjects/:id
 DELETE /api/subjects/:id

 Frontend:
 http://localhost:3000

 Backend:
 http://localhost:5000
=========================================================
*/

(function () {

    /* =====================================================
       CONFIGURATION
    ===================================================== */

    const API_BASE_URL = "http://localhost:5000/api";
    const API_URL = API_BASE_URL + "/subjects";


    /* =====================================================
       STATE
    ===================================================== */

    let subjects = [];
    let filteredSubjects = [];


    /* =====================================================
       DOM
    ===================================================== */

    let form;
    let editId;

    let sName;
    let sCode;
    let sCategory;
    let sSemester;
    let sDepartment;
    let sCredits;
    let sStatus;
    let sDescription;

    let tObt;
    let tMax;
    let aObt;
    let aMax;
    let pObt;
    let pMax;

    let liveObt;
    let liveMax;
    let livePct;
    let liveGrade;

    let formTitle;
    let formMode;
    let saveBtn;

    let subjectTableBody;
    let subjectTableWrapper;

    let loadingState;
    let errorState;
    let emptyState;
    let errorMessage;

    let listMeta;
    let searchInput;
    let filterSemester;
    let filterStatus;
    let sortBy;

    let totalSubjects;
    let activeSubjects;
    let inactiveSubjects;
    let departmentCount;


    /* =====================================================
       INITIALIZE DOM REFERENCES (DYNAMIC SAFE)
    ===================================================== */

    function cacheDOM() {

        form = document.getElementById("subjectForm") || document.querySelector("form");
        editId = document.getElementById("editId") || document.getElementById("subjectId");

        sName = document.getElementById("sName") || document.getElementById("subjectName");
        sCode = document.getElementById("sCode") || document.getElementById("subjectCode");
        sSemester = document.getElementById("sSemester") || document.getElementById("semester");

        sCategory = document.getElementById("sCategory") || document.getElementById("category");
        sDepartment = document.getElementById("sDepartment") || document.getElementById("department");
        sCredits = document.getElementById("sCredits") || document.getElementById("credits");
        sStatus = document.getElementById("sStatus") || document.getElementById("status");
        sDescription = document.getElementById("sDescription") || document.getElementById("description");

        tObt = document.getElementById("tObt");
        tMax = document.getElementById("tMax") || document.getElementById("maxMarks");

        aObt = document.getElementById("aObt");
        aMax = document.getElementById("aMax");

        pObt = document.getElementById("pObt");
        pMax = document.getElementById("pMax");

        liveObt = document.getElementById("liveObt");
        liveMax = document.getElementById("liveMax");
        livePct = document.getElementById("livePct");
        liveGrade = document.getElementById("liveGrade");

        formTitle = document.getElementById("formTitle");
        formMode = document.getElementById("formMode");
        saveBtn = document.getElementById("saveBtn") || document.querySelector("button[type='submit']");

        subjectTableBody = document.getElementById("subjectTableBody") || document.getElementById("subjectsTableBody") || document.querySelector("tbody");
        subjectTableWrapper = document.getElementById("subjectTableWrapper");

        loadingState = document.getElementById("loadingState");
        errorState = document.getElementById("errorState");
        emptyState = document.getElementById("emptyState");
        errorMessage = document.getElementById("errorMessage");

        listMeta = document.getElementById("listMeta");
        searchInput = document.getElementById("searchInput");
        filterSemester = document.getElementById("filterSemester");
        filterStatus = document.getElementById("filterStatus");
        sortBy = document.getElementById("sortBy");

        totalSubjects = document.getElementById("totalSubjects");
        activeSubjects = document.getElementById("activeSubjects");
        inactiveSubjects = document.getElementById("inactiveSubjects");
        departmentCount = document.getElementById("departmentCount");
    }


    /* =====================================================
       INIT
    ===================================================== */

    async function init() {

        console.log("📚 Subject Admin initializing...");
        console.log("🔗 Subject API:", API_URL);

        cacheDOM();

        bindEvents();
        updateLiveMarks();

        await loadSubjects();
    }


    /* =====================================================
       EVENTS (DELEGATED TO DOCUMENT FOR SPA / LAYOUT.JS COMPATIBILITY)
    ===================================================== */

    function bindEvents() {

        // GLOBAL SUBMIT LISTENER: Catches submit events regardless of layout.js re-renders
        document.addEventListener("submit", function (event) {
            if (event.target && (event.target.id === "subjectForm" || event.target.tagName === "FORM")) {
                handleSubmit(event);
            }
        });

        // GLOBAL CLICK LISTENER: Handles buttons dynamically
        document.addEventListener("click", function (event) {

            // Reset / Cancel Button
            const resetBtn = event.target.closest("#resetBtn, #cancelSubjectBtn");
            if (resetBtn) {
                resetForm();
                return;
            }

            // Refresh / Retry Buttons
            const refreshBtn = event.target.closest("#refreshBtn, #retryBtn");
            if (refreshBtn) {
                loadSubjects();
                return;
            }

            // Scroll to Form / Add Subject Button
            const scrollAddBtn = event.target.closest("#scrollAddBtn, #addSubjectBtn");
            if (scrollAddBtn) {
                cacheDOM();
                const card = document.getElementById("subjectFormCard") || document.getElementById("subjectFormContainer") || form;
                if (card) {
                    card.scrollIntoView({ behavior: "smooth", block: "start" });
                }
                setTimeout(function () {
                    if (sName && typeof sName.focus === "function") sName.focus();
                }, 400);
                return;
            }

            // Table Actions (Edit & Delete buttons)
            if (event.target.closest("#subjectTableBody, #subjectsTableBody, tbody")) {
                handleTableClick(event);
            }
        });

        // Dynamic Input Change Listeners for Live Marks
        document.addEventListener("input", function (event) {
            if (["tObt", "tMax", "aObt", "aMax", "pObt", "pMax", "maxMarks"].includes(event.target.id)) {
                cacheDOM();
                updateLiveMarks();
            }

            if (event.target.id === "searchInput") {
                applyFilters();
            }
        });

        document.addEventListener("change", function (event) {
            if (["filterSemester", "filterStatus", "sortBy"].includes(event.target.id)) {
                applyFilters();
            }
        });
    }


    /* =====================================================
       API REQUEST
    ===================================================== */

    async function apiRequest(url, options) {
        options = options || {};

        console.log("🌐 API Request:", options.method || "GET", url);

        let response;

        try {
            response = await fetch(url, {
                method: options.method || "GET",
                headers: {
                    "Accept": "application/json",
                    ...(options.body ? { "Content-Type": "application/json" } : {}),
                    ...(options.headers || {})
                },
                body: options.body || undefined
            });
        } catch (error) {
            console.error("❌ Network error:", error);
            throw new Error("Cannot connect to backend. Make sure Node.js is running on port 5000.");
        }

        const text = await response.text();
        let data = null;

        if (text) {
            try {
                data = JSON.parse(text);
            } catch (error) {
                console.error("❌ Invalid JSON response:", text);
                throw new Error("Backend returned an invalid response.");
            }
        }

        if (!response.ok) {
            throw new Error(data && data.message ? data.message : "HTTP " + response.status);
        }

        return data;
    }


    /* =====================================================
       LOAD SUBJECTS
    ===================================================== */

    async function loadSubjects() {
        showLoading();

        try {
            const data = await apiRequest(API_URL, { method: "GET" });
            console.log("✅ Subjects API response:", data);

            if (!data || (data.success !== undefined && !data.success)) {
                throw new Error(data && data.message ? data.message : "Failed to load subjects.");
            }

            if (Array.isArray(data.subjects)) {
                subjects = data.subjects;
            } else if (Array.isArray(data.data)) {
                subjects = data.data;
            } else if (Array.isArray(data)) {
                subjects = data;
            } else {
                subjects = [];
            }

            console.log("✅ Subjects loaded:", subjects.length);

            updateKPIs();
            applyFilters();

        } catch (error) {
            console.error("❌ Load subjects error:", error);
            showError(error.message || "Unable to load subjects.");
        }
    }


    /* =====================================================
       ADD / UPDATE
    ===================================================== */

    async function handleSubmit(event) {
        if (event && typeof event.preventDefault === "function") {
            event.preventDefault();
        }

        // Always refresh DOM bindings in case SPA re-inserted elements
        cacheDOM();

        const payload = getFormData();

        if (!payload.name) {
            showToast("Subject name is required.", "error");
            if (sName && typeof sName.focus === "function") sName.focus();
            return;
        }

        if (!payload.code) {
            showToast("Subject code is required.", "error");
            if (sCode && typeof sCode.focus === "function") sCode.focus();
            return;
        }

        if (!payload.semester) {
            showToast("Please select a semester.", "error");
            if (sSemester && typeof sSemester.focus === "function") sSemester.focus();
            return;
        }

        const id = editId ? editId.value.trim() : "";
        const editing = Boolean(id);
        const url = editing ? API_URL + "/" + encodeURIComponent(id) : API_URL;

        try {
            setSaving(true);

            const data = await apiRequest(url, {
                method: editing ? "PUT" : "POST",
                body: JSON.stringify(payload)
            });

            console.log("✅ Save response:", data);

            if (!data || (data.success !== undefined && !data.success)) {
                throw new Error(data && data.message ? data.message : "Unable to save subject.");
            }

            showToast(editing ? "Subject updated successfully." : "Subject added successfully.", "success");

            resetForm();
            await loadSubjects();

        } catch (error) {
            console.error("❌ Save subject error:", error);
            showToast(error.message || "Failed to save subject.", "error");
        } finally {
            setSaving(false);
        }
    }


    /* =====================================================
       GET FORM DATA
    ===================================================== */

    function getFormData() {
        cacheDOM();

        return {
            name: sName ? sName.value.trim() : "",
            code: sCode ? sCode.value.trim().toUpperCase() : "",
            category: sCategory ? sCategory.value : "Core",
            semester: sSemester ? Number(sSemester.value) : 0,
            department: sDepartment ? sDepartment.value.trim() : "General",
            credits: sCredits ? numberValue(sCredits.value, 0) : 0,
            status: sStatus ? sStatus.value : "active",
            description: sDescription ? sDescription.value.trim() : "",
            theory_obt: tObt ? numberValue(tObt.value, 0) : 0,
            theory_max: tMax ? numberValue(tMax.value, 100) : 100,
            assignment_obt: aObt ? numberValue(aObt.value, 0) : 0,
            assignment_max: aMax ? numberValue(aMax.value, 25) : 25,
            practical_obt: pObt ? numberValue(pObt.value, 0) : 0,
            practical_max: pMax ? numberValue(pMax.value, 50) : 50
        };
    }


    /* =====================================================
       EDIT
    ===================================================== */

    async function editSubject(id) {
        try {
            const data = await apiRequest(API_URL + "/" + encodeURIComponent(id), { method: "GET" });

            if (!data || (data.success !== undefined && !data.success)) {
                throw new Error(data && data.message ? data.message : "Subject not found.");
            }

            const subject = data.subject || data.data || data;

            if (!subject) {
                throw new Error("Subject data was not returned.");
            }

            cacheDOM();

            if (editId) editId.value = subject.id || "";
            if (sName) sName.value = subject.name || "";
            if (sCode) sCode.value = subject.code || "";
            if (sCategory) sCategory.value = subject.category || "Core";
            if (sSemester) sSemester.value = subject.semester ? String(subject.semester) : "";
            if (sDepartment) sDepartment.value = subject.department || "";
            if (sCredits) sCredits.value = subject.credits ?? 0;
            if (sStatus) sStatus.value = subject.status || "active";
            if (sDescription) sDescription.value = subject.description || "";

            if (tObt) tObt.value = subject.theory_obt ?? 0;
            if (tMax) tMax.value = subject.theory_max ?? 100;
            if (aObt) aObt.value = subject.assignment_obt ?? 0;
            if (aMax) aMax.value = subject.assignment_max ?? 25;
            if (pObt) pObt.value = subject.practical_obt ?? 0;
            if (pMax) pMax.value = subject.practical_max ?? 50;

            if (formTitle) formTitle.textContent = "Edit Subject";
            if (formMode) formMode.textContent = "Editing";
            if (saveBtn) saveBtn.textContent = "Update Subject";

            updateLiveMarks();

            const card = document.getElementById("subjectFormCard") || document.getElementById("subjectFormContainer") || form;
            if (card) {
                card.scrollIntoView({ behavior: "smooth", block: "start" });
            }

            setTimeout(function () {
                if (sName && typeof sName.focus === "function") sName.focus();
            }, 400);

        } catch (error) {
            console.error("❌ Edit subject error:", error);
            showToast(error.message || "Failed to load subject.", "error");
        }
    }


    /* =====================================================
       DELETE
    ===================================================== */

    async function deleteSubject(id) {
        const subject = subjects.find(function (item) {
            return Number(item.id) === Number(id);
        });

        const name = subject ? subject.name : "this subject";

        if (!window.confirm('Are you sure you want to delete "' + name + '"?')) {
            return;
        }

        try {
            const data = await apiRequest(API_URL + "/" + encodeURIComponent(id), { method: "DELETE" });

            if (!data || (data.success !== undefined && !data.success)) {
                throw new Error(data && data.message ? data.message : "Failed to delete subject.");
            }

            showToast("Subject deleted successfully.", "success");
            await loadSubjects();

        } catch (error) {
            console.error("❌ Delete subject error:", error);
            showToast(error.message || "Failed to delete subject.", "error");
        }
    }


    /* =====================================================
       TABLE CLICK
    ===================================================== */

    function handleTableClick(event) {
        const editButton = event.target.closest("[data-edit]");
        if (editButton) {
            editSubject(editButton.dataset.edit);
            return;
        }

        const deleteButton = event.target.closest("[data-delete]");
        if (deleteButton) {
            deleteSubject(deleteButton.dataset.delete);
        }
    }


    /* =====================================================
       FILTERS
    ===================================================== */

    function applyFilters() {
        cacheDOM();

        const search = searchInput ? searchInput.value.trim().toLowerCase() : "";
        const semester = filterSemester ? filterSemester.value : "";
        const status = filterStatus ? filterStatus.value : "";

        filteredSubjects = subjects.filter(function (subject) {
            const name = String(subject.name || "").toLowerCase();
            const code = String(subject.code || "").toLowerCase();
            const department = String(subject.department || "").toLowerCase();
            const subjectSemester = String(subject.semester || "");
            const subjectStatus = String(subject.status || "active").toLowerCase();

            const matchesSearch = !search || name.includes(search) || code.includes(search) || department.includes(search);
            const matchesSemester = !semester || subjectSemester === semester;
            const matchesStatus = !status || subjectStatus === status.toLowerCase();

            return matchesSearch && matchesSemester && matchesStatus;
        });

        sortSubjects(filteredSubjects);
        renderSubjects(filteredSubjects);
    }


    /* =====================================================
       SORT
    ===================================================== */

    function sortSubjects(list) {
        const sort = sortBy ? sortBy.value : "recent";

        if (sort === "name") {
            list.sort(function (a, b) {
                return String(a.name || "").localeCompare(String(b.name || ""));
            });
            return;
        }

        if (sort === "semester") {
            list.sort(function (a, b) {
                return Number(a.semester || 0) - Number(b.semester || 0);
            });
            return;
        }

        if (sort === "high") {
            list.sort(function (a, b) {
                return calculatePercentage(b) - calculatePercentage(a);
            });
            return;
        }

        if (sort === "low") {
            list.sort(function (a, b) {
                return calculatePercentage(a) - calculatePercentage(b);
            });
            return;
        }

        list.sort(function (a, b) {
            return Number(b.id || 0) - Number(a.id || 0);
        });
    }


    /* =====================================================
       RENDER
    ===================================================== */

    function renderSubjects(list) {
        cacheDOM();

        if (loadingState) loadingState.classList.add("hidden");
        if (errorState) errorState.classList.add("hidden");

        if (listMeta) {
            listMeta.textContent = list.length + " subject" + (list.length === 1 ? "" : "s");
        }

        if (!list.length) {
            if (subjectTableWrapper) subjectTableWrapper.classList.add("hidden");
            if (emptyState) emptyState.classList.remove("hidden");
            if (subjectTableBody) subjectTableBody.innerHTML = "";
            return;
        }

        if (emptyState) emptyState.classList.add("hidden");
        if (subjectTableWrapper) subjectTableWrapper.classList.remove("hidden");

        if (subjectTableBody) {
            subjectTableBody.innerHTML = list.map(function (subject, index) {
                return createRow(subject, index);
            }).join("");
        }
    }


    /* =====================================================
       TABLE ROW
    ===================================================== */

    function createRow(subject, index) {
        const percentage = calculatePercentage(subject);
        const status = String(subject.status || "active").toLowerCase();
        const statusClass = status === "active" ? "status-active" : "status-inactive";
        const statusText = status === "active" ? "Active" : "Inactive";
        const id = escapeHTML(String(subject.id || ""));

        return `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <div class="subject-name">${escapeHTML(subject.name || "—")}</div>
                </td>
                <td>
                    <span class="subject-code">${escapeHTML(subject.code || "—")}</span>
                </td>
                <td>
                    <span class="category-badge">${escapeHTML(subject.category || "Core")}</span>
                </td>
                <td>Semester ${escapeHTML(String(subject.semester || "—"))}</td>
                <td>${escapeHTML(subject.department || "—")}</td>
                <td>
                    <div class="marks-cell">
                        <strong>${formatNumber(getTotalObtained(subject))}</strong>
                        <small>/ ${formatNumber(getTotalMaximum(subject))} (${percentage}%)</small>
                    </div>
                </td>
                <td>${formatNumber(subject.credits || 0)}</td>
                <td>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
                <td>
                    <div class="table-actions">
                        <button type="button" class="action-btn action-edit" data-edit="${id}" title="Edit Subject">✏️</button>
                        <button type="button" class="action-btn action-delete" data-delete="${id}" title="Delete Subject">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }


    /* =====================================================
       LIVE MARKS
    ===================================================== */

    function updateLiveMarks() {
        cacheDOM();

        const theoryObt = safeNumber(tObt ? tObt.value : 0);
        const theoryMax = safeNumber(tMax ? tMax.value : 100, 100);
        const assignmentObt = safeNumber(aObt ? aObt.value : 0);
        const assignmentMax = safeNumber(aMax ? aMax.value : 25, 25);
        const practicalObt = safeNumber(pObt ? pObt.value : 0);
        const practicalMax = safeNumber(pMax ? pMax.value : 50, 50);

        const obtained = theoryObt + assignmentObt + practicalObt;
        const maximum = theoryMax + assignmentMax + practicalMax;
        const percentage = maximum > 0 ? (obtained / maximum) * 100 : 0;

        if (liveObt) liveObt.textContent = formatNumber(obtained);
        if (liveMax) liveMax.textContent = formatNumber(maximum);
        if (livePct) livePct.textContent = percentage.toFixed(1) + "%";
        if (liveGrade) liveGrade.textContent = calculateGrade(percentage);
    }


    /* =====================================================
       KPI
    ===================================================== */

    function updateKPIs() {
        cacheDOM();

        const total = subjects.length;

        const active = subjects.filter(function (subject) {
            return String(subject.status || "active").toLowerCase() === "active";
        }).length;

        const inactive = subjects.filter(function (subject) {
            return String(subject.status || "").toLowerCase() === "inactive";
        }).length;

        const departments = new Set(
            subjects.map(function (subject) {
                return String(subject.department || "").trim().toLowerCase();
            }).filter(Boolean)
        ).size;

        if (totalSubjects) totalSubjects.textContent = total;
        if (activeSubjects) activeSubjects.textContent = active;
        if (inactiveSubjects) inactiveSubjects.textContent = inactive;
        if (departmentCount) departmentCount.textContent = departments;
    }


    /* =====================================================
       RESET
    ===================================================== */

    function resetForm() {
        cacheDOM();

        if (form && typeof form.reset === "function") {
            form.reset();
        }

        if (editId) editId.value = "";
        if (sCategory) sCategory.value = "Core";
        if (sStatus) sStatus.value = "active";
        if (sCredits) sCredits.value = "0";
        if (tObt) tObt.value = "0";
        if (tMax) tMax.value = "100";
        if (aObt) aObt.value = "0";
        if (aMax) aMax.value = "25";
        if (pObt) pObt.value = "0";
        if (pMax) pMax.value = "50";

        if (formTitle) formTitle.textContent = "Add a Subject";
        if (formMode) formMode.textContent = "New entry";
        if (saveBtn) saveBtn.textContent = "Save Subject";

        updateLiveMarks();
    }


    /* =====================================================
       LOADING & ERROR
    ===================================================== */

    function showLoading() {
        cacheDOM();
        if (loadingState) loadingState.classList.remove("hidden");
        if (errorState) errorState.classList.add("hidden");
        if (emptyState) emptyState.classList.add("hidden");
        if (subjectTableWrapper) subjectTableWrapper.classList.add("hidden");
    }

    function showError(message) {
        cacheDOM();
        if (loadingState) loadingState.classList.add("hidden");
        if (subjectTableWrapper) subjectTableWrapper.classList.add("hidden");
        if (emptyState) emptyState.classList.add("hidden");
        if (errorState) errorState.classList.remove("hidden");
        if (errorMessage) errorMessage.textContent = message;
    }


    /* =====================================================
       SAVING
    ===================================================== */

    function setSaving(isSaving) {
        cacheDOM();
        if (!saveBtn) return;

        saveBtn.disabled = isSaving;

        if (isSaving) {
            saveBtn.textContent = "Saving...";
        } else {
            saveBtn.textContent = editId && editId.value ? "Update Subject" : "Save Subject";
        }
    }


    /* =====================================================
       NUMBER HELPERS
    ===================================================== */

    function numberValue(value, fallback) {
        const number = Number(value);
        return Number.isFinite(number) ? number : (fallback ?? 0);
    }

    function safeNumber(value, fallback) {
        const number = Number(value);
        return Number.isFinite(number) ? number : (fallback ?? 0);
    }


    /* =====================================================
       TOTALS & PERCENTAGES
    ===================================================== */

    function getTotalObtained(subject) {
        return (
            safeNumber(subject.theory_obt, 0) +
            safeNumber(subject.assignment_obt, 0) +
            safeNumber(subject.practical_obt, 0)
        );
    }

    function getTotalMaximum(subject) {
        return (
            safeNumber(subject.theory_max, 100) +
            safeNumber(subject.assignment_max, 25) +
            safeNumber(subject.practical_max, 50)
        );
    }

    function calculatePercentage(subject) {
        const obtained = getTotalObtained(subject);
        const maximum = getTotalMaximum(subject);

        if (maximum <= 0) return 0;
        return Number(((obtained / maximum) * 100).toFixed(1));
    }

    function calculateGrade(percentage) {
        if (percentage >= 90) return "A+";
        if (percentage >= 80) return "A";
        if (percentage >= 70) return "B+";
        if (percentage >= 60) return "B";
        if (percentage >= 50) return "C";
        if (percentage >= 40) return "D";
        return "F";
    }

    function formatNumber(number) {
        const n = Number(number);
        if (!Number.isFinite(n)) return "0";
        return Number.isInteger(n) ? String(n) : n.toFixed(2);
    }

    function escapeHTML(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =====================================================
       TOAST
    ===================================================== */

    function showToast(message, type) {
        type = type || "success";

        let toast = document.querySelector(".sa-toast");

        if (!toast) {
            toast = document.createElement("div");
            toast.className = "sa-toast";
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.className = "sa-toast " + type;

        requestAnimationFrame(function () {
            toast.classList.add("show");
        });

        clearTimeout(toast._timer);
        toast._timer = setTimeout(function () {
            toast.classList.remove("show");
        }, 3000);
    }


    /* =====================================================
       START
    ===================================================== */

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();