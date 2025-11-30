import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Expense } from '../../models/expense.model';
import { Category } from '../../models/category.model';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-lg p-6">
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700">Category</label>
        <select
          [(ngModel)]="expense.categoryId"
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
          <option [ngValue]="null">Select a category</option>
          <option *ngFor="let cat of categories" [value]="cat.id">
            {{ cat.name }}
          </option>
        </select>
      </div>

      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700">Amount (₹)</label>
        <input
          type="number"
          [(ngModel)]="expense.amount"
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          min="0"
        />
      </div>

      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700">Description</label>
        <input
          type="text"
          [(ngModel)]="expense.description"
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div class="flex justify-end space-x-3">
        <button
          (click)="onCancel.emit()"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">
          Cancel
        </button>
        <button
          (click)="onSave()"
          class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md">
          {{ expense.id ? 'Update' : 'Add' }} Expense
        </button>
      </div>
    </div>
  `
})
export class ExpenseFormComponent {
  @Input() expense!: Partial<Expense>;
  @Input() categories: Category[] = [];
  @Output() onSave = new EventEmitter<Partial<Expense>>();
  @Output() onCancel = new EventEmitter<void>();

  save() {
    if (this.validateExpense()) {
      this.onSave.emit(this.expense);
    }
  }

  private validateExpense(): boolean {
    return !!(
      this.expense.categoryId &&
      this.expense.amount &&
      this.expense.amount > 0 &&
      this.expense.description
    );
  }
}