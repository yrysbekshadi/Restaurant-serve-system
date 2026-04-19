import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_BASE_URL } from '../config/api';
import { Restaurant, RestaurantDetail, Table } from '../models/api.models';

@Injectable({
  providedIn: 'root',
})
export class RestaurantService {
  private http = inject(HttpClient);

  getRestaurants(search = '') {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<Restaurant[]>(`${API_BASE_URL}/restaurants/`, { params });
  }

  getRestaurant(id: number) {
    return this.http.get<RestaurantDetail>(`${API_BASE_URL}/restaurants/${id}/`);
  }

  getAvailableTables(restaurantId: number, date: string, time: string, guests: number) {
    const params = new HttpParams()
      .set('date', date)
      .set('time', time)
      .set('guests', guests);

    return this.http.get<Table[]>(
      `${API_BASE_URL}/restaurants/${restaurantId}/available-tables/`,
      { params }
    );
  }
}