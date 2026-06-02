import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ExpenseHistoryRecord } from '../models/expense-history.model';

@Injectable({ providedIn: 'root' })
export class ExpenseHistoryService {
  constructor(private http: HttpClient) {}

  getHistoryList(): Observable<ExpenseHistoryRecord[]> {
    return this.http.get<ExpenseHistoryRecord[]>('/api/expenses/history').pipe(
      map(items => (Array.isArray(items) ? items : [])),
      catchError(err => {
        console.error('Failed to load expense history', err);
        return of([]);
      })
    );
  }

  getHistoryDetail(id: string): Observable<ExpenseHistoryRecord | null> {
    return this.http.get<ExpenseHistoryRecord>(`/api/expenses/history/${id}`).pipe(
      catchError(err => {
        console.error('Failed to load history detail', err);
        return of(null);
      })
    );
  }

  resetAll(): Observable<{ success: boolean; message?: string; error?: string; archivedCount?: number }> {
    return this.http.post<any>('/api/expenses/reset-all', {}).pipe(
      map(resp => ({
        success: true,
        message: resp.message,
        archivedCount: resp.archivedCount
      })),
      catchError(err => of({
        success: false,
        error: err?.error?.error || 'Reset failed'
      }))
    );
  }
}
