import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PasswordResetService } from '../../services/password-reset.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  phone: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  // Forget password
  showForgotPassword: boolean = false;
  forgotPhone: string = '';
  forgotMessage: string = '';
  forgotNote: string = '';
  forgotError: string = '';
  forgotLoading: boolean = false;
  adminContactPhone: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private passwordResetService: PasswordResetService
  ) {}

  ngOnInit(): void {
    // Check if already logged in
    if (this.authService.isAuthenticated()) {
      if (this.authService.isAdmin()) {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/user']);
      }
    }
  }

  async onLogin(): Promise<void> {
    this.errorMessage = '';
    this.isLoading = true;

    // Validate phone number format
    if (!this.phone || this.phone.trim().length !== 10) {
      this.errorMessage = 'Please enter a valid 10-digit phone number';
      this.isLoading = false;
      return;
    }

    // Check if phone contains only digits
    if (!/^\d+$/.test(this.phone.trim())) {
      this.errorMessage = 'Phone number must contain only digits';
      this.isLoading = false;
      return;
    }

    // Validate password is not empty
    if (!this.password || this.password.trim().length === 0) {
      this.errorMessage = 'Password is required';
      this.isLoading = false;
      return;
    }

    try {
      const result = await this.authService.login(this.phone.trim(), this.password);

      if (result.success && result.member) {
        // Navigate based on role
        if (result.member.isAdmin) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/user']);
        }
      } else {
        // Show error message from service (could be from API or fallback)
        this.errorMessage = result.error || 'Login failed. Please try again.';
      }
    } catch (error) {
      console.error('Login error:', error);
      this.errorMessage = 'Network error. Please check your connection and try again.';
    } finally {
      this.isLoading = false;
    }
  }

  onPhoneInput(event: any): void {
    // Only allow digits
    this.phone = event.target.value.replace(/\D/g, '');
    
    // Limit to 10 digits
    if (this.phone.length > 10) {
      this.phone = this.phone.substring(0, 10);
    }
    
    // Clear error message when user starts typing
    if (this.errorMessage) {
      this.errorMessage = '';
    }
  }

  onPasswordInput(event: any): void {
    this.password = event.target.value || '';
    if (this.errorMessage) this.errorMessage = '';
  }

  // Forgot password methods
  openForgotPassword(): void {
    this.showForgotPassword = true;
    this.forgotPhone = this.phone || '';
    this.forgotNote = '';
    this.forgotMessage = '';
    this.forgotError = '';
    this.passwordResetService.getAdminContactPhone().subscribe(phone => {
      this.adminContactPhone = phone;
    });
  }

  closeForgotPassword(): void {
    this.showForgotPassword = false;
    this.forgotPhone = '';
    this.forgotNote = '';
    this.forgotMessage = '';
    this.forgotError = '';
    this.forgotLoading = false;
  }

  submitForgotPassword(): void {
    this.forgotError = '';
    this.forgotMessage = '';

    if (!this.forgotPhone || this.forgotPhone.trim().length !== 10) {
      this.forgotError = 'Please enter a valid 10-digit phone number';
      return;
    }

    if (!/^\d+$/.test(this.forgotPhone.trim())) {
      this.forgotError = 'Phone number must contain only digits';
      return;
    }

    this.forgotLoading = true;
    this.passwordResetService.requestReset(this.forgotPhone.trim(), this.forgotNote.trim()).subscribe(result => {
      this.forgotLoading = false;
      if (result.success) {
        this.forgotMessage = result.message || 'Request sent to admin. You will get a new password soon.';
        if (result.adminContactPhone) {
          this.adminContactPhone = result.adminContactPhone;
        }
        setTimeout(() => this.closeForgotPassword(), 4000);
      } else {
        this.forgotError = result.error || 'Could not submit request.';
      }
    });
  }

  getAdminTelLink(): string {
    return this.adminContactPhone ? `tel:+91${this.adminContactPhone}` : '';
  }

  getAdminWhatsAppLink(): string {
    const text = encodeURIComponent('Hi, I requested a password reset for the Room Expense app.');
    return this.adminContactPhone ? `https://wa.me/91${this.adminContactPhone}?text=${text}` : '';
  }

  onForgotPhoneInput(event: any): void {
    this.forgotPhone = event.target.value.replace(/\D/g, '');
    if (this.forgotPhone.length > 10) {
      this.forgotPhone = this.forgotPhone.substring(0, 10);
    }
    if (this.forgotError) this.forgotError = '';
  }
}
