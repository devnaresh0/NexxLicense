import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { LicenseListComponent } from './license-list/license-list.component';
import { LicenseDetailComponent } from './license-detail/license-detail.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ErrorComponent } from './shared/error/error.component';
import { LogoutConfirmationComponent } from './shared/logout-confirmation/logout-confirmation.component';
import { AuthGuard } from './guards/auth.guard';
import { ErrorService } from './services/error.service';
import { AuditComponent } from './audit/audit.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'licenses',
    component: LicenseListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'license/:id',
    component: LicenseDetailComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'license/:id/edit',
    component: LicenseDetailComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'audit/:domain',
    component: AuditComponent,
    canActivate: [AuthGuard]
  },

  {
    path: 'license/:id/view',
    component: LicenseDetailComponent,
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  declarations: [
    AppComponent,
    ErrorComponent,
    LoginComponent,
    LicenseListComponent,
    LicenseDetailComponent,
    LogoutConfirmationComponent,
    AuditComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forRoot(routes, { useHash: true }),
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    BrowserAnimationsModule
  ],
  providers: [
    ErrorService,
    AuthGuard
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
