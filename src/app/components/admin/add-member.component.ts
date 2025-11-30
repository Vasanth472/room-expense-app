import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MemberService } from '../../services/member.service';
import { AuthService } from '../../services/auth.service';
import { Member } from '../../models/member.model';

@Component({
  selector: 'app-add-member',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-member.component.html',
  styleUrls: ['./add-member.component.css']
})
export class AddMemberComponent implements OnInit {
  members: Member[] = [];
  newMember = {
    name: '',
    phone: '',
    isAdmin: false
  };
  editMode: boolean = false;
  editingMemberId: string | null = null;
  isLoading: boolean = false;
  isAdmin: boolean = false;

  constructor(
    private memberService: MemberService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    if (!this.isAdmin) {
      alert('You do not have permission to manage members. Admin access required.');
      this.router.navigate(['/']);
      return;
    }
    this.loadMembers();
  }

  loadMembers(): void {
    this.isLoading = true;
    this.memberService.getMembers().subscribe({
      next: (members) => {
        this.members = members;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading members:', error);
        this.isLoading = false;
      }
    });
  }

  addMember(): void {
    if (!this.newMember.name.trim() || !this.newMember.phone.trim()) {
      alert('Please fill in all fields');
      return;
    }

    // Validate phone number
    if (this.newMember.phone.trim().length !== 10 || !/^\d+$/.test(this.newMember.phone.trim())) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }

    this.isLoading = true;

    if (this.editMode && this.editingMemberId) {
      this.memberService.updateMember(this.editingMemberId, {
        name: this.newMember.name.trim(),
        phone: this.newMember.phone.trim(),
        isAdmin: this.newMember.isAdmin
      }).subscribe({
        next: () => {
          this.editMode = false;
          this.editingMemberId = null;
          this.newMember = { name: '', phone: '', isAdmin: false };
          this.loadMembers();
        },
        error: (error) => {
          console.error('Error updating member:', error);
          alert('Error updating member. Please try again.');
          this.isLoading = false;
        }
      });
    } else {
      // Check if phone already exists
      const phoneExists = this.members.some(m => m.phone === this.newMember.phone.trim());
      if (phoneExists) {
        alert('A member with this phone number already exists');
        this.isLoading = false;
        return;
      }

      this.memberService.addMember({
        name: this.newMember.name.trim(),
        phone: this.newMember.phone.trim(),
        isAdmin: this.newMember.isAdmin
      }).subscribe({
        next: () => {
          this.newMember = { name: '', phone: '', isAdmin: false };
          this.loadMembers();
        },
        error: (error) => {
          console.error('Error adding member:', error);
          // Prefer backend-provided message when available
          let msg = 'Error adding member. Please try again.';
          if (error && error.error) {
            // API error shape may be { error: 'msg' } or { message: 'msg' }
            msg = error.error.error || error.error.message || JSON.stringify(error.error) || msg;
          } else if (error && error.message) {
            msg = error.message;
          }
          alert(msg);
          this.isLoading = false;
        }
      });
    }
  }

  editMember(member: Member): void {
    this.newMember = {
      name: member.name,
      phone: member.phone,
      isAdmin: member.isAdmin
    };
    this.editMode = true;
    this.editingMemberId = member.id;
  }

  cancelEdit(): void {
    this.editMode = false;
    this.editingMemberId = null;
    this.newMember = { name: '', phone: '', isAdmin: false };
  }

  removeMember(id: string): void {
    if (!this.isAdmin) {
      alert('You do not have permission to remove members. Admin access required.');
      return;
    }
    if (confirm('Are you sure you want to remove this member? This will revoke their access to the application.')) {
      // Ask if admin wants permanent deletion from DB
      const permanent = confirm('Permanently delete this member from the database? (This cannot be undone)');
      this.isLoading = true;
      const obs = permanent ? this.memberService.deleteMemberPermanent(id) : this.memberService.removeMember(id);
      obs.subscribe({
        next: () => {
          this.loadMembers();
        },
        error: (error) => {
          console.error('Error removing member:', error);
          let msg = 'Error removing member. Please try again.';
          if (error && error.status === 403) {
            msg = 'Admin privileges required to remove members.';
          } else if (error && error.error) {
            msg = error.error.error || error.error.message || msg;
          } else if (error && error.message) {
            msg = error.message;
          }
          alert(msg);
          this.isLoading = false;
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/admin']);
  }
}
