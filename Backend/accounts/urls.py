from django.urls import path
from .views import CsrfView, RegisterView, LoginView, LogoutView, ProfileView

urlpatterns = [
    path('csrf/', CsrfView.as_view()),
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('logout/', LogoutView.as_view()),
    path('profile/', ProfileView.as_view()),
]