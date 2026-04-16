from django.contrib import admin
from .models import Reservation, ReservationDish


admin.site.register(Reservation)
admin.site.register(ReservationDish)