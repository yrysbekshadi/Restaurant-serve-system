import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CreateReservationPayload,
  RestaurantDetail as RestaurantDetailModel,
  Table,
} from '../../core/models/api.models';
import { AuthService } from '../../core/services/auth.service';
import { ReservationService } from '../../core/services/reservation.service';
import { RestaurantService } from '../../core/services/restaurant.service';

@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './restaurant-detail.html',
  styleUrl: './restaurant-detail.css',
})
export class RestaurantDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private restaurantService = inject(RestaurantService);
  private reservationService = inject(ReservationService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  restaurant: RestaurantDetailModel | null = null;
  availableTables: Table[] = [];
  selectedTableId: number | null = null;

  loading = false;
  checkingTables = false;
  booking = false;
  error = '';
  success = '';

  minDate = new Date().toISOString().split('T')[0];

  bookingForm = this.fb.nonNullable.group({
    reservation_date: ['', [Validators.required]],
    reservation_time: ['', [Validators.required]],
    guests_count: [2, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadRestaurant(id);
  }

  private get restaurantId(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  loadRestaurant(id: number) {
    this.loading = true;
    this.restaurantService.getRestaurant(id).subscribe({
      next: (data) => {
        this.restaurant = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Не удалось загрузить ресторан.';
      },
    });
  }

  checkTables() {
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      return;
    }

    const formValue = this.bookingForm.getRawValue();
    this.checkingTables = true;
    this.error = '';
    this.success = '';
    this.selectedTableId = null;

    this.restaurantService.getAvailableTables(
      this.restaurantId,
      formValue.reservation_date,
      formValue.reservation_time,
      Number(formValue.guests_count)
    ).subscribe({
      next: (tables) => {
        this.availableTables = tables;
        this.checkingTables = false;
      },
      error: (err) => {
        this.checkingTables = false;
        this.error = err?.error?.error || 'Не удалось получить список свободных столов.';
      },
    });
  }

  selectTable(tableId: number) {
    this.selectedTableId = tableId;
  }

  submitReservation() {
    const user = this.auth.currentUserSnapshot;

    if (!user) {
      this.router.navigateByUrl('/login');
      return;
    }

    if (user.role !== 'client') {
      this.error = 'Бронировать стол может только пользователь с ролью client.';
      return;
    }

    if (!this.restaurant) {
      return;
    }

    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      return;
    }

    if (!this.selectedTableId) {
      this.error = 'Сначала выбери стол.';
      return;
    }

    const formValue = this.bookingForm.getRawValue();

    const payload: CreateReservationPayload = {
      restaurant: this.restaurantId,
      table: this.selectedTableId,
      reservation_date: formValue.reservation_date,
      reservation_time: formValue.reservation_time,
      guests_count: Number(formValue.guests_count),
    };

    this.booking = true;
    this.error = '';
    this.success = '';

    this.reservationService.createReservation(payload).subscribe({
      next: () => {
        this.booking = false;
        this.success = 'Бронь создана.';
        this.router.navigateByUrl('/my-reservations');
      },
      error: (err) => {
        this.booking = false;
        this.error = JSON.stringify(err?.error ?? { error: 'Не удалось создать бронь.' });
      },
    });
  }
}