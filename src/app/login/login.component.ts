import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/Auth.service';
import { ErrorService } from '../services/error.service';
import { apiUrl } from 'src/environments/global';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, AfterViewChecked, AfterViewInit {
  @ViewChild('passwordInput') passwordInput: ElementRef;
  @ViewChild('usernameInput') usernameInput: ElementRef;
  private previousStep: number = 1;
  loginForm: FormGroup;
  currentStep: number = 1;
  username: string = '';
  showUsernameError: boolean = false;
  currentVersion: string;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private errorService: ErrorService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.fetchBackendVersion();
    sessionStorage.setItem('currentVersion', this.currentVersion);
    // setTimeout(() => {
    // this.markFileAsExecuted();
    // this.updateLog();
    // }, 1000);
  }

  private fetchBackendVersion(): void {
    this.http.get<{ currentVersion: string }>(`${apiUrl}/api/health`)
      .subscribe({
        next: (response) => {
          if (response && response.currentVersion) {
            this.currentVersion = response.currentVersion;
            sessionStorage.setItem('currentVersion', this.currentVersion);
          }
        },
        error: (error) => {
          console.error('Failed to fetch backend version:', error);
          // Use default version if API call fails
          this.currentVersion = localStorage.getItem('currentVersion') || '1.0.0';
        }
      });
  }

  ngAfterViewInit(): void {
    // Set initial focus on username field when component first loads
    setTimeout(() => {
      if (this.usernameInput && this.usernameInput.nativeElement) {
        this.usernameInput.nativeElement.focus();
      }
    });
  }

  initializeForm(): void {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  onNext(): void {
    const usernameControl = this.loginForm.get('username');

    if (usernameControl && usernameControl.valid && usernameControl.value.trim() !== '') {
      this.username = usernameControl.value;
      this.previousStep = this.currentStep;
      this.currentStep = 2;
      this.showUsernameError = false;
      console.log('Moving to step 2, username:', this.username); // Debug log
    } else {
      this.errorService.showError('Please enter a valid username', 'error');
      this.showUsernameError = true;
      console.log('Username validation failed:', usernameControl ? usernameControl.errors : 'No control'); // Debug log
    }
  }

  onLogin(): void {
    const passwordControl = this.loginForm.get('password');

    if (passwordControl && passwordControl.valid) {

      this.authService.login(this.username, passwordControl.value).subscribe({
        next: (res) => {
          if (res.success) {
            sessionStorage.setItem('adminId', res.adminId);
            sessionStorage.setItem('username', res.username);
            sessionStorage.setItem('token', res.token);
            sessionStorage.setItem('tokenExpiry', (Date.now() + 24 * 60 * 60 * 1000).toString());
            this.router.navigate(['/intro']);
          } else {
            const errorMessage = res.message || 'Invalid Credentials';
            this.errorService.showError(errorMessage, 'error');
          }
        },
        error: (err) => {
          const errorMessage = (err.error && err.error.message) || 'An error occurred during login';
          this.errorService.showError(errorMessage, 'error');
        }
      });
    } else {
      this.errorService.showError('Please enter a valid password', 'error');
    }
  }

  ngAfterViewChecked(): void {
    // Handle focus when moving to step 2 (password)
    if (this.currentStep === 2 && this.previousStep === 1) {
      setTimeout(() => {
        if (this.passwordInput && this.passwordInput.nativeElement) {
          this.passwordInput.nativeElement.focus();
        }
      });
      this.previousStep = 2;
    }
    // Handle focus when moving back to step 1 (username)
    else if (this.currentStep === 1 && this.previousStep === 2) {
      setTimeout(() => {
        if (this.usernameInput && this.usernameInput.nativeElement) {
          this.usernameInput.nativeElement.focus();
        }
      });
      this.previousStep = 1;
    }
  }

  goBack(): void {
    this.previousStep = this.currentStep;
    this.currentStep = 1;
  }

  get isStep1(): boolean {
    return this.currentStep === 1;
  }

  get isStep2(): boolean {
    return this.currentStep === 2;
  }

  // private markFileAsExecuted(): void {
  //   const request = {
  //     serialNumber: localStorage.getItem('serialNumber') || '',
  //     domain: localStorage.getItem('domain') || '',
  //     appType: localStorage.getItem('appType') || 'NexxLicense',
  //     currentVersion: localStorage.getItem('currentVersion') || '1.0.0'
  //   };
  //   console.log(request);

  //   if (!request.serialNumber || !request.domain) {
  //     console.warn('Missing required parameters for mark-executed API');
  //     return;
  //   }

  //   this.http.post(`${apiUrl}/client/mark-executed`, request).subscribe({
  //     next: () => {
  //       console.log('File marked as executed successfully');
  //     },
  //     error: (error) => {
  //       console.error('Failed to mark file as executed:', error);
  //     }
  //   });
  // }

  // private updateLog(): void {
  //   const params = {
  //     serialNumber: localStorage.getItem('serialNumber') || '',
  //     domain: localStorage.getItem('domain') || '',
  //     AppType: localStorage.getItem('appType') || 'NexxLicense',
  //     currentVersion: localStorage.getItem('currentVersion') || '1.0.0'
  //   };
  //   if (!params.serialNumber || !params.domain) {
  //     console.warn('Missing required parameters for update log API');
  //     return;
  //   }
  //   this.http.get(`${apiUrl}/onprem/mark-updatelog`, { params }).subscribe({
  //     next: () => {
  //       console.log('Update log updated successfully');
  //     },
  //     error: (error) => {
  //       console.error('Failed to update log:', error);
  //     }
  //   });
  // }
}
