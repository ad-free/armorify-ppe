# NBE Hoang Duy (NBE Hoàng Duy)

[![CI](https://github.com/ad-free/armorify-ppe/actions/workflows/ci.yml/badge.svg)](https://github.com/ad-free/armorify-ppe/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.135.3-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6.svg)](https://www.typescriptlang.org/)

**NBE HOANG DUY – Professional & Durable Personal Protective Equipment Solutions.**

NBE Hoang Duy is a specialized e-commerce platform for Personal Protective Equipment (PPE), built on a modern Full-stack architecture. The system provides a seamless shopping experience for both wholesale partners (Distributors) and retail customers, featuring real-time tracking, an intuitive cart system, and secure checkout flows.

---

## 🚀 Key Features

### 🎨 Frontend & User Experience
- **Multi-tier MegaMenu**: Intelligent vertical category system displaying featured brands and sub-categories.
- **Category Floors**: Homepage "Floor-based" layout (Shoes Floor, Helmet Floor) optimized for SEO and conversion.
- **Persistent Shopping Cart**: Automatic local storage synchronization using Zustand logic.
- **Guest Checkout**: Streamlined order process for guest users with support for COD and Bank Transfer payments.
- **Responsive UI**: Pixel-perfect scaling from Ultra-wide monitors down to smartphones.
- **Premium Branding**: Implementing a professional Emerald Green & Ruby Red color palette.

### ⚙️ Core System (Backend)
- **High-Performance RESTful API**: Built with FastAPI utilizing asynchronous processing (async/await).
- **Catalog Management**: Sophisticated paginated API for Products, Brands, and Categories.
- **JWT Authentication**: Secure login/registration system for regular users and corporate distributors.
- **Data Optimization**: Built on SQLAlchemy 2.0 with native soft-delete (`is_active`) and timestamp management.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18, Vite 5.x
- **Language**: TypeScript 5.9.3
- **Styling**: Tailwind CSS + Shadcn/UI
- **State management**: Zustand
- **Data fetching**: TanStack Query (React Query) v5
- **Animations**: Framer Motion

### Backend
- **Framework**: FastAPI
- **Database**: PostgreSQL + SQLAlchemy 2.0 (Async)
- **Security**: JWT tokens, Bcrypt hashing
- **Schema**: Pydantic v2

---

## 📋 Prerequisites

- **Node.js**: 20.x or higher
- **Python**: 3.14+
- **PostgreSQL**: 12+
- **Git**

---

## 🚀 Quick Start Guide

### 1. Clone the Repository
```bash
git clone https://github.com/ad-free/armorify-ppe.git
cd armorify-ppe
```

### 2. Backend Setup
```bash
cd backend
# Create venv and install dependencies
python -m venv .venv
.\.venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Configure Environment
cp .env.example .env

# Run migrations (Requires running PostgreSQL)
alembic upgrade head

# Start Development Server
uvicorn app.main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
# Install dependencies
npm install

# Start Development Environment
npm run dev
```

The system will be available at:
- Frontend: `http://localhost:5173`
- Backend Docs: `http://127.0.0.1:8000/docs`

---

## 🛠 Quality Control & Developer Experience

The project maintains strict code quality standards through automated tools:

### Frontend
- **ESLint v8**: Advanced syntax and logic validation.
- **Pre-commit Hooks**: Managed via **Husky** & **Lint-staged**. The system automatically runs `eslint --fix` on modified files during the `git commit` process.

### Backend
- **Ruff**: Ultra-fast Python Linter and Formatter.
- **mypy**: Static type checking for robust data integrity.

---

## 📂 Project Structure

```
armorify-ppe/
├── backend/                # FastAPI application
│   ├── app/
│   │   ├── routers/        # API endpoints
│   │   ├── models/         # SQLAlchemy models
│   │   └── schemas/        # Pydantic schemas
├── frontend/               # Vite/React application
│   ├── src/
│   │   ├── components/     # UI components & sections
│   │   ├── hooks/          # API hooks (React Query)
│   │   └── store/          # Global state (Zustand)
├── .husky/                 # Git hooks configuration
├── .pre-commit-config.yaml # Central pre-commit config (Legacy/Python)
└── README.md
```

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit your changes (Husky will automatically run linting): `git commit -m 'Add amazing feature'`
3. Push to the branch: `git push origin feature/amazing-feature`
4. Open a Pull Request.

---

## 📄 License

This project is licensed under the rights of **NBE HOANG DUY**.
© 2026 NBE HOANG DUY CO., LTD. All rights reserved.

---
**Built with ❤️ to ensure safety and reliability for every professional environment.**
