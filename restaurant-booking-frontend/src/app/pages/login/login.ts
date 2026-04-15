import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  error = '';
  loading = false;

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.error = '';
    this.loading = true;

    this.auth.login(this.form.getRawValue()).subscribe({
      next: (user) => {
        this.loading = false;
        if (user.role === 'restaurant') {
          this.router.navigateByUrl('/restaurant-dashboard');
        } else {
          this.router.navigateByUrl('/restaurants');
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.error || 'Login failed.';
      },
    });
  }
}