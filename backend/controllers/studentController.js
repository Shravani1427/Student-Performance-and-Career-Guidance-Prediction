"use strict";

const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { publicUser } = require('./authController');

/* =====================================================
   HELPER FUNCTIONS
   ===================================================== */

function gradeFor(value) {
    if (value >= 90) return 'A+';
    if (value >= 80) return 'A';
    if (value >= 70) return 'B+';
    if (value >= 60) return 'B';
    if (value >= 40) return 'C';
    return 'F';
}

function percentage(value, total) {
    return total ? Math.round((Number(value) / Number(total)) * 100 * 100) / 100 : 0;
}

/* =====================================================
   1. GET ALL STUDENTS (ADMIN & DASHBOARD LIST)
   ===================================================== */
async function getAllStudents(request, response) {
    try {
        response.set({
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        });

        const [rows] = await db.execute(
            `SELECT s.id, s.name, s.email, s.phone, s.role, s.created_at, 
                    COALESCE(p.course, 'Information Technology') AS department, 
                    COALESCE(p.semester, 1) AS semester
             FROM students s 
             LEFT JOIN profiles p ON p.student_id = s.id 
             WHERE s.role = 'student' OR s.role IS NULL
             ORDER BY s.id DESC`
        );

        const students = rows.map((s) => ({
            id: s.id,
            studentCode: `STU-${String(s.id).padStart(4, '0')}`,
            name: s.name,
            email: s.email,
            phone: s.phone,
            department: s.department,
            semester: s.semester,
            created_at: s.created_at
        }));

        response.json({ success: true, count: students.length, data: students });
    } catch (error) {
        console.error('Get all students error:', error);
        response.status(500).json({ success: false, message: 'Unable to fetch students.' });
    }
}

/* =====================================================
   2. STUDENT SUMMARY COMPUTATION
   ===================================================== */
async function getStudentSummary(studentId) {
    try {
        const [studentRows] = await db.execute(
            'SELECT id, name, email, phone, role, created_at FROM students WHERE id = ?',
            [studentId]
        );
        if (!studentRows || !studentRows[0]) return null;

        const [profileRows] = await db.execute('SELECT * FROM profiles WHERE student_id = ? LIMIT 1', [studentId]);
        const [performanceRows] = await db.execute('SELECT * FROM performance WHERE student_id = ? ORDER BY semester, id', [studentId]);
        
        let recommendations = [];
        try {
            const [recRows] = await db.execute(
                'SELECT cr.*, c.career_name, c.description, c.required_skills, c.salary_range FROM career_recommendations cr JOIN careers c ON c.id = cr.career_id WHERE cr.student_id = ? ORDER BY cr.match_percentage DESC, cr.created_at DESC',
                [studentId]
            );
            recommendations = recRows;
        } catch (e) {
            console.warn('[SUMMARY] Career recommendations fetch skipped');
        }

        let path = null;
        try {
            const [paths] = await db.execute('SELECT * FROM student_career_paths WHERE student_id = ? LIMIT 1', [studentId]);
            if (paths && paths[0]) {
                const [skills] = await db.execute(
                    "SELECT s.*, COALESCE(p.status, 'not_started') AS status FROM career_path_skills s LEFT JOIN student_skill_progress p ON p.skill_id = s.id AND p.student_id = ? WHERE s.career_name = ? ORDER BY s.skill_order",
                    [studentId, paths[0].career_name]
                );
                const completed = skills.filter((skill) => skill.status === 'completed').length;
                path = {
                    career: paths[0].career_name,
                    progress: skills.length ? Math.round((completed / skills.length) * 100) : 0,
                    skills: skills.map((skill) => ({
                        id: skill.id,
                        name: skill.skill_name,
                        description: skill.description,
                        status: skill.status
                    }))
                };
            }
        } catch (e) {
            console.warn('[SUMMARY] Career paths fetch skipped');
        }

        const totalMarks = performanceRows.reduce((sum, item) => sum + Number(item.total_marks || 0), 0);
        const obtainedMarks = performanceRows.reduce((sum, item) => sum + Number(item.marks_obtained || 0), 0);
        const attendanceTotal = performanceRows.length;
        const attendanceSum = performanceRows.reduce((sum, item) => sum + Number(item.attendance || 0), 0);
        const overall = percentage(obtainedMarks, totalMarks);

        const student = studentRows[0];
        const profile = (profileRows && profileRows[0]) ? profileRows[0] : {};

        return {
            id: student.id,
            studentCode: `STU-${String(student.id).padStart(4, '0')}`,
            name: student.name,
            email: student.email,
            mobile: student.phone,
            department: profile.course || 'Information Technology',
            semester: profile.semester || 1,
            gender: profile.gender || 'N/A',
            dob: profile.date_of_birth || null,
            address: profile.address || '',
            attendance: {
                total: attendanceTotal,
                present: performanceRows.filter((item) => Number(item.attendance) >= 75).length,
                absent: performanceRows.filter((item) => Number(item.attendance) < 75).length,
                percentage: attendanceTotal ? Math.round(attendanceSum / attendanceTotal) : 0
            },
            performance: {
                totalMarks,
                obtainedMarks,
                percentage: overall,
                average: performanceRows.length ? Math.round(obtainedMarks / performanceRows.length) : 0,
                level: overall >= 90 ? 'Excellent' : overall >= 75 ? 'Very Good' : overall >= 60 ? 'Good' : overall >= 40 ? 'Average' : 'Needs Improvement',
                grade: gradeFor(overall)
            },
            subjects: performanceRows.map((item) => ({
                id: item.id,
                name: item.subject_name,
                code: `SUB-${item.id}`,
                semester: item.semester,
                total: item.total_marks,
                obtained: item.marks_obtained,
                percentage: percentage(item.marks_obtained, item.total_marks),
                attendance: item.attendance
            })),
            guidance: recommendations[0] ? { career: recommendations[0].career_name, match: recommendations[0].match_percentage, testDate: recommendations[0].created_at } : null,
            careerPath: path,
            recommendations: recommendations.map((item) => ({ career: item.career_name, match: item.match_percentage, reason: item.reason, salary: item.salary_range }))
        };
    } catch (err) {
        console.error(`[SUMMARY ERROR] Student ID ${studentId}:`, err);
        return null;
    }
}

/* =====================================================
   3. DASHBOARD ANALYTICS & RECENT LIST
   ===================================================== */
async function getDashboard(request, response) {
    try {
        const [rows] = await db.execute("SELECT id FROM students WHERE role = 'student' OR role IS NULL ORDER BY id DESC");
        const ids = request.user.role === 'admin' ? rows.map((row) => row.id) : [request.user.id];

        const students = [];
        for (const id of ids) {
            const summary = await getStudentSummary(id);
            if (summary) students.push(summary);
        }

        const [allPerformance] = await db.execute('SELECT marks_obtained, total_marks, attendance FROM performance');
        const [studentCount] = await db.execute("SELECT COUNT(*) AS count FROM students WHERE role='student' OR role IS NULL");
        
        let testCount = [{ count: 0 }];
        try {
            const [tCount] = await db.execute('SELECT COUNT(DISTINCT student_id) AS count FROM career_recommendations');
            testCount = tCount;
        } catch (e) {}

        const total = allPerformance.reduce((sum, row) => sum + Number(row.total_marks || 0), 0);
        const obtained = allPerformance.reduce((sum, row) => sum + Number(row.marks_obtained || 0), 0);
        const attendance = allPerformance.length
            ? Math.round(allPerformance.reduce((sum, row) => sum + Number(row.attendance || 0), 0) / allPerformance.length)
            : 0;

        const session = {
            role: request.user.role,
            studentId: request.user.role === 'student' ? request.user.id : null,
            email: request.user.email,
            name: request.user.name || (request.user.role === 'admin' ? 'Administrator' : 'Student')
        };

        response.json({
            success: true,
            session,
            overview: {
                totalStudents: Number(studentCount[0].count),
                totalDepartments: 0,
                averageAttendance: attendance,
                averagePerformance: percentage(obtained, total),
                completedTests: Number(testCount[0].count),
                totalSubjects: allPerformance.length
            },
            students,
            student: request.user.role === 'student' ? students[0] || null : null
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        response.status(500).json({ success: false, message: 'Unable to load dashboard.' });
    }
}

/* =====================================================
   4. GET SINGLE STUDENT RECORD
   ===================================================== */
async function getStudent(request, response) {
    const id = Number(request.params.id);
    if (request.user.role !== 'admin' && request.user.id !== id) {
        return response.status(403).json({ success: false, message: 'You can only access your own student record.' });
    }
    const [rows] = await db.execute(
        `SELECT s.id, s.name, s.email, s.phone, s.role, s.created_at, p.course AS department, p.semester 
         FROM students s 
         LEFT JOIN profiles p ON p.student_id = s.id 
         WHERE s.id = ?`, 
        [id]
    );
    if (!rows[0]) return response.status(404).json({ success: false, message: 'Student not found.' });
    response.json({ success: true, data: rows[0] });
}

/* =====================================================
   5. CREATE STUDENT (Saves into students + profiles)
   ===================================================== */
async function createStudent(request, response) {
    const { name, email, password, phone, role = 'student', department, course, semester } = request.body;
    if (!name || !email || !password) {
        return response.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }
    if (!['student', 'admin'].includes(role)) {
        return response.status(400).json({ success: false, message: 'Invalid role.' });
    }
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const hash = await bcrypt.hash(password, 10);
        
        const [result] = await connection.execute(
            'INSERT INTO students (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
            [name, email.toLowerCase().trim(), hash, phone || null, role]
        );
        
        const assignedCourse = department || course || 'Information Technology';
        const assignedSemester = semester || 1;

        await connection.execute(
            'INSERT INTO profiles (student_id, course, semester) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE course = VALUES(course), semester = VALUES(semester)',
            [result.insertId, assignedCourse, assignedSemester]
        );

        await connection.commit();

        response.status(201).json({
            success: true,
            message: 'Student created successfully.',
            data: { 
                id: result.insertId, 
                studentCode: `STU-${String(result.insertId).padStart(4, '0')}`,
                name, 
                email: email.toLowerCase().trim(), 
                phone: phone || null, 
                department: assignedCourse,
                semester: assignedSemester,
                role 
            }
        });
    } catch (error) {
        await connection.rollback();
        if (error.code === 'ER_DUP_ENTRY') {
            return response.status(409).json({ success: false, message: 'Email already exists.' });
        }
        console.error('Create student error:', error);
        response.status(500).json({ success: false, message: 'Unable to create student.' });
    } finally {
        connection.release();
    }
}

/* =====================================================
   6. UPDATE STUDENT
   ===================================================== */
async function updateStudent(request, response) {
    const id = Number(request.params.id);
    if (request.user.role !== 'admin' && request.user.id !== id) {
        return response.status(403).json({ success: false, message: 'You can only update your own student record.' });
    }
    const { name, email, phone, password, department, course, semester } = request.body;
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const fields = [];
        const values = [];
        if (name) { fields.push('name=?'); values.push(name); }
        if (email) { fields.push('email=?'); values.push(email.toLowerCase().trim()); }
        if (phone !== undefined) { fields.push('phone=?'); values.push(phone); }
        if (password) { fields.push('password=?'); values.push(await bcrypt.hash(password, 10)); }

        if (fields.length) {
            values.push(id);
            await connection.execute(`UPDATE students SET ${fields.join(',')} WHERE id=?`, values);
        }

        if (department || course || semester) {
            await connection.execute(
                `INSERT INTO profiles (student_id, course, semester) 
                 VALUES (?, ?, ?) 
                 ON DUPLICATE KEY UPDATE course = COALESCE(VALUES(course), course), semester = COALESCE(VALUES(semester), semester)`,
                [id, department || course || null, semester || null]
            );
        }

        await connection.commit();

        const [rows] = await db.execute(
            `SELECT s.id, s.name, s.email, s.phone, s.role, s.created_at, p.course AS department, p.semester 
             FROM students s 
             LEFT JOIN profiles p ON p.student_id = s.id 
             WHERE s.id = ?`, 
            [id]
        );
        response.json({ success: true, message: 'Student updated successfully.', data: rows[0] });
    } catch (error) {
        await connection.rollback();
        if (error.code === 'ER_DUP_ENTRY') {
            return response.status(409).json({ success: false, message: 'Email already exists.' });
        }
        console.error('Update student error:', error);
        response.status(500).json({ success: false, message: 'Unable to update student.' });
    } finally {
        connection.release();
    }
}

/* =====================================================
   7. DELETE STUDENT
   ===================================================== */
async function deleteStudent(request, response) {
    const id = Number(request.params.id);
    await db.execute("DELETE FROM students WHERE id=?", [id]);
    response.json({ success: true, message: 'Student deleted.' });
}

/* =====================================================
   8. GET STUDENT PROFILE
   ===================================================== */
async function getProfile(request, response) {
    const [rows] = await db.execute(
        'SELECT s.id, s.name, s.email, s.phone, s.role, p.date_of_birth, p.gender, p.address, p.course, p.semester, p.skills, p.interests, p.study_hours FROM students s LEFT JOIN profiles p ON p.student_id=s.id WHERE s.id=?',
        [request.user.id]
    );
    if (!rows[0]) return response.status(404).json({ success: false, message: 'Profile not found.' });
    response.json({ success: true, data: rows[0] });
}

/* =====================================================
   9. UPDATE STUDENT PROFILE
   ===================================================== */
async function updateProfile(request, response) {
    const { name, email, phone, date_of_birth, gender, address, course, semester, skills, interests, study_hours } = request.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.execute(
            'UPDATE students SET name=COALESCE(?,name), email=COALESCE(?,email), phone=? WHERE id=?',
            [name || null, email ? email.toLowerCase().trim() : null, phone || null, request.user.id]
        );
        await connection.execute(
            'INSERT INTO profiles (student_id,date_of_birth,gender,address,course,semester,skills,interests,study_hours) VALUES (?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE date_of_birth=VALUES(date_of_birth),gender=VALUES(gender),address=VALUES(address),course=VALUES(course),semester=VALUES(semester),skills=VALUES(skills),interests=VALUES(interests),study_hours=VALUES(study_hours)',
            [request.user.id, date_of_birth || null, gender || null, address || null, course || null, semester || null, skills || null, interests || null, study_hours || null]
        );
        await connection.commit();
        return getProfile(request, response);
    } catch (error) {
        await connection.rollback();
        if (error.code === 'ER_DUP_ENTRY') {
            return response.status(409).json({ success: false, message: 'Email already exists.' });
        }
        console.error('Profile update error:', error);
        response.status(500).json({ success: false, message: 'Unable to update profile.' });
    } finally {
        connection.release();
    }
}

module.exports = {
    getAllStudents,
    getStudentSummary,
    getDashboard,
    getStudent,
    createStudent,
    updateStudent,
    deleteStudent,
    getProfile,
    updateProfile,
    publicUser
};