"use strict";

(function () {

    // =====================================================
    // API
    // =====================================================

    const api = window.AppApi;

    const page =
        document.documentElement.dataset.page ||
        "dashboard";

    const requiredRole =
        document.documentElement.dataset.role ||
        "any";


    // =====================================================
    // NAVIGATION
    // =====================================================

    const adminLinks = [
        ["admin-dashboard", "Dashboard", "⌂", "/admin-dashboard.html"],
        ["students", "Students", "♙", "/students.html"],
        ["subjects", "Subjects", "▦", "/admin-subjects.html"],
        ["attendance", "Attendance", "◔", "/attendance.html"],
        ["performance", "Performance", "▥", "/performance.html"],
        ["career", "Career Guidance", "◎", "/career.html"],
        ["complaints", "Complaints", "✉", "/complaints.html"],
        ["reports", "Reports", "▤", "/reports.html"]
    ];


    const studentLinks = [
        ["student-dashboard", "Dashboard", "⌂", "/student-dashboard.html"],
        ["profile", "My Profile", "◉", "/profile.html"],
        ["subjects", "My Subjects", "▦", "/subjects.html"],
        ["attendance", "My Attendance", "◔", "/attendance.html"],
        ["performance", "My Performance", "▥", "/performance.html"],
        ["career", "Career Guidance", "◎", "/career.html"],
        ["complaints", "Complaints", "✉", "/complaints.html"]
    ];


    // =====================================================
    // HELPERS
    // =====================================================

    function getUser() {
        try {
            const savedUser =
                localStorage.getItem("auth_user") ||
                localStorage.getItem("user");

            if (!savedUser) return null;
            return JSON.parse(savedUser);
        } catch (error) {
            console.error("Invalid user data:", error);
            return null;
        }
    }


    function escapeHtml(value) {
        if (api && typeof api.escape === "function") {
            return api.escape(String(value ?? ""));
        }
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function getActivePage() {
        if (page === "admin-dashboard" || page === "student-dashboard") {
            return "dashboard";
        }
        return page;
    }


    function calculatePercentage(obtained, total) {
        const obtainedNumber = Number(obtained || 0);
        const totalNumber = Number(total || 0);

        if (totalNumber <= 0) return 0;

        return Math.round((obtainedNumber / totalNumber) * 100 * 100) / 100;
    }


    function getGrade(value) {
        const percentage = Number(value || 0);
        if (percentage >= 90) return "A+";
        if (percentage >= 80) return "A";
        if (percentage >= 70) return "B+";
        if (percentage >= 60) return "B";
        if (percentage >= 40) return "C";
        return "F";
    }


    function getPerformanceLevel(value) {
        const percentage = Number(value || 0);
        if (percentage >= 90) return "Excellent";
        if (percentage >= 75) return "Very Good";
        if (percentage >= 60) return "Good";
        if (percentage >= 40) return "Average";
        return "Needs Improvement";
    }


    // =====================================================
    // LOAD GLOBAL SYSTEM SUBJECTS
    // =====================================================

    async function loadAllSubjects() {
        try {
            console.log("API REQUEST: GET /api/subjects");
            const response = await api.request("/api/subjects");
            const list = response?.subjects || response?.data || (Array.isArray(response) ? response : []);
            console.log("Loaded global subjects:", list);
            return Array.isArray(list) ? list : [];
        } catch (error) {
            console.warn("Could not fetch /api/subjects:", error);
            return [];
        }
    }


    // =====================================================
    // LOAD STUDENT PROFILE
    // =====================================================

    async function loadStudentProfile() {
        try {
            console.log("API REQUEST: GET /api/students/profile");
            const response = await api.request("/api/students/profile");
            return response?.data || response?.student || response?.profile || response || null;
        } catch (error) {
            console.error("Student profile API error:", error);
            return null;
        }
    }


    // =====================================================
    // LOAD PERFORMANCE
    // =====================================================

    async function loadStudentPerformance(studentId) {
        try {
            let endpoint = "/api/performance";
            if (studentId) {
                endpoint += "?studentId=" + encodeURIComponent(studentId);
            }
            console.log("API REQUEST: GET", endpoint);
            const response = await api.request(endpoint);
            return response?.performance || response?.data || [];
        } catch (error) {
            console.error("Performance API error:", error);
            return [];
        }
    }


    // =====================================================
    // LOAD ANALYTICS
    // =====================================================

    async function loadAnalytics(studentId) {
        if (!studentId) return null;
        try {
            const response = await api.request("/api/performance/analytics/" + encodeURIComponent(studentId));
            return response?.data || response?.analytics || response || null;
        } catch (error) {
            console.error("Analytics API error:", error);
            return null;
        }
    }


    // =====================================================
    // BUILD SUBJECTS
    // =====================================================

    function buildSubjects(performanceRows) {
        if (!Array.isArray(performanceRows)) return [];

        return performanceRows.map(function (item) {
            const obtained = Number(item.marks_obtained ?? item.marksObtained ?? 0);
            const total = Number(item.total_marks ?? item.totalMarks ?? 100);
            const percentage = calculatePercentage(obtained, total);

            return {
                id: Number(item.id || item.subject_id || item.subjectId || 0),
                name: item.subject_name || item.subjectName || "Subject",
                code: item.subject_code || item.subjectCode || ("SUB-" + String(item.id || "")),
                semester: Number(item.semester || 1),
                academicYear: item.academic_year || item.academicYear || "",
                total: total,
                obtained: obtained,
                internal: Number(item.internal_marks ?? item.internalMarks ?? 0),
                practical: Number(item.practical_marks ?? item.practicalMarks ?? 0),
                assignment: Number(item.assignment_marks ?? item.assignmentMarks ?? 0),
                percentage: percentage,
                attendance: Number(item.attendance || 0)
            };
        });
    }


    // =====================================================
    // BUILD PERFORMANCE SUMMARY
    // =====================================================

    function buildPerformanceSummary(subjects) {
        if (!Array.isArray(subjects)) subjects = [];

        const totalMarks = subjects.reduce((sum, item) => sum + Number(item.total || 0), 0);
        const obtainedMarks = subjects.reduce((sum, item) => sum + Number(item.obtained || 0), 0);
        const percentage = calculatePercentage(obtainedMarks, totalMarks);
        const average = subjects.length > 0 ? Math.round(obtainedMarks / subjects.length) : 0;

        return {
            totalMarks: totalMarks,
            obtainedMarks: obtainedMarks,
            percentage: percentage,
            average: average,
            level: getPerformanceLevel(percentage),
            grade: getGrade(percentage)
        };
    }


    // =====================================================
    // BUILD ATTENDANCE
    // =====================================================

    function buildAttendance(subjects) {
        if (!Array.isArray(subjects)) subjects = [];

        const total = subjects.length;
        const present = subjects.filter((item) => Number(item.attendance || 0) >= 75).length;
        const absent = subjects.filter((item) => Number(item.attendance || 0) < 75).length;
        const attendanceSum = subjects.reduce((sum, item) => sum + Number(item.attendance || 0), 0);
        const percentage = total > 0 ? Math.round(attendanceSum / total) : 0;

        return {
            total: total,
            present: present,
            absent: absent,
            percentage: percentage
        };
    }


    function buildAttendanceRows(subjects) {
        if (!Array.isArray(subjects)) return [];
        return subjects.map((item) => ({
            id: item.id,
            subjectId: item.id,
            date: new Date().toISOString(),
            status: Number(item.attendance || 0) >= 75 ? "present" : "absent"
        }));
    }


    // =====================================================
    // BUILD STUDENT
    // =====================================================

    function buildStudent(baseStudent, profile, performanceRows, analytics) {
        const base = baseStudent || {};
        const profileData = profile || {};
        const subjects = buildSubjects(performanceRows);
        const calculatedPerformance = buildPerformanceSummary(subjects);
        const calculatedAttendance = buildAttendance(subjects);

        const percentage = analytics && analytics.percentage !== undefined
            ? Number(analytics.percentage)
            : calculatedPerformance.percentage;

        const performance = {
            totalMarks: calculatedPerformance.totalMarks,
            obtainedMarks: calculatedPerformance.obtainedMarks,
            percentage: percentage,
            average: calculatedPerformance.average,
            level: getPerformanceLevel(percentage),
            grade: analytics && analytics.grade ? analytics.grade : calculatedPerformance.grade
        };

        const studentId = Number(profileData.id || profileData.student_id || base.id || base.student_id || 0);

        return {
            id: studentId,
            studentCode: "STU-" + String(studentId).padStart(4, "0"),
            name: profileData.name || base.name || "Student",
            email: profileData.email || base.email || "",
            phone: profileData.phone || base.phone || "",
            mobile: profileData.phone || base.phone || "",
            course: profileData.course || base.course || "",
            department: profileData.course || base.course || "Not specified",
            semester: Number(profileData.semester || base.semester || 1),
            role: profileData.role || base.role || "student",
            gender: profileData.gender || "",
            dob: profileData.date_of_birth || profileData.dateOfBirth || "",
            address: profileData.address || "",
            skills: profileData.skills || "",
            interests: profileData.interests || "",
            study_hours: profileData.study_hours || profileData.studyHours || "",
            subjects: subjects,
            performance: performance,
            attendance: calculatedAttendance,
            attendanceRows: buildAttendanceRows(subjects),
            guidance: null,
            recommendations: []
        };
    }


    // =====================================================
    // LOAD STUDENT SUMMARY & ADMIN STUDENTS
    // =====================================================

    async function loadStudentSummary(studentId) {
        const baseStudent = { id: Number(studentId || 0), name: "Student", email: "", phone: "", role: "student", semester: 1 };
        const profile = await loadStudentProfile();
        const performanceRows = await loadStudentPerformance(studentId);
        const analytics = await loadAnalytics(studentId);

        return buildStudent(baseStudent, profile, performanceRows, analytics);
    }


    async function loadAdminStudents() {
        try {
            console.log("API REQUEST: GET /api/admin/students");
            const response = await api.request("/api/admin/students");
            let students = response?.students || response?.data || [];

            if (!Array.isArray(students)) students = [];

            const completeStudents = [];
            for (const item of students) {
                try {
                    const performanceRows = await loadStudentPerformance(item.id);
                    const analytics = await loadAnalytics(item.id);
                    completeStudents.push(buildStudent(item, item, performanceRows, analytics));
                } catch (error) {
                    completeStudents.push(buildStudent(item, item, [], null));
                }
            }

            return completeStudents;
        } catch (error) {
            console.error("Admin students API error:", error);
            throw error; // Re-throw to trigger auth redirect handler if status is 401
        }
    }


    // =====================================================
    // CREATE APPLICATION DATA
    // =====================================================

    async function createApplicationData() {
        const user = getUser();
        const token = localStorage.getItem("auth_token") || localStorage.getItem("token");

        if (!user || !token) {
            console.warn("No authentication token or user session found.");
            localStorage.clear();
            window.location.href = "/index.html";
            throw new Error("No logged-in user found. Redirecting to login.");
        }

        const role = user.role || "student";
        const userId = Number(user.id || user.student_id || 0);

        console.log("👤 Logged in user:", user);

        // Fetch global subjects list
        const globalSubjects = await loadAllSubjects();

        if (role === "student") {
            const student = await loadStudentSummary(userId);
            if (!student.name || student.name === "Student") student.name = user.name || "Student";
            if (!student.email) student.email = user.email || "";
            if (!student.id) student.id = userId;

            return {
                session: { role: "student", name: student.name, studentId: student.id, email: student.email },
                student: student,
                students: [student],
                subjects: globalSubjects.length > 0 ? globalSubjects : student.subjects,
                performance: student.subjects,
                analytics: student.performance,
                careers: [],
                recommendations: student.recommendations || []
            };
        }

        // ADMIN
        const students = await loadAdminStudents();

        return {
            session: { role: "admin", name: user.name || "Administrator", studentId: null, email: user.email || "" },
            student: null,
            students: students,
            subjects: globalSubjects,
            performance: [],
            analytics: {},
            careers: [],
            recommendations: []
        };
    }


    // =====================================================
    // APPLICATION OBJECT & SHELL CREATION
    // =====================================================

    window.App = {
        data: null,
        session: null,
        selectedStudentId: null,
        renderPage: null,
        callbacks: [],

        onReady: function (callback) {
            if (typeof callback !== "function") return;
            this.callbacks.push(callback);
            if (this.data) {
                try { callback(this.data); } catch (e) { console.error("App callback error:", e); }
            }
        },

        currentStudent: function () {
            if (!this.data) return null;
            if (this.session && this.session.role === "student") {
                return this.data.student || null;
            }
            if (!Array.isArray(this.data.students) || this.data.students.length === 0) return null;

            const selectedId = Number(this.selectedStudentId);
            return this.data.students.find((student) => Number(student.id) === selectedId) || this.data.students[0];
        },

        reload: async function (message) {
            try {
                console.log("🔄 Reloading application data...");
                const freshData = await createApplicationData();
                this.data = freshData;
                this.session = freshData.session;

                if (!this.selectedStudentId && Array.isArray(freshData.students) && freshData.students.length) {
                    this.selectedStudentId = freshData.students[0].id;
                }

                if (typeof this.renderPage === "function") {
                    this.renderPage();
                }

                if (message && api && typeof api.toast === "function") {
                    api.toast(message);
                }
            } catch (error) {
                console.error("❌ Reload error:", error);
            }
        },

        chooseStudent: async function (id) {
            this.selectedStudentId = Number(id);
            if (this.session && this.session.role === "admin") {
                try {
                    const student = await loadStudentSummary(this.selectedStudentId);
                    if (student && this.data && Array.isArray(this.data.students)) {
                        const index = this.data.students.findIndex((item) => Number(item.id) === Number(student.id));
                        if (index !== -1) {
                            this.data.students[index] = student;
                        } else {
                            this.data.students.push(student);
                        }
                    }
                } catch (error) {
                    console.error("Unable to load selected student:", error);
                }
            }
            if (typeof this.renderPage === "function") {
                this.renderPage();
            }
        },

        go: function (url) {
            if (url) window.location.href = url;
        }
    };


    function createShell() {
        const app = window.App;
        if (!app || !app.session) return;

        const root = document.getElementById("app-root");
        if (!root) return;

        const pageSource = document.getElementById("page-content-source");
        const pageContentHTML = pageSource ? pageSource.innerHTML : "";
        const links = app.session.role === "admin" ? adminLinks : studentLinks;
        const studentName = app.session.name || (app.session.role === "admin" ? "Administrator" : "Student");
        const activePage = getActivePage();

        let navigationHtml = "";
        links.forEach(function (link) {
            const pageKey = (link[0] === "admin-dashboard" || link[0] === "student-dashboard") ? "dashboard" : link[0];
            const activeClass = activePage === pageKey ? "active" : "";
            navigationHtml += `<a class="${activeClass}" href="${escapeHtml(link[3])}"><span class="nav-icon">${escapeHtml(link[2])}</span><span class="nav-label">${escapeHtml(link[1])}</span></a>`;
        });

        const firstLetter = String(studentName).charAt(0).toUpperCase();
        const roleText = app.session.role === "admin" ? "Administrator" : "Student";

        root.innerHTML = `<div class="app-layout">
            <aside id="sidebar" class="sidebar">
                <div class="sidebar-brand"><span class="brand-mark">◆</span><span>Student<br><b>Performance</b></span></div>
                <div class="sidebar-line"></div>
                <nav class="sidebar-nav">${navigationHtml}</nav>
                <div class="sidebar-bottom">
                    <div class="sidebar-tip">✦<span><b>Build your future</b><small>One skill at a time</small></span></div>
                    <button id="logout-button" class="logout" type="button">⇥ Logout</button>
                    <div class="side-user">
                        <span class="user-avatar">${escapeHtml(firstLetter)}</span>
                        <span><b>${escapeHtml(studentName)}</b><small>${roleText}</small></span>
                    </div>
                </div>
            </aside>
            <div class="main-area">
                <header class="app-header">
                    <button id="menu-button" class="menu-button" type="button">☰</button>
                    <div class="breadcrumb">Workspace <b>/</b> <strong>${app.session.role === "admin" ? "Admin portal" : "Student portal"}</strong></div>
                    <div class="header-icons">
                        <span class="header-search">⌕</span>
                        <span class="header-notification">♧</span>
                        <span class="header-avatar">${escapeHtml(firstLetter)}</span>
                    </div>
                </header>
                <main id="page-content" class="workspace"></main>
                <footer class="app-footer">Student Performance & Career Guidance System <b>•</b> Built for better futures</footer>
            </div>
        </div>`;

        const pageContent = document.getElementById("page-content");
        if (pageContent) pageContent.innerHTML = pageContentHTML;

        const logoutButton = document.getElementById("logout-button");
        if (logoutButton) {
            logoutButton.addEventListener("click", function () {
                if (api && typeof api.logout === "function") {
                    api.logout();
                } else {
                    localStorage.clear();
                    window.location.href = "/index.html";
                }
            });
        }

        const menuButton = document.getElementById("menu-button");
        const sidebar = document.getElementById("sidebar");
        if (menuButton && sidebar) {
            menuButton.addEventListener("click", () => sidebar.classList.toggle("open"));
        }
    }


    // =====================================================
    // INITIALIZE APPLICATION
    // =====================================================

    async function init() {
        try {
            console.log("🔄 Initializing Student Performance application...");

            if (!api) {
                throw new Error("AppApi is not loaded. Make sure api.js is loaded before layout.js.");
            }

            const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
            if (!token && window.location.pathname !== "/index.html" && window.location.pathname !== "/") {
                console.warn("No token available on startup. Redirecting to index.html...");
                window.location.href = "/index.html";
                return;
            }

            const data = await createApplicationData();
            window.App.data = data;
            window.App.session = data.session;

            if (requiredRole !== "any" && requiredRole !== window.App.session.role) {
                window.location.href = window.App.session.role === "admin" ? "/admin-dashboard.html" : "/student-dashboard.html";
                return;
            }

            const params = new URLSearchParams(window.location.search);
            const queryStudent = Number(params.get("studentId"));

            if (window.App.session.role === "student") {
                window.App.selectedStudentId = window.App.session.studentId;
            } else if (queryStudent && Array.isArray(data.students) && data.students.some((s) => Number(s.id) === queryStudent)) {
                window.App.selectedStudentId = queryStudent;
            } else if (Array.isArray(data.students) && data.students.length) {
                window.App.selectedStudentId = data.students[0].id;
            }

            createShell();

            window.App.callbacks.forEach(function (callback) {
                try { callback(data); } catch (error) { console.error("Page callback error:", error); }
            });

            console.log("✅ Application initialized successfully.");
        } catch (error) {
            console.error("❌ Application initialization failed:", error);
            if (error.message && error.message.includes("token")) {
                localStorage.clear();
                if (window.location.pathname !== "/index.html" && window.location.pathname !== "/") {
                    window.location.href = "/index.html";
                }
            }
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();