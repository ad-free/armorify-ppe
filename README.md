# Armorify PPE

[![CI](https://github.com/yourusername/armorify-ppe/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/armorify-ppe/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.14+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.135.3-green.svg)](https://fastapi.tiangolo.com/)

**Your smart gateway to professional safety solutions.**

Armorify PPE is a comprehensive e-commerce platform built with modern technologies, designed to provide businesses and individuals with easy access to high-quality personal protective equipment (PPE) and safety solutions.

## 🚀 Features

- **Product Catalog Management**: Complete CRUD operations for products, categories, and variants
- **User Management**: Secure user authentication and profile management
- **Order Processing**: Full order lifecycle management with status tracking
- **Quote Requests**: Professional quote request system for bulk orders
- **Content Management System**: Dynamic banners and page content management
- **RESTful API**: Well-documented API endpoints with automatic OpenAPI documentation
- **Database Migrations**: Automated database schema management with Alembic
- **Type Safety**: Full type checking with mypy and modern Python practices
- **Code Quality**: Automated linting and formatting with Ruff

## 🛠 Tech Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) - Modern, fast web framework for building APIs
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [SQLAlchemy 2.0](https://www.sqlalchemy.org/) (async)
- **ORM**: SQLAlchemy with async support and Pydantic integration
- **Authentication**: JWT-based authentication system
- **Migration Tool**: [Alembic](https://alembic.sqlalchemy.org/) for database migrations

### Development Tools
- **Language**: Python 3.14+
- **Type Checking**: [mypy](https://mypy-lang.org/)
- **Linting/Formatting**: [Ruff](https://github.com/astral-sh/ruff)
- **Package Management**: [pip-tools](https://github.com/jazzband/pip-tools)
- **Pre-commit Hooks**: Automated code quality checks

### Key Dependencies
- `fastapi[standard]` - Web framework with automatic API documentation
- `sqlalchemy[asyncio]` - Database ORM with async support
- `pydantic[email]` - Data validation and serialization
- `asyncpg` - PostgreSQL driver for asyncio
- `python-jose[cryptography]` - JWT token handling
- `passlib[bcrypt]` - Password hashing

## 📋 Prerequisites

Before running this project, ensure you have the following installed:

- **Python 3.14+**: [Download from python.org](https://www.python.org/downloads/)
- **PostgreSQL 12+**: [Download from postgresql.org](https://www.postgresql.org/download/)
- **Git**: [Download from git-scm.com](https://git-scm.com/downloads)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/armorify-ppe.git
cd armorify-ppe
```

### 2. Set Up Python Environment

```bash
# Create virtual environment
make venv

# Install dependencies
make install
```

### 3. Configure Environment

Create a `.env` file in the `backend/` directory:

```bash
cd backend
cp .env.example .env  # If example exists, otherwise create manually
```

Edit `.env` with your configuration:

```env
# Database Configuration
DATABASE_URL=postgresql+asyncpg://username:password@localhost:5432/armorify_ppe

# Application Settings
APP_NAME="Armorify PPE API"
ENVIRONMENT=development

# Security (generate secure random keys)
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here

# Optional: Development settings
DEBUG=true
```

### 4. Set Up Database

```bash
# Create PostgreSQL database
createdb armorify_ppe

# Run database migrations
make alembic-upgrade
```

### 5. Start Development Server

```bash
make dev
```

The API will be available at `http://localhost:8000`

## 📖 API Documentation

Once the server is running, visit:
- **Interactive API Docs**: http://localhost:8000 (Swagger UI)
- **Alternative Docs**: http://localhost:8000/redoc (ReDoc)
- **OpenAPI Schema**: http://localhost:8000/openapi.json

## 🔗 API Endpoints

### Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Public Endpoints (No Authentication Required)

#### Health Check
- `GET /` - API health check

#### Product Catalog (Public)
- `GET /catalog/categories` - List all product categories
- `GET /catalog/products` - List all products
- `GET /catalog/variants` - List all product variants

### Protected Endpoints (Authentication Required)

#### User Management
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update current user profile
- `DELETE /users/me` - Deactivate current user account

#### Product Catalog Management
- `POST /catalog/categories` - Create new category
- `PUT /catalog/categories/{category_id}` - Update category
- `DELETE /catalog/categories/{category_id}` - Delete category (soft delete)

- `POST /catalog/products` - Create new product
- `PUT /catalog/products/{product_id}` - Update product
- `DELETE /catalog/products/{product_id}` - Delete product (soft delete)

- `POST /catalog/variants` - Create product variant
- `PUT /catalog/variants/{variant_id}` - Update variant
- `DELETE /catalog/variants/{variant_id}` - Delete variant (soft delete)

#### Order Management
- `GET /orders` - List user orders
- `POST /orders` - Create new order
- `GET /orders/{order_id}` - Get order details
- `PUT /orders/{order_id}` - Update order
- `DELETE /orders/{order_id}` - Cancel order (soft delete)

- `POST /orders/items` - Add item to order
- `PUT /orders/items/{item_id}` - Update order item
- `DELETE /orders/items/{item_id}` - Remove order item

#### Quote Requests
- `GET /quotes/requests` - List quote requests
- `POST /quotes/requests` - Create quote request
- `GET /quotes/requests/{request_id}` - Get quote request
- `PUT /quotes/requests/{request_id}` - Update quote request
- `DELETE /quotes/requests/{request_id}` - Delete quote request

- `POST /quotes/items` - Add item to quote
- `PUT /quotes/items/{item_id}` - Update quote item
- `DELETE /quotes/items/{item_id}` - Remove quote item

#### Content Management System (Admin Only)
- `GET /cms/banners` - List banners
- `POST /cms/banners` - Create banner
- `PUT /cms/banners/{banner_id}` - Update banner
- `DELETE /cms/banners/{banner_id}` - Delete banner

- `GET /cms/pages` - List page content
- `POST /cms/pages` - Create page content
- `PUT /cms/pages/{page_id}` - Update page content
- `DELETE /cms/pages/{page_id}` - Delete page content

## 🛠 Development

### Available Commands

```bash
# Environment Setup
make venv              # Create virtual environment
make install           # Install dependencies

# Development
make dev               # Start development server

# Database
make alembic-upgrade   # Apply database migrations
make alembic-revision MESSAGE="Add new table"  # Create new migration
make alembic-downgrade REVISION=-1  # Rollback migration

# Code Quality
make lint              # Run all linting checks
make precommit         # Run pre-commit hooks
make precommit-install # Install pre-commit hooks
```

### Code Quality Tools

This project uses several tools to maintain code quality:

- **Ruff**: Fast Python linter and formatter
- **mypy**: Static type checker
- **isort**: Import sorter
- **pre-commit**: Git hooks for automated checks

### Project Structure

```
armorify-ppe/
├── backend/
│   ├── alembic/              # Database migrations
│   ├── app/
│   │   ├── core/            # Core functionality
│   │   │   ├── database.py  # Database connection
│   │   │   ├── middleware.py # Security middleware
│   │   │   ├── settings.py  # Application settings
│   │   │   └── deps.py      # Dependencies
│   │   ├── crud/            # Database operations
│   │   ├── models/          # SQLAlchemy models
│   │   ├── routers/         # API route handlers
│   │   ├── schemas/         # Pydantic schemas
│   │   └── main.py          # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   ├── alembic.ini         # Alembic configuration
│   └── .env                # Environment variables
├── .pre-commit-config.yaml # Pre-commit hooks
├── Makefile               # Development commands
└── README.md             # This file
```

### Database Schema

The application uses PostgreSQL with the following main entities:

- **Users**: Customer and admin accounts
- **Categories**: Product categorization
- **Products**: Main product catalog
- **ProductVariants**: Product variations (size, color, etc.)
- **Orders**: Customer orders
- **OrderItems**: Individual items within orders
- **QuoteRequests**: Bulk quote requests
- **QuoteItems**: Items within quote requests
- **Banners**: CMS banner management
- **PageContent**: CMS page content management

All tables include soft delete functionality (`is_active` field) and automatic timestamp management.

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and ensure tests pass
4. Run code quality checks: `make lint`
5. Commit your changes: `git commit -m 'Add some feature'`
6. Push to the branch: `git push origin feature/your-feature-name`
7. Open a Pull Request

### Development Guidelines

- Follow PEP 8 style guidelines
- Use type hints for all function parameters and return values
- Write descriptive commit messages
- Ensure all code passes linting checks
- Update documentation for any API changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support or questions:
- Open an issue on GitHub
- Check the API documentation at `/`
- Review the codebase for implementation details

---

**Built with ❤️ for safety and reliability in professional environments.**
