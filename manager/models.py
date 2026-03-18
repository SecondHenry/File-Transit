from django.db import models
from django.utils import timezone
import datetime
from .utils import get_hash_path
from django.utils import timezone
from django.contrib.auth.models import User


# Create your models here.
def default_expire_at():
    return timezone.now() + datetime.timedelta(minutes=10)

def default_file_expire_at():
    return timezone.now() + datetime.timedelta(days=7)

class FileContent(models.Model):
    hash_code = models.CharField(max_length=32, unique=True)
    file_obj = models.FileField(upload_to=get_hash_path)
    size = models.BigIntegerField()
    uploaded_at = models.DateTimeField(auto_now_add=True)
    retention_until = models.DateTimeField(default=default_file_expire_at)

    def __str__(self):
        return self.hash_code


class ShareItem(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="share_items",null=True,blank=True)
    file_content = models.ForeignKey(FileContent, on_delete=models.CASCADE, related_name="shares")
    code = models.CharField(max_length=10, unique=True)
    original_name = models.CharField(max_length=255)
    expire_at = models.DateTimeField(default=default_expire_at)
    created_at = models.DateTimeField(auto_now_add=True)

class DownloadRecord(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="download_records")
    share_item = models.ForeignKey(ShareItem, on_delete=models.CASCADE, related_name="download_records")
    downloaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} - {self.original_name}"

    def is_expired(self):
        return timezone.now() >= self.expire_at

