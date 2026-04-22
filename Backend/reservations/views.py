from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsClient, IsRestaurant
from .models import Reservation
from .serializers import ReservationSerializer


class CreateReservationView(generics.CreateAPIView):
    serializer_class = ReservationSerializer
    permission_classes = [IsAuthenticated, IsClient]


class MyReservationsView(generics.ListAPIView):
    serializer_class = ReservationSerializer
    permission_classes = [IsAuthenticated, IsClient]

    def get_queryset(self):
        return Reservation.objects.filter(client=self.request.user).order_by('-created_at')


class MyReservationDetailView(generics.RetrieveAPIView):
    serializer_class = ReservationSerializer
    permission_classes = [IsAuthenticated, IsClient]

    def get_queryset(self):
        return Reservation.objects.filter(client=self.request.user)


class RestaurantReservationsView(generics.ListAPIView):
    serializer_class = ReservationSerializer
    permission_classes = [IsAuthenticated, IsRestaurant]

    def get_queryset(self):
        return Reservation.objects.filter(
            restaurant=self.request.user.restaurant_profile
        ).exclude(
            status='cancelled',
            cancelled_by='client'
        ).order_by('-created_at')


class RestaurantReservationDetailView(generics.RetrieveAPIView):
    serializer_class = ReservationSerializer
    permission_classes = [IsAuthenticated, IsRestaurant]

    def get_queryset(self):
        return Reservation.objects.filter(
            restaurant=self.request.user.restaurant_profile
        ).exclude(
            status='cancelled',
            cancelled_by='client'
        )


class ConfirmReservationView(APIView):
    permission_classes = [IsAuthenticated, IsRestaurant]

    def patch(self, request, pk):
        try:
            reservation = Reservation.objects.get(
                pk=pk,
                restaurant=request.user.restaurant_profile
            )
        except Reservation.DoesNotExist:
            return Response({'error': 'Reservation not found.'}, status=404)

        if reservation.status != 'pending':
            return Response({'error': 'Only pending reservations can be confirmed.'}, status=400)

        reservation.status = 'confirmed'
        reservation.cancelled_by = None
        reservation.cancellation_reason = ''
        reservation.save()

        return Response({'message': 'Reservation confirmed.'})


class CancelReservationByRestaurantView(APIView):
    permission_classes = [IsAuthenticated, IsRestaurant]

    def patch(self, request, pk):
        try:
            reservation = Reservation.objects.get(
                pk=pk,
                restaurant=request.user.restaurant_profile
            )
        except Reservation.DoesNotExist:
            return Response({'error': 'Reservation not found.'}, status=404)

        if reservation.status != 'pending':
            return Response({'error': 'Only pending reservations can be cancelled.'}, status=400)

        reason = (request.data.get('cancellation_reason') or '').strip()

        if not reason:
            return Response({'error': 'Cancellation reason is required.'}, status=400)

        reservation.status = 'cancelled'
        reservation.cancelled_by = 'restaurant'
        reservation.cancellation_reason = reason
        reservation.save()

        return Response({'message': 'Reservation cancelled by restaurant.'})


class CancelReservationByClientView(APIView):
    permission_classes = [IsAuthenticated, IsClient]

    def patch(self, request, pk):
        try:
            reservation = Reservation.objects.get(pk=pk, client=request.user)
        except Reservation.DoesNotExist:
            return Response({'error': 'Reservation not found.'}, status=404)

        if reservation.status == 'cancelled':
            return Response({'error': 'Reservation is already cancelled.'}, status=400)

        reservation.status = 'cancelled'
        reservation.cancelled_by = 'client'
        reservation.cancellation_reason = ''
        reservation.save()

        return Response({'message': 'Reservation cancelled by client.'})