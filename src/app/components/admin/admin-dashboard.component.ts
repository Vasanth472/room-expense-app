import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ExpenseService } from '../../services/expense.service';
import { SettingsService } from '../../services/settings.service';
import { MemberService } from '../../services/member.service';
import { PasswordResetService } from '../../services/password-reset.service';
import { PasswordResetRequest } from '../../models/password-reset-request.model';
import { MonthlySummary } from '../../models/monthly-summary.model';
import { Member } from '../../models/member.model';
import { Subscription } from 'rxjs';
import { PageHeaderComponent } from '../shared/page-header.component';
import { ExpenseHistoryPanelComponent } from '../shared/expense-history-panel.component';
import { ExpenseBreakdownPanelComponent } from '../shared/expense-breakdown-panel.component';
import { ExpenseHistoryService } from '../../services/expense-history.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, ExpenseHistoryPanelComponent, ExpenseBreakdownPanelComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  summary: MonthlySummary | null = null;
  currentMonth: number = new Date().getMonth() + 1;
  currentYear: number = new Date().getFullYear();
  memberCount: number = 0;
  adminCount: number = 0;
  currentMember: Member | null = null;
  // Full amount entered by admin (to compare against total expenses)
  fullAmount: number = 0;
  isSaving: boolean = false;
  saveMessage: string = '';
  saveSuccess: boolean = false;
  // Real-time date and time
  currentDate: Date = new Date();
  currentTime: string = '';
  currentDateString: string = '';
  private timeInterval: any = null;
  private resetPollInterval: any = null;
  private membersSub: Subscription | null = null;
  authService: AuthService;

  pendingResetRequests: PasswordResetRequest[] = [];
  newPasswordByRequestId: Record<string, string> = {};
  resetActionMessage: string = '';
  resetActionError: string = '';
  processingRequestId: string | null = null;
  adminContactPhone: string = '';
  adminContactEdit: string = '';
  savingAdminContact: boolean = false;
  showHistoryPanel = false;
  showExpenseBreakdown = false;
  historyRefreshKey = 0;
  isResetting = false;
  resetAllMessage = '';
  resetAllError = '';

  constructor(
    authService: AuthService,
    private expenseService: ExpenseService,
    private memberService: MemberService,
    private router: Router,
    private settingsService: SettingsService,
    private passwordResetService: PasswordResetService,
    private expenseHistoryService: ExpenseHistoryService
  ) {
    this.authService = authService;
  }

  ngOnInit(): void {
    this.loadSummary();
    this.refreshMemberCounts();
    this.currentMember = this.authService.getCurrentMember();
    // Initialize and start real-time clock
    this.updateDateTime();
    this.timeInterval = setInterval(() => {
      this.updateDateTime();
    }, 1000);
    this.loadAdminContact();
    this.loadPendingResetRequests();
    this.resetPollInterval = setInterval(() => this.loadPendingResetRequests(), 15000);
  }

  loadAdminContact(): void {
    this.settingsService.getAdminContactPhone().subscribe(phone => {
      this.adminContactPhone = phone;
      this.adminContactEdit = phone;
    });
  }

  saveAdminContact(): void {
    const phone = (this.adminContactEdit || '').replace(/\D/g, '');
    if (phone.length !== 10) {
      this.resetActionError = 'Enter a valid 10-digit admin contact number';
      setTimeout(() => (this.resetActionError = ''), 3000);
      return;
    }
    this.savingAdminContact = true;
    this.settingsService.setAdminContactPhone(phone).subscribe({
      next: () => {
        this.adminContactPhone = phone;
        this.adminContactEdit = phone;
        this.savingAdminContact = false;
        this.resetActionMessage = 'Admin contact number saved';
        setTimeout(() => (this.resetActionMessage = ''), 3000);
      },
      error: () => {
        this.savingAdminContact = false;
        this.resetActionError = 'Failed to save admin contact';
        setTimeout(() => (this.resetActionError = ''), 3000);
      }
    });
  }

  loadPendingResetRequests(): void {
    this.passwordResetService.getPendingRequests().subscribe(requests => {
      this.pendingResetRequests = requests;
      for (const r of requests) {
        if (!this.newPasswordByRequestId[r.id]) {
          this.newPasswordByRequestId[r.id] = '';
        }
      }
    });
  }

  formatRequestTime(value: string | Date): string {
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString();
  }

  approveResetRequest(req: PasswordResetRequest): void {
    const password = (this.newPasswordByRequestId[req.id] || '').trim();
    if (password.length < 4) {
      this.resetActionError = 'Enter a new password (min 4 characters) for ' + req.memberName;
      setTimeout(() => (this.resetActionError = ''), 4000);
      return;
    }
    this.processingRequestId = req.id;
    this.resetActionError = '';
    this.passwordResetService.approveRequest(req.id, password).subscribe(result => {
      this.processingRequestId = null;
      if (result.success) {
        this.resetActionMessage = `Password reset for ${req.memberName}. Share the new password with them securely.`;
        delete this.newPasswordByRequestId[req.id];
        this.loadPendingResetRequests();
        setTimeout(() => (this.resetActionMessage = ''), 5000);
      } else {
        this.resetActionError = result.error || 'Failed to reset password';
        setTimeout(() => (this.resetActionError = ''), 4000);
      }
    });
  }

  rejectResetRequest(req: PasswordResetRequest): void {
    if (!confirm(`Reject password reset request from ${req.memberName}?`)) return;
    this.processingRequestId = req.id;
    this.passwordResetService.rejectRequest(req.id).subscribe(result => {
      this.processingRequestId = null;
      if (result.success) {
        this.loadPendingResetRequests();
      } else {
        this.resetActionError = result.error || 'Failed to reject request';
        setTimeout(() => (this.resetActionError = ''), 4000);
      }
    });
  }

  saveFullAmount(): void {
    if (this.fullAmount < 0) {
      this.saveMessage = 'Amount cannot be negative';
      this.saveSuccess = false;
      setTimeout(() => this.saveMessage = '', 3000);
      return;
    }

    this.isSaving = true;
    this.saveMessage = '';
    this.settingsService.setFullAmount(this.fullAmount).subscribe({
      next: () => {
        this.isSaving = false;
        this.saveMessage = 'Full amount saved successfully!';
        this.saveSuccess = true;
        this.loadSummary();
        setTimeout(() => {
          this.saveMessage = '';
        }, 3000);
      },
      error: err => {
        console.error('Failed to save fullAmount', err);
        this.isSaving = false;
        this.saveMessage = 'Failed to save. Please try again.';
        this.saveSuccess = false;
        setTimeout(() => {
          this.saveMessage = '';
        }, 3000);
      }
    });
  }

  getMonthName(month: number): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1] || '';
  }

  loadSummary(): void {
    this.expenseService.getMonthlySummary(this.currentMonth, this.currentYear).subscribe(summary => {
      this.summary = summary;
      this.fullAmount = summary.fullAmount;
    });
    this.refreshMemberCounts();
  }

  refreshMemberCounts(): void {
    // unsubscribe previous if any
    if (this.membersSub) this.membersSub.unsubscribe();
    this.membersSub = this.memberService.getMembers().subscribe(members => {
      this.memberCount = Array.isArray(members) ? members.length : 0;
      this.adminCount = Array.isArray(members) ? members.filter(m => !!m.isAdmin).length : 0;
    }, err => {
      console.error('Failed to load members for counts', err);
      this.memberCount = 0;
      this.adminCount = 0;
    });
  }

  ngOnDestroy(): void {
    if (this.membersSub) {
      this.membersSub.unsubscribe();
      this.membersSub = null;
    }
    // Clear time interval
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
    if (this.resetPollInterval) {
      clearInterval(this.resetPollInterval);
    }
  }

  updateDateTime(): void {
    this.currentDate = new Date();
    this.currentTime = this.formatTime(this.currentDate);
    this.currentDateString = this.formatDate(this.currentDate);
  }

  formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  formatDate(date: Date): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${dayName}, ${day} ${month} ${year}`;
  }

  logout(): void {
    this.authService.logout();
  }

  navigateToCategories(): void {
    this.router.navigate(['/admin/categories']);
  }

  navigateToMembers(): void {
    this.router.navigate(['/admin/members']);
  }

  navigateToExpenses(): void {
    this.router.navigate(['/admin/expenses']);
  }

  formatCurrency(amount: number): string {
    return '₹' + amount.toFixed(2);
  }

  getPerPersonAmount(): number {
    if (this.summary?.perPersonAmount != null) return this.summary.perPersonAmount;
    const members = this.summary?.totalMembers || 0;
    const full = this.summary?.fullAmount ?? this.fullAmount ?? 0;
    return members > 0 ? full / members : 0;
  }

  getFullAmountForSummary(): number {
    return this.fullAmount ?? this.summary?.fullAmount ?? 0;
  }

  getTotalExpenses(): number {
    return this.summary?.totalExpenses ?? 0;
  }

  /** Balance = full amount − total expenses */
  getBalance(): number {
    return this.getFullAmountForSummary() - this.getTotalExpenses();
  }

  navigateToCalendar(): void {
    this.router.navigate(['/user/calendar']);
  }

  openHistory(): void {
    this.showHistoryPanel = true;
    this.historyRefreshKey++;
  }

  closeHistory(): void {
    this.showHistoryPanel = false;
  }

  openExpenseBreakdown(): void {
    this.showExpenseBreakdown = true;
  }

  closeExpenseBreakdown(): void {
    this.showExpenseBreakdown = false;
  }

  confirmResetAll(): void {
    const expenseCount = this.getTotalExpenses() > 0 ? 'expenses' : 'data';
    const msg =
      'Reset ALL expenses and full amount?\n\n' +
      '• Current expenses will be saved to History (permanent, cannot delete)\n' +
      '• All active expenses will be cleared\n' +
      '• Full amount will be set to ₹0\n\n' +
      'Continue?';
    if (!confirm(msg)) return;

    this.isResetting = true;
    this.resetAllMessage = '';
    this.resetAllError = '';

    this.expenseHistoryService.resetAll().subscribe(result => {
      this.isResetting = false;
      if (result.success) {
        this.resetAllMessage =
          result.message ||
          `Archived ${result.archivedCount ?? 0} expense(s). Full amount reset to zero.`;
        this.fullAmount = 0;
        this.loadSummary();
        this.historyRefreshKey++;
        setTimeout(() => (this.resetAllMessage = ''), 6000);
      } else {
        this.resetAllError = result.error || 'Reset failed';
        setTimeout(() => (this.resetAllError = ''), 5000);
      }
    });
  }
}
