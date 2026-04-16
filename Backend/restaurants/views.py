from datetime import datetime

from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsRestaurant
from reservations.models import Reservation
from .models import Restaurant, Table, MenuCategory, Dish
from .serializers import (
    RestaurantSerializer,
    RestaurantDetailSerializer,
    TableSerializer,
    MenuCategorySerializer,
    DishSerializer,
)


class RestaurantListView(generics.ListAPIView):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Restaurant.objects.all()
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset


class RestaurantDetailView(generics.RetrieveAPIView):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantDetailSerializer
    permission_classes = [AllowAny]


class CreateRestaurantProfileView(APIView):
    permission_classes = [IsAuthenticated, IsRestaurant]

    def post(self, request):
        if hasattr(request.user, 'restaurant_profile'):
            return Response({'error': 'Restaurant profile already exists.'}, status=400)

        serializer = RestaurantSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class MyRestaurantProfileView(APIView):
    permission_classes = [IsAuthenticated, IsRestaurant]

    def get(self, request):
        if not hasattr(request.user, 'restaurant_profile'):
            return Response({'error': 'Restaurant profile not found.'}, status=404)

        serializer = RestaurantSerializer(request.user.restaurant_profile)
        return Response(serializer.data)

    def patch(self, request):
        if not hasattr(request.user, 'restaurant_profile'):
            return Response({'error': 'Restaurant profile not found.'}, status=404)

        serializer = RestaurantSerializer(
            request.user.restaurant_profile,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


class MyTablesView(APIView):
    permission_classes = [IsAuthenticated, IsRestaurant]

    def get(self, request):
        restaurant = request.user.restaurant_profile
        tables = restaurant.tables.all()
        serializer = TableSerializer(tables, many=True)
        return Response(serializer.data)

    def post(self, request):
        restaurant = request.user.restaurant_profile
        serializer = TableSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(restaurant=restaurant)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class MyTableDetailView(APIView):
    permission_classes = [IsAuthenticated, IsRestaurant]

    def patch(self, request, pk):
        restaurant = request.user.restaurant_profile
        try:
            table = restaurant.tables.get(pk=pk)
        except Table.DoesNotExist:
            return Response({'error': 'Table not found.'}, status=404)

        serializer = TableSerializer(table, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        restaurant = request.user.restaurant_profile
        try:
            table = restaurant.tables.get(pk=pk)
        except Table.DoesNotExist:
            return Response({'error': 'Table not found.'}, status=404)

        table.delete()
        return Response(status=204)


class MyCategoriesView(APIView):
    permission_classes = [IsAuthenticated, IsRestaurant]

    def get(self, request):
        restaurant = request.user.restaurant_profile
        categories = restaurant.categories.all()
        serializer = MenuCategorySerializer(categories, many=True)
        return Response(serializer.data)

    def post(self, request):
        restaurant = request.user.restaurant_profile
        serializer = MenuCategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(restaurant=restaurant)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class MyDishesView(APIView):
    permission_classes = [IsAuthenticated, IsRestaurant]

    def get(self, request):
        restaurant = request.user.restaurant_profile
        dishes = restaurant.dishes.all()
        serializer = DishSerializer(dishes, many=True)
        return Response(serializer.data)

    def post(self, request):
        restaurant = request.user.restaurant_profile
        serializer = DishSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(restaurant=restaurant)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class MyDishDetailView(APIView):
    permission_classes = [IsAuthenticated, IsRestaurant]

    def patch(self, request, pk):
        restaurant = request.user.restaurant_profile
        try:
            dish = restaurant.dishes.get(pk=pk)
        except Dish.DoesNotExist:
            return Response({'error': 'Dish not found.'}, status=404)

        serializer = DishSerializer(dish, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        restaurant = request.user.restaurant_profile
        try:
            dish = restaurant.dishes.get(pk=pk)
        except Dish.DoesNotExist:
            return Response({'error': 'Dish not found.'}, status=404)

        dish.delete()
        return Response(status=204)


class AvailableTablesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            restaurant = Restaurant.objects.get(pk=pk)
        except Restaurant.DoesNotExist:
            return Response({'error': 'Restaurant not found.'}, status=404)

        reservation_date = request.query_params.get('date')
        reservation_time = request.query_params.get('time')
        guests = request.query_params.get('guests')

        if not reservation_date or not reservation_time or not guests:
            return Response(
                {'error': 'date, time and guests are required query parameters.'},
                status=400
            )

        try:
            guests = int(guests)
        except ValueError:
            return Response({'error': 'guests must be a number.'}, status=400)

        reserved_table_ids = Reservation.objects.filter(
            restaurant=restaurant,
            reservation_date=reservation_date,
            reservation_time=reservation_time,
        ).exclude(status='cancelled').values_list('table_id', flat=True)

        tables = restaurant.tables.filter(
            is_active=True,
            capacity__gte=guests
        ).exclude(id__in=reserved_table_ids)

        serializer = TableSerializer(tables, many=True)
        return Response(serializer.data)