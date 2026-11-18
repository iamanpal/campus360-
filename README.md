# Campus 360 – College Management System

Campus 360 is a college management web application developed to manage different college activities in one place.

The project has separate sections for students, faculty members, and administrators. Each user can access features according to their role.

The main aim of this project is to make common college tasks easier, such as managing attendance, assignments, results, notices, and student records.

## Features

### 1. Public Website
- Home page with college information.
- About and courses sections.
- Campus facilities and gallery.
- Notice board for college updates.
- Contact page for inquiries.
- Login and registration options.

### 2. Student Portal
- Student dashboard.
- View attendance records.
- Check class timetable.
- View and submit assignments.
- Check examination results.
- Access study materials.
- Apply for leave.
- Manage profile information.

### 3. Faculty Portal
- Faculty dashboard.
- View assigned subjects and students.
- Mark student attendance.
- Create and manage assignments.
- Check student submissions.
- Enter examination marks.
- Upload study materials.
- Manage student leave requests.

### 4. Admin Panel
- Admin dashboard.
- Manage student and faculty records.
- Approve student registrations.
- Manage courses and departments.
- Manage subjects and timetable.
- Publish college notices.
- Manage complaints.
- Manage campus gallery.

## Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Page structure |
| CSS3 | Styling and layout |
| JavaScript | Frontend functionality |
| Node.js | Backend runtime |
| Express.js | Server and API development |
| MongoDB | Database |
| Mongoose | Database interaction |
| JWT | User authentication |
| bcryptjs | Password hashing |

## Project Structure

```text
campus360/
│
├── config/
│   └── db.js
│
├── controllers/
│
├── middleware/
│
├── models/
│
├── public/
│   ├── css/
│   ├── js/
│   └── pages/
│
├── css/
│   ├── style.css
│   └── pages.css
│
├── js/
│   ├── main.js
│   └── login.js
│
├── scripts/
│
├── server.js
├── package.json
├── .gitignore
└── .gitattributes
```

## Installation and Setup

Follow these steps to run the project on your local machine.

### Requirements

- Node.js
- MongoDB
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/iamanpal/campus360-.git
```

### 2. Open the Project Folder

```bash
cd campus360-
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the root folder and add:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/campus360
JWT_SECRET=your_secret_key
```

Update the database URL and JWT secret according to your setup.

### 5. Run the Project

For development:

```bash
npm run dev
```

Or start the application using:

```bash
npm start
```

### 6. Open in Browser

```text
http://localhost:3000
```

## Authentication and Security

- JWT-based user authentication.
- Password hashing using bcryptjs.
- Separate access for Admin, Faculty, and Students.
- Protected routes using authentication middleware.

## Project Details

- **Project Name:** Campus 360
- **Project Type:** Full Stack Web Application
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MongoDB

## License

This project is licensed under the ISC License.
