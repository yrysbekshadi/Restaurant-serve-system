from rest_framework import serializers
from .models import Restaurant, Table, MenuCategory, Dish


class TableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Table
        fields = ['id', 'table_number', 'capacity', 'is_active']


class MenuCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuCategory
        fields = ['id', 'name']


class DishSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dish
        fields = [
            'id',
            'restaurant',
            'category',
            'name',
            'price',
            'description',
            'ingredients',
            'image',
            'is_available',
            'created_at',
        ]
        read_only_fields = ['restaurant', 'created_at']


class RestaurantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restaurant
        fields = [
            'id',
            'owner',
            'name',
            'address',
            'district',
            'cuisine_type',
            'description',
            'opening_time',
            'closing_time',
            'created_at',
        ]
        read_only_fields = ['owner', 'created_at']


class RestaurantDetailSerializer(serializers.ModelSerializer):
    tables = TableSerializer(many=True, read_only=True)
    categories = MenuCategorySerializer(many=True, read_only=True)
    dishes = DishSerializer(many=True, read_only=True)

    class Meta:
        model = Restaurant
        fields = [
            'id',
            'name',
            'address',
            'district',
            'cuisine_type',
            'description',
            'opening_time',
            'closing_time',
            'tables',
            'categories',
            'dishes',
        ]