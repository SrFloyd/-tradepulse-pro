
/* TradePulse Pro — navegação móvel e instalação PWA */
(() => {
  'use strict';

  const pages = [
    { file: 'index.html', label: 'Início', icon: '⌂' },
    { file: 'dashboard.html', label: 'Mercado', icon: '◈' },
    { file: 'risco.html', label: 'Risco', icon: '⛨' },
    { file: 'alertas.html', label: 'Alertas', icon: '♢' },
    { file: 'simulador.html', label: 'Simular', icon: '⇄' },
    { file: 'backtest.html', label: 'Backtest', icon: '▥' },
    { file: 'desempenho.html', label: 'Resultados', icon: '▤' },
    { file: 'conexao.html', label: 'Conexão', icon: '⌁' }
  ];

  const current = location.pathname.split('/').pop() || 'index.html';

  const escape = s => String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));

  const style = document.createElement('style');

  style.textContent = `
    :root {
      --tp-safe-bottom: env(safe-area-inset-bottom, 0px);
    }

    /* Oculta a navegação superior antiga em todas as páginas */
    .nav {
      display: none !important;
    }

    /* Espaço para a barra inferior não cobrir o conteúdo */
    body {
      padding-bottom: calc(90px + var(--tp-safe-bottom)) !important;
    }

    .tp-mobilebar {
      position: fixed;
      z-index: 9998;
      left: 10px;
      right: 10px;
      bottom: calc(8px + var(--tp-safe-bottom));
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 5px;
      padding: 7px;
      border: 1px solid rgba(116,151,204,.35);
      border-radius: 30px;
      background: rgba(8,15,29,.97);
      backdrop-filter: blur(18px);
      box-shadow: 0 8px 30px rgba(0,0,0,.34);
      font: 600 11px/1.2 system-ui, sans-serif;
    }

    .tp-mobilebar a,
    .tp-mobilebar button {
      min-width: 0;
      min-height: 58px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 5px;
      border: 0;
      border-radius: 16px;
      color: #aab7cc;
      text-decoration: none;
      background: transparent;
      font: inherit;
      cursor: pointer;
      padding: 5px 2px;
      -webkit-tap-highlight-color: transparent;
    }

    .tp-mobilebar a[aria-current="page"] {
      color: #fff;
      background: linear-gradient(135deg, #3478f6, #2556d9);
    }

    .tp-mobilebar .tp-icon {
      font-size: 23px;
      line-height: 1;
    }

    .tp-mobilebar a span:last-child,
    .tp-mobilebar button span:last-child {
      font-size: 12px;
    }

    .tp-moremenu {
      position: fixed;
      z-index: 9999;
      right: 12px;
      bottom: calc(88px + var(--tp-safe-bottom));
      width: min(230px, 70vw);
      display: none;
      padding: 8px;
      border: 1px solid #30415e;
      border-radius: 16px;
      background: #0c1526;
      box-shadow: 0 10px 34px #0008;
    }

    .tp-moremenu.aberto {
      display: grid;
      gap: 4px;
    }

    .tp-moremenu a {
      padding: 12px;
      border-radius: 10px;
      color: #e7eefb;
      text-decoration: none;
      font: 600 14px system-ui, sans-serif;
    }

    .tp-moremenu a:hover,
    .tp-moremenu a:focus {
      background: #1a2a45;
    }

    .tp-install {
      position: fixed;
      z-index: 9997;
      top: 12px;
      right: 12px;
      padding: 9px 12px;
      border: 1px solid #4d8bff;
      border-radius: 999px;
      background: #1e5ee8;
      color: white;
      font: 700 12px system-ui, sans-serif;
      box-shadow: 0 4px 16px #0004;
      display: none;
    }

    .tp-toast {
      position: fixed;
      z-index: 10000;
      left: 16px;
      right: 16px;
      bottom: calc(100px + var(--tp-safe-bottom));
      background: #17243a;
      border: 1px solid #38547c;
      color: #eef5ff;
      padding: 12px 14px;
      border-radius: 12px;
      font: 500 13px/1.45 system-ui, sans-serif;
      box-shadow: 0 6px 24px #0006;
    }

    @media (min-width: 800px) {
      .tp-mobilebar {
        left: 50%;
        right: auto;
        width: min(650px, calc(100vw - 40px));
        transform: translateX(-50%);
      }

      .tp-mobilebar a,
      .tp-mobilebar button {
        font-size: 12px;
      }
    }

    @media (prefers-reduced-motion: no-preference) {
      .tp-mobilebar a,
      .tp-mobilebar button {
        transition: background .16s ease, color .16s ease;
      }
    }
  `;

  document.head.appendChild(style);

  /* Botão para instalar o aplicativo */
  const install = document.createElement('button');
  install.className = 'tp-install';
  install.type = 'button';
  install.textContent = '＋ Instalar app';
  install.setAttribute('aria-label', 'Instalar TradePulse Pro');
  document.body.appendChild(install);

  /* Menu Mais: Backtesting, Desempenho e Conexão */
  const menu = document.createElement('nav');
  menu.className = 'tp-moremenu';
  menu.id = 'tp-moremenu';
  menu.setAttribute('aria-label', 'Mais ferramentas');

  menu.innerHTML = pages.slice(5).map(p =>
    `<a href="${escape(p.file)}">${escape(p.icon)} &nbsp; ${escape(p.label)}</a>`
  ).join('');

  document.body.appendChild(menu);

  /* Barra inferior */
  const bar = document.createElement('nav');
  bar.className = 'tp-mobilebar';
  bar.setAttribute('aria-label', 'Navegação principal');

  const primary = [
    pages[1],
    pages[2],
    pages[3],
    pages[4]
  ];

  bar.innerHTML = primary.map(p =>
    `<a href="${escape(p.file)}"
      ${current === p.file ? 'aria-current="page"' : ''}
      ${current === p.file ? 'aria-label="' + escape(p.label) + ', página atual"' : ''}>
      <span class="tp-icon">${escape(p.icon)}</span>
      <span>${escape(p.label)}</span>
    </a>`
  ).join('') + `
    <button
      type="button"
      id="tp-more"
      aria-expanded="false"
      aria-controls="tp-moremenu">
      <span class="tp-icon">•••</span>
      <span>Mais</span>
    </button>
  `;

  document.body.appendChild(bar);

  /* Abrir e fechar o menu Mais */
  const more = document.getElementById('tp-more');

  more.addEventListener('click', () => {
    const open = menu.classList.toggle('aberto');
    more.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', e => {
    if (!menu.contains(e.target) && !more.contains(e.target)) {
      menu.classList.remove('aberto');
      more.setAttribute('aria-expanded', 'false');
    }
  });

  /* Instalação PWA */
  let deferredPrompt = null;

  const showInstall = () => {
    install.style.display = deferredPrompt ? 'block' : 'none';
  };

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    showInstall();
  });

  install.addEventListener('click', async () => {
    if (!deferredPrompt) {
      toast(
        'No Chrome do Android, abra o menu ⋮ e escolha "Instalar app" ou "Adicionar à tela inicial".'
      );
      return;
    }

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    showInstall();
  });

  window.addEventListener('appinstalled', () => {
    install.style.display = 'none';
    toast('TradePulse Pro instalado no dispositivo.');
  });

  /* Mensagens temporárias */
  function toast(message) {
    const el = document.createElement('div');
    el.className = 'tp-toast';
    el.textContent = message;
    el.setAttribute('role', 'status');
    document.body.appendChild(el);

    setTimeout(() => el.remove(), 5500);
  }

  /* Registro do Service Worker */
  if (
    'serviceWorker' in navigator &&
    /^https?:$/.test(location.protocol)
  ) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./service-worker.js')
        .catch(() => {
          console.info(
            'PWA: não foi possível registrar o service worker neste ambiente.'
          );
        });
    });
  }
})();
