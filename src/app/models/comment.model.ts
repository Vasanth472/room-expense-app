export interface Comment {
  id: string;
  expenseId: string;
  text: string;
  author: string;
  authorName: string;
  authorPhone: string;
  timestamp: Date;
  date: Date;
  canEdit: boolean;
  canDelete: boolean;
}
