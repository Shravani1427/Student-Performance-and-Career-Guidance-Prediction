"use strict";

// =====================================================
// SERVER.JS
// Student Performance & Career Guidance System
// Backend: Node.js + Express.js + MySQL
// =====================================================

const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");

// =====================================================
// LOAD ENVIRONMENT VARIABLES
// =====================================================

// Render provides environment variables automatically via process.env.
// Local development can use .env.local or .env.

dotenv.config({
    path: path.join(__dirname, ".env.local")
});

if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
    dotenv.config({
        path: path.join(__dirname, ".env")
    });
}

// =====================================================
// DATABASE CONNECTION
// =====================================================

const db = require("./config/db");

// =====================================================
// ROUTES
// =====================================================

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const performanceRoutes = require("./routes/performanceRoutes");
const careerRoutes = require("./routes/careerRoutes");
const reportRoutes = require("./routes/reportRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const adminRoutes = require("./routes/adminRoutes");
const subjectRoutes = require("./routes/subjectRoutes");

// =====================================================
// OPTIONAL ATTENDANCE ROUTES
// =====================================================

const attendanceRoutesPath = path.join(
    __dirname,
    "routes",
    "attendanceRoutes.js"
);

const attendanceRoutes = fs.existsSync(attendanceRoutesPath)
    ? require("./routes/attendanceRoutes")
    : null;

// =====================================================
// CREATE EXPRESS APP
// =====================================================

const app = express();

// =====================================================
// PORT
// =====================================================

const PORT = process.env.PORT || 5000;

// =====================================================
// FRONTEND & PUBLIC PATHS
// =====================================================

// Checks standard relative path as well as root-level fallback
let frontendPath = path.join(__dirname, "../frontend");
if (!fs.existsSync(frontendPath)) {
    frontendPath = path.join(__dirname, "frontend");
}

let publicPath = path.join(__dirname, "../public");
if (!fs.existsSync(publicPath)) {
    publicPath = path.join(__dirname, "public");
}

// =====================================================
// FRONTEND PATH CHECK LOGS
// =====================================================

console.log("");
console.log("============================================");
console.log("📁 FRONTEND PATH CHECK");
console.log("============================================");

console.log("Frontend path:", frontendPath);
console.log("Public path:", publicPath);

if (fs.existsSync(frontendPath)) {
    console.log("✅ Frontend folder found");
} else {
    console.log("❌ Frontend folder NOT found");
}

if (fs.existsSync(publicPath)) {
    console.log("✅ Public folder found");
}

console.log("============================================");
console.log("");

// =====================================================
// CORS CONFIGURATION
// =====================================================

app.use(
    cors({
        origin: true, // Accepts requests dynamically from hosted frontend origin
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);

// =====================================================
// BODY PARSERS
// =====================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================================================
// REQUEST LOGGER
// =====================================================

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});

// =====================================================
// SERVE FRONTEND STATIC FILES
// =====================================================

if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    console.log("✅ Express serving frontend:", frontendPath);
}

if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
    console.log("✅ Express serving public:", publicPath);
}

// =====================================================
// API BASE ENDPOINTS
// =====================================================

app.get("/api", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Express MySQL API is running",
        status: "OK"
    });
});

app.get("/api/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Student Performance & Career Guidance API is running",
        backend: "Node.js + Express.js",
        database: "MySQL"
    });
});

// =====================================================
// MOUNT API ROUTES
// =====================================================

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/admin/students", studentRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/careers", careerRoutes);
app.use("/api/career", careerRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/subjects", subjectRoutes);

// =====================================================
// ATTENDANCE ROUTES
// =====================================================

if (attendanceRoutes) {
    app.use("/api/attendance", attendanceRoutes);
} else {
    console.log("⚠️ attendanceRoutes.js not found. Using fallback attendance routes.");

    app.get("/api/attendance", (req, res) => {
        res.status(200).json({
            success: true,
            attendance: []
        });
    });

    app.post("/api/attendance", (req, res) => {
        console.log("📌 Attendance received:", req.body);
        res.status(200).json({
            success: true,
            message: "Attendance saved"
        });
    });

    app.delete("/api/attendance/:id", (req, res) => {
        res.status(200).json({
            success: true,
            message: "Attendance deleted"
        });
    });
}

// =====================================================
// API TEST ROUTE ENDPOINTS
// =====================================================

app.get("/api/admin-test", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Admin API test route is working"
    });
});

app.get("/api/subjects-test", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Subjects API route is working"
    });
});

// =====================================================
// FRONTEND PAGE ROUTES
// =====================================================

// Specific route handler for admin subjects page
app.get("/admin-subjects.html", (req, res) => {
    const filePath = path.join(frontendPath, "admin-subjects.html");
    console.log("📄 Requested:", filePath);

    if (!fs.existsSync(filePath)) {
        console.error("❌ admin-subjects.html NOT FOUND");
        return res.status(404).send(`
            <h1>admin-subjects.html not found</h1>
            <p>Expected location:</p>
            <pre>${filePath}</pre>
        `);
    }

    res.sendFile(filePath);
});

// Serve main page (login.html) at root URL
app.get("/", (req, res) => {
    const loginFilePath = path.join(frontendPath, "login.html");
    const indexFilePath = path.join(frontendPath, "index.html");

    if (fs.existsSync(loginFilePath)) {
        return res.sendFile(loginFilePath);
    } else if (fs.existsSync(indexFilePath)) {
        return res.sendFile(indexFilePath);
    }

    res.status(200).json({
        success: true,
        message: "Web Service is active. Access API via /api or request frontend files directly."
    });
});

// =====================================================
// FRONTEND TEST ENDPOINT
// =====================================================

app.get("/frontend-test", (req, res) => {
    res.status(200).json({
        success: true,
        frontendPath,
        frontendExists: fs.existsSync(frontendPath),
        adminSubjectsHTML: fs.existsSync(path.join(frontendPath, "admin-subjects.html")),
        adminSubjectsJS: fs.existsSync(path.join(frontendPath, "js", "admin-subjects.js")),
        apiJS: fs.existsSync(path.join(frontendPath, "js", "api.js")),
        layoutJS: fs.existsSync(path.join(frontendPath, "js", "layout.js")),
        styleCSS: fs.existsSync(path.join(frontendPath, "css", "style.css")),
        layoutCSS: fs.existsSync(path.join(frontendPath, "css", "layout.css")),
        subjectsCSS: fs.existsSync(path.join(frontendPath, "css", "subjects.css"))
    });
});

// =====================================================
// API 404 HANDLER
// =====================================================

app.use((req, res, next) => {
    if (req.originalUrl.startsWith("/api/")) {
        console.log(`❌ API route not found: ${req.method} ${req.originalUrl}`);
        return res.status(404).json({
            success: false,
            message: "API route not found",
            path: req.originalUrl
        });
    }
    next();
});

// =====================================================
// GENERAL 404 HANDLER
// =====================================================

app.use((req, res) => {
    res.status(404).send("Page not found");
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
    console.error("");
    console.error("============================================");
    console.error("❌ SERVER ERROR");
    console.error("============================================");
    console.error(err);

    if (req.originalUrl.startsWith("/api/")) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === "development" ? err.message : undefined
        });
    }

    res.status(500).send("Internal server error");
});

// =====================================================
// START SERVER
// =====================================================

async function startServer() {
    try {
        // Test Database Connection
        const connection = await db.getConnection();

        console.log("");
        console.log("============================================");
        console.log("✅ MYSQL DATABASE CONNECTED");
        console.log("============================================");

        connection.release();

        // Start Express listening
        app.listen(PORT, "0.0.0.0", () => {
            console.log("");
            console.log("============================================");
            console.log("🚀 SERVER STARTED SUCCESSFULLY");
            console.log("============================================");
            console.log(`🌐 Port: ${PORT}`);
            console.log(`🌐 API: /api`);
            console.log(`📄 Admin Subjects: /admin-subjects.html`);
            console.log(`🧪 Frontend Test: /frontend-test`);
            console.log(`📚 Subjects API: /api/subjects`);
            console.log(`⏱️ Attendance API: /api/attendance`);
            console.log("============================================");
            console.log("");
        });

    } catch (error) {
        console.error("");
        console.error("============================================");
        console.error("❌ SERVER STARTUP FAILED");
        console.error("============================================");
        console.error(error);
        console.error("");

        process.exit(1);
    }
}

// =====================================================
// START APPLICATION & EXPORT
// =====================================================

startServer();

module.exports = app;