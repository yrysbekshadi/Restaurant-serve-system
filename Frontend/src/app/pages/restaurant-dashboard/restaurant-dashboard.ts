import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dish, MenuCategory, Reservation, Restaurant, Table } from '../../core/models/api.models';
import { OwnerService } from '../../core/services/owner.service';

@Component({
  selector: 'app-restaurant-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './restaurant-dashboard.html',
  styleUrl: './restaurant-dashboard.css',
})
export class RestaurantDashboard implements OnInit {
  private fb = inject(FormBuilder);
  private ownerService = inject(OwnerService);

  profileExists = false;
  loadingProfile = false;
  error = '';
  success = '';

  restaurantProfile: Restaurant | null = null;
  tables: Table[] = [];
  categories: MenuCategory[] = [];
  dishes: Dish[] = [];
  reservations: Reservation[] = [];

  profileForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    address: ['', [Validators.required]],
    district: ['', [Validators.required]],
    cuisine_type: ['', [Validators.required]],
    description: [''],
    opening_time: ['', [Validators.required]],
    closing_time: ['', [Validators.required]],
  });

  tableForm = this.fb.nonNullable.group({
    table_number: [1, [Validators.required, Validators.min(1)]],
    capacity: [2, [Validators.required, Validators.min(1)]],
    is_active: [true, [Validators.required]],
  });

  categoryForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
  });

  dishForm = this.fb.nonNullable.group({
    category: [0, [Validators.required]],
    name: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]],
    description: [''],
    ingredients: [''],
    image: [''],
    is_available: [true, [Validators.required]],
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile() {
    this.loadingProfile = true;
    this.error = '';
    this.success = '';

    this.ownerService.getMyProfile().subscribe({
      next: (profile) => {
        this.restaurantProfile = profile;
        this.profileExists = true;
        this.loadingProfile = false;

        this.profileForm.patchValue({
          name: profile.name,
          address: profile.address,
          district: profile.district,
          cuisine_type: profile.cuisine_type,
          description: profile.description ?? '',
          opening_time: profile.opening_time,
          closing_time: profile.closing_time,
        });

        this.loadAllData();
      },
      error: (err) => {
        this.loadingProfile = false;

        if (err.status === 404) {
          this.profileExists = false;
          return;
        }

        this.error = 'Failed to load restaurant profile.';
      },
    });
  }

  loadAllData() {
    this.loadTables();
    this.loadCategories();
    this.loadDishes();
    this.loadReservations();
  }

  createProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.error = '';
    this.success = '';

    this.ownerService.createRestaurantProfile(this.profileForm.getRawValue()).subscribe({
      next: () => {
        this.success = 'The restaurant profile has been created.';
        this.profileExists = true;
        this.loadProfile();
      },
      error: (err) => {
        this.error = JSON.stringify(err?.error ?? { error: 'Failed to create profile.' });
      },
    });
  }

  saveProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.error = '';
    this.success = '';

    this.ownerService.updateMyProfile(this.profileForm.getRawValue()).subscribe({
      next: (profile) => {
        this.restaurantProfile = profile;
        this.success = 'Profile updated.';
      },
      error: (err) => {
        this.error = JSON.stringify(err?.error ?? { error: 'Failed to update profile.' });
      },
    });
  }

  loadTables() {
    this.ownerService.getTables().subscribe({
      next: (tables) => this.tables = tables,
    });
  }

  addTable() {
    if (this.tableForm.invalid) {
      this.tableForm.markAllAsTouched();
      return;
    }

    const raw = this.tableForm.getRawValue();
    this.error = '';
    this.success = '';

    this.ownerService.addTable({
      table_number: Number(raw.table_number),
      capacity: Number(raw.capacity),
      is_active: raw.is_active,
    }).subscribe({
      next: () => {
        this.tableForm.reset({
          table_number: 1,
          capacity: 2,
          is_active: true,
        });
        this.success = 'The table has been added.';
        this.loadTables();
      },
      error: (err) => {
        this.error = JSON.stringify(err?.error ?? { error: 'Failed to add table.' });
      },
    });
  }

  deleteTable(id: number) {
    this.error = '';
    this.success = '';

    this.ownerService.deleteTable(id).subscribe({
      next: () => {
        this.success = 'The table has been removed.';
        this.loadTables();
      },
      error: () => this.error = 'Failed to delete table.',
    });
  }

  loadCategories() {
    this.ownerService.getCategories().subscribe({
      next: (categories) => this.categories = categories,
    });
  }

  addCategory() {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.error = '';
    this.success = '';

    this.ownerService.addCategory(this.categoryForm.getRawValue()).subscribe({
      next: () => {
        this.categoryForm.reset({ name: '' });
        this.success = 'Category added.';
        this.loadCategories();
      },
      error: () => this.error = 'Failed to add category.',
    });
  }

  loadDishes() {
    this.ownerService.getDishes().subscribe({
      next: (dishes) => this.dishes = dishes,
    });
  }

  addDish() {
    if (this.dishForm.invalid) {
      this.dishForm.markAllAsTouched();
      return;
    }

    const raw = this.dishForm.getRawValue();

    if (!raw.category) {
      this.error = 'First, select a category.';
      return;
    }

    this.error = '';
    this.success = '';

    this.ownerService.addDish({
      category: Number(raw.category),
      name: raw.name,
      price: Number(raw.price),
      description: raw.description,
      ingredients: raw.ingredients,
      image: raw.image,
      is_available: raw.is_available,
    }).subscribe({
      next: () => {
        this.dishForm.reset({
          category: 0,
          name: '',
          price: 0,
          description: '',
          ingredients: '',
          image: '',
          is_available: true,
        });
        this.success = 'The dish has been added.';
        this.loadDishes();
      },
      error: (err) => {
        this.error = JSON.stringify(err?.error ?? { error: 'Failed to add dish.' });
      },
    });
  }

  deleteDish(id: number) {
    this.error = '';
    this.success = '';

    this.ownerService.deleteDish(id).subscribe({
      next: () => {
        this.success = 'The dish has been removed.';
        this.loadDishes();
      },
      error: () => this.error = 'Failed to delete dish.',
    });
  }

  loadReservations() {
    this.ownerService.getIncomingReservations().subscribe({
      next: (reservations) => this.reservations = reservations,
    });
  }

  confirmReservation(id: number) {
    this.error = '';
    this.success = '';

    this.ownerService.confirmReservation(id).subscribe({
      next: () => {
        this.success = 'The reservation has been confirmed.';
        this.loadReservations();
      },
      error: (err) => {
        this.error = err?.error?.error || 'Failed to confirm your reservation.';
      },
    });
  }

  cancelReservation(id: number) {
    const reason = window.prompt('Write cancellation reason');

    if (reason === null) {
      return;
    }

    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      this.error = 'You must indicate the reason for refusal.';
      return;
    }

    this.error = '';
    this.success = '';

    this.ownerService.cancelReservation(id, trimmedReason).subscribe({
      next: () => {
        this.success = 'Reservation rejected.';
        this.loadReservations();
      },
      error: (err) => {
        this.error = err?.error?.error || 'Failed to cancel reservation.';
      },
    });
  }
}