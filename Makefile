SHELL := /usr/bin/env bash
.SILENT:

# Cross-platform Python path detection
UNAME_S := $(shell uname -s)
ifeq ($(findstring MINGW, $(UNAME_S)),MINGW)
    # Windows (MSYS2/MinGW)
    PYTHON := $(CURDIR)/.venv/Scripts/python.exe
else ifeq ($(UNAME_S),Linux)
    # Linux
    PYTHON := $(CURDIR)/.venv/bin/python
else ifeq ($(UNAME_S),Darwin)
    # macOS
    PYTHON := $(CURDIR)/.venv/bin/python
else
    # Default to Windows
    PYTHON := $(CURDIR)/.venv/Scripts/python.exe
endif

PROJECT_DIR := backend
UVICORN := $(PYTHON) -m uvicorn
PRECOMMIT := $(PYTHON) -m pre_commit

COLOR_GREEN := \033[0;32m
COLOR_BLUE := \033[0;34m
COLOR_YELLOW := \033[0;33m
COLOR_RED := \033[0;31m
COLOR_RESET := \033[0m

.PHONY: help dev precommit-install precommit lint venv install alembic-upgrade alembic-downgrade alembic-revision alembic-history alembic-current

help:
	printf "%b" "$(COLOR_BLUE)Armorify PPE Makefile commands$(COLOR_RESET)\n"
	printf "  %b%-20s%b %s\n" "$(COLOR_GREEN)" help "$(COLOR_RESET)" "Show this help message"
	printf "  %b%-20s%b %s\n" "$(COLOR_GREEN)" venv "$(COLOR_RESET)" "Create or update the local .venv environment"
	printf "  %b%-20s%b %s\n" "$(COLOR_GREEN)" install "$(COLOR_RESET)" "Install backend Python dependencies into .venv"
	printf "  %b%-20s%b %s\n" "$(COLOR_GREEN)" dev "$(COLOR_RESET)" "Start FastAPI development server with reload"
	printf "  %b%-20s%b %s\n" "$(COLOR_GREEN)" precommit-install "$(COLOR_RESET)" "Install Git hooks for pre-commit checks"
	printf "  %b%-20s%b %s\n" "$(COLOR_GREEN)" precommit "$(COLOR_RESET)" "Run pre-commit on all files in backend/"
	printf "  %b%-20s%b %s\n" "$(COLOR_GREEN)" lint "$(COLOR_RESET)" "Run the full lint pipeline via pre-commit"
	printf "  %b%-20s%b %s\n" "$(COLOR_GREEN)" alembic-upgrade "$(COLOR_RESET)" "Apply Alembic migrations to the latest revision"
	printf "  %b%-20s%b %s\n" "$(COLOR_GREEN)" alembic-downgrade "$(COLOR_RESET)" "Downgrade the database by revision or step"
	printf "  %b%-20s%b %s\n" "$(COLOR_GREEN)" alembic-revision "$(COLOR_RESET)" "Create a new Alembic revision (MESSAGE required)"
	printf "  %b%-20s%b %s\n" "$(COLOR_GREEN)" alembic-history "$(COLOR_RESET)" "Show Alembic migration history"
	printf "  %b%-20s%b %s\n" "$(COLOR_GREEN)" alembic-current "$(COLOR_RESET)" "Show the current Alembic revision"
	printf "\n"
	printf "%b" "$(COLOR_YELLOW)Usage examples:$(COLOR_RESET)\n"
	printf "  %b%-20s%b %s\n" "" "make dev" "Start server at http://0.0.0.0:8000"
	printf "  %b%-20s%b %s\n" "" "make precommit-install" "Install hooks for future commits"
	printf "  %b%-20s%b %s\n" "" "make precommit" "Run all configured pre-commit checks now"
	printf "  %b%-20s%b %s\n" "" "make lint" "Alias for running lint/pre-commit checks"
	printf "\n"
	printf "%b" "$(COLOR_YELLOW)Notes:$(COLOR_RESET)\n"
	printf "  %s\n" "- Ensure .venv is created before running commands."
	printf "  %s\n" "- Use ".env" in backend/ to configure DATABASE_URL and ENVIRONMENT."
	printf "  %s\n" "- The lint target runs all pre-commit hooks, including ruff, mypy, and isort."
	printf "  %s\n" "- Run \"make install\" after updating backend/requirements.txt."

dev:
	printf "%b" "$(COLOR_YELLOW)Starting development server...$(COLOR_RESET)\n"
	cd $(PROJECT_DIR) && ENVIRONMENT=development $(UVICORN) app.main:app --reload --host 0.0.0.0 --port 8000

precommit-install:
	printf "%b" "$(COLOR_YELLOW)Installing pre-commit hooks...$(COLOR_RESET)\n"
	$(PRECOMMIT) install

precommit:
	printf "%b" "$(COLOR_YELLOW)Running pre-commit on all files...$(COLOR_RESET)\n"
	$(PRECOMMIT) run --all-files

lint: precommit
	printf "%b" "$(COLOR_GREEN)Lint pipeline completed.$(COLOR_RESET)\n"

venv:
	printf "%b" "$(COLOR_YELLOW)Creating or updating local .venv...$(COLOR_RESET)\n"
	python -m venv .venv
	./.venv/Scripts/python.exe -m pip install --upgrade pip

install: venv
	printf "%b" "$(COLOR_YELLOW)Installing Python dependencies...$(COLOR_RESET)\n"
	./.venv/Scripts/python.exe -m pip install -r $(PROJECT_DIR)/requirements.txt

alembic-upgrade:
	printf "%b" "$(COLOR_YELLOW)Applying Alembic migrations to head...$(COLOR_RESET)\n"
	cd $(PROJECT_DIR) && $(PYTHON) -m alembic upgrade head

alembic-downgrade:
ifndef REVISION
	$(error REVISION is required. Example: make alembic-downgrade REVISION=-1)
endif
	printf "%b" "$(COLOR_YELLOW)Downgrading Alembic to $(REVISION)...$(COLOR_RESET)\n"
	cd $(PROJECT_DIR) && $(PYTHON) -m alembic downgrade $(REVISION)

alembic-revision:
ifndef MESSAGE
	$(error MESSAGE is required. Example: make alembic-revision MESSAGE="add users table")
endif
	printf "%b" "$(COLOR_YELLOW)Creating Alembic revision: $(MESSAGE)...$(COLOR_RESET)\n"
	cd $(PROJECT_DIR) && $(PYTHON) -m alembic revision --autogenerate -m "$(MESSAGE)"

alembic-history:
	printf "%b" "$(COLOR_YELLOW)Showing Alembic migration history...$(COLOR_RESET)\n"
	cd $(PROJECT_DIR) && $(PYTHON) -m alembic history --verbose

alembic-current:
	printf "%b" "$(COLOR_YELLOW)Showing current Alembic revision...$(COLOR_RESET)\n"
	cd $(PROJECT_DIR) && $(PYTHON) -m alembic current
