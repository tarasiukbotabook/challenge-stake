# 🚀 B2B Quick Start Guide

## For Company Admins

### 1. Register Your Company
1. Open `https://your-domain.com/business.html`
2. Click "Зарегистрироваться"
3. Fill in:
   - Company name
   - Email
   - Password
   - Website (optional)
4. Click "Зарегистрироваться"
5. Login with your credentials

### 2. Invite Employees
1. Navigate to "Сотрудники" in sidebar
2. Click "Пригласить сотрудника"
3. In the search box, enter:
   - Employee's email, OR
   - Employee's username, OR
   - Employee's phone number
4. Select role from dropdown:
   - **Employee** - basic access
   - **Manager** - can manage employees
   - **Admin** - full access
5. Click "Пригласить"
6. Employee will receive notification in mobile app

### 3. View Your Team
- Go to "Сотрудники" tab
- See all employees with status:
  - 🟢 **Active** - accepted invite
  - 🟡 **Invited** - pending response

### 4. Manage Balance
1. Go to "Настройки" tab
2. Click "Пополнить баланс"
3. Enter amount
4. Confirm

## For Employees

### 1. Receive Invite
- You'll get a notification in the app
- Notification says: "Компания {name} приглашает вас присоединиться к команде"

### 2. View Invite
1. Open app
2. Tap "Notifications" icon
3. Switch to "Приглашения" tab
4. See invite details:
   - Company name
   - Your role
   - Who invited you

### 3. Accept Invite
1. Tap "Принять" button
2. See success message
3. You're now part of the company!
4. Your profile shows company affiliation

### 4. Reject Invite
1. Tap "Отклонить" button
2. Confirm in dialog
3. Invite is removed

## API Quick Reference

### Search Users
```javascript
await client.query("companies/searchUsers", {
  searchQuery: "user@example.com" // or username or phone
});
```

### Invite Employee
```javascript
await client.mutation("companies/inviteEmployee", {
  companyId: "company_id",
  userId: "user_id",
  role: "employee", // or "manager" or "admin"
  invitedBy: "admin_user_id"
});
```

### Get Company Invites (User)
```javascript
await client.query("users/getCompanyInvites", {
  userId: "user_id"
});
```

### Accept Invite
```javascript
await client.mutation("companies/acceptInvite", {
  companyId: "company_id",
  userId: "user_id"
});
```

### Reject Invite
```javascript
await client.mutation("companies/rejectInvite", {
  companyId: "company_id",
  userId: "user_id"
});
```

## Troubleshooting

### "Пользователь уже работает в другой компании"
- User can only be in one company at a time
- They need to leave current company first

### "Достигнут лимит сотрудников"
- Upgrade your plan
- Free plan: 5 employees
- Starter: 20 employees
- Business: 100 employees
- Enterprise: unlimited

### "Сотрудник уже добавлен или приглашён"
- User already has pending invite
- Or user already accepted invite

### Search returns no results
- Check spelling
- Try different search method (email vs username)
- User might not be registered yet

## Tips

### For Admins
- ✅ Search by email is most reliable
- ✅ Check employee status before re-inviting
- ✅ Assign appropriate roles
- ✅ Monitor your employee limit

### For Employees
- ✅ Check notifications regularly
- ✅ Read invite details before accepting
- ✅ You can only be in one company
- ✅ Contact company admin if issues

## Support

For issues or questions:
1. Check documentation in `/docs` folder
2. Review `B2B_INVITE_FLOW.md` for detailed flow
3. Check `BUSINESS.md` for full feature list
