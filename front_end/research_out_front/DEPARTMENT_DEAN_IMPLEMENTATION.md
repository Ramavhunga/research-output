 # Department Dean Assignment Implementation Guide

## Overview
This guide explains the Department Dean Assignment feature that allows administrators to assign staff members as Deans to specific departments within faculties.

## Features

### 1. Faculty Selection
- **Dropdown Menu**: Users can select a faculty from all available faculties in the system
- **Auto-loading**: Departments are automatically loaded when a faculty is selected
- **Refresh Button**: Admins can refresh the faculty list at any time

### 2. Department Selection
- **Dynamic Dropdowns**: Departments are filtered based on the selected faculty
- **Cascading Selection**: Selecting a different faculty automatically clears the department selection
- **Department Details**: Code and name of each department are displayed

### 3. Staff Search
- **Search by Staff Number**: Users can search for employees using their staff number
- **Instant Lookup**: The system queries the backend for staff details
- **Staff Verification**: Full staff details are displayed including:
  - Staff Number
  - Title and Name
  - Current Department and Faculty
  - Assigned Roles

### 4. Dean Assignment
- **Confirmation Dialog**: A confirmation dialog is shown before assignment
- **Validation**: All fields must be completed before submission
- **Feedback**: Success messages confirm the assignment

## File Structure

### Components
```
src/app/components/department-dean-assignment-component/
├── department-dean-assignment-component.ts       // Component logic
├── department-dean-assignment-component.html     // Template
└── department-dean-assignment-component.css      // Styling
```

### Services
```
src/app/services/
├── faculty-department.service.ts                 // Faculty/Department API calls
└── user-role.service.ts                          // Staff/User API calls (existing)
```

### Models
```
src/app/models/
├── common.model.ts                               // Faculty and Department interfaces
└── department-dean.model.ts                      // Dean assignment specific models
```

### Routes
- **Path**: `/admin/department-dean`
- **Authentication**: Required (AuthGuard)
- **Required Role**: ADMIN
- **Component**: DepartmentDeanAssignmentComponent

## API Endpoints Used

### Faculty and Department APIs
- **GET** `/api/facultydepartment/faculties` - Get all faculties
- **GET** `/api/facultydepartment/faculties/{facultyId}/departments` - Get departments by faculty

### User/Staff APIs
- **GET** `/user/roles/staff/{staffNo}` - Find staff by staff number

## Component States

### 1. Initial State
- Faculty dropdown is enabled and empty
- Department dropdown is disabled
- Staff search section is hidden
- Assignment button is disabled

### 2. Faculty Selected
- Departments dropdown loads and becomes enabled
- Staff search section remains hidden
- Assignment button remains disabled

### 3. Department Selected
- Staff search section becomes visible
- Users can enter a staff number
- Assignment button remains disabled until staff is found

### 4. Staff Found
- Staff details are displayed
- Assignment button becomes enabled
- User can click to assign the staff member as Dean

## Usage Instructions

1. **Access the Page**
   - Navigate to Dashboard → Admin section
   - Click on "Assign Dean to Department"
   - Or access directly at `/admin/department-dean`

2. **Select Faculty**
   - Click on the Faculty dropdown
   - Choose the desired faculty

3. **Select Department**
   - Department dropdown will auto-populate with departments from selected faculty
   - Click and choose the department

4. **Search for Staff Member**
   - Enter the staff number of the person to assign as Dean
   - Click "Search Employee"

5. **Verify Staff Details**
   - Review the displayed staff information
   - Ensure the correct person was found

6. **Confirm Assignment**
   - Click "Assign as Dean"
   - Confirm in the dialog box
   - Success message will appear

## Validation Rules

| Field | Rule |
|-------|------|
| Faculty | Required |
| Department | Required |
| Staff Number | Required, must be in system |
| Assignment | Requires all fields to be valid |

## Error Handling

The component handles the following error scenarios:
- **Faculty Load Failure**: Displays error message and retry option
- **Department Load Failure**: Shows error for selected faculty
- **Staff Not Found**: Alerts user that staff number doesn't exist
- **Network Issues**: Displays appropriate error messages

## Styling

The component uses:
- **Bootstrap 4.x** classes for layout and responsive design
- **Custom CSS** in `department-dean-assignment-component.css`
- **FontAwesome** icons for visual feedback
- **Responsive Grid System** for mobile compatibility

## Colors and Status Indicators

| Status | Color | Indicator |
|--------|-------|-----------|
| Success | Green (#28a745) | Assigned/Confirmed |
| Info | Blue (#17a2b8) | Information/Loading |
| Warning | Yellow (#ffc107) | Alerts/Validation |
| Error | Red | Error messages |

## Future Enhancements

Potential improvements for this feature:

1. **Backend Integration**
   - Create endpoint: `POST /api/facultydepartment/department/{id}/dean`
   - Add endpoint to remove dean assignments
   - Add endpoint to view current dean assignments

2. **Additional Fields**
   - Start date for dean assignment
   - End date for dean terms
   - Assignment reason/notes

3. **Listing and Management**
   - Display all current dean assignments
   - Edit existing assignments
   - Remove dean assignments with confirmation

4. **Bulk Upload**
   - CSV import for multiple assignments
   - Bulk edit functionality

5. **Reporting**
   - Dean assignment history
   - Department coverage report
   - Timeline view of assignments

## Dependencies

### Required Packages
- `@angular/common` - Angular common utilities
- `@angular/forms` - Form handling (ngModel two-way binding)
- `@angular/router` - Routing
- `sweetalert2` - Alert dialogs
- `rxjs` - Reactive programming

### Required Services
- `FacultyDepartmentService` - Faculty and Department operations
- `UserRoleService` - Staff lookup and role management

## Testing

### Unit Tests (Optional)
```typescript
describe('DepartmentDeanAssignmentComponent', () => {
  // Test faculty loading
  // Test department filtering by faculty
  // Test staff search
  // Test validation rules
  // Test assignment workflow
});
```

### Manual Testing Checklist
- [ ] Faculty dropdown loads all faculties
- [ ] Department dropdown updates when faculty changes
- [ ] Staff search finds valid staff numbers
- [ ] Staff details display correctly
- [ ] Assignment succeeds with confirmation
- [ ] Error messages display appropriately
- [ ] Responsive design works on mobile
- [ ] Navigation works correctly
- [ ] Authentication guards work

## Troubleshooting

### Issue: Faculty dropdown is empty
**Solution**: 
- Check if API endpoint is accessible
- Verify database has faculty records
- Check browser console for network errors

### Issue: Staff not found
**Solution**:
- Verify staff number is correct
- Check if staff exists in the system
- Confirm staff number format

### Issue: Generic API errors
**Solution**:
- Check network connectivity
- Verify backend service is running
- Check API URL in environment configuration
- Review browser console for specific errors

## Configuration

### Environment Configuration
Update `src/environment/environment-url.ts`:

```typescript
export const environment = {
  apiUrl: 'http://localhost:8080/' // Adjust based on your backend URL
};
```

## Accessibility

The component includes:
- Semantic HTML structure
- ARIA labels for form inputs
- Keyboard navigation support
- Clear error messages
- Visual status indicators

## Performance Considerations

- Faculty list is loaded once on component initialization
- Departments are loaded only after faculty selection
- Staff search is performed on-demand
- Loading states prevent duplicate requests
- Error states clear after retry attempts

## Support

For issues or questions:
1. Check this documentation
2. Review browser console for errors
3. Verify API endpoints are working
4. Check database connectivity
5. Contact system administrator

## Related Components

- **Role Assignment Component** (`/admin/roles`) - Assign application roles to users
- **Dashboard Component** - System overview and navigation

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-06-09 | Initial implementation |

---

**Last Updated**: June 9, 2026
**Component Status**: Ready for Testing

