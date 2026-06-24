# Common CRM/Admin Panel Boilerplate

Reusable CRM/Admin Panel for product-based and service-based businesses.

## Stack

- React.js + Tailwind CSS
- Node.js + Express.js
- MongoDB + Mongoose
- JWT authentication
- Cloudinary image upload
- Dynamic theme/settings via backend APIs and CSS variables

## Structure

```text
backend/   Express API, MongoDB models, JWT auth, Cloudinary uploads
frontend/  React admin panel, reusable UI, dynamic theme provider
```

## Quick Start

### Backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Seed the first super admin:

```bash
npm run seed
```

Default seeded login:

- Email: `admin@example.com`
- Password: `Admin@12345`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Reuse For New Clients

Change these from the admin panel or through `GET/PUT /api/settings`:

- Brand name, logo, favicon
- Primary, secondary, accent colors
- Font family
- Button style, card style, border radius
- Website content
- Contact information
- Social links
- SEO metadata

The frontend reads settings from the backend and writes CSS variables to `:root`, so all reusable components update automatically.

## Main API Groups

- `/api/auth`
- `/api/users`
- `/api/catalog` products/services
- `/api/orders`
- `/api/payments`
- `/api/invoices`
- `/api/enquiries`
- `/api/banners`
- `/api/coupons`
- `/api/settings`
- `/api/theme`
- `/api/uploads`
- `/api/reports`

