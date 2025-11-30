export interface CommentReply {
  id: string;
  adminId?: string;
  adminName?: string;
  text: string;
  addedDate: string | Date;
}

export interface CommentItem {
  id: string;
  authorId?: string;
  authorName?: string;
  authorPhone?: string;
  text: string;
  addedDate: string | Date;
  replies?: CommentReply[];
}

export interface CommentEntry {
  id: string;
  date: Date | string;
  categoryId: string;
  categoryName: string;
  text: string;
  userId: string;
  userPhone: string;
  userName: string;
  timestamp: Date | string;
  canEdit: boolean;
  canDelete: boolean;
  // optional server-backed fields
  price?: number;
  comments?: CommentItem[];
}
