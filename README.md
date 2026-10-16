# 🚆 RailConnect — Railway Reservation System

<p align="center">
  <img
    src="images/homepage.png"
    alt="RailConnect Railway Reservation System Homepage"
    width="100%"
  />
</p>

<p align="center">
  A modern railway reservation platform built with Next.js,
  TypeScript, MongoDB, C++ and Data Structures & Algorithms.
</p>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Project Architecture](#-project-architecture)
- [Booking Workflow](#-booking-workflow)
- [DSA Implementation](#-dsa-implementation)
- [Project Structure](#-project-structure)
- [Installation and Setup](#-installation-and-setup)
- [Environment Variables](#-environment-variables)
- [Future Roadmap](#-future-roadmap)
- [Project Status](#-project-status)

## 🎯 Overview

RailConnect is a railway reservation project designed to combine a modern web interface with backend functionality and a separate C++ DSA module.

The project is organized into two main components:

- **Web Application:** Provides the user interface, authentication, booking workflow, and database integration.
- **C++ DSA Module:** Demonstrates railway reservation operations using C++, object-oriented programming, searching, sorting, and file handling.

The long-term goal is to connect these components while maintaining a clear separation between the web application and the DSA implementation.

## ✨ Features

### Web Application

- User registration and login
- Authentication using session cookies
- Train browsing and search interface
- Seat selection interface
- Booking review and confirmation flow
- My Bookings page
- User profile page
- Account settings interface
- MongoDB database integration
- Responsive interface built with Tailwind CSS

### C++ DSA Module

- Train and station management
- Searching and sorting operations
- Booking and cancellation logic
- Booking history management
- Waiting-list functionality
- Text-file-based data storage
- Object-oriented design using classes and headers

*The availability and completion of individual features depend on the current implementation.*

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| Next.js | Web application framework |
| React | User interface |
| TypeScript | Type-safe web development |
| Tailwind CSS | Styling and responsive layouts |
| Node.js | JavaScript runtime |
| MongoDB | Application data storage |
| Mongoose | MongoDB object modeling |
| JWT / JOSE | Session token handling |
| C++ | DSA implementation |
| STL Vector | Dynamic data storage |
| File Handling | Text-based data persistence |
| Git & GitHub | Version control and project hosting |

## 🏗️ Project Architecture

```text
RailwayReservationSystem/
│
├── web/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── bookings/
│   │   │   └── profile/
│   │   ├── booking/
│   │   ├── bookings/
│   │   ├── dashboard/
│   │   ├── login/
│   │   ├── profile/
│   │   ├── register/
│   │   ├── settings/
│   │   └── trains/
│   ├── components/
│   ├── lib/
│   ├── models/
│   ├── public/
│   ├── package.json
│   └── README.md
│
├── dsa/
│   ├── data/
│   ├── include/
│   ├── src/
│   ├── tests/
│   ├── compile.bat
│   └── README.md
│
└── README.md
```

## 🔄 Booking Workflow

The intended web booking flow is:

1. A user registers or logs in.
2. The user browses trains and searches for a journey.
3. The user selects a train and seats.
4. The user reviews the booking details.
5. The booking API validates and stores the booking in MongoDB.
6. The application displays the booking confirmation.
7. The user can view their bookings.

The actual availability of trains, seat inventory, and booking confirmation depends on the data and business logic implemented in the application.

## 🧠 DSA Implementation

The C++ module is maintained separately from the web interface to demonstrate DSA concepts for academic learning and project evaluation.

| Concept | Application |
|---|---|
| Vector | Storing and managing records dynamically |
| Searching | Finding trains or stations |
| Sorting | Organizing train records |
| OOP | Representing trains, stations, and bookings |
| File Handling | Reading and writing text files |
| Booking History | Maintaining booking records |
| Waiting List | Managing passengers awaiting seats |

The C++ implementation is located in `dsa/`. Integration between the C++ engine and the Next.js application is a future development task unless explicitly implemented in the code.

## ⚙️ Installation and Setup

### Prerequisites

Install the following tools:

- Node.js and npm
- Git
- A MongoDB database, such as MongoDB Atlas
- A C++ compiler such as GCC/g++

### 1. Clone the Repository

```bash
git clone https://github.com/212myash/RailwayReservationSystem.git
cd RailwayReservationSystem
```

### 2. Set Up the Web Application

```bash
cd web
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file inside the `web/` directory.

```env
MONGODB_URI=your_mongodb_connection_string
AUTH_SECRET=your_long_random_secret
```

Replace the example values with your own credentials. Never commit `.env.local`, database passwords, or authentication secrets to GitHub.

### 4. Start the Development Server

```bash
npm run dev
```

Open the local URL shown in the terminal, usually:

`http://localhost:3000`

### 5. Compile the C++ Module

Open a terminal in the `dsa/` directory and run:

```bash
g++ -std=c++17 -I include src/*.cpp -o RailwayReservationSystem.exe
```

Run the generated executable according to the program's CLI interface.

If compilation fails because of multiple `main()` functions, compile the main application separately from the test source files.

## 🔐 Environment Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `AUTH_SECRET` | Secret used for signing authentication tokens |

Use your own environment values. Do not publish credentials, private keys, real passenger information, or production secrets.

## 🚀 Future Roadmap

- [ ] Connect the C++ DSA engine to the web application through a defined interface.
- [ ] Integrate DSA-based train search and sorting into the website.
- [ ] Improve seat availability validation and prevent duplicate seat allocation.
- [ ] Strengthen booking cancellation and waiting-list handling.
- [ ] Complete and test account profile and password update APIs.
- [ ] Add an administrative dashboard for managing trains, stations, and bookings.
- [ ] Add comprehensive API and DSA unit tests.
- [ ] Improve error handling, validation, and security.
- [ ] Deploy the web application and configure production environment variables.
- [ ] Add verified UI screenshots and a project demonstration.

## 📊 Project Status

**Current development stage:** Active development.

The web application, authentication flow, booking pages, MongoDB integration, and separate C++ DSA module form the foundation of the project. Further integration, testing, and production deployment remain part of the development roadmap.

## 👨‍💻 Author

**Yash Raj**

GitHub: [@212myash](https://github.com/212myash)

Repository: [RailwayReservationSystem](https://github.com/212myash/RailwayReservationSystem)

---

*RailConnect — Building a modern railway reservation experience while learning and applying Data Structures & Algorithms.*