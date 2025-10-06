import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
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
import { LoadingInterceptor } from './core/interceptors/loading.interceptor';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';
import { LoaderComponent } from './shared/components/loader/loader.component';
import { LoadingService } from './services/loading.service';

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
  }
];

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    LicenseListComponent,
    LicenseDetailComponent,
    ErrorComponent,
    LogoutConfirmationComponent,
    AuditComponent,
    LoaderComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forRoot(routes, { useHash: true }),
    MatDatepickerModule,
    MatFormFieldModule,
    MatNativeDateModule,
    BrowserAnimationsModule
  ],
  providers: [
    ErrorService,
    AuthGuard,
    LoadingService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadingInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
