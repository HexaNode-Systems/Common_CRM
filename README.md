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
- `/api/catalog` products/services/projects
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

---

## 🚀 Projects Management Module (Enhanced)

### Overview
The **Projects Management** module is a comprehensive project delivery & client management tracker. It enables admins to manage complete project lifecycles including client details, team assignments, timeline tracking, budgeting, and secure document storage.

### Key Features

✅ **Advanced Data Table with Multi-Column Layout**
- Project Name & Client Company with email
- Timeline display (Start Date → Deadline)
- Color-coded status badges (Pipeline, Running, Finished, Blocked)
- Budget display with formatted currency (INR/USD)
- Team member avatar stacks

✅ **Real-Time Filtering**
- Date range picker for timeline filtering
- Project status dropdown filter
- Global search across project name, client name, and email
- Debounced filtering (250ms) for optimal performance

✅ **Comprehensive Project Creation Modal**
- **Section A**: Client context (company name, email, phone)
- **Section B**: Project parameters (title, description, dates, budget, currency)
- **Section C**: Team assignment with active user multi-select
- **Section D**: Drag-and-drop document upload with categorization

✅ **Advanced Validations**
- Frontend: Deadline must be after start date, required field validation
- Backend: Timeline gatekeeper, resource allocation checks
- Soft warnings for over-allocated team members

✅ **Document Management**
- Standardized secure storage: `/storage/projects/{projectId}/{category}/{filename}`
- Document categorization (Agreement, PRD, Invoice, Other)
- Multi-document viewer with HTML index for large document sets
- File size tracking and safe filename generation

✅ **Responsive Design**
- Mobile-optimized (single column) to desktop (4-column layout)
- Sticky filter bar for quick access
- Smooth transitions and hover states
- Professional status icons and visual hierarchy

### Usage

**Navigate to**: Projects Management (Sidebar → "Projects Management")

**Create Project**:
1. Click "+ Add New" button
2. Fill client details and project parameters
3. Select team members (multi-select)
4. Upload required documents
5. Click "Create Project"

**Filter Projects**:
- Use date range to find projects by timeline
- Filter by status (Pipeline, Running, Finished, Blocked)
- Search by project name, client name, or email

**View/Edit**:
- Click "Edit" to modify project details
- Click "Docs" to view or download project documents
- Documents open in organized viewer

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/catalog` | GET | List projects with filters |
| `/api/catalog` | POST | Create new project |
| `/api/catalog/:id` | GET | Get project details |
| `/api/catalog/:id` | PUT | Update project |
| `/api/catalog/:id` | DELETE | Delete project |
| `/api/catalog/capacity` | GET | Check team member allocation |
| `/api/catalog/:id/documents` | POST | Upload project documents |

### Data Schema

```javascript
Project {
  type: 'project',
  title: String,
  description: String,
  client: {
    name: String,
    email: String,
    phone: String
  },
  projectStatus: 'Pipeline' | 'Running' | 'Finished' | 'Blocked',
  startDate: Date,
  deadline: Date,
  budget: Number,
  currency: 'INR' | 'USD',
  assignedTeam: [{
    user: ObjectId,
    name: String,
    email: String,
    role: String,
    allocationPercent: Number
  }],
  documents: [{
    filename: String,
    originalName: String,
    category: 'agreement' | 'prd' | 'invoice' | 'other',
    url: String,
    size: Number,
    uploadedAt: Date
  }]
}
```

### Permissions

| Role | View | Create | Edit | Delete | Upload |
|------|:----:|:------:|:----:|:------:|:------:|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manager | ✅ | ✅ | ✅ | ❌ | ✅ |
| User | ✅ | ❌ | ❌ | ❌ | ❌ |

### File Structure

```
frontend/src/pages/ProjectsManagementPage.jsx
backend/src/controllers/project.controller.js
backend/src/models/CatalogItem.js (extended with project fields)
backend/src/routes/catalog.routes.js
```

### Advanced Features

**Resource Allocation Check**
- Automatically queries running projects for selected team members
- Calculates total allocation percentage per user
- Displays warning if user is fully allocated on other projects
- Soft warning approach (doesn't block but alerts)

**Capacity Warning Message**
```
"Warning: User [Name] is currently fully allocated on other running projects."
```

**Document Organization**
- Files automatically organized by category in storage
- Safe filenames prevent collisions (original-name + timestamp)
- Multi-document viewer for bulk uploads
- Individual file download support

### For Detailed Documentation
See [PROJECTS_MANAGEMENT_GUIDE.md](./PROJECTS_MANAGEMENT_GUIDE.md)

