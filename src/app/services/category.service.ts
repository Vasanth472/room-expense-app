import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { Category } from '../models/category.model';
import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  // Default categories to seed if DB is empty
  private defaultCategories: Array<Partial<Category>> = [
    { name: 'Oil', color: '#f39c12', createdBy: 'system' },
    { name: 'Current Bill', color: '#3498db', createdBy: 'system' },
    { name: 'Rice', color: '#2ecc71', createdBy: 'system' }
  ];

  constructor(private http: HttpClient) {
    this.initializeCategories();
  }

  private initializeCategories(): void {
    // Try to sync categories from server; if server empty -> seed defaults.
    this.getCategories().subscribe({
      next: cats => {
        if (!cats || cats.length === 0) {
          this.seedDefaultCategories();
        }
      },
      error: err => {
        console.error('Failed to initialize categories from API:', err);
      }
    });
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<any[]>('/api/categories').pipe(
      map(items => Array.isArray(items) ? items.map(i => this.toCategory(i)) : []),
      catchError(err => {
        console.error('Failed to load categories from API:', err);
        return of([]);
      })
    );
  }

  getCategoriesSync(): Category[] {
    console.warn('getCategoriesSync() is not available for API-only mode. Use getCategories() (async).');
    return [];
  }

  getCategoryById(id: string): Observable<Category | null> {
    return this.http.get(`/api/categories/${id}`).pipe(
      map((res: any) => this.toCategory(res)),
      catchError(err => {
        console.error(`Failed to load category ${id} from API:`, err);
        return of(null);
      })
    );
  }

  addCategory(category: Omit<Category, 'id' | 'createdDate'>): Observable<Category> {
    return this.http.post('/api/categories', category).pipe(
      map((res: any) => this.toCategory(res)),
      catchError(err => {
        console.error('Failed to create category via API:', err);
        return throwError(() => err);
      })
    );
  }

  updateCategory(id: string, updates: Partial<Category>): Observable<Category> {
    return this.http.put(`/api/categories/${id}`, updates).pipe(
      map((res: any) => this.toCategory(res)),
      catchError(err => {
        console.error(`Failed to update category ${id} via API:`, err);
        return throwError(() => err);
      })
    );
  }

  deleteCategory(id: string): Observable<boolean> {
    return this.http.delete(`/api/categories/${id}`).pipe(
      map(() => true),
      catchError(err => {
        console.error(`Failed to delete category ${id} via API:`, err);
        return throwError(() => err);
      })
    );
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private toCategory(obj: any): Category {
    return {
      id: obj._id || obj.id || this.generateId(),
      name: obj.name,
      color: obj.color,
      iconUrl: obj.iconUrl || '',
      icon: obj.icon || '',
      allocatedAmount: obj.allocatedAmount || 0,
      createdBy: obj.createdBy || 'system',
      createdDate: obj.createdDate ? new Date(obj.createdDate) : new Date()
    };
  }

  // If server has no categories, seed defaults (best-effort)
  private seedDefaultCategories(): void {
    for (const d of this.defaultCategories) {
      const payload = { name: d.name, color: d.color, createdBy: d.createdBy } as any;
      this.http.post('/api/categories', payload).pipe(
        map((res: any) => this.toCategory(res)),
        catchError(() => of(null))
      ).subscribe();
    }
  }
}

