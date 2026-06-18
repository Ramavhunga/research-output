# View Assigned Deans - Quick Reference Guide

## Access the Feature

1. Login to the system as an ADMIN user
2. Navigate to the sidebar menu
3. Click **"Department Dean Assignment"** under the Admin section
4. URL: `http://localhost:4200/admin/department-dean`

## Two Tabs Available

### Tab 1: Assign Dean ✅ Assign an Employee as Dean to a Department

**Steps:**
1. Select a **Faculty** from the dropdown
   - Wait for departments to load
2. Select a **Department** from the dropdown
   - Automatically filtered based on selected faculty
3. Enter Staff Number in the search field
   - Format: Employee/Staff ID number (e.g., "12345")
4. Click **"Search Employee"** button
   - The system will look up the employee details
5. Verify the employee details displayed:
   - Staff Number
   - Title & Name
   - Current Department & Faculty
   - Current Assigned Roles
6. Click **"Assign as Dean"** to confirm
   - A confirmation dialog will appear
   - Click **"Yes, assign"** to proceed
7. Success! The dean has been assigned
   - List view will be automatically updated

**Clear Button:**
- Resets all fields to start over
- Use if you made a mistake or want to assign a different dean

---

### Tab 2: View Assigned Deans 👥 View All Assigned Deans

**Display Information:**

Each row in the table shows:

| Column | Information |
|--------|-------------|
| **Faculty** | Faculty name (displayed as a badge) |
| **Department** | Department name and code |
| **Dean Name** | Dean's title, first name, and surname |
| **Staff Number** | Employee's staff/ID number |
| **Assigned Date** | Date the assignment was created (YYYY-MM-DD) |
| **Actions** | Remove button to delete the assignment |

**Features:**

- **Refresh Button**: Reload the list to see latest assignments
- **Assignment Counter Badge**: Shows total number of assigned deans
- **Empty State**: Message appears if no deans are assigned
- **Loading Indicator**: Shows while fetching data from the server

---

## Remove a Dean Assignment

1. Go to **"View Assigned Deans"** tab
2. Find the dean you want to remove in the table
3. Click the **"Remove"** button in the Actions column
4. A confirmation dialog will appear showing:
   - Dean's full name
   - Department name
5. Click **"Yes, remove"** to confirm deletion
6. Success message appears
7. The dean is removed from all departments

---

## Common Tasks

### Find a Specific Dean
- Use the **Search** functionality in browser (Ctrl+F / Cmd+F)
- Search by:
  - Faculty name
  - Department name
  - Dean name
  - Staff number

### Reassign a Dean to Different Department
1. **Remove** from current department (View Assigned Deans tab)
2. **Assign** to new department (Assign Dean tab)

### View All Deans from One Faculty
1. Go to Assign Dean tab
2. Select the faculty
3. Switch to View Assigned Deans tab to see deans from that faculty
   OR
   Use browser search (Ctrl+F) to find faculty name in the list

---

## Error Messages and Solutions

| Error | Solution |
|-------|----------|
| "Please select a faculty first" | Make sure to select a faculty from the first dropdown |
| "Please select a department first" | Select a department before searching for staff |
| "No employee details found" | Check staff number is correct; employee may not exist in system |
| "Dean already assigned to this department" | This employee is already a dean in this department; remove first if reassigning |
| "Failed to load.../ Error" | Check internet connection; try refreshing the page; contact support if persists |

---

## Tips

✅ **Best Practices:**

1. **Always verify employee details** before clicking "Assign as Dean"
   - Check name, title, and current department match
   - Verify the staff number is correct

2. **Keep track of faculty hierarchy**
   - Faculty → Department → Dean assignments

3. **Use descriptive staff numbers**
   - System validates format (alphanumeric)

4. **Regular audits**
   - Check "View Assigned Deans" regularly to ensure correct assignments
   - Remove outdated assignments when deans leave

5. **Backup important data**
   - Note assignment dates for audit trail purposes

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Enter | Search for employee (in staff number field) |
| Tab | Move between form fields |
| Ctrl+F | Search page content (browser search) |

---

## FAQ

**Q: Can I assign the same person as dean to multiple departments?**
A: No. The system prevents one person from being assigned as dean to multiple departments simultaneously. You can remove and reassign if needed.

**Q: What happens when I delete a dean assignment?**
A: The person will no longer be listed as a dean for that department. The record is completely removed (this is permanent).

**Q: Can I bulk delete dean assignments?**
A: Currently, you must delete them one at a time. Future version will support bulk operations.

**Q: Where is the data stored?**
A: Dean assignments are stored in the `department_deans` database table with creation and update timestamps.

**Q: Can non-admin users see this feature?**
A: No. This feature is restricted to ADMIN users only. The menu item only appears for admins.

---

## Support

For technical issues or questions:
- Check the error message carefully
- Verify all required fields are filled
- Try refreshing the page
- Contact your IT support team

---

**Last Updated:** June 9, 2026
**Version:** 1.0

