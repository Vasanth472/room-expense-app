import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/category.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-management.component.html',
  styleUrls: ['./category-management.component.css']
})
export class CategoryManagementComponent implements OnInit {
  categories: Category[] = [];
  newCategory = {
    name: '',
    color: '#3498db'
  };
  editMode: boolean = false;
  editingCategoryId: string | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';

  // Predefined colors
  predefinedColors = [
    '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
    '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#d35400'
  ];

  constructor(
    private categoryService: CategoryService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.isLoading = false;
      }
    });
  }

  addCategory(): void {
    this.errorMessage = '';
    
    if (!this.newCategory.name.trim()) {
      this.errorMessage = 'Please enter a category name';
      return;
    }

    this.isLoading = true;

    if (this.editMode && this.editingCategoryId) {
      this.categoryService.updateCategory(this.editingCategoryId, {
        name: this.newCategory.name.trim(),
        color: this.newCategory.color,
        createdBy: this.authService.getCurrentPhone() || 'admin'
      }).subscribe({
        next: () => {
          this.editMode = false;
          this.editingCategoryId = null;
          this.newCategory = { name: '', color: '#3498db' };
          this.loadCategories();
        },
        error: (error) => {
          this.errorMessage = error.message || 'Error updating category. Please try again.';
          this.isLoading = false;
        }
      });
    } else {
      this.categoryService.addCategory({
        name: this.newCategory.name.trim(),
        color: this.newCategory.color,
        createdBy: this.authService.getCurrentPhone() || 'admin'
      }).subscribe({
        next: () => {
          this.newCategory = { name: '', color: '#3498db' };
          this.loadCategories();
        },
        error: (error) => {
          this.errorMessage = error.message || 'Error adding category. Please try again.';
          this.isLoading = false;
        }
      });
    }
  }

  editCategory(category: Category): void {
    this.newCategory = {
      name: category.name,
      color: category.color || '#3498db'
    };
    this.editMode = true;
    this.editingCategoryId = category.id;
    this.errorMessage = '';
  }

  cancelEdit(): void {
    this.editMode = false;
    this.editingCategoryId = null;
    this.newCategory = { name: '', color: '#3498db' };
    this.errorMessage = '';
  }

  deleteCategory(id: string): void {
    if (confirm('Are you sure you want to delete this category? This will remove the category from all entries.')) {
      this.isLoading = true;
      this.categoryService.deleteCategory(id).subscribe({
        next: () => {
          this.loadCategories();
        },
        error: (error) => {
          console.error('Error deleting category:', error);
          alert('Error deleting category. Please try again.');
          this.isLoading = false;
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/admin']);
  }

  selectColor(color: string): void {
    this.newCategory.color = color;
  }
}

