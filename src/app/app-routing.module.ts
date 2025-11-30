import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard.component';
import { AddMemberComponent } from './components/admin/add-member.component';
import { ExpenseListComponent } from './components/admin/expense-list.component';
import { AddExpenseComponent } from './components/admin/add-expense.component';
import { CategoryManagementComponent } from './components/admin/category-management.component';
import { UserDashboardComponent } from './components/user/user-dashboard.component';
import { ExpenseViewComponent } from './components/user/expense-view.component';
import { CalendarComponent } from './components/user/calendar.component';
import { AdminCalendarComponent } from './components/admin/calendar/admin-calendar.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

const routes: Routes = [
  { 
    path: '', 
    component: LoginComponent 
  },
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'admin/members',
    component: AddMemberComponent,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'admin/expenses',
    component: ExpenseListComponent,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'admin/expenses/add',
    component: AddExpenseComponent,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'admin/categories',
    component: CategoryManagementComponent,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'admin/calendar',
    component: AdminCalendarComponent,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'user',
    component: UserDashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'user/expenses',
    component: ExpenseViewComponent,
    canActivate: [authGuard]
  },
  {
    path: 'user/calendar',
    component: CalendarComponent,
    canActivate: [authGuard]
  },
  { 
    path: '**', 
    redirectTo: '' 
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { enableTracing: false })],
  exports: [RouterModule]
})
export class AppRoutingModule { }

