from django.contrib import admin
from .models import Restaurant, Table, MenuCategory, Dish


admin.site.register(Restaurant)
admin.site.register(Table)
admin.site.register(MenuCategory)
admin.site.register(Dish)