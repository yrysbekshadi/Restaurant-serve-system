from rest_framework import serializers
from .models import Reservation, ReservationDish
from payments.models import Payment
from payments.serializers import PaymentSerializer
from restaurants.models import Table


class ReservationDishSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReservationDish
        fields = [
            'id',
            'dish',
            'quantity',
            'comment',
            'is_modified',
            'price_at_booking',
        ]
        read_only_fields = ['is_modified', 'price_at_booking']


class ReservationSerializer(serializers.ModelSerializer):
    dishes = ReservationDishSerializer(many=True, write_only=True, required=False)
    reservation_dishes = ReservationDishSerializer(many=True, read_only=True)
    payment = PaymentSerializer(read_only=True)

    class Meta:
        model = Reservation
        fields = [
            'id',
            'client',
            'restaurant',
            'table',
            'reservation_date',
            'reservation_time',
            'guests_count',
            'status',
            'created_at',
            'dishes',
            'reservation_dishes',
            'payment',
        ]
        read_only_fields = ['status', 'created_at', 'client']

    def validate(self, attrs):
        table = attrs['table']
        restaurant = attrs['restaurant']
        guests_count = attrs['guests_count']
        reservation_date = attrs['reservation_date']
        reservation_time = attrs['reservation_time']

        if table.restaurant != restaurant:
            raise serializers.ValidationError("Selected table does not belong to this restaurant.")

        if table.capacity < guests_count:
            raise serializers.ValidationError("This table does not have enough capacity.")

        existing = Reservation.objects.filter(
            table=table,
            reservation_date=reservation_date,
            reservation_time=reservation_time,
        ).exclude(status='cancelled')

        if existing.exists():
            raise serializers.ValidationError("This table is already reserved at this date and time.")

        return attrs

    def create(self, validated_data):
        dishes_data = validated_data.pop('dishes', [])
        user = self.context['request'].user

        reservation = Reservation.objects.create(client=user, **validated_data)

        total_amount = 0

        for dish_data in dishes_data:
            dish = dish_data['dish']
            quantity = dish_data.get('quantity', 1)
            comment = dish_data.get('comment', '')

            ReservationDish.objects.create(
                reservation=reservation,
                dish=dish,
                quantity=quantity,
                comment=comment,
                price_at_booking=dish.price,
            )

            total_amount += dish.price * quantity

        Payment.objects.create(
            reservation=reservation,
            amount=total_amount,
            status='unpaid'
        )

        return reservation