import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenseService } from '../../services/expense.service';
import { Expense } from '../../models/expense.model';

@Component({
  selector: 'app-expense-breakdown-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expense-breakdown-panel.component.html',
  styleUrls: ['./expense-breakdown-panel.component.css']
})
export class ExpenseBreakdownPanelComponent implements OnChanges {
  @Input() open = false;
  @Input() month = 1;
  @Input() year = new Date().getFullYear();
  @Input() totalAmount = 0;
  @Output() closed = new EventEmitter<void>();

  expenses: Expense[] = [];
  loading = false;

  constructor(private expenseService: ExpenseService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue === true) {
      this.loadExpenses();
    }
  }

  loadExpenses(): void {
    this.loading = true;
    this.expenseService.getExpensesForMonth(this.month, this.year).subscribe(items => {
      this.expenses = items.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      this.loading = false;
    });
  }

  close(): void {
    this.closed.emit();
  }

  getPurchaseName(expense: Expense): string {
    const desc = (expense.description || '').trim();
    if (desc) return desc;
    return (expense.categoryName || '').trim() || 'Expense';
  }

  formatCurrency(amount: number): string {
    return '₹' + (Number(amount) || 0).toFixed(2);
  }

  formatDate(value: Date): string {
    return new Date(value).toLocaleDateString();
  }

  getMonthLabel(): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[this.month - 1] || ''} ${this.year}`;
  }
}
