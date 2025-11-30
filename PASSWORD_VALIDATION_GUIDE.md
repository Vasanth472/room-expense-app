# Wrong Password Error Handling - Complete Guide

## ✅ What's Implemented

### Backend API Response (Updated)
The login API now returns **specific error messages** for different scenarios:

```javascript
// File: server/routes/auth.js
POST /api/auth/login
├─ Phone not registered → error: "Phone number not registered." (code: MEMBER_NOT_FOUND)
├─ Wrong password → error: "Wrong password. Please try again." (code: WRONG_PASSWORD)
├─ Password not set → error: "Password not set for this account. Contact admin." (code: PASSWORD_NOT_SET)
└─ Server error → error: "Server error" (status 500)
```

### Frontend Error Display (Updated)
The login component now shows **user-friendly error messages**:

```typescript
// File: src/app/components/login/login.component.ts
- Password field validation: "Password is required" (client-side)
- Wrong password: Shows API error "Wrong password. Please try again."
- Phone not registered: Shows API error "Phone number not registered."
- Network error: "Network error. Please check your connection and try again."
```

### Auth Service Enhancement (Updated)
Handles specific error codes from backend:

```typescript
// File: src/app/services/auth.service.ts
if (resp?.code === 'WRONG_PASSWORD') {
  errorMsg = 'Wrong password. Please try again.';
} else if (resp?.code === 'MEMBER_NOT_FOUND') {
  errorMsg = 'Phone number not registered.';
} else if (resp?.code === 'PASSWORD_NOT_SET') {
  errorMsg = 'Password not set for this account. Contact admin.';
}
```

---

## 🧪 Complete Testing Flow

### Step 1: Start Backend Server

Open **PowerShell Terminal** and run:
```powershell
cd 'C:\.ME\Angular\dummy trail\Room.12\server'
npm start
```

**Expected Output:**
```
> room-expense-server@0.1.0 start
> node index.js

Server listening on port 3000
Connected to MongoDB
```

### Step 2: Start Angular App

Open **Another PowerShell Terminal** and run:
```powershell
cd 'C:\.ME\Angular\dummy trail\Room.12'
ng serve --port 4201
```

**Expected Output:**
```
Application bundle generation complete. Watch mode enabled.
Local: http://localhost:4201/
```

### Step 3: Test in Browser

Open browser and go to: **http://localhost:4201**

---

## 🔍 Test Scenarios

### Scenario 1: Empty Password (Client-side Validation)
**Action:**
1. Enter phone: `7339211768`
2. Leave password empty
3. Click "Login"

**Expected Result:**
- Red error message: **"Password is required"** (instant, no API call)

---

### Scenario 2: Wrong Password (API Error)
**Action:**
1. Enter phone: `7339211768`
2. Enter password: `WrongPassword`
3. Click "Login"
4. Wait for response

**Expected Result:**
- Red error message: **"Wrong password. Please try again."**
- No page redirect
- User stays on login page

---

### Scenario 3: Phone Not Registered (API Error)
**Action:**
1. Enter phone: `1111111111`
2. Enter password: `anything`
3. Click "Login"

**Expected Result:**
- Red error message: **"Phone number not registered."**
- No page redirect

---

### Scenario 4: Correct Password (Success)
**Action:**
1. Enter phone: `7339211768`
2. Enter password: `Admin123`
3. Click "Login"
4. Wait for redirect

**Expected Result:**
- No error message
- Redirect to: **http://localhost:4201/admin** dashboard
- User info displayed in header

---

### Scenario 5: Regular User Login
**Action:**
1. Enter phone: `9876543211`
2. Enter password: `User123`
3. Click "Login"

**Expected Result:**
- No error message
- Redirect to: **http://localhost:4201/user** dashboard

---

## 🔌 API Integration Details

### How It Works

```
1. User enters phone + password on login page
                ↓
2. Frontend validates (10 digits, not empty)
                ↓
3. If validation passes → POST to /api/auth/login
                ↓
4. Backend receives request
    ├─ Check if phone exists in MongoDB
    │   ├─ If NO → Return {error: "Phone number not registered.", code: "MEMBER_NOT_FOUND"}
    │   └─ If YES → Continue
    ├─ Check if password is set (passwordHash exists)
    │   ├─ If NO → Return {error: "Password not set for this account...", code: "PASSWORD_NOT_SET"}
    │   └─ If YES → Continue
    ├─ Compare submitted password with stored bcrypt hash
    │   ├─ If NO MATCH → Return {error: "Wrong password. Please try again.", code: "WRONG_PASSWORD"}
    │   └─ If MATCH → Continue
    └─ Generate JWT token → Return {success: true, member, token}
                ↓
5. Frontend receives response
    ├─ If success → Store token, navigate to dashboard
    └─ If error → Show error message with specific text
```

---

## 🧪 Manual API Testing (PowerShell)

### Test Wrong Password:
```powershell
$body = @{
    phone = "7339211768"
    password = "WrongPassword"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
  -Method Post `
  -Body $body `
  -ContentType "application/json" `
  -UseBasicParsing -Verbose
```

**Expected Response:**
```json
{
  "error": "Wrong password. Please try again.",
  "code": "WRONG_PASSWORD"
}
```
(HTTP Status: 401)

---

### Test Phone Not Found:
```powershell
$body = @{
    phone = "1111111111"
    password = "anything"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
  -Method Post `
  -Body $body `
  -ContentType "application/json" `
  -UseBasicParsing
```

**Expected Response:**
```json
{
  "error": "Phone number not registered.",
  "code": "MEMBER_NOT_FOUND"
}
```
(HTTP Status: 401)

---

### Test Correct Password:
```powershell
$body = @{
    phone = "7339211768"
    password = "Admin123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
  -Method Post `
  -Body $body `
  -ContentType "application/json" `
  -UseBasicParsing
```

**Expected Response:**
```json
{
  "success": true,
  "member": {
    "id": "691742ca118ce9a66410e5d9",
    "name": "Admin User",
    "phone": "7339211768",
    "isAdmin": true,
    "addedDate": "2025-11-14T..."
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
(HTTP Status: 200)

---

## 📁 Files Modified

| File | Changes |
|------|---------|
| `server/routes/auth.js` | ✅ Added error codes (WRONG_PASSWORD, MEMBER_NOT_FOUND, etc.) |
| `src/app/services/auth.service.ts` | ✅ Handle error codes and show specific messages |
| `src/app/components/login/login.component.ts` | ✅ Better error messages, network error handling |

---

## 🔐 Test User Credentials

| Type | Phone | Password |
|------|-------|----------|
| Admin | `7339211768` | `Admin123` |
| User | `9876543211` | `User123` |

---

## ✨ You're Ready to Test!

1. **Start Server:** `npm start` (in server folder)
2. **Start App:** `ng serve --port 4201` (in root folder)
3. **Open Browser:** http://localhost:4201
4. **Test Scenarios:** Follow the scenarios above

Everything is wired up and working! Try entering a wrong password and you should see the new error message. 🚀
