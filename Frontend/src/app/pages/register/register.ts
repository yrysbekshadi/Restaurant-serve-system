import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

function allowedEmailDomainsValidator(domains: string[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '').trim().toLowerCase();

    if (!value) {
      return null;
    }

    const parts = value.split('@');

    if (parts.length !== 2) {
      return null;
    }

    const domain = parts[1];

    return domains.includes(domain) ? null : { emailDomain: true };
  };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  error = '';
  success = '';
  loading = false;

  form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    email: [
      '',
      [
        Validators.required,
        Validators.email,
        allowedEmailDomainsValidator([
          'gmail.com',
          'mail.ru',
          'yandex.ru',
          'outlook.com',
          'icloud.com',
        ]),
      ],
    ],
    phone: ['+7', [Validators.required, Validators.pattern(/^\+7\d{10}$/)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['client' as 'client' | 'restaurant', [Validators.required]],
  });

  ensurePhonePrefix() {
    const current = this.form.controls.phone.value || '';
    if (!current.startsWith('+7')) {
      this.form.controls.phone.setValue('+7');
    }
  }

  normalizePhone() {
    const current = this.form.controls.phone.value || '';
    const digitsOnly = current.replace(/\D/g, '');

    let localDigits = digitsOnly;

    if (localDigits.startsWith('7')) {
      localDigits = localDigits.slice(1);
    }

    localDigits = localDigits.slice(0, 10);

    this.form.controls.phone.setValue(`+7${localDigits}`, { emitEvent: false });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.error = '';
    this.success = '';
    this.loading = true;

    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Аккаунт создан. Теперь войди в систему.';
        this.router.navigateByUrl('/login');
      },
      error: (err) => {
        this.loading = false;
        this.error = JSON.stringify(err?.error ?? { error: 'Registration failed.' });
      },
    });
  }
}