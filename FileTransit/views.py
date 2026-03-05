from django.shortcuts import render, redirect
from django.contrib import messages


def transfer(request):
    return render(request, 'transfer.html', {'active_page': 'transfer'})


def history(request):
    if not request.user.is_authenticated:
        messages.error(request, 'Please log in to view your transfer history.')
        return redirect('transfer')
    return render(request, 'history.html', {'active_page': 'history'})


def help_page(request):
    return render(request, 'help.html', {'active_page': 'help'})


def auth_required(request):
    messages.error(request, 'Please log in to send or receive.')
    return redirect('transfer')
