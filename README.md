# 🧾 AI-Powered Invoice Generator

An advanced, full-stack web application designed to streamline the billing process using Artificial Intelligence. This project is built using modern web technologies (React, Node.js, Express, and MongoDB) and provides smart insights, automated invoice generation, and seamless management tools.

## ✨ Features

* **🤖 AI-Assisted Invoicing:** Generate professional invoices automatically and get smart financial insights using integrated AI models.
* **🔐 Secure Authentication:** Full user authentication system (Login/Signup) with protected routes and context-based state management.
* **📊 Comprehensive Dashboard:** Manage all your invoices, view analytics, and track payments in a centralized, intuitive interface.
* **📄 PDF Generation & Export:** Easily convert and download your invoices as high-quality PDFs.
* **✉️ Smart Reminders:** Built-in modal for sending payment reminders to clients.
* **🎨 Modern UI/UX:** Responsive, component-driven frontend architecture utilizing Vite and React.

## 🛠️ Tech Stack

**Frontend:**
* [React.js](https://reactjs.org/) (UI Library)
* [Vite](https://vitejs.dev/) (Build Tool)
* [Axios](https://axios-http.com/) (HTTP Client)
* Context API (State Management)

**Backend:**
* [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/) (Server Framework)
* [MongoDB](https://www.mongodb.com/) & Mongoose (Database & ORM)
* JWT (JSON Web Tokens for Authentication)

## 📁 Project Structure

The repository is organized into a monorepo setup containing both the frontend and backend:

```text
📦 AI-Powered-Invoice-Generator
 ┣ 📂 backend                 # Express REST API
 ┃ ┣ 📂 config                # Database and environment configurations
 ┃ ┣ 📂 controllers           # Logic for AI, Auth, and Invoices
 ┃ ┣ 📂 middlewares           # Custom middlewares (e.g., authMiddleware)
 ┃ ┣ 📂 models                # Mongoose database schemas (User, Invoice)
 ┃ ┣ 📂 routes                # Express API routes
 ┃ ┗ 📜 server.js             # Entry point for the backend server
 ┗ 📂 frontend/invoice-generator # React + Vite application
   ┣ 📂 src
   ┃ ┣ 📂 components          # Reusable UI components (Auth, Invoices, Layouts)
   ┃ ┣ 📂 context             # React Context (AuthContext)
   ┃ ┣ 📂 pages               # Full-page views (Dashboard, LandingPage, Profile)
   ┃ ┣ 📂 utils               # Helper functions, API paths, Axios instance, PDF tools
   ┃ ┣ 📜 App.jsx             # Root React component
   ┃ ┗ 📜 main.jsx            # Frontend entry point
   ┗ 📜 vite.config.js        # Vite bundler configuration
```

## 🚀 Getting Started

Follow these steps to run the project locally on your machine.

### Prerequisites
* [Node.js](https://nodejs.org/en/) (v16 or higher)
* [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/AI-Powered-Invoice-Generator.git
cd AI-Powered-Invoice-Generator
```

### 2. Backend Setup
```bash
cd backend
npm install
```
* Create a `.env` file in the `backend` directory and add your environment variables (e.g., `MONGO_URI`, `JWT_SECRET`, `AI_API_KEY`, `PORT`).
* Start the development server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal window and navigate to the frontend directory:
```bash
cd frontend/invoice-generator
npm install
```
* Create a `.env` file in the `frontend` directory and add your backend API URL (e.g., `VITE_API_BASE_URL=http://localhost:5000/api`).
* Start the Vite development server:
```bash
npm run dev
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📝 License

This project is licensed under the MIT License.
