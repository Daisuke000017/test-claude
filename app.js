// グローバル変数
let peer = null;
let connections = [];
let isHost = false;
let myPeerId = null;
let roomId = null;

// Canvas関連
let canvas, ctx;
let isDrawing = false;
let currentColor = '#000000';
let currentBrushSize = 5;

// UI要素
const elements = {
    status: document.getElementById('status'),
    connectionPanel: document.getElementById('connectionPanel'),
    canvasContainer: document.getElementById('canvasContainer'),
    createRoomBtn: document.getElementById('createRoomBtn'),
    joinRoomBtn: document.getElementById('joinRoomBtn'),
    joinRoomInput: document.getElementById('joinRoomInput'),
    roomIdDisplay: document.getElementById('roomIdDisplay'),
    roomIdText: document.getElementById('roomIdText'),
    copyRoomIdBtn: document.getElementById('copyRoomIdBtn'),
    colorPicker: document.getElementById('colorPicker'),
    brushSize: document.getElementById('brushSize'),
    brushSizeLabel: document.getElementById('brushSizeLabel'),
    clearBtn: document.getElementById('clearBtn'),
    saveBtn: document.getElementById('saveBtn'),
    leaveRoomBtn: document.getElementById('leaveRoomBtn'),
    participantCount: document.getElementById('participantCount'),
    cursors: document.getElementById('cursors')
};

// 初期化
document.addEventListener('DOMContentLoaded', init);

function init() {
    // Canvas初期化
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // イベントリスナー設定
    setupEventListeners();

    // PeerJS初期化
    initPeer();
}

function resizeCanvas() {
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();

    // 既存の描画内容を保存
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    canvas.width = rect.width;
    canvas.height = rect.height - 60; // ツールバーの高さを引く

    // 描画内容を復元
    ctx.putImageData(imageData, 0, 0);
}

function setupEventListeners() {
    // ルーム作成・参加
    elements.createRoomBtn.addEventListener('click', createRoom);
    elements.joinRoomBtn.addEventListener('click', joinRoom);
    elements.joinRoomInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') joinRoom();
    });
    elements.copyRoomIdBtn.addEventListener('click', copyRoomId);
    elements.leaveRoomBtn.addEventListener('click', leaveRoom);

    // お絵かき機能
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // タッチイベント
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', stopDrawing);

    // ツール
    elements.colorPicker.addEventListener('change', (e) => {
        currentColor = e.target.value;
    });

    elements.brushSize.addEventListener('input', (e) => {
        currentBrushSize = e.target.value;
        elements.brushSizeLabel.textContent = currentBrushSize;
    });

    elements.clearBtn.addEventListener('click', clearCanvas);
    elements.saveBtn.addEventListener('click', saveImage);
}

// PeerJS初期化
function initPeer() {
    updateStatus('connecting', '接続中...');

    peer = new Peer({
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        }
    });

    peer.on('open', (id) => {
        myPeerId = id;
        updateStatus('connected', 'オンライン');
        console.log('My peer ID:', id);
    });

    peer.on('connection', (conn) => {
        setupConnection(conn);
    });

    peer.on('error', (err) => {
        console.error('Peer error:', err);
        updateStatus('offline', 'エラー発生');
        alert('接続エラー: ' + err.message);
    });
}

// ルーム作成
function createRoom() {
    if (!peer || !myPeerId) {
        alert('接続を確立中です。少々お待ちください。');
        return;
    }

    isHost = true;
    roomId = myPeerId;

    elements.roomIdText.textContent = roomId;
    elements.roomIdDisplay.style.display = 'block';
    elements.createRoomBtn.disabled = true;

    showCanvas();
}

// ルーム参加
function joinRoom() {
    const inputRoomId = elements.joinRoomInput.value.trim();

    if (!inputRoomId) {
        alert('ルームIDを入力してください。');
        return;
    }

    if (!peer || !myPeerId) {
        alert('接続を確立中です。少々お待ちください。');
        return;
    }

    roomId = inputRoomId;
    const conn = peer.connect(roomId);

    conn.on('open', () => {
        setupConnection(conn);
        showCanvas();
    });

    conn.on('error', (err) => {
        console.error('Connection error:', err);
        alert('ルームへの接続に失敗しました。ルームIDを確認してください。');
    });
}

// 接続設定
function setupConnection(conn) {
    connections.push(conn);
    updateParticipantCount();

    conn.on('data', (data) => {
        handleReceivedData(data);
    });

    conn.on('close', () => {
        connections = connections.filter(c => c !== conn);
        updateParticipantCount();
        removeRemoteCursor(conn.peer);
    });

    // 既存のキャンバス内容を新しい参加者に送信（ホストの場合）
    if (isHost) {
        setTimeout(() => {
            const imageData = canvas.toDataURL();
            conn.send({
                type: 'canvas-sync',
                data: imageData
            });
        }, 100);
    }
}

// 受信データ処理
function handleReceivedData(data) {
    switch (data.type) {
        case 'draw':
            drawRemoteLine(data.data);
            break;
        case 'clear':
            clearCanvas(false);
            break;
        case 'cursor':
            updateRemoteCursor(data.peerId, data.data);
            break;
        case 'canvas-sync':
            syncCanvas(data.data);
            break;
    }
}

// お絵かき機能
function startDrawing(e) {
    isDrawing = true;
    const pos = getMousePos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
}

function draw(e) {
    const pos = getMousePos(e);

    // カーソル位置を送信
    broadcastData({
        type: 'cursor',
        peerId: myPeerId,
        data: pos
    });

    if (!isDrawing) return;

    const drawData = {
        x: pos.x,
        y: pos.y,
        color: currentColor,
        size: currentBrushSize
    };

    drawLine(drawData);
    broadcastData({
        type: 'draw',
        data: drawData
    });
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        ctx.closePath();
    }
}

function drawLine(data) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.size;
    ctx.lineTo(data.x, data.y);
    ctx.stroke();
}

function drawRemoteLine(data) {
    const prevStrokeStyle = ctx.strokeStyle;
    const prevLineWidth = ctx.lineWidth;

    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.size;
    ctx.lineTo(data.x, data.y);
    ctx.stroke();

    ctx.strokeStyle = prevStrokeStyle;
    ctx.lineWidth = prevLineWidth;
}

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

// キャンバス操作
function clearCanvas(broadcast = true) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (broadcast) {
        broadcastData({ type: 'clear' });
    }
}

function saveImage() {
    const link = document.createElement('a');
    link.download = `drawing-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
}

function syncCanvas(imageData) {
    const img = new Image();
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
    img.src = imageData;
}

// リモートカーソル管理
function updateRemoteCursor(peerId, pos) {
    let cursor = document.getElementById(`cursor-${peerId}`);

    if (!cursor) {
        cursor = document.createElement('div');
        cursor.id = `cursor-${peerId}`;
        cursor.className = 'remote-cursor';
        cursor.style.backgroundColor = getRandomColor(peerId);
        elements.cursors.appendChild(cursor);
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;

    cursor.style.left = (pos.x * scaleX) + 'px';
    cursor.style.top = (pos.y * scaleY + 60) + 'px'; // ツールバー分オフセット
}

function removeRemoteCursor(peerId) {
    const cursor = document.getElementById(`cursor-${peerId}`);
    if (cursor) {
        cursor.remove();
    }
}

function getRandomColor(seed) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7B801', '#6C5CE7'];
    const index = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
}

// データ送信
function broadcastData(data) {
    connections.forEach(conn => {
        if (conn.open) {
            conn.send(data);
        }
    });
}

// UI更新
function updateStatus(status, text) {
    elements.status.className = `connection-status ${status}`;
    elements.status.querySelector('.status-text').textContent = text;
}

function updateParticipantCount() {
    elements.participantCount.textContent = connections.length + 1;
}

function showCanvas() {
    elements.connectionPanel.style.display = 'none';
    elements.canvasContainer.style.display = 'flex';
    resizeCanvas();
}

function copyRoomId() {
    navigator.clipboard.writeText(roomId).then(() => {
        const originalText = elements.copyRoomIdBtn.textContent;
        elements.copyRoomIdBtn.textContent = '✓ コピーしました！';
        setTimeout(() => {
            elements.copyRoomIdBtn.textContent = originalText;
        }, 2000);
    });
}

function leaveRoom() {
    if (confirm('本当に退室しますか？')) {
        connections.forEach(conn => conn.close());
        connections = [];
        location.reload();
    }
}
