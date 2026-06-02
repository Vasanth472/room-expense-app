import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenseHistoryService } from '../../services/expense-history.service';
import { ExpenseHistoryRecord } from '../../models/expense-history.model';

@Component({
  selector: 'app-expense-history-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expense-history-panel.component.html',
  styleUrls: ['./expense-history-panel.component.css']
})
export class ExpenseHistoryPanelComponent implements OnChanges, OnDestroy {
  @Input() open = false;
  /** Increment from parent after reset to force refresh */
  @Input() refreshKey = 0;
  @Output() closed = new EventEmitter<void>();

  historyList: ExpenseHistoryRecord[] = [];
  selected: ExpenseHistoryRecord | null = null;
  loading = false;
  loadingDetail = false;
  lastUpdated: Date | null = null;

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private static readonly POLL_MS = 8000;

  constructor(private expenseHistoryService: ExpenseHistoryService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue === true) {
      this.selected = null;
      this.loadList();
      this.startPolling();
    }
    if (changes['open']?.currentValue === false) {
      this.stopPolling();
    }
    if (changes['refreshKey'] && this.open && !changes['refreshKey'].firstChange) {
      const selectedId = this.selected?.id;
      this.loadList(true);
      if (selectedId) {
        this.expenseHistoryService.getHistoryDetail(selectedId).subscribe(detail => {
          if (detail) this.selected = detail;
        });
      }
    }
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  startPolling(): void {
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      if (this.open && !this.selected) {
        this.loadList(true);
      }
    }, ExpenseHistoryPanelComponent.POLL_MS);
  }

  stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  loadList(silent = false): void {
    if (!silent) this.loading = true;
    this.expenseHistoryService.getHistoryList().subscribe(items => {
      this.historyList = items;
      this.lastUpdated = new Date();
      this.loading = false;
    });
  }

  selectRecord(record: ExpenseHistoryRecord): void {
    this.loadingDetail = true;
    this.expenseHistoryService.getHistoryDetail(record.id).subscribe(detail => {
      this.selected = detail;
      this.loadingDetail = false;
      this.lastUpdated = new Date();
    });
  }

  backToList(): void {
    this.selected = null;
    this.loadList(true);
  }

  close(): void {
    this.selected = null;
    this.stopPolling();
    this.closed.emit();
  }

  formatCurrency(amount: number): string {
    return '₹' + (Number(amount) || 0).toFixed(2);
  }

  formatDate(value: string | Date): string {
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString();
  }

  formatShortDate(value: string | Date): string {
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString();
  }

  getPurchaseName(e: { description?: string; categoryName?: string }): string {
    const desc = (e.description || '').trim();
    if (desc) return desc;
    return (e.categoryName || '').trim() || 'Expense';
  }

  getLastUpdatedLabel(): string {
    if (!this.lastUpdated) return '';
    return this.lastUpdated.toLocaleTimeString();
  }
}
