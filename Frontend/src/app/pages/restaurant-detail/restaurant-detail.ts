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
  infoMessage = '';
  hasCheckedTables = false;

  minDate = new Date().toISOString().split('T')[0];
  readonly reservationDurationMinutes = 90;

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

  get workingHoursLabel(): string {
    if (!this.restaurant) {
      return '';
    }

    return `${this.formatTime(this.restaurant.opening_time)} - ${this.formatTime(this.restaurant.closing_time)}`;
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

  private formatTime(value: string): string {
    return value.slice(0, 5);
  }

  private parseTimeToMinutes(value: string): number {
    const [hours, minutes] = value.slice(0, 5).split(':').map(Number);
    return hours * 60 + minutes;
  }

  private getNowLocalDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getNowLocalMinutes(): number {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  private validateBookingInputs(): string | null {
    if (!this.restaurant) {
      return 'Ресторан не загружен.';
    }

    const formValue = this.bookingForm.getRawValue();
    const reservationDate = formValue.reservation_date;
    const reservationTime = formValue.reservation_time;
    const guestsCount = Number(formValue.guests_count);

    if (!reservationDate || !reservationTime) {
      return 'Выбери дату и время.';
    }

    if (!Number.isFinite(guestsCount) || guestsCount < 1) {
      return 'Количество гостей должно быть не меньше 1.';
    }

    const today = this.getNowLocalDate();
    const selectedTimeMinutes = this.parseTimeToMinutes(reservationTime);

    if (reservationDate < today) {
      return 'Нельзя бронировать на прошедшую дату.';
    }

    if (reservationDate === today && selectedTimeMinutes <= this.getNowLocalMinutes()) {
      return 'Нельзя бронировать на прошедшее время.';
    }

    const openingMinutes = this.parseTimeToMinutes(this.restaurant.opening_time);
    const closingMinutes = this.parseTimeToMinutes(this.restaurant.closing_time);

    const isOvernight = openingMinutes >= closingMinutes;

    let withinWorkingHours = false;
    let reservationEndMinutes = 0;
    let windowEndMinutes = 0;

    if (!isOvernight) {
      withinWorkingHours = selectedTimeMinutes >= openingMinutes && selectedTimeMinutes < closingMinutes;
      reservationEndMinutes = selectedTimeMinutes + this.reservationDurationMinutes;
      windowEndMinutes = closingMinutes;
    } else {
      if (selectedTimeMinutes >= openingMinutes) {
        withinWorkingHours = true;
        reservationEndMinutes = selectedTimeMinutes + this.reservationDurationMinutes;
        windowEndMinutes = closingMinutes + 24 * 60;
      } else if (selectedTimeMinutes < closingMinutes) {
        withinWorkingHours = true;
        reservationEndMinutes = selectedTimeMinutes + 24 * 60 + this.reservationDurationMinutes;
        windowEndMinutes = closingMinutes + 24 * 60;
      }
    }

    if (!withinWorkingHours) {
      return `Ресторан работает только с ${this.formatTime(this.restaurant.opening_time)} до ${this.formatTime(this.restaurant.closing_time)}.`;
    }

    if (reservationEndMinutes > windowEndMinutes) {
      return `Бронь на ${this.reservationDurationMinutes} минут выходит за время работы ресторана.`;
    }

    return null;
  }

  checkTables() {
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      return;
    }

    const validationError = this.validateBookingInputs();
    if (validationError) {
      this.error = validationError;
      this.success = '';
      this.infoMessage = '';
      this.availableTables = [];
      this.selectedTableId = null;
      this.hasCheckedTables = false;
      return;
    }

    const formValue = this.bookingForm.getRawValue();
    this.checkingTables = true;
    this.error = '';
    this.success = '';
    this.infoMessage = '';
    this.selectedTableId = null;
    this.availableTables = [];
    this.hasCheckedTables = true;

    this.restaurantService.getAvailableTables(
      this.restaurantId,
      formValue.reservation_date,
      formValue.reservation_time,
      Number(formValue.guests_count)
    ).subscribe({
      next: (tables) => {
        this.availableTables = tables;
        this.checkingTables = false;

        if (tables.length === 0) {
          this.infoMessage = 'Нет доступных столов на выбранное время.';
        }
      },
      error: (err) => {
        this.checkingTables = false;
        this.error = err?.error?.error || 'Не удалось получить список свободных столов.';
      },
    });
  }

  selectTable(tableId: number) {
    this.selectedTableId = tableId;
    this.error = '';
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

    const validationError = this.validateBookingInputs();
    if (validationError) {
      this.error = validationError;
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
    this.infoMessage = '';

    this.reservationService.createReservation(payload).subscribe({
      next: () => {
        this.booking = false;
        this.success = 'Бронь создана.';
        this.router.navigateByUrl('/my-reservations');
      },
      error: (err) => {
        this.booking = false;

        const backendError = err?.error;

        if (typeof backendError === 'string') {
          this.error = backendError;
          return;
        }

        if (backendError?.non_field_errors?.length) {
          this.error = backendError.non_field_errors[0];
          return;
        }

        if (backendError?.detail) {
          this.error = backendError.detail;
          return;
        }

        if (backendError?.error) {
          this.error = backendError.error;
          return;
        }

        this.error = 'Не удалось создать бронь.';
      },
    });
  }
}