# Room Expense Management App

An Angular Progressive Web App (PWA) for managing shared room expenses with admin and user roles.

## Features

- **Admin Features:**
  - Add/remove members
  - Add/edit/delete expenses
  - View monthly summaries
  - Manage expense categories

- **User Features:**
  - View expenses and summaries
  - Add comments on expenses
  - View monthly breakdown

- **Authentication:**
  - Phone number-based admin authentication
  - First login sets as admin
  - Role-based access control

- **PWA Support:**
  - Offline capability
  - Installable on mobile devices
  - Service worker for caching

## Installation

1. Install dependencies:
```bash
npm install
```

2. Serve the application:
```bash
ng serve
```

3. Build for production:
```bash
ng build --configuration production
```

## Usage

1. First time: Login with a phone number (will be set as admin)
2. Admin: Can add members and expenses
3. Users: Can view expenses and add comments
4. All data is stored in browser localStorage

## Technologies

- Angular 17
- TypeScript
- LocalStorage
- PWA (Service Worker)
- Standalone Components

