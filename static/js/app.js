// ========== Accessible Notification System ==========
function showNotification(message, type = 'error') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'notification-toast ' + type;
    toast.textContent = (type === 'error' ? 'Error: ' : 'Success: ') + message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

document.addEventListener('DOMContentLoaded', () => {
    // ========== Transfer Page ==========
    const sendInitial = document.getElementById('sendInitial');
    const sendUploaded = document.getElementById('sendUploaded');
    const sendTransferred = document.getElementById('sendTransferred');

    if (sendInitial) {
        initTransferPage();
    }

    // ========== History Page ==========
    const fileExplorer = document.getElementById('fileExplorer');
    if (fileExplorer) {
        initHistoryPage();
    }
});

// ========== Transfer Page Logic ==========
function initTransferPage() {
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadZone = document.getElementById('uploadZone');
    const addMoreBtn = document.getElementById('addMoreBtn');
    const sendBtn = document.getElementById('sendBtn');
    const backBtn = document.getElementById('backBtn');
    const qrBtn = document.getElementById('qrBtn');
    const linkBtn = document.getElementById('linkBtn');
    const receiveBtn = document.getElementById('receiveBtn');
    const fileList = document.getElementById('fileList');

    let uploadedFiles = [];
    let lastDownloadUrl = '';
    let lastExpireAt = '';
    let timerInterval = null;
    let shareMode = 'qr';

    // Login check helper
    function requireAuth(msg) {
        if (!IS_AUTHENTICATED) {
            const authArea = document.getElementById('authArea');
            if (authArea) {
                authArea.scrollIntoView({behavior: 'smooth'});
                authArea.style.outline = '2px solid #e74c3c';
                setTimeout(() => authArea.style.outline = '', 2000);
                if (msg) {
                    let container = authArea.querySelector('.auth-messages');
                    if (!container) {
                        container = document.createElement('div');
                        container.className = 'auth-messages';
                        authArea.insertBefore(container, authArea.firstChild);
                    }
                    container.innerHTML = '<div class="auth-msg auth-msg-error">' + msg + '</div>';
                }
            }
            return false;
        }
        return true;
    }

    // Auto-highlight auth area if redirected from a protected page
    const nextParam = new URLSearchParams(window.location.search).get('next');
    if (nextParam && !IS_AUTHENTICATED) {
        requireAuth('Please log in to continue.');
    }

    // Upload button click
    uploadBtn.addEventListener('click', () => {
        if (requireAuth('Please log in to upload files.')) fileInput.click();
    });
    addMoreBtn.addEventListener('click', () => {
        if (requireAuth('Please log in to upload files.')) fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        addFiles(Array.from(e.target.files));
        fileInput.value = '';
    });

    // Drag & drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('drag-over');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        if (!requireAuth('Please log in to upload files.')) return;
        addFiles(Array.from(e.dataTransfer.files));
    });

    const MAX_FILE_SIZE = 32 * 1024 * 1024; // 32 MB

    function addFiles(files) {
        if (files.length > 1) {
            showNotification('Only single file upload is supported.');
            return;
        }
        if (files[0].size === 0 && files[0].type === '') {
            showNotification('Folder upload is not supported. Please select a file.');
            return;
        }
        if (files[0].size > MAX_FILE_SIZE) {
            showNotification('File size exceeds 32 MB limit.');
            return;
        }
        uploadedFiles = [files[0]];
        renderFileList();
        showState('uploaded');
    }

    function renderFileList() {
        fileList.innerHTML = '';
        uploadedFiles.forEach((file, i) => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.innerHTML = `
                <span class="file-item-name">${file.name}</span>
                <span class="file-item-size">${formatSize(file.size)}</span>
                <button class="file-item-remove" data-index="${i}" aria-label="Remove file">&times;</button>
            `;
            fileList.appendChild(item);
        });

        // Remove file handler
        fileList.querySelectorAll('.file-item-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index);
                uploadedFiles.splice(idx, 1);
                if (uploadedFiles.length === 0) {
                    showState('initial');
                }
                renderFileList();
            });
        });
    }

    // Send button
    sendBtn.addEventListener('click', async () => {
        if (!requireAuth('Please log in to send files.')) return;
        if (uploadedFiles.length === 0) return;

        sendBtn.disabled = true;
        sendBtn.textContent = 'Uploading...';

        try {
            const formData = new FormData();
            formData.append('file', uploadedFiles[0]);

            const res = await fetch('/api/upload/', {
                method: 'POST',
                body: formData
            });

            const data = await res.json().catch(() => null);
            if (!res.ok) {
                showNotification(data?.message || 'Upload failed. Please try again.');
                return;
            }

            console.log(data.expire_at);
            console.log('upload response:', data);

            if (!res.ok) {
                showNotification(data?.message || 'Upload failed. Please try again.');
                return;
            }

            document.getElementById('shareCode').textContent = data.share_code;
            lastDownloadUrl = data.download_url;
            lastExpireAt = data.expire_at;

            showState('transferred');
            renderShareVisual();
            startTimer(lastExpireAt);
        } catch (err) {
            console.error('Upload error:', err);
            showNotification('Upload failed. Please try again.');
        } finally {
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send';
        }
    });

    // Back button
    backBtn.addEventListener('click', () => {
        uploadedFiles = [];
        fileList.innerHTML = '';
        lastDownloadUrl = '';
        lastExpireAt = '';

        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        document.getElementById('timeRemaining').textContent = 'Expires in 10:00';
        showState('initial');
    });

    // QR / Link mode selector (before send)
    qrBtn.addEventListener('click', () => {
        shareMode = 'qr';
        qrBtn.classList.add('active');
        qrBtn.setAttribute('aria-pressed', 'true');
        linkBtn.classList.remove('active');
        linkBtn.setAttribute('aria-pressed', 'false');
    });

    linkBtn.addEventListener('click', () => {
        shareMode = 'link';
        linkBtn.classList.add('active');
        linkBtn.setAttribute('aria-pressed', 'true');
        qrBtn.classList.remove('active');
        qrBtn.setAttribute('aria-pressed', 'false');
    });

    // QR / Link mode selector (after send, in transferred state)
    const qrBtnResult = document.getElementById('qrBtnResult');
    const linkBtnResult = document.getElementById('linkBtnResult');

    function syncResultToggle() {
        if (shareMode === 'qr') {
            qrBtnResult.classList.add('active');
            qrBtnResult.setAttribute('aria-pressed', 'true');
            linkBtnResult.classList.remove('active');
            linkBtnResult.setAttribute('aria-pressed', 'false');
        } else {
            linkBtnResult.classList.add('active');
            linkBtnResult.setAttribute('aria-pressed', 'true');
            qrBtnResult.classList.remove('active');
            qrBtnResult.setAttribute('aria-pressed', 'false');
        }
    }

    qrBtnResult.addEventListener('click', () => {
        shareMode = 'qr';
        syncResultToggle();
        renderShareVisual();
    });

    linkBtnResult.addEventListener('click', () => {
        shareMode = 'link';
        syncResultToggle();
        renderShareVisual();
    });

    // Receive button
    receiveBtn.addEventListener('click', async () => {
        const code = document.getElementById('receiveCode').value.trim().toLowerCase();
        if (!code) return;

        window.location.href = '/d/' + code + '/';
    });

    function renderShareVisual() {
        syncResultToggle();
        const qrDisplay = document.getElementById('qrDisplay');
        const linkDisplay = document.getElementById('linkDisplay');
        if (shareMode === 'qr') {
            qrDisplay.classList.remove('hidden');
            linkDisplay.classList.add('hidden');
            const qrImage = document.getElementById('qrImage');
            qrImage.src = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(lastDownloadUrl);
        } else {
            qrDisplay.classList.add('hidden');
            linkDisplay.classList.remove('hidden');
            document.getElementById('shareLink').textContent = lastDownloadUrl;
        }
    }

    // Copy link button in transferred state
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(lastDownloadUrl);
            copyLinkBtn.textContent = 'Copied!';
            setTimeout(() => copyLinkBtn.textContent = 'Copy', 1500);
        });
    }

    function showState(state) {
        document.getElementById('sendInitial').classList.toggle('hidden', state !== 'initial');
        document.getElementById('sendUploaded').classList.toggle('hidden', state !== 'uploaded');
        document.getElementById('sendTransferred').classList.toggle('hidden', state !== 'transferred');
    }

    function startTimer(expireAt) {
        const timerEl = document.getElementById('timeRemaining');

        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        function updateTimer() {
            const expireTime = new Date(expireAt).getTime();
            const now = Date.now();
            const diffMs = expireTime - now;

            if (diffMs <= 0) {
                timerEl.textContent = 'Expired';
                clearInterval(timerInterval);
                timerInterval = null;
                return;
            }

            const totalSeconds = Math.floor(diffMs / 1000);
            const m = Math.floor(totalSeconds / 60);
            const s = totalSeconds % 60;
            timerEl.textContent = `Expires in ${m}:${s.toString().padStart(2, '0')}`;
        }

        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
    }

    // ========== Auth Toggle (Login / Signup) ==========
    const loginToggle = document.getElementById('loginToggle');
    const signupToggle = document.getElementById('signupToggle');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (loginToggle && signupToggle) {
        loginToggle.addEventListener('click', () => {
            loginToggle.classList.add('active');
            loginToggle.setAttribute('aria-pressed', 'true');
            signupToggle.classList.remove('active');
            signupToggle.setAttribute('aria-pressed', 'false');
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
        });

        signupToggle.addEventListener('click', () => {
            signupToggle.classList.add('active');
            signupToggle.setAttribute('aria-pressed', 'true');
            loginToggle.classList.remove('active');
            loginToggle.setAttribute('aria-pressed', 'false');
            signupForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
        });
    }

    // Handle resend from history page
    const params = new URLSearchParams(window.location.search);
    const resentCode = params.get('resent_code');
    const resentUrl = params.get('resent_url');
    const resentName = params.get('resent_name');
    const resentExpireAt = params.get('resent_expire_at');

    console.log('resentCode:', resentCode);
    console.log('resentUrl:', resentUrl);
    console.log('resentExpireAt:', resentExpireAt);

    if (resentCode && resentUrl && resentExpireAt) {
        document.getElementById('shareCode').textContent = resentCode;
        lastDownloadUrl = resentUrl;
        lastExpireAt = resentExpireAt;

        showState('transferred');
        renderShareVisual();
        startTimer(lastExpireAt);

        window.history.replaceState({}, '', '/');
    }

    // Load recent files in profile panel
    const recentFiles = document.getElementById('recentFiles');
    if (recentFiles && IS_AUTHENTICATED) {
        fetch('/api/history/')
            .then(res => res.json())
            .then(data => {
                if (data.items && data.items.length > 0) {
                    recentFiles.innerHTML = '';
                    data.items.slice(0, 3).forEach(item => {
                        const div = document.createElement('div');
                        div.className = 'recent-file-item';
                        div.innerHTML = `<span class="recent-file-name">${item.name}</span><span class="recent-file-size">${formatSize(item.size)}</span>`;
                        recentFiles.appendChild(div);
                    });
                }
                if (data.usage) {
                    const usedBytes = data.usage.used_bytes || 0;
                    const limitBytes = data.usage.limit_bytes || 1;

                    const percent = Math.min(100, (usedBytes / limitBytes) * 100);

                    const usageFill = document.querySelector('.usage-fill');
                    const usageText = document.querySelector('.usage-text');

                    if (usageFill) {
                        usageFill.style.width = `${percent}%`;
                    }

                    if (usageText) {
                        usageText.textContent = `${formatSize(usedBytes)} / ${formatSize(limitBytes)}`;
                    }
                }
            });
    }
}

// ========== History Page Logic ==========
function initHistoryPage() {
    const tableBody = document.getElementById('fileTableBody');
    const selectAll = document.getElementById('selectAll');
    const actionBtns = document.querySelectorAll('#resendBtn, #renameBtn, #downloadBtn, #deleteBtn');

    if (!IS_AUTHENTICATED) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;">Please log in to view your file history.</td></tr>';
        return;
    }

    fetch('/api/history/')
        .then(res => res.json())
        .then(data => {
            if (!data.items || data.items.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;">No files yet</td></tr>';
                return;
            }
            data.items.forEach(item => {
                const tr = document.createElement('tr');
                const status = item.is_available ? 'Available' : 'Expired';

                tr.className = 'file-row';
                tr.dataset.id = item.id;
                tr.dataset.url = item.download_url;
                tr.dataset.name = item.name;
                tr.dataset.type = item.type;
                tr.setAttribute('tabindex', '0');
                tr.innerHTML = `
                    <td><input type="checkbox" class="file-check" aria-label="Select file ${item.name}"></td>
                    <td class="file-name">${item.name}</td>
                    <td>${formatSize(item.size)}</td>
                    <td>${new Date(item.created_at).toLocaleDateString()}</td>
                    <td>${item.type}</td>
                    <td class="status ${item.is_available ? 'active' : 'expired'}">${status}</td>
                `;
                tableBody.appendChild(tr);
            });
            bindRowEvents();
            bindFilterEvents();
        });

    function bindRowEvents() {
        const rows = document.querySelectorAll('.file-row');

        function selectOnly(targetRow) {
            rows.forEach(r => {
                const cb = r.querySelector('.file-check');
                if (r === targetRow) {
                    cb.checked = !cb.checked;
                } else {
                    cb.checked = false;
                }
                r.classList.toggle('selected', cb.checked);
            });
            selectAll.checked = false;
            updateActionButtons();
        }

        rows.forEach(row => {
            const checkbox = row.querySelector('.file-check');
            row.addEventListener('click', (e) => {
                if (e.target.type === 'checkbox') {
                    e.preventDefault();
                }
                selectOnly(row);
            });
            row.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectOnly(row);
                }
            });
        });
    }

    function updateActionButtons() {
        const checked = document.querySelectorAll('.file-check:checked').length;
        actionBtns.forEach(btn => btn.disabled = checked === 0);
    }

    // Download selected files
    document.getElementById('downloadBtn').addEventListener('click', async () => {
    const selected = document.querySelector('.file-row.selected');
    if (!selected) return;

    const statusText = selected.querySelector('.status')?.textContent.trim();
    if (statusText === 'Expired') {
        showNotification('This file has expired.');
        return;
    }

    const shareId = selected.dataset.id;
    if (!shareId) {
        showNotification('Missing record id.');
        return;
    }

    const csrftoken = getCookie('csrftoken');

    const res = await fetch('/api/history/download/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify({ id: shareId }),
    });

    if (!res.ok) {
        const result = await res.json().catch(() => null);
        showNotification(result?.detail || 'Download failed.');
        return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = selected.dataset.name || 'download';
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
});

    // Delete (frontend only, no backend API)
    document.getElementById('deleteBtn').addEventListener('click', async () => {
        const selected = document.querySelector('.file-row.selected');
        if (!selected) return;

        const shareId = selected.dataset.id;
        if (!shareId) {
            showNotification('Missing record id.');
            return;
        }

        const confirmed = confirm('Delete this history record?');
        if (!confirmed) return;

        const csrftoken = getCookie('csrftoken');

        const res = await fetch('/api/history/delete/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify({ id: shareId }),
        });

    if (!res.ok) {
        const errText = await res.text();
        console.error('Delete failed:', errText);
        showNotification('Delete failed.');
        return;
    }
    if (!res.ok) {
    const errText = await res.text();
    console.error('Delete failed:', errText);
    alert('Delete failed.');
    return;
}
    window.location.reload();
});

    document.getElementById('renameBtn').addEventListener('click', async () => {
        const selected = document.querySelector('.file-row.selected');
        if (!selected) return;

        const shareId = selected.dataset.id;
        if (!shareId) {
            showNotification('Missing record id.');
            return;
        }

        const nameCell = selected.querySelector('.file-name');
        const currentName = nameCell.textContent.trim();
        const newName = prompt('Rename file:', currentName);

        if (!newName) return;

        const trimmedName = newName.trim();
        if (!trimmedName) {
            showNotification('File name cannot be empty.');
            return;
        }

        const csrftoken = getCookie('csrftoken');

        const res = await fetch('/api/history/rename/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify({
                id: shareId,
                name: trimmedName,
            }),
        });

        const result = await res.json().catch(() => null);
        console.log('rename response:', res.status, result);

        if (!res.ok) {
            showNotification(result?.detail || 'Rename failed.');
            return;
        }

        nameCell.textContent = result.name;
        selected.dataset.name = result.name;
    });

    //resend button
    document.getElementById('resendBtn').addEventListener('click', async () => {
    const selected = document.querySelector('.file-row.selected');
    if (!selected) return;

    const shareId = selected.dataset.id;
    if (!shareId) {
        showNotification('Missing record id.');
        return;
    }

    const csrftoken = getCookie('csrftoken');

    const res = await fetch('/api/history/resend/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify({ id: shareId }),
    });

    const result = await res.json().catch(() => null);
    console.log('resend response:', res.status, result);

    if (!res.ok) {
        showNotification(result?.detail || 'Resend failed.');
        return;
    }

    const params = new URLSearchParams({
        resent_code: result.share_code,
        resent_url: result.download_url,
        resent_name: result.name,
        resent_expire_at: result.expire_at,
    });

    window.location.href = '/?' + params.toString();
});

    // Filter buttons
    function bindFilterEvents() {
        const filterAll = document.getElementById('filterAll');
        const filterSent = document.getElementById('filterSent');
        const filterReceived = document.getElementById('filterReceived');
        const filterBtns = [filterAll, filterSent, filterReceived];

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');

                const filter = btn.id.replace('filter', '');
                document.querySelectorAll('.file-row').forEach(row => {
                    if (filter === 'All') {
                        row.style.display = '';
                    } else {
                        row.style.display = row.dataset.type === filter ? '' : 'none';
                    }
                    // Uncheck hidden rows
                    if (row.style.display === 'none') {
                        const cb = row.querySelector('.file-check');
                        cb.checked = false;
                        row.classList.remove('selected');
                    }
                });
                selectAll.checked = false;
                updateActionButtons();
            });
        });
    }
}

// ========== Utilities ==========
function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
