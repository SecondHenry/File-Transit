from django.http import HttpResponse
from django.shortcuts import render
from django.http import JsonResponse
from .models import FileContent, ShareItem
from .utils import calculate_md5
import uuid

# Create your views here.

def upload_file(request):
    if request.method == 'POST':
        file_obj = request.FILES.get('file')

        # 1. 计算 MD5
        file_md5 = calculate_md5(file_obj)

        # 2. 检查数据库是否已有该物理文件 (秒传核心)
        file_content = FileContent.objects.filter(hash_code=file_md5).first()

        if not file_content:
            # 如果没有，则创建并物理保存文件
            file_content = FileContent.objects.create(
                hash_code=file_md5,
                file_obj=file_obj,
                size=file_obj.size
            )

        # 3. 无论是否秒传，都为这次上传生成一个新的“提取码”
        share_code = str(uuid.uuid4())[:6]  # 生成 6 位随机码
        ShareItem.objects.create(
            file_content=file_content,
            code=share_code,
            original_name=file_obj.name,
            # 其他字段如 expire_at 可以在这里设置
        )

        return JsonResponse({
            'status': 'success',
            'share_code': share_code,
            'is_instant': file_content is not None  # 告诉前端是不是秒传的
        })