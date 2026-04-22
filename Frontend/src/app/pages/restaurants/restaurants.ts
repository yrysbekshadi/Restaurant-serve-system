import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Restaurant } from '../../core/models/api.models';
import { RestaurantService } from '../../core/services/restaurant.service';

@Component({
  selector: 'app-restaurants',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './restaurants.html',
  styleUrl: './restaurants.css',
})
export class Restaurants implements OnInit {
  private restaurantService = inject(RestaurantService);

  restaurants: Restaurant[] = [];
  filteredRestaurants: Restaurant[] = [];

  loading = false;
  error = '';

  searchText = '';
  districtFilter = '';
  cuisineFilter = '';
  onlyOpenNow = false;

  availableDistricts: string[] = [];
  availableCuisines: string[] = [];

  ngOnInit(): void {
    this.loadRestaurants();
  }

  loadRestaurants() {
    this.loading = true;
    this.error = '';

    this.restaurantService.getRestaurants().subscribe({
      next: (data) => {
        this.restaurants = data;
        this.availableDistricts = [...new Set(data.map((r) => r.district).filter(Boolean))].sort();
        this.availableCuisines = [...new Set(data.map((r) => r.cuisine_type).filter(Boolean))].sort();
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load restaurants.';
        this.loading = false;
      },
    });
  }

  applyFilters() {
    const search = this.searchText.trim().toLowerCase();
    const district = this.districtFilter.trim().toLowerCase();
    const cuisine = this.cuisineFilter.trim().toLowerCase();

    this.filteredRestaurants = this.restaurants.filter((restaurant) => {
      const matchesSearch =
        !search ||
        restaurant.name.toLowerCase().includes(search) ||
        restaurant.address.toLowerCase().includes(search);

      const matchesDistrict =
        !district || restaurant.district.toLowerCase() === district;

      const matchesCuisine =
        !cuisine || restaurant.cuisine_type.toLowerCase() === cuisine;

      const matchesOpenNow =
        !this.onlyOpenNow || this.isRestaurantOpenNow(restaurant);

      return matchesSearch && matchesDistrict && matchesCuisine && matchesOpenNow;
    });
  }

  resetFilters() {
    this.searchText = '';
    this.districtFilter = '';
    this.cuisineFilter = '';
    this.onlyOpenNow = false;
    this.applyFilters();
  }

  isRestaurantOpenNow(restaurant: Restaurant): boolean {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const openingMinutes = this.parseTimeToMinutes(restaurant.opening_time);
    const closingMinutes = this.parseTimeToMinutes(restaurant.closing_time);

    if (openingMinutes < closingMinutes) {
      return currentMinutes >= openingMinutes && currentMinutes < closingMinutes;
    }

    return currentMinutes >= openingMinutes || currentMinutes < closingMinutes;
  }

  private parseTimeToMinutes(value: string): number {
    const [hours, minutes] = value.slice(0, 5).split(':').map(Number);
    return hours * 60 + minutes;
  }
}