from .models import FileContent, ShareItem,DownloadRecord
from .utils import calculate_md5
import uuid
import os
import json
from django.db.models import Sum
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
    # ---------- Sent records ----------
    shares = (
        ShareItem.objects
        .select_related("file_content")
        .filter(owner=request.user)
        .order_by("-created_at")[:200]
    )

    sent_items = []

    for s in shares:
        name = s.original_name or ""
        ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""

        file_content = s.file_content
        is_available = (
                file_content is not None
                and file_content.retention_until is not None
                and file_content.retention_until > timezone.now()
        )

        sent_items.append({
            "id": s.id,
            "code": s.code,
            "name": name,
            "size": file_content.size if file_content else 0,
            "created_at": s.created_at.isoformat(),
            "type": "Sent",
            "download_url": request.build_absolute_uri(
                reverse("download_file", kwargs={"code": s.code})
            ),
            "is_available": is_available,
            "retention_until": file_content.retention_until.isoformat() if file_content and file_content.retention_until else None,
            "file_content_id": file_content.id if file_content else None,
        })

    # ---------- Received records ----------
    downloads = (
        DownloadRecord.objects
        .select_related("share_item", "share_item__file_content")
        .filter(owner=request.user)
        .order_by("-downloaded_at")[:200]
    )

    received_items = []

    for d in downloads:
        share = d.share_item
        file_content = share.file_content if share else None
        name = share.original_name if share else ""

        received_items.append({
            "id": f"r-{d.id}",
            "record_id": d.id,
            "code": share.code if share else "",
            "name": name,
            "size": file_content.size if file_content else 0,
            "created_at": d.downloaded_at.isoformat(),
            "type": "Received",
            "download_url": request.build_absolute_uri(
                reverse("download_file", kwargs={"code": share.code})
            ) if share else "",
            "is_available": (
                file_content is not None
                and file_content.retention_until is not None
                and file_content.retention_until > timezone.now()
            ),
            "retention_until": (
                file_content.retention_until.isoformat()
                if file_content and file_content.retention_until else None
            ),
            "file_content_id": file_content.id if file_content else None,
        })

    # ---------- Merge and sort ----------
    items = sent_items + received_items
    items.sort(key=lambda x: x["created_at"], reverse=True)

    # ---------- Usage ----------
    file_ids = (
        ShareItem.objects
        .filter(owner=request.user)
        .values_list("file_content_id", flat=True)
        .distinct()
    )

    used_bytes = (
                     FileContent.objects
                     .filter(id__in=file_ids)
                     .aggregate(total=Sum("size"))
                 )["total"] or 0

    limit_bytes = 1 * 1024 * 1024 * 1024  # 1 GB

    return JsonResponse({
        "items": items,
        "usage": {
                 "used_bytes": used_bytes,
                 "limit_bytes": limit_bytes,
             }
    })

@csrf_exempt
@require_POST
def delete_history_item(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Authentication required"}, status=401)

    try:
        data = json.loads(request.body)
        share_id = data.get("id")

    except Exception as e:

        return JsonResponse({"detail": "Invalid request body"}, status=400)

    if not share_id:
        return JsonResponse({"detail": "Missing id"}, status=400)

    share = ShareItem.objects.filter(id=share_id, owner=request.user).first()
    if not share:
        return JsonResponse({"detail": "Not found"}, status=404)

    file_content = share.file_content

    share.delete()

    if file_content and not ShareItem.objects.filter(file_content=file_content).exists():
        file_field = file_content.file_obj
        if file_field and os.path.exists(file_field.path):
            os.remove(file_field.path)
        file_content.delete()
    return JsonResponse({"status": "success"})

def help_page(request):
    return render(request, 'help.html', {'active_page': 'help'})


def auth_required(request):
    messages.error(request, 'Please log in to send or receive.')
    return redirect('transfer')


MAX_FILE_SIZE = 32 * 1024 * 1024  # 32 MB
@csrf_exempt # @use for dev test
@require_POST # @use for dev test
def upload_file(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Authentication required"}, status=401)

    file_obj = request.FILES.get('file')
    if not file_obj:
        return JsonResponse(
            {"status": "error", "message": "file is required"},
            status=400
        )
    if file_obj.size > MAX_FILE_SIZE:
        return JsonResponse(
            {"status": "error", "message": "File size exceeds 32 MB limit."},
            status=400
        )

    # Quota check: reject if upload would exceed 1 GB
    QUOTA_BYTES = 1 * 1024 * 1024 * 1024  # 1 GB
    user_file_ids = (
        ShareItem.objects
        .filter(owner=request.user)
        .values_list("file_content_id", flat=True)
        .distinct()
    )
    used_bytes = (
        FileContent.objects
        .filter(id__in=user_file_ids)
        .aggregate(total=Sum("size"))
    )["total"] or 0

    if used_bytes + file_obj.size > QUOTA_BYTES:
        return JsonResponse(
            {"status": "error", "message": "quota_exceeded"},
            status=403
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

    share_item = ShareItem.objects.create(
        owner=request.user,
        file_content=file_content,
        code=share_code,
        original_name=file_obj.name,
    )
    # download short urls
    download_url = request.build_absolute_uri(
        reverse("download_file", kwargs={"code": share_code})
    )
    return JsonResponse({
        'status': 'success',
        'share_code': share_code,
        'is_instant': is_instant,
        "download_url": download_url,
        "expire_at": share_item.expire_at.isoformat(),
    })
def download_file(request, code: str):
    if not request.user.is_authenticated:
        messages.error(request, 'Please log in to download files.')
        qs = urlencode({"next": request.path})
        return redirect(f"{reverse('transfer')}?{qs}")

    share = ShareItem.objects.select_related("file_content").filter(code=code).first()
    if not share:
        messages.error(request, 'Invalid code. Please check and try again.')
        return redirect('transfer')

    # Expiration check (if you have expire_at in your model)
    if getattr(share, "expire_at", None) and timezone.now() > share.expire_at:
        messages.error(request, 'This share code has expired.')
        return redirect('transfer')

    file_field = share.file_content.file_obj
    if not file_field or not os.path.exists(file_field.path):
        raise Http404("File not found")

    if request.user.is_authenticated:
        DownloadRecord.objects.create(
            owner=request.user,
            share_item=share
        )

    return FileResponse(open(file_field.path, "rb"), as_attachment=True, filename=share.original_name)

@require_POST
def rename_history_item(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Authentication required"}, status=401)

    try:
        data = json.loads(request.body)
        share_id = data.get("id")
        new_name = (data.get("name") or "").strip()
    except Exception:
        return JsonResponse({"detail": "Invalid request body"}, status=400)

    if not share_id:
        return JsonResponse({"detail": "Missing id"}, status=400)

    if not new_name:
        return JsonResponse({"detail": "Missing name"}, status=400)

    share = ShareItem.objects.filter(id=share_id, owner=request.user).first()
    if not share:
        return JsonResponse({"detail": "Not found"}, status=404)

    share.original_name = new_name
    share.save(update_fields=["original_name"])

    return JsonResponse({
        "status": "success",
        "name": new_name
    })

@require_POST
def resend_history_item(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Authentication required"}, status=401)

    try:
        data = json.loads(request.body)
        share_id = data.get("id")
    except Exception:
        return JsonResponse({"detail": "Invalid request body"}, status=400)

    if not share_id:
        return JsonResponse({"detail": "Missing id"}, status=400)

    old_share = ShareItem.objects.select_related("file_content").filter(
        id=share_id,
        owner=request.user
    ).first()

    if not old_share:
        return JsonResponse({"detail": "Not found"}, status=404)

    file_content = old_share.file_content
    if not file_content:
        return JsonResponse({"detail": "File not found"}, status=404)

    if file_content.retention_until <= timezone.now():
        return JsonResponse({"detail": "File expired"}, status=410)

    share_code = uuid.uuid4().hex[:6]
    while ShareItem.objects.filter(code=share_code).exists():
        share_code = uuid.uuid4().hex[:6]

    new_share = ShareItem.objects.create(
        owner=request.user,
        file_content=file_content,
        code=share_code,
        original_name=old_share.original_name,
    )

    download_url = request.build_absolute_uri(
        reverse("download_file", kwargs={"code": share_code})
    )

    return JsonResponse({
        "status": "success",
        "share_code": new_share.code,
        "download_url": download_url,
        "expire_at": new_share.expire_at.isoformat(),
        "name": new_share.original_name,
    })

@require_POST
def download_history_item(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Authentication required"}, status=401)

    try:
        data = json.loads(request.body)
        share_id = data.get("id")
    except Exception:
        return JsonResponse({"detail": "Invalid request body"}, status=400)

    if not share_id:
        return JsonResponse({"detail": "Missing id"}, status=400)

    share = ShareItem.objects.select_related("file_content").filter(
        id=share_id,
        owner=request.user
    ).first()

    if not share:
        return JsonResponse({"detail": "Not found"}, status=404)

    file_content = share.file_content
    if not file_content:
        return JsonResponse({"detail": "File not found"}, status=404)

    if file_content.retention_until <= timezone.now():
        return JsonResponse({"detail": "File expired"}, status=410)

    file_field = file_content.file_obj
    if not file_field or not os.path.exists(file_field.path):
        return JsonResponse({"detail": "File missing on disk"}, status=404)

    return FileResponse(
        open(file_field.path, "rb"),
        as_attachment=True,
        filename=share.original_name
    )