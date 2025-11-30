import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ExpenseService } from '../../services/expense.service';
import { SettingsService } from '../../services/settings.service';
import { MemberService } from '../../services/member.service';
import { MonthlySummary } from '../../models/monthly-summary.model';
import { Member } from '../../models/member.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  private membersSub: Subscription | null = null;
  authService: AuthService;

  constructor(
    authService: AuthService,
    private expenseService: ExpenseService,
    private memberService: MemberService,
    private router: Router,
    private settingsService: SettingsService
  ) {
    this.authService = authService;
  }

  ngOnInit(): void {
    this.loadSummary();
    this.refreshMemberCounts();
    this.currentMember = this.authService.getCurrentMember();
    // load persisted full amount from server
    this.loadFullAmount();
    // Initialize and start real-time clock
    this.updateDateTime();
    this.timeInterval = setInterval(() => {
      this.updateDateTime();
    }, 1000);
  }

  loadFullAmount(): void {
    // call service to load persisted value
    this.settingsService.getFullAmount().subscribe({
      next: val => this.fullAmount = val,
      error: err => console.error('Failed loading fullAmount', err)
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

  getRemaining(): number {
    const total = this.summary ? this.summary.totalExpenses : 0;
    return (this.fullAmount || 0) - total;
  }

  navigateToCalendar(): void {
    this.router.navigate(['/user/calendar']);
  }
}
