from datetime import datetime, timedelta

from django.utils import timezone
from rest_framework import serializers
from .models import Reservation

RESERVATION_DURATION_MINUTES = 120


class AvailableTablesQuerySerializer(serializers.Serializer):
    date = serializers.DateField()
    time = serializers.TimeField()
    guests = serializers.IntegerField(min_value=1)


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

        today = timezone.localdate()
        now_time = timezone.localtime().time().replace(second=0, microsecond=0)

        if reservation_date < today:
            raise serializers.ValidationError(
                "You cannot create a reservation for a past date."
            )

        if reservation_date == today and reservation_time <= now_time:
            raise serializers.ValidationError(
                "You cannot create a reservation for a past time."
            )

        if table.restaurant != restaurant:
            raise serializers.ValidationError(
                "Selected table does not belong to this restaurant."
            )

        if table.capacity < guests_count:
            raise serializers.ValidationError(
                "This table does not have enough capacity."
            )

        new_start = datetime.combine(reservation_date, reservation_time)
        new_end = new_start + timedelta(minutes=RESERVATION_DURATION_MINUTES)

        existing_reservations = Reservation.objects.filter(
            table=table,
            reservation_date=reservation_date,
        ).exclude(status='cancelled')

        for reservation in existing_reservations:
            existing_start = datetime.combine(
                reservation.reservation_date,
                reservation.reservation_time
            )
            existing_end = existing_start + timedelta(minutes=RESERVATION_DURATION_MINUTES)

            if new_start < existing_end and new_end > existing_start:
                raise serializers.ValidationError(
                    "This table is already reserved for that time range."
                )

        return attrs

    def create(self, validated_data):
        user = self.context['request'].user
        return Reservation.objects.create(client=user, **validated_data)