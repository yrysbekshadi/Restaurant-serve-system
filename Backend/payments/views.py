from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Payment
from .serializers import PaymentSerializer


class PaymentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, reservation_id):
        try:
            payment = Payment.objects.get(reservation_id=reservation_id)
        except Payment.DoesNotExist:
            return Response({'error': 'Payment not found.'}, status=404)

        serializer = PaymentSerializer(payment)
        return Response(serializer.data)

    def patch(self, request, reservation_id):
        try:
            payment = Payment.objects.get(reservation_id=reservation_id)
        except Payment.DoesNotExist:
            return Response({'error': 'Payment not found.'}, status=404)

        serializer = PaymentSerializer(payment, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)