# Student Performance & Career Guidance Backend

This is the standalone backend required by the project.

- Node.js
- Express.js
- MySQL
- mysql2
- JWT
- bcryptjs
- CORS
- dotenv
- REST APIs

No Next.js API routes, React, Drizzle, Prisma, MongoDB, or TypeScript are used by this backend.

## Start

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

On macOS/Linux:

```bash
cp .env.example .env
```

Import the database before starting:

```bash
mysql -u root -p < ../database/Student_system.sql
```

The API runs at:

```text
http://localhost:5000/api
```

The Express server also serves the existing frontend from `../public` at:

```text
http://localhost:5000/index.html
```

Demo accounts:

```text
Admin: admin@college.com / admin123
Student: priya@college.com / student123
```

The complete endpoint-by-endpoint Postman guide is in `backend/POSTMAN_TESTING.md`.
