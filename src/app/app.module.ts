import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { LicenseListComponent } from './license-list/license-list.component';
import { LicenseDetailComponent } from './license-detail/license-detail.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'licenses', component: LicenseListComponent },
  { path: 'license/:id', component: LicenseDetailComponent },
  { path: 'license/new', component: LicenseDetailComponent }, // Creating new license
  { path: 'license/:id/edit', component: LicenseDetailComponent }, // Editing existing license
  { path: 'license/:id/view', component: LicenseDetailComponent }, // Viewing license details
  { path: 'license/:id/delete', component: LicenseDetailComponent }, // Deleting license
  { path: 'license/:id/modules', component: LicenseDetailComponent }, // Managing license modules
];

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    LicenseListComponent,
    LicenseDetailComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule, // ✅ Added here
    RouterModule.forRoot(routes, { enableTracing: false })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
