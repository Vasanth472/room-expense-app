import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { CommentEntry } from '../models/expense-entry.model';
import { CategoryService } from './category.service';

@Injectable({
  providedIn: 'root'
})
export class CommentEntryService {
  private readonly STORAGE_KEY = 'comment_entries';
  private readonly EDIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor(private categoryService: CategoryService) {}

  getEntries(): Observable<CommentEntry[]> {
    const entries = this.getStoredEntries();
    // Update canEdit/canDelete status based on timestamp
    const updatedEntries = entries.map(entry => this.updateEntryPermissions(entry));
    return of(updatedEntries).pipe(delay(200));
  }

  getEntriesByDate(date: Date): Observable<CommentEntry[]> {
    return new Observable(observer => {
      this.getEntries().subscribe(entries => {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        
        const filtered = entries.filter(entry => {
          const entryDate = new Date(entry.date);
          entryDate.setHours(0, 0, 0, 0);
          return entryDate.getTime() === targetDate.getTime();
        });
        
        // Sort by timestamp (newest first)
        filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        observer.next(filtered);
        observer.complete();
      });
    });
  }

  getEntriesByMonth(year: number, month: number): Observable<CommentEntry[]> {
    return new Observable(observer => {
      this.getEntries().subscribe(entries => {
        const filtered = entries.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate.getFullYear() === year && entryDate.getMonth() === month;
        });
        observer.next(filtered);
        observer.complete();
      });
    });
  }

  addEntry(entry: Omit<CommentEntry, 'id' | 'timestamp' | 'canEdit' | 'canDelete' | 'categoryName'>): Observable<CommentEntry> {
    return new Observable(observer => {
      // Get category name
      this.categoryService.getCategoryById(entry.categoryId).subscribe(category => {
        const newEntry: CommentEntry = {
          ...entry,
          id: this.generateId(),
          timestamp: new Date(),
          categoryName: category?.name || 'Unknown',
          canEdit: true,
          canDelete: true
        };

        const entries = this.getStoredEntries();
        entries.push(newEntry);
        this.saveEntries(entries);
        
        observer.next(newEntry);
        observer.complete();
      });
    });
  }

  updateEntry(id: string, updates: Partial<CommentEntry>): Observable<CommentEntry> {
    return new Observable(observer => {
      const entries = this.getStoredEntries();
      const index = entries.findIndex(e => e.id === id);
      
      if (index === -1) {
        observer.error('Entry not found');
        return;
      }

      const entry = entries[index];
      
      // Check if entry can still be edited
      if (!this.canEditEntry(entry)) {
        observer.error('Entry can no longer be edited (5-minute window expired)');
        return;
      }

      // Update category name if category changed
      if (updates.categoryId && updates.categoryId !== entry.categoryId) {
        this.categoryService.getCategoryById(updates.categoryId).subscribe(category => {
          entries[index] = {
            ...entry,
            ...updates,
            categoryName: category?.name || entry.categoryName,
            timestamp: new Date() // Update timestamp on edit
          };
          this.saveEntries(entries);
          observer.next(entries[index]);
          observer.complete();
        });
      } else {
        entries[index] = {
          ...entry,
          ...updates,
          timestamp: new Date() // Update timestamp on edit
        };
        this.saveEntries(entries);
        observer.next(entries[index]);
        observer.complete();
      }
    });
  }

  deleteEntry(id: string): Observable<boolean> {
    return new Observable(observer => {
      const entries = this.getStoredEntries();
      const entry = entries.find(e => e.id === id);
      
      if (!entry) {
        observer.error('Entry not found');
        return;
      }

      // Check if entry can still be deleted
      if (!this.canDeleteEntry(entry)) {
        observer.error('Entry can no longer be deleted (5-minute window expired)');
        return;
      }

      const filtered = entries.filter(e => e.id !== id);
      this.saveEntries(filtered);
      observer.next(true);
      observer.complete();
    });
  }

  canEditEntry(entry: CommentEntry): boolean {
    const now = new Date();
    const entryTime = new Date(entry.timestamp);
    const diff = now.getTime() - entryTime.getTime();
    return diff <= this.EDIT_WINDOW_MS;
  }

  canDeleteEntry(entry: CommentEntry): boolean {
    return this.canEditEntry(entry);
  }

  private updateEntryPermissions(entry: CommentEntry): CommentEntry {
    return {
      ...entry,
      canEdit: this.canEditEntry(entry),
      canDelete: this.canDeleteEntry(entry)
    };
  }

  private getStoredEntries(): CommentEntry[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return [];
    const entries = JSON.parse(data);
    return entries.map((e: any) => ({
      ...e,
      date: new Date(e.date),
      timestamp: new Date(e.timestamp)
    }));
  }

  private saveEntries(entries: CommentEntry[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

