// ============================================================
// LOCADORA RETRÔ 90s - APLICAÇÃO PRINCIPAL
// ============================================================

let gamesCatalog = [];
let mobileGamesCatalog = [];
let activeGame = null;
let activeMobileGame = null;
let audioCtx = null;
let serverInfo = { localIp: window.location.hostname || 'localhost', port: window.location.port || 3000 };

// Inicializa o contexto de áudio para efeitos sonoros retrô
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Obter dados de rede do servidor para o QR Code
async function fetchServerInfo() {
  try {
    const res = await fetch('/api/info');
    if (res.ok) {
      serverInfo = await res.json();
    }
  } catch (err) {
    console.warn('Não foi possível obter /api/info:', err);
  }
}

// Efeito sonoro sintetizado: clique mecânico do cartucho
function playCartridgeClick() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {
    // Ignora se áudio bloqueado pelo navegador
  }
}

// Efeito sonoro sintetizado: TV ligando com estalo de tubo
function playTvPowerOn() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(15734, ctx.currentTime + 0.25); // Frequência do feixe CRT
    
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Ignora
  }
}

// Relógio estilo videocassete (VCR)
function startVcrClock() {
  const clockEl = document.getElementById('vcrClock');
  function update() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    clockEl.textContent = `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
  }
  update();
  setInterval(update, 1000);
}

// Carregar catálogo de jogos da estante (SNES)
async function loadGames() {
  try {
    const res = await fetch('games.json');
    gamesCatalog = await res.json();
    renderShelf(gamesCatalog);
  } catch (err) {
    console.error('Erro ao carregar games.json:', err);
  }
}

// Carregar catálogo de jogos Mobile (Android APK)
async function loadMobileGames() {
  try {
    const res = await fetch('mobile_games.json');
    mobileGamesCatalog = await res.json();
    renderMobileShelf(mobileGamesCatalog);
  } catch (err) {
    console.error('Erro ao carregar mobile_games.json:', err);
  }
}

// Renderizar fitas na prateleira SNES
function renderShelf(games) {
  const shelfEl = document.getElementById('gamesShelf');
  if (!shelfEl) return;
  shelfEl.innerHTML = '';

  games.forEach((game, index) => {
    const cartWrapper = document.createElement('div');
    cartWrapper.className = 'cartridge-wrapper';
    cartWrapper.dataset.gameId = game.id;

    const badgeClass = game.playable ? 'badge-ptbr' : 'badge-soon';
    const badgeText = game.badge || (game.playable ? 'PT-BR' : 'EM BREVE');

    cartWrapper.innerHTML = `
      <div class="cartridge-shell">
        <div class="cartridge-vents"></div>
        <div class="cartridge-label">
          <img src="${game.cover}" alt="${game.title}" class="cartridge-cover-img" loading="lazy">
          <div class="cartridge-info-strip">
            <div class="cartridge-title">${game.title}</div>
            <div class="cartridge-badge ${badgeClass}">${badgeText}</div>
          </div>
          <div class="rental-tag">Nº ${String(index + 1).padStart(3, '0')}</div>
        </div>
        <div class="cartridge-notches">
          <div class="cartridge-notch"></div>
          <div class="cartridge-notch"></div>
        </div>
      </div>
    `;

    cartWrapper.addEventListener('click', () => {
      playCartridgeClick();
      openGameModal(game);
    });

    shelfEl.appendChild(cartWrapper);
  });
}

// Renderizar dispositivos/jogos na prateleira Mobile
function renderMobileShelf(games) {
  const shelfEl = document.getElementById('mobileShelf');
  if (!shelfEl) return;
  shelfEl.innerHTML = '';

  games.forEach((game) => {
    const cardWrapper = document.createElement('div');
    cardWrapper.className = 'mobile-card-wrapper';
    cardWrapper.dataset.mobileId = game.id;

    cardWrapper.innerHTML = `
      <div class="mobile-device-shell">
        <div class="mobile-speaker"></div>
        <div class="mobile-screen-bezel">
          <img src="${game.cover}" alt="${game.title}" class="mobile-card-cover-img" loading="lazy">
          <div class="mobile-card-info">
            <div class="mobile-card-title">${game.title}</div>
            <div class="mobile-card-sub">${game.version} • ${game.apkSize}</div>
            <div class="mobile-card-badge">${game.badge || 'PT-BR'}</div>
          </div>
        </div>
        <div class="mobile-home-indicator"></div>
      </div>
    `;

    cardWrapper.addEventListener('click', () => {
      playCartridgeClick();
      openMobileGameModal(game);
    });

    shelfEl.appendChild(cardWrapper);
  });
}

// Abrir modal de jogo Mobile
function openMobileGameModal(game) {
  activeMobileGame = game;
  const modal = document.getElementById('mobileModal');

  document.getElementById('mobileModalCover').src = game.cover;
  document.getElementById('mobileModalTitle').textContent = game.title;
  document.getElementById('mobileModalSubtitle').textContent = game.subtitle || '';
  document.getElementById('mobileModalSystem').textContent = game.system || 'Android (arm64-v8a)';
  document.getElementById('mobileModalSize').textContent = game.apkSize || '266.5 MB';
  document.getElementById('mobileModalVersion').textContent = game.version || 'v2.1.0';
  document.getElementById('mobileModalGenre').textContent = game.genre || 'Card Game';
  document.getElementById('mobileModalPlayers').textContent = game.players || '1-4 Jogadores';
  document.getElementById('mobileModalPkg').textContent = game.packageName || 'com.direwolfdigital.munchkin';
  document.getElementById('mobileModalDev').textContent = `${game.developer || 'Dire Wolf'} / ${game.publisher || 'Steve Jackson Games'}`;
  document.getElementById('mobileModalTranslation').textContent = game.translation || 'Português (Brasil)';
  document.getElementById('mobileModalDescription').textContent = game.description || '';

  // Configurar link de download direto e QR Code com IP da rede local
  const currentHost = window.location.hostname;
  let baseOrigin;
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    // Para QR Code, usa o IP da rede local (ex: 10.4.0.172) para celulares na mesma rede Wi-Fi conseguirem acessar
    baseOrigin = `http://${serverInfo.localIp}:${serverInfo.port || 3000}`;
  } else {
    baseOrigin = window.location.origin;
  }

  const apkFullUrl = `${baseOrigin}/${game.apk}`;
  
  const btnDownload = document.getElementById('btnDirectDownloadApk');
  btnDownload.href = game.apk;
  btnDownload.download = game.filename || 'Munchkin-v2.1.0-PTBR.apk';
  btnDownload.innerHTML = `<span class="btn-icon">📥</span> BAIXAR APK DIRETO (${game.apkSize || '266 MB'})`;

  const inputUrl = document.getElementById('inputApkUrl');
  inputUrl.value = apkFullUrl;

  const qrImg = document.getElementById('qrCodeImg');
  if (qrImg) {
    qrImg.src = `assets/qr_munchkin.svg?t=${Date.now()}`;
  }

  modal.classList.remove('hidden');
}

// Fechar modal Mobile
function closeMobileGameModal() {
  document.getElementById('mobileModal').classList.add('hidden');
}

// Abrir modal de detalhes da fita
function openGameModal(game) {
  activeGame = game;
  const modal = document.getElementById('gameModal');
  
  document.getElementById('modalCover').src = game.cover;
  document.getElementById('modalTitle').textContent = game.title;
  document.getElementById('modalSubtitle').textContent = game.subtitle || '';
  document.getElementById('modalSystem').textContent = game.system || 'SNES';
  document.getElementById('modalYear').textContent = game.year || '1992';
  document.getElementById('modalGenre').textContent = game.genre || 'Aventura';
  document.getElementById('modalPlayers').textContent = game.players || '1 Jogador';
  document.getElementById('modalDev').textContent = `${game.developer || 'Nintendo'} / ${game.publisher || 'Nintendo'}`;
  document.getElementById('modalTranslation').textContent = game.translation || 'Original';
  document.getElementById('modalDescription').textContent = game.description || '';

  const badgeEl = document.getElementById('modalBadge');
  badgeEl.textContent = game.badge || (game.playable ? 'PT-BR' : 'EM BREVE');
  badgeEl.className = `modal-badge ${game.playable ? 'badge-ptbr' : 'badge-soon'}`;

  // Configurações do botão de jogar
  const btnPlay = document.getElementById('btnPlayGame');
  const linkZip = document.getElementById('linkDownloadZip');
  const linkSfc = document.getElementById('linkDownloadSfc');
  const linkIps = document.getElementById('linkDownloadIps');

  if (linkZip && game.rom) {
    linkZip.href = game.rom;
    linkZip.download = `${game.id}.zip`;
  }
  if (linkSfc) {
    linkSfc.style.display = game.id === 'zelda-alttp-ptbr' ? 'block' : 'none';
  }
  if (linkIps) {
    linkIps.style.display = game.id === 'zelda-alttp-ptbr' ? 'block' : 'none';
  }

  if (game.playable) {
    btnPlay.disabled = false;
    btnPlay.style.opacity = '1';
    btnPlay.style.cursor = 'pointer';
    btnPlay.innerHTML = '<span class="btn-icon">▶</span> ALUGAR & JOGAR AGORA';
  } else {
    btnPlay.disabled = true;
    btnPlay.style.opacity = '0.5';
    btnPlay.style.cursor = 'not-allowed';
    btnPlay.innerHTML = '<span class="btn-icon">🔒</span> FITA ALUGADA / INDISPONÍVEL';
  }

  modal.classList.remove('hidden');
}

// Fechar modal
function closeGameModal() {
  document.getElementById('gameModal').classList.add('hidden');
}

// Iniciar emulação na TV CRT
function launchGame(game, customBlobUrl = null) {
  closeGameModal();
  playTvPowerOn();

  const tvRoom = document.getElementById('tvGameRoom');
  const titleEl = document.getElementById('tvGameTitle');
  const container = document.getElementById('emulatorContainer');
  const osd = document.getElementById('tvChannelOsd');

  titleEl.textContent = game.title.toUpperCase();
  tvRoom.classList.remove('hidden');

  // Reseta OSD de canal
  osd.style.animation = 'none';
  osd.offsetHeight; // trigger reflow
  osd.style.animation = 'osdFadeOut 5s forwards';

  // Limpa o viewport do emulador anterior
  container.innerHTML = '<div id="gameViewport" style="width:100%;height:100%;"></div>';

  const romUrl = customBlobUrl || game.rom;

  // Configuração global do EmulatorJS
  window.EJS_player = '#gameViewport';
  window.EJS_core = 'snes'; // Core snes9x em WebAssembly
  window.EJS_gameUrl = romUrl;
  window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';
  window.EJS_startOnLoaded = true;
  window.EJS_color = '#00ffff';
  window.EJS_gameName = game.title;
  window.EJS_language = 'pt-BR';
  window.EJS_autoscale = true;

  // Injeta o script carregador do EmulatorJS
  const oldScript = document.getElementById('ejs-loader-script');
  if (oldScript) {
    oldScript.remove();
  }

  const script = document.createElement('script');
  script.id = 'ejs-loader-script';
  script.src = 'https://cdn.emulatorjs.org/stable/data/loader.js';
  script.async = true;
  document.body.appendChild(script);
}

// Fechar tela da TV e voltar para a estante
function returnToShelf() {
  const tvRoom = document.getElementById('tvGameRoom');
  const container = document.getElementById('emulatorContainer');
  
  // Limpa emulador
  container.innerHTML = '';
  const script = document.getElementById('ejs-loader-script');
  if (script) script.remove();

  tvRoom.classList.add('hidden');
}

// Configurar ouvintes de eventos da interface
function setupEventListeners() {
  // Alternância de Abas do Catálogo (SNES vs Mobile)
  const tabSnes = document.getElementById('tabSnes');
  const tabMobile = document.getElementById('tabMobile');
  const snesSection = document.getElementById('snesSection');
  const mobileSection = document.getElementById('mobileSection');

  if (tabSnes && tabMobile) {
    tabSnes.addEventListener('click', () => {
      playCartridgeClick();
      tabSnes.classList.add('active');
      tabMobile.classList.remove('active');
      snesSection.classList.remove('hidden');
      mobileSection.classList.add('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    tabMobile.addEventListener('click', () => {
      playCartridgeClick();
      tabMobile.classList.add('active');
      tabSnes.classList.remove('active');
      mobileSection.classList.remove('hidden');
      snesSection.classList.add('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Fechar modal SNES no X e fora do card
  document.getElementById('modalCloseBtn').addEventListener('click', closeGameModal);
  document.getElementById('gameModal').addEventListener('click', (e) => {
    if (e.target.id === 'gameModal') closeGameModal();
  });

  // Fechar modal Mobile no X e fora do card
  const mobileCloseBtn = document.getElementById('mobileModalCloseBtn');
  const mobileModal = document.getElementById('mobileModal');
  if (mobileCloseBtn) {
    mobileCloseBtn.addEventListener('click', closeMobileGameModal);
  }
  if (mobileModal) {
    mobileModal.addEventListener('click', (e) => {
      if (e.target.id === 'mobileModal') closeMobileGameModal();
    });
  }

  // Abas internas de instruções do Modal Mobile
  document.querySelectorAll('.inst-tab').forEach((tabBtn) => {
    tabBtn.addEventListener('click', () => {
      document.querySelectorAll('.inst-tab').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.inst-panel').forEach((p) => p.classList.remove('active'));
      tabBtn.classList.add('active');
      const targetId = tabBtn.dataset.target;
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });

  // Copiar link do APK no Modal Mobile
  const btnCopy = document.getElementById('btnCopyApkUrl');
  const inputApkUrl = document.getElementById('inputApkUrl');
  if (btnCopy && inputApkUrl) {
    btnCopy.addEventListener('click', () => {
      inputApkUrl.select();
      navigator.clipboard.writeText(inputApkUrl.value).then(() => {
        btnCopy.textContent = '✅ Copiado!';
        setTimeout(() => {
          btnCopy.textContent = '📋 Copiar Link';
        }, 2000);
      }).catch(() => {
        btnCopy.textContent = '✅ Selecionado!';
      });
    });
  }

  // Botão de jogar no modal SNES
  document.getElementById('btnPlayGame').addEventListener('click', () => {
    if (activeGame && activeGame.playable) {
      launchGame(activeGame);
    }
  });

  // Botão voltar à estante
  document.getElementById('btnBackToShelf').addEventListener('click', returnToShelf);

  // Alternar filtro de scanlines CRT
  const btnScanlines = document.getElementById('btnToggleScanlines');
  const overlay = document.getElementById('crtOverlay');
  btnScanlines.addEventListener('click', () => {
    overlay.classList.toggle('off');
    const isOn = !overlay.classList.contains('off');
    btnScanlines.textContent = `Filtro CRT: ${isOn ? 'LIGADO' : 'DESLIGADO'}`;
  });

  // Alternar tela cheia
  const btnFullscreen = document.getElementById('btnFullscreen');
  btnFullscreen.addEventListener('click', () => {
    const cabinet = document.querySelector('.crt-cabinet');
    if (!document.fullscreenElement) {
      if (cabinet.requestFullscreen) {
        cabinet.requestFullscreen();
      } else if (cabinet.webkitRequestFullscreen) {
        cabinet.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  });

  // Carregar ROM externa (.sfc, .smc, .zip)
  const btnCustomRom = document.getElementById('btnCustomRom');
  const romInput = document.getElementById('romFileInput');
  btnCustomRom.addEventListener('click', () => romInput.click());

  romInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const blobUrl = URL.createObjectURL(file);
      const customGame = {
        id: 'custom-' + Date.now(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        subtitle: 'ROM Carregada Localmente',
        system: 'SNES',
        year: 'Custom',
        genre: 'Personalizado',
        playable: true,
        rom: blobUrl
      };
      launchGame(customGame, blobUrl);
    }
  });

  // Fechar modais com tecla ESC
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!document.getElementById('gameModal').classList.contains('hidden')) {
        closeGameModal();
      }
      if (document.getElementById('mobileModal') && !document.getElementById('mobileModal').classList.contains('hidden')) {
        closeMobileGameModal();
      }
    }
  });

  // Notifica o emulador ao rotacionar a tela do smartphone
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);
  });
}

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
  startVcrClock();
  await fetchServerInfo();
  loadGames();
  loadMobileGames();
  setupEventListeners();
});
