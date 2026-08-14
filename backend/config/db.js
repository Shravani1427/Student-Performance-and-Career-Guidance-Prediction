"use strict";

// =====================================================
// MYSQL DATABASE CONNECTION
// Student Performance & Career Guidance System
// Node.js + Express.js + MySQL
// Compatible with Vercel Serverless
// =====================================================

const mysql = require("mysql2/promise");

// =====================================================
// DATABASE CONFIGURATION
// =====================================================

const DB_HOST = process.env.DB_HOST;
const DB_PORT = Number(process.env.DB_PORT || 11663);
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

// =====================================================
// CHECK ENVIRONMENT VARIABLES
// =====================================================

console.log("==========================================");
console.log("MYSQL DATABASE CONFIGURATION");
console.log("==========================================");
console.log("DB_HOST:", DB_HOST ? "SET" : "MISSING");
console.log("DB_PORT:", DB_PORT);
console.log("DB_USER:", DB_USER ? "SET" : "MISSING");
console.log("DB_PASSWORD:", DB_PASSWORD ? "SET" : "MISSING");
console.log("DB_NAME:", DB_NAME ? "SET" : "MISSING");
console.log("VERCEL:", process.env.VERCEL || "false");
console.log("==========================================");

if (!DB_HOST || !DB_USER || !DB_NAME) {
    console.error(
        "❌ MySQL environment variables are missing."
    );
}

// =====================================================
// CREATE MYSQL CONNECTION POOL
// =====================================================

const pool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,

    waitForConnections: true,

    connectionLimit: 5,

    queueLimit: 0,

    enableKeepAlive: true,

    keepAliveInitialDelay: 0,

    charset: "utf8mb4",

    // =================================================
    // SSL
    // =================================================
    // Required by many cloud MySQL providers.
    // =================================================

    ssl: {
        rejectUnauthorized: false
    }
});

// =====================================================
// EXPORT DATABASE POOL
// =====================================================

module.exports = pool;