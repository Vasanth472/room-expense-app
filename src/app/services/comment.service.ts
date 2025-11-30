import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Comment } from '../models/comment.model';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private readonly EDIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor(private http: HttpClient) {}

  private mapServerToComment(obj: any, expenseId: string): Comment {
    const timestamp = obj.timestamp ? new Date(obj.timestamp) : (obj.date ? new Date(obj.date) : new Date());
    return {
      id: obj.id,
      expenseId: expenseId,
      text: obj.text,
      author: obj.authorPhone || '',
      authorName: obj.authorName || 'User',
      authorPhone: obj.authorPhone || '',
      timestamp: timestamp,
      date: timestamp,
      canEdit: this.canEditCommentByTimestamp(timestamp),
      canDelete: this.canDeleteCommentByTimestamp(timestamp)
    };
  }

  getCommentsByExpenseId(expenseId: string): Observable<Comment[]> {
    return this.http.get<any>(`/api/expenses/${expenseId}`).pipe(
      map(expense => {
        const comments = (expense.comments || []).map((c: any) => this.mapServerToComment(c, expenseId));
        return comments.sort((a: Comment, b: Comment) => a.timestamp.getTime() - b.timestamp.getTime());
      }),
      catchError(err => {
        console.error('Failed to load comments:', err);
        return of([]);
      })
    );
  }

  getAllComments(): Observable<Comment[]> {
    return this.http.get<any[]>('/api/expenses').pipe(
      map(expenses => {
        const allComments: Comment[] = [];
        expenses.forEach(expense => {
          if (expense.comments && expense.comments.length > 0) {
            expense.comments.forEach((c: any) => {
              allComments.push(this.mapServerToComment(c, expense.id));
            });
          }
        });
        return allComments.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      }),
      catchError(err => {
        console.error('Failed to load all comments:', err);
        return of([]);
      })
    );
  }

  addComment(expenseId: string, text: string): Observable<Comment> {
    return this.http.post<any>(`/api/expenses/${expenseId}/comments`, { text }).pipe(
      map(comment => this.mapServerToComment(comment, expenseId))
    );
  }

  updateComment(expenseId: string, commentId: string, text: string): Observable<Comment> {
    return this.http.put<any>(`/api/expenses/${expenseId}/comments/${commentId}`, { text }).pipe(
      map(comment => this.mapServerToComment(comment, expenseId)),
      catchError(err => {
        console.error('Failed to update comment:', err);
        throw err;
      })
    );
  }

  deleteComment(expenseId: string, commentId: string): Observable<boolean> {
    return this.http.delete(`/api/expenses/${expenseId}/comments/${commentId}`).pipe(
      map(() => true),
      catchError(err => {
        console.error('Failed to delete comment:', err);
        throw err;
      })
    );
  }

  canEditCommentByTimestamp(timestamp: Date): boolean {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    return diff <= this.EDIT_WINDOW_MS;
  }

  canDeleteCommentByTimestamp(timestamp: Date): boolean {
    return this.canEditCommentByTimestamp(timestamp);
  }

  canEditComment(comment: Comment): boolean {
    return this.canEditCommentByTimestamp(comment.timestamp);
  }

  canDeleteComment(comment: Comment): boolean {
    return this.canDeleteCommentByTimestamp(comment.timestamp);
  }

  getRemainingTime(comment: Comment): string {
    if (!comment.canEdit) return 'Locked';
    
    const now = new Date();
    const commentTime = new Date(comment.timestamp);
    const diff = now.getTime() - commentTime.getTime();
    const remaining = this.EDIT_WINDOW_MS - diff;
    
    if (remaining <= 0) return 'Locked';
    
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
