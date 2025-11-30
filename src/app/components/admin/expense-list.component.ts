import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseService } from '../../services/expense.service';
import { CommentService } from '../../services/comment.service';
import { CategoryService } from '../../services/category.service';
import { CalendarService } from '../../services/calendar.service';
import { AuthService } from '../../services/auth.service';
import { Expense } from '../../models/expense.model';
import { Comment } from '../../models/comment.model';
import { Category } from '../../models/category.model';
import { CommentEntry } from '../../models/comment-entry.model';
import { CategoryIconUtil } from '../../utils/category-icons.util';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expense-list.component.html',
  styleUrls: ['./expense-list.component.css']
})
export class ExpenseListComponent implements OnInit {
  expenses: Expense[] = [];
  allComments: Comment[] = [];
  categories: Category[] = [];
  filteredExpenses: Expense[] = [];
  selectedCategoryId: string = 'All';
  startDate: string = '';
  endDate: string = '';
  // Quick add expense form state
  quickExpense: { categoryId?: string; amount?: number; description?: string; date?: string } = {};
  showComments: boolean = false;
  selectedExpenseForComments: string | null = null;
  // Comment UI state (added to match template expectations)
  newComment: { [key: string]: string } = {};
  editingCommentId: string | null = null;
  showCommentSection: { [key: string]: boolean } = {};
  expenseComments: { [expenseId: string]: Comment[] } = {};
  authService: AuthService;
  // Show details modal state
  showDetailsModal: boolean = false;
  detailsEntry: CommentEntry | null = null;
  // Month entries shown in modal (day-by-day)
  detailsMonthEntries: CommentEntry[] = [];
  // Admin add/edit form state
  isAddingDayEntry: boolean = false;
  newDayEntry: { date?: string; text?: string; price?: number; categoryId?: string } = {};
  // comments open state for day entries
  detailsOpenComments: { [key: string]: boolean } = {};
  newDayComment: { [key: string]: string } = {};
  replyText: { [entryId: string]: { [commentId: string]: string } } = {};

  constructor(
    authService: AuthService,
    private expenseService: ExpenseService,
    private commentService: CommentService,
    private categoryService: CategoryService,
    private calendarService: CalendarService,
    private router: Router
  ) {
    this.authService = authService;
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadExpenses();
    this.loadComments();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe(categories => {
      this.categories = categories;
    });
  }

  loadExpenses(): void {
    this.expenseService.getExpenses().subscribe(expenses => {
      this.expenses = expenses;
      // Extract comments from expenses and store them
      this.expenseComments = {};
      expenses.forEach(expense => {
        if ((expense as any).comments && (expense as any).comments.length > 0) {
          this.expenseComments[expense.id] = (expense as any).comments.map((c: any) => ({
            id: c.id,
            expenseId: expense.id,
            text: c.text,
            author: c.authorPhone || '',
            authorName: c.authorName || 'User',
            authorPhone: c.authorPhone || '',
            timestamp: c.timestamp ? new Date(c.timestamp) : (c.date ? new Date(c.date) : new Date()),
            date: c.timestamp ? new Date(c.timestamp) : (c.date ? new Date(c.date) : new Date()),
            canEdit: this.commentService.canEditCommentByTimestamp(c.timestamp ? new Date(c.timestamp) : (c.date ? new Date(c.date) : new Date())),
            canDelete: this.commentService.canDeleteCommentByTimestamp(c.timestamp ? new Date(c.timestamp) : (c.date ? new Date(c.date) : new Date()))
          }));
        }
      });
      // Build allComments array
      this.allComments = [];
      Object.values(this.expenseComments).forEach(comments => {
        this.allComments.push(...comments);
      });
      this.applyFilters();
    });
  }

  loadComments(): void {
    // Comments are now loaded with expenses
    this.loadExpenses();
  }

  applyFilters(): void {
    const filters: any = {};

    if (this.selectedCategoryId && this.selectedCategoryId !== 'All') {
      filters.categoryId = this.selectedCategoryId;
    }

    if (this.startDate && this.endDate) {
      filters.startDate = new Date(this.startDate);
      filters.endDate = new Date(this.endDate);
    }

    this.expenseService.filterExpenses(filters).subscribe(filtered => {
      this.filteredExpenses = filtered;
    });
  }

  onCategoryChange(): void {
    this.applyFilters();
  }

  onDateRangeChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.selectedCategoryId = 'All';
    this.startDate = '';
    this.endDate = '';
    this.applyFilters();
  }

  addExpense(): void {
    this.router.navigate(['/admin/expenses/add']);
  }

  // Quick create expense directly (stores in MongoDB via API)
  saveQuickExpense(): void {
    if (!this.quickExpense.categoryId) {
      alert('Please select a category');
      return;
    }
    if (!this.quickExpense.amount || this.quickExpense.amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    const current = this.authService.getCurrentMember();
    const payload = {
      amount: this.quickExpense.amount,
      description: this.quickExpense.description || '',
      date: this.quickExpense.date ? new Date(this.quickExpense.date).toISOString() : new Date().toISOString(),
      categoryId: this.quickExpense.categoryId,
      addedBy: current?.phone || current?.name || ''
    } as any;

    this.expenseService.addExpense(payload).subscribe({
      next: (res) => {
        alert('Expense added');
        this.quickExpense = {};
        this.loadExpenses();
      },
      error: (err) => {
        console.error('Failed to add expense:', err);
        alert('Failed to add expense');
      }
    });
  }

  editExpense(expense: Expense): void {
    this.router.navigate(['/admin/expenses/add'], { queryParams: { id: expense.id } });
  }

  deleteExpense(id: string): void {
    if (confirm('Are you sure you want to delete this expense? All associated comments will also be deleted.')) {
      // Comments are automatically deleted when expense is deleted (stored in same MongoDB document)
      this.expenseService.deleteExpense(id).subscribe(success => {
        if (success) {
          this.loadExpenses(); // This will reload comments too
        } else {
          alert('Failed to delete expense');
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/admin']);
  }

  formatCurrency(amount: number): string {
    return '₹' + amount.toFixed(2);
  }

  getCategoryColor(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.color || '#999';
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  }

  getCategoryIcon(category: Category | null | undefined): string {
    return CategoryIconUtil.getCategoryIcon(category);
  }

  isEmojiIcon(icon: string): boolean {
    return CategoryIconUtil.isEmoji(icon);
  }

  isDropdownOpen: boolean = false;

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown')) {
      this.isDropdownOpen = false;
    }
  }

  selectCategory(categoryId: string): void {
    this.selectedCategoryId = categoryId;
    this.isDropdownOpen = false;
    this.onCategoryChange();
  }

  getSelectedCategory(): Category | null {
    if (this.selectedCategoryId === 'All') return null;
    return this.categories.find(c => c.id === this.selectedCategoryId) || null;
  }

  getCommentsForExpense(expenseId: string): Comment[] {
    return this.expenseComments[expenseId] || [];
  }

  // keep the existing toggle for admin list view grouping
  toggleComments(expenseId: string): void {
    if (this.selectedExpenseForComments === expenseId) {
      this.selectedExpenseForComments = null;
    } else {
      this.selectedExpenseForComments = expenseId;
    }
  }

  // Template expects toggleCommentSection/showCommentSection (from user view)
  toggleCommentSection(expenseId: string): void {
    this.showCommentSection[expenseId] = !this.showCommentSection[expenseId];
    if (!this.newComment[expenseId]) {
      this.newComment[expenseId] = '';
    }
    this.editingCommentId = null;
  }

  addComment(expenseId: string): void {
    const text = this.newComment[expenseId]?.trim();
    if (!text) {
      alert('Please enter a comment');
      return;
    }

    this.commentService.addComment(expenseId, text).subscribe({
      next: (comment) => {
        this.newComment[expenseId] = '';
        this.loadExpenses(); // Reload to get updated comments
      },
      error: (error) => {
        console.error('Error adding comment:', error);
        alert(error.message || 'Error adding comment');
      }
    });
  }

  editComment(comment: Comment): void {
    if (!comment.canEdit) {
      alert('This comment can no longer be edited (5-minute window expired)');
      return;
    }

    this.editingCommentId = comment.id;
    this.newComment[comment.expenseId] = comment.text;
    this.showCommentSection[comment.expenseId] = true;
  }

  updateComment(expenseId: string): void {
    if (!this.editingCommentId) return;

    const text = this.newComment[expenseId]?.trim();
    if (!text) {
      alert('Please enter a comment');
      return;
    }

    this.commentService.updateComment(expenseId, this.editingCommentId, text).subscribe({
      next: () => {
        this.newComment[expenseId] = '';
        this.editingCommentId = null;
        this.loadExpenses(); // Reload to get updated comments
      },
      error: (error) => {
        console.error('Error updating comment:', error);
        alert(error.error?.error || error.message || 'Error updating comment');
      }
    });
  }

  deleteComment(id: string, expenseId: string): void {
    this.commentService.deleteComment(expenseId, id).subscribe({
      next: () => {
        this.loadExpenses(); // Reload to get updated comments
        if (this.editingCommentId === id) {
          this.editingCommentId = null;
          this.newComment[expenseId] = '';
        }
      },
      error: (error) => {
        console.error('Error deleting comment:', error);
        alert(error.error?.error || error.message || 'Error deleting comment');
      }
    });
  }

  cancelEdit(expenseId: string): void {
    this.editingCommentId = null;
    this.newComment[expenseId] = '';
  }

  getRemainingTime(comment: Comment): string {
    return this.commentService.getRemainingTime(comment);
  }

  isMyComment(comment: Comment): boolean {
    return comment.authorPhone === this.authService.getCurrentPhone();
  }

  getAllCommentsCount(): number {
    return this.allComments.length;
  }

  getTotalAmount(): number {
    return this.filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }

  showDetails(expense: Expense): void {
    const id = (expense as any).calendarEntryId;
    if (!id) {
      alert('No linked calendar details for this expense.');
      return;
    }

    this.calendarService.getEntryById(id).subscribe(entry => {
      if (!entry) {
        alert('Calendar entry not found');
        return;
      }
      this.detailsEntry = entry;
      // fetch all entries for that month
      const d = entry.date ? new Date(entry.date) : new Date();
      const y = d.getFullYear();
      const m = d.getMonth();
      this.calendarService.getEntriesByMonth(y, m).subscribe(entries => {
        // optionally filter entries to same category to focus on related items
        this.detailsMonthEntries = entries.filter(e => e.categoryId === entry.categoryId)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        this.showDetailsModal = true;
      });
    });
  }

  closeDetails(): void {
    this.showDetailsModal = false;
    this.detailsEntry = null;
    this.detailsMonthEntries = [];
    this.isAddingDayEntry = false;
    this.newDayEntry = {};
  }

  // Admin: add a day entry for this month
  addDayEntry(): void {
    if (!this.detailsEntry) return;
    if (!this.newDayEntry.date || !this.newDayEntry.text) {
      alert('Please provide date and text for the entry');
      return;
    }
    const payload: any = {
      date: new Date(this.newDayEntry.date).toISOString(),
      categoryId: this.newDayEntry.categoryId || this.detailsEntry.categoryId,
      description: this.newDayEntry.text,
      price: this.newDayEntry.price || 0
    };
    this.calendarService.addEntry(payload).subscribe(res => {
      // refresh month entries
      const d = this.detailsEntry ? new Date(this.detailsEntry.date) : new Date();
      this.calendarService.getEntriesByMonth(d.getFullYear(), d.getMonth()).subscribe(entries => {
        this.detailsMonthEntries = entries.filter(e => e.categoryId === this.detailsEntry!.categoryId);
        this.isAddingDayEntry = false;
        this.newDayEntry = {};
      });
    }, err => {
      console.error('Failed to add day entry', err);
      alert('Failed to add entry');
    });
  }

  toggleDayComments(entry: CommentEntry): void {
    const key = entry.id;
    if (this.detailsOpenComments[key]) {
      this.detailsOpenComments[key] = false;
      return;
    }
    // load fresh comments for this entry
    this.calendarService.getEntryById(entry.id).subscribe(fresh => {
      if (fresh) {
        const idx = this.detailsMonthEntries.findIndex(e => e.id === entry.id);
        if (idx >= 0) this.detailsMonthEntries[idx].comments = fresh.comments || [];
        this.detailsOpenComments[key] = true;
      } else {
        alert('Failed to load entry comments');
      }
    });
  }

  addDayComment(entryId: string, text: string): void {
    if (!text || !text.trim()) return;
    this.calendarService.addComment(entryId, text.trim()).subscribe(() => {
      // refresh that entry's comments
      this.calendarService.getEntryById(entryId).subscribe(fresh => {
        const idx = this.detailsMonthEntries.findIndex(e => e.id === entryId);
        if (idx >= 0) this.detailsMonthEntries[idx].comments = fresh?.comments || [];
      });
    }, err => {
      console.error('Failed to add comment', err);
      alert('Failed to add comment');
    });
  }

  replyToDayComment(entryId: string, commentId: string, text: string): void {
    if (!text || !text.trim()) return;
    this.calendarService.replyToComment(entryId, commentId, text.trim()).subscribe(() => {
      this.calendarService.getEntryById(entryId).subscribe(fresh => {
        const idx = this.detailsMonthEntries.findIndex(e => e.id === entryId);
        if (idx >= 0) this.detailsMonthEntries[idx].comments = fresh?.comments || [];
      });
    }, err => {
      console.error('Failed to reply', err);
      alert('Failed to reply to comment');
    });
  }

  editDayEntry(entry: CommentEntry): void {
    const text = prompt('Edit entry text', entry.text || '');
    if (text === null) return;
    this.calendarService.updateEntry(entry.id, { description: text }).subscribe(updated => {
      // update local copy; updateEntry returns a CommentEntry
      const idx = this.detailsMonthEntries.findIndex(e => e.id === entry.id);
      if (idx >= 0 && updated) this.detailsMonthEntries[idx] = updated as CommentEntry;
    }, err => {
      console.error('Failed to update entry', err);
      alert('Failed to update');
    });
  }

  deleteDayEntry(entryId: string): void {
    if (!confirm('Delete this day entry?')) return;
    this.calendarService.deleteEntry(entryId).subscribe(() => {
      this.detailsMonthEntries = this.detailsMonthEntries.filter(e => e.id !== entryId);
    }, err => {
      console.error('Failed to delete entry', err);
      alert('Failed to delete');
    });
  }
}
