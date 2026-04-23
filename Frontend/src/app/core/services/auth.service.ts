import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api';
import { LoginPayload, RegisterPayload, User } from '../models/api.models';

interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  get currentUserSnapshot(): User | null {
    return this.currentUserSubject.value;
  }

  get accessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  private setTokens(access: string, refresh: string) {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, access);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refresh);
  }

  private clearTokens() {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  bootstrap(): Observable<User | null> {
    if (!this.accessToken && !this.refreshToken) {
      this.currentUserSubject.next(null);
      return of(null);
    }

    return this.tryRestoreSession();
  }

  register(payload: RegisterPayload) {
    return this.http.post<User>(`${API_BASE_URL}/auth/register/`, payload);
  }

  login(payload: LoginPayload): Observable<User> {
    return this.http.post<LoginResponse>(`${API_BASE_URL}/auth/login/`, payload).pipe(
      tap((response) => {
        this.setTokens(response.access, response.refresh);
        this.currentUserSubject.next(response.user);
      }),
      map((response) => response.user)
    );
  }

  logout(): Observable<{ message: string }> {
    const refresh = this.refreshToken;

    if (!refresh) {
      this.clearTokens();
      this.currentUserSubject.next(null);
      return of({ message: 'Logged out locally' });
    }

    return this.http.post<{ message: string }>(`${API_BASE_URL}/auth/logout/`, {
      refresh,
    }).pipe(
      tap(() => {
        this.clearTokens();
        this.currentUserSubject.next(null);
      }),
      catchError((error) => {
        this.clearTokens();
        this.currentUserSubject.next(null);
        return throwError(() => error);
      })
    );
  }

  loadProfile(): Observable<User> {
    return this.http.get<User>(`${API_BASE_URL}/auth/profile/`).pipe(
      tap((user) => this.currentUserSubject.next(user)),
      catchError((error) => {
        this.currentUserSubject.next(null);
        return throwError(() => error);
      })
    );
  }

  refreshAccessToken(): Observable<string> {
    const refresh = this.refreshToken;

    if (!refresh) {
      return throwError(() => new Error('No refresh token found.'));
    }

    return this.http.post<{ access: string }>(`${API_BASE_URL}/auth/token/refresh/`, {
      refresh,
    }).pipe(
      tap((response) => {
        localStorage.setItem(this.ACCESS_TOKEN_KEY, response.access);
      }),
      map((response) => response.access)
    );
  }

  tryRestoreSession(): Observable<User | null> {
    if (this.currentUserSnapshot) {
      return of(this.currentUserSnapshot);
    }

    if (!this.accessToken && !this.refreshToken) {
      this.currentUserSubject.next(null);
      return of(null);
    }

    return this.loadProfile().pipe(
      catchError(() =>
        this.refreshAccessToken().pipe(
          switchMap(() => this.loadProfile()),
          catchError(() => {
            this.clearTokens();
            this.currentUserSubject.next(null);
            return of(null);
          })
        )
      )
    );
  }
}