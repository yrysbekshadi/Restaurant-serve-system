import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpClient,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function setAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function shouldSkipAuth(req: HttpRequest<unknown>): boolean {
  return req.url.includes('/auth/login/')
    || req.url.includes('/auth/register/')
    || req.url.includes('/auth/token/refresh/')
    || req.url.includes('/auth/csrf/');
}

export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const http = inject(HttpClient);
  const accessToken = getAccessToken();

  let authReq = req;

  if (!shouldSkipAuth(req) && accessToken) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const refreshToken = getRefreshToken();

      if (
        error.status !== 401 ||
        !refreshToken ||
        shouldSkipAuth(req)
      ) {
        return throwError(() => error);
      }

      return http.post<{ access: string }>(
        `${API_BASE_URL}/auth/token/refresh/`,
        { refresh: refreshToken }
      ).pipe(
        switchMap((response) => {
          setAccessToken(response.access);

          const retryReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${response.access}`,
            },
          });

          return next(retryReq);
        }),
        catchError((refreshError) => {
          clearTokens();
          return throwError(() => refreshError);
        })
      );
    })
  );
};