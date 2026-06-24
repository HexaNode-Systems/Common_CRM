# Projects Management Module - Implementation Guide

## 📋 Overview

The **Projects Management** module is a comprehensive project delivery & client management tracker within the Common CRM admin panel. It provides complete lifecycle management for projects including client details, team assignments, timeline tracking, budgeting, and document management.

---

## 🎯 Features Implemented

### 1. **Main UI - Projects Data Table**
- **Responsive Table Layout** with 4-column structure:
  - **Project & Client**: Project name (bold), company name, and email
  - **Timeline & Status**: Date range, color-coded status badges with icons
  - **Budget & Team**: Formatted budget display, team member avatars stack
  - **Actions**: Edit and Documents viewing buttons

- **Status Types** with visual indicators:
  - `Pipeline` (Blue) - Upcoming projects
  - `Running` (Emerald Green) - Active projects with Clock icon
  - `Finished` (Slate Gray) - Completed projects with CheckCircle2 icon
  - `Blocked` (Red) - Halted projects with AlertCircle icon

### 2. **Advanced Filter Bar** (Sticky top position)
- **Date Range Picker**: Filter by start date or deadline
- **Status Dropdown**: Instant filtering by project status
- **Global Search**: Search across project name, client name, and email
- All filters work in real-time with 250ms debounce

### 3. **Add New Project Modal/Drawer**
The drawer opens as a side panel (max-width: 4xl) with organized sections:

#### **Section A: Client Context & Contact Details**
- Client Company Name (required)
- Point of Contact Email (email validation)
- Phone / WhatsApp (numeric formatting with validation)

#### **Section B: Project Parameters & Deadlines**
- Project Name (required)
- Project Status (dropdown with 4 options)
- Project Description (textarea for scope details)
- Start Date (date picker)
- Deadline / End Date (date picker with min-date validation)
- Project Budget (number input)
- Currency Selection (INR / USD)

#### **Section C: Team Assignment**
- Multi-select checkboxes for active users
- Shows user name, role, and email
- Scrollable container (max-height: 256px)
- Displays capacity warnings for over-allocated team members

#### **Section D: Document Upload**
- **Drag & Drop Zone**: Visual feedback on drag enter/leave
- **File List Display**: Shows filename and file size
- **Category Tags**: Agreement/Contract, PRD, Invoice, Other
- **Remove Button**: Delete files before upload
- Auto-detects proper MIME types

### 4. **Advanced Validation & Rules**

**Frontend Validations:**
- Deadline must be after Start Date (enforced on input & form submission)
- Required fields: Client Name, Email, Project Name, Start Date, Deadline
- Phone number format: numeric characters only with optional + and spaces
- Email format validation on input

**Backend Validations:**
- Timeline gatekeeper: `deadline > startDate` or throw 400 error
- Resource allocation check: Query running projects for assigned users
- Auto-population of `storagePath`: `/storage/projects/{projectId}`

### 5. **Capacity Warning System**
- Async query triggers after 350ms of user selection changes
- Fetches running projects for selected team members
- Calculates allocation percentage per user
- Displays soft warning if user allocation ≥ 100% on running projects
- Message format: `"Warning: User [Name] is currently fully allocated on other running projects."`

### 6. **Document Storage & Retrieval**
- **Standardized Path**: `/storage/projects/{projectId}/{category}/{filename}`
- **Safe Filenames**: Original filename + timestamp to avoid collisions
- **Multi-format Support**: Any file type accepted
- **Document Viewer**: 
  - Single document: Opens directly in new tab
  - Multiple documents: Generates HTML index view with categorized links

---

## 🔧 Backend Architecture

### **API Endpoints**

| Method | Endpoint | Permission | Description |
|--------|----------|-----------|-------------|
| GET | `/api/catalog` | catalog:read | List projects with filters/pagination |
| POST | `/api/catalog` | catalog:create | Create new project |
| GET | `/api/catalog/:id` | catalog:read | Get project details |
| PUT | `/api/catalog/:id` | catalog:update | Update project |
| DELETE | `/api/catalog/:id` | catalog:delete | Delete project |
| GET | `/api/catalog/capacity` | catalog:read | Check team member allocation |
| POST | `/api/catalog/:id/documents` | uploads:create | Upload project documents |

### **Data Models**

**CatalogItem (Project)**
```javascript
{
  type: 'project',
  title: String,
  slug: String (unique),
  description: String,
  client: {
    name: String,
    email: String (lowercase),
    phone: String
  },
  projectStatus: ['Pipeline', 'Running', 'Finished', 'Blocked'],
  startDate: Date,
  deadline: Date,
  budget: Number (≥ 0),
  currency: String,
  assignedTeam: [{
    user: ObjectId,
    name: String,
    email: String,
    role: String,
    allocationPercent: Number (0-100, default 100)
  }],
  documents: [{
    filename: String,
    originalName: String,
    category: ['agreement', 'prd', 'invoice', 'other'],
    path: String,
    url: String,
    mimetype: String,
    size: Number,
    uploadedAt: Date
  }],
  storagePath: String,
  timestamps: { createdAt, updatedAt }
}
```

### **Filter Query Logic**
```javascript
// buildProjectFilter function processes:
- status: Maps to projectStatus field
- search: Regex search on title, client.name, client.email
- dateFrom, dateTo: Range filter on startDate OR deadline
```

### **Capacity Check Algorithm**
```javascript
// For each selected user:
1. Query all Running projects where user is assigned
2. Sum allocation percentages from all projects
3. If sum >= 100%, add to warnings array
4. Return warnings with user ID, name, and message
```

---

## 📁 File Structure

```
frontend/src/pages/
└── ProjectsManagementPage.jsx         # Main component (enhanced version)

backend/src/
├── controllers/
│   └── project.controller.js          # Project CRUD & document handling
├── models/
│   └── CatalogItem.js                 # Project schema with documents
├── routes/
│   └── catalog.routes.js              # Project API routes
└── middleware/
    ├── auth.middleware.js             # Permission checks
    └── upload.middleware.js           # Multer file upload config
```

---

## 🎨 UI/UX Design System

### **Color Palette**
- Primary: `#2563EB` (Blue-600)
- Success: `#10B981` (Emerald-500)
- Warning: `#F59E0B` (Amber-500)
- Error: `#EF4444` (Red-500)
- Neutral: `#64748B` (Slate-500)

### **Typography**
- Page Title: `text-3xl font-bold`
- Section Headers: `text-sm font-semibold uppercase`
- Input Labels: `text-sm font-medium`
- Body Text: `text-sm`
- Captions: `text-xs`

### **Component Styling**
- Border Radius: `rounded-lg` (8px) for inputs, `rounded-full` (50%) for avatars
- Spacing: Consistent 4px grid (gap-1, gap-2, gap-3, gap-4, gap-8)
- Shadows: `shadow-sm` for cards, `shadow-2xl` for drawers
- Hover States: `hover:bg-slate-50`, `hover:text-blue-600`

### **Responsive Design**
- Mobile: Single column layout
- Tablet (md): 2-3 columns
- Desktop (lg): Full 4-column layout
- Filter bar grid: 1 col (mobile) → 4 cols (desktop)

---

## 🔐 Security & Permissions

### **Permission Matrix**
| Role | Project View | Create | Edit | Delete | Upload Docs |
|------|:-----:|:------:|:----:|:------:|:-----------:|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manager | ✅ | ✅ | ✅ | ❌ | ✅ |
| User | ✅ | ❌ | ❌ | ❌ | ❌ |

### **Data Protection**
- All project creation/updates require `protect` middleware (authentication)
- File uploads are validated by Multer (10 files max per request)
- Filename sanitization prevents directory traversal attacks
- Storage paths are isolated per project

---

## 🧪 Testing Workflow

### **Manual Testing Steps**

1. **Create New Project**
   - Click "+ Add New" button
   - Fill all required fields
   - Select team members
   - Upload 2-3 documents in different categories
   - Submit and verify project appears in table

2. **Filter Testing**
   - Filter by date range → verify only projects in range show
   - Filter by status → verify only selected status shows
   - Search "test" → verify name, client, email matching works
   - Clear filters → verify all projects reappear

3. **Edit Project**
   - Click Edit on existing project
   - Modify budget, add more team members
   - Upload additional documents
   - Update and verify changes reflected in table

4. **Capacity Warning**
   - Create project marked "Running"
   - Assign user to this project
   - Create another project and try to assign same user
   - Verify warning appears: "User is currently fully allocated"

5. **Document Management**
   - Upload multiple documents
   - Click "Docs" button
   - Verify all documents open in new view
   - Test viewing individual documents

---

## 🚀 Performance Optimizations

1. **Debounced Filtering**: 250ms delay prevents excessive API calls
2. **Lazy User Fetching**: Users loaded once on component mount
3. **Memoized Calculations**: Status stats computed only when projects change
4. **Efficient Date Formatting**: Intl.DateTimeFormat cached per locale
5. **Optimized Re-renders**: Drawer state separated from project data

---

## 📝 Error Handling

### **Frontend Error Messages**
- "Unable to load projects." - API fetch failure
- "Deadline must occur after the Project Start Date." - Timeline validation
- "Unable to save project." - Creation/update failure
- "No uploaded documents found for this project." - Document access error

### **Backend Error Responses**
- `400 Bad Request`: Validation failures (timeline, required fields)
- `404 Not Found`: Project doesn't exist
- `403 Forbidden`: Insufficient permissions
- `500 Server Error`: Database/file system errors

---

## 🔄 API Response Examples

### **List Projects Response**
```json
{
  "items": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "E-commerce Platform",
      "client": {
        "name": "Acme Corp",
        "email": "contact@acme.com",
        "phone": "+91-9876543210"
      },
      "projectStatus": "Running",
      "startDate": "2024-01-15",
      "deadline": "2024-06-30",
      "budget": 50000,
      "currency": "INR",
      "assignedTeam": [
        {
          "user": "507f1f77bcf86cd799439012",
          "name": "John Developer",
          "email": "john@team.com",
          "role": "Senior Developer",
          "allocationPercent": 100
        }
      ],
      "documents": [
        {
          "filename": "requirements-1703001600000.pdf",
          "originalName": "requirements.pdf",
          "category": "prd",
          "url": "/storage/projects/507f1f77bcf86cd799439011/prd/requirements-1703001600000.pdf",
          "size": 245000,
          "uploadedAt": "2024-01-15T10:30:00Z"
        }
      ],
      "createdAt": "2024-01-15T08:00:00Z",
      "updatedAt": "2024-01-20T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 25,
    "pages": 1
  }
}
```

### **Capacity Check Response**
```json
{
  "warnings": [
    {
      "userId": "507f1f77bcf86cd799439012",
      "name": "John Developer",
      "allocation": 120,
      "projects": ["E-commerce Platform", "Mobile App Dev"],
      "message": "Warning: User John Developer is currently fully allocated on other running projects."
    }
  ]
}
```

---

## 📚 Further Development Opportunities

1. **Bulk Actions**: Multi-select projects for batch status updates
2. **Advanced Reporting**: Project metrics, team utilization charts
3. **Audit Logging**: Track all project modifications with user info
4. **Email Notifications**: Alert stakeholders on status changes
5. **Document Versioning**: Track document upload history
6. **Custom Fields**: Allow admins to add project-specific fields
7. **Project Templates**: Save as template for future projects
8. **Integration APIs**: Webhooks for external system sync
9. **Time Tracking**: Log hours worked per project
10. **Risk Management**: Flag projects at risk of deadline miss

---

## 🎓 Developer Notes

- The project uses MongoDB for data persistence
- Frontend state management is React hooks-based
- All date operations use native JavaScript Date and Intl APIs
- File uploads are handled via FormData and Multer middleware
- Async operations properly handle loading/error states
- Component re-renders are optimized with useMemo and useCallback
- All user interactions provide immediate visual feedback

---

**Last Updated**: January 2025  
**Module Version**: 1.0.0  
**Status**: Production Ready ✅
