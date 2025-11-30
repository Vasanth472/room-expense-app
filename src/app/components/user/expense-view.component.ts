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
  selector: 'app-expense-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expense-view.component.html',
  styleUrls: ['./expense-view.component.css']
})
export class ExpenseViewComponent implements OnInit {
  expenses: Expense[] = [];
  categories: Category[] = [];
  filteredExpenses: Expense[] = [];
  selectedCategoryId: string = 'All';
  comments: Comment[] = [];
  expenseComments: { [expenseId: string]: Comment[] } = {};
  newComment: { [key: string]: string } = {};
  editingCommentId: string | null = null;
  showCommentSection: { [key: string]: boolean } = {};
  authService: AuthService;
  showDetailsModal: boolean = false;
  detailsEntry: CommentEntry | null = null;
  detailsMonthEntries: CommentEntry[] = [];
  detailsOpenComments: { [key: string]: boolean } = {};
  newDayComment: { [key: string]: string } = {};

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
    this.expenseService.getExpenses().subscribe({
      next: (expenses) => {
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
        // Build comments array
        this.comments = [];
        Object.values(this.expenseComments).forEach(comments => {
          this.comments.push(...comments);
        });
        this.filterExpenses();
      },
      error: (err) => {
        console.error('Failed to load expenses:', err);
        this.expenses = [];
        this.filteredExpenses = [];
      }
    });
  }

  loadComments(): void {
    // Comments are now loaded with expenses
    this.loadExpenses();
  }

  filterExpenses(): void {
    if (this.selectedCategoryId === 'All') {
      this.filteredExpenses = [...this.expenses].sort((a, b) => b.date.getTime() - a.date.getTime());
    } else {
      this.filteredExpenses = this.expenses
        .filter(e => e.categoryId === this.selectedCategoryId)
        .sort((a, b) => b.date.getTime() - a.date.getTime());
    }
  }

  onCategoryChange(): void {
    this.filterExpenses();
  }

  getCommentsForExpense(expenseId: string): Comment[] {
    return this.expenseComments[expenseId] || [];
  }

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

  goBack(): void {
    this.router.navigate(['/user']);
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

  getRemainingTime(comment: Comment): string {
    return this.commentService.getRemainingTime(comment);
  }

  isMyComment(comment: Comment): boolean {
    return comment.authorPhone === this.authService.getCurrentPhone();
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
      const d = entry.date ? new Date(entry.date) : new Date();
      this.calendarService.getEntriesByMonth(d.getFullYear(), d.getMonth()).subscribe(entries => {
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
  }

  toggleDayComments(entry: CommentEntry): void {
    const key = entry.id;
    if (this.detailsOpenComments[key]) {
      this.detailsOpenComments[key] = false;
      return;
    }
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
      this.calendarService.getEntryById(entryId).subscribe(fresh => {
        const idx = this.detailsMonthEntries.findIndex(e => e.id === entryId);
        if (idx >= 0) this.detailsMonthEntries[idx].comments = fresh?.comments || [];
        this.newDayComment[entryId] = '';
      });
    }, err => {
      console.error('Failed to add comment', err);
      alert('Failed to add comment');
    });
  }
}
