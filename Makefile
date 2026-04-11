SHELL := /usr/bin/env bash
.SILENT:

# Cross-platform Python path detection
UNAME_S := $(shell uname -s)
ifeq ($(findstring MINGW, $(UNAME_S)),MINGW)
    PYTHON := $(CURDIR)/.venv/Scripts/python.exe
else ifeq ($(UNAME_S),Linux)
    PYTHON := $(CURDIR)/.venv/bin/python
else ifeq ($(UNAME_S),Darwin)
    PYTHON := $(CURDIR)/.venv/bin/python
else
    PYTHON := $(CURDIR)/.venv/Scripts/python.exe
endif

PIP := $(PYTHON) -m pip
PYTEST := $(PYTHON) -m pytest
ALEMBIC := $(PYTHON) -m alembic
FASTAPI := $(PYTHON) -m fastapi
UVICORN := $(PYTHON) -m uvicorn

BACKEND_DIR := backend
BACKEND_APP := app.main:app
BACKEND_ENV_FILE := $(BACKEND_DIR)/.dev.env
PRECOMMIT := $(PYTHON) -m pre_commit

# Load backend/.dev.env into the current shell (export variables).
# This is required for Alembic autogenerate because it must connect using DATABASE_URL.
BACKEND_LOAD_ENV := set -a && source "$(BACKEND_ENV_FILE)" && set +a

COLOR_GREEN := \033[0;32m
COLOR_BLUE := \033[0;34m
COLOR_YELLOW := \033[0;33m
COLOR_RED := \033[0;31m
COLOR_RESET := \033[0m

.PHONY: help venv install dev dev-uvicorn test lint backend-install backend-env-check \
alembic-upgrade alembic-downgrade alembic-revision alembic-revision-empty alembic-history alembic-current

help:
	printf "%b" "$(COLOR_BLUE)Armorify PPE Makefile commands$(COLOR_RESET)\n"
	printf "  %b%-20s%b %s\n" "$(COLOR_GREEN)" help "$(COLOR_RESET)" "Show this help message"
	printf "  %b%-20s%b %s\n" "$(COLOR_GREEN)" venv "$(COLOR_RESET)" "Create or update the local .venv environment"
	printf "  %b%-20s%b %s\n" "$(COLOR_GREEN)" install "$(COLOR_RESET)" "Install backend Python dependencies into root .venv"
	printf "  %b%-20s%b %s\n" "$(COLOR_GREEN)" dev "$(COLOR_RESET)" "Start backend dev server from repo root"
	printf "  %b%-20s%b %s\n" "$(COLOR_GREEN)" dev-uvicorn "$(COLOR_RESET)" "Start backend with uvicorn reload from repo root"
	printf "  %b%-20s%b %s\n" "$(COLOR_GREEN)" test "$(COLOR_RESET)" "Run backend tests from repo root"
	printf "  %b%-20s%b %s\n" "$(COLOR_GREEN)" backend-env-check "$(COLOR_RESET)" "Check whether backend/.dev.env exists"
	printf "  %b%-20s%b %s\n" "$(COLOR_GREEN)" lint "$(COLOR_RESET)" "Run Ruff against backend app/tests"
	printf "  %b%-20s%b %s\n" "$(COLOR_GREEN)" alembic-upgrade "$(COLOR_RESET)" "Apply Alembic migrations to the latest revision"
	printf "  %b%-20s%b %s\n" "$(COLOR_GREEN)" alembic-downgrade "$(COLOR_RESET)" "Downgrade the database by revision or step"
	printf "  %b%-20s%b %s\n" "$(COLOR_GREEN)" alembic-revision "$(COLOR_RESET)" "Create a new Alembic revision (MESSAGE required)"
	printf "  %b%-20s%b %s\n" "$(COLOR_GREEN)" alembic-history "$(COLOR_RESET)" "Show Alembic migration history"
	printf "  %b%-20s%b %s\n" "$(COLOR_GREEN)" alembic-current "$(COLOR_RESET)" "Show the current Alembic revision"
	printf "\n"
	printf "%b" "$(COLOR_YELLOW)Usage examples:$(COLOR_RESET)\n"
	printf "  %b%-20s%b %s\n" "" "make install" "Create .venv and install backend dependencies"
	printf "  %b%-20s%b %s\n" "" "make dev" "Start backend API at http://127.0.0.1:8000"
	printf "  %b%-20s%b %s\n" "" "make alembic-revision MESSAGE=\"initial schema\"" "Generate a migration from repo root"
	printf "  %b%-20s%b %s\n" "" "make test" "Run backend tests from repo root"
	printf "\n"
	printf "%b" "$(COLOR_YELLOW)Notes:$(COLOR_RESET)\n"
	printf "  %s\n" "- All commands run from the repo root; no need to cd into backend/."
	printf "  %s\n" "- Put backend env vars in backend/.dev.env."
	printf "  %s\n" "- The root .venv is shared, which keeps room for a future frontend/ folder."
	printf "  %s\n" "- If fastapi CLI is unavailable, use \"make dev-uvicorn\"."

venv:
	printf "%b" "$(COLOR_YELLOW)Creating or updating local .venv...$(COLOR_RESET)\n"
	python -m venv .venv
	$(PIP) install --upgrade pip

backend-install: venv
	printf "%b" "$(COLOR_YELLOW)Installing backend Python dependencies...$(COLOR_RESET)\n"
	$(PIP) install -r $(BACKEND_DIR)/requirements.txt

install: backend-install
	printf "%b" "$(COLOR_GREEN)Dependencies installed in .venv.$(COLOR_RESET)\n"

backend-env-check:
	if [ -f "$(BACKEND_ENV_FILE)" ]; then \
		printf "%b" "$(COLOR_GREEN)Found $(BACKEND_ENV_FILE).$(COLOR_RESET)\n"; \
	else \
		printf "%b" "$(COLOR_RED)Missing $(BACKEND_ENV_FILE). Create it with DATABASE_URL and ENVIRONMENT=development.$(COLOR_RESET)\n"; \
		exit 1; \
	fi

dev: backend-env-check
	printf "%b" "$(COLOR_YELLOW)Starting backend development server...$(COLOR_RESET)\n"
	$(BACKEND_LOAD_ENV) && ENVIRONMENT=development PYTHONPATH=$(BACKEND_DIR) $(FASTAPI) dev $(BACKEND_DIR)/app/main.py

dev-uvicorn: backend-env-check
	printf "%b" "$(COLOR_YELLOW)Starting backend with uvicorn reload...$(COLOR_RESET)\n"
	$(BACKEND_LOAD_ENV) && ENVIRONMENT=development PYTHONPATH=$(BACKEND_DIR) $(UVICORN) $(BACKEND_APP) --reload --host 0.0.0.0 --port 8000

lint:
	printf "%b" "$(COLOR_YELLOW)Running pre-commit on all files...$(COLOR_RESET)\n"
	$(PRECOMMIT) run --all-files

test:
	printf "%b" "$(COLOR_YELLOW)Running backend tests...$(COLOR_RESET)\n"
	PYTHONPATH=$(BACKEND_DIR) $(PYTEST) -q $(BACKEND_DIR)/tests

alembic-upgrade: backend-env-check
	printf "%b" "$(COLOR_YELLOW)Applying Alembic migrations to head...$(COLOR_RESET)\n"
	$(BACKEND_LOAD_ENV) && ENVIRONMENT=development PYTHONPATH=$(BACKEND_DIR) $(ALEMBIC) -c $(BACKEND_DIR)/alembic.ini upgrade head

alembic-downgrade:
ifndef REVISION
	$(error REVISION is required. Example: make alembic-downgrade REVISION=-1)
endif
	printf "%b" "$(COLOR_YELLOW)Downgrading Alembic to $(REVISION)...$(COLOR_RESET)\n"
	$(BACKEND_LOAD_ENV) && ENVIRONMENT=development PYTHONPATH=$(BACKEND_DIR) $(ALEMBIC) -c $(BACKEND_DIR)/alembic.ini downgrade $(REVISION)

alembic-revision:
ifndef MESSAGE
	$(error MESSAGE is required. Example: make alembic-revision MESSAGE="add users table")
endif
	printf "%b" "$(COLOR_YELLOW)Creating Alembic revision: $(MESSAGE)...$(COLOR_RESET)\n"
	$(BACKEND_LOAD_ENV) && ENVIRONMENT=development PYTHONPATH=$(BACKEND_DIR) $(ALEMBIC) -c $(BACKEND_DIR)/alembic.ini revision --autogenerate -m "$(MESSAGE)"

alembic-revision-empty:
ifndef MESSAGE
	$(error MESSAGE is required. Example: make alembic-revision-empty MESSAGE="initial schema")
endif
	printf "%b" "$(COLOR_YELLOW)Creating empty Alembic revision: $(MESSAGE)...$(COLOR_RESET)\n"
	PYTHONPATH=$(BACKEND_DIR) $(ALEMBIC) -c $(BACKEND_DIR)/alembic.ini revision -m "$(MESSAGE)"

alembic-history:
	printf "%b" "$(COLOR_YELLOW)Showing Alembic migration history...$(COLOR_RESET)\n"
	$(BACKEND_LOAD_ENV) && ENVIRONMENT=development PYTHONPATH=$(BACKEND_DIR) $(ALEMBIC) -c $(BACKEND_DIR)/alembic.ini history --verbose

alembic-current:
	printf "%b" "$(COLOR_YELLOW)Showing current Alembic revision...$(COLOR_RESET)\n"
	$(BACKEND_LOAD_ENV) && ENVIRONMENT=development PYTHONPATH=$(BACKEND_DIR) $(ALEMBIC) -c $(BACKEND_DIR)/alembic.ini current
