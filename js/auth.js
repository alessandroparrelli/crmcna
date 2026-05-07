const Auth = {
  getUser() {
    const session = localStorage.getItem('cna_crm_session');
    return session ? JSON.parse(session) : null;
  },

  setUser(user) {
    localStorage.setItem('cna_crm_session', JSON.stringify(user));
  },

  isAuthenticated() {
    return this.getUser() !== null;
  },

  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  },

  async login(email, password) {
    const hash = await sha256(password);
    const users = await sb(
      `cna_users?email=eq.${encodeURIComponent(email)}&password_sha256=eq.${hash}&attivo=eq.true&select=*`
    );
    
    if (!users || users.length === 0) {
      throw new Error('Credenziali non valide');
    }

    const user = users[0];
    
    // Save session
    this.setUser({
      id: user.id,
      email: user.email,
      nome: user.nome,
      cognome: user.cognome,
      ruolo: user.ruolo,
      hash
    });

    // Update last login
    await sb(`cna_users?id=eq.${user.id}`, 'PATCH', { 
      last_login: new Date().toISOString() 
    });

    // Log login
    await sb('cna_login_logs', 'POST', {
      user_id: user.id,
      email: user.email,
      nome_completo: `${user.nome} ${user.cognome}`,
      esito: 'successo',
      ip_address: 'web',
      user_agent: navigator.userAgent
    });

    return user;
  },

  logout() {
    localStorage.removeItem('cna_crm_session');
    window.location.href = 'index.html';
  },

  isAdmin() {
    const user = this.getUser();
    return user && user.ruolo === 'admin';
  },

  isCommerciale() {
    const user = this.getUser();
    return user && user.ruolo === 'commerciale';
  },

  isSupervisore() {
    const user = this.getUser();
    return user && user.ruolo === 'supervisore';
  },

  isOperatore() {
    const user = this.getUser();
    return user && user.ruolo === 'utente';
  }
};
