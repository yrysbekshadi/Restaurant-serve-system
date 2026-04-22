import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../config/api';
import {
  CategoryPayload,
  Dish,
  DishPayload,
  MenuCategory,
  Reservation,
  Restaurant,
  RestaurantProfilePayload,
  Table,
  TablePayload,
} from '../models/api.models';

@Injectable({
  providedIn: 'root',
})
export class OwnerService {
  private http = inject(HttpClient);

  createRestaurantProfile(payload: RestaurantProfilePayload) {
    return this.http.post<Restaurant>(`${API_BASE_URL}/restaurant/profile/`, payload);
  }

  getMyProfile() {
    return this.http.get<Restaurant>(`${API_BASE_URL}/restaurant/profile/me/`);
  }

  updateMyProfile(payload: Partial<RestaurantProfilePayload>) {
    return this.http.patch<Restaurant>(`${API_BASE_URL}/restaurant/profile/me/`, payload);
  }

  getTables() {
    return this.http.get<Table[]>(`${API_BASE_URL}/restaurant/tables/`);
  }

  addTable(payload: TablePayload) {
    return this.http.post<Table>(`${API_BASE_URL}/restaurant/tables/`, payload);
  }

  deleteTable(id: number) {
    return this.http.delete<void>(`${API_BASE_URL}/restaurant/tables/${id}/`);
  }

  getCategories() {
    return this.http.get<MenuCategory[]>(`${API_BASE_URL}/restaurant/categories/`);
  }

  addCategory(payload: CategoryPayload) {
    return this.http.post<MenuCategory>(`${API_BASE_URL}/restaurant/categories/`, payload);
  }

  getDishes() {
    return this.http.get<Dish[]>(`${API_BASE_URL}/restaurant/dishes/`);
  }

  addDish(payload: DishPayload) {
    return this.http.post<Dish>(`${API_BASE_URL}/restaurant/dishes/`, payload);
  }

  deleteDish(id: number) {
    return this.http.delete<void>(`${API_BASE_URL}/restaurant/dishes/${id}/`);
  }

  getIncomingReservations() {
    return this.http.get<Reservation[]>(`${API_BASE_URL}/restaurant/reservations/`);
  }

  confirmReservation(id: number) {
    return this.http.patch<{ message: string }>(
      `${API_BASE_URL}/restaurant/reservations/${id}/confirm/`,
      {}
    );
  }

  cancelReservation(id: number, cancellation_reason: string) {
    return this.http.patch<{ message: string }>(
      `${API_BASE_URL}/restaurant/reservations/${id}/cancel/`,
      { cancellation_reason }
    );
  }
}