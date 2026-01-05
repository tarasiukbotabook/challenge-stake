# B2B Invite Flow - Testing Guide

## Overview
Complete employee invitation system for companies to invite users to join their team.

## Flow Steps

### 1. Company Admin Invites Employee
**Location**: `public/business.html`

1. Click "Пригласить сотрудника" button
2. Search modal opens
3. Enter email, phone, or username in search field
4. System searches database using `companies/searchUsers`
5. Select role (employee/manager/admin)
6. Click "Пригласить" button
7. System calls `companies/inviteEmployee` mutation

**Backend** (`convex/companies.ts`):
- Creates record in `companyEmployees` table with status "invited"
- Creates notification in `notifications` table with type "company_invite"
- Checks company employee limit
- Validates user is not already in another company

### 2. User Receives Notification
**Location**: Mobile app

- Notification appears in app
- User can view in NotificationsScreen

### 3. User Views Invite
**Location**: `mobile-app/src/screens/NotificationsScreen.tsx`

1. User opens Notifications screen
2. Switches to "Приглашения" tab
3. System loads invites using `users/getCompanyInvites` query
4. Displays company name, role, inviter name

### 4. User Accepts/Rejects Invite
**Location**: `mobile-app/src/screens/NotificationsScreen.tsx`

**Accept Flow**:
1. User clicks "Принять" button
2. System calls `companies/acceptInvite` mutation
3. Backend updates `companyEmployees` status to "active"
4. Backend updates user's `companyId` field
5. Success alert shown

**Reject Flow**:
1. User clicks "Отклонить" button
2. Confirmation dialog appears
3. User confirms rejection
4. System calls `companies/rejectInvite` mutation
5. Backend deletes invite record from `companyEmployees`
6. Success alert shown

## API Functions

### Query Functions
- `companies/searchUsers` - Search users by email, username, or phone
- `companies/getEmployees` - Get all company employees
- `users/getCompanyInvites` - Get user's pending company invites

### Mutation Functions
- `companies/inviteEmployee` - Send invite to user
- `companies/acceptInvite` - Accept company invite
- `companies/rejectInvite` - Reject company invite

## Database Tables

### companyEmployees
```typescript
{
  companyId: Id<"companies">,
  userId: Id<"users">,
  role: string, // 'admin', 'manager', 'employee'
  status: string, // 'active', 'invited', 'suspended'
  invitedBy: Id<"users">,
}
```

### notifications
```typescript
{
  userId: Id<"users">,
  type: "company_invite",
  title: "Приглашение в компанию",
  message: "Компания {name} приглашает вас присоединиться к команде",
  relatedId: string, // companyId
  isRead: boolean,
}
```

## Testing Checklist

### Business Panel (public/business.html)
- [ ] Register new company
- [ ] Login to company account
- [ ] Click "Пригласить сотрудника"
- [ ] Search by email - finds user
- [ ] Search by username - finds user
- [ ] Search by phone - finds user
- [ ] Select role from dropdown
- [ ] Click "Пригласить" - success message
- [ ] Verify employee appears in employees table with "invited" status
- [ ] Try inviting same user again - error message
- [ ] Try inviting user already in another company - error message

### Mobile App (NotificationsScreen)
- [ ] Open Notifications screen
- [ ] Switch to "Приглашения" tab
- [ ] Verify invite appears with company name
- [ ] Verify role is displayed
- [ ] Verify inviter name is shown
- [ ] Click "Принять" - success alert
- [ ] Verify user's companyId is updated
- [ ] Verify invite disappears from list
- [ ] Invite another user
- [ ] Click "Отклонить" - confirmation dialog
- [ ] Confirm rejection - success alert
- [ ] Verify invite disappears from list

### Backend Validation
- [ ] Check employee limit enforcement
- [ ] Check duplicate invite prevention
- [ ] Check company conflict prevention
- [ ] Verify notification creation
- [ ] Verify status updates
- [ ] Verify companyId updates

## Known Issues

### Fixed
- ✅ Type error with companyId parameter (changed from `string` to `any`)
- ✅ API path format (changed from `companies:function` to `companies/function`)

### Current Limitations
- Company admin user ID is hardcoded in `invitedBy` field
- Need proper admin user management system
- No email/push notifications (only in-app)

## Next Steps

1. Add proper admin user authentication for business panel
2. Add email notifications for invites
3. Add push notifications for mobile app
4. Add invite expiration (e.g., 7 days)
5. Add ability to resend invites
6. Add ability to cancel pending invites
7. Add employee removal functionality
8. Add role change functionality
