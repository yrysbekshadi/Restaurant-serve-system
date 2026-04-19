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

        this.error = 'Не удалось загрузить профиль ресторана.';
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

    this.ownerService.createRestaurantProfile(this.profileForm.getRawValue()).subscribe({
      next: () => {
        this.success = 'Профиль ресторана создан.';
        this.profileExists = true;
        this.loadProfile();
      },
      error: (err) => {
        this.error = JSON.stringify(err?.error ?? { error: 'Не удалось создать профиль.' });
      },
    });
  }

  saveProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.ownerService.updateMyProfile(this.profileForm.getRawValue()).subscribe({
      next: (profile) => {
        this.restaurantProfile = profile;
        this.success = 'Профиль обновлён.';
      },
      error: (err) => {
        this.error = JSON.stringify(err?.error ?? { error: 'Не удалось обновить профиль.' });
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
        this.loadTables();
      },
      error: (err) => {
        this.error = JSON.stringify(err?.error ?? { error: 'Не удалось добавить стол.' });
      },
    });
  }

  deleteTable(id: number) {
    this.ownerService.deleteTable(id).subscribe({
      next: () => this.loadTables(),
      error: () => this.error = 'Не удалось удалить стол.',
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

    this.ownerService.addCategory(this.categoryForm.getRawValue()).subscribe({
      next: () => {
        this.categoryForm.reset({ name: '' });
        this.loadCategories();
      },
      error: () => this.error = 'Не удалось добавить категорию.',
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
      this.error = 'Сначала выбери категорию.';
      return;
    }

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
        this.loadDishes();
      },
      error: (err) => {
        this.error = JSON.stringify(err?.error ?? { error: 'Не удалось добавить блюдо.' });
      },
    });
  }

  deleteDish(id: number) {
    this.ownerService.deleteDish(id).subscribe({
      next: () => this.loadDishes(),
      error: () => this.error = 'Не удалось удалить блюдо.',
    });
  }

  loadReservations() {
    this.ownerService.getIncomingReservations().subscribe({
      next: (reservations) => this.reservations = reservations,
    });
  }

  confirmReservation(id: number) {
    this.ownerService.confirmReservation(id).subscribe({
      next: () => this.loadReservations(),
      error: () => this.error = 'Не удалось подтвердить бронь.',
    });
  }

  cancelReservation(id: number) {
    this.ownerService.cancelReservation(id).subscribe({
      next: () => this.loadReservations(),
      error: () => this.error = 'Не удалось отменить бронь.',
    });
  }
}