import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { StorageService } from './storage.service';
import { Expense } from '../models/expense.model';
import { MonthlySummary } from '../models/monthly-summary.model';
import { MemberService } from './member.service';
import { CategoryService } from './category.service';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private memberService: MemberService,
    private categoryService: CategoryService
  ) {}

  // Return all expenses from server
  getExpenses(): Observable<Expense[]> {
    return this.http.get<any[]>('/api/expenses').pipe(
      map(items => Array.isArray(items) ? items.map(i => this.toExpense(i)) : []),
      catchError(err => {
        console.error('Failed to load expenses from API:', err);
        return of([]);
      })
    );
  }

  getExpensesByMonth(month: number, year: number): Observable<Expense[]> {
    return this.getExpenses().pipe(
      map(expenses => expenses.filter(expense => {
        const expDate = new Date(expense.date);
        return expDate.getMonth() + 1 === month && expDate.getFullYear() === year;
      }))
    );
  }

  // Get per-category summary for a given month/year (aggregated by API if available)
  getCategoryMonthlySummary(month: number, year: number): Observable<any> {
    const url = `/api/categories/summary/monthly?month=${month}&year=${year}`;
    return this.http.get<any>(url).pipe(
      map(res => res),
      catchError(err => {
        console.error('Failed to load category monthly summary from API:', err);
        return of({ month, year, categories: [] });
      })
    );
  }

  getExpensesByDateRange(startDate: Date, endDate: Date): Observable<Expense[]> {
    return this.getExpenses().pipe(
      map(expenses => expenses.filter(expense => {
        const expDate = new Date(expense.date);
        return expDate >= startDate && expDate <= endDate;
      }))
    );
  }

  getExpensesByCategory(categoryId: string): Observable<Expense[]> {
    return this.getExpenses().pipe(map(expenses => expenses.filter(expense => expense.categoryId === categoryId)));
  }

  addExpense(expense: Omit<Expense, 'id' | 'addedDate' | 'categoryName'>): Observable<Expense> {
    const payload = { ...expense };
    return this.http.post<any>('/api/expenses', payload).pipe(
      map(res => this.toExpense(res)),
      catchError(err => {
        console.error('Failed to create expense via API:', err);
        return throwError(() => err);
      })
    );
  }

  updateExpense(id: string, updates: Partial<Omit<Expense, 'id' | 'categoryName'>>): Observable<Expense> {
    return this.http.put<any>(`/api/expenses/${id}`, updates).pipe(
      map(res => this.toExpense(res)),
      catchError(err => {
        console.error(`Failed to update expense ${id} via API:`, err);
        return throwError(() => err);
      })
    );
  }

  deleteExpense(id: string): Observable<boolean> {
    return this.http.delete(`/api/expenses/${id}`).pipe(
      map(() => true),
      catchError(err => {
        console.error(`Failed to delete expense ${id} via API:`, err);
        return of(false);
      })
    );
  }

  getMonthlySummary(month: number, year: number): Observable<MonthlySummary> {
    const url = `/api/expenses/summary?month=${month}&year=${year}`;
    return this.http.get<any>(url).pipe(
      map(res => ({
        month: res.month,
        year: res.year,
        totalExpenses: res.totalExpenses || 0,
        totalMembers: res.totalMembers || 0,
        perPersonAmount: res.perPersonAmount || 0,
        balance: res.balance || 0
      } as MonthlySummary)),
      catchError(err => {
        console.error('Failed to load monthly summary from API:', err);
        // return a default empty summary
        return of({ month, year, totalExpenses: 0, totalMembers: 0, perPersonAmount: 0, balance: 0 } as MonthlySummary);
      })
    );
  }

  filterExpenses(filters: {
    categoryId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Observable<Expense[]> {
    return this.getExpenses().pipe(
      map(expenses => {
        let filtered = expenses;
        if (filters.categoryId) filtered = filtered.filter(e => e.categoryId === filters.categoryId);
        if (filters.startDate && filters.endDate) {
          filtered = filtered.filter(expense => {
            const expDate = new Date(expense.date);
            expDate.setHours(0, 0, 0, 0);
            const start = new Date(filters.startDate!);
            start.setHours(0, 0, 0, 0);
            const end = new Date(filters.endDate!);
            end.setHours(23, 59, 59, 999);
            return expDate >= start && expDate <= end;
          });
        }
        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      })
    );
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private toExpense(obj: any): Expense {
    const expense: any = {
      id: obj.id || obj._id || this.generateId(),
      amount: obj.amount,
      description: obj.description,
      date: obj.date ? new Date(obj.date) : new Date(),
      categoryId: obj.categoryId,
      categoryName: obj.categoryName,
      memberId: obj.memberId,
      addedBy: obj.memberId || obj.addedBy || '',
      addedDate: obj.addedDate ? new Date(obj.addedDate) : new Date()
    };
    // Include comments if present (for MongoDB storage)
    if (obj.comments) {
      expense.comments = obj.comments;
    }
    return expense as Expense;
  }
}
