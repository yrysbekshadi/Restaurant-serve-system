from django.conf import settings
from django.db import models
from restaurants.models import Restaurant, Table


class Reservation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    ]

    CANCELLED_BY_CHOICES = [
        ('client', 'Client'),
        ('restaurant', 'Restaurant'),
    ]

    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reservations'
    )
    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name='reservations'
    )
    table = models.ForeignKey(
        Table,
        on_delete=models.CASCADE,
        related_name='reservations'
    )
    reservation_date = models.DateField()
    reservation_time = models.TimeField()
    guests_count = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    cancelled_by = models.CharField(
        max_length=20,
        choices=CANCELLED_BY_CHOICES,
        null=True,
        blank=True
    )
    cancellation_reason = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Reservation #{self.id} - {self.client.username}"