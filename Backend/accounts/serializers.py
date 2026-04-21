import re
from rest_framework import serializers
from .models import User

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone', 'password', 'role']

    def validate_email(self, value):
        value = value.strip().lower()

        allowed_domains = {
            'gmail.com',
            'mail.ru',
            'yandex.ru',
            'outlook.com',
            'icloud.com',
        }

        if '@' not in value:
            raise serializers.ValidationError('Enter a valid email.')

        domain = value.split('@')[1]

        if domain not in allowed_domains:
            raise serializers.ValidationError(
                'Allowed domains: gmail.com, mail.ru, yandex.ru, outlook.com, icloud.com'
            )

        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')

        return value

    def validate_phone(self, value):
        value = (value or '').strip()

        if not re.fullmatch(r'^\+7\d{10}$', value):
            raise serializers.ValidationError('Phone must be in format +7XXXXXXXXXX')

        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone', 'role']