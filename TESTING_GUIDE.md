# Testing Guide

## Quick Test Steps

### 1. Start the Application
```bash
npm start
# or
ng serve
```

### 2. Test Admin Login
1. Open browser to `http://localhost:4200`
2. Enter phone number: `9876543210`
3. Click "Login"
4. Should navigate to Admin Dashboard
5. Verify you can see "Admin User" in header

### 3. Test User Login
1. Logout from admin
2. Enter phone number: `9876543211`
3. Click "Login"
4. Should navigate to User Dashboard
5. Verify you can see "John Doe" in header

### 4. Test Invalid Login
1. Logout
2. Enter phone number: `1234567890`
3. Click "Login"
4. Should show error: "Access denied — not a group member."

### 5. Test Phone Validation
1. Try entering non-numeric characters - should be filtered out
2. Try entering less than 10 digits - should show validation error
3. Try entering more than 10 digits - should be limited to 10

### 6. Test Admin Features
1. Login as admin (9876543210)
2. Click "Manage Members"
3. Add a new member
4. Set admin status for a member
5. Edit a member
6. Remove a member

### 7. Test Route Guards
1. Logout
2. Try accessing `/admin` directly - should redirect to login
3. Login as user (9876543211)
4. Try accessing `/admin` directly - should redirect to user dashboard
5. Login as admin (9876543210)
6. Try accessing `/admin` directly - should allow access

### 8. Test Session Persistence
1. Login as any user
2. Refresh the page
3. Should remain logged in
4. Close browser and reopen
5. Should remain logged in (localStorage)

## Default Test Accounts

| Phone Number | Name | Role | Access |
|-------------|------|------|--------|
| 9876543210 | Admin User | Admin | Admin Dashboard |
| 9876543211 | John Doe | User | User Dashboard |
| 9876543212 | Jane Smith | User | User Dashboard |

## Expected Behaviors

### Login Form
- ✅ Only accepts 10-digit numbers
- ✅ Filters out non-numeric characters
- ✅ Shows loading state during validation
- ✅ Shows specific error messages
- ✅ Disables submit button during loading

### Authentication
- ✅ Validates against member list
- ✅ Shows "Access denied" for non-members
- ✅ Sets role based on member profile
- ✅ Stores in localStorage and sessionStorage
- ✅ Persists across page refreshes

### Route Guards
- ✅ AuthGuard protects all authenticated routes
- ✅ AdminGuard protects admin routes
- ✅ Redirects unauthorized users appropriately

### Member Management
- ✅ Only admins can access member management
- ✅ Can add/edit/remove members
- ✅ Can set admin status
- ✅ Validates phone numbers
- ✅ Prevents duplicate phone numbers

## Troubleshooting

### Issue: "Access denied — not a group member"
**Solution**: Make sure you're using one of the default test phone numbers, or add your number via admin panel.

### Issue: Cannot login as admin
**Solution**: 
1. Clear localStorage: `localStorage.clear()` in browser console
2. Refresh page
3. Try logging in again with 9876543210

### Issue: Members not loading
**Solution**: 
1. Check browser console for errors
2. Verify localStorage has `whatsapp_members` key
3. Clear localStorage and refresh (will reinitialize with defaults)

### Issue: Route guard redirects incorrectly
**Solution**: 
1. Check browser console for errors
2. Verify authentication state in localStorage
3. Logout and login again

## Browser Console Commands

### Clear all data
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Check current user
```javascript
console.log('Role:', localStorage.getItem('currentRole'));
console.log('Phone:', localStorage.getItem('currentPhone'));
console.log('Member:', JSON.parse(localStorage.getItem('currentMember')));
```

### Check members list
```javascript
console.log('Members:', JSON.parse(localStorage.getItem('whatsapp_members')));
```

### Add test member manually
```javascript
const members = JSON.parse(localStorage.getItem('whatsapp_members') || '[]');
members.push({
  id: Date.now().toString(),
  name: 'Test User',
  phone: '9999999999',
  isAdmin: false,
  addedDate: new Date().toISOString()
});
localStorage.setItem('whatsapp_members', JSON.stringify(members));
location.reload();
```

