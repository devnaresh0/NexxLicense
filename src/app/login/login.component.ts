import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/Auth.service';
import { ErrorService } from '../services/error.service';

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
  showPasswordError: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private errorService: ErrorService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    // this.checkExistingAuth();
  }

  ngAfterViewInit(): void {
    // Set initial focus on username field when component first loads
    setTimeout(() => {
      if (this.usernameInput && this.usernameInput.nativeElement) {
        this.usernameInput.nativeElement.focus();
      }
    });
  }

  // private checkExistingAuth(): void {
  //   const adminId = localStorage.getItem('adminId');
  //   const username = localStorage.getItem('username');
    
  //   if (adminId && username) {
  //     this.errorService.showError(`Logging in as existing user ${username}`, 'success');
  //     this.router.navigate(['/licenses']);
  //   }
  // }

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
      this.showPasswordError = false;
      
      this.authService.login(this.username, passwordControl.value).subscribe({
        next: (res) => {
          if (res.success) {
            localStorage.setItem('adminId', res.adminId);
            localStorage.setItem('username', res.username);
            this.router.navigate(['/licenses']);
          } else {
            const errorMessage = res.message || 'Invalid Credentials';
            this.errorService.showError(errorMessage, 'error');
            this.showPasswordError = true;
          }
        },
        error: (err) => {
          const errorMessage = (err.error && err.error.message) || 'An error occurred during login';
          this.errorService.showError(errorMessage, 'error');
          this.showPasswordError = true;
        }
      });
    } else {
      this.errorService.showError('Please enter a valid password', 'error');
      this.showPasswordError = true;
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
    this.showPasswordError = false;
  }

  get isStep1(): boolean {
    return this.currentStep === 1;
  }

  get isStep2(): boolean {
    return this.currentStep === 2;
  }
}