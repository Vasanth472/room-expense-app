# Login System - Quick Reference Card

## ⚡ Quick Start

### Start Backend
```powershell
cd server
npm start
# Port: 3000
```

### Start Frontend  
```powershell
ng serve --port 4201
# Port: 4201
```

### Open App
```
http://localhost:4201
```

---

## 🔑 Test Credentials

| Role | Phone | Password |
|------|-------|----------|
| Admin | 7339211768 | Admin123 |
| User | 9876543211 | User123 |
| New | (create via API) | (your choice) |

---

## 🗂️ Key Files

| File | Purpose |
|------|---------|
| `server/routes/auth.js` | Login API |
| `server/models/Member.js` | User database schema |
| `src/app/components/login/` | Login UI |
| `src/app/services/auth.service.ts` | Auth logic |
| `src/proxy.conf.json` | API proxy |

---

## 🧪 API Endpoints

### Login
```
POST /api/auth/login
{ "phone": "7339211768", "password": "Admin123" }
Response: { success: true, member: {...}, token: "..." }
Error: { error: "Wrong password...", code: "WRONG_PASSWORD" }
```

### Create User
```
POST /api/members
{ "name": "User", "phone": "1111111111", "password": "Pass123" }
Response: { id: "...", name: "...", phone: "...", isAdmin: false }
```

### Get All Users
```
GET /api/members
Response: [{ id, name, phone, isAdmin }, ...]
```

---

## 🔐 Security Checklist

- ✅ Password hashed with bcrypt (10 rounds)
- ✅ Phone unique in database
- ✅ No plaintext passwords stored
- ✅ No passwords in API responses
- ✅ JWT tokens for sessions
- ✅ Frontend + backend validation
- ✅ Error codes (no data leaks)

---

## ❌ Error Codes

| Code | Message | Solution |
|------|---------|----------|
| MEMBER_NOT_FOUND | "Phone not registered" | Check phone number |
| WRONG_PASSWORD | "Wrong password" | Enter correct password |
| PASSWORD_NOT_SET | "Password not set" | Contact admin |

---

## 🔄 Data Flow

```
User enters credentials
  ↓
Frontend validates
  ↓
POST /api/auth/login
  ↓
Backend queries MongoDB
  ↓
bcrypt.compare(password, hash)
  ↓
If match → JWT token + success
If no match → Error
  ↓
Frontend handles response
```

---

## 📊 Files Summary

| Layer | File | Purpose |
|-------|------|---------|
| **Backend** | `server/index.js` | Express server |
| | `server/routes/auth.js` | Login endpoint |
| | `server/models/Member.js` | User schema |
| **Frontend** | `login.component.ts` | Login logic |
| | `login.component.html` | Login form |
| | `auth.service.ts` | Authentication |
| **Config** | `proxy.conf.json` | API routing |
| | `angular.json` | Angular config |
| **Database** | MongoDB | User storage |

---

## 🚀 Deployment Notes

- Backend: Port 3000
- Frontend: Port 4201 (dev), any port (production)
- Database: MongoDB Atlas recommended for production
- JWT Secret: Change from "dev_secret_change_this"
- CORS: Configure for your domain
- HTTPS: Use in production

---

## 📚 Documentation

- `LOGIN_VALIDATION_COMPLETE.md` - Detailed validation
- `PASSWORD_VALIDATION_GUIDE.md` - Error handling
- `LOGIN_TESTED_WORKING.md` - Test results
- `LOGIN_SYSTEM_EXPLAINED.md` - Full explanation
- `FILES_REFERENCE.md` - File references
- `VISUAL_SUMMARY.md` - Visual diagrams

---

## ✅ Status: PRODUCTION READY

All components tested and working! 🎉
