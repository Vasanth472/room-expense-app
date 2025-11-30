import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from './storage.service';
import { MemberApiService } from './member-api.service';
import { Member } from '../models/member.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentRole: 'admin' | 'user' | null = null;
  private currentMember: Member | null = null;

  constructor(
    private storageService: StorageService,
    private memberApiService: MemberApiService,
    private router: Router
  ) {
    this.checkSession();
  }

  /**
   * Attempt login with phone and optional password. This calls the API via MemberApiService.login
   * which may perform server-side password checks (recommended). Falls back to member lookup when
   * no API is available (mock mode).
   */
  login(phone: string, password?: string): Promise<{ success: boolean; error?: string; member?: Member; token?: string }> {
    return new Promise((resolve) => {
      // Validate phone number format
      if (!phone || phone.trim().length !== 10 || !/^\d+$/.test(phone)) {
        resolve({ success: false, error: 'Please enter a valid 10-digit phone number' });
        return;
      }

      const trimmedPhone = phone.trim();

      console.log('Attempting login with phone:', trimmedPhone);
      this.memberApiService.login(trimmedPhone, password || '').subscribe({
        next: (resp: any) => {
          if (!resp || !resp.member) {
            // Return specific error message from backend
            let errorMsg = resp?.error || 'Access denied — invalid credentials.';
            if (resp?.code === 'WRONG_PASSWORD') {
              errorMsg = 'Wrong password. Please try again.';
            } else if (resp?.code === 'MEMBER_NOT_FOUND') {
              errorMsg = 'Phone number not registered.';
            } else if (resp?.code === 'PASSWORD_NOT_SET') {
              errorMsg = 'Password not set for this account. Contact admin.';
            }
            resolve({ success: false, error: errorMsg });
            return;
          }

          const member: Member = resp.member;
          const token: string | undefined = resp.token;

          // Member authenticated, set session
          this.currentMember = member;
          this.currentRole = member.isAdmin ? 'admin' : 'user';

          // Store session details
          localStorage.setItem('currentRole', this.currentRole);
          localStorage.setItem('currentPhone', trimmedPhone);
          localStorage.setItem('currentMember', JSON.stringify(member));
          localStorage.setItem('isAuthenticated', 'true');
          if (token) {
            localStorage.setItem('authToken', token);
          }

          sessionStorage.setItem('currentRole', this.currentRole);
          sessionStorage.setItem('currentPhone', trimmedPhone);
          sessionStorage.setItem('isAuthenticated', 'true');

          resolve({ success: true, member, token });
        },
        error: (error) => {
          console.error('Error during login:', error);
          resolve({ success: false, error: 'Error validating credentials. Please try again.' });
        }
      });
    });
  }

  logout(): void {
    this.currentRole = null;
    this.currentMember = null;
    
    // Clear localStorage
    localStorage.removeItem('currentRole');
    localStorage.removeItem('currentPhone');
    localStorage.removeItem('currentMember');
    localStorage.removeItem('isAuthenticated');
    
    // Clear sessionStorage
    sessionStorage.removeItem('currentRole');
    sessionStorage.removeItem('currentPhone');
    sessionStorage.removeItem('isAuthenticated');
    
    this.router.navigate(['/']);
  }

  isAuthenticated(): boolean {
    // Check both localStorage and sessionStorage
    const isAuth = localStorage.getItem('isAuthenticated') === 'true' || 
                   sessionStorage.getItem('isAuthenticated') === 'true';
    
    if (isAuth && !this.currentRole) {
      // Restore session if not already loaded
      this.checkSession();
    }
    
    return this.currentRole !== null;
  }

  isAdmin(): boolean {
    return this.currentRole === 'admin';
  }

  isUser(): boolean {
    return this.currentRole === 'user';
  }

  getCurrentRole(): 'admin' | 'user' | null {
    return this.currentRole;
  }

  getCurrentPhone(): string | null {
    return localStorage.getItem('currentPhone') || sessionStorage.getItem('currentPhone');
  }

  getCurrentMember(): Member | null {
    if (this.currentMember) {
      return this.currentMember;
    }
    
    // Try to restore from localStorage
    const memberData = localStorage.getItem('currentMember');
    if (memberData) {
      try {
        this.currentMember = JSON.parse(memberData);
        return this.currentMember;
      } catch (e) {
        console.error('Error parsing member data:', e);
      }
    }
    
    return null;
  }

  private checkSession(): void {
    // Check localStorage first
    const role = localStorage.getItem('currentRole') || sessionStorage.getItem('currentRole');
    const phone = localStorage.getItem('currentPhone') || sessionStorage.getItem('currentPhone');
    
    if (role && phone && (role === 'admin' || role === 'user')) {
      this.currentRole = role as 'admin' | 'user';
      
      // Try to restore member data
      const memberData = localStorage.getItem('currentMember');
      if (memberData) {
        try {
          this.currentMember = JSON.parse(memberData);
        } catch (e) {
          console.error('Error parsing member data:', e);
        }
      }
    }
  }

  isAdminSetup(): boolean {
    // Check if there are any admin members
    return this.storageService.getAdminPhone() !== null;
  }
}
