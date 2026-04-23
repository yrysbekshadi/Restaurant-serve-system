export interface User {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  role: 'client' | 'restaurant';
}

export interface RegisterPayload {
  username: string;
  email: string;
  phone: string;
  password: string;
  role: 'client' | 'restaurant';
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface Restaurant {
  id: number;
  owner?: number;
  name: string;
  address: string;
  district: string;
  cuisine_type: string;
  description: string | null;
  opening_time: string;
  closing_time: string;
  created_at?: string;
}

export interface Table {
  id: number;
  table_number: number;
  capacity: number;
  is_active: boolean;
}

export interface MenuCategory {
  id: number;
  name: string;
}

export interface Dish {
  id: number;
  restaurant?: number;
  category: number;
  name: string;
  price: number | string;
  description: string | null;
  ingredients: string | null;
  image: string | null;
  is_available: boolean;
  created_at?: string;
}

export interface Reservation {
  id: number;
  client: number;
  restaurant: number;
  restaurant_name?: string;
  table: number;
  table_number?: number;
  reservation_date: string;
  reservation_time: string;
  guests_count: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  cancelled_by?: 'client' | 'restaurant' | null;
  cancellation_reason?: string;
  created_at: string;
}

export interface RestaurantDetail extends Restaurant {
  tables: Table[];
  categories: MenuCategory[];
  dishes: Dish[];
}

export interface CreateReservationPayload {
  restaurant: number;
  table: number;
  reservation_date: string;
  reservation_time: string;
  guests_count: number;
}

export interface RestaurantProfilePayload {
  name: string;
  address: string;
  district: string;
  cuisine_type: string;
  description: string;
  opening_time: string;
  closing_time: string;
}

export interface TablePayload {
  table_number: number;
  capacity: number;
  is_active: boolean;
}

export interface CategoryPayload {
  name: string;
}

export interface DishPayload {
  category: number;
  name: string;
  price: number;
  description: string;
  ingredients: string;
  image: string;
  is_available: boolean;
}