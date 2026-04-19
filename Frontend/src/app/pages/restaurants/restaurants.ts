import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Restaurant } from '../../core/models/api.models';
import { RestaurantService } from '../../core/services/restaurant.service';

@Component({
  selector: 'app-restaurants',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './restaurants.html',
  styleUrl: './restaurants.css',
})
export class Restaurants implements OnInit {
  private fb = inject(FormBuilder);
  private restaurantService = inject(RestaurantService);

  restaurants: Restaurant[] = [];
  loading = false;
  error = '';

  form = this.fb.nonNullable.group({
    search: '',
  });

  ngOnInit(): void {
    this.loadRestaurants();
  }

  loadRestaurants() {
    this.loading = true;
    this.error = '';

    this.restaurantService.getRestaurants(this.form.controls.search.value).subscribe({
      next: (data) => {
        this.restaurants = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Не удалось загрузить рестораны.';
        this.loading = false;
      },
    });
  }
}