import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PasswordResetRequest } from '../models/password-reset-request.model';

@Injectable({ providedIn: 'root' })
export class PasswordResetService {
  constructor(private http: HttpClient) {}

  getAdminContactPhone(): Observable<string> {
    return this.http.get<{ adminContactPhone: string }>('/api/settings/admin-contact').pipe(
      map(r => (r?.adminContactPhone || '').trim()),
      catchError(() => of(''))
    );
  }

  requestReset(phone: string, message?: string): Observable<{ success: boolean; message?: string; error?: string; code?: string; adminContactPhone?: string }> {
    return this.http.post<any>('/api/auth/forgot-password', { phone, message: message || '' }).pipe(
      map(resp => ({
        success: true,
        message: resp.message,
        adminContactPhone: resp.adminContactPhone
      })),
      catchError(err => of({
        success: false,
        error: err?.error?.error || 'Could not submit request. Try again.',
        code: err?.error?.code
      }))
    );
  }

  getPendingRequests(): Observable<PasswordResetRequest[]> {
    return this.http.get<any[]>('/api/auth/password-reset-requests', { params: { status: 'pending' } }).pipe(
      map(items => (Array.isArray(items) ? items : []).map(i => this.toRequest(i))),
      catchError(err => {
        console.error('Failed to load password reset requests', err);
        return of([]);
      })
    );
  }

  approveRequest(id: string, password: string): Observable<{ success: boolean; error?: string; message?: string }> {
    return this.http.patch<any>(`/api/auth/password-reset-requests/${id}`, { action: 'approve', password }).pipe(
      map(resp => ({ success: true, message: resp.message })),
      catchError(err => of({ success: false, error: err?.error?.error || 'Failed to approve' }))
    );
  }

  rejectRequest(id: string): Observable<{ success: boolean; error?: string }> {
    return this.http.patch<any>(`/api/auth/password-reset-requests/${id}`, { action: 'reject' }).pipe(
      map(() => ({ success: true })),
      catchError(err => of({ success: false, error: err?.error?.error || 'Failed to reject' }))
    );
  }

  private toRequest(obj: any): PasswordResetRequest {
    return {
      id: obj.id || obj._id,
      memberId: obj.memberId,
      memberName: obj.memberName,
      phone: obj.phone,
      message: obj.message || '',
      status: obj.status,
      requestedAt: obj.requestedAt,
      resolvedAt: obj.resolvedAt
    };
  }
}
