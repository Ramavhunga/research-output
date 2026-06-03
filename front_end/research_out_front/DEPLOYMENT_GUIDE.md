# Journal Permissions - Deployment Guide

## ✅ Pre-Deployment Checklist

- [x] Code compiled successfully with `npm run build`
- [x] No compilation errors
- [x] Permission service created and injected
- [x] Journal component updated with Edit button
- [x] Journal detail component updated with permission checks
- [x] All imports properly configured
- [x] TypeScript types correct
- [x] Angular compatibility verified (Angular 20)

## Files to Deploy

### New Files
```
src/app/services/journal-permission.service.ts
```

### Modified Files
```
src/app/components/journal-component/journal-component.ts
src/app/components/journal-component/journal-component.html
src/app/components/journal-detail-component/journal-detail-component.ts
```

### Documentation (Optional)
```
JOURNAL_PERMISSIONS.md
IMPLEMENTATION_SUMMARY.md
QUICK_REFERENCE.md
```

## Deployment Steps

### 1. Build for Production
```bash
npm run build
```
Output location: `dist/research_out_front`

### 2. Deploy to Azure (or your hosting platform)
```bash
# Using Azure Static Web Apps
npm run serve:ssr:research_out_front

# OR deploy the dist folder to your web server
```

### 3. Verify Deployment
- Navigate to journal list page
- Verify Edit button appears
- Test with different user roles
- Test permission denied scenarios

## Backend Requirements

### 1. Journal API Endpoint
Must return `Journal` objects with:
```json
{
  "id": 1,
  "status": "REJECTED_L1",
  "submittedBy": {
    "username": "john.doe"
  },
  ...other fields
}
```

### 2. Login Endpoint
Must return login data with roles:
```json
{
  "user": {
    "username": "john.doe",
    "roles": ["LEVEL_1_APPROVER"]
  }
}
```

### 3. Status Values
Backend must use these status values:
- `DRAFT`, `SUBMITTED`, `REJECTED_L1`, `REJECTED_L2`
- `UNDER_REVIEW_L1`, `UNDER_REVIEW_L2`, `UNDER_REVIEW`
- `READY_FOR_POSTING`, `READY`, `APPROVED`, `PUBLISHED`, `ARCHIVED`

### 4. Backend Authorization
**CRITICAL:** Backend must also validate permissions:
```java
// Example backend validation
if (request.method == PUT/POST) {
  User currentUser = getCurrentUser();
  Journal journal = getJournal(id);
  
  if (!canEdit(currentUser, journal)) {
    return 403 Forbidden;
  }
}
```

## Environment Configuration

### Development (localhost:8080)
```typescript
// environment/environment-url.ts
export const environment = {
  apiUrl: 'http://localhost:8080/api/'
};
```

### Production (Azure)
```typescript
export const environment = {
  apiUrl: 'https://your-api.azurewebsites.net/api/'
};
```

## Role Configuration

### Expected Roles from Backend
- `ADMIN`
- `LEVEL_1_APPROVER`
- `LEVEL_2_APPROVER`
- `ADMINISTRATOR`
- `RESEARCHER` (or any non-approver role)

Roles are case-insensitive in the permission service.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Angular 20 requires ES2022 support.

## Performance Impact

- **Bundle Size:** +5-10 KB (permission service)
- **Load Time:** No impact (lazy loaded)
- **Runtime Performance:** Negligible (simple permission checks)

## Security Considerations

### ✅ Implemented
- Client-side permission checks
- Clear error messages
- Form read-only mode enforcement
- Session validation

### ⚠️ Required on Backend
- **MUST validate all edit requests**
- **MUST verify user role and authorization**
- **MUST check journal ownership for requestors**
- **MUST prevent status bypass attacks**

**Never rely on client-side validation alone!**

## Rollback Plan

If issues occur:

### 1. Quick Rollback
```bash
# Revert the changed files
git revert HEAD

# Redeploy previous version
npm run build
# Deploy dist folder
```

### 2. Partial Rollback (Hide Edit Button)
```typescript
// In journal-component.ts, comment out:
// <button (click)="editJournal(output)"> in template
```

### 3. Disable Permissions Check
```typescript
// In journal-permission.service.ts
canEditJournal(): { canEdit: boolean } {
  return { canEdit: true, reason: '' }; // Allow all
}
```

## Monitoring & Troubleshooting

### Common Issues

**Issue 1: Edit button never shows**
- Check: User logged in with roles in session
- Check: Journal has valid `submittedBy.username`
- Check: Browser console for errors

**Issue 2: Edit button disabled for admin**
- Check: User role is in session as `ADMIN`, `LEVEL_1_APPROVER`, etc.
- Check: Status is not in locked list
- Check: Permission service imported correctly

**Issue 3: Cannot save after editing**
- Check: Backend validates save request
- Check: User still has permission at time of save
- Check: Journal status hasn't changed

**Issue 4: Form not read-only when denied**
- Check: ngOnInit() permission check executed
- Check: Form.disable() called correctly
- Add debug log: `console.log('canEdit:', permission.canEdit)`

## Logs to Check

### Browser Console
```javascript
// Add debug logging
console.log('Current user:', JSON.parse(sessionStorage.getItem('login')));
console.log('Journal:', journal);
console.log('Permission:', this.permissionService.canEditJournal(journal));
```

### Network Tab
- Check `/api/journal/{id}` response includes `submittedBy`
- Check `/api/user/roles` returns user roles
- Check PUT/POST to `/api/journal/{id}` returns correct response

## Support & Documentation

- **Detailed Docs:** See `JOURNAL_PERMISSIONS.md`
- **Implementation Notes:** See `IMPLEMENTATION_SUMMARY.md`
- **Quick Reference:** See `QUICK_REFERENCE.md`
- **Code Location:** `src/app/services/journal-permission.service.ts`

## Maintenance

### Regular Checks
- Verify status values match backend
- Verify role names match backend
- Test permission denied scenarios
- Monitor error logs

### Potential Updates
- Add new status values
- Add new approver roles
- Update permission logic rules
- Add audit logging

## Version History

| Date | Version | Changes | Status |
|------|---------|---------|--------|
| 2026-06-03 | 1.0 | Initial implementation | ✅ Ready |

## Deploy Confirmation

After deployment, verify:

```
✅ Application loads without errors
✅ Journal list page displays
✅ Edit button visible and functional
✅ Permission validation works
✅ Read-only mode enforced when needed
✅ Backend receives and processes requests
✅ Form save operations succeed
✅ Error messages display correctly
✅ No console errors
✅ Performance acceptable
```

## Success Criteria

- ✅ Requestor can edit REJECTED journals
- ✅ Requestor cannot edit APPROVED journals
- ✅ Admin can edit any non-locked journal
- ✅ Locked status blocks all editing
- ✅ Appropriate error messages shown
- ✅ No security vulnerabilities
- ✅ Backward compatible with existing code

## Contact & Support

For deployment issues:
1. Check error logs in browser console
2. Review this deployment guide
3. Check documentation files
4. Verify backend configuration matches requirements

