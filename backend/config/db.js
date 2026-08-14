"use strict";

// =====================================================
// MYSQL DATABASE CONNECTION
// Student Performance & Career Guidance System
// Node.js + Express.js + MySQL
// Optimized for Vercel Serverless Functions
// =====================================================

const mysql = require("mysql2/promise");
require("dotenv").config();

// =====================================================
// DATABASE CONFIGURATION
// =====================================================

const DB_HOST = process.env.DB_HOST;
const DB_PORT = Number(process.env.DB_PORT || 3306);
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
console.log("VERCEL:", process.env.VERCEL ? "true" : "false");
console.log("==========================================");

if (!DB_HOST || !DB_USER || !DB_NAME) {
    console.error("❌ MySQL environment variables are missing.");
}

// =====================================================
// GLOBAL SERVERLESS POOL CACHE (Prevents Leaking Connections)
// =====================================================

let pool = global.__db_pool;

if (!pool) {
    pool = mysql.createPool({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,

        // Serverless connection management
        waitForConnections: true,
        connectionLimit: 2,         // Keep very low per serverless container to prevent overloading
        maxIdle: 2,
        idleTimeout: 15000,         // Release idle connections after 15s
        queueLimit: 0,
        connectTimeout: 10000,      // Fail fast on network issues (10s)

        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        charset: "utf8mb4",

        // Cloud provider SSL requirement (Aiven, PlanetScale, Supabase, Clever Cloud, etc.)
        ssl: {
            rejectUnauthorized: false
        }
    });

    // Cache the pool on global scope for Vercel warm lambdas
    global.__db_pool = pool;
}

// =====================================================
// EXPORT DATABASE POOL
// =====================================================

module.exports = pool;