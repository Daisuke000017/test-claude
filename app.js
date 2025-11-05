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
let lastX = 0;
let lastY = 0;

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

    // サイズが0の場合はスキップ
    if (rect.width === 0 || rect.height === 0) {
        return;
    }

    // 既存の描画内容を保存
    const imageData = canvas.width > 0 && canvas.height > 0
        ? ctx.getImageData(0, 0, canvas.width, canvas.height)
        : null;

    canvas.width = rect.width;
    canvas.height = rect.height - 60; // ツールバーの高さを引く

    // 描画内容を復元
    if (imageData) {
        ctx.putImageData(imageData, 0, 0);
    }
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

    try {
        peer = new Peer({
            host: '0.peerjs.com',
            port: 443,
            path: '/',
            secure: true,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            },
            debug: 2
        });

        peer.on('open', (id) => {
            myPeerId = id;
            updateStatus('connected', 'オンライン');
            console.log('✅ PeerJS接続成功 - My peer ID:', id);
        });

        peer.on('connection', (conn) => {
            console.log('新しい接続を受信:', conn.peer);
            setupConnection(conn);
        });

        peer.on('error', (err) => {
            console.error('❌ Peer error:', err);
            updateStatus('offline', 'エラー発生: ' + err.type);

            // エラーの詳細を表示
            if (err.type === 'unavailable-id') {
                alert('このIDは既に使用されています。ページを再読み込みしてください。');
            } else if (err.type === 'network') {
                alert('ネットワークエラー。インターネット接続を確認してください。');
            } else if (err.type === 'server-error') {
                alert('サーバーエラー。しばらく待ってから再試行してください。');
            } else {
                alert('接続エラー: ' + err.message);
            }
        });

        peer.on('disconnected', () => {
            console.log('⚠️ PeerJS切断 - 再接続を試みます...');
            updateStatus('connecting', '再接続中...');
            peer.reconnect();
        });
    } catch (err) {
        console.error('❌ PeerJS初期化エラー:', err);
        alert('PeerJSの初期化に失敗しました: ' + err.message);
    }
}

// ルーム作成
function createRoom() {
    console.log('🎨 createRoom呼び出し - peer:', peer, 'myPeerId:', myPeerId);

    if (!peer) {
        console.error('❌ Peerオブジェクトが存在しません');
        alert('接続の初期化に失敗しました。ページを再読み込みしてください。');
        return;
    }

    if (!myPeerId) {
        console.warn('⚠️ まだPeer IDが取得されていません');
        alert('接続を確立中です。少々お待ちください。\n\n画面右上の接続状態が「オンライン」になってから再度お試しください。');
        return;
    }

    isHost = true;
    roomId = myPeerId;

    console.log('✅ ルーム作成成功 - Room ID:', roomId);

    elements.roomIdText.textContent = roomId;
    elements.roomIdDisplay.style.display = 'block';
    elements.createRoomBtn.disabled = true;

    showCanvas();
}

// ルーム参加
function joinRoom() {
    const inputRoomId = elements.joinRoomInput.value.trim();

    console.log('🚪 joinRoom呼び出し - inputRoomId:', inputRoomId);

    if (!inputRoomId) {
        alert('ルームIDを入力してください。');
        return;
    }

    if (!peer || !myPeerId) {
        console.warn('⚠️ Peer接続が確立されていません');
        alert('接続を確立中です。少々お待ちください。\n\n画面右上の接続状態が「オンライン」になってから再度お試しください。');
        return;
    }

    roomId = inputRoomId;
    console.log('🔌 ルームに接続を試みます:', roomId);
    const conn = peer.connect(roomId);

    conn.on('open', () => {
        console.log('✅ ルームに接続成功:', roomId);
        setupConnection(conn);
        showCanvas();
    });

    conn.on('error', (err) => {
        console.error('❌ 接続エラー:', err);
        alert('ルームへの接続に失敗しました。ルームIDを確認してください。\n\nエラー: ' + err.type);
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
    lastX = pos.x;
    lastY = pos.y;
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
        x0: lastX,
        y0: lastY,
        x1: pos.x,
        y1: pos.y,
        color: currentColor,
        size: currentBrushSize
    };

    drawLine(drawData);
    broadcastData({
        type: 'draw',
        data: drawData
    });

    lastX = pos.x;
    lastY = pos.y;
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
    }
}

function drawLine(data) {
    ctx.beginPath();
    ctx.moveTo(data.x0, data.y0);
    ctx.lineTo(data.x1, data.y1);
    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.closePath();
}

function drawRemoteLine(data) {
    ctx.beginPath();
    ctx.moveTo(data.x0, data.y0);
    ctx.lineTo(data.x1, data.y1);
    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.closePath();
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
