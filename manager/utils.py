import hashlib
import os

def calculate_md5(file_obj):
    """分块计算 MD5，防止大文件撑爆内存"""
    md5 = hashlib.md5()
    for chunk in file_obj.chunks():
        md5.update(chunk)
    return md5.hexdigest()

def get_hash_path(instance, filename):
    """
    Django 会在保存文件时调用此函数。
    路径格式：uploads/md/5v/md5value
    """
    # 假设我们在保存前已经把 md5 存进了 instance.hash_code
    h = instance.hash_code
    return os.path.join('uploads', h[:2], h[2:4], h)

