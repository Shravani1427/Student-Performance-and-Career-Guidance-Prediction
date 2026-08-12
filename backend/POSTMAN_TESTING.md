# Express + MySQL API testing guide

Base URL:

```text
http://localhost:5000/api
```

For protected requests, first login and copy the JWT token. Add this header:

```text
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

## 1. Health

### Request

```text
GET /api/health
```

### Expected response

```json
{
  "success": true,
  "message": "Backend API is running",
  "database": "MySQL"
}
```

## 2. Register student

### Request

```text
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "name": "Test Student",
  "email": "test.student@gmail.com",
  "password": "student123",
  "phone": "9876543210"
}
```

Expected: `201`, a JWT `token`, and a safe `user` object without password.

## 3. Student login

```text
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "priya@college.com",
  "password": "student123"
}
```

Expected: `200` with `token` and `user.role = "student"`.

## 4. Get profile

```text
GET /api/students/profile
Authorization: Bearer STUDENT_TOKEN
```

## 5. Update profile

```text
PUT /api/students/profile
Authorization: Bearer STUDENT_TOKEN
Content-Type: application/json
```

```json
{
  "name": "Test Student Updated",
  "phone": "9999999999",
  "course": "Information Technology",
  "semester": 5,
  "skills": "Python, SQL",
  "interests": "Data analysis, technology",
  "study_hours": 4,
  "address": "College Road"
}
```

## 6. Add performance

```text
POST /api/performance
Authorization: Bearer STUDENT_TOKEN
Content-Type: application/json
```

```json
{
  "subject_name": "Programming",
  "marks_obtained": 86,
  "total_marks": 100,
  "attendance": 90,
  "semester": 5,
  "academic_year": "2025-26"
}
```

Expected: `201` with the created row.

## 7. Get performance

```text
GET /api/performance
Authorization: Bearer STUDENT_TOKEN
```

## 8. Get one performance record

```text
GET /api/performance/1
Authorization: Bearer STUDENT_TOKEN
```

## 9. Update performance

```text
PUT /api/performance/1
Authorization: Bearer STUDENT_TOKEN
Content-Type: application/json
```

```json
{
  "marks_obtained": 90,
  "total_marks": 100,
  "attendance": 92,
  "semester": 5,
  "academic_year": "2025-26"
}
```

## 10. Delete performance

```text
DELETE /api/performance/1
Authorization: Bearer STUDENT_TOKEN
```

## 11. Get analytics

```text
GET /api/performance/analytics/2
Authorization: Bearer STUDENT_TOKEN
```

A student may use only their own ID. An admin may use any student ID.

Expected data includes:

```json
{
  "total_subjects": 5,
  "total_marks": "425/500",
  "percentage": 85,
  "grade": "A",
  "status": "Pass",
  "subjects_passed": 5,
  "subjects_failed": 0,
  "average_attendance": 90
}
```

## 12. Get careers

```text
GET /api/careers
Authorization: Bearer STUDENT_TOKEN
```

## 13. Get one career

```text
GET /api/careers/1
Authorization: Bearer STUDENT_TOKEN
```

## 14. Predict career

```text
POST /api/career/predict
Authorization: Bearer STUDENT_TOKEN
Content-Type: application/json
```

```json
{
  "answers": {
    "1": "C",
    "2": "B",
    "3": "B",
    "4": "A",
    "5": "B",
    "6": "C",
    "7": "B",
    "8": "B",
    "9": "B",
    "10": "B"
  }
}
```

The scoring is transparent: academics 40%, skills 25%, interests/questionnaire 25%, and study hours 10%. Recommendations are saved in `career_recommendations`.

## 15. Get saved recommendations

```text
GET /api/career/recommendations
Authorization: Bearer STUDENT_TOKEN
```

Admin can inspect a student with:

```text
GET /api/career/recommendations?studentId=2
Authorization: Bearer ADMIN_TOKEN
```

## 16. Submit complaint

```text
POST /api/complaints
Authorization: Bearer STUDENT_TOKEN
Content-Type: application/json
```

```json
{
  "category": "Performance",
  "subject": "My marks are not updated",
  "message": "The marks for my Programming subject are not visible in my dashboard."
}
```

## 17. Get my complaints

```text
GET /api/complaints/my
Authorization: Bearer STUDENT_TOKEN
```

## 18. Admin login

```text
POST /api/admin/login
Content-Type: application/json
```

```json
{
  "email": "admin@college.com",
  "password": "admin123"
}
```

## 19. Admin get students

```text
GET /api/admin/students
Authorization: Bearer ADMIN_TOKEN
```

## 20. Admin get one student

```text
GET /api/admin/students/2
Authorization: Bearer ADMIN_TOKEN
```

## 21. Admin delete student

```text
DELETE /api/admin/students/2
Authorization: Bearer ADMIN_TOKEN
```

## 22. Admin get all performance

```text
GET /api/admin/performance
Authorization: Bearer ADMIN_TOKEN
```

## 23. Admin get complaints

```text
GET /api/admin/complaints
Authorization: Bearer ADMIN_TOKEN
```

## 24. Admin update complaint

```text
PUT /api/admin/complaints/1
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json
```

```json
{
  "status": "resolved",
  "admin_response": "The marks have been checked and updated."
}
```

## 25. Student report

```text
GET /api/reports/student/2
Authorization: Bearer STUDENT_TOKEN
```

The JSON includes student profile, performance records, analytics-compatible summary, attendance, career recommendations, and career path data.

## Admin career management

Only an admin token may call these routes.

```text
POST /api/careers
PUT /api/careers/1
DELETE /api/careers/1
```

Example create body:

```json
{
  "career_name": "Product Manager",
  "description": "Plans products and coordinates teams.",
  "required_skills": "Communication, planning, analysis",
  "required_interests": "Business, leadership, technology",
  "min_percentage": 55,
  "career_category": "Business",
  "salary_range": "₹5 - ₹25 LPA"
}
```
