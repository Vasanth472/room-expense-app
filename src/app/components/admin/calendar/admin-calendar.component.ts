import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarService } from '../../../services/calendar.service';
import { CategoryService } from '../../../services/category.service';
import { AuthService } from '../../../services/auth.service';
import { ExpenseEntry} from '../../../models/expense-entry.model';
import { CommentEntry } from '../../../models/comment-entry.model';
import { Category } from '../../../models/category.model';

@Component({
  selector: 'app-admin-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-calendar.component.html',
  styleUrls: ['./admin-calendar.component.css']
})
export class AdminCalendarComponent implements OnInit {
  currentDate: Date = new Date();
  selectedDate: Date = new Date();
  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  
  calendarDays: Date[] = [];
  entries: CommentEntry[] = [];
  selectedDateEntries: CommentEntry[] = [];
  
  categories: Category[] = [];
  newEntry = {
    text: '',
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
    price: 0
  };
  
  editingEntryId: string | null = null;
  isAddingEntry: boolean = false;
  isLoading: boolean = false;
  
  // Comment management
  openComments: { [entryId: string]: boolean } = {};
  newComment: { [entryId: string]: string } = {};
  replyText: { [entryId: string]: { [commentId: string]: string } } = {};

  authService: AuthService;

  constructor(
    authService: AuthService,
    private calendarService: CalendarService,
    private categoryService: CategoryService,
    private router: Router
  ) {
    this.authService = authService;
  }

  ngOnInit(): void {
    this.loadCategories();
    this.generateCalendar();
    this.loadEntries();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe(categories => {
      this.categories = categories;
      if (categories.length > 0 && !this.newEntry.categoryId) {
        this.newEntry.categoryId = categories[0].id;
      }
    });
  }

  generateCalendar(): void {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday
    
    this.calendarDays = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      this.calendarDays.push(date);
    }
  }

  loadEntries(): void {
    this.isLoading = true;
    this.calendarService.getEntriesByMonth(this.currentYear, this.currentMonth).subscribe({
      next: (entries) => {
        this.entries = entries;
        this.updateSelectedDateEntries();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading entries:', error);
        this.isLoading = false;
      }
    });
  }

  updateSelectedDateEntries(): void {
    const targetDate = new Date(this.selectedDate);
    targetDate.setHours(0, 0, 0, 0);
    
    this.selectedDateEntries = this.entries.filter(entry => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === targetDate.getTime();
    });
  }

  selectDate(date: Date): void {
    this.selectedDate = new Date(date);
    this.updateSelectedDateEntries();
    this.newEntry.date = this.selectedDate.toISOString().split('T')[0];
    this.isAddingEntry = false;
    this.editingEntryId = null;
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  isSelectedDate(date: Date): boolean {
    return date.getDate() === this.selectedDate.getDate() &&
           date.getMonth() === this.selectedDate.getMonth() &&
           date.getFullYear() === this.selectedDate.getFullYear();
  }

  isCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.currentMonth;
  }

  getEntriesForDate(date: Date): number {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    return this.entries.filter(entry => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === targetDate.getTime();
    }).length;
  }

  previousMonth(): void {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.generateCalendar();
    this.loadEntries();
  }

  nextMonth(): void {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.generateCalendar();
    this.loadEntries();
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.currentMonth = this.currentDate.getMonth();
    this.currentYear = this.currentDate.getFullYear();
    this.selectedDate = new Date();
    this.generateCalendar();
    this.loadEntries();
  }

  getMonthName(): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[this.currentMonth];
  }

  getDayNames(): string[] {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  }

  addEntry(): void {
    if (!this.newEntry.text.trim() || !this.newEntry.categoryId) {
      alert('Please fill in all fields');
      return;
    }

    const currentMember = this.authService.getCurrentMember();
    if (!currentMember) {
      alert('User information not found');
      return;
    }

    this.isLoading = true;
    // Get category name for the entry
    const category = this.categories.find(c => c.id === this.newEntry.categoryId);
    this.calendarService.addEntry({
      date: new Date(this.newEntry.date),
      categoryId: this.newEntry.categoryId,
      text: this.newEntry.text.trim(),
      userId: currentMember.id,
      userPhone: currentMember.phone,
      userName: currentMember.name,
      price: (this.newEntry as any).price || 0,
      categoryName: category?.name || ''
    }).subscribe({
      next: () => {
        this.newEntry = {
          text: '',
          categoryId: this.categories.length > 0 ? this.categories[0].id : '',
          date: this.selectedDate.toISOString().split('T')[0],
          price: 0
        };
        this.isAddingEntry = false;
        this.loadEntries();
      },
      error: (error) => {
        console.error('Error adding entry:', error);
        alert('Error adding entry. Please try again.');
        this.isLoading = false;
      }
    });
  }

  editEntry(entry: CommentEntry): void {
    if (!entry.canEdit) {
      alert('This entry can no longer be edited (5-minute window expired)');
      return;
    }

    this.editingEntryId = entry.id;
    this.newEntry = {
      text: entry.text,
      categoryId: entry.categoryId,
      date: new Date(entry.date).toISOString().split('T')[0],
      price: (entry as any).price || 0
    };
    this.isAddingEntry = true;
  }

  updateEntry(): void {
    if (!this.editingEntryId) return;

    if (!this.newEntry.text.trim() || !this.newEntry.categoryId) {
      alert('Please fill in all fields');
      return;
    }

    this.isLoading = true;
    this.calendarService.updateEntry(this.editingEntryId, {
      description: this.newEntry.text.trim(),
      categoryId: this.newEntry.categoryId,
      price: (this.newEntry as any).price
    }).subscribe({
      next: () => {
        this.newEntry = {
          text: '',
          categoryId: this.categories.length > 0 ? this.categories[0].id : '',
          date: this.selectedDate.toISOString().split('T')[0],
          price: 0
        };
        this.editingEntryId = null;
        this.isAddingEntry = false;
        this.loadEntries();
      },
      error: (error) => {
        alert(error.message || 'Error updating entry. Please try again.');
        this.isLoading = false;
      }
    });
  }

  deleteEntry(id: string): void {
    const entry = this.selectedDateEntries.find(e => e.id === id);
    if (entry && !entry.canDelete) {
      alert('This entry can no longer be deleted (5-minute window expired)');
      return;
    }

    if (confirm('Are you sure you want to delete this entry?')) {
      this.isLoading = true;
      this.calendarService.deleteEntry(id).subscribe({
        next: () => {
          this.loadEntries();
        },
        error: (error) => {
          alert(error.message || 'Error deleting entry. Please try again.');
          this.isLoading = false;
        }
      });
    }
  }

  openAddEntryForm(): void {
    this.isAddingEntry = true;
    this.editingEntryId = null;
    this.newEntry = {
      text: '',
      categoryId: this.categories.length > 0 ? this.categories[0].id : '',
      date: this.selectedDate.toISOString().split('T')[0],
      price: 0
    };
  }

  cancelEdit(): void {
    this.isAddingEntry = false;
    this.editingEntryId = null;
    this.newEntry = {
      text: '',
      categoryId: this.categories.length > 0 ? this.categories[0].id : '',
      date: this.selectedDate.toISOString().split('T')[0],
      price: 0
    };
  }

  getCategoryColor(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.color || '#999';
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  }

  getRemainingTime(entry: CommentEntry): string {
    if (!entry.canEdit) return 'Read-only';
    
    const now = new Date();
    const entryTime = new Date(entry.timestamp);
    const diff = now.getTime() - entryTime.getTime();
    const remaining = (5 * 60 * 1000) - diff;
    
    if (remaining <= 0) return 'Read-only';
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
  }

  goBack(): void {
    this.router.navigate(['/admin']);
  }

  // Comment management methods
  toggleComments(entryId: string): void {
    this.openComments[entryId] = !this.openComments[entryId];
    if (this.openComments[entryId]) {
      // Initialize reply text object if needed
      if (!this.replyText[entryId]) {
        this.replyText[entryId] = {};
      }
      // Reload entry to get fresh comments
      this.calendarService.getEntryById(entryId).subscribe(entry => {
        if (entry) {
          const index = this.selectedDateEntries.findIndex(e => e.id === entryId);
          if (index !== -1) {
            this.selectedDateEntries[index].comments = entry.comments || [];
            // Initialize reply text for each comment
            if (entry.comments) {
              entry.comments.forEach((comment: any) => {
                if (!this.replyText[entryId][comment.id]) {
                  this.replyText[entryId][comment.id] = '';
                }
              });
            }
          }
        }
      });
    }
  }

  addComment(entryId: string): void {
    const text = this.newComment[entryId]?.trim();
    if (!text) {
      alert('Please enter a comment');
      return;
    }

    this.isLoading = true;
    this.calendarService.addComment(entryId, text).subscribe({
      next: () => {
        this.newComment[entryId] = '';
        this.loadEntries();
      },
      error: (error) => {
        console.error('Error adding comment:', error);
        alert('Error adding comment. Please try again.');
        this.isLoading = false;
      }
    });
  }

  replyToComment(entryId: string, commentId: string): void {
    const text = this.replyText[entryId]?.[commentId]?.trim();
    if (!text) {
      alert('Please enter a reply');
      return;
    }

    this.isLoading = true;
    this.calendarService.replyToComment(entryId, commentId, text).subscribe({
      next: () => {
        if (!this.replyText[entryId]) {
          this.replyText[entryId] = {};
        }
        this.replyText[entryId][commentId] = '';
        this.loadEntries();
      },
      error: (error) => {
        console.error('Error replying to comment:', error);
        alert('Error replying to comment. Please try again.');
        this.isLoading = false;
      }
    });
  }

  getCommentsForEntry(entry: CommentEntry): any[] {
    return entry.comments || [];
  }

  deleteComment(entryId: string, commentId: string): void {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    this.isLoading = true;
    this.calendarService.deleteComment(entryId, commentId).subscribe({
      next: () => {
        this.loadEntries();
      },
      error: (error) => {
        console.error('Error deleting comment:', error);
        alert('Error deleting comment. Please try again.');
        this.isLoading = false;
      }
    });
  }
}
