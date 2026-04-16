from django.urls import path
from .views import PaymentDetailView

urlpatterns = [
    path('payments/<int:reservation_id>/', PaymentDetailView.as_view()),
]