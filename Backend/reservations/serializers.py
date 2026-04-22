from datetime import datetime, timedelta

from django.utils import timezone
from rest_framework import serializers
from .models import Reservation

RESERVATION_DURATION_MINUTES = 90


def get_reservation_window(restaurant, reservation_date, reservation_time):
    opening_time = restaurant.opening_time
    closing_time = restaurant.closing_time

    reservation_start = datetime.combine(reservation_date, reservation_time)

    if opening_time < closing_time:
        window_start = datetime.combine(reservation_date, opening_time)
        window_end = datetime.combine(reservation_date, closing_time)

        is_within_working_hours = window_start <= reservation_start < window_end
        return reservation_start, window_start, window_end, is_within_working_hours

    if reservation_time >= opening_time:
        window_start = datetime.combine(reservation_date, opening_time)
        window_end = datetime.combine(reservation_date + timedelta(days=1), closing_time)
        return reservation_start, window_start, window_end, True

    if reservation_time < closing_time:
        window_start = datetime.combine(reservation_date - timedelta(days=1), opening_time)
        window_end = datetime.combine(reservation_date, closing_time)
        return reservation_start, window_start, window_end, True

    return reservation_start, None, None, False


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

        new_start, window_start, window_end, is_within_working_hours = get_reservation_window(
            restaurant,
            reservation_date,
            reservation_time
        )

        if not is_within_working_hours:
            raise serializers.ValidationError(
                "You cannot create a reservation outside the restaurant working hours."
            )

        new_end = new_start + timedelta(minutes=RESERVATION_DURATION_MINUTES)

        if new_end > window_end:
            raise serializers.ValidationError(
                "This reservation ends after the restaurant closes."
            )

        existing_reservations = Reservation.objects.filter(
            table=table,
            reservation_date__range=(
                reservation_date - timedelta(days=1),
                reservation_date + timedelta(days=1),
            )
        ).exclude(status='cancelled')

        for reservation in existing_reservations:
            existing_start, _, _, _ = get_reservation_window(
                reservation.restaurant,
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