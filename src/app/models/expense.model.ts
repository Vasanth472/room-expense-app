export interface Expense {
  id: string;
  date: Date;
  categoryId: string;
  categoryName: string;
  amount: number;
  description: string;
  addedBy: string;
  addedDate: Date;
}
