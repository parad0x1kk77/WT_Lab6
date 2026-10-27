async function loadReviews() {
  const box = document.getElementById('reviews-list');
  try {
    const response = await fetch('reviews.json');
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const comments = await response.json();
    box.textContent = '';
    comments.forEach(c => {
      const article = document.createElement('article');
      article.className = 'review';
      const h = document.createElement('h3');
      h.textContent = c.name;
      const mail = document.createElement('p');
      mail.className = 'review-email';
      mail.textContent = c.email;
      const body = document.createElement('p');
      body.textContent = c.body;
      article.append(h, mail, body);
      box.appendChild(article);
    });
  } catch (error) {
    box.textContent = 'Не вдалося завантажити відгуки: ' + error.message;
  }
}


// Зберігання інформації про ОС і браузер 
function saveSystemInfo() {
  const n = navigator;
  const info = {
    userAgent: n.userAgent,
    platform: (n.userAgentData && n.userAgentData.platform) || n.platform,
    browserBrands: n.userAgentData ? n.userAgentData.brands.map(b => b.brand + ' ' + b.version).join(', ') : 'н/д',
    vendor: n.vendor,
    language: n.language,
    languages: (n.languages || []).join(', '),
    cookieEnabled: n.cookieEnabled,
    onLine: n.onLine,
    hardwareConcurrency: n.hardwareConcurrency,
    deviceMemory: n.deviceMemory || 'н/д',
    screen: screen.width + 'x' + screen.height,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
  for (const [key, value] of Object.entries(info)) {
    localStorage.setItem(key, String(value));
  }
}

// Читання localStorage 
function renderStorageInfo() {
  const list = document.getElementById('storage-info');
  list.textContent = '';
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const li = document.createElement('li');
    li.textContent = key + ': ' + localStorage.getItem(key);
    list.appendChild(li);
  }
}

const MODAL_DELAY_MS = 5000;   

function initModal() {
  const modal = document.getElementById('contact-modal');
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');

  setTimeout(() => { if (!modal.open) modal.showModal(); }, MODAL_DELAY_MS);
  document.getElementById('modal-close').addEventListener('click', () => modal.close());

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = 'Надсилання…';

    const payload = Object.fromEntries(new FormData(form));

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        status.textContent = 'Помилка: ' + (result.error || 'HTTP ' + response.status);
        return;
      }

      status.textContent = result.message;
      form.reset();
      setTimeout(() => modal.close(), 2000);
    } catch (error) {
      status.textContent = 'Не вдалося надіслати: ' + error.message;
    }
  });
}

function initTheme() {
  const root = document.documentElement;
  const button = document.getElementById('theme-toggle');

  // Денна: 07:00-20:59
  // Нічна: 21:00-06:59
  const autoTheme = () => {
    const h = new Date().getHours();
    return h >= 7 && h < 21 ? 'light' : 'dark';
  };
  const apply = (theme) => {
    root.dataset.theme = theme;
    button.textContent = theme === 'dark' ? 'Денна тема' : 'Нічна тема';
  };

  let lastAuto = autoTheme();
  apply(lastAuto);
  button.addEventListener('click', () => apply(root.dataset.theme === 'dark' ? 'light' : 'dark'));

  // Автоперемикання 
  setInterval(() => {
    const current = autoTheme();
    if (current !== lastAuto) { lastAuto = current; apply(current); }
  }, 60000);
}

saveSystemInfo();
renderStorageInfo();
loadReviews();
initModal();
initTheme();