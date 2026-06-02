export type PasswordResetRequestStatus = 'pending' | 'resolved' | 'rejected';

export interface PasswordResetRequest {
  id: string;
  memberId: string;
  memberName: string;
  phone: string;
  message: string;
  status: PasswordResetRequestStatus;
  requestedAt: string | Date;
  resolvedAt?: string | Date | null;
}
