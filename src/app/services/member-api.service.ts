import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Member } from '../models/member.model';

@Injectable({
  providedIn: 'root'
})
export class MemberApiService {
  private apiUrl = '/api/members';
  constructor(private http: HttpClient) {
    // API-only mode; no localStorage usage for member data
  }
  /**
   * Attempt login via backend API. If backend is not available (mock mode),
   * fallback to local member lookup and optional password check.
   */
  login(phone: string, password: string): Observable<{ member: Member | null; token?: string; error?: string; code?: string }> {
    const loginUrl = '/api/auth/login';
    return this.http.post<any>(loginUrl, { phone, password }).pipe(
      map(resp => ({ 
        member: resp.member || null, 
        token: resp.token,
        error: resp.error,
        code: resp.code
      })),
      catchError(err => {
        const errorMsg = err?.error?.error || err?.error?.message || 'Login failed';
        const code = err?.error?.code || 'LOGIN_ERROR';
        return of({ member: null, error: errorMsg, code });
      })
    );
  }

  // Fetch members from backend API
  getMembers(): Observable<Member[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(items => Array.isArray(items) ? items.map(i => this.toMember(i)) : []),
      catchError(err => {
        console.error('Failed to load members from API:', err);
        return of([]);
      })
    );
  }

  // Get member by phone number
  getMemberByPhone(phone: string): Observable<Member | null> {
    return this.getMembers().pipe(
      map(members => members.find(m => m.phone === phone) || null),
      catchError(err => {
        console.error('Error getting member by phone:', err);
        return of(null);
      })
    );
  }

  // Check if phone number exists in member list
  isMember(phone: string): Observable<boolean> {
    return this.getMembers().pipe(
      map(members => members.some(m => m.phone === phone)),
      catchError(() => of(false))
    );
  }

  // Add new member (simulate API call)
  addMember(member: Omit<Member, 'id' | 'addedDate'>): Observable<Member> {
    return this.http.post<any>(this.apiUrl, member).pipe(
      map(res => this.toMember(res)),
      catchError(err => {
        console.error('Failed to add member via API:', err);
        return throwError(() => err);
      })
    );
  }

  // Update member (simulate API call)
  updateMember(id: string, updates: Partial<Member>): Observable<Member> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, updates).pipe(
      map(res => this.toMember(res)),
      catchError(err => {
        console.error(`Failed to update member ${id} via API:`, err);
        return throwError(() => err);
      })
    );
  }

  // Delete member (simulate API call)
  deleteMember(id: string, permanent: boolean = false): Observable<boolean> {
    const url = permanent ? `${this.apiUrl}/${id}/permanent` : `${this.apiUrl}/${id}`;
    return this.http.delete(url).pipe(
      map(() => true),
      catchError(err => {
        console.error(`Failed to delete member ${id} via API:`, err);
        return throwError(() => err);
      })
    );
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private toMember(obj: any): Member {
    return {
      id: obj._id || obj.id || this.generateId(),
      name: obj.name,
      phone: obj.phone,
      isAdmin: !!obj.isAdmin,
      addedDate: obj.addedDate ? new Date(obj.addedDate) : new Date()
    };
  }
}

