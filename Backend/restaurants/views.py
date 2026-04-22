from datetime import datetime, timedelta

from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes

from reservations.serializers import AvailableTablesQuerySerializer
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

RESERVATION_DURATION_MINUTES = 60

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

        query_serializer = AvailableTablesQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)

        reservation_date = query_serializer.validated_data['date']
        reservation_time = query_serializer.validated_data['time']
        guests = query_serializer.validated_data['guests']

        requested_start = datetime.combine(reservation_date, reservation_time)
        requested_end = requested_start + timedelta(minutes=RESERVATION_DURATION_MINUTES)

        tables = restaurant.tables.filter(
            is_active=True,
            capacity__gte=guests
        )

        available_tables = []

        for table in tables:
            existing_reservations = Reservation.objects.filter(
                table=table,
                reservation_date=reservation_date,
            ).exclude(status='cancelled')

            is_conflicting = False

            for reservation in existing_reservations:
                existing_start = datetime.combine(
                    reservation.reservation_date,
                    reservation.reservation_time
                )
                existing_end = existing_start + timedelta(minutes=RESERVATION_DURATION_MINUTES)

                if requested_start < existing_end and requested_end > existing_start:
                    is_conflicting = True
                    break

            if not is_conflicting:
                available_tables.append(table)

        serializer = TableSerializer(available_tables, many=True)
        return Response(serializer.data)    
    
@api_view(['GET'])
@permission_classes([AllowAny])
def cuisine_types(request):
    cuisines = list(
        Restaurant.objects.values_list('cuisine_type', flat=True).distinct()
    )
    return Response({'cuisine_types': cuisines})