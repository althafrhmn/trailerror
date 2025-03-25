Below is a consolidated project prompt based on your requirements. Please review it and let me know if any modifications or additional details are needed:

---

### MERN Stack Attendance & Leave Management System Project Prompt

**Project Overview:**  
Develop a full-stack web application using the MERN (MongoDB, Express, React, Node.js) stack. The application is designed for a college to manage attendance, latecomer tracking, and leave management. It features role-based access with separate interfaces for admin, faculty, students, and parents. The system also integrates email notifications (via Gmail) and in-app push notifications (using polling) to ensure that all stakeholders are kept informed.

---

**Key Features & Requirements:**

1. **User Roles & Access:**
   - **Admin:**  
     - Ultimate access to the website.  
     - Can add or remove all users (students, faculty, parents).  
     - Can modify attendance records and change passwords.  
     - Tracks an audit log of all modifications.
   - **Faculty:**  
     - Login via a common interface with role selection.  
     - Can only view the list of students assigned to them.  
     - Manage attendance records: upload, check attendance, and manually mark latecomers.  
     - Approve or reject leave letters with an option to provide a rejection reason.  
     - Manage important dates (exams, events) and update/change the timetable.  
     - Send both general announcements and individual messages to students and parents.
   - **Students:**  
     - Login via the common role-based interface (username is their admission number).  
     - View their attendance details: subject-wise (total hours, attended hours, missed hours, percentage) and overall average attendance.  
     - Submit leave letters as plain text via a form.  
     - Edit submitted leave letters within a 15-minute window before faculty approval.
     - View notifications and messages from faculty.
   - **Parents:**  
     - Login via the same interface.  
     - Can only view attendance details of their own child (subject-wise and overall).  
     - Receive leave letters submitted by their child with the ability to accept or reject them. (Only after parent's acceptance will the leave letter be forwarded to faculty.)
     - Receive notifications and messages from faculty.

2. **Attendance Monitoring & Latecomer Management:**
   - **Attendance:**  
     - Faculty can upload and manage attendance records.
     - Records should detail attendance on a subject-wise basis.
     - Automatic half-day leave deduction is triggered if a student is marked late manually for 3 consecutive days.  
     - There should be an option to override or adjust the automatic half-day deduction.
   - **Latecomer Entry:**  
     - Latecomers are marked manually via a dedicated tab or page.
     - Once a student is marked late, notifications are pushed both on the website and via email to the corresponding parent (and relevant stakeholders).

3. **Leave Letter Management:**
   - Students submit leave letters as plain text via a form with all necessary fields.
   - Students are allowed to edit a submitted leave letter for up to 15 minutes after submission, provided it has not been approved.
   - Faculty review these leave letters and can approve or reject them, providing a rejection reason if applicable.
   - Upon decision (approval/rejection), notifications are sent as push notifications on the website and via email to the student (and parent if applicable).

4. **Email & Notification Services:**
   - **Email Notifications:**  
     - Uses Gmail (with an app password provided) to send notifications.
     - Email notifications will be sent for late attendance, leave letter updates, and any important announcements.
     - Include error handling and retry mechanisms for any email failures.
   - **In-App Notifications:**  
     - Implemented via periodic polling.
     - Notifications are categorized (e.g., late attendance alerts, leave letter updates, general announcements).
     - Notifications are stored permanently.

5. **UI/UX & Front-End Design:**
   - Use a combination of Bootstrap, Material UI, and Tailwind CSS to achieve a modern and responsive design.
   - Primary color scheme: navy blue and white.
   - The design should include modern animations, hover effects, and be optimized for mobile, tablet, and desktop views.
   - The login interface is attractive and features role selection in a single interface (no separate sign-up – new students are added only by admin).

6. **Data Management & Archiving:**
   - Use MongoDB Atlas (cloud version) for the database.
   - All passwords are stored in plain text (for development purposes).
   - Attendance and leave records should be archived at the end of each semester into separate collections.
   - Sample data for testing should include multiple semesters with the following fields for students:  
     - Name  
     - Roll number  
     - Admission number  
     - Gender  
     - Academic year  
     - Department  
     - Semester  
     - Date of birth (DOB)  
     - Phone number

7. **Additional Functionalities:**
   - **Authentication & Security:**  
     - Secure login is required.
     - No forgot password/username functionality; password editing is available only from the profile page or by the admin.
   - **Audit Logs:**  
     - Maintain audit logs to track changes made by the admin (and potentially other critical actions).
   - **Timetable & Important Dates:**  
     - All roles have access to view timetables and important dates (exams, events), with faculty and admin having the ability to modify them.

---

**Technical Stack & Libraries:**

- **Backend:** Node.js with Express.js
- **Frontend:** React.js with the combined use of Bootstrap, Material UI, and Tailwind CSS
- **Database:** MongoDB Atlas
- **Email Service:** Gmail (with error handling)
- **Notifications:** Implemented via polling (with categorized notifications)
- **Data Seeding:** Use a seeder script to populate the database with sample data for multiple semesters.

---

