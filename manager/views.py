from .models import FileContent, ShareItem
from .utils import calculate_md5
import uuid
import os
from django.http import JsonResponse, FileResponse, Http404
from django.utils import timezone
from django.shortcuts import render, redirect
from django.contrib import messages
from django.views.decorators.csrf import csrf_exempt  # @use for dev test
from django.views.decorators.http import require_POST  # @use for dev test
from urllib.parse import urlencode
from django.urls import reverse

# Create your views here.

def transfer(request):
    return render(request, 'transfer.html', {'active_page': 'transfer'})

def history(request):
    if not request.user.is_authenticated:
        messages.error(request, 'Please log in to view your transfer history.')
        qs = urlencode({"next": request.path})  # /history/
        return redirect(f"{reverse('transfer')}?{qs}")

    shares = (
        ShareItem.objects
        .select_related("file_content")
        .order_by("-created_at")[:200]
    )
    rows = []
    for s in shares:
        name = s.original_name or ""
        ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
        rows.append({
            "id": s.id,
            "code": s.code,
            "name": name,
            "size": s.file_content.size if s.file_content else 0,
            "created_at": s.created_at,
            "type": ext,
            "expired": bool(s.expire_at and s.expire_at <= s.created_at),  # 先占位，不影响显示
        })
    print("---- HISTORY ITEMS ----")
    for s in shares:
        print(
            f"id={s.id} code={s.code} name={s.original_name} "
            f"size={s.file_content.size if s.file_content else None} "
            f"created={s.created_at} expire={s.expire_at}"
        )
    print("-----------------------") # test history
    return render(request, "history.html", {
        "active_page": "history",
        "rows": rows,
    })
    #return render(request, 'history.html', {'active_page': 'history'})

def help_page(request):
    return render(request, 'help.html', {'active_page': 'help'})


def auth_required(request):
    messages.error(request, 'Please log in to send or receive.')
    return redirect('transfer')

@csrf_exempt # @use for dev test
@require_POST # @use for dev test
def upload_file(request):
    if request.method == 'POST':
        file_obj = request.FILES.get('file')

        # 1. Calculate MD5
        file_md5 = calculate_md5(file_obj)
        file_obj.seek(0)

        # 2. Check whether the physical file already exists in the database (Second Transfer Core)
        file_content = FileContent.objects.filter(hash_code=file_md5).first()
        is_instant = file_content is not None

        if not file_content:
            # If not, create and physically save the file
            file_content = FileContent.objects.create(
                hash_code=file_md5,
                file_obj=file_obj,
                size=file_obj.size
            )

        # 3. Regardless of whether it is uploaded instantly or not, a new "extraction code" will be generated for this upload.
        share_code = str(uuid.uuid4())[:6]  # Generate 6-digit random code
        while ShareItem.objects.filter(code=share_code).exists():
            share_code = uuid.uuid4().hex[:6]

        ShareItem.objects.create(
            file_content=file_content,
            code=share_code,
            original_name=file_obj.name,
            # Other fields such as expire_at can be set here
        )

        return JsonResponse({
            'status': 'success',
            'share_code': share_code,
            'is_instant': is_instant  # Tell the front end whether the transmission is instantaneous
        })

def download_file(request, code: str):
    share = ShareItem.objects.select_related("file_content").filter(code=code).first()
    if not share:
        raise Http404("Invalid code")

    # Expiration check (if you have expire_at in your model)
    if getattr(share, "expire_at", None) and timezone.now() > share.expire_at:
        raise Http404("Code expired")

    file_field = share.file_content.file_obj
    if not file_field or not os.path.exists(file_field.path):
        raise Http404("File not found")

    return FileResponse(open(file_field.path, "rb"), as_attachment=True, filename=share.original_name)