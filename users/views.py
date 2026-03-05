from django.shortcuts import redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages


def login_view(request):
    if request.method == 'POST':
        next_url = request.POST.get('next') or request.GET.get('next')

        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')

        if not username or not password:
            messages.error(request, 'Please enter both username and password.')
            return redirect('transfer')

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            messages.success(request, f'Welcome back, {user.get_username()}!')
            return redirect(next_url or 'transfer')
        else:
            messages.error(request, 'Invalid username or password.')

    return redirect('transfer')


def signup_view(request):
    if request.method == 'POST':
        next_url = request.POST.get('next') or request.GET.get('next')

        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')
        confirm_password = request.POST.get('confirm_password', '')

        if not username or not password:
            messages.error(request, 'Please fill in all fields.')
            return redirect('transfer')

        if password != confirm_password:
            messages.error(request, 'Passwords do not match.')
            return redirect('transfer')

        if len(password) < 6:
            messages.error(request, 'Password must be at least 6 characters.')
            return redirect('transfer')

        if User.objects.filter(username=username).exists():
            messages.error(request, 'Username already exists.')
            return redirect('transfer')

        user = User.objects.create_user(username=username, password=password)
        login(request, user)
        messages.success(request, f'Account created! Welcome, {user.username}!')
        return redirect(next_url or 'transfer')
    return redirect('transfer')


def logout_view(request):
    logout(request)
    messages.success(request, 'You have been logged out.')
    return redirect('transfer')

