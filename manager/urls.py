from django.urls import path, include
from . import  views



urlpatterns = [
    # page
    path('', views.transfer_page, name='transfer'),  # home page
    path("history/", views.history_page, name="history"),
    path('help/', views.help_page, name='help'),  # help
    # path('auth-required/', views.auth_required, name='auth_required'),] # auth_required

    # api
    path('api/history/', views.history_api, name='history_api'), # history
    path("api/upload/", views.upload_file, name="upload_file"),
    path("api/history/delete/", views.delete_history_item, name="delete_history_item"),

    # download
    path("api/download/<str:code>/", views.download_file, name="download_file_api"),
    path("d/<str:code>/", views.download_file, name="download_file"), # short download url to user

]