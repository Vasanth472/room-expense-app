import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ExpenseService } from '../../services/expense.service';
import { MonthlySummary } from '../../models/monthly-summary.model';
import { Member } from '../../models/member.model';
import { PageHeaderComponent } from '../shared/page-header.component';
import { ExpenseHistoryPanelComponent } from '../shared/expense-history-panel.component';
import { ExpenseBreakdownPanelComponent } from '../shared/expense-breakdown-panel.component';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, ExpenseHistoryPanelComponent, ExpenseBreakdownPanelComponent],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css']
})
export class UserDashboardComponent implements OnInit, OnDestroy {
  summary: MonthlySummary | null = null;
  currentMonth: number = new Date().getMonth() + 1;
  currentYear: number = new Date().getFullYear();
  currentMember: Member | null = null;
  fullAmount: number = 0;
  showHistoryPanel = false;
  showExpenseBreakdown = false;
  historyRefreshKey = 0;
  // Real-time date and time
  currentDate: Date = new Date();
  currentTime: string = '';
  currentDateString: string = '';
  private timeInterval: any = null;
  authService: AuthService;

  constructor(
    authService: AuthService,
    private expenseService: ExpenseService,
    private router: Router
  ) {
    this.authService = authService;
  }

  ngOnInit(): void {
    this.loadSummary();
    this.currentMember = this.authService.getCurrentMember();
    // Initialize and start real-time clock
    this.updateDateTime();
    this.timeInterval = setInterval(() => {
      this.updateDateTime();
    }, 1000);
  }

  ngOnDestroy(): void {
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

  loadSummary(): void {
    this.expenseService.getMonthlySummary(this.currentMonth, this.currentYear).subscribe({
      next: (s) => {
        this.summary = s;
        this.fullAmount = s.fullAmount;
      },
      error: (err) => {
        console.error('Failed to load monthly summary:', err);
        this.summary = null;
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }

  navigateToCalendar(): void {
    this.router.navigate(['/user/calendar']);
  }

  navigateToExpenses(): void {
    this.router.navigate(['/user/expenses']);
  }

  formatCurrency(amount: number): string {
    return '₹' + amount.toFixed(2);
  }

  getMonthName(month: number): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1] || '';
  }

  getPerPersonAmount(): number {
    return this.summary?.perPersonAmount ?? 0;
  }

  getFullAmountForSummary(): number {
    return this.summary?.fullAmount ?? 0;
  }

  getTotalExpenses(): number {
    return this.summary?.totalExpenses ?? 0;
  }

  /** Balance = full amount − total expenses */
  getBalance(): number {
    return this.getFullAmountForSummary() - this.getTotalExpenses();
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
}
