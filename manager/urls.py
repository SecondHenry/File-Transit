"""
URL configuration for FileTransit project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path, include
from . import  views



urlpatterns = [
    path('', views.transfer, name='transfer'),  # home page
    path('api/history/', views.history, name='history'), # history
    path('help/', views.help_page, name='help'), # help
    #path('auth-required/', views.auth_required, name='auth_required'),] # auth_required
    path("api/upload/", views.upload_file, name="upload_file"),
    path("api/download/<str:code>/", views.download_file, name="download_file"),
]