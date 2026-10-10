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
- **Content-rich storefront**: Homepage includes dynamic hero banners, trust highlights, and floor-based category showcases.
- **Product discovery flow**: Public catalog supports category browsing, search, filtering, sorting, and pagination.
- **Detailed product pages**: Product detail experience includes image galleries, variants, related products, and review sections.
- **Commerce-ready checkout**: Cart state is persisted with Zustand and users can complete guest checkout.
- **Order self-service**: Built-in order tracking form lets customers check order status by code and phone number.
- **Expanded public pages**: Dedicated routes for blogs, videos, dealer recruitment, brands, and user profile screens.

### ⚙️ Core System (Backend)
- **Layered API architecture**: FastAPI routers are split into public, authenticated, staff, and admin access layers.
- **Catalog and CMS services**: APIs cover products, categories, brands, banners, and page content management.
- **Order workflows**: Supports guest order creation, order lookup/tracking, and protected order/cart/address operations.
- **Role-based access control**: JWT authentication with user/admin roles and enforced staff/admin dependencies.
- **Admin operations**: Endpoints available for managing users, catalog resources, orders, quotes, and CMS data.
- **Production-oriented foundation**: Async SQLAlchemy 2.0, soft-delete semantics (`is_active`), security middleware, and health checks.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18, Vite 5.x
- **Language**: TypeScript 5.9.3
- **Styling**: Tailwind CSS 3 + shared CSS tokens and React UI primitives
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

### Phase 1 UI foundation

Storefront and admin share tokens in `frontend/src/index.css`, exposed through
`frontend/tailwind.config.js`. Use semantic colors instead of page-specific hex values.

| Role | Tokens / convention |
|---|---|
| Primary actions | `primary`, `primary-hover`, `primary-soft`; emerald |
| Neutral surfaces and content | `surface`, `background`, `muted`, `foreground`, `muted-foreground`; white/slate |
| Feedback | `success`, `warning`, `destructive` and their `*-soft` surfaces |
| Borders | `border` for surfaces, `input` for interactive field boundaries |
| Typography | Manrope 400–800; 12/14/16/18/20/24/30px, responsive page headings |
| Spacing | Tailwind's 4px-based scale; `xs/sm/md/lg/xl` = 4/8/16/24/32px |
| Shape | `rounded-sm/md/lg` = 4/8/12px; `shadow-sm/md` only for restrained elevation |
| Containers | 1280px maximum; 16/24/32px gutters on mobile/tablet/desktop |

Reuse `Button`, `FeedbackState`, and `Skeleton` from
`frontend/src/components/ui/Primitives.tsx`. `Button` supports `primary`, `secondary`,
`ghost`, and `danger`, forwards its ref/native props, and disables itself while `loading`.
For links use `btn` plus a variant; for native inputs/selects/textareas use `field`,
`field-label`, and `field-error`. Associate errors using `aria-invalid` and
`aria-describedby`. Other shared styles: `card`, `badge` + `badge-neutral/success/warning/error`,
`page-heading`, `section-heading`, `table-shell`, and `dialog-panel`.

Shared controls have 44px targets and visible keyboard focus. CSS and Framer Motion
respect reduced-motion preferences. Admin mobile navigation uses a native modal dialog
with Tab containment, Escape dismissal, and trigger focus restoration. Tables scroll
inside their own region on narrow screens. Red is reserved for errors, destructive actions,
and genuine discounts; inactive/cancelled/refunded statuses are neutral.

Verify from `frontend/` with `npm run build && npm run lint`.
The Node TypeScript config emits declarations only, so builds do not leave a redundant
`vite.config.js` beside the source configuration or introduce generated-file lint errors.

Phase 2 should migrate page-specific storefront heroes, filters, footer, authentication
and checkout screens, dashboard cards/charts, and specialized product image/variant editors.
These still contain legacy uppercase labels, oversized radii, shadows, or decorative motion.
The removed admin search/sample-notification controls need real integrations before returning.


---

## � Deployment Workflow

This repository uses GitHub Actions to run linting and deploy only when relevant folders change:

- `backend/` changes trigger backend linting and deploy to Render on `push` to `master`.
- `frontend/` changes trigger frontend linting and deploy to GitHub Pages on `push` to `master`.
- After successful deploys, a release note is created automatically.

### Required repository secrets

- `RENDER_SERVICE_ID` — Render service identifier for backend deployment.
- `RENDER_API_KEY` — API key to authorize Render deploys.

### Deployment targets

- Backend: Render
- Frontend: GitHub Pages (`gh-pages` branch)

---

## �📂 Project Structure

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
