import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CommentEntry } from '../models/comment-entry.model';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  constructor(private http: HttpClient) {}

  private mapServerToCommentEntry(obj: any): CommentEntry {
    const mapped: any = {
      id: obj.id || obj._id?.toString(),
      date: obj.date ? new Date(obj.date) : new Date(),
      categoryId: obj.categoryId || '',
      categoryName: obj.categoryName || '',
      text: obj.description || obj.title || '',
      userId: obj.createdBy || '',
      userPhone: (obj.createdBy && obj.createdBy.phone) ? obj.createdBy.phone : '',
      userName: (obj.createdBy && obj.createdBy.name) ? obj.createdBy.name : (obj.createdBy || ''),
      timestamp: obj.addedDate ? new Date(obj.addedDate) : new Date(),
      canEdit: true,
      canDelete: true
    };
    // attach price and raw comments if present for callers that need them
    mapped.price = typeof obj.price === 'number' ? obj.price : 0;
    // Map comments properly - ensure dates are converted
    mapped.comments = (obj.comments || []).map((c: any) => ({
      id: c.id,
      authorId: c.authorId,
      authorName: c.authorName || 'User',
      authorPhone: c.authorPhone || '',
      text: c.text,
      addedDate: c.addedDate ? new Date(c.addedDate) : new Date(),
      replies: (c.replies || []).map((r: any) => ({
        id: r.id,
        adminId: r.adminId,
        adminName: r.adminName || 'Admin',
        text: r.text,
        addedDate: r.addedDate ? new Date(r.addedDate) : new Date()
      }))
    }));
    return mapped as CommentEntry;
  }

  getEntries(): Observable<CommentEntry[]> {
    return this.http.get<any[]>('/api/calendar').pipe(
      map(items => Array.isArray(items) ? items.map(i => this.mapServerToCommentEntry(i)) : []),
      catchError(err => {
        console.error('Failed to load calendar entries:', err);
        return of([]);
      })
    );
  }

  getEntriesByMonth(year: number, month: number): Observable<CommentEntry[]> {
    // month is 0-based in components; backend querying will use month (0-based) conversion if needed
    // fetch all entries and filter client-side while being defensive about date types (string | Date)
    return this.getEntries().pipe(
      map(entries => entries.filter(e => {
        const d = e.date ? new Date(e.date) : null;
        return d ? (d.getFullYear() === year && d.getMonth() === month) : false;
      }))
    );
  }

  addEntry(entry: { date: Date; categoryId: string; text: string; userId?: string; userPhone?: string; userName?: string; price?: number; categoryName?: string }): Observable<CommentEntry> {
    const payload = { 
      title: entry.text.substring(0, 50), // Use first 50 chars as title
      description: entry.text, 
      date: entry.date.toISOString(), 
      categoryId: entry.categoryId, 
      categoryName: entry.categoryName || '',
      price: entry.price || 0, 
      createdBy: entry.userId 
    };
    return this.http.post<any>('/api/calendar', payload).pipe(map(res => this.mapServerToCommentEntry(res)));
  }

  updateEntry(id: string, updates: Partial<any>): Observable<CommentEntry> {
    return this.http.put<any>(`/api/calendar/${id}`, updates).pipe(map(res => this.mapServerToCommentEntry(res)));
  }

  deleteEntry(id: string): Observable<boolean> {
    return this.http.delete(`/api/calendar/${id}`).pipe(map(() => true));
  }

  touchEntry(id: string): Observable<any> {
    return this.http.put(`/api/calendar/${id}/touch`, {}).pipe(map((r: any) => r));
  }

  addComment(entryId: string, text: string): Observable<any> {
    return this.http.post(`/api/calendar/${entryId}/comments`, { text }).pipe(map((r: any) => r));
  }

  replyToComment(entryId: string, commentId: string, text: string): Observable<any> {
    return this.http.post(`/api/calendar/${entryId}/comments/${commentId}/reply`, { text }).pipe(map((r: any) => r));
  }

  deleteComment(entryId: string, commentId: string): Observable<boolean> {
    return this.http.delete(`/api/calendar/${entryId}/comments/${commentId}`).pipe(map(() => true));
  }

  getEntryById(id: string): Observable<CommentEntry | null> {
    return this.http.get<any>(`/api/calendar/${id}`).pipe(
      map(obj => obj ? this.mapServerToCommentEntry(obj) : null),
      catchError(err => {
        console.error('Failed to load calendar entry:', err);
        return of(null);
      })
    );
  }
}
