from django.db import models
from .utils import get_hash_path
from django.utils import timezone
import datetime

# Create your models here.

from django.db import models
from .utils import get_hash_path

class FileContent(models.Model):
    hash_code = models.CharField(max_length=32, unique=True)
    # 使用刚才定义的 get_hash_path 函数
    file_obj = models.FileField(upload_to=get_hash_path)
    size = models.BigIntegerField()


class FileContent(models.Model):
    """物理文件表：实际存在硬盘上的文件信息"""
    hash_code = models.CharField(max_length=32, unique=True, verbose_name="MD5哈希")
    file_obj = models.FileField(upload_to=get_hash_path, verbose_name="物理路径")
    size = models.BigIntegerField(verbose_name="文件大小")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.hash_code


class ShareItem(models.Model):
    """分享条目表：用户看到的提取信息"""
    # 关联物理文件。如果物理文件删了，这个分享也失效（CASCADE）
    file_content = models.ForeignKey(FileContent, on_delete=models.CASCADE, related_name='shares')

    # 提取码，唯一
    code = models.CharField(max_length=10, unique=True, verbose_name="提取码")

    # 原始文件名（下载时重命名用）
    original_name = models.CharField(max_length=255, verbose_name="原始文件名")

    # 过期时间：默认设置为 7 天后过期
    expire_at = models.DateTimeField(
        default=timezone.now() + datetime.timedelta(days=7),
        verbose_name="过期时间"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} - {self.original_name}"