# Expense and Comment Features Update

## Overview
Updated the application to support dynamic categories, expense management with comments, and 5-minute edit window for comments.

## Admin Features

### 1. View All User Pages, Comments, and Expenses
- Admin can view all expenses from all users
- Admin can view all comments with user names and phone numbers
- Admin can see comprehensive expense and comment data

### 2. Category Management
- **Add Categories**: Admin can add new categories (e.g., Gas, Rice, Vegetables, Water, etc.)
- **Update Categories**: Admin can edit existing categories
- **Delete Categories**: Admin can remove categories
- **Color Coding**: Each category has a color for visual identification
- **Storage**: Categories stored in localStorage
- **Route**: `/admin/categories`

### 3. Expense Management
- **Add Expense**: 
  - Category (dropdown from managed categories)
  - Amount
  - Date
  - Description/Note
- **Update Expense**: Edit any expense field
- **Delete Expense**: Remove expenses (deletes associated comments)
- **Filter by Category**: Filter expenses by selected category
- **Filter by Date Range**: Filter expenses by start and end date
- **View All Comments**: See all comments for each expense with user info
- **Route**: `/admin/expenses`

### 4. Expense Filtering
- Filter by category (dropdown)
- Filter by date range (start date and end date)
- Clear filters option
- Summary shows total expenses, total amount, and total comments

## User Features

### 1. View Expenses
- Users can view all expenses
- Expenses show category and date
- Filter expenses by category
- See expense descriptions/notes

### 2. Add Comments
- Users can add comments related to expenses
- Comments show user's name and mobile number
- Comments are associated with specific expenses
- Multiple users can comment on the same expense

### 3. Edit/Delete Comments (5-Minute Window)
- Users can edit their own comments within 5 minutes of posting
- Users can delete their own comments within 5 minutes of posting
- After 5 minutes, comments become locked (read-only)
- Time remaining displayed for editable comments
- Only comment owner can edit/delete their comments

### 4. Filter Expenses by Category
- Users can filter expenses by category
- See related comments for filtered expenses
- Comments remain visible when filtering

## Data Models

### Updated Expense Model
```typescript
interface Expense {
  id: string;
  date: Date;
  categoryId: string;        // Dynamic category ID
  categoryName: string;      // Category name for display
  amount: number;
  description: string;
  addedBy: string;
  addedDate: Date;
}
```

### Updated Comment Model
```typescript
interface Comment {
  id: string;
  expenseId: string;
  text: string;
  author: string;            // Legacy field
  authorName: string;        // User's name
  authorPhone: string;       // User's phone number
  timestamp: Date;           // Comment creation time
  date: Date;                // Comment date
  canEdit: boolean;          // Can edit (within 5 minutes)
  canDelete: boolean;        // Can delete (within 5 minutes)
}
```

## Services

### Updated ExpenseService
- Works with dynamic categories from CategoryService
- Filter expenses by category and date range
- Automatically updates category names when categories change
- Supports date range filtering

### Updated CommentService
- Implements 5-minute edit/delete window
- Tracks comment timestamps
- Updates edit/delete permissions based on time
- Shows remaining time for editable comments
- Filters comments by expense ID

## Key Features

### 5-Minute Edit Window
- Comments can be edited/deleted within 5 minutes of creation
- Timestamp is updated when comment is edited
- After 5 minutes, comments become locked (read-only)
- Only the comment owner can edit/delete
- Time remaining is displayed for editable comments
- Locked comments show "Locked" badge

### Dynamic Categories
- Categories are managed by admin
- Categories can be added, edited, and deleted
- Each category has a name and color
- Categories are used for expenses and filtering
- Default categories: Work, Personal, Events (can be changed)

### Expense Filtering
- Filter by category (dropdown)
- Filter by date range (start and end date)
- Combined filtering (category + date range)
- Clear filters option
- Summary statistics

### Comment Display
- Shows user's name and phone number
- Shows comment timestamp
- Shows time remaining for editable comments
- Shows locked status for read-only comments
- Groups comments by expense

## Routes

- `/admin/categories` - Category management (admin only)
- `/admin/expenses` - Expense management with filtering (admin only)
- `/admin/expenses/add` - Add/Edit expense (admin only)
- `/user/expenses` - View expenses and add comments (users)

## Testing

### Admin Testing
1. Login as admin: `7339211768`
2. Go to "Manage Categories"
3. Add categories: Gas, Rice, Vegetables, Water
4. Go to "Manage Expenses"
5. Add expenses with different categories
6. Filter expenses by category
7. Filter expenses by date range
8. View comments for expenses
9. Edit/Delete expenses

### User Testing
1. Login as user: `9876543211` or `9876543212`
2. Go to "View All Expenses"
3. Filter expenses by category
4. Add a comment on an expense
5. Edit the comment within 5 minutes
6. Try to edit after 5 minutes (should be locked)
7. Delete the comment within 5 minutes
8. View comments from other users

## Notes

- All data is stored in localStorage
- Categories are shared across all users
- Expenses are visible to all authenticated users
- Comments are visible to all users but only editable by owner
- 5-minute window is calculated from comment timestamp
- Comments are automatically locked after 5 minutes
- When an expense is deleted, associated comments are also deleted
- Category names are automatically updated when categories change

