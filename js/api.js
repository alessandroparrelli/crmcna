// Supabase API wrapper
async function sb(endpoint, method = 'GET', body = null) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const options = {
    method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  };
  if (body) options.body = JSON.stringify(body);
  
  const res = await fetch(url, options);
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API Error: ${error}`);
  }
  return method === 'DELETE' ? null : await res.json();
}

// SHA256 hash function
async function sha256(msg) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Format currency
function formatCurrency(value) {
  return '€ ' + (value || 0).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Format date
function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('it-IT');
}

// Show loading overlay
function showLoading(message = 'Caricamento...') {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.querySelector('.loading-msg').textContent = message;
    overlay.style.display = 'flex';
  }
}

function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.style.display = 'none';
}
