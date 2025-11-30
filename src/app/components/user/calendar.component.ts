import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarService } from '../../services/calendar.service';
import { CategoryService } from '../../services/category.service';
import { AuthService } from '../../services/auth.service';
import { CommentEntry } from '../../models/comment-entry.model';
import { Category } from '../../models/category.model';
import { Location } from '@angular/common';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
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
    date: new Date().toISOString().split('T')[0]
  };
  
  // Comment management
  openComments: { [entryId: string]: boolean } = {};
  newComment: { [entryId: string]: string } = {};
  
  editingEntryId: string | null = null;
  isAddingEntry: boolean = false;
  isLoading: boolean = false;

  authService: AuthService;

  constructor(
    private location: Location,
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

  toggleComments(entryId: string): void {
    this.openComments[entryId] = !this.openComments[entryId];
    if (this.openComments[entryId]) {
      // Initialize comment text if needed
      if (!this.newComment[entryId]) {
        this.newComment[entryId] = '';
      }
      // Reload entry to get fresh comments from database
      this.calendarService.getEntryById(entryId).subscribe(entry => {
        if (entry) {
          const index = this.selectedDateEntries.findIndex(e => e.id === entryId);
          if (index !== -1) {
            this.selectedDateEntries[index].comments = entry.comments || [];
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

  getCommentsForEntry(entry: CommentEntry): any[] {
    return entry.comments || [];
  }

  cancelEdit(): void {
    this.isAddingEntry = false;
    this.editingEntryId = null;
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
  this.location.back();
}
}

