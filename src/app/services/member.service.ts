import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MemberApiService } from './member-api.service';
import { Member } from '../models/member.model';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class MemberService {
  constructor(
    private memberApiService: MemberApiService,
    private storageService: StorageService
  ) {}

  getMembers(): Observable<Member[]> {
    return this.memberApiService.getMembers();
  }

  getMembersSync(): Member[] {
    // For backward compatibility, get members synchronously from storage
    const data = localStorage.getItem('whatsapp_members');
    if (!data) return [];
    const members = JSON.parse(data);
    return members.map((m: any) => ({
      ...m,
      addedDate: new Date(m.addedDate),
      isAdmin: m.isAdmin || false
    }));
  }

  addMember(member: Omit<Member, 'id' | 'addedDate'>): Observable<Member> {
    return this.memberApiService.addMember(member);
  }

  removeMember(id: string): Observable<boolean> {
    // default to soft-delete; caller may call deleteMemberPermanent if needed
    return this.memberApiService.deleteMember(id, false);
  }

  deleteMemberPermanent(id: string): Observable<boolean> {
    return this.memberApiService.deleteMember(id, true);
  }

  updateMember(id: string, updates: Partial<Member>): Observable<Member> {
    return this.memberApiService.updateMember(id, updates);
  }

  getMemberCount(): number {
    const members = this.getMembersSync();
    return members.length;
  }

  getAdminCount(): number {
    const members = this.getMembersSync();
    return members.filter((m: any) => !!m.isAdmin).length;
  }

  getMemberByPhone(phone: string): Observable<Member | null> {
    return this.memberApiService.getMemberByPhone(phone);
  }

  isMember(phone: string): Observable<boolean> {
    return this.memberApiService.isMember(phone);
  }
}
