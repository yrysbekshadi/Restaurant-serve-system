from django.urls import path
from .views import (
    CreateReservationView,
    MyReservationsView,
    MyReservationDetailView,
    RestaurantReservationsView,
    RestaurantReservationDetailView,
    ConfirmReservationView,
    CancelReservationByRestaurantView,
    CancelReservationByClientView,
)

urlpatterns = [
    path('reservations/', CreateReservationView.as_view()),
    path('reservations/my/', MyReservationsView.as_view()),
    path('reservations/my/<int:pk>/', MyReservationDetailView.as_view()),
    path('reservations/my/<int:pk>/cancel/', CancelReservationByClientView.as_view()),

    path('restaurant/reservations/', RestaurantReservationsView.as_view()),
    path('restaurant/reservations/<int:pk>/', RestaurantReservationDetailView.as_view()),
    path('restaurant/reservations/<int:pk>/confirm/', ConfirmReservationView.as_view()),
    path('restaurant/reservations/<int:pk>/cancel/', CancelReservationByRestaurantView.as_view()),
]