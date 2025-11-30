# Login Integration Test Guide

## ✅ System Status

| Component | Status | Port | Command |
|-----------|--------|------|---------|
| **Backend Server** | ✅ Running | 3000 | `npm start` (in `server/` folder) |
| **MongoDB** | ✅ Connected | 27017 | Auto-connected via server |
| **Angular App** | ✅ Running | 4201 | `ng serve --port 4201` |

---

## 🔐 Test Users Created

### Admin User
- **Phone:** `7339211768`
- **Password:** `Admin123`
- **Role:** Admin

### Regular User
- **Phone:** `9876543211`
- **Password:** `User123`
- **Role:** User

---

## 🧪 Test Login Flow

### Step 1: Open App
```
Browser → http://localhost:4201
```

### Step 2: Test Password Validation
**Try Login WITHOUT Password:**
1. Enter phone: `7339211768`
2. Leave password empty
3. Click **Login** button
4. ✅ Should show error: **"Password is required"**

### Step 3: Test Invalid Credentials
**Try Wrong Password:**
1. Enter phone: `7339211768`
2. Enter password: `WrongPassword`
3. Click **Login**
4. ✅ Should show error: **"Invalid password"** or similar

### Step 4: Test Successful Login (Admin)
**Correct Credentials:**
1. Enter phone: `7339211768`
2. Enter password: `Admin123`
3. Click **Login**
4. ✅ Should redirect to **Admin Dashboard** (`/admin`)

### Step 5: Test Successful Login (User)
**Logout first, then:**
1. Click **Logout** button
2. Enter phone: `9876543211`
3. Enter password: `User123`
4. Click **Login**
5. ✅ Should redirect to **User Dashboard** (`/user`)

### Step 6: Test Forgot Password Modal
1. On login page, click **"Forgot Password?"** link
2. ✅ Modal should open
3. Enter any phone number: `7339211768`
4. Click **"Send Reset Link"**
5. ✅ Should show message: "Check your phone for password reset link"
6. Click **"Back to Login"** or wait 3 seconds
7. ✅ Modal closes automatically

---

## 🔍 How It Works

### Flow Diagram
```
Login Page (port 4201)
    ↓
[User enters phone + password]
    ↓
Angular → HTTP POST /api/auth/login
    ↓
Proxy (proxy.conf.json)
    ↓
Backend Server (port 3000)
    ↓
/api/auth/login endpoint
    ↓
MongoDB (finds user by phone, checks bcrypt password)
    ↓
Returns: { success: true, member: {...}, token: "JWT..." }
    ↓
Angular stores: currentMember, currentRole, authToken
    ↓
Navigate to /admin or /user
```

### Password Security
- Passwords stored as **bcrypt hashes** in MongoDB (never plaintext)
- Login validates hash server-side
- JWT token returned for future API calls
- Token stored in localStorage (can be improved with httpOnly cookies)

---

## 🛠️ Troubleshooting

### Issue: "Cannot GET /api/auth/login"
**Solution:**
- Ensure server is running: `npm start` in `server/` folder
- Check port 3000 is accessible: `http://localhost:3000/` should return `{"ok":true}`
- Verify proxy.conf.json exists in `src/` folder

### Issue: "Member not found"
**Solution:**
- User doesn't exist in MongoDB
- Create user first:
  ```powershell
  $body = @{ name="Test"; phone="7339211768"; password="Test123"; isAdmin=$true } | ConvertTo-Json
  Invoke-WebRequest -Uri "http://localhost:3000/api/members" -Method Post -Body $body -ContentType "application/json" -UseBasicParsing
  ```

### Issue: "Invalid password"
**Solution:**
- Password doesn't match what was set
- Create new user with known password or check MongoDB:
  ```powershell
  mongosh
  use room_expense
  db.members.find()
  ```

### Issue: Angular stuck on "Validating..."
**Solution:**
- Backend not responding
- Check console (F12) for CORS errors
- Verify proxy config in angular.json has `"proxyConfig": "src/proxy.conf.json"`
- Restart Angular: `ng serve --port 4201`

---

## 📱 Test on Mobile/Different Device

To access from another computer:
```
http://<your-ip>:4201
```

Get your IP:
```powershell
ipconfig /all
# Look for IPv4 Address (e.g., 192.168.1.100)
```

**Note:** Backend must allow CORS from that IP (already enabled in server/index.js)

---

## 📊 API Endpoints Reference

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "phone": "7339211768",
  "password": "Admin123"
}
```

**Response:**
```json
{
  "success": true,
  "member": {
    "id": "...",
    "name": "Admin User",
    "phone": "7339211768",
    "isAdmin": true,
    "addedDate": "2025-11-14T..."
  },
  "token": "eyJhbGciOiJIUzI1NiI..."
}
```

### Create Member
```http
POST /api/members
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "9876543211",
  "password": "Pass123",
  "isAdmin": false
}
```

### Get All Members
```http
GET /api/members
```

---

## ✨ Next Steps

1. ✅ **Login works** — Test with the users above
2. 🔄 **Add JWT Interceptor** — Auto-attach token to future API requests
3. 🔄 **Add Admin Password Manager** — Admin can create/reset user passwords
4. 🔄 **Deploy to Production** — Use MongoDB Atlas + Vercel/Render

---

## 💾 Reset Everything (Start Fresh)

**Drop MongoDB collection:**
```powershell
mongosh
use room_expense
db.members.deleteMany({})
exit
```

**Recreate users:**
```powershell
# Run the API calls from the PowerShell section above
```

---

## 🎯 Success Checklist

- [x] Backend server running on port 3000
- [x] MongoDB connected
- [x] Angular app running on port 4201
- [x] Proxy config created (`src/proxy.conf.json`)
- [x] Test users created in MongoDB
- [ ] Login with admin credentials ← **Do this now!**
- [ ] See admin dashboard
- [ ] Logout and login as regular user
- [ ] See user dashboard
- [ ] Test forgot password modal

Go to **http://localhost:4201** and test login! 🚀
