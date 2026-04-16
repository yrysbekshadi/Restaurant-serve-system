from django.db import models
from reservations.models import Reservation


class Payment(models.Model):
    STATUS_CHOICES = [
        ('unpaid', 'Unpaid'),
        ('paid', 'Paid'),
        ('refunded', 'Refunded'),
    ]

    reservation = models.OneToOneField(
        Reservation,
        on_delete=models.CASCADE,
        related_name='payment'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unpaid')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment for reservation #{self.reservation.id}"