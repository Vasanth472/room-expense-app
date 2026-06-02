export interface ExpenseHistorySnapshot {
  amount: number;
  description: string;
  date: string | Date;
  categoryId?: string;
  categoryName: string;
  memberId?: string;
  addedBy?: string;
  addedDate?: string | Date;
}

export interface ExpenseHistoryRecord {
  id: string;
  resetAt: string | Date;
  resetByPhone: string;
  resetByName: string;
  fullAmount: number;
  totalExpenses: number;
  totalMembers: number;
  balance: number;
  expenseCount: number;
  expenses?: ExpenseHistorySnapshot[];
}
