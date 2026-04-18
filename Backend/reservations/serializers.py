from rest_framework import serializers
from .models import Reservation


class ReservationSerializer(serializers.ModelSerializer):
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
        ]
        read_only_fields = ['client', 'status', 'created_at']

    def validate(self, attrs):
        table = attrs['table']
        restaurant = attrs['restaurant']
        guests_count = attrs['guests_count']
        reservation_date = attrs['reservation_date']
        reservation_time = attrs['reservation_time']

        if table.restaurant != restaurant:
            raise serializers.ValidationError(
                "Selected table does not belong to this restaurant."
            )

        if table.capacity < guests_count:
            raise serializers.ValidationError(
                "This table does not have enough capacity."
            )

        existing = Reservation.objects.filter(
            table=table,
            reservation_date=reservation_date,
            reservation_time=reservation_time,
        ).exclude(status='cancelled')

        if existing.exists():
            raise serializers.ValidationError(
                "This table is already reserved at this date and time."
            )

        return attrs

    def create(self, validated_data):
        user = self.context['request'].user
        return Reservation.objects.create(client=user, **validated_data)