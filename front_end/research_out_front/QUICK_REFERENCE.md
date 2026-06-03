# Journal Permissions - Quick Reference Guide

## Overview
Role-based and status-based permission system for journal editing.

## Who Can Edit?

| User Type | Can Edit | Conditions |
|-----------|----------|-----------|
| **Requestor** | ✅ Yes | Status is REJECTED, REJECTED_L1, or REJECTED_L2 |
| **Admin** | ✅ Yes | Status is not READY_FOR_POSTING, READY, APPROVED, PUBLISHED, or ARCHIVED |
| **Level 1 Approver** | ✅ Yes | Status is not locked |
| **Level 2 Approver** | ✅ Yes | Status is not locked |
| **Other Users** | ❌ No | No permissions |

## Implementation Files

### Core Service
```
src/app/services/journal-permission.service.ts
```
**Main Method:**
```typescript
canEditJournal(journal: Journal): { canEdit: boolean; reason: string }
```

### Updated Components
```
src/app/components/journal-component/
  - journal-component.ts (NEW: canEditJournal(), editJournal())
  - journal-component.html (NEW: Edit button)

src/app/components/journal-detail-component/
  - journal-detail-component.ts (UPDATED: ngOnInit() permission check)
```

## How to Use

### In Components
```typescript
import { JournalPermissionService } from '../../services/journal-permission.service';

constructor(private permissionService: JournalPermissionService) {}

canEditJournal(journal: Journal): boolean {
  return this.permissionService.canEditJournal(journal).canEdit;
}

editJournal(journal: Journal): void {
  const permission = this.permissionService.canEditJournal(journal);
  if (!permission.canEdit) {
    Swal.fire('Cannot Edit', permission.reason, 'warning');
    return;
  }
  // Navigate to edit form
}
```

### In Templates
```html
<button 
  (click)="editJournal(journal)"
  [disabled]="!canEditJournal(journal)"
  [title]="canEditJournal(journal) ? 'Edit' : 'No permission'">
  Edit
</button>
```

## Status Hierarchy

### Editable Statuses
- `DRAFT`
- `REJECTED`
- `REJECTED_L1`
- `REJECTED_L2`

### Locked (Read-Only) Statuses
- `READY_FOR_POSTING`
- `READY`
- `APPROVED`
- `PUBLISHED`
- `ARCHIVED`

## User Roles

**Approver Roles (Can Always Edit Non-Locked):**
- `ADMIN`
- `LEVEL_1_APPROVER`
- `LEVEL_2_APPROVER`
- `ADMINISTRATOR`

**Other Roles:**
- Get limited access (only own rejected journals)

## Session Storage Format

```json
{
  "user": {
    "username": "john.doe",
    "roles": ["LEVEL_1_APPROVER"]
  }
}
```

## Common Tasks

### Check if User is Approver
```typescript
const roles = (sessionStorage.getItem('login') || '{}' | 
              obj => obj.user?.roles || []).map(r => r.toUpperCase());
const isApprover = roles.some(r => 
  ['ADMIN', 'LEVEL_1_APPROVER', 'LEVEL_2_APPROVER'].includes(r)
);
```

### Get Permission with Reason
```typescript
const { canEdit, reason } = this.permissionService.canEditJournal(journal);
console.log(canEdit ? 'Can edit' : `Cannot edit: ${reason}`);
```

### Show Appropriate UI
```typescript
if (!canEditJournal(journal)) {
  // Show disabled button or hide button
  // Show read-only view
} else {
  // Show enabled button
  // Allow editing
}
```

## Permission Check Flow

```
1. User clicks Edit button
   ↓
2. editJournal() called
   ↓
3. Get journal from list
   ↓
4. Call permissionService.canEditJournal()
   ↓
5a. If allowed → Navigate to edit mode
   ↓
5b. If denied → Show alert + stay on list
   ↓
6. Journal detail component ngOnInit() double-checks
   ↓
7. If still denied → Load as read-only
```

## Error Messages

| Scenario | Message |
|----------|---------|
| Not logged in | "You must be logged in to edit journals." |
| Locked status | "Journal cannot be edited when status is '[STATUS]'. It is locked for editing." |
| Rejected but wrong user | "As the requestor, you can only edit rejected journals. Current status is '[STATUS]'." |
| No permission | "You do not have permission to edit this journal." |

## Testing

### Test 1: Requestor Edit Rejected
```
Setup: User="john.doe", Journal.status="REJECTED_L1", Journal.submittedBy.username="john.doe"
Expected: ✅ Can edit
```

### Test 2: Requestor Edit Approved by Someone Else
```
Setup: User="jane.doe", Journal.status="APPROVED", Journal.submittedBy.username="john.doe"
Expected: ❌ Cannot edit (not requestor)
```

### Test 3: Admin Edit Approved
```
Setup: User="admin" (role: ADMIN), Journal.status="APPROVED"
Expected: ✅ Can edit
```

### Test 4: Nobody Edits Locked
```
Setup: Any user, Journal.status="READY_FOR_POSTING"
Expected: ❌ Cannot edit (locked for everyone)
```

## Extending Permissions

### Add New Approver Role
1. Add role name to `isApprover()` in permission service
2. Test with new role
```typescript
private isApprover(roles: string[]): boolean {
  const approverRoles = ['ADMIN', 'LEVEL_1_APPROVER', 'LEVEL_2_APPROVER', 
                          'ADMINISTRATOR', 'NEW_ROLE'];
  return roles.some(role => approverRoles.includes(role));
}
```

### Add New Locked Status
1. Add status to `isLockedStatus()` in permission service
```typescript
private isLockedStatus(status: string): boolean {
  const lockedStatuses = ['READY_FOR_POSTING', 'READY', 'APPROVED', 
                         'PUBLISHED', 'ARCHIVED', 'NEW_LOCKED_STATUS'];
  return lockedStatuses.includes(status);
}
```

### Add New Editable Status for Requestor
1. Add status to `isRejectedStatus()` in permission service
```typescript
private isRejectedStatus(status: string): boolean {
  const rejectedStatuses = ['REJECTED', 'REJECTED_L1', 'REJECTED_L2', 
                           'NEEDS_REVISION'];
  return rejectedStatuses.includes(status);
}
```

## Debugging

### Check Current User
```typescript
const login = JSON.parse(sessionStorage.getItem('login') || '{}');
console.log('User:', login.user?.username);
console.log('Roles:', login.user?.roles);
```

### Check Journal
```typescript
console.log('Journal Status:', journal.status);
console.log('Submitted By:', journal.submittedBy?.username);
```

### Check Permission
```typescript
const service = inject(JournalPermissionService);
const permission = service.canEditJournal(journal);
console.log(permission);
```

## Performance Considerations

- **Permission checks are lightweight** - Simple string comparisons
- **No database calls** - All data from session storage
- **Cached in components** - Called only when needed
- **No memory leaks** - Service properly scoped

## Security Notes

1. **Backend must validate** - Always revalidate on server
2. **Session storage not encrypted** - Sensitive for XSS attacks
3. **Role names case-sensitive** - Match exactly with backend
4. **Users can open dev tools** - Don't rely on client-side only

## Related Files

- `src/app/models/journal.model.ts` - Journal interface
- `src/app/interface/login-dto.ts` - Login data structure
- `src/app/services/journal-service.ts` - Journal API calls
- `src/app/guardss/auth.guard.ts` - Route protection

## Support

For issues or questions:
1. Check the `JOURNAL_PERMISSIONS.md` file for detailed docs
2. Review `IMPLEMENTATION_SUMMARY.md` for architecture
3. Check error messages in SweetAlert2 popups
4. Enable browser DevTools for debugging

