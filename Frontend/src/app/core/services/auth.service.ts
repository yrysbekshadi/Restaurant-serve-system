import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api';
import { LoginPayload, RegisterPayload, User } from '../models/api.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  get currentUserSnapshot(): User | null {
    return this.currentUserSubject.value;
  }

  getCsrfCookie() {
    return this.http.get<{ message: string }>(`${API_BASE_URL}/auth/csrf/`, {
      withCredentials: true,
    });
  }

  bootstrap(): Observable<User | null> {
    return this.getCsrfCookie().pipe(
      switchMap(() => this.tryRestoreSession())
    );
  }

  register(payload: RegisterPayload) {
    return this.getCsrfCookie().pipe(
      switchMap(() =>
        this.http.post<User>(`${API_BASE_URL}/auth/register/`, payload, {
          withCredentials: true,
        })
      )
    );
  }

  login(payload: LoginPayload) {
    return this.getCsrfCookie().pipe(
      switchMap(() =>
        this.http.post<{ message: string }>(`${API_BASE_URL}/auth/login/`, payload, {
          withCredentials: true,
        })
      ),
      switchMap(() => this.loadProfile())
    );
  }

  logout() {
    return this.getCsrfCookie().pipe(
      switchMap(() =>
        this.http.post<{ message: string }>(
          `${API_BASE_URL}/auth/logout/`,
          {},
          { withCredentials: true }
        )
      ),
      tap(() => this.currentUserSubject.next(null))
    );
  }

  loadProfile() {
    return this.http.get<User>(`${API_BASE_URL}/auth/profile/`, {
      withCredentials: true,
    }).pipe(
      tap((user) => this.currentUserSubject.next(user)),
      catchError((error) => {
        this.currentUserSubject.next(null);
        return throwError(() => error);
      })
    );
  }

  tryRestoreSession(): Observable<User | null> {
    if (this.currentUserSnapshot) {
      return of(this.currentUserSnapshot);
    }

    return this.loadProfile().pipe(
      catchError(() => of(null))
    );
  }
}