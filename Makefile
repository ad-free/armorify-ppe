SHELL := /usr/bin/env bash
.SILENT:

# ─── Platform detection ────────────────────────────────────────────────────────
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

PIP       := $(PYTHON) -m pip
PYTEST    := $(PYTHON) -m pytest
ALEMBIC   := $(PYTHON) -m alembic
FASTAPI   := $(PYTHON) -m fastapi
UVICORN   := $(PYTHON) -m uvicorn
PRECOMMIT := $(PYTHON) -m pre_commit

FRONTEND_DIR := frontend
BACKEND_DIR  := backend
BACKEND_APP  := app.main:app
BACKEND_ENV  := $(BACKEND_DIR)/.dev.env

BACKEND_LOAD_ENV := set -a && source "$(BACKEND_ENV)" && set +a

# ─── Colors ────────────────────────────────────────────────────────────────────
RESET   := \033[0m
BOLD    := \033[1m
DIM     := \033[2m

BLACK   := \033[0;30m
RED     := \033[0;31m
GREEN   := \033[0;32m
YELLOW  := \033[0;33m
BLUE    := \033[0;34m
MAGENTA := \033[0;35m
CYAN    := \033[0;36m
WHITE   := \033[0;37m

B_RED     := \033[1;31m
B_GREEN   := \033[1;32m
B_YELLOW  := \033[1;33m
B_BLUE    := \033[1;34m
B_MAGENTA := \033[1;35m
B_CYAN    := \033[1;36m
B_WHITE   := \033[1;37m

# ─── Helpers ───────────────────────────────────────────────────────────────────
define section
	printf "\n$(B_BLUE)▸ $(1)$(RESET)\n"
endef

define target
	printf "  $(B_GREEN)%-28s$(RESET)$(DIM)$(1)$(RESET)\n" "$(2)"
endef

define hint
	printf "  $(DIM)%-28s  $(CYAN)$(1)$(RESET)\n" ""
endef

define example
	printf "  $(DIM)$ make %-23s$(RESET)$(DIM) # $(1)$(RESET)\n" "$(2)"
endef

# ─── Targets ───────────────────────────────────────────────────────────────────
.PHONY: help venv install backend-install backend-env-check backend-init \
        dev dev-uvicorn lint test \
        alembic-upgrade alembic-downgrade alembic-revision alembic-revision-empty \
        alembic-history alembic-current \
        frontend-dev frontend-lint frontend-build frontend-preview

help:
	printf "$(B_WHITE)Armorify PPE$(RESET) — development task runner\n"
	printf "$(DIM)All commands run from the repo root against .venv/bin/python$(RESET)"

	$(call section,Environment)
	$(call target,Create or update .venv (pip upgrade included),venv)
	$(call target,Install backend Python deps into .venv,install)
	$(call target,Guard: abort if backend/.dev.env is absent,backend-env-check)
	$(call target,Seed initial DB data via app/initial_data.py,backend-init)

	$(call section,Development)
	$(call target,FastAPI dev server — hot-reload on :8000,dev)
	$(call target,Uvicorn fallback if fastapi CLI unavailable,dev-uvicorn)
	$(call target,Vite frontend dev server (npm run dev),frontend-dev)

	$(call section,Quality)
	$(call target,pre-commit hooks: Ruff lint + format on all files,lint)
	$(call target,ESLint across frontend/ source tree,frontend-lint)
	$(call target,pytest — quiet; PYTHONPATH set automatically,test)

	$(call section,Database migrations)
	$(call target,Apply all pending migrations to head,alembic-upgrade)
	$(call target,Revert by revision hash or relative step,alembic-downgrade)
	$(call hint,Requires REVISION=  e.g. REVISION=-1 or REVISION=abc123)
	$(call target,Auto-generate migration from model diff,alembic-revision)
	$(call hint,Requires MESSAGE=  e.g. MESSAGE="add users table")
	$(call target,Emit an empty migration skeleton,alembic-revision-empty)
	$(call hint,Requires MESSAGE=)
	$(call target,Verbose history: hashes · dates · messages,alembic-history)
	$(call target,Show the revision the database is currently at,alembic-current)

	$(call section,Frontend build)
	$(call target,Production Vite build → frontend/dist/,frontend-build)
	$(call target,Serve production build locally for smoke-testing,frontend-preview)

	printf "\n$(B_YELLOW)Examples$(RESET)\n"
	$(call example,bootstrap a fresh checkout,install)
	$(call example,start backend API,dev)
	$(call example,create a migration,alembic-revision MESSAGE="add users table")
	$(call example,run the test suite,test)

	printf "\n$(DIM)Backend env vars  →  backend/.dev.env$(RESET)\n"
	printf "$(DIM)Alembic reads DATABASE_URL from that file automatically.$(RESET)\n\n"

# ─── Environment ───────────────────────────────────────────────────────────────
venv:
	printf "$(YELLOW)Creating or updating .venv...$(RESET)\n"
	python -m venv .venv
	$(PIP) install --upgrade pip
	printf "$(GREEN)✓ .venv ready$(RESET)\n"

backend-install: venv
	printf "$(YELLOW)Installing backend dependencies...$(RESET)\n"
	$(PIP) install -r $(BACKEND_DIR)/requirements.txt

install: backend-install
	printf "$(GREEN)✓ All dependencies installed$(RESET)\n"

backend-env-check:
	# Allow skipping .dev.env when running in production or when DATABASE_URL is
	# already present in the environment (CI/host-managed secrets).
	@if [ "$$ENVIRONMENT" = "production" ]; then \
		printf "$(GREEN)✓ Production environment detected — skipping $(BACKEND_ENV) check$(RESET)\n"; \
	elif [ -n "$$DATABASE_URL" ]; then \
		printf "$(GREEN)✓ DATABASE_URL present in environment — skipping $(BACKEND_ENV) check$(RESET)\n"; \
	elif [ -f "$(BACKEND_ENV)" ]; then \
		printf "$(GREEN)✓ Found $(BACKEND_ENV)$(RESET)\n"; \
	else \
		printf "$(B_RED)✗ Missing $(BACKEND_ENV)$(RESET)\n"; \
		printf "$(DIM)  Create it with DATABASE_URL and ENVIRONMENT=development$(RESET)\n"; \
		exit 1; \
	fi

backend-init: backend-env-check
	printf "$(YELLOW)Seeding initial data...$(RESET)\n"
	$(BACKEND_LOAD_ENV) && ENVIRONMENT=development PYTHONPATH=$(BACKEND_DIR) \
		$(PYTHON) $(BACKEND_DIR)/app/initial_data.py
	printf "$(GREEN)✓ Initial data loaded$(RESET)\n"

# ─── Development ───────────────────────────────────────────────────────────────
dev: backend-env-check
	printf "$(YELLOW)Starting uvicorn$(RESET) $(DIM)(0.0.0.0:8000)$(RESET)\n"
	$(BACKEND_LOAD_ENV) && ENVIRONMENT=development PYTHONPATH=$(BACKEND_DIR) \
		$(UVICORN) $(BACKEND_APP) --reload --host 0.0.0.0 --port 8000

# ─── Quality ───────────────────────────────────────────────────────────────────
lint:
	printf "$(YELLOW)Running pre-commit on all files...$(RESET)\n"
	$(PRECOMMIT) run --all-files

test:
	printf "$(YELLOW)Running backend tests...$(RESET)\n"
	PYTHONPATH=$(BACKEND_DIR) $(PYTEST) -q $(BACKEND_DIR)/tests

# ─── Database migrations ───────────────────────────────────────────────────────
alembic-upgrade: backend-env-check
	printf "$(YELLOW)Applying migrations → head...$(RESET)\n"
	$(BACKEND_LOAD_ENV) && ENVIRONMENT=development PYTHONPATH=$(BACKEND_DIR) \
		$(ALEMBIC) -c $(BACKEND_DIR)/alembic.ini upgrade head
	printf "$(GREEN)✓ Database up to date$(RESET)\n"

alembic-downgrade: backend-env-check
ifndef REVISION
	$(error $(B_RED)REVISION required$(RESET) — e.g.  make alembic-downgrade REVISION=-1)
endif
	printf "$(YELLOW)Downgrading to $(REVISION)...$(RESET)\n"
	$(BACKEND_LOAD_ENV) && ENVIRONMENT=development PYTHONPATH=$(BACKEND_DIR) \
		$(ALEMBIC) -c $(BACKEND_DIR)/alembic.ini downgrade $(REVISION)

alembic-revision: backend-env-check
ifndef MESSAGE
	$(error $(B_RED)MESSAGE required$(RESET) — e.g.  make alembic-revision MESSAGE="add users table")
endif
	printf "$(YELLOW)Generating migration:$(RESET) $(CYAN)$(MESSAGE)$(RESET)\n"
	$(BACKEND_LOAD_ENV) && ENVIRONMENT=development PYTHONPATH=$(BACKEND_DIR) \
		$(ALEMBIC) -c $(BACKEND_DIR)/alembic.ini revision --autogenerate -m "$(MESSAGE)"

alembic-revision-empty:
ifndef MESSAGE
	$(error $(B_RED)MESSAGE required$(RESET) — e.g.  make alembic-revision-empty MESSAGE="seed roles")
endif
	printf "$(YELLOW)Creating empty migration:$(RESET) $(CYAN)$(MESSAGE)$(RESET)\n"
	PYTHONPATH=$(BACKEND_DIR) \
		$(ALEMBIC) -c $(BACKEND_DIR)/alembic.ini revision -m "$(MESSAGE)"

alembic-history: backend-env-check
	printf "$(YELLOW)Migration history:$(RESET)\n"
	$(BACKEND_LOAD_ENV) && ENVIRONMENT=development PYTHONPATH=$(BACKEND_DIR) \
		$(ALEMBIC) -c $(BACKEND_DIR)/alembic.ini history --verbose

alembic-current: backend-env-check
	printf "$(YELLOW)Current revision:$(RESET)\n"
	$(BACKEND_LOAD_ENV) && ENVIRONMENT=development PYTHONPATH=$(BACKEND_DIR) \
		$(ALEMBIC) -c $(BACKEND_DIR)/alembic.ini current

# ─── Frontend ──────────────────────────────────────────────────────────────────
frontend-lint:
	printf "$(YELLOW)Running frontend ESLint...$(RESET)\n"
	cd $(FRONTEND_DIR) && npm run lint

frontend-dev:
	printf "$(YELLOW)Starting frontend dev server...$(RESET)\n"
	cd $(FRONTEND_DIR) && npm run dev

frontend-build:
	printf "$(YELLOW)Building frontend for production...$(RESET)\n"
	cd $(FRONTEND_DIR) && npm run build
	printf "$(GREEN)✓ Build complete → frontend/dist/$(RESET)\n"

frontend-preview:
	printf "$(YELLOW)Previewing production build...$(RESET)\n"
	cd $(FRONTEND_DIR) && npm run preview
