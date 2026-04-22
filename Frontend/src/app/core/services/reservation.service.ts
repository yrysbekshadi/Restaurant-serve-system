import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../config/api';
import { CreateReservationPayload, Reservation } from '../models/api.models';

@Injectable({
  providedIn: 'root',
})
export class ReservationService {
  private http = inject(HttpClient);

  createReservation(payload: CreateReservationPayload) {
    return this.http.post<Reservation>(`${API_BASE_URL}/reservations/`, payload);
  }

  getMyReservations() {
    return this.http.get<Reservation[]>(`${API_BASE_URL}/reservations/my/`);
  }

  cancelMyReservation(id: number) {
    return this.http.patch<{ message: string }>(
      `${API_BASE_URL}/reservations/my/${id}/cancel/`,
      {}
    );
  }
}