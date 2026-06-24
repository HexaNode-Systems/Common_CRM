# Projects Management - Quick Reference & Testing Checklist

## ✅ Implementation Checklist

### Backend Components
- [x] Project model with embedded team and documents schemas
- [x] Project controller with CRUD operations
- [x] Timeline validation (deadline > startDate)
- [x] Resource allocation capacity checker
- [x] Document upload handler with categorization
- [x] Secure file storage with standardized paths
- [x] Filter builder for advanced queries
- [x] API routes with permission guards

### Frontend Components
- [x] Projects list table with 4-column layout
- [x] Sticky filter bar with date range, status, search
- [x] Add/Edit project modal drawer (side panel)
- [x] Client contact details form section
- [x] Project parameters form section
- [x] Team member multi-select with role display
- [x] Drag-and-drop document upload
- [x] File category tagging system
- [x] Status badges with visual icons
- [x] Team avatar stack with +N overflow
- [x] Error and warning message display
- [x] Document viewer for multiple files
- [x] Responsive mobile/tablet/desktop layouts
- [x] Loading states with visual feedback

### Validations
- [x] Frontend: Deadline after start date
- [x] Frontend: Required field enforcement
- [x] Backend: Timeline gatekeeper
- [x] Backend: Resource allocation warnings
- [x] Phone number formatting
- [x] Email format validation
- [x] Safe filename generation

---

## 🧪 Manual Testing Scenarios

### Test 1: Create Project with All Details
**Steps:**
1. Navigate to Projects Management page
2. Click "+ Add New" button
3. Fill all fields:
   - Client: "Test Company", "test@example.com", "+919876543210"
   - Project: "E-commerce Redesign", "Modernize e-commerce platform"
   - Dates: Start = today, Deadline = 30 days from today
   - Budget: "50000", Currency: "INR"
   - Select 2-3 team members
4. Upload 3 documents in different categories
5. Click "Create Project"

**Expected Result:**
- Project created successfully
- Appears in table immediately
- Documents stored in correct path

**Verify Storage Path:**
```
/storage/projects/{projectId}/agreement/{filename}
/storage/projects/{projectId}/prd/{filename}
/storage/projects/{projectId}/invoice/{filename}
```

---

### Test 2: Validation - Deadline Before Start Date
**Steps:**
1. Click "+ Add New"
2. Set Start Date: "2024-02-15"
3. Set Deadline: "2024-02-10" (before start date)
4. Try to submit form

**Expected Result:**
- Error message: "Deadline must occur after the Project Start Date."
- Form does not submit

---

### Test 3: Capacity Warning System
**Steps:**
1. Create Project A marked "Running"
2. Assign "John Developer" (or any user) to Project A
3. Create Project B marked "Pipeline"
4. Try to assign same "John Developer" to Project B
5. Wait 350ms for capacity check

**Expected Result:**
- Warning appears: "Warning: User John Developer is currently fully allocated on other running projects."
- User can still be assigned (soft warning)

---

### Test 4: Advanced Filtering
**Steps A - Date Filter:**
1. Create projects with different date ranges
2. Set "From Date": "2024-01-01"
3. Set "To Date": "2024-03-31"
4. Verify only projects in date range appear

**Steps B - Status Filter:**
1. Create projects with different statuses
2. Select "Running" from status dropdown
3. Verify only Running projects appear

**Steps C - Search:**
1. Type "john" in search box
2. Verify projects with "john" in name, client, or email appear
3. Clear search - verify all projects reappear

---

### Test 5: Document Upload & Viewing
**Steps:**
1. Edit existing project
2. Upload 5 files with different categories
3. Click "Update Project"
4. From table, click "Docs" button

**Expected Result:**
- Single doc: Opens in new tab directly
- Multiple docs: Opens HTML index view with all documents listed by category

---

### Test 6: Edit Existing Project
**Steps:**
1. Click "Edit" on existing project
2. Change budget: "100000"
3. Add new team member
4. Update project description
5. Upload additional document
6. Click "Update Project"

**Expected Result:**
- Changes reflected in table immediately
- Team member shown in avatar stack
- New document accessible in Docs viewer

---

### Test 7: Responsive Layout - Mobile
**Steps:**
1. Open in mobile device or use browser dev tools (375px width)
2. Navigate to Projects Management
3. Interact with filter bar - should stack vertically
4. Open project creation modal
5. Scroll through form sections

**Expected Result:**
- Single column layout on mobile
- All inputs full-width and accessible
- Modal drawer still visible on right (or slides in from bottom)
- No horizontal scrolling needed

---

### Test 8: Table Row Interactions
**Steps:**
1. Hover over table row
2. Background should highlight slightly
3. Click "Edit" - drawer opens
4. Click "Docs" - document viewer opens
5. Verify both actions work independently

**Expected Result:**
- Smooth hover effects
- Drawer/viewer opens without affecting table
- Can switch between Edit and Docs rapidly

---

### Test 9: Status Badge Display
**Steps:**
1. Create/edit projects with each status
2. Verify visual indicators:
   - Pipeline: Blue background, no icon
   - Running: Emerald green, Clock icon
   - Finished: Slate gray, CheckCircle icon
   - Blocked: Red background, AlertCircle icon

**Expected Result:**
- Color and icon match specification
- Text clearly readable on colored background

---

### Test 10: Team Avatar Stack
**Steps:**
1. Create project with 5+ team members
2. Verify:
   - First 3 avatars visible
   - "+2" badge showing remaining count
   - Hover on avatar shows tooltip with name and role

**Expected Result:**
- Avatars display with initials
- Overflow handled gracefully
- No layout shift

---

## 🔧 Debugging Tips

### Empty Projects List
1. Check network tab - verify `/api/catalog` request succeeds
2. Verify MongoDB contains projects with `type: 'project'`
3. Check user permissions - ensure `catalog:read`

### Documents Not Uploading
1. Check browser console for FormData errors
2. Verify `/api/catalog/:id/documents` endpoint accessible
3. Check `storage/` directory exists in backend root
4. Verify Multer middleware configured correctly
5. Check file size limits in Multer config

### Capacity Warnings Not Showing
1. Verify team members assigned to projects with `projectStatus: 'Running'`
2. Check network tab - `/api/catalog/capacity` should be called
3. Verify response includes `warnings` array
4. Check browser console for JavaScript errors

### Filter Not Working
1. Verify query parameters sent: `?dateFrom=X&dateTo=Y&status=Z&search=W`
2. Check MongoDB queries in network tab
3. Verify date format is ISO string (YYYY-MM-DD)
4. Test individual filters one at a time

### Styling Issues
1. Verify Tailwind CSS compiled correctly
2. Check for conflicting class names
3. Inspect element in DevTools to see applied styles
4. Clear browser cache and rebuild frontend

---

## 📊 Performance Metrics

Target Performance Goals:
- Page load: < 2 seconds
- Filter response: < 500ms
- Capacity check: < 1 second
- Document upload: < 5 seconds for 10MB

Monitor with:
```javascript
// Frontend
console.time('filter-query');
// ... filter operation
console.timeEnd('filter-query');

// Backend
GET /api/catalog?limit=100 HTTP/1.1
// Check response time in Network tab
```

---

## 🔐 Security Verification

Checklist:
- [x] All endpoints require `protect` middleware (authentication)
- [x] Permission checks use `authorize()` for CRUD operations
- [x] File uploads limited to 10 files per request
- [x] Filenames sanitized to prevent path traversal
- [x] Storage paths isolated per project
- [x] No sensitive data in client-side code
- [x] Email addresses lowercased to prevent duplicates
- [x] User data validated before database write

---

## 📝 Common Issues & Solutions

**Issue**: "Undefined documents field when viewing project"
**Solution**: Ensure `documents: [projectDocumentSchema]` in CatalogItem model

**Issue**: Drag-and-drop not working
**Solution**: Check browser console for drag event listeners, verify `dragActive` state changes

**Issue**: Team members not loading in dropdown
**Solution**: Verify `/api/users?isActive=true` returns users, check user authentication

**Issue**: Status colors not showing
**Solution**: Verify Tailwind CSS classes like `bg-emerald-50`, `text-emerald-700` are compiled

**Issue**: Slow filter response
**Solution**: Add MongoDB index on `type`, `projectStatus`, `startDate`, `deadline`

**Issue**: Cannot delete project
**Solution**: Check user permissions - ensure `catalog:delete` permission assigned

---

## 🎯 Quality Checklist (Pre-Deployment)

- [ ] All 10 test scenarios pass
- [ ] No console errors or warnings
- [ ] Responsive design tested on mobile/tablet/desktop
- [ ] Performance metrics within targets
- [ ] Security checklist complete
- [ ] Documentation updated
- [ ] Code reviewed by team member
- [ ] Database backups taken
- [ ] Environment variables configured
- [ ] API endpoints tested with Postman/Insomnia
- [ ] Error messages user-friendly and helpful
- [ ] Loading states prevent duplicate submissions
- [ ] Team avatars display correctly
- [ ] Document viewer works for 1+ documents
- [ ] Filter states remembered during session (optional enhancement)

---

## 📞 Support & Troubleshooting

For issues or questions:
1. Check PROJECTS_MANAGEMENT_GUIDE.md for detailed documentation
2. Review this checklist for test scenarios
3. Check browser DevTools (Console, Network, Elements tabs)
4. Verify backend logs: `npm run dev` output
5. Test API endpoints directly with curl or Postman

**Example API Test:**
```bash
# Create project
curl -X POST http://localhost:5000/api/catalog \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Project",
    "clientName": "Test Client",
    "clientEmail": "test@example.com",
    "startDate": "2024-01-15",
    "deadline": "2024-03-15",
    "budget": 50000,
    "currency": "INR",
    "projectStatus": "Pipeline"
  }'

# List projects
curl -X GET "http://localhost:5000/api/catalog?limit=10&status=Running" \
  -H "Authorization: Bearer TOKEN"

# Check capacity
curl -X GET "http://localhost:5000/api/catalog/capacity?userIds=[\"ID1\",\"ID2\"]" \
  -H "Authorization: Bearer TOKEN"
```

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Status**: Ready for Testing ✅
