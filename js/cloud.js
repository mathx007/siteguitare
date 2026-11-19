/* Gratte Quest : compte et sauvegarde en ligne (Supabase). La clé ci-dessous est la clé publique du projet,
   faite pour être visible dans un site : chaque compte ne peut lire et modifier que sa propre sauvegarde. */
const Cloud = (() => {
  const URL = 'https://vnqiujrrlwfherqilfcb.supabase.co';
  const KEY = 'sb_publishable_FH6kAJhNnpuznGUUAz5Rsg_DJQ-CYyE';
  let sb = null, user = null;
  const subs = [];

  function client() {
    if (sb) return sb;
    if (!window.supabase || typeof window.supabase.createClient !== 'function') return null;
    try {
      sb = window.supabase.createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' } });
    } catch (e) { sb = null; return null; }
    sb.auth.onAuthStateChange((event, session) => {
      const u = session ? session.user : null;
      const changed = (u ? u.id : null) !== (user ? user.id : null);
      user = u;
      if (changed) subs.forEach((f) => { try { f(user, event); } catch (e) { /* écouteur en erreur */ } });
    });
    return sb;
  }

  async function init() {
    const c = client();
    if (!c) return null;
    try { const { data } = await c.auth.getSession(); user = data && data.session ? data.session.user : null; } catch (e) { user = null; }
    return user;
  }

  async function sendLink(email) {
    const c = client();
    if (!c) throw new Error('Service de connexion injoignable. Vérifie ta connexion internet.');
    const { error } = await c.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname, shouldCreateUser: true } });
    if (error) throw error;
  }

  async function signOut() {
    const c = client();
    if (c) { try { await c.auth.signOut(); } catch (e) { /* déjà déconnecté */ } }
    user = null;
  }

  async function load() {
    if (!user || !sb) return null;
    const { data, error } = await sb.from('saves').select('data').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    return data ? data.data : null;
  }

  async function save(obj) {
    if (!user || !sb) return;
    const { error } = await sb.from('saves').upsert({ user_id: user.id, data: obj, updated_at: new Date().toISOString() });
    if (error) throw error;
  }

  /* Droit à l'effacement : supprime le compte et sa sauvegarde côté serveur (fonction delete_my_account, limitée au compte connecté). */
  async function deleteAccount() {
    if (!user || !sb) throw new Error('Non connecté');
    const { error } = await sb.rpc('delete_my_account');
    if (error) throw error;
    try { await sb.auth.signOut({ scope: 'local' }); } catch (e) { /* session déjà invalide */ }
    user = null;
    subs.forEach((f) => { try { f(null, 'SIGNED_OUT'); } catch (e) { /* écouteur en erreur */ } });
  }

  return { init, sendLink, signOut, load, save, deleteAccount, onChange: (f) => subs.push(f), get user() { return user; }, get available() { return !!client(); } };
})();
