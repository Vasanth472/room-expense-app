// export interface CommentEntry {
//   id: string;
//   date: Date;
//   categoryId: string;
//   categoryName: string;
//   text: string;
//   userId: string;
//   userPhone: string;
//   userName: string;
//   timestamp: Date;
//   canEdit: boolean;
//   canDelete: boolean;
// }
export interface ExpenseEntry {
  id: string;
  text: string;
  categoryId: string;
  userId: string;
  userPhone: string;
  userName: string;
  date: string | Date;
  timestamp: string | Date;
  price: number;
  canEdit: boolean;
  canDelete: boolean;
}

