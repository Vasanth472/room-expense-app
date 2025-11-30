import { Injectable } from '@angular/core';
import { Member } from '../models/member.model';
import { Expense } from '../models/expense.model';
import { Comment } from '../models/comment.model';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly ADMIN_PHONE_KEY = 'adminPhone';
  private readonly MEMBERS_KEY = 'members';
  private readonly EXPENSES_KEY = 'expenses';
  private readonly COMMENTS_KEY = 'comments';
  private readonly CURRENT_MONTH_KEY = 'currentMonth';

  // Admin Phone
  getAdminPhone(): string | null {
    return localStorage.getItem(this.ADMIN_PHONE_KEY);
  }

  setAdminPhone(phone: string): void {
    localStorage.setItem(this.ADMIN_PHONE_KEY, phone);
  }

  // Members
  getMembers(): Member[] {
    const data = localStorage.getItem(this.MEMBERS_KEY);
    if (!data) return [];
    const members = JSON.parse(data);
    return members.map((m: any) => ({
      ...m,
      addedDate: new Date(m.addedDate)
    }));
  }

  saveMembers(members: Member[]): void {
    localStorage.setItem(this.MEMBERS_KEY, JSON.stringify(members));
  }

  // Expenses
  getExpenses(): Expense[] {
    const data = localStorage.getItem(this.EXPENSES_KEY);
    if (!data) return [];
    const expenses = JSON.parse(data);
    return expenses.map((e: any) => ({
      ...e,
      date: new Date(e.date),
      addedDate: new Date(e.addedDate)
    }));
  }

  saveExpenses(expenses: Expense[]): void {
    localStorage.setItem(this.EXPENSES_KEY, JSON.stringify(expenses));
  }

  // Comments
  getComments(): Comment[] {
    const data = localStorage.getItem(this.COMMENTS_KEY);
    if (!data) return [];
    const comments = JSON.parse(data);
    return comments.map((c: any) => ({
      ...c,
      date: new Date(c.date),
      timestamp: new Date(c.timestamp || c.date),
      canEdit: c.canEdit !== undefined ? c.canEdit : true,
      canDelete: c.canDelete !== undefined ? c.canDelete : true,
      authorName: c.authorName || c.author || 'Unknown',
      authorPhone: c.authorPhone || c.author || 'Unknown'
    }));
  }

  saveComments(comments: Comment[]): void {
    localStorage.setItem(this.COMMENTS_KEY, JSON.stringify(comments));
  }

  // Current Month
  getCurrentMonth(): { month: number; year: number } {
    const data = localStorage.getItem(this.CURRENT_MONTH_KEY);
    if (data) {
      return JSON.parse(data);
    }
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  }

  setCurrentMonth(month: number, year: number): void {
    localStorage.setItem(this.CURRENT_MONTH_KEY, JSON.stringify({ month, year }));
  }

  // Clear all data (for testing/reset)
  clearAll(): void {
    localStorage.removeItem(this.ADMIN_PHONE_KEY);
    localStorage.removeItem(this.MEMBERS_KEY);
    localStorage.removeItem(this.EXPENSES_KEY);
    localStorage.removeItem(this.COMMENTS_KEY);
    localStorage.removeItem(this.CURRENT_MONTH_KEY);
  }
}

