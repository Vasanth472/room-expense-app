# Setup Guide

## Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- Angular CLI (will be installed with dependencies)

## Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Serve the Application**
   ```bash
   ng serve
   ```
   The application will be available at `http://localhost:4200`

3. **Build for Production**
   ```bash
   ng build --configuration production
   ```

## First Time Setup

1. **Admin Setup**
   - Open the application in your browser
   - Enter a phone number (must be at least 10 digits)
   - Check "Login as Admin" (this option will be available on first login)
   - Click "Login as Admin"
   - This phone number will be saved as the admin phone number

2. **Adding Members**
   - Login as admin
   - Click "Manage Members"
   - Add member names and phone numbers
   - You can edit or remove members as needed

3. **Adding Expenses**
   - Login as admin
   - Click "Manage Expenses"
   - Click "+ Add Expense"
   - Fill in:
     - Date
     - Category (Room rent, Rice, Vegetable, Current bill, Miscellaneous)
     - Amount
     - Description (Tamil supported)
   - Click "Add Expense"

4. **User Access**
   - Users can login with any phone number (except admin number)
   - Users can view expenses and add comments
   - Users cannot add or edit expenses

## Features

### Admin Features
- Add/Remove members
- Add/Edit/Delete expenses
- View monthly summaries
- View balance calculations

### User Features
- View monthly expenses
- View expense breakdown
- Add comments on expenses
- View monthly summary

## Data Storage

All data is stored in browser localStorage:
- Admin phone number
- Members list
- Expenses
- Comments

**Note:** Data is stored locally in the browser. Clearing browser data will delete all information.

## PWA Support

The application is a Progressive Web App (PWA):
- Can be installed on mobile devices
- Works offline (cached resources)
- Service worker enabled for production builds

## Troubleshooting

1. **Module not found errors**: Run `npm install` to install dependencies
2. **Routing issues**: Ensure Angular Router is properly configured
3. **LocalStorage issues**: Check browser console for errors
4. **PWA not working**: Build with production configuration

## Notes

- The application uses standalone components (Angular 17+)
- Tamil language is supported in descriptions and comments
- Monthly calculations assume a budget of ₹10,000 (can be modified in expense.service.ts)
- Per-person amount is calculated as: Total Expenses / Number of Members

