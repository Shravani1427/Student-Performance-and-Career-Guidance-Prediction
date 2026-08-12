CREATE DATABASE IF NOT EXISTS Student_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE Student_system;

SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS student_skill_progress;
DROP TABLE IF EXISTS career_path_skills;
DROP TABLE IF EXISTS student_career_paths;
DROP TABLE IF EXISTS complaints;
DROP TABLE IF EXISTS career_recommendations;
DROP TABLE IF EXISTS careers;
DROP TABLE IF EXISTS performance;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS students;
SET FOREIGN_KEY_CHECKS=1;

CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  role ENUM('student','admin') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_students_role (role)
) ENGINE=InnoDB;

CREATE TABLE profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL UNIQUE,
  date_of_birth DATE NULL,
  gender VARCHAR(30) NULL,
  address TEXT NULL,
  course VARCHAR(120) NULL,
  semester INT NULL,
  skills TEXT NULL,
  interests TEXT NULL,
  study_hours DECIMAL(5,2) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_profiles_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE performance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  subject_name VARCHAR(120) NOT NULL,
  marks_obtained DECIMAL(6,2) NOT NULL,
  total_marks DECIMAL(6,2) NOT NULL,
  attendance DECIMAL(5,2) NOT NULL DEFAULT 0,
  semester INT NOT NULL,
  academic_year VARCHAR(30) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_performance_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_performance_student (student_id),
  INDEX idx_performance_semester (semester)
) ENGINE=InnoDB;

CREATE TABLE careers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  career_name VARCHAR(140) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  required_skills TEXT NOT NULL,
  required_interests TEXT NOT NULL,
  min_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  career_category VARCHAR(80) NOT NULL,
  salary_range VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE career_recommendations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  career_id INT NOT NULL,
  match_percentage DECIMAL(5,2) NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_recommendation_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_recommendation_career FOREIGN KEY (career_id) REFERENCES careers(id) ON DELETE CASCADE,
  INDEX idx_recommendation_student (student_id)
) ENGINE=InnoDB;

CREATE TABLE complaints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  category VARCHAR(60) NOT NULL DEFAULT 'Other',
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('pending','in_progress','resolved') NOT NULL DEFAULT 'pending',
  admin_response TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_complaint_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_complaints_student (student_id),
  INDEX idx_complaints_status (status)
) ENGINE=InnoDB;

CREATE TABLE student_career_paths (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL UNIQUE,
  career_name VARCHAR(140) NOT NULL,
  progress_percentage INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_path_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE career_path_skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  career_name VARCHAR(140) NOT NULL,
  skill_name VARCHAR(140) NOT NULL,
  description TEXT,
  skill_order INT NOT NULL,
  UNIQUE KEY unique_career_skill (career_name, skill_name)
) ENGINE=InnoDB;

CREATE TABLE student_skill_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  skill_id INT NOT NULL,
  status ENUM('not_started','learning','completed') NOT NULL DEFAULT 'not_started',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_student_skill (student_id, skill_id),
  CONSTRAINT fk_progress_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_skill FOREIGN KEY (skill_id) REFERENCES career_path_skills(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Passwords are bcryptjs hashes. Demo admin: admin@college.com / admin123. Demo student: priya@college.com / student123.
INSERT INTO students (id,name,email,password,phone,role) VALUES
(1,'Administrator','admin@college.com','$2b$10$cyD5T/R.LJ7eLCkJOPuBbO71NsLo75PWElYpDzJBXxm.8KdRu0exK','9000000000','admin'),
(2,'Priya Sharma','priya@college.com','$2b$10$b/L1IlE3O1V0W0CrqjQaxOWmnG1odAV/6MfikHbrw3.jyY8TN9DZq','9876543210','student'),
(3,'Rahul Patil','rahul@college.com','$2b$10$b/L1IlE3O1V0W0CrqjQaxOWmnG1odAV/6MfikHbrw3.jyY8TN9DZq','9876543211','student');

INSERT INTO profiles (student_id,course,semester,skills,interests,study_hours,address) VALUES
(1,'Administration',1,'Management','System administration',8,'College office'),
(2,'Information Technology',5,'Python, SQL, Excel, Data Analysis','Data, programming, mathematics',4,'College campus'),
(3,'Computer Science',5,'JavaScript, Java, SQL, Web Development','Web development, software',3,'College campus');

INSERT INTO performance (student_id,subject_name,marks_obtained,total_marks,attendance,semester,academic_year) VALUES
(2,'Programming',86,100,92,5,'2025-26'),(2,'Database Systems',91,100,88,5,'2025-26'),(2,'Web Technologies',79,100,86,5,'2025-26'),(2,'Mathematics',83,100,84,5,'2025-26'),(2,'Computer Networks',76,100,78,5,'2025-26'),
(3,'Programming',88,100,90,5,'2025-26'),(3,'Database Systems',84,100,85,5,'2025-26'),(3,'Web Technologies',82,100,91,5,'2025-26');

INSERT INTO careers (career_name,description,required_skills,required_interests,min_percentage,career_category,salary_range) VALUES
('Web Developer','Builds responsive websites and web applications.','HTML,CSS,JavaScript,Node.js,APIs','web,design,programming,technology',45,'Technology','₹3 - ₹22 LPA'),
('Data Analyst','Turns data into reports, dashboards, and business insights.','Excel,SQL,Python,Statistics,Power BI','data,mathematics,analysis,technology',55,'Data','₹3.5 - ₹20 LPA'),
('AI/ML Engineer','Builds machine learning systems and intelligent applications.','Python,Statistics,NumPy,Machine Learning,SQL','artificial intelligence,data,mathematics,research',65,'Artificial Intelligence','₹6 - ₹35 LPA'),
('Cybersecurity Analyst','Protects systems, networks, and data from security threats.','Networking,Linux,Security,Ethical Hacking','security,networking,technology,problem solving',55,'Security','₹4 - ₹28 LPA'),
('Cloud Engineer','Designs and maintains cloud infrastructure and deployments.','Linux,Networking,Git,AWS,Databases','cloud,technology,systems,networking',60,'Cloud','₹5 - ₹30 LPA'),
('Software Developer','Designs, builds, tests, and maintains software applications.','Programming,OOP,Algorithms,Git,SQL,APIs','programming,software,problem solving,technology',50,'Technology','₹4 - ₹30 LPA'),
('Database Administrator','Manages secure, reliable, and efficient database systems.','SQL,MySQL,Database Design,Backup,Security','database,data,systems,technology',50,'Data','₹3.5 - ₹22 LPA'),
('Network Engineer','Plans, configures, and troubleshoots computer networks.','TCP/IP,Routing,Switching,Linux,Network Security','networking,systems,security,technology',45,'Infrastructure','₹3 - ₹18 LPA'),
('UI/UX Designer','Creates clear, useful, and attractive digital user experiences.','Figma,Wireframing,Prototyping,User Research,UI Design','design,creativity,users,visuals',45,'Design','₹3 - ₹22 LPA'),
('Business Analyst','Connects business needs with practical technology solutions.','Excel,Requirements,Process Mapping,SQL,Communication','business,management,analysis,communication',50,'Business','₹4 - ₹25 LPA');

INSERT INTO student_career_paths (student_id,career_name,progress_percentage) VALUES (2,'Data Analyst',40),(3,'Web Developer',20);
INSERT INTO career_path_skills (career_name,skill_name,description,skill_order) VALUES
('Data Analyst','Excel','Organize and explore data in spreadsheets.',1),('Data Analyst','SQL','Extract useful information from databases.',2),('Data Analyst','Statistics','Understand trends and distributions.',3),('Data Analyst','Python','Automate analysis with readable code.',4),('Data Analyst','Pandas','Work with structured datasets.',5),('Data Analyst','Data Visualization','Turn numbers into clear charts.',6),('Data Analyst','Power BI','Create interactive dashboards.',7),
('Web Developer','HTML','Build accessible web structures.',1),('Web Developer','CSS','Design responsive interfaces.',2),('Web Developer','JavaScript','Add interaction to websites.',3),('Web Developer','Git & GitHub','Track and publish projects.',4),('Web Developer','Node.js','Run JavaScript on the server.',5),('Web Developer','Express.js','Build simple REST APIs.',6),('Web Developer','MySQL','Store application data.',7),
('Software Developer','Programming','Build a strong coding foundation.',1),('Software Developer','OOP','Write reusable object-oriented code.',2),('Software Developer','Data Structures','Practice core data structures.',3),('Software Developer','Algorithms','Solve coding problems.',4),('Software Developer','SQL','Query relational data.',5),
('UI/UX Designer','Design Principles','Learn hierarchy, contrast, and balance.',1),('UI/UX Designer','Figma','Create interfaces and components.',2),('UI/UX Designer','Wireframing','Plan screens before design.',3),('UI/UX Designer','Prototyping','Create clickable experiences.',4);
INSERT INTO student_skill_progress (student_id,skill_id,status) SELECT 2,id,IF(skill_order<=3,'completed','not_started') FROM career_path_skills WHERE career_name='Data Analyst';
INSERT INTO student_skill_progress (student_id,skill_id,status) SELECT 3,id,IF(skill_order<=2,'completed','not_started') FROM career_path_skills WHERE career_name='Web Developer';
