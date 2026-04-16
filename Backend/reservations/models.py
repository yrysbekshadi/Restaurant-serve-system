from django.conf import settings
from django.db import models
from restaurants.models import Restaurant, Table, Dish


class Reservation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
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
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Reservation #{self.id} - {self.client.username}"


class ReservationDish(models.Model):
    reservation = models.ForeignKey(
        Reservation,
        on_delete=models.CASCADE,
        related_name='reservation_dishes'
    )
    dish = models.ForeignKey(
        Dish,
        on_delete=models.CASCADE,
        related_name='reservation_dishes'
    )
    quantity = models.PositiveIntegerField(default=1)
    comment = models.TextField(blank=True, null=True)
    is_modified = models.BooleanField(default=False)
    price_at_booking = models.DecimalField(max_digits=10, decimal_places=2)

    def save(self, *args, **kwargs):
        if self.comment and self.comment.strip():
            self.is_modified = True
        else:
            self.is_modified = False

        if not self.price_at_booking:
            self.price_at_booking = self.dish.price

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.dish.name} x {self.quantity}"