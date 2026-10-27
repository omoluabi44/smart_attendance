# Product Requirements Document (PRD): FacePass

| Parameter | Details |
| :--- | :--- |
| **Product Name** | FacePass |
| **Target Users** | University Lecturers and Academic Administrators |
| **Companion Product** | CoursePass (Student-facing portal) |
| **Document Status** | Draft |

---

## 1. Product Overview
FacePass is an automated, AI-driven attendance-taking and course management platform designed specifically for lecturers. Leveraging AWS Rekognition, FacePass allows lecturers to scan classrooms or individual students to instantly record attendance. The platform communicates synchronously with CoursePass—the student registration portal where biometric data and personal information are stored—to verify enrollments. Beyond attendance, FacePass provides robust tools for course auditing, material dissemination, and quiz management, easing the administrative burden on academic staff.

---

## 2. System Architecture & Interoperability
- **FacePass (Lecturer Portal):** Handles course creation, attendance execution, material sharing, and reporting.
- **CoursePass (Student Portal):** The source of truth for student identity. Students register their profiles, upload their face data, and enroll in courses here.
- **Integration:** FacePass and CoursePass communicate via secure APIs. When a student enrolls in a course on CoursePass, their profile and AWS Rekognition face collection metadata are instantly synced to the corresponding course roster on FacePass.

---

## 3. Core Features & Functional Requirements

### 3.1. Course Management
- **Course Creation:** Lecturers can create new courses with mandatory metadata:
  - Academic Session (e.g., 2026/2027).
  - Total Number of Classes (used as the baseline for calculating the 75% attendance eligibility).
- **Multi-Lecturer Support:** A single course can host multiple lecturers. The creator can invite co-lecturers or senior lecturers. Any invited lecturer can initiate an attendance scan, disseminate materials, or manage quizzes for that shared course.
- **Multi-Course Support:** A single lecturer can create, manage, and take attendance for an unlimited number of distinct courses.

### 3.2. AI-Powered Attendance (AWS Rekognition)
- **Scanning Mechanism:** Lecturers initiate a scan (via camera interface) during the lecture.
- **Verification & Logging:** The system cross-references detected faces with the CoursePass collection for that specific course roster. Recognized students are marked "Present".
- **Intruder/Unregistered Alert:** If a scanned face is not found in the CoursePass roster for that course, the system immediately alerts the lecturer that an unregistered student is present.

### 3.3. Dashboard & Reporting
- **Course Roster & Metrics:** The main course dashboard displays a limited, paginated list of enrolled students. The list includes the following data points for each student:
  - Level, Department, and Matric Number.
  - Total classes attended.
  - Attendance metric ratio (Number of classes attended / Total number of classes).
  - Eligibility Status (Boolean or color-coded indicator showing if the student meets the 75% attendance threshold).
- **CSV Export:** Lecturers and senior lecturers can download the complete attendance roster and metric report as a CSV file for external processing or university archiving.

### 3.4. Student Auditing
- **Search & Filter:** Lecturers can use a search bar and filtering options on the course dashboard to find specific students. Students can be searched or filtered by Matric Number, Department, or Level.
- **Individual Profile View:** Clicking a student reveals their deep-dive audit trail, including:
  - Complete chronological attendance history (dates and times present/absent).
  - Overall performance report (quiz grades and attendance combined).
- **Individual Export:** The individual student audit report must be downloadable.

### 3.5. Communication & Material Dissemination
- **Content Sharing:** Lecturers can upload and distribute course materials directly to the enrolled roster.
- **Supported Formats:** Lecture notes (PDF, DOCX), external useful links, and general text announcements.
- **Sync:** Materials posted on FacePass are pushed to the enrolled students' dashboards on CoursePass.

### 3.6. Quiz Management
- **Scheduling:** Lecturers can schedule or unschedule quizzes for enrolled students, specifying the exact date and time.
- **Quiz Types:** Quizzes can be toggled as Graded or Ungraded.
- **Analytics:** Upon quiz completion (taken by students via CoursePass), lecturers can view comprehensive quiz performance reports and grade distributions directly within FacePass.

### 3.7. Student Visibility & Tracking (CoursePass Integration)
- **Comprehensive Attendance Dashboard:** Students logging into CoursePass will have a dedicated metrics view for each enrolled course. This interface will display their complete chronological attendance record, explicitly categorizing each class session as either "Attended" or "Missed."
- **Real-Time Attendance Notifications:** The system guarantees immediate feedback to the student. Upon a successful face scan and attendance confirmation by the lecturer in FacePass, a webhook triggers a real-time event (utilizing WebSockets or Server-Sent Events) to CoursePass. Students will receive an instant in-app dashboard notification confirming their presence has been recorded for that specific session.

---

## 4. Communication Flow Details

### 1. Identity & Enrollment (CoursePass -> FacePass)
- The student creates an account, uploads their photo, and registers for a course on CoursePass.
- CoursePass indexes the photo in AWS Rekognition and generates a unique Face ID.
- CoursePass sends a secure API payload to FacePass (Student Name, ID, Department, Face ID, and Course ID).
- FacePass updates the lecturer's roster for that specific course, making the student eligible for attendance.

### 2. The Classroom Scan (FacePass -> AWS)
- During a lecture, the lecturer initiates an attendance scan via FacePass.
- FacePass sends the captured classroom image directly to AWS Rekognition to search for matches against the course's enrolled Face IDs.
- AWS returns the matches. FacePass marks those specific students as "Present" and calculates their new 75% eligibility metric.
- If AWS detects a face that belongs to the university but is not on this course's roster, FacePass instantly triggers an "Unregistered Student" alert on the lecturer's screen.

### 3. Real-Time Student Notification (FacePass -> CoursePass)
- The exact moment FacePass logs a student as "Present", it fires an asynchronous webhook to the CoursePass servers.
- CoursePass receives this event and instantly updates the student's permanent database record, categorizing that session as "Attended" (and marking unscanned students as "Missed").
- Using WebSockets, CoursePass pushes a live notification to the student's dashboard, alerting them immediately that their attendance was successfully captured for that class.

### 4. Coursework & Auditing (Bi-directional)
- **Lecturer to Student:** When a lecturer uploads materials or schedules a quiz on FacePass, an API call pushes that content to the CoursePass database so students see it on their portal.
- **Student to Lecturer:** When a student completes a quiz on CoursePass, the system grades it and sends an API payload back to FacePass, updating the lecturer's course auditing dashboard and CSV export data.

---

## 5. Out of Scope (For FacePass v1)
- Student account creation and profile management (handled entirely by CoursePass).
- Facial data upload and initial biometric processing (handled by CoursePass).

---

## 6. Security & Privacy
- Face collections must be compartmentalized per course to optimize AWS Rekognition search latency and reduce false positives.
- No biometric images are stored locally on lecturer devices; all processing is handled cloud-side via AWS.
- Service-to-Service Authentication: Secure server-to-server API keys or OAuth 2.0 Client Credentials.
- Data Encryption: All data passed between the two platforms encrypted in transit using TLS 1.3.
