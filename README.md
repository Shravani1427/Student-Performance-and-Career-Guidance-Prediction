# Student Performance & Career Guidance System

A student-focused platform with an existing HTML/CSS/Vanilla JavaScript frontend and a standalone Node.js + Express.js + MySQL REST API backend.

## Final architecture

```text
HTML + CSS + Vanilla JavaScript
              |
              | fetch() + JWT Bearer token
              v
Node.js + Express.js REST API :5000
              |
              | mysql2 parameterized queries
              v
MySQL database: Student_system
```

The application backend does not use Next.js API routes, React, Drizzle, Prisma, MongoDB, Firebase, or TypeScript.

## Backend structure

```text
backend/
├── server.js
├── package.json
├── .env.example
├── .env
├── config/db.js
├── middleware/
│   ├── authMiddleware.js
│   └── adminMiddleware.js
├── routes/
│   ├── authRoutes.js
│   ├── studentRoutes.js
│   ├── performanceRoutes.js
│   ├── careerRoutes.js
│   ├── reportRoutes.js
│   ├── adminRoutes.js
│   └── complaintRoutes.js
├── controllers/
│   ├── authController.js
│   ├── studentController.js
│   ├── performanceController.js
│   ├── careerController.js
│   ├── reportController.js
│   ├── adminController.js
│   └── complaintController.js
└── utils/generateToken.js
```

## Database setup

Install MySQL 8+, then import the single schema file:

```bash
mysql -u root -p < database/Student_system.sql
```

The SQL file creates the database, all required tables, foreign keys, indexes, careers, roadmap skills, and hashed demo accounts.

## Environment variables

Copy the example file:

```bash
cd backend
copy .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

Configure `backend/.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=Student_system
DB_PORT=3306
JWT_SECRET=student_performance_secret_key_change_me
PORT=5000
CLIENT_ORIGINS=http://localhost:3000,http://127.0.0.1:5500,http://localhost:5000
```

## Start the backend

```bash
cd backend
npm install
npm run dev
```

For production-style start:

```bash
npm start
```

The API runs at:

```text
http://localhost:5000/api
```

Express also serves the existing frontend from `public/`:

```text
http://localhost:5000/index.html
```

## Demo accounts

```text
Admin:
Email: admin@college.com
Password: admin123

Student:
Email: priya@college.com
Password: student123
```

Passwords are stored as bcryptjs hashes in MySQL. Login returns a JWT, and the frontend stores it in `localStorage` as `auth_token`.

## API groups

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/admin/login

GET    /api/profile                 (via /api/students/profile)
PUT    /api/profile                 (via /api/students/profile)
POST   /api/students                admin
GET    /api/students/:id
PUT    /api/students/:id
DELETE /api/students/:id             admin

POST   /api/performance
GET    /api/performance
GET    /api/performance/:id
PUT    /api/performance/:id
DELETE /api/performance/:id
GET    /api/performance/analytics/:studentId

GET    /api/careers
GET    /api/careers/:id
POST   /api/careers                  admin
PUT    /api/careers/:id               admin
DELETE /api/careers/:id               admin
POST   /api/career/predict
GET    /api/career/recommendations

POST   /api/complaints
GET    /api/complaints/my
GET    /api/admin/complaints
PUT    /api/admin/complaints/:id

GET    /api/reports/student/:studentId
GET    /api/health
```

The backend also keeps compatibility endpoints for the existing frontend questionnaire and personal career-path screens.

## Frontend API integration

`public/js/api.js` uses:

```javascript
const API_URL = "http://localhost:5000/api";
```

It automatically adds:

```text
Authorization: Bearer <JWT token>
```

to protected requests. The existing UI files are not redesigned; only their API helper/auth behavior is connected to Express.

## Postman guide

Complete request bodies, headers, expected responses, and testing order are available in:

```text
backend/POSTMAN_TESTING.md
```

Recommended order:

1. `GET /api/health`
2. Register or login
3. Save the JWT token
4. Test profile
5. Test performance and analytics
6. Test careers and prediction
7. Test complaints
8. Login as admin
9. Test admin students, performance, complaints, and career management
