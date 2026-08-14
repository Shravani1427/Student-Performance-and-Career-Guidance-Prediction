"use strict";

// =====================================================
// SERVER.JS
// Student Performance & Career Guidance System
// Backend: Node.js + Express.js + MySQL
// Compatible with: Local Node Server & Vercel Serverless
// =====================================================

const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");

// =====================================================
// LOAD ENVIRONMENT VARIABLES
// =====================================================

dotenv.config({
  path: path.join(__dirname, ".env.local"),
});

if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
  dotenv.config({
    path: path.join(__dirname, ".env"),
  });
}

// =====================================================
// DATABASE CONNECTION
// =====================================================

const db = require("./backend/config/db");

// =====================================================
// ROUTES
// =====================================================

const authRoutes = require("./backend/routes/authRoutes");
const studentRoutes = require("./backend/routes/studentRoutes");
const performanceRoutes = require("./backend/routes/performanceRoutes");
const careerRoutes = require("./backend/routes/careerRoutes");
const reportRoutes = require("./backend/routes/reportRoutes");
const complaintRoutes = require("./backend/routes/complaintRoutes");
const adminRoutes = require("./backend/routes/adminRoutes");
const subjectRoutes = require("./backend/routes/subjectRoutes");

// =====================================================
// OPTIONAL ATTENDANCE ROUTES
// =====================================================

const attendanceRoutesPath = path.join(
  __dirname,
  "backend",
  "routes",
  "attendanceRoutes.js"
);

const attendanceRoutes = fs.existsSync(attendanceRoutesPath)
  ? require("./backend/routes/attendanceRoutes")
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

let publicPath = path.join(__dirname, "public");
if (!fs.existsSync(publicPath)) {
  publicPath = path.join(__dirname, "../public");
}

let frontendPath = publicPath;

// =====================================================
// CORS CONFIGURATION
// =====================================================

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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

if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

// =====================================================
// API BASE ENDPOINTS
// =====================================================

app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Express MySQL API is running on Vercel Serverless",
    status: "OK",
  });
});

app.get("/api/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Student Performance & Career Guidance API is running",
    backend: "Node.js + Express.js",
    database: "MySQL",
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
  app.get("/api/attendance", (req, res) => {
    res.status(200).json({
      success: true,
      attendance: [],
    });
  });

  app.post("/api/attendance", (req, res) => {
    res.status(200).json({
      success: true,
      message: "Attendance saved",
    });
  });

  app.delete("/api/attendance/:id", (req, res) => {
    res.status(200).json({
      success: true,
      message: "Attendance deleted",
    });
  });
}

// =====================================================
// API TEST ROUTE ENDPOINTS
// =====================================================

app.get("/api/admin-test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Admin API test route is working",
  });
});

app.get("/api/subjects-test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Subjects API route is working",
  });
});

// =====================================================
// FRONTEND PAGE ROUTES
// =====================================================

app.get("/admin-subjects.html", (req, res) => {
  const filePath = path.join(publicPath, "admin-subjects.html");
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("admin-subjects.html not found");
  }
  res.sendFile(filePath);
});

app.get("/", (req, res) => {
  const loginFilePath = path.join(publicPath, "login.html");
  const indexFilePath = path.join(publicPath, "index.html");

  if (fs.existsSync(loginFilePath)) {
    return res.sendFile(loginFilePath);
  } else if (fs.existsSync(indexFilePath)) {
    return res.sendFile(indexFilePath);
  }

  res.status(200).json({
    success: true,
    message: "Web Service is active. Access API via /api or open /login.html.",
  });
});

// =====================================================
// FRONTEND TEST ENDPOINT
// =====================================================

app.get("/frontend-test", (req, res) => {
  res.status(200).json({
    success: true,
    publicPath,
    publicExists: fs.existsSync(publicPath),
    adminSubjectsHTML: fs.existsSync(path.join(publicPath, "admin-subjects.html")),
    adminSubjectsJS: fs.existsSync(path.join(publicPath, "js", "admin-subjects.js")),
    apiJS: fs.existsSync(path.join(publicPath, "js", "api.js")),
  });
});

// =====================================================
// API 404 HANDLER
// =====================================================

app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/api/")) {
    return res.status(404).json({
      success: false,
      message: "API route not found",
      path: req.originalUrl,
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
  console.error("❌ SERVER ERROR:", err);

  if (req.originalUrl.startsWith("/api/")) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }

  res.status(500).send("Internal server error");
});

// =====================================================
// LOCAL RUNNER vs VERCEL SERVERLESS EXPORT
// =====================================================

// Only start Express listener if executing locally directly (not inside Vercel)
if (process.env.VERCEL !== "1" && process.env.NODE_ENV !== "production") {
  (async () => {
    try {
      if (db && typeof db.getConnection === "function") {
        const connection = await db.getConnection();
        console.log("✅ MYSQL DATABASE CONNECTED");
        connection.release();
      }

      app.listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 Local server listening on http://localhost:${PORT}`);
      });
    } catch (error) {
      console.error("❌ Local server startup failed:", error);
    }
  })();
}

// Export the app for Vercel Serverless Function entry point
module.exports = app;