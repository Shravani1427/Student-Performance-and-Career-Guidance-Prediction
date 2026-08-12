"use strict";

(function () {

```
const API_BASE_URL = "http://localhost:5000/api";
const API_URL = `${API_BASE_URL}/subjects`;

let subjects = [];
let filteredSubjects = [];

function $(id) {
    return document.getElementById(id);
}

const form = $("subjectForm");
const editId = $("editId");

const sName = $("sName");
const sCode = $("sCode");
const sCategory = $("sCategory");
const sSemester = $("sSemester");
const sDepartment = $("sDepartment");
const sCredits = $("sCredits");
const sStatus = $("sStatus");
const sDescription = $("sDescription");

const tObt = $("tObt");
const tMax = $("tMax");
const aObt = $("aObt");
const aMax = $("aMax");
const pObt = $("pObt");
const pMax = $("pMax");

const liveObt = $("liveObt");
const liveMax = $("liveMax");
const livePct = $("livePct");
const liveGrade = $("liveGrade");

const formTitle = $("formTitle");
const formMode = $("formMode");
const saveBtn = $("saveBtn");

const subjectTableBody = $("subjectTableBody");
const subjectTableWrapper = $("subjectTableWrapper");

const loadingState = $("loadingState");
const errorState = $("errorState");
const emptyState = $("emptyState");
const errorMessage = $("errorMessage");

const listMeta = $("listMeta");
const searchInput = $("searchInput");
const filterSemester = $("filterSemester");
const filterStatus = $("filterStatus");
const sortBy = $("sortBy");

const totalSubjects = $("totalSubjects");
const activeSubjects = $("activeSubjects");
const inactiveSubjects = $("inactiveSubjects");
const departmentCount = $("departmentCount");


document.addEventListener("DOMContentLoaded", init);


async function init() {

    console.log("📚 Subject Admin initializing...");
    console.log("🔗 Subject API:", API_URL);

    if (!form) {
        console.error("❌ subjectForm not found.");
        return;
    }

    bindEvents();
    updateLiveMarks();
    await loadSubjects();
}


function bindEvents() {

    form.addEventListener("submit", handleSubmit);

    const resetBtn = $("resetBtn");

    if (resetBtn) {
        resetBtn.addEventListener("click", resetForm);
    }

    const refreshBtn = $("refreshBtn");

    if (refreshBtn) {
        refreshBtn.addEventListener("click", loadSubjects);
    }

    const retryBtn = $("retryBtn");

    if (retryBtn) {
        retryBtn.addEventListener("click", loadSubjects);
    }

    const scrollAddBtn = $("scrollAddBtn");

    if (scrollAddBtn) {

        scrollAddBtn.addEventListener("click", function () {

            const card = $("subjectFormCard");

            if (card) {

                card.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

            setTimeout(function () {

                if (sName) {
                    sName.focus();
                }

            }, 400);

        });

    }

    [
        tObt,
        tMax,
        aObt,
        aMax,
        pObt,
        pMax
    ].forEach(function (input) {

        if (input) {
            input.addEventListener("input", updateLiveMarks);
        }

    });

    if (searchInput) {
        searchInput.addEventListener("input", applyFilters);
    }

    if (filterSemester) {
        filterSemester.addEventListener("change", applyFilters);
    }

    if (filterStatus) {
        filterStatus.addEventListener("change", applyFilters);
    }

    if (sortBy) {
        sortBy.addEventListener("change", applyFilters);
    }

    if (subjectTableBody) {

        subjectTableBody.addEventListener(
            "click",
            handleTableClick
        );

    }

}


async function apiRequest(url, options = {}) {

    console.log(
        "🌐 API Request:",
        options.method || "GET",
        url
    );

    let response;

    try {

        response = await fetch(url, {
            ...options,

            headers: {
                Accept: "application/json",

                ...(options.body
                    ? {
                        "Content-Type":
                            "application/json"
                    }
                    : {}),

                ...(options.headers || {})
            }
        });

    } catch (error) {

        console.error("❌ Network error:", error);

        throw new Error(
            "Cannot connect to backend at " +
            API_BASE_URL +
            ". Make sure Node.js server is running."
        );

    }

    const text = await response.text();

    let data = null;

    if (text) {

        try {

            data = JSON.parse(text);

        } catch (error) {

            console.error(
                "❌ Non JSON response:",
                text.substring(0, 500)
            );

            throw new Error(
                `Server returned non-JSON response (${response.status}).`
            );

        }

    }

    if (!response.ok) {

        throw new Error(
            data && data.message
                ? data.message
                : `HTTP ${response.status}`
        );

    }

    return data;
}


async function loadSubjects() {

    showLoading();

    try {

        const data = await apiRequest(API_URL);

        console.log(
            "✅ Subjects API response:",
            data
        );

        if (!data || !data.success) {

            throw new Error(
                data && data.message
                    ? data.message
                    : "Failed to load subjects"
            );

        }

        subjects = Array.isArray(data.subjects)
            ? data.subjects
            : Array.isArray(data.data)
                ? data.data
                : [];

        console.log(
            `✅ ${subjects.length} subject(s) loaded`
        );

        updateKPIs();
        applyFilters();

    } catch (error) {

        console.error(
            "❌ Load subjects:",
            error
        );

        showError(
            error.message ||
            "Unable to connect to backend."
        );

    }

}


async function handleSubmit(event) {

    event.preventDefault();

    const payload = getFormData();

    if (!payload.name) {
        showToast("Subject name is required.", "error");
        sName?.focus();
        return;
    }

    if (!payload.code) {
        showToast("Subject code is required.", "error");
        sCode?.focus();
        return;
    }

    if (!payload.semester) {
        showToast("Semester is required.", "error");
        sSemester?.focus();
        return;
    }

    if (!payload.department) {
        showToast("Department is required.", "error");
        sDepartment?.focus();
        return;
    }

    if (
        payload.theory_obt > payload.theory_max ||
        payload.assignment_obt > payload.assignment_max ||
        payload.practical_obt > payload.practical_max
    ) {

        showToast(
            "Obtained marks cannot exceed maximum marks.",
            "error"
        );

        return;
    }

    const id = editId
        ? editId.value.trim()
        : "";

    const isEdit = Boolean(id);

    const url = isEdit
        ? `${API_URL}/${encodeURIComponent(id)}`
        : API_URL;

    try {

        setSaving(true);

        const data = await apiRequest(url, {
            method: isEdit ? "PUT" : "POST",
            body: JSON.stringify(payload)
        });

        console.log(
            "✅ Save subject response:",
            data
        );

        if (!data || !data.success) {

            throw new Error(
                data && data.message
                    ? data.message
                    : "Failed to save subject"
            );

        }

        showToast(
            isEdit
                ? "Subject updated successfully."
                : "Subject added successfully.",
            "success"
        );

        resetForm();

        await loadSubjects();

    } catch (error) {

        console.error(
            "❌ Save subject:",
            error
        );

        showToast(
            error.message ||
            "Failed to save subject.",
            "error"
        );

    } finally {

        setSaving(false);

    }

}


function getFormData() {

    return {

        name: sName
            ? sName.value.trim()
            : "",

        code: sCode
            ? sCode.value.trim().toUpperCase()
            : "",

        category: sCategory
            ? sCategory.value
            : "Core",

        semester: sSemester
            ? Number(sSemester.value)
            : 0,

        department: sDepartment
            ? sDepartment.value.trim()
            : "",

        credits: numberValue(
            sCredits
                ? sCredits.value
                : 0
        ),

        status: sStatus
            ? sStatus.value
            : "active",

        description: sDescription
            ? sDescription.value.trim()
            : "",

        theory_obt: numberValue(
            tObt
                ? tObt.value
                : 0
        ),

        theory_max: numberValue(
            tMax
                ? tMax.value
                : 100
        ),

        assignment_obt: numberValue(
            aObt
                ? aObt.value
                : 0
        ),

        assignment_max: numberValue(
            aMax
                ? aMax.value
                : 25
        ),

        practical_obt: numberValue(
            pObt
                ? pObt.value
                : 0
        ),

        practical_max: numberValue(
            pMax
                ? pMax.value
                : 50
        )

    };

}


async function editSubject(id) {

    try {

        const data = await apiRequest(
            `${API_URL}/${encodeURIComponent(id)}`
        );

        if (!data || !data.success) {

            throw new Error(
                data && data.message
                    ? data.message
                    : "Failed to get subject"
            );

        }

        const subject =
            data.subject ||
            data.data;

        if (!subject) {
            throw new Error(
                "Subject data was not returned."
            );
        }

        if (editId) {
            editId.value = subject.id || "";
        }

        if (sName) {
            sName.value = subject.name || "";
        }

        if (sCode) {
            sCode.value = subject.code || "";
        }

        if (sCategory) {
            sCategory.value =
                subject.category || "Core";
        }

        if (sSemester) {
            sSemester.value =
                String(subject.semester || "");
        }

        if (sDepartment) {
            sDepartment.value =
                subject.department || "";
        }

        if (sCredits) {
            sCredits.value =
                subject.credits ?? 0;
        }

        if (sStatus) {
            sStatus.value =
                subject.status || "active";
        }

        if (sDescription) {
            sDescription.value =
                subject.description || "";
        }

        if (tObt) {
            tObt.value =
                subject.theory_obt ?? 0;
        }

        if (tMax) {
            tMax.value =
                subject.theory_max ?? 100;
        }

        if (aObt) {
            aObt.value =
                subject.assignment_obt ?? 0;
        }

        if (aMax) {
            aMax.value =
                subject.assignment_max ?? 25;
        }

        if (pObt) {
            pObt.value =
                subject.practical_obt ?? 0;
        }

        if (pMax) {
            pMax.value =
                subject.practical_max ?? 50;
        }

        if (formTitle) {
            formTitle.textContent =
                "Edit Subject";
        }

        if (formMode) {
            formMode.textContent =
                "Editing";
        }

        if (saveBtn) {
            saveBtn.textContent =
                "Update Subject";
        }

        updateLiveMarks();

        const card = $("subjectFormCard");

        if (card) {

            card.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

        setTimeout(function () {

            sName?.focus();

        }, 400);

    } catch (error) {

        console.error(
            "❌ Edit subject:",
            error
        );

        showToast(
            error.message ||
            "Failed to load subject.",
            "error"
        );

    }

}


async function deleteSubject(id) {

    const subject =
        subjects.find(function (item) {

            return Number(item.id) === Number(id);

        });

    const subjectName =
        subject
            ? subject.name
            : "this subject";

    if (
        !window.confirm(
            `Are you sure you want to delete "${subjectName}"?`
        )
    ) {
        return;
    }

    try {

        const data = await apiRequest(
            `${API_URL}/${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        if (!data || !data.success) {

            throw new Error(
                data && data.message
                    ? data.message
                    : "Failed to delete subject"
            );

        }

        showToast(
            "Subject deleted successfully.",
            "success"
        );

        await loadSubjects();

    } catch (error) {

        console.error(
            "❌ Delete subject:",
            error
        );

        showToast(
            error.message ||
            "Failed to delete subject.",
            "error"
        );

    }

}


function handleTableClick(event) {

    const editButton =
        event.target.closest("[data-edit]");

    if (editButton) {

        editSubject(
            editButton.dataset.edit
        );

        return;
    }

    const deleteButton =
        event.target.closest("[data-delete]");

    if (deleteButton) {

        deleteSubject(
            deleteButton.dataset.delete
        );

    }

}


function applyFilters() {

    const search =
        searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

    const semester =
        filterSemester
            ? filterSemester.value
            : "";

    const status =
        filterStatus
            ? filterStatus.value
            : "";

    filteredSubjects =
        subjects.filter(function (subject) {

            const matchesSearch =
                !search ||

                String(subject.name || "")
                    .toLowerCase()
                    .includes(search) ||

                String(subject.code || "")
                    .toLowerCase()
                    .includes(search) ||

                String(subject.department || "")
                    .toLowerCase()
                    .includes(search);

            const matchesSemester =
                !semester ||
                String(subject.semester || "") === semester;

            const matchesStatus =
                !status ||
                String(subject.status || "")
                    .toLowerCase() ===
                status.toLowerCase();

            return (
                matchesSearch &&
                matchesSemester &&
                matchesStatus
            );

        });

    sortSubjects(filteredSubjects);

    renderSubjects(filteredSubjects);
}


function sortSubjects(list) {

    const sort =
        sortBy
            ? sortBy.value
            : "recent";

    if (sort === "name") {

        list.sort(function (a, b) {

            return String(a.name || "")
                .localeCompare(
                    String(b.name || "")
                );

        });

        return;
    }

    if (sort === "semester") {

        list.sort(function (a, b) {

            return Number(a.semester || 0) -
                Number(b.semester || 0);

        });

        return;
    }

    if (sort === "high") {

        list.sort(function (a, b) {

            return calculatePercentage(b) -
                calculatePercentage(a);

        });

        return;
    }

    if (sort === "low") {

        list.sort(function (a, b) {

            return calculatePercentage(a) -
                calculatePercentage(b);

        });

        return;
    }

    list.sort(function (a, b) {

        return Number(b.id || 0) -
            Number(a.id || 0);

    });

}


function renderSubjects(list) {

    loadingState?.classList.add("hidden");
    errorState?.classList.add("hidden");

    if (listMeta) {

        listMeta.textContent =
            `${list.length} subject${list.length === 1 ? "" : "s"}`;

    }

    if (!list.length) {

        subjectTableWrapper?.classList.add("hidden");
        emptyState?.classList.remove("hidden");

        return;
    }

    emptyState?.classList.add("hidden");
    subjectTableWrapper?.classList.remove("hidden");

    if (subjectTableBody) {

        subjectTableBody.innerHTML =
            list.map(function (subject, index) {

                return createRow(
                    subject,
                    index
                );

            }).join("");

    }

}


function createRow(subject, index) {

    const percentage =
        calculatePercentage(subject);

    const status =
        String(subject.status || "active")
            .toLowerCase();

    const statusClass =
        status === "active"
            ? "status-active"
            : "status-inactive";

    const statusText =
        status === "active"
            ? "Active"
            : "Inactive";

    return `

        <tr>

            <td>${index + 1}</td>

            <td>
                <div class="subject-name">
                    ${escapeHTML(subject.name || "—")}
                </div>
            </td>

            <td>
                <span class="subject-code">
                    ${escapeHTML(subject.code || "—")}
                </span>
            </td>

            <td>
                <span class="category-badge">
                    ${escapeHTML(subject.category || "Core")}
                </span>
            </td>

            <td>
                Semester ${escapeHTML(
                    String(subject.semester || "—")
                )}
            </td>

            <td>
                ${escapeHTML(
                    subject.department || "—"
                )}
            </td>

            <td>

                <div class="marks-cell">

                    <strong>
                        ${formatNumber(
                            getTotalObtained(subject)
                        )}
                    </strong>

                    <small>
                        /
                        ${formatNumber(
                            getTotalMaximum(subject)
                        )}
                        (${percentage}%)
                    </small>

                </div>

            </td>

            <td>
                ${formatNumber(
                    subject.credits || 0
                )}
            </td>

            <td>

                <span
                    class="status-badge ${statusClass}"
                >
                    ${statusText}
                </span>

            </td>

            <td>

                <div class="table-actions">

                    <button
                        type="button"
                        class="action-btn action-edit"
                        data-edit="${escapeHTML(subject.id)}"
                        title="Edit Subject"
                    >
                        ✏️
                    </button>

                    <button
                        type="button"
                        class="action-btn action-delete"
                        data-delete="${escapeHTML(subject.id)}"
                        title="Delete Subject"
                    >
                        🗑️
                    </button>

                </div>

            </td>

        </tr>

    `;

}


function updateLiveMarks() {

    const theoryObt =
        safeNumber(tObt?.value, 0);

    const theoryMax =
        safeNumber(tMax?.value, 100);

    const assignmentObt =
        safeNumber(aObt?.value, 0);

    const assignmentMax =
        safeNumber(aMax?.value, 25);

    const practicalObt =
        safeNumber(pObt?.value, 0);

    const practicalMax =
        safeNumber(pMax?.value, 50);

    const obtained =
        theoryObt +
        assignmentObt +
        practicalObt;

    const maximum =
        theoryMax +
        assignmentMax +
        practicalMax;

    const percentage =
        maximum > 0
            ? obtained / maximum * 100
            : 0;

    if (liveObt) {
        liveObt.textContent =
            formatNumber(obtained);
    }

    if (liveMax) {
        liveMax.textContent =
            formatNumber(maximum);
    }

    if (livePct) {
        livePct.textContent =
            `${percentage.toFixed(1)}%`;
    }

    if (liveGrade) {
        liveGrade.textContent =
            calculateGrade(percentage);
    }

}


function updateKPIs() {

    const total =
        subjects.length;

    const active =
        subjects.filter(function (subject) {

            return String(subject.status || "")
                .toLowerCase() === "active";

        }).length;

    const inactive =
        subjects.filter(function (subject) {

            return String(subject.status || "")
                .toLowerCase() === "inactive";

        }).length;

    const departments =
        new Set(
            subjects
                .map(function (subject) {

                    return String(
                        subject.department || ""
                    )
                        .trim()
                        .toLowerCase();

                })
                .filter(Boolean)
        ).size;

    if (totalSubjects) {
        totalSubjects.textContent = total;
    }

    if (activeSubjects) {
        activeSubjects.textContent = active;
    }

    if (inactiveSubjects) {
        inactiveSubjects.textContent = inactive;
    }

    if (departmentCount) {
        departmentCount.textContent = departments;
    }

}


function resetForm() {

    form?.reset();

    if (editId) {
        editId.value = "";
    }

    if (sCategory) {
        sCategory.value = "Core";
    }

    if (sStatus) {
        sStatus.value = "active";
    }

    if (sCredits) {
        sCredits.value = "0";
    }

    if (tObt) {
        tObt.value = "0";
    }

    if (tMax) {
        tMax.value = "100";
    }

    if (aObt) {
        aObt.value = "0";
    }

    if (aMax) {
        aMax.value = "25";
    }

    if (pObt) {
        pObt.value = "0";
    }

    if (pMax) {
        pMax.value = "50";
    }

    if (formTitle) {
        formTitle.textContent = "Add a Subject";
    }

    if (formMode) {
        formMode.textContent = "New entry";
    }

    if (saveBtn) {
        saveBtn.textContent = "Save Subject";
    }

    updateLiveMarks();

}


function showLoading() {

    loadingState?.classList.remove("hidden");
    errorState?.classList.add("hidden");
    emptyState?.classList.add("hidden");
    subjectTableWrapper?.classList.add("hidden");

}


function showError(message) {

    loadingState?.classList.add("hidden");
    subjectTableWrapper?.classList.add("hidden");
    emptyState?.classList.add("hidden");
    errorState?.classList.remove("hidden");

    if (errorMessage) {
        errorMessage.textContent = message;
    }

}


function setSaving(isSaving) {

    if (!saveBtn) {
        return;
    }

    saveBtn.disabled = isSaving;

    if (isSaving) {

        saveBtn.textContent =
            "Saving...";

    } else {

        saveBtn.textContent =
            editId?.value
                ? "Update Subject"
                : "Save Subject";

    }

}


function numberValue(value, fallback = 0) {

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;

}


function safeNumber(value, fallback = 0) {

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;

}


function getTotalObtained(subject) {

    return (
        safeNumber(subject.theory_obt) +
        safeNumber(subject.assignment_obt) +
        safeNumber(subject.practical_obt)
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

    const obtained =
        getTotalObtained(subject);

    const maximum =
        getTotalMaximum(subject);

    if (maximum <= 0) {
        return 0;
    }

    return Number(
        (
            obtained /
            maximum *
            100
        ).toFixed(1)
    );

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

    if (!Number.isFinite(n)) {
        return "0";
    }

    return Number.isInteger(n)
        ? String(n)
        : n.toFixed(2);

}


function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function showToast(
    message,
    type = "success"
) {

    let toast =
        document.querySelector(".sa-toast");

    if (!toast) {

        toast =
            document.createElement("div");

        toast.className =
            "sa-toast";

        document.body.appendChild(toast);

    }

    toast.textContent = message;

    toast.className =
        `sa-toast ${type}`;

    requestAnimationFrame(function () {

        toast.classList.add("show");

    });

    clearTimeout(toast._timer);

    toast._timer =
        setTimeout(function () {

            toast.classList.remove("show");

        }, 3000);

}
```

})();
