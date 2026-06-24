# Projects Management Module - Developer Quick Start

## 🎯 Quick Overview

The **Projects Management** module is production-ready and fully integrated into your Common CRM admin panel. This guide will get you up and running in 5 minutes.

---

## 📍 Where to Find It

**URL**: `http://localhost:5173/catalog` (after both frontend and backend are running)  
**Sidebar Link**: "Projects Management" in the admin panel menu  
**Component**: `frontend/src/pages/ProjectsManagementPage.jsx`

---

## 🚀 Getting Started

### Step 1: Start the Backend
```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:5000/api`

### Step 2: Start the Frontend
In a new terminal:
```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

### Step 3: Login to Admin Panel
- URL: `http://localhost:5173/login`
- Email: `admin@example.com`
- Password: `Admin@12345`

### Step 4: Navigate to Projects Management
- Click "Projects Management" in the sidebar
- You should see an empty projects list

---

## ✨ Key Features at a Glance

### 1. View Projects
- Table displays: Project Name, Client Info, Timeline, Status, Budget, Team, Actions
- Status colors: Blue (Pipeline), Green (Running), Gray (Finished), Red (Blocked)
- Team avatars stack with "+N" overflow indicator
- Budget auto-formatted with currency symbol (₹ or $)

### 2. Create Project
- Click "+ Add New" button
- Fill 4 form sections:
  - Client details (company, email, phone)
  - Project details (name, description, dates, budget)
  - Team assignment (multi-select checkboxes)
  - Document upload (drag & drop)
- Auto-warnings if team members are over-allocated

### 3. Filter Projects
- **Date Range**: Start and end date filters
- **Status**: Dropdown for Pipeline/Running/Finished/Blocked
- **Search**: Search across project name, client name, email
- All filters real-time with 250ms debounce

### 4. Edit Project
- Click "Edit" on any project row
- Modify any field and re-upload documents
- Drawer auto-loads current values
- Changes immediately reflect in table

### 5. View Documents
- Click "Docs" on any project
- Single document: Opens in new tab
- Multiple documents: Opens organized HTML viewer

---

## 🔌 API Endpoints

All endpoints require authentication token in header:
```
Authorization: Bearer <your_jwt_token>
```

### Core CRUD Endpoints

**List Projects**
```bash
GET /api/catalog?limit=100&page=1&status=Running&search=test&dateFrom=2024-01-01&dateTo=2024-12-31
```

**Get Single Project**
```bash
GET /api/catalog/:projectId
```

**Create Project**
```bash
POST /api/catalog
Content-Type: application/json

{
  "title": "E-commerce Redesign",
  "description": "Modernize e-commerce platform",
  "clientName": "Acme Corp",
  "clientEmail": "contact@acme.com",
  "clientPhone": "+91-9876543210",
  "startDate": "2024-01-15",
  "deadline": "2024-06-30",
  "budget": 50000,
  "currency": "INR",
  "projectStatus": "Running",
  "assignedUserIds": ["userId1", "userId2"]
}
```

**Update Project**
```bash
PUT /api/catalog/:projectId
Content-Type: application/json
{ ...same fields as create... }
```

**Delete Project**
```bash
DELETE /api/catalog/:projectId
```

### Special Endpoints

**Check Team Member Capacity**
```bash
GET /api/catalog/capacity?userIds=["userId1","userId2"]

Response:
{
  "warnings": [
    {
      "userId": "...",
      "name": "John Developer",
      "allocation": 120,
      "projects": ["Project A", "Project B"],
      "message": "Warning: User John Developer is currently fully allocated..."
    }
  ]
}
```

**Upload Project Documents**
```bash
POST /api/catalog/:projectId/documents
Content-Type: multipart/form-data

Form Data:
- documents: [file1, file2, file3]
- categories: ["prd", "agreement", "invoice"]
```

---

## 📊 Database Schema (MongoDB)

```javascript
// Project document in CatalogItem collection
{
  _id: ObjectId,
  type: "project",
  title: "E-commerce Redesign",
  slug: "e-commerce-redesign-1234567890",
  description: "...",
  client: {
    name: "Acme Corp",
    email: "contact@acme.com",
    phone: "+91-9876543210"
  },
  projectStatus: "Running",
  startDate: ISODate("2024-01-15"),
  deadline: ISODate("2024-06-30"),
  budget: 50000,
  price: 50000,
  currency: "INR",
  assignedTeam: [
    {
      user: ObjectId("userId1"),
      name: "John Developer",
      email: "john@team.com",
      role: "Senior Developer",
      allocationPercent: 100
    }
  ],
  documents: [
    {
      filename: "requirements-1703001600000.pdf",
      originalName: "requirements.pdf",
      category: "prd",
      path: "/storage/projects/projectId/prd/requirements-1703001600000.pdf",
      url: "/storage/projects/projectId/prd/requirements-1703001600000.pdf",
      mimetype: "application/pdf",
      size: 245000,
      uploadedAt: ISODate("2024-01-15T10:30:00Z")
    }
  ],
  storagePath: "/storage/projects/projectId",
  createdAt: ISODate("2024-01-15T08:00:00Z"),
  updatedAt: ISODate("2024-01-20T14:30:00Z")
}
```

---

## 🛠️ Customization Examples

### Example 1: Add a New Status Type
1. Update frontend: Add to `PROJECT_STATUSES` array
2. Update backend: MongoDB enum already includes it
3. Update styling: Add case in `getStatusBadge()` function
4. Update icon: Add case in `getStatusIcon()` function

```javascript
// frontend/src/pages/ProjectsManagementPage.jsx
const PROJECT_STATUSES = ['Pipeline', 'Running', 'Finished', 'Blocked', 'OnHold'];
```

### Example 2: Add Custom Project Fields
1. Update MongoDB schema in `backend/src/models/CatalogItem.js`
2. Add form fields to ProjectDrawer in frontend
3. Update API payload builder in controller

```javascript
// Add to catalogItemSchema in CatalogItem.js
customField: { type: String, default: '' },
```

### Example 3: Add New Document Category
1. Update `DOC_CATEGORIES` array in frontend
2. Update `documentCategories` Set in backend controller

```javascript
// frontend
const DOC_CATEGORIES = [
  { value: 'agreement', label: 'Agreement / Contract' },
  { value: 'prd', label: 'PRD' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'other', label: 'Other' },
  { value: 'report', label: 'Reports' }  // NEW
];

// backend
const documentCategories = new Set(['agreement', 'prd', 'invoice', 'other', 'report']);
```

### Example 4: Modify Team Avatar Size
```javascript
// In TeamStack component
className="flex h-7 w-7..."  // Change h-7 w-7 to h-8 w-8 for larger avatars
```

---

## 🧪 Testing Locally

### Quick Manual Test
1. Create a project with all fields filled
2. Upload 3 documents in different categories
3. Assign 2 team members
4. Filter by status "Running"
5. Click Edit to modify
6. Click Docs to view documents
7. All should work smoothly

### Load Testing
Test with bulk creation (adjust as needed):
```bash
# Use curl or Postman to create 50 projects rapidly
for i in {1..50}; do
  curl -X POST http://localhost:5000/api/catalog \
    -H "Authorization: Bearer TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"Project $i\",...}"
done
```

### Database Query
```bash
# In MongoDB shell
db.catalogitems.find({ type: "project" }).count()
db.catalogitems.find({ type: "project", projectStatus: "Running" })
```

---

## 🐛 Common Development Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Cannot read property 'items'" | API not running | Start backend: `npm run dev` in `/backend` |
| Projects table empty but no error | Wrong API response format | Check `/api/catalog` returns `{items: [...], pagination: {...}}` |
| Filter not working | Query params not sent | Verify `updateFilter()` is called |
| Documents not uploading | No `storage/` dir | Create `storage/` folder in backend root |
| Team warnings don't show | Capacity endpoint error | Check `/api/catalog/capacity` endpoint working |
| Drag-drop not working | Browser issue | Try different browser or clear cache |
| Style not applied | Tailwind not compiled | Run `npm run build` in frontend |

---

## 📁 Important File Locations

```
Common CRM/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── project.controller.js      ← Project logic
│   │   ├── models/
│   │   │   └── CatalogItem.js             ← Project schema
│   │   ├── routes/
│   │   │   └── catalog.routes.js          ← API endpoints
│   │   └── middleware/
│   │       └── upload.middleware.js       ← File upload config
│   ├── storage/                           ← Document storage
│   └── app.js                             ← Main server
├── frontend/
│   └── src/
│       ├── pages/
│       │   └── ProjectsManagementPage.jsx ← Main component
│       ├── context/
│       │   └── AuthContext.jsx            ← User auth
│       └── api/
│           └── client.js                  ← API client setup
└── docs/
    ├── PROJECTS_MANAGEMENT_GUIDE.md       ← Detailed guide
    └── TESTING_CHECKLIST.md               ← Test scenarios
```

---

## 🔒 Permissions Check

Ensure your user has these permissions:
```javascript
// Required permissions
catalog:read     // View projects
catalog:create   // Create projects
catalog:update   // Edit projects
catalog:delete   // Delete projects
uploads:create   // Upload documents
```

Set permissions in admin panel → Roles & Permissions → [Your Role]

---

## 📚 Documentation Files

- **PROJECTS_MANAGEMENT_GUIDE.md**: Comprehensive feature documentation
- **TESTING_CHECKLIST.md**: 10 test scenarios with steps
- **README.md**: Updated with Projects Management overview
- **This file**: Quick start guide

---

## 🎓 Next Steps

1. **Run the application** following the Getting Started steps
2. **Test all features** using the Testing Checklist
3. **Customize** if needed for your specific requirements
4. **Deploy** to production after testing
5. **Monitor** performance and user feedback

---

## 💬 Tips & Tricks

**Keyboard Shortcuts** (when applicable):
- `Escape`: Close drawer/modal
- `Tab`: Navigate between form fields
- `Enter`: Submit form (when focused on input)

**Performance Tips**:
- Limit initial load to 50 projects, paginate as needed
- Use filters to narrow dataset for better performance
- Archive old finished projects to reduce table size
- Regular database cleanup (remove old test projects)

**UX Tips**:
- Hover over team avatars to see names and roles
- Drag files directly into the upload zone
- Use date filters instead of scrolling large lists
- Search is fastest way to find specific projects

---

## 🆘 Need Help?

1. Check console for error messages: `F12` → Console tab
2. Check network requests: `F12` → Network tab
3. Verify backend logs: Terminal running `npm run dev`
4. Review PROJECTS_MANAGEMENT_GUIDE.md for detailed docs
5. Run tests from TESTING_CHECKLIST.md

---

**Ready to go!** 🚀

Visit `http://localhost:5173/catalog` and start creating projects.

For detailed documentation, see [PROJECTS_MANAGEMENT_GUIDE.md](./PROJECTS_MANAGEMENT_GUIDE.md)
