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

def transfer_page(request):
    return render(request, 'transfer.html', {'active_page': 'transfer'})

def history_page(request):
    if not request.user.is_authenticated:
        messages.error(request, 'Please log in to view your transfer history.')
        qs = urlencode({"next": request.path})  # /history/
        return redirect(f"{reverse('transfer')}?{qs}")

    return render(request, "history.html", {
        "active_page": "history",
    })

def history_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Authentication required"}, status=401)

    shares = (
        ShareItem.objects
        .select_related("file_content")
        .filter(owner=request.user)
        .order_by("-created_at")[:200]
    )

    items = []

    for s in shares:
        name = s.original_name or ""
        ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""

        file_content = s.file_content
        is_available = (
                file_content is not None
                and file_content.retention_until is not None
                and file_content.retention_until > timezone.now()
        )

        items.append({
            "id": s.id,
            "code": s.code,
            "name": name,
            "size": file_content.size if file_content else 0,
            "created_at": s.created_at.isoformat(),
            "type": ext,
            "download_url": request.build_absolute_uri(
                reverse("download_file", kwargs={"code": s.code})
            ),
            "is_available": is_available,
            "retention_until": file_content.retention_until.isoformat() if file_content and file_content.retention_until else None,
        })

    return JsonResponse({"items": items})
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
        if not file_obj:
            return JsonResponse(
                {"status": "error", "message": "file is required"},
                status=400
            )

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

        share_item= ShareItem.objects.create(
            owner=request.user,
            file_content=file_content,
            code=share_code,
            original_name=file_obj.name,
            # Other fields such as expire_at can be set here
        )
        # download short urls
        download_url = request.build_absolute_uri(
            reverse("download_file", kwargs={"code": share_code})
        )
        return JsonResponse({
            'status': 'success',
            'share_code': share_code,
            'is_instant': is_instant,  # Tell the front end whether the transmission is instantaneous
            "download_url": download_url,
            "expire_at": share_item.expire_at.isoformat(),
            "is_available": share_item.file_content.retention_until > timezone.now()
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