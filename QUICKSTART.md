# Quick Start: Server + MongoDB + Angular App

## ⚡ Quick Start (3 Minutes)

### Step 1: Start MongoDB

**Option A: Use MongoDB Atlas (Cloud - Easiest)**
1. Sign up at https://mongodb.com/cloud/atlas
2. Create a free M0 cluster
3. Create database user and copy connection string
4. Paste it into `server/.env` as `MONGODB_URI=...`

**Option B: Run MongoDB Locally**
```powershell
# Install from: https://www.mongodb.com/try/download/community
# Then start MongoDB:
mongod
# Leave this terminal open
```

### Step 2: Start Backend Server

Open PowerShell:
```powershell
cd 'C:\.ME\Angular\dummy trail\Room.12\server'
npm install
npm start
```

Expected output:
```
Connected to MongoDB
Server listening on port 3000
```

✅ Server ready at `http://localhost:3000`

### Step 3: Create Test Users (PowerShell)

```powershell
# Create admin user
$admin = @{
    name = "Admin User"
    phone = "7339211768"
    password = "AdminPass123"
    isAdmin = $true
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/members" `
  -Method Post -Body $admin -ContentType "application/json" -UseBasicParsing
```

```powershell
# Create regular user
$user = @{
    name = "John Doe"
    phone = "9876543211"
    password = "UserPass123"
    isAdmin = $false
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/members" `
  -Method Post -Body $user -ContentType "application/json" -UseBasicParsing
```

✅ Users created

### Step 4: Start Angular App

In a separate terminal:
```powershell
cd 'C:\.ME\Angular\dummy trail\Room.12'
ng serve
```

Open browser: http://localhost:4200

Login with:
- **Phone:** `7339211768`
- **Password:** `AdminPass123`

---

## 📖 Detailed Setup

See `server/SETUP.md` for full MongoDB, Node, and deployment instructions.

## Common Issues

### "Cannot find module" error
```powershell
cd 'C:\.ME\Angular\dummy trail\Room.12\server'
npm install
```

### MongoDB "Connection refused"
- Is `mongod` running? Check another terminal or MongoDB service

### "Invalid credentials" on login
- Verify phone/password match what you created
- Check user exists: `mongosh → use room_expense → db.members.find()`

### Angular can't reach server
- Ensure server runs on port 3000
- See `server/SETUP.md` for proxy config

## File Structure

```
server/
├── index.js              # Express app
├── package.json          # Dependencies
├── .env                  # Config (create from .env.example)
├── models/
│   └── Member.js         # MongoDB schema
├── routes/
│   ├── auth.js           # POST /api/auth/login
│   └── members.js        # GET/POST /api/members
└── SETUP.md              # Full setup guide
```

## Next Steps

1. ✅ Server + users created
2. ✅ Angular app logging in
3. 🔄 **Next:** Add HTTP interceptor to attach JWT token to API requests (I can do this)
4. 🔄 **Next:** Admin UI to manage users/passwords (I can do this)
5. 🔄 **Next:** Deploy to production (I can guide)
2. Verify all dependencies are installed
3. Clear browser cache

### Issue: Cannot login
**Solution**: 
1. Make sure phone number is at least 10 digits
2. For admin login, use the phone number you used for first-time setup
3. Clear localStorage if needed (F12 > Application > Local Storage > Clear)

## Testing the App

1. **Login as Admin**:
   - Use the phone number you set up initially
   - Check "Login as Admin"

2. **Add a Member**:
   - Go to "Manage Members"
   - Add a test member

3. **Add an Expense**:
   - Go to "Manage Expenses"
   - Add a test expense

4. **Login as User**:
   - Logout
   - Login with a different phone number (don't check admin)
   - View expenses and add comments

## Data Storage

All data is stored in browser localStorage:
- **Location**: Browser DevTools > Application > Local Storage
- **Warning**: Clearing browser data will delete all information
- **Backup**: Export data if needed (feature can be added)

## Node.js Version

**Current**: Node.js v23.9.0 (unsupported)
**Recommended**: Node.js 18.x or 20.x (LTS versions)

Angular 17 works best with Node.js 18 or 20. Consider downgrading if you encounter issues.

## Next Steps

1. Test all features
2. Add more members
3. Add expenses for the current month
4. View monthly summary
5. Test user access and comments

## Need Help?

Check the `TROUBLESHOOTING.md` file for detailed solutions to common problems.

