import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Reservation } from '../../core/models/api.models';
import { ReservationService } from '../../core/services/reservation.service';

@Component({
  selector: 'app-my-reservations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-reservations.html',
  styleUrl: './my-reservations.css',
})
export class MyReservations implements OnInit {
  private reservationService = inject(ReservationService);

  reservations: Reservation[] = [];
  loading = false;
  error = '';

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = '';

    this.reservationService.getMyReservations().subscribe({
      next: (data) => {
        this.reservations = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load reservations.';
        this.loading = false;
      },
    });
  }

  cancelReservation(id: number) {
    this.reservationService.cancelMyReservation(id).subscribe({
      next: () => this.load(),
      error: () => {
        this.error = 'Failed to cancel reservation.';
      },
    });
  }
}