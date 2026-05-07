// ============================================
// CRM CNA - Core JS
// ============================================

const SB_URL = 'https://ohahuqlfzqckaevaffbt.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oYWh1cWxmenFja2FldmFmZmJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODI4NzQsImV4cCI6MjA4OTc1ODg3NH0.MG1N3UUIfISDAi_ArFjxN6ZlHJfk5D77vSeE7qZr020';

// ---- API ----
async function api(endpoint, method = 'GET', body = null) {
  const opts = {
    method,
    headers: {
      'apikey': SB_KEY,
      'Authorization': 'Bearer ' + SB_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(SB_URL + '/rest/v1/' + endpoint, opts);
  if (!res.ok) throw new Error('API ' + res.status + ': ' + await res.text());
  if (method === 'DELETE') return null;
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

// ---- SHA256 ----
async function sha256(msg) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

// ---- AUTH ----
const Auth = {
  get() { const s = localStorage.getItem('cna_crm'); return s ? JSON.parse(s) : null; },
  set(u) { localStorage.setItem('cna_crm', JSON.stringify(u)); },
  check(redirectTo) {
    const u = this.get();
    if (!u) { window.location.href = redirectTo || 'index.html'; return null; }
    return u;
  },
  logout() { localStorage.removeItem('cna_crm'); window.location.href = 'index.html'; },
  async login(email, password) {
    const hash = await sha256(password);
    const users = await api('cna_users?email=eq.' + encodeURIComponent(email) + '&password_sha256=eq.' + hash + '&attivo=eq.true&select=id,nome,cognome,email,ruolo');
    if (!users || users.length === 0) throw new Error('Credenziali non valide');
    const u = users[0];
    this.set({ id: u.id, nome: u.nome, cognome: u.cognome, email: u.email, ruolo: u.ruolo });
    // update last_login silently
    fetch(SB_URL + '/rest/v1/cna_users?id=eq.' + u.id, {
      method: 'PATCH',
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ last_login: new Date().toISOString() })
    }).catch(() => {});
    return u;
  }
};

// ---- UTILS ----
function fmt_date(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('it-IT');
}

function fmt_currency(v) {
  return '€ ' + parseFloat(v || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 });
}

function badge(text, type) {
  const map = { success: '#D1FAE5|#065F46', warning: '#FEF3C7|#92400E', danger: '#FEE2E2|#991B1B', info: '#DBEAFE|#1E40AF', '': '#F1F5F9|#475569' };
  const [bg, color] = (map[type] || map['']).split('|');
  return `<span style="background:${bg};color:${color};padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600">${text}</span>`;
}

// ---- NAV ----
function buildNav(active, base) {
  const me = Auth.get();
  if (!me) return '';
  const b = base || '';
  const tabs = [
    { label: '📊 Dashboard', url: b + (b ? '../' : '') + 'dashboard.html', always: true },
    { label: '📈 Statistiche', url: b + 'pages/statistiche.html', always: true },
    { label: '👥 Commerciali', url: b + 'pages/commerciali.html', roles: ['admin','supervisore'] },
    { label: '💰 Provvigioni', url: b + 'pages/provvigioni.html', roles: ['admin','supervisore'] },
    { label: '📋 Tipi Contratto', url: b + 'pages/tipi-contratto.html', roles: ['admin'] },
    { label: '🎯 Campagne', url: b + 'pages/campagne.html', always: true },
  ];
  return tabs
    .filter(t => t.always || (t.roles && t.roles.includes(me.ruolo)))
    .map(t => `<button class="tab-btn${t.label === active ? ' active' : ''}" onclick="location.href='${t.url}'">${t.label}</button>`)
    .join('');
}

function buildHeader(me) {
  return `
    <header>
      <div class="header-left">
        <img src="https://www.cnaroma.it/wp-content/uploads/2024/01/logo-cna-roma.png" class="logo-img" alt="CNA">
        <h1 class="header-title">CRM CNA</h1>
      </div>
      <div class="header-right-wrap">
        <div class="user-chip">
          <span>${me.nome} ${me.cognome}</span>
          <div class="user-dot"></div>
        </div>
        <button class="btn btn-logout" onclick="Auth.logout()">Esci</button>
      </div>
    </header>`;
}
