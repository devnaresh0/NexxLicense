import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/Auth.service'; // adjust path


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  currentStep: number = 1;
  username: string = '';
  showUsernameError: boolean = false;
  showPasswordError: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
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
      this.currentStep = 2;
      this.showUsernameError = false;
      console.log('Moving to step 2, username:', this.username); // Debug log
    } else {
      this.showUsernameError = true;
      console.log('Username validation failed:', usernameControl ? usernameControl.errors : 'No control'); // Debug log
    }
  }

  onLogin(): void {
    const passwordControl = this.loginForm.get('password');

    if (passwordControl && passwordControl.valid) {
      this.showPasswordError = false;
      // Handle login logic here
      console.log('Login attempt:', {
        username: this.username,
        password: passwordControl.value
      });
      
      // Example: this.authService.login(this.username, passwordControl.value);
      this.authService.login(this.username, passwordControl.value).subscribe({
        next: (res) => {
          if (res.success) {
            console.log('Login successful:', res);
            this.router.navigate(['/licenses']); // redirect
          } else {
            console.error('Login failed:', res.message || 'Invalid credentials');
            this.showPasswordError = true;
          }
        },
        error: (err) => {
          console.error('API error:', err);
          this.showPasswordError = true;
        }
      });
    } else {
      this.showPasswordError = true;
    }
  }

  goBack(): void {
    this.currentStep = 1;
    this.showPasswordError = false;
  }

  forgotPassword(): void {
    // Handle forgot password logic
    console.log('Forgot password clicked');
    // Example: this.router.navigate(['/forgot-password']);
  }

  get isStep1(): boolean {
    return this.currentStep === 1;
  }

  get isStep2(): boolean {
    return this.currentStep === 2;
  }
}