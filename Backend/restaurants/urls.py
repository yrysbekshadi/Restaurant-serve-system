from django.urls import path
from .views import (
    RestaurantListView,
    RestaurantDetailView,
    CreateRestaurantProfileView,
    MyRestaurantProfileView,
    MyTablesView,
    MyTableDetailView,
    MyCategoriesView,
    MyDishesView,
    MyDishDetailView,
    AvailableTablesView,
)

urlpatterns = [
    path('restaurants/', RestaurantListView.as_view()),
    path('restaurants/<int:pk>/', RestaurantDetailView.as_view()),
    path('restaurants/<int:pk>/available-tables/', AvailableTablesView.as_view()),

    path('restaurant/profile/', CreateRestaurantProfileView.as_view()),
    path('restaurant/profile/me/', MyRestaurantProfileView.as_view()),

    path('restaurant/tables/', MyTablesView.as_view()),
    path('restaurant/tables/<int:pk>/', MyTableDetailView.as_view()),

    path('restaurant/categories/', MyCategoriesView.as_view()),

    path('restaurant/dishes/', MyDishesView.as_view()),
    path('restaurant/dishes/<int:pk>/', MyDishDetailView.as_view()),
]