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
- **Discovery-first storefront**: One value proposition with product and email-quote actions, followed by categories, featured products, brands, and API-backed active campaigns.
- **Product discovery flow**: Category, brand, and search results share URL-backed filters, sorting, result counts, removable filter chips, and pagination.
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
`tsc -b` writes incremental build metadata, including for the no-emit app project.
Both TypeScript projects now place that metadata under
`frontend/node_modules/.cache/armorify-build/`; the Node project emits declarations
into its `vite-types/` subdirectory instead of beside `vite.config.ts`.
Routine builds therefore leave no new TypeScript artifacts in the frontend root.
Pre-existing root build metadata and declarations are left untouched.

### Phase 2 product discovery

`CatalogDiscovery.tsx` is shared by category, brand, and search routes. Desktop filters
use labeled native fields; mobile filters use a native modal dialog with focus containment,
Escape dismissal, scroll locking, and trigger focus restoration. Search terms, filter values,
sort, page size, and page remain in the URL. Changing filters resets the page; clearing filters
preserves search and sort. Invalid price ranges show an actionable error instead of sending
an invalid request. Out-of-range pages return to the last available page.

Discovery surfaces distinguish loading, request errors with retry, empty catalogs, missing
categories/brands, and searches without results. Product cards show supplied scalar PPE
specifications, standards and price units when present, explicit unknowns when absent,
stock-backed availability, and review summaries only when reviews exist. The listing
response has no reliable variant-required indicator, so in-stock cards link to the
product page with “Xem lựa chọn” (View options) rather than adding an unspecified item.
Out-of-stock card actions remain disabled. Direct quick-add can return only when the
API reliably verifies that no required variants exist. Featured products are labeled
as curated—not as best sellers, because no sales/popularity data is exposed.

The footer groups products, policies, contact, and business purchasing. Quote actions open
an email to the existing contact address; they do not submit through the unconnected
contact-page form. The catalog API's documented “No active flash sale found” response
means no campaign is displayed; other campaign failures remain visible with retry.

Focused regression checks, from `frontend/`:
```bash
node src/components/catalog/catalogState.check.mjs
node src/components/catalog/ProductCard.facts.check.mjs
npm run build && npm run lint
```

### Phase 3 product details

Product details reuse the shared storefront tokens and controls in a desktop two-column
layout and a mobile single column. A native selector lists complete supplied variants
(size, color, attributes and SKU), starts without a selection, and disables unavailable
combinations. Variant requests must succeed before purchase is enabled, including for
products with no variants. Selected stock, price and SKU update together; cart lines
carry the selected `variant_id` and `unit_price`. Quantity checks include units already
in the local cart and reject incomplete, fractional and over-stock additions.

Percentage campaigns discount the selected variant override rather than the API's
base-product `flash_sale_price`; zero-percentage fixed-price campaigns use the supplied
sale price. Expired promotions stop applying and trigger a product refresh. The existing
API cannot distinguish an explicit fixed sale price with a nonzero percentage from a
computed base-product sale price; existing percentage-first behavior is retained.

Gallery controls support keyboard arrows, labelled thumbnails, previous/next buttons
and horizontal touch swipe. Missing/broken images, specifications, standards, descriptions,
reviews and related products have explicit states. Ratings require actual review results;
review errors never display a stale summary. Specifications preserve supplied scalar,
list and structured values. Related products are not presented as verified compatibility.

Shipping and returns link to existing policy pages. Technical support and bulk quote
actions open the existing contact email with product/selection context; they do not claim
to submit a quote or order. The compact mobile action returns users to purchase controls,
is hidden while those controls or the footer are visible, and reserves bottom spacing.
Floating support widgets are hidden on mobile product routes to avoid covering purchases.

Focused checks, from `frontend/`:
```bash
node src/components/catalog/productPurchase.check.mjs
node src/components/catalog/catalogState.check.mjs
node src/components/catalog/ProductCard.facts.check.mjs
npm run build && npm run lint
```

Phase 3 browser acceptance exercised real components with intercepted contract-shaped
responses because the local API was unavailable. Verified selection/cart agreement,
variant-free purchase, stock/quantity boundaries, gallery keyboard/touch, review submission
and pagination, lifecycle/empty states, and no horizontal overflow at 360/768/1024/1440px.
This is not evidence of live database or order-creation correctness.

### Phase 4 cart and checkout

`POST /api/v1/orders/quote` accepts `items` containing only `product_id`, optional
`variant_id`, and strict positive integer `quantity` within PostgreSQL INTEGER capacity.
Requests allow up to 100 lines; available stock, not an arbitrary sales quantity cap,
limits each selection. The response contains current public line
details, stock/issues, base subtotal, promotion discount, shipping, final total and
`pricing_token`. Quote availability is not a reservation. Products with variants require
an active owned variant; unavailable selections never expose hidden product details.
Amounts must also fit the persisted `Numeric(12,2)` ceiling of 9,999,999,999.99 VND;
a quantity within stock and INTEGER capacity can still exceed that monetary limit.

`POST /api/v1/orders/guest` (optional authentication) and authenticated
`POST /api/v1/orders/` share the same checkout service. Both require the quoted token,
UUID `idempotency_key`, items, `customer_name`, `contact_phone`, `province`, `district`,
`ward`, detailed `address`, `shipping_method: "standard"` and `payment_method: "cod"`.
Optional fields are `email` and `delivery_note`. Client price/total fields are rejected.
Validation errors use `detail` entries with field `loc`, safe `msg` and `type`.
Requote/review on `409 stale_pricing`; reuse the exact submitted payload/key after
network uncertainty. A key reused for another payload or customer returns `409`.

Pricing uses the active product price or selected variant override, then the earliest
expiring active campaign (percentage first; fixed prices cannot increase the base).
Expired/inactive campaigns are ignored. Product, variant and campaign rows are locked
in deterministic order; stock decrement and immutable order snapshots commit together.
A transaction advisory lock and unique idempotency index prevent duplicate orders.
Cancellation locks the owned order, then product and variant rows in checkout's lock
order. Pending/confirmed, unpaid, unfulfilled COD orders with Phase 4 reservation
metadata restore their saved quantities exactly once; order, payment and fulfillment
states become `cancelled` in the same transaction. Repeated/concurrent cancellation
returns the cancelled order without another stock increment. Unknown historical
reservations, paid orders and progressed fulfillment require admin reconciliation.
Admin cancellation uses the same path, and cancelled orders cannot be reopened.
Purchased item mutation routes remain removed.

Standard retail shipping implements the published policy: **30,000 VND below
500,000 VND; free at or above 500,000 VND**, based on merchandise after discounts.
`CHECKOUT_SHIPPING_FEE` and `CHECKOUT_FREE_SHIPPING_THRESHOLD` configure those values;
blank fee explicitly disables checkout, blank threshold disables free shipping.
B2B contract exemptions are not inferred from user role: contract verification is
not implemented. COD orders start `payment_status: "unpaid"` and
`fulfillment_status: "unfulfilled"` independently of order `status`. Bank transfer
and online gateways are not offered.

The storefront still persists its cart locally in `armorify-cart-storage`; the separate
authenticated database cart API is not its source of truth. Cart and checkout revalidate
identifiers/quantities through the quote endpoint rather than trusting saved prices.
Pending checkout submissions retain their original owner, payload/key, quote, and cart
revision in session storage. Recover under the same account (or sign out for an original
guest request); checkout never automatically refreshes/replays under another session.
An unchanged cart clears only after a confirmed response. A changed cart is retained
wholesale with a review warning rather than erasing later additions; the review link
reloads current persisted cart data. Local cart persistence migrates to version 1.
Success/tracking use saved delivery and item snapshots, not mutable catalog data.
Checkout/success omit promotional navigation and floating contact controls.

Migration `c4a91f027b63` follows `80686a8da3e7`. It adds nullable delivery/payment/status
and subtotal/discount/shipping fields, an idempotency UUID/hash with a unique index, and
order-item name/SKU/attribute snapshots. Historical rows are preserved with unknown
fields left null; no invented historical payment or delivery evidence. Apply the
migration before running the changed API. Upgrade acquires normal PostgreSQL DDL locks.
Downgrade removes the new fields and therefore loses their data; use a backup and
explicit approval for any non-test rollback. No production migration was performed.

Focused checks:
```bash
DATABASE_URL="${CHECKOUT_TEST_DATABASE_URL:?Set a disposable PostgreSQL test URL}" .venv/bin/python -m pytest backend/tests -q
.venv/bin/python -m ruff check backend --extend-exclude backend/alembic --line-length=120 --target-version=py39 --select=E,F,I,W,UP
.venv/bin/python -m ruff format backend --exclude backend/alembic --line-length=120 --target-version=py39 --check
cd frontend
node src/components/order/checkoutRecovery.check.mjs
node src/components/catalog/productPurchase.check.mjs
node src/components/catalog/catalogState.check.mjs
node src/components/catalog/ProductCard.facts.check.mjs
npm run build && npm run lint
```
The canonical backend CI gate is `pre-commit run --all-files --show-diff-on-failure`
using `.pre-commit-config.yaml`: Ruff 0.9.10 with `E,F,I,W,UP` and 120-column
formatting, plus mypy 1.15.0. A plain `ruff check backend` does not cover that gate.
The explicit `py39` target above preserves Ruff 0.9.10's default when using a newer
installed Ruff. Checkout UUID annotations describe native `uuid.UUID` values,
not SQLAlchemy column-type objects; public/admin response JSON schemas stay unchanged.

Set `CHECKOUT_TEST_DATABASE_URL` to a separate local database named
`armorify_checkout_test_<32 lowercase hex characters>`, with the already-installed
`pgcrypto` extension enabled there. The test harness refuses `armorify_dev` and all
other database names before migrating/seed/reset/drop operations. Generated
`checkout_test_*` schemas are confined to the disposable target.

The cancellation audit ran the complete suite after the quantity-capacity correction
and all final cancellation changes: **78 passed** against a separate PostgreSQL 18
cluster at `127.0.0.1:45167`, database
`armorify_checkout_test_ff7fa262ca9b451295f3c5bfbacc1ebe`. Coverage includes both stock
types, concurrent/repeated cancellation, fulfillment/payment eligibility, real
restock failure rollback, admin shipping contention, no double-restock, and a
100,001-unit order within the persisted monetary limit. Fresh Ruff, all four frontend
focused checks, TypeScript/Vite build, ESLint, and `git diff --check` passed.
A real Uvicorn HTTP smoke in `checkout_audit_smoke` created a mixed product/variant
order, cancelled it concurrently and repeatedly, then verified restored stock and
all three saved cancelled states. This used seeded fixtures, not mocked responses.
The isolated services were stopped; their data directory is retained at
`/tmp/armorify-phase4-pg-h9tw6_gz`. During this audit the original
`armorify_dev/armorify` was inspected only with read-only transactions; before/after
revision and order/item/product/variant counts matched. No original migration,
reset, drop or data mutation was performed.

Earlier real FastAPI/PostgreSQL acceptance
used seeded data in a generated local schema: guest/authenticated checkout, manipulated
storage prices, stale pricing rejection, last-stock contention, full saved snapshots,
and a deliberately lost response after commit followed by same-key recovery. Cart,
checkout, and success had no horizontal overflow at 360/768/1024/1440px; keyboard
validation, focus, loading, and tracking were exercised. Final owner-change and
changed-cart recovery fixes additionally passed frontend-only intercepted browser
fixtures and real transport/store-module checks; these are not live backend evidence.
The shared currency formatter preserves the backend's two-decimal amounts instead of
rounding VND prices to whole units. A fractional-price regression failed before the
fix and passed after it; a frontend-only receipt fixture displayed a 0.25 VND unit
price and 30,000.50 VND total without overflow at 360px or page errors.

The task-created `phase4_live_*` fixture schema was removed after isolated migration
downgrade/re-upgrade preservation checks. Local fixture data was not left intact.
During the earlier implementation's resumed verification, `armorify_dev/armorify` reported revision
`c4a91f027b63`, rather than the initially observed `80686a8da3e7`; approval for migrating
that target was not recorded. Its new columns exist, and order/item/product counts
were zero at inspection. No rollback or further database changes were attempted.
Treat this schema revision change as an environmental risk, not proof that all local
data was untouched. Downgrading an in-use schema would discard the new checkout data.

### Phase 5 professional admin orders

`/admin/orders` and `/admin/orders/:orderId` replace the generic order editor.
`/admin/manage/order` redirects to the list while retaining query parameters.
Search, order/payment/fulfillment/date filters, sorting and pagination live in the URL;
detail/back navigation retains them. Details use purchased item and delivery snapshots,
never current catalog or customer profile values. Unknown historical data stays unknown.

Admin-only APIs:
- `GET /api/v1/admin/orders`: `{items,total,page,page_size}`, default newest first;
  search matches code/name/phone literally. Filters include unknown (NULL) payment and
  fulfillment; dates are inclusive UTC days. Sort fields are `created_at`, `order_code`
  and `total_amount`, with `asc`/`desc` direction and stable UUID tie-breaking.
- `GET /api/v1/admin/orders/{id}`: saved snapshots/totals, shipment fields, `version`,
  allowed actions with disabled reasons, and chronological internal events.
- `POST /api/v1/admin/orders/{id}/actions`: strict `action` and `expected_version`;
  stale versions and ineligible transitions return field-specific `409` errors.
  The old unrestricted `PUT` and status `PATCH` endpoints are removed.

The workflow is `confirm` (pending → confirmed), `process` (unfulfilled → processing),
`ship` (confirmed/processing → shipped/shipped), and `deliver` (shipped/shipped →
delivered/delivered). Known noncancelled COD orders may record unpaid → paid without
claiming a gateway charge. `cancel` accepts only pending/confirmed, unpaid, unfulfilled
reservations and reuses Phase 4 restock exactly once. State actions require complete,
internally consistent Phase 4 snapshots; historical orders remain readable but fail
closed. Every action locks the order, checks its version and atomically appends an
actor/state/timestamp event in the same transaction.

`ship`/`tracking` accept optional carrier (120 characters) and tracking number
(160 characters); explicit null clears a shipment field. Tracking edits require
matching shipped/delivered order and fulfillment states. `note` appends an internal
note (1–2000 characters), including for historical/cancelled orders. Blank/control
character inputs are rejected. Notes never overwrite customer delivery notes and
internal events never appear in customer/public tracking responses. No carrier links,
integrations, refunds, or payment gateways are implied. State changes require a UI
confirmation; conflicts require explicit reload/review rather than automatic replay.

Migration `e5b72c19a406` follows `c4a91f027b63`: nullable shipment data/timestamps,
positive version counter, and `order_events` with an UPDATE/DELETE rejection trigger.
No historical shipment backfill. Apply it before the new API; normal DDL locks apply.
Downgrade removes shipment/audit/version data, so a non-test rollback needs a backup
and explicit approval. A privileged database owner can still alter/truncate audit
tables; append-only protection is not protection against database administrators.

Dashboard realized revenue includes only active, noncancelled orders recorded paid.
Its chart buckets those qualifying orders by order creation date, not payment date.
Unsupported growth trends are omitted; recent orders link to the dedicated detail.

Verification uses only the Phase 4 guarded disposable PostgreSQL database naming
contract above. New backend checks are `test_admin_orders.py` and `test_dashboard.py`;
run the complete suite and existing Ruff gates, plus all existing frontend checks and:
```bash
cd frontend
node src/pages/admin/orderWorkflow.check.mjs
npm run build && npm run lint
```

Paid-order refunds, historical reservation reconciliation and verified B2B contracts
remain outside this phase. They require explicit business rules and real integrations.

Authentication, dashboard cards/charts, and specialized product editors still retain
legacy styling. Removed admin search/sample-notification controls need real integrations.


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
