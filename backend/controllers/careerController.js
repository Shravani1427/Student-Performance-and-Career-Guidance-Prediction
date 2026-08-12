
"use strict";

const db = require("../config/db");

/*
=====================================================
CAREER ASSESSMENT QUESTIONS
=====================================================
*/

const QUESTIONS = [
    [
        "Which activity do you enjoy most?",
        "Building programs",
        "Designing interfaces",
        "Analysing data",
        "Managing people"
    ],
    [
        "Which subject do you enjoy most?",
        "Programming",
        "Mathematics",
        "Database",
        "Networking"
    ],
    [
        "Which task sounds most exciting?",
        "Creating an app",
        "Finding patterns",
        "Protecting systems",
        "Improving a user journey"
    ],
    [
        "How do you approach a difficult problem?",
        "Break it into code",
        "Study the numbers",
        "Research the system",
        "Sketch different ideas"
    ],
    [
        "What would you like to work with?",
        "APIs and software",
        "Spreadsheets and dashboards",
        "Servers and networks",
        "Visual layouts"
    ],
    [
        "Which strength describes you best?",
        "Logical thinking",
        "Attention to detail",
        "Curiosity",
        "Empathy"
    ],
    [
        "What kind of project would you build?",
        "A web platform",
        "A prediction model",
        "A secure lab",
        "A mobile experience"
    ],
    [
        "Which result feels most rewarding?",
        "A working feature",
        "A clear insight",
        "A safe system",
        "A beautiful interface"
    ],
    [
        "How do you prefer to learn?",
        "Practice by coding",
        "Explore examples and data",
        "Try tools hands-on",
        "Make visual prototypes"
    ],
    [
        "Where do you see yourself contributing?",
        "Product engineering",
        "Business decisions",
        "System reliability",
        "Customer experience"
    ]
];


/*
=====================================================
QUESTION OPTION WEIGHTS
=====================================================
*/

const OPTION_WEIGHTS = {
    A: [
        "Software Developer",
        "Web Developer",
        "Mobile App Developer"
    ],

    B: [
        "UI/UX Designer",
        "Data Analyst",
        "Business Analyst"
    ],

    C: [
        "Data Analyst",
        "Data Scientist",
        "Database Administrator",
        "Cybersecurity Analyst"
    ],

    D: [
        "Business Analyst",
        "Network Engineer",
        "UI/UX Designer"
    ]
};


/*
=====================================================
HELPER FUNCTIONS
=====================================================
*/

function normalize(text) {
    return String(text || "")
        .toLowerCase()
        .split(/[,;|]/)
        .map(function (part) {
            return part.trim();
        })
        .filter(Boolean);
}


function matchList(studentText, requiredText) {

    const student =
        normalize(studentText);

    const required =
        normalize(requiredText);

    if (!required.length) {
        return 0.5;
    }

    return (
        required.filter(function (item) {

            return student.some(function (value) {

                return (
                    value.includes(item) ||
                    item.includes(value)
                );

            });

        }).length /
        required.length
    );

}


/*
=====================================================
CAREER NAME ALIASES
=====================================================
*/

function careerNameAlias(name) {

    if (name === "Cyber Security Specialist") {
        return "Cybersecurity Analyst";
    }

    if (name === "Network Administrator") {
        return "Network Engineer";
    }

    return name;
}


function resultName(name) {

    if (name === "Cybersecurity Analyst") {
        return "Cyber Security Specialist";
    }

    if (name === "Network Engineer") {
        return "Network Administrator";
    }

    return name;
}


/*
=====================================================
GET ALL CAREERS
=====================================================
*/

async function getCareers(request, response) {

    try {

        const [rows] =
            await db.execute(
                "SELECT * FROM careers ORDER BY career_name"
            );

        response.json({
            success: true,
            data: rows
        });

    } catch (error) {

        console.error(
            "Get careers error:",
            error
        );

        response.status(500).json({
            success: false,
            message: "Unable to load careers."
        });

    }

}


/*
=====================================================
GET SINGLE CAREER
=====================================================
*/

async function getCareer(request, response) {

    try {

        const [rows] =
            await db.execute(
                "SELECT * FROM careers WHERE id=?",
                [request.params.id]
            );

        if (!rows[0]) {

            return response.status(404).json({
                success: false,
                message: "Career not found."
            });

        }

        response.json({
            success: true,
            data: rows[0]
        });

    } catch (error) {

        console.error(
            "Get career error:",
            error
        );

        response.status(500).json({
            success: false,
            message: "Unable to load career."
        });

    }

}


/*
=====================================================
CREATE CAREER
=====================================================
*/

async function createCareer(request, response) {

    const {
        career_name,
        description,
        required_skills,
        required_interests,
        min_percentage,
        career_category,
        salary_range
    } = request.body;

    if (!career_name || !description) {

        return response.status(400).json({
            success: false,
            message:
                "Career name and description are required."
        });

    }

    try {

        const [result] =
            await db.execute(
                `
                INSERT INTO careers
                (
                    career_name,
                    description,
                    required_skills,
                    required_interests,
                    min_percentage,
                    career_category,
                    salary_range
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    career_name,
                    description,
                    required_skills || "",
                    required_interests || "",
                    Number(min_percentage || 0),
                    career_category || "Technology",
                    salary_range || "Not specified"
                ]
            );

        const [rows] =
            await db.execute(
                "SELECT * FROM careers WHERE id=?",
                [result.insertId]
            );

        response.status(201).json({
            success: true,
            message: "Career created.",
            data: rows[0]
        });

    } catch (error) {

        if (error.code === "ER_DUP_ENTRY") {

            return response.status(409).json({
                success: false,
                message: "Career already exists."
            });

        }

        console.error(
            "Create career error:",
            error
        );

        response.status(500).json({
            success: false,
            message: "Unable to create career."
        });

    }

}


/*
=====================================================
UPDATE CAREER
=====================================================
*/

async function updateCareer(request, response) {

    try {

        const fields = [
            "career_name",
            "description",
            "required_skills",
            "required_interests",
            "min_percentage",
            "career_category",
            "salary_range"
        ];

        const sets = [];
        const values = [];

        fields.forEach(function (field) {

            if (
                request.body[field] !== undefined
            ) {

                sets.push(
                    `${field}=?`
                );

                values.push(
                    request.body[field]
                );

            }

        });

        if (!sets.length) {

            return response.status(400).json({
                success: false,
                message: "No fields to update."
            });

        }

        values.push(
            request.params.id
        );

        await db.execute(
            `
            UPDATE careers
            SET ${sets.join(",")}
            WHERE id=?
            `,
            values
        );

        const [rows] =
            await db.execute(
                "SELECT * FROM careers WHERE id=?",
                [request.params.id]
            );

        if (!rows[0]) {

            return response.status(404).json({
                success: false,
                message: "Career not found."
            });

        }

        response.json({
            success: true,
            message: "Career updated.",
            data: rows[0]
        });

    } catch (error) {

        console.error(
            "Update career error:",
            error
        );

        response.status(500).json({
            success: false,
            message: "Unable to update career."
        });

    }

}


/*
=====================================================
DELETE CAREER
=====================================================
*/

async function deleteCareer(request, response) {

    try {

        const [result] =
            await db.execute(
                "DELETE FROM careers WHERE id=?",
                [request.params.id]
            );

        if (result.affectedRows === 0) {

            return response.status(404).json({
                success: false,
                message: "Career not found."
            });

        }

        response.json({
            success: true,
            message: "Career deleted."
        });

    } catch (error) {

        console.error(
            "Delete career error:",
            error
        );

        response.status(500).json({
            success: false,
            message: "Unable to delete career."
        });

    }

}


/*
=====================================================
CALCULATE CAREER RECOMMENDATIONS
=====================================================
*/

async function calculateRecommendations(
    studentId,
    answers = {}
) {

    /*
    -----------------------------
    GET STUDENT PROFILE
    -----------------------------
    */

    const [profiles] =
        await db.execute(
            `
            SELECT *
            FROM profiles
            WHERE student_id=?
            LIMIT 1
            `,
            [studentId]
        );

    const profile =
        profiles[0] || {};


    /*
    -----------------------------
    GET PERFORMANCE
    -----------------------------
    */

    const [performance] =
        await db.execute(
            `
            SELECT
                SUM(marks_obtained) AS obtained,
                SUM(total_marks) AS total,
                AVG(attendance) AS attendance
            FROM performance
            WHERE student_id=?
            `,
            [studentId]
        );


    const percentage =
        performance[0].total
            ? (
                Number(performance[0].obtained) /
                Number(performance[0].total)
            ) * 100
            : 0;


    /*
    -----------------------------
    GET CAREERS
    -----------------------------
    */

    const [careers] =
        await db.execute(
            `
            SELECT *
            FROM careers
            ORDER BY career_name
            `
        );


    /*
    -----------------------------
    QUESTIONNAIRE SCORE
    -----------------------------
    */

    const answerScore = {};

    Object.values(answers || {}).forEach(
        function (answer) {

            const careersForAnswer =
                OPTION_WEIGHTS[answer] || [];

            careersForAnswer.forEach(
                function (career) {

                    answerScore[career] =
                        (answerScore[career] || 0) + 1;

                }
            );

        }
    );


    const maxAnswer =
        Math.max(
            1,
            ...Object.values(answerScore)
        );


    /*
    -----------------------------
    SCORE EACH CAREER
    -----------------------------
    */

    const scored =
        careers
            .map(function (career) {

                const alias =
                    careerNameAlias(
                        career.career_name
                    );


                const academic =
                    Math.min(
                        100,
                        percentage
                    );


                const skills =
                    matchList(
                        profile.skills,
                        career.required_skills
                    ) * 100;


                const interests =
                    matchList(
                        profile.interests,
                        career.required_interests
                    ) * 100;


                const questionnaire =
                    (
                        answerScore[
                            career.career_name
                        ] ||
                        answerScore[alias] ||
                        0
                    ) /
                    maxAnswer *
                    100;


                const hours =
                    Math.min(
                        100,
                        Number(
                            profile.study_hours || 0
                        ) * 20
                    );


                /*
                FINAL MATCH SCORE

                Academic       = 40%
                Skills         = 25%
                Interest/Test  = 25%
                Study Hours    = 10%
                */

                const match =
                    Math.round(
                        academic * 0.40 +
                        skills * 0.25 +
                        Math.max(
                            interests,
                            questionnaire
                        ) * 0.25 +
                        hours * 0.10
                    );


                const reason =
                    academic >= 75
                        ? "Strong academic performance"
                        : "Your academic profile is a starting point";


                const secondReason =
                    skills >= 50 ||
                    interests >= 50 ||
                    questionnaire >= 50
                        ? " and a good match with your skills and interests."
                        : ". Building the recommended skills will improve your fit.";


                return {

                    career: career,

                    match_percentage:
                        Math.max(
                            35,
                            Math.min(
                                98,
                                match
                            )
                        ),

                    reason:
                        reason +
                        secondReason

                };

            })
            .sort(function (a, b) {

                return (
                    b.match_percentage -
                    a.match_percentage
                );

            })
            .slice(0, 3);


    return {

        percentage:
            Math.round(
                percentage * 100
            ) / 100,

        recommendations:
            scored

    };

}


/*
=====================================================
CAREER PREDICTION
=====================================================
*/

async function predictCareer(
    request,
    response
) {

    try {

        const result =
            await calculateRecommendations(
                request.user.id,
                request.body.answers || {}
            );


        /*
        DELETE OLD RECOMMENDATIONS
        */

        await db.execute(
            `
            DELETE FROM career_recommendations
            WHERE student_id=?
            `,
            [request.user.id]
        );


        /*
        SAVE NEW RECOMMENDATIONS
        */

        for (
            const recommendation
            of result.recommendations
        ) {

            await db.execute(
                `
                INSERT INTO career_recommendations
                (
                    student_id,
                    career_id,
                    match_percentage,
                    reason
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    request.user.id,
                    recommendation.career.id,
                    recommendation.match_percentage,
                    recommendation.reason
                ]
            );

        }


        response.json({

            success: true,

            message:
                "Career recommendations generated.",

            data: {

                student_name:
                    request.user.name,

                student_percentage:
                    result.percentage,

                recommendations:
                    result.recommendations.map(
                        function (item) {

                            return {

                                career_id:
                                    item.career.id,

                                career_name:
                                    resultName(
                                        item.career.career_name
                                    ),

                                match_percentage:
                                    item.match_percentage,

                                reason:
                                    item.reason

                            };

                        }
                    )

            }

        });

    } catch (error) {

        console.error(
            "Career prediction error:",
            error
        );

        response.status(500).json({

            success: false,

            message:
                "Unable to generate career recommendations."

        });

    }

}


/*
=====================================================
GET CAREER RECOMMENDATIONS
=====================================================
*/

async function recommendations(
    request,
    response
) {

    try {

        const requested =
            request.params.studentId ||
            request.query.studentId;


        const studentId =
            request.user.role === "admin" &&
            requested
                ? Number(requested)
                : request.user.id;


        /*
        STUDENT CAN ONLY SEE OWN RESULTS
        */

        if (
            request.user.role !== "admin" &&
            requested &&
            Number(requested) !==
                Number(request.user.id)
        ) {

            return response.status(403).json({

                success: false,

                message:
                    "You can only view your own recommendations."

            });

        }


        const [rows] =
            await db.execute(
                `
                SELECT
                    cr.*,
                    c.career_name,
                    c.description,
                    c.required_skills,
                    c.salary_range
                FROM career_recommendations cr
                JOIN careers c
                    ON c.id = cr.career_id
                WHERE cr.student_id=?
                ORDER BY cr.match_percentage DESC
                `,
                [studentId]
            );


        response.json({

            success: true,

            data: rows

        });

    } catch (error) {

        console.error(
            "Get recommendations error:",
            error
        );

        response.status(500).json({

            success: false,

            message:
                "Unable to load career recommendations."

        });

    }

}


/*
=====================================================
GET CAREER QUESTIONS
=====================================================
*/

async function questions(
    request,
    response
) {

    response.json({

        success: true,

        questions:
            QUESTIONS.map(
                function (item, index) {

                    return {

                        id:
                            index + 1,

                        question:
                            item[0],

                        optionA:
                            item[1],

                        optionB:
                            item[2],

                        optionC:
                            item[3],

                        optionD:
                            item[4]

                    };

                }
            )

    });

}


/*
=====================================================
SUBMIT CAREER ASSESSMENT
=====================================================
*/

async function submitAssessment(
    request,
    response
) {

    try {

        const answers =
            request.body.answers || {};


        /*
        MAKE SURE ALL 10 QUESTIONS
        ARE ANSWERED
        */

        if (
            Object.keys(answers).length <
            QUESTIONS.length
        ) {

            return response.status(400).json({

                success: false,

                message:
                    "Please answer every question before submitting."

            });

        }


        const result =
            await calculateRecommendations(
                request.user.id,
                answers
            );


        /*
        DELETE PREVIOUS RESULTS
        */

        await db.execute(
            `
            DELETE FROM career_recommendations
            WHERE student_id=?
            `,
            [request.user.id]
        );


        /*
        INSERT NEW RESULTS
        */

        for (
            const item
            of result.recommendations
        ) {

            await db.execute(
                `
                INSERT INTO career_recommendations
                (
                    student_id,
                    career_id,
                    match_percentage,
                    reason
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    request.user.id,
                    item.career.id,
                    item.match_percentage,
                    item.reason
                ]
            );

        }


        const best =
            result.recommendations[0];


        response.json({

            success: true,

            message:
                "Career recommendations generated.",

            result: {

                recommended_career:
                    best
                        ? resultName(
                            best.career.career_name
                        )
                        : null,

                match_percentage:
                    best
                        ? best.match_percentage
                        : 0

            },

            alternative:
                result.recommendations
                    .slice(1)
                    .map(function (item) {

                        return resultName(
                            item.career.career_name
                        );

                    })

        });

    } catch (error) {

        console.error(
            "Career assessment error:",
            error
        );

        response.status(500).json({

            success: false,

            message:
                "Unable to submit career assessment."

        });

    }

}


/*
=====================================================
RESET CAREER ASSESSMENT
=====================================================
*/

async function resetCareer(
    request,
    response
) {

    try {

        if (
            request.user.role !== "admin"
        ) {

            return response.status(403).json({

                success: false,

                message:
                    "Administrator access required."

            });

        }


        await db.execute(
            `
            DELETE FROM career_recommendations
            WHERE student_id=?
            `,
            [request.params.studentId]
        );


        response.json({

            success: true,

            message:
                "Career guidance reset."

        });

    } catch (error) {

        console.error(
            "Reset career error:",
            error
        );

        response.status(500).json({

            success: false,

            message:
                "Unable to reset career guidance."

        });

    }

}


/*
=====================================================
EXPORT CONTROLLERS
=====================================================
*/

module.exports = {

    getCareers,
    getCareer,
    createCareer,
    updateCareer,
    deleteCareer,

    predictCareer,
    recommendations,

    questions,
    submitAssessment,
    resetCareer

};
