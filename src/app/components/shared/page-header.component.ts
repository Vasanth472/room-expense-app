import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.css']
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() showBack = false;
  @Input() showLogout = false;
  @Output() backClick = new EventEmitter<void>();
  @Output() logoutClick = new EventEmitter<void>();

  onBack(): void {
    this.backClick.emit();
  }

  onLogout(): void {
    this.logoutClick.emit();
  }
}
