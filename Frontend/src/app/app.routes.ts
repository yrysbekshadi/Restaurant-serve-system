import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Restaurants } from './pages/restaurants/restaurants';
import { RestaurantDetail } from './pages/restaurant-detail/restaurant-detail';
import { MyReservations } from './pages/my-reservations/my-reservations';
import { RestaurantDashboard } from './pages/restaurant-dashboard/restaurant-dashboard';
import { authGuard } from './core/guards/auth.guard';
import { restaurantGuard } from './core/guards/restaurant.guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'restaurants', component: Restaurants },
  { path: 'restaurants/:id', component: RestaurantDetail },
  { path: 'my-reservations', component: MyReservations, canActivate: [authGuard] },
  { path: 'restaurant-dashboard', component: RestaurantDashboard, canActivate: [restaurantGuard] },
  { path: '**', redirectTo: '' },
];