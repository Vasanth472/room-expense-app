import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseService } from '../../services/expense.service';
import { CategoryService } from '../../services/category.service';
import { AuthService } from '../../services/auth.service';
import { Expense } from '../../models/expense.model';
import { Category } from '../../models/category.model';

@Component({
  selector: 'app-add-expense',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-expense.component.html',
  styleUrls: ['./add-expense.component.css']
})
export class AddExpenseComponent implements OnInit {
  categories: Category[] = [];
  newExpense = {
    date: new Date().toISOString().split('T')[0],
    categoryId: '',
    amount: 0,
    description: ''
  };
  editMode: boolean = false;
  editingExpenseId: string | null = null;

  constructor(
    private expenseService: ExpenseService,
    private categoryService: CategoryService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    const expenseId = this.route.snapshot.queryParams['id'];
    if (expenseId) {
      this.loadExpenseForEdit(expenseId);
    }
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe(categories => {
      this.categories = categories;
      if (categories.length > 0 && !this.newExpense.categoryId) {
        this.newExpense.categoryId = categories[0].id;
      }
    });
  }

  loadExpenseForEdit(id: string): void {
    this.expenseService.getExpenses().subscribe(expenses => {
      const expense = expenses.find(e => e.id === id);
      if (expense) {
        this.newExpense = {
          date: new Date(expense.date).toISOString().split('T')[0],
          categoryId: expense.categoryId,
          amount: expense.amount,
          description: expense.description
        };
        this.editMode = true;
        this.editingExpenseId = id;
      }
    });
  }

  addExpense(): void {
    if (!this.newExpense.date || this.newExpense.amount <= 0 || !this.newExpense.categoryId) {
      alert('Please fill in all required fields');
      return;
    }

    const expenseData = {
      date: new Date(this.newExpense.date),
      categoryId: this.newExpense.categoryId,
      amount: this.newExpense.amount,
      description: this.newExpense.description.trim(),
      addedBy: this.authService.getCurrentPhone() || 'Admin'
    };

    const navigateBack = () => {
      this.resetForm();
      this.router.navigate(['/admin/expenses']);
    };

    if (this.editMode && this.editingExpenseId) {
      this.expenseService.updateExpense(this.editingExpenseId, expenseData).subscribe({
        next: () => {
          this.editMode = false;
          this.editingExpenseId = null;
          navigateBack();
        },
        error: err => alert('Failed to update expense')
      });
    } else {
      this.expenseService.addExpense(expenseData).subscribe({
        next: () => navigateBack(),
        error: err => alert('Failed to add expense')
      });
    }
  }

  resetForm(): void {
    this.newExpense = {
      date: new Date().toISOString().split('T')[0],
      categoryId: this.categories.length > 0 ? this.categories[0].id : '',
      amount: 0,
      description: ''
    };
  }

  cancel(): void {
    this.router.navigate(['/admin/expenses']);
  }
}
