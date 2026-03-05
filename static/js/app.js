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

    // Login check helper
    function requireAuth() {
        if (!IS_AUTHENTICATED) {
            window.location.href = '/auth-required/';
            return false;
        }
        return true;
    }

    // Upload button click
    uploadBtn.addEventListener('click', () => { if (requireAuth()) fileInput.click(); });
    addMoreBtn.addEventListener('click', () => { if (requireAuth()) fileInput.click(); });

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
        if (!requireAuth()) return;
        addFiles(Array.from(e.dataTransfer.files));
    });

    function addFiles(files) {
        uploadedFiles = uploadedFiles.concat(files);
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
                <button class="file-item-remove" data-index="${i}">&times;</button>
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
    sendBtn.addEventListener('click', () => {
        const code = generateCode();
        document.getElementById('shareCode').textContent = code;
        showState('transferred');
        startTimer();
    });

    // Back button
    backBtn.addEventListener('click', () => {
        uploadedFiles = [];
        fileList.innerHTML = '';
        showState('initial');
    });

    // QR / Link buttons (visual only)
    qrBtn.addEventListener('click', () => {
        qrBtn.classList.toggle('active-action');
    });

    linkBtn.addEventListener('click', () => {
        linkBtn.classList.toggle('active-action');
    });

    // Receive button
    receiveBtn.addEventListener('click', () => {
        if (!requireAuth()) return;
        const code = document.getElementById('receiveCode').value.trim();
        if (code.length === 6) {
            alert('Looking up code: ' + code + '\n(Frontend demo only)');
        }
    });

    function showState(state) {
        document.getElementById('sendInitial').classList.toggle('hidden', state !== 'initial');
        document.getElementById('sendUploaded').classList.toggle('hidden', state !== 'uploaded');
        document.getElementById('sendTransferred').classList.toggle('hidden', state !== 'transferred');
    }

    function startTimer() {
        let seconds = 600; // 10 minutes
        const timerEl = document.getElementById('timeRemaining');
        const interval = setInterval(() => {
            seconds--;
            if (seconds <= 0) {
                clearInterval(interval);
                timerEl.textContent = 'Expired';
                return;
            }
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            timerEl.textContent = `Expires in ${m}:${s.toString().padStart(2, '0')}`;
        }, 1000);
    }

    // ========== Auth Toggle (Login / Signup) ==========
    const loginToggle = document.getElementById('loginToggle');
    const signupToggle = document.getElementById('signupToggle');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (loginToggle && signupToggle) {
        loginToggle.addEventListener('click', () => {
            loginToggle.classList.add('active');
            signupToggle.classList.remove('active');
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
        });

        signupToggle.addEventListener('click', () => {
            signupToggle.classList.add('active');
            loginToggle.classList.remove('active');
            signupForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
        });
    }
}

// ========== History Page Logic ==========
function initHistoryPage() {
    const filterAll = document.getElementById('filterAll');
    const filterSent = document.getElementById('filterSent');
    const filterReceived = document.getElementById('filterReceived');
    const selectAll = document.getElementById('selectAll');
    const rows = document.querySelectorAll('.file-row');
    const actionBtns = document.querySelectorAll('#resendBtn, #renameBtn, #downloadBtn, #deleteBtn');

    // Filter
    [filterAll, filterSent, filterReceived].forEach(btn => {
        btn.addEventListener('click', () => {
            [filterAll, filterSent, filterReceived].forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const type = btn.id.replace('filter', '').toLowerCase();
            rows.forEach(row => {
                if (type === 'all') {
                    row.style.display = '';
                } else {
                    row.style.display = row.dataset.type === type ? '' : 'none';
                }
            });
        });
    });

    // Row selection
    rows.forEach(row => {
        const checkbox = row.querySelector('.file-check');
        row.addEventListener('click', (e) => {
            if (e.target.type === 'checkbox') return;
            checkbox.checked = !checkbox.checked;
            row.classList.toggle('selected', checkbox.checked);
            updateActionButtons();
        });

        checkbox.addEventListener('change', () => {
            row.classList.toggle('selected', checkbox.checked);
            updateActionButtons();
        });
    });

    // Select all
    selectAll.addEventListener('change', () => {
        rows.forEach(row => {
            if (row.style.display !== 'none') {
                const cb = row.querySelector('.file-check');
                cb.checked = selectAll.checked;
                row.classList.toggle('selected', selectAll.checked);
            }
        });
        updateActionButtons();
    });

    function updateActionButtons() {
        const checked = document.querySelectorAll('.file-check:checked').length;
        actionBtns.forEach(btn => btn.disabled = checked === 0);
    }

    // Action button demos
    document.getElementById('deleteBtn').addEventListener('click', () => {
        const selected = document.querySelectorAll('.file-row.selected');
        selected.forEach(row => row.remove());
        updateActionButtons();
    });

    document.getElementById('downloadBtn').addEventListener('click', () => {
        alert('Download started (Frontend demo only)');
    });

    document.getElementById('renameBtn').addEventListener('click', () => {
        const selected = document.querySelector('.file-row.selected');
        if (selected) {
            const nameCell = selected.querySelector('.file-name');
            const newName = prompt('Rename file:', nameCell.textContent);
            if (newName) nameCell.textContent = newName;
        }
    });

    document.getElementById('resendBtn').addEventListener('click', () => {
        alert('File resent (Frontend demo only)');
    });
}

// ========== Utilities ==========
function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
