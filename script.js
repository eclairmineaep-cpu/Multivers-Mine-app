'use strict';

const TMDB_KEY  = '5f6e1dfa7cdf76a0d699e84a93cd1c5e';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG       = 'https://image.tmdb.org/t/p/';

/* ══════════════════════════════════════
   CATALOGUES
══════════════════════════════════════ */
const CATALOGUE = [
  { id: 10191,   type: 'animation' },
  { id: 82702,   type: 'animation' },
  { id: 166428,  type: 'animation' },
  { id: 1087192, type: 'animation' },
];

const SERIES_CATALOGUE = [
  { id: 78173, type: 'serie' },
];

const ANIME_CATALOGUE = [];

/* ══════════════════════════════════════
   SOURCES VIDÉO
══════════════════════════════════════ */
const VIDEO_SOURCES = {
  10191: [
    { id: 'fhd', label: 'Full HD', quality: '1080p', icon: '🎬', iconClass: 'gold', url: 'https://multivers-mine.eclairminestream.workers.dev/video-data-1/vid%C3%A9o%20data%201.mp4', available: true },
    { id: 'uhd', label: 'Ultra HD', quality: '4K', icon: '💎', iconClass: 'blue', url: '', available: false }
  ],
  82702:   [{ id:'fhd', label:'Full HD', quality:'1080p', icon:'🎬', iconClass:'gold', url:'', available:false }],
  166428:  [{ id:'fhd', label:'Full HD', quality:'1080p', icon:'🎬', iconClass:'gold', url:'', available:false }],
  1087192: [{ id:'fhd', label:'Full HD', quality:'1080p', icon:'🎬', iconClass:'gold', url:'', available:false }],
};

const AVATAR_IDS = [
  { name: 'Iron Man',       path: '/pIkveSmvQ0MZNwMiqs0FW1JZBRI.jpg' },
  { name: 'Captain America',path: '/m9C8MBmxlqxfMQHEIAFEtQcAbAZ.jpg' },
  { name: 'Spider-Man',     path: '/lwOqFKBKQFNaGXaVT1oHJUFGqrU.jpg' },
  { name: 'Black Widow',    path: '/6GNMpn0ZCUYQEbkBnNjNLKvBGl6.jpg' },
  { name: 'Thor',           path: '/1a5gNNhpXqYCfTmWHxrIYgZzJqp.jpg' },
  { name: 'Moana',          path: '/6YQLvAGYdBGCt2kXJlVaKIFDLJV.jpg' },
  { name: 'Simba',          path: '/kqA5fVJnFdxWHFyvEKbaqvGnq9q.jpg' },
  { name: 'Elsa',           path: '/9sVc5hNHPwWRxvb8DRcMiA8iC1v.jpg' },
  { name: 'Woody',          path: '/xD5e1WJmLzRFEe5Kqr3FBQF3n5V.jpg' },
  { name: 'WALL-E',         path: '/d2EiJb2GbCJl0X8CYeqfAFExcyZ.jpg' },
  { name: 'Nemo',           path: '/v2tEELJFKuGlD3DfFBsRs8U5I9U.jpg' },
  { name: 'Hiccup',         path: '/jBnk4ixPGIaGbPLuJxgEp8h7Jf7.jpg' },
  { name: 'Rapunzel',       path: '/uWnXvpfFHWYT1LbNRVXHvWxKCvh.jpg' },
  { name: 'Black Panther',  path: '/uxzzxijgPIY7slzFvMotPv8wjKA.jpg' },
  { name: 'Doctor Strange', path: '/2zuNuGCgMBQEwF0mfaW5VXFbQSr.jpg' },
];

/* ══ STATE ══ */
let moviesData     = {};
let seriesData     = {};
let animesData     = {};
let currentMovieId = null;
let currentSerieId = null;
let currentAnimeId = null;
let currentSeason  = 1;
let currentPage    = 'home';
let heroMovies     = [];
let heroIndex      = 0;
let heroTimer      = null;
let top10Week      = [];
let controlsTimer  = null;
let selectedAvatar = null;
let currentUser    = null;
let currentProfile = null;
let playerMode     = 'film';
let playerTmdbId   = null;
let playerSeason   = 1;
let playerEpisode  = 1;
let playerSourceId = null;
let pendingResumeTime = null;
let editingProfileIndex = null; // pour l'édition de profil
let currentStatsType = 'films'; // onglet stats actif

/* ══════════════════════════════════════
   ANTI-CHAUFFE — Paramètres vidéo
   preload="none", lecture progressive
   via bufferisée par chunks.
══════════════════════════════════════ */
const VIDEO_CONFIG = {
  // Préchargement minimal — on laisse le navigateur gérer
  preload: 'none',
  // Qualité adaptative : on utilise l'API de la vidéo pour limiter la mémoire
  // En évitant de garder plus de N secondes de buffer
  maxBufferSeconds: 60, // max 60s de buffer pour économiser la RAM/CPU
};

/* ══ STORAGE ══ */
function store(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {} }
function load(key, def)  { try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : def; } catch(e) { return def; } }

/* ══════════════════════════════════════
   INIT
══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initAuthParticles();
  initPlayerEvents();
  initControlsHide();
  checkSession();
});

function checkSession() {
  const session = load('mm_session', null);
  if (session && session.user) {
    currentUser = session.user;
    showProfileScreen();
  } else {
    showAuthScreen();
  }
}

function showAuthScreen() {
  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('profileScreen').style.display = 'none';
  document.getElementById('mainApp').style.display = 'none';
}

function launchApp() {
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('profileScreen').style.display = 'none';
  document.getElementById('mainApp').style.display = 'block';
  updateHeaderProfile();
  fetchAllContent();
}

/* ══ AUTH PARTICLES ══ */
function initAuthParticles() {
  const container = document.getElementById('authParticles');
  if (!container) return;
  for (let i = 0; i < 12; i++) { // Moins de particules pour économiser le CPU
    const p = document.createElement('div');
    p.className = 'auth-particle';
    const size = Math.random() * 4 + 2;
    p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;animation-duration:${Math.random()*12+8}s;animation-delay:${Math.random()*10}s;opacity:${Math.random()*0.6+0.2};`;
    container.appendChild(p);
  }
}

/* ══ AUTH ══ */
function showLogin() {
  document.getElementById('loginForm').classList.remove('page-hidden');
  document.getElementById('registerForm').classList.add('page-hidden');
}
function showRegister() {
  document.getElementById('loginForm').classList.add('page-hidden');
  document.getElementById('registerForm').classList.remove('page-hidden');
}
function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';
  if (!email || !pass) { errEl.textContent = 'Remplis tous les champs.'; return; }
  const users = load('mm_users', {});
  const user  = users[email];
  if (!user) { errEl.textContent = 'Aucun compte avec cet email.'; return; }
  if (user.password !== btoa(pass)) { errEl.textContent = 'Mot de passe incorrect.'; return; }
  currentUser = user;
  store('mm_session', { user });
  document.getElementById('authScreen').style.display = 'none';
  showProfileScreen();
}
function doRegister() {
  const username = document.getElementById('regUsername').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const pass     = document.getElementById('regPassword').value;
  const confirm  = document.getElementById('regConfirm').value;
  const errEl    = document.getElementById('registerError');
  errEl.textContent = '';
  if (!username || !email || !pass || !confirm) { errEl.textContent = 'Remplis tous les champs.'; return; }
  if (pass !== confirm) { errEl.textContent = 'Les mots de passe ne correspondent pas.'; return; }
  if (pass.length < 6)  { errEl.textContent = 'Mot de passe trop court (6 min).'; return; }
  if (!email.includes('@')) { errEl.textContent = 'Email invalide.'; return; }
  const users = load('mm_users', {});
  if (users[email]) { errEl.textContent = 'Email déjà utilisé.'; return; }
  const newUser = { username, email, password: btoa(pass), profiles: [] };
  users[email] = newUser;
  store('mm_users', users);
  currentUser = newUser;
  store('mm_session', { user: newUser });
  document.getElementById('authScreen').style.display = 'none';
  showProfileScreen();
}

/* ══ PROFILES ══ */
function showProfileScreen() {
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('profileScreen').style.display = 'flex';
  document.getElementById('mainApp').style.display = 'none';
  renderProfilePicker();
}
function renderProfilePicker() {
  const grid     = document.getElementById('profilesGrid');
  const profiles = currentUser.profiles || [];
  grid.innerHTML = '';
  profiles.forEach(p => {
    const div = document.createElement('div');
    div.className = 'profile-item';
    div.innerHTML = `<div class="profile-avatar-ring"><img src="${avatarUrl(p.avatar)}" alt="${p.name}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=1a1a2e&color=e8c97e&size=96'"></div><span class="profile-name">${p.name}</span>`;
    div.addEventListener('click', () => selectProfile(p));
    grid.appendChild(div);
  });
  if (profiles.length < 5) {
    const add = document.createElement('div');
    add.className = 'profile-item';
    add.innerHTML = `<div class="profile-add">+</div><span class="profile-name">Ajouter</span>`;
    add.addEventListener('click', showAddProfile);
    grid.appendChild(add);
  }
}
function avatarUrl(avatar) {
  if (!avatar) return 'https://ui-avatars.com/api/?name=User&background=1a1a2e&color=e8c97e&size=96';
  if (avatar.startsWith('http')) return avatar;
  return `${IMG}w185${avatar}`;
}
function selectProfile(profile) {
  currentProfile = profile;
  const session  = load('mm_session', {});
  session.user   = currentUser;
  delete session.profile;
  store('mm_session', session);
  launchApp();
}
function goBackToProfiles() {
  stopAllMedia();
  currentProfile = null;
  showProfileScreen();
}
function updateHeaderProfile() {
  if (!currentProfile) return;
  const url = avatarUrl(currentProfile.avatar);
  document.getElementById('headerProfileImg').src = url;
  document.getElementById('headerProfileName').textContent = currentProfile.name;
  document.getElementById('mobileProfileImg').src = url;
  document.getElementById('mobileProfileName').textContent = currentProfile.name;
}

/* ══ MANAGE PROFILES ══ */
function showManageProfiles() {
  const list     = document.getElementById('manageProfilesList');
  const profiles = currentUser.profiles || [];
  list.innerHTML = '';
  profiles.forEach((p, i) => {
    const div = document.createElement('div');
    div.className = 'manage-profile-item';
    div.innerHTML = `<img src="${avatarUrl(p.avatar)}" alt="${p.name}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=1a1a2e&color=e8c97e&size=96'"><span class="mpname">${p.name}</span><button class="btn-edit-profile" onclick="editProfile(${i})">✏️ Modifier</button><button class="btn-delete-profile" onclick="deleteProfile(${i})">Supprimer</button>`;
    list.appendChild(div);
  });
  const addBtn = document.getElementById('addProfileBtn');
  if (addBtn) addBtn.style.display = profiles.length >= 5 ? 'none' : 'block';
  document.getElementById('manageProfilesOverlay').classList.add('open');
}
function closeManageProfiles() { document.getElementById('manageProfilesOverlay').classList.remove('open'); }
function deleteProfile(index) {
  const users    = load('mm_users', {});
  const profiles = currentUser.profiles || [];
  profiles.splice(index, 1);
  currentUser.profiles = profiles;
  users[currentUser.email] = currentUser;
  store('mm_users', users);
  store('mm_session', { user: currentUser });
  showManageProfiles();
  renderProfilePicker();
}

/* ══ EDIT PROFILE ══ */
function editProfile(index) {
  closeManageProfiles();
  editingProfileIndex = index;
  const profile = currentUser.profiles[index];
  document.getElementById('addProfileModalTitle').textContent = 'Modifier le profil';
  document.getElementById('addProfileSubmitBtn').textContent  = 'Enregistrer';
  document.getElementById('addProfileSubmitBtn').onclick = doSaveProfile;
  document.getElementById('newProfileName').value = profile.name;
  selectedAvatar = profile.avatar;
  document.getElementById('addProfileError').textContent = '';
  renderAvatarGrid();
  // Marquer l'avatar actuel
  setTimeout(() => {
    document.querySelectorAll('.avatar-option').forEach(opt => {
      opt.classList.toggle('selected', opt.dataset.path === profile.avatar);
    });
  }, 50);
  document.getElementById('addProfileOverlay').classList.add('open');
}
function doSaveProfile() {
  const name  = document.getElementById('newProfileName').value.trim();
  const errEl = document.getElementById('addProfileError');
  errEl.textContent = '';
  if (!name) { errEl.textContent = 'Donne un nom au profil.'; return; }
  if (!selectedAvatar) { errEl.textContent = 'Choisis un avatar.'; return; }
  const users = load('mm_users', {});
  currentUser.profiles[editingProfileIndex] = { name, avatar: selectedAvatar };
  users[currentUser.email] = currentUser;
  store('mm_users', users);
  store('mm_session', { user: currentUser });
  // Si c'est le profil courant, mettre à jour
  if (currentProfile && editingProfileIndex !== null) {
    const oldName = currentProfile.name;
    currentProfile = currentUser.profiles[editingProfileIndex];
    updateHeaderProfile();
  }
  closeAddProfile();
  renderProfilePicker();
  editingProfileIndex = null;
  showToast('✅ Profil mis à jour');
}

/* ══ ADD PROFILE ══ */
function showAddProfile() {
  closeManageProfiles();
  editingProfileIndex = null;
  document.getElementById('addProfileModalTitle').textContent = 'Nouveau profil';
  document.getElementById('addProfileSubmitBtn').textContent  = 'Créer le profil';
  document.getElementById('addProfileSubmitBtn').onclick = doAddProfile;
  selectedAvatar = null;
  document.getElementById('newProfileName').value = '';
  document.getElementById('addProfileError').textContent = '';
  renderAvatarGrid();
  document.getElementById('addProfileOverlay').classList.add('open');
}
function closeAddProfile() { document.getElementById('addProfileOverlay').classList.remove('open'); }
function renderAvatarGrid() {
  const grid = document.getElementById('avatarGrid');
  grid.innerHTML = '';
  AVATAR_IDS.forEach(av => {
    const div = document.createElement('div');
    div.className = 'avatar-option';
    div.dataset.path = av.path;
    div.innerHTML = `<img src="${IMG}w185${av.path}" alt="${av.name}" loading="lazy" onerror="this.style.display='none'">`;
    div.addEventListener('click', () => {
      document.querySelectorAll('.avatar-option').forEach(a => a.classList.remove('selected'));
      div.classList.add('selected');
      selectedAvatar = av.path;
    });
    grid.appendChild(div);
  });
}
function doAddProfile() {
  const name  = document.getElementById('newProfileName').value.trim();
  const errEl = document.getElementById('addProfileError');
  errEl.textContent = '';
  if (!name) { errEl.textContent = 'Donne un nom au profil.'; return; }
  if (!selectedAvatar) { errEl.textContent = 'Choisis un avatar.'; return; }
  const users    = load('mm_users', {});
  const profiles = currentUser.profiles || [];
  if (profiles.length >= 5) { errEl.textContent = '5 profils maximum.'; return; }
  profiles.push({ name, avatar: selectedAvatar });
  currentUser.profiles = profiles;
  users[currentUser.email] = currentUser;
  store('mm_users', users);
  store('mm_session', { user: currentUser });
  closeAddProfile();
  renderProfilePicker();
}

/* ══ MOBILE NAV ══ */
function toggleMobileNav() {
  const btn     = document.getElementById('hamburgerBtn');
  const drawer  = document.getElementById('mobileNavDrawer');
  const overlay = document.getElementById('mobileNavOverlay');
  btn.classList.toggle('open');
  drawer.classList.toggle('open');
  overlay.classList.toggle('open');
}
function closeMobileNav() {
  document.getElementById('hamburgerBtn').classList.remove('open');
  document.getElementById('mobileNavDrawer').classList.remove('open');
  document.getElementById('mobileNavOverlay').classList.remove('open');
}

/* ══ STOP MÉDIAS — ARRÊT COMPLET ══ */
function stopAllMedia() {
  stopVideo();
  stopAllIframes();
}
function stopVideo() {
  const vid = document.getElementById('mainVideo');
  if (!vid) return;
  vid.pause();
  vid.removeAttribute('src');
  try { vid.load(); } catch(e) {}
}
function stopAllIframes() {
  // Arrêt de toutes les iframes (bandes annonces) pour éviter la chauffe
  document.querySelectorAll('iframe').forEach(f => {
    f.src = 'about:blank';
    f.removeAttribute('src');
  });
}
function stopPageMedia() {
  // Arrête uniquement les iframes, pas le player
  document.querySelectorAll('iframe').forEach(f => {
    f.src = 'about:blank';
    f.removeAttribute('src');
  });
}

/* ══════════════════════════════════════
   FETCH TMDB
══════════════════════════════════════ */
async function fetchAllContent() {
  try {
    const filmResults = await Promise.all(
      CATALOGUE.map(item =>
        fetch(`${TMDB_BASE}/movie/${item.id}?api_key=${TMDB_KEY}&language=fr-FR`)
          .then(r => r.json())
          .then(data => ({ ...data, _type: item.type }))
          .catch(() => null)
      )
    );
    moviesData = {};
    filmResults.filter(Boolean).forEach(m => { if (m.id) moviesData[m.id] = m; });

    const serieResults = await Promise.all(
      SERIES_CATALOGUE.map(item =>
        fetch(`${TMDB_BASE}/tv/${item.id}?api_key=${TMDB_KEY}&language=fr-FR`)
          .then(r => r.json())
          .then(data => ({ ...data, _type: 'serie', _tmdbId: item.id }))
          .catch(() => null)
      )
    );
    seriesData = {};
    serieResults.filter(Boolean).forEach(s => { if (s.id) seriesData[s.id] = s; });

    const animeResults = await Promise.all(
      ANIME_CATALOGUE.map(item =>
        fetch(`${TMDB_BASE}/tv/${item.id}?api_key=${TMDB_KEY}&language=fr-FR`)
          .then(r => r.json())
          .then(data => ({ ...data, _type: 'anime', _tmdbId: item.id }))
          .catch(() => null)
      )
    );
    animesData = {};
    animeResults.filter(Boolean).forEach(a => { if (a.id) animesData[a.id] = a; });

    buildTop10();
    renderHome();
  } catch(e) { console.error('Fetch error', e); }
}

/* ══ TOP 10 ══ */
function getWeekKey() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return `${monday.getFullYear()}-${monday.getMonth()}-${monday.getDate()}`;
}
function buildTop10() {
  const weekKey    = getWeekKey();
  const allFilmIds = Object.values(moviesData).map(m => m.id);
  const stored     = load('mm_top10_films', null);
  if (stored && stored.weekKey === weekKey && stored.ids.length) {
    top10Week = stored.ids.filter(id => moviesData[id]).map(id => moviesData[id]);
  } else {
    const shuffled = shuffle([...allFilmIds]);
    top10Week = shuffled.slice(0, Math.min(10, shuffled.length)).map(id => moviesData[id]);
    store('mm_top10_films', { weekKey, ids: top10Week.map(m => m.id) });
  }
}
function buildTop10TV(type) {
  const weekKey   = getWeekKey();
  const dataStore = type === 'anime' ? animesData : seriesData;
  const allIds    = Object.values(dataStore).map(s => s.id);
  const storeKey  = `mm_top10_${type}`;
  const stored    = load(storeKey, null);
  let list;
  if (stored && stored.weekKey === weekKey && stored.ids.length) {
    list = stored.ids.filter(id => dataStore[id]).map(id => dataStore[id]);
  } else {
    const shuffled = shuffle([...allIds]);
    list = shuffled.slice(0, Math.min(10, shuffled.length)).map(id => dataStore[id]);
    store(storeKey, { weekKey, ids: list.map(s => s.id) });
  }
  return list;
}

/* ══ STATS — Vues simulées (stables par semaine) ══ */
function getViewsKey(id, type) { return `mm_views_${type}_${id}`; }
function getOrCreateViews(id, type) {
  const key = getViewsKey(id, type);
  const stored = load(key, null);
  if (stored) return stored;
  // Génère un nombre de vues stable basé sur l'id
  const base = ((parseInt(String(id).slice(-4), 10) || 1000) % 9000) + 1000;
  store(key, base);
  return base;
}
function incrementViews(id, type) {
  const key = getViewsKey(id, type);
  const current = load(key, getOrCreateViews(id, type));
  store(key, current + 1);
}

/* ══ RENDER HOME ══ */
function renderHome() {
  renderHero();
  renderResumeSection();
  renderTop10('top10Row', top10Week, 'film');
  renderCarousel('animCarousel', getByTypeUniq('animation'));
  renderCarousel('filmsCarousel', getByTypeUniq('film'));
  const top10Series = buildTop10TV('serie');
  renderTop10TV('top10SeriesRow', top10Series, 'serie');
  renderTVCarousel('seriesCarousel', Object.values(seriesData));
  const top10Anime = buildTop10TV('anime');
  renderTop10TV('top10AnimeRow', top10Anime, 'anime');
  renderTVCarousel('animeCarousel', Object.values(animesData));
}
function getByTypeUniq(type) {
  const seen = new Set();
  return Object.values(moviesData).filter(m => {
    if (m._type !== type) return false;
    if (seen.has(m.id)) return false;
    seen.add(m.id); return true;
  });
}

/* ══ RESUME ══ */
function getResumeKey()  { return `mm_resume_${currentUser?.email}_${currentProfile?.name}`; }
function getResumeList() { return load(getResumeKey(), []); }
function saveResume(entry) {
  let list = getResumeList();
  list = list.filter(e => e.id !== entry.id);
  list.unshift(entry);
  if (list.length > 20) list = list.slice(0, 20);
  store(getResumeKey(), list);
}
function removeFromResume(id) {
  let list = getResumeList().filter(e => e.id !== id);
  store(getResumeKey(), list);
  renderResumeSection();
}
function clearResumeHistory() {
  store(getResumeKey(), []);
  renderResumeSection();
  showToast('🗑 Historique effacé');
}
function renderResumeSection() {
  const list    = getResumeList();
  const section = document.getElementById('resumeSection');
  const track   = document.getElementById('resumeCarousel');
  if (!list.length) { section.classList.add('page-hidden'); return; }
  section.classList.remove('page-hidden');
  track.innerHTML = '';
  list.forEach(entry => {
    const pct  = entry.duration ? Math.round((entry.time / entry.duration) * 100) : 0;
    const card = document.createElement('div');
    card.className = 'resume-card';
    const thumbHtml = entry.backdrop
      ? `<img src="${IMG}w500${entry.backdrop}" alt="${entry.title}" loading="lazy">`
      : `<div style="width:100%;height:100%;background:var(--surface);display:flex;align-items:center;justify-content:center;color:var(--muted)">▶</div>`;
    const sub = (entry.type === 'serie' || entry.type === 'anime')
      ? `S${entry.season}E${entry.episode} · ${entry.epTitle || ''}`
      : `${fmt(entry.time)} / ${fmt(entry.duration)}`;
    card.innerHTML = `
      <div class="resume-thumb">
        ${thumbHtml}
        <div class="resume-progress-bar"><div class="resume-progress-fill" style="width:${pct}%"></div></div>
        <div class="resume-play-overlay"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
        <button class="resume-remove-btn" onclick="event.stopPropagation();removeFromResume('${entry.id}')" title="Retirer">✕</button>
      </div>
      <div class="resume-info"><h3>${entry.title}</h3><p>${sub}</p></div>`;
    card.addEventListener('click', () => {
      if (entry.type === 'serie') openTVPage(entry.tmdbId, 'serie', entry.season, entry.episode, true, entry.time);
      else if (entry.type === 'anime') openTVPage(entry.tmdbId, 'anime', entry.season, entry.episode, true, entry.time);
      else {
        currentMovieId = entry.id;
        playerMode = 'film';
        pendingResumeTime = entry.time;
        openSourceModal();
      }
    });
    track.appendChild(card);
  });
}

/* ══ HERO ══ */
function renderHero() {
  const allTV = [...Object.values(seriesData), ...Object.values(animesData)];
  const all = [
    ...Object.values(moviesData).filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i),
    ...allTV.map(s => ({ ...s, title: s.name || s.title, _type: s._type }))
  ];
  heroMovies = shuffle([...all]).slice(0, Math.min(5, all.length));
  heroIndex  = 0;
  const slides = document.getElementById('heroSlides');
  const dots   = document.getElementById('heroDots');
  slides.innerHTML = '';
  dots.innerHTML   = '';
  heroMovies.forEach((m, i) => {
    const bg    = m.backdrop_path ? `${IMG}w1280${m.backdrop_path}` : '';
    const slide = document.createElement('div');
    slide.className = 'hero-slide' + (i === 0 ? ' active' : '');
    if (bg) slide.style.backgroundImage = `url(${bg})`;
    slides.appendChild(slide);
    const dot = document.createElement('div');
    dot.className = 'hero-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => setHeroSlide(i));
    dots.appendChild(dot);
  });
  updateHeroContent();
  startHeroAuto();
}
function updateHeroContent() {
  if (!heroMovies.length) return;
  const m = heroMovies[heroIndex];
  document.getElementById('heroTitle').textContent   = m.title || m.name || '';
  document.getElementById('heroDesc').textContent    = (m.overview || '').slice(0, 160) + ((m.overview||'').length > 160 ? '…' : '');
  document.getElementById('heroEyebrow').textContent =
    m._type === 'animation' ? '✦ Animation' :
    m._type === 'serie'     ? '✦ Série' :
    m._type === 'anime'     ? '✦ Anime' : '✦ Film';
}
function setHeroSlide(index) {
  document.querySelectorAll('.hero-slide').forEach((s, i) => s.classList.toggle('active', i === index));
  document.querySelectorAll('.hero-dot').forEach((d, i) => d.classList.toggle('active', i === index));
  heroIndex = index;
  updateHeroContent();
}
function heroNext() { setHeroSlide((heroIndex + 1) % heroMovies.length); restartHeroAuto(); }
function heroPrev() { setHeroSlide((heroIndex - 1 + heroMovies.length) % heroMovies.length); restartHeroAuto(); }
function startHeroAuto()   { clearInterval(heroTimer); heroTimer = setInterval(() => setHeroSlide((heroIndex + 1) % heroMovies.length), 6000); }
function restartHeroAuto() { clearInterval(heroTimer); startHeroAuto(); }
function heroPlay() {
  if (!heroMovies[heroIndex]) return;
  const m = heroMovies[heroIndex];
  if (m._type === 'serie')  openTVPage(m.id, 'serie');
  else if (m._type === 'anime') openTVPage(m.id, 'anime');
  else { currentMovieId = m.id; playerMode = 'film'; openSourceModal(); }
}
function heroInfo() {
  if (!heroMovies[heroIndex]) return;
  const m = heroMovies[heroIndex];
  if (m._type === 'serie')  openTVPage(m.id, 'serie');
  else if (m._type === 'anime') openTVPage(m.id, 'anime');
  else openFilmPage(m.id);
}

/* ══ TOP 10 FILMS ══ */
function renderTop10(containerId, movies) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!movies || !movies.length) { el.innerHTML = `<p style="color:var(--muted);padding:20px;font-size:.85rem">Aucun contenu disponible.</p>`; return; }
  el.innerHTML = '';
  movies.slice(0, 10).forEach((m, i) => {
    if (!m) return;
    const card = document.createElement('div');
    card.className = 'top10-card';
    card.innerHTML = `
      <div class="top10-num">${i + 1}</div>
      ${m.poster_path ? `<img class="top10-poster" src="${IMG}w342${m.poster_path}" alt="${m.title||''}" loading="lazy">` : `<div class="top10-poster" style="background:var(--surface);display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:.7rem;padding:8px;text-align:center">${m.title||''}</div>`}
      <div class="top10-title">${m.title||m.name||''}</div>`;
    card.addEventListener('click', () => openFilmPage(m.id));
    el.appendChild(card);
  });
}
function renderTop10TV(containerId, list, type) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!list || !list.length) { el.innerHTML = `<p style="color:var(--muted);padding:20px;font-size:.85rem">Aucun contenu disponible.</p>`; return; }
  el.innerHTML = '';
  list.slice(0, 10).forEach((s, i) => {
    if (!s) return;
    const title = s.name || s.title || '';
    const card  = document.createElement('div');
    card.className = 'top10-card';
    card.innerHTML = `
      <div class="top10-num">${i + 1}</div>
      ${s.poster_path ? `<img class="top10-poster" src="${IMG}w342${s.poster_path}" alt="${title}" loading="lazy">` : `<div class="top10-poster" style="background:var(--surface);display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:.7rem;padding:8px;text-align:center">${title}</div>`}
      <div class="top10-title">${title}</div>`;
    card.addEventListener('click', () => openTVPage(s.id, type));
    el.appendChild(card);
  });
}

/* ══ CAROUSELS ══ */
function renderCarousel(trackId, movies) {
  const track = document.getElementById(trackId);
  if (!track) return;
  track.innerHTML = '';
  if (!movies.length) { track.innerHTML = `<p style="color:var(--muted);padding:20px;font-size:.85rem">Aucun contenu.</p>`; return; }
  movies.forEach(m => track.appendChild(makeMovieCard(m)));
}
function renderTVCarousel(trackId, tvList) {
  const track = document.getElementById(trackId);
  if (!track) return;
  track.innerHTML = '';
  if (!tvList.length) { track.innerHTML = `<p style="color:var(--muted);padding:20px;font-size:.85rem">Aucun contenu.</p>`; return; }
  tvList.forEach(s => track.appendChild(makeTVCard(s)));
}
function makeTVCard(s) {
  const title = s.name || s.title || '';
  const seasons = s.number_of_seasons ?? '—';
  const year    = (s.first_air_date || '').slice(0, 4);
  const label   = s._type === 'anime' ? 'Anime' : 'Série';
  const card    = document.createElement('div');
  card.className = 'movie-card';
  card.innerHTML = `
    <div class="card-poster">
      ${s.poster_path ? `<img src="${IMG}w342${s.poster_path}" alt="${title}" loading="lazy">` : `<div style="width:100%;aspect-ratio:2/3;background:var(--surface);display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:.75rem;padding:8px;text-align:center">${title}</div>`}
      <div class="card-overlay"><div class="card-score">📺 ${seasons} S.</div></div>
    </div>
    <div class="card-info"><h3 title="${title}">${title}</h3><div class="card-meta"><span>${year}</span><span>${label}</span></div></div>`;
  card.addEventListener('click', () => openTVPage(s.id, s._type));
  return card;
}
function carouselScroll(trackId, direction) {
  const track = document.getElementById(trackId);
  if (!track) return;
  track.scrollBy({ left: direction * 184 * 3, behavior: 'smooth' });
}

/* ══ MOVIE CARD ══ */
function makeMovieCard(m) {
  const year     = m.release_date?.slice(0, 4) ?? '';
  const rating   = m.vote_average?.toFixed(1) ?? 'N/A';
  const isInList = isInWishlist(m.id);
  const card     = document.createElement('div');
  card.className = 'movie-card';
  card.innerHTML = `
    <div class="card-poster">
      ${m.poster_path ? `<img src="${IMG}w342${m.poster_path}" alt="${m.title}" loading="lazy">` : `<div style="width:100%;aspect-ratio:2/3;background:var(--surface);display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:.75rem;padding:8px;text-align:center">${m.title}</div>`}
      <div class="card-overlay">
        <div class="card-score">⭐ ${rating}</div>
        <button class="card-wishlist-btn ${isInList ? 'in-list' : ''}" onclick="toggleWishlistCard(event,${m.id},this)">
          <svg viewBox="0 0 24 24" fill="${isInList ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>
    </div>
    <div class="card-info">
      <h3 title="${m.title}">${m.title}</h3>
      <div class="card-meta">${year ? `<span>${year}</span>` : ''}<span>${m._type === 'animation' ? 'Animation' : 'Film'}</span></div>
    </div>`;
  card.addEventListener('click', (e) => { if (e.target.closest('.card-wishlist-btn')) return; openFilmPage(m.id); });
  return card;
}

/* ══ WISHLIST ══ */
function getWishlistKey()       { return `mm_wishlist_${currentUser?.email}_${currentProfile?.name}`; }
function getWishlist()          { return load(getWishlistKey(), []); }
function isInWishlist(id)       { return getWishlist().some(x => x == id); }
function addToWishlist(id)      { const l = getWishlist(); if (!l.some(x => x == id)) { l.push(id); store(getWishlistKey(), l); } }
function removeFromWishlist(id) { store(getWishlistKey(), getWishlist().filter(x => x != id)); }
function toggleWishlistCard(e, id, btn) {
  e.stopPropagation();
  if (isInWishlist(id)) { removeFromWishlist(id); btn.classList.remove('in-list'); btn.querySelector('svg').setAttribute('fill','none'); showToast('Retiré de ta liste'); }
  else { addToWishlist(id); btn.classList.add('in-list'); btn.querySelector('svg').setAttribute('fill','currentColor'); showToast('Ajouté à ta liste ❤️'); }
}
function toggleWishlist() {
  if (!currentMovieId) return;
  if (isInWishlist(currentMovieId)) { removeFromWishlist(currentMovieId); updateWishlistBtn(false); showToast('Retiré de ta liste'); }
  else { addToWishlist(currentMovieId); updateWishlistBtn(true); showToast('Ajouté à ta liste ❤️'); }
}
function toggleWishlistSerie() {
  const key = `${playerMode || 'serie'}_${currentSerieId || currentAnimeId}`;
  if (isInWishlist(key)) { removeFromWishlist(key); updateWishlistBtnTV(false); showToast('Retiré de ta liste'); }
  else { addToWishlist(key); updateWishlistBtnTV(true); showToast('Ajouté à ta liste ❤️'); }
}
function updateWishlistBtn(inList) {
  const btn = document.getElementById('wishlistBtn');
  const txt = document.getElementById('wishlistBtnText');
  if (!btn) return;
  const svg = btn.querySelector('svg');
  if (inList) { btn.classList.add('in-list'); txt.textContent = 'Dans ma liste'; svg.setAttribute('fill','currentColor'); svg.setAttribute('stroke','none'); }
  else        { btn.classList.remove('in-list'); txt.textContent = 'Ma Liste'; svg.setAttribute('fill','none'); svg.setAttribute('stroke','currentColor'); }
}
function updateWishlistBtnTV(inList) {
  const btn = document.getElementById('wishlistBtnSerie');
  if (!btn) return;
  const txt = document.getElementById('wishlistBtnTextSerie');
  const svg = btn.querySelector('svg');
  if (inList) { btn.classList.add('in-list'); txt.textContent = 'Dans ma liste'; svg.setAttribute('fill','currentColor'); svg.setAttribute('stroke','none'); }
  else        { btn.classList.remove('in-list'); txt.textContent = 'Ma Liste'; svg.setAttribute('fill','none'); svg.setAttribute('stroke','currentColor'); }
}

/* ══ NOTES ══ */
function getRatingKey(id)       { return `mm_rating_${currentUser?.email}_${currentProfile?.name}_${id}`; }
function getGlobalRatingKey(id) { return `mm_globalrating_${currentUser?.email}_${id}`; }
function getMyRating(id)        { return load(getRatingKey(id), 0); }
function setMyRating(id, note)  { store(getRatingKey(id), note); updateGlobalRating(id); }
function updateGlobalRating(id) {
  const profiles = currentUser?.profiles || [];
  if (!profiles.length) return;
  const ratings = profiles.map(p => load(`mm_rating_${currentUser.email}_${p.name}_${id}`, 0)).filter(r => r > 0);
  if (!ratings.length) store(getGlobalRatingKey(id), null);
  else store(getGlobalRatingKey(id), Math.round((ratings.reduce((a,b)=>a+b,0) / ratings.length)*10)/10);
}
function getGlobalRating(id) { return load(getGlobalRatingKey(id), null); }
function renderStars(containerId, valId, avgId, _unused, type) {
  const container = document.getElementById(containerId);
  const valEl     = document.getElementById(valId);
  const avgEl     = document.getElementById(avgId);
  if (!container || !valEl) return;
  const id      = type === 'film' ? currentMovieId : (`${type}_${currentSerieId || currentAnimeId}`);
  const current = getMyRating(id);
  const global  = getGlobalRating(id);
  container.innerHTML = '';
  for (let i = 1; i <= 10; i++) {
    const star = document.createElement('span');
    star.className   = 'mm-star' + (i <= current ? ' active' : '');
    star.textContent = '★';
    star.title = `${i}/10`;
    star.addEventListener('mouseenter', () => container.querySelectorAll('.mm-star').forEach((s,idx) => s.classList.toggle('active', idx < i)));
    star.addEventListener('mouseleave', () => { const c = getMyRating(id); container.querySelectorAll('.mm-star').forEach((s,idx) => s.classList.toggle('active', idx < c)); });
    star.addEventListener('click', () => {
      setMyRating(id, i);
      container.querySelectorAll('.mm-star').forEach((s,idx) => s.classList.toggle('active', idx < i));
      valEl.textContent = `${i}/10 — Ta note`;
      const ng = getGlobalRating(id);
      if (avgEl) avgEl.textContent = ng !== null ? `Moyenne : ${ng}/10` : '';
      showToast(`⭐ Note enregistrée : ${i}/10`);
    });
    container.appendChild(star);
  }
  valEl.textContent = current ? `${current}/10 — Ta note` : 'Non noté';
  if (avgEl) avgEl.textContent = global !== null ? `Moyenne : ${global}/10` : '';
}

/* ══ NAVIGATION ══ */
function setActivePage(page) {
  currentPage = page;
  document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
  const map = { home:'navAccueil', films:'navFilms', series:'navSeries', animes:'navAnimes', maliste:'navMaListe', stats:'navStats' };
  if (map[page]) document.getElementById(map[page])?.classList.add('active');
  ['homePage','filmPage','seriePage','filmsPage','seriesPage','animesPage','maListePage','statsPage'].forEach(id => document.getElementById(id)?.classList.add('page-hidden'));
  stopPageMedia();
}
function showHome() {
  setActivePage('home');
  document.getElementById('homePage').classList.remove('page-hidden');
  renderResumeSection();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function showFilmsPage() {
  setActivePage('films');
  document.getElementById('filmsPage').classList.remove('page-hidden');
  window.scrollTo({ top: 0 });
  renderCatalogGrid('filmsCatalogGrid', ['film','animation'], '');
}
function showSeriesPage() {
  setActivePage('series');
  document.getElementById('seriesPage').classList.remove('page-hidden');
  window.scrollTo({ top: 0 });
  renderCatalogGridTV('seriesCatalogGrid', 'serie', '');
}
function showAnimesPage() {
  setActivePage('animes');
  document.getElementById('animesPage').classList.remove('page-hidden');
  window.scrollTo({ top: 0 });
  renderCatalogGridTV('animesCatalogGrid', 'anime', '');
}
function showMaListePage() {
  setActivePage('maliste');
  document.getElementById('maListePage').classList.remove('page-hidden');
  window.scrollTo({ top: 0 });
  renderMaListeGrid();
}
function showStatsPage() {
  setActivePage('stats');
  document.getElementById('statsPage').classList.remove('page-hidden');
  window.scrollTo({ top: 0 });
  currentStatsType = 'films';
  renderStats('films');
  // Activer le premier onglet
  document.querySelectorAll('.stats-tab').forEach((t,i) => t.classList.toggle('active', i === 0));
}
function goBack() { showHome(); }

/* ══ STATS ══ */
function showStatsTab(type, btn) {
  currentStatsType = type;
  document.querySelectorAll('.stats-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderStats(type);
}

function getStatsData(type) {
  let items = [];
  if (type === 'films') {
    const seen = new Set();
    items = Object.values(moviesData).filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; });
    items = items.map(m => ({
      id: m.id, title: m.title || '', poster: m.poster_path, year: m.release_date?.slice(0,4)||'', type:'film',
      tmdbType: m._type, views: getOrCreateViews(m.id, 'film')
    }));
  } else if (type === 'series') {
    items = Object.values(seriesData).map(s => ({
      id: s.id, title: s.name||s.title||'', poster: s.poster_path, year: (s.first_air_date||'').slice(0,4), type:'serie',
      views: getOrCreateViews(s.id, 'serie')
    }));
  } else {
    items = Object.values(animesData).map(a => ({
      id: a.id, title: a.name||a.title||'', poster: a.poster_path, year: (a.first_air_date||'').slice(0,4), type:'anime',
      views: getOrCreateViews(a.id, 'anime')
    }));
  }
  return items.sort((a,b) => b.views - a.views);
}

function renderStats(type) {
  const data = getStatsData(type);
  renderPodium(data.slice(0,3), type);
  renderStatsTop10(data.slice(0,10), type);
  renderStatsTable(data, type);
}

function renderPodium(top3, type) {
  const el = document.getElementById('statsPodium');
  if (!el) return;
  if (!top3.length) { el.innerHTML = `<p style="color:var(--muted)">Aucun contenu disponible.</p>`; return; }
  // Ordre visuel : 2e - 1er - 3e
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);
  const ranks  = top3[1] ? [2,1,3] : [1];
  el.innerHTML = '';
  order.forEach((item, vi) => {
    const rank   = ranks[vi];
    const crown  = rank === 1 ? '<div class="podium-crown">👑</div>' : '';
    const heights= { 1:90, 2:64, 3:50 };
    const div    = document.createElement('div');
    div.className = `podium-item rank-${rank}`;
    div.innerHTML = `
      <div class="podium-poster-wrap">
        ${crown}
        <div class="podium-ring">
          ${item.poster ? `<img class="podium-poster" src="${IMG}w342${item.poster}" alt="${item.title}" loading="lazy">` : `<div class="podium-poster" style="background:var(--surface);display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:.75rem;padding:8px;text-align:center">${item.title}</div>`}
        </div>
        <div class="podium-rank-badge">${rank}</div>
      </div>
      <div class="podium-base" style="height:${heights[rank]}px">
        <div>
          <div class="podium-title">${item.title}</div>
          <div class="podium-views">${fmtViews(item.views)} vues</div>
          <div class="podium-year">${item.year}</div>
        </div>
      </div>`;
    div.addEventListener('click', () => {
      if (item.type === 'film') openFilmPage(item.id);
      else openTVPage(item.id, item.type);
    });
    el.appendChild(div);
  });
}

function renderStatsTop10(items, type) {
  const el = document.getElementById('statsTop10Scroll');
  if (!el) return;
  el.innerHTML = '';
  items.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'stats-h-card';
    card.innerHTML = `
      <div class="stats-h-card-img">
        ${item.poster ? `<img src="${IMG}w342${item.poster}" alt="${item.title}" loading="lazy">` : `<div style="width:100%;height:100%;background:var(--surface)"></div>`}
        <div class="stats-h-rank">${i+1}</div>
        <div class="stats-h-views">${fmtViews(item.views)} vues</div>
      </div>
      <div class="stats-h-info">
        <div class="stats-h-title">${item.title}</div>
        <div class="stats-h-meta">${item.year}</div>
      </div>`;
    card.addEventListener('click', () => {
      if (item.type === 'film') openFilmPage(item.id);
      else openTVPage(item.id, item.type);
    });
    el.appendChild(card);
  });
}

function renderStatsTable(items, type) {
  const el = document.getElementById('statsTable');
  if (!el) return;
  const maxViews = items[0]?.views || 1;
  el.innerHTML = '';
  items.forEach((item, i) => {
    const pct  = Math.round((item.views / maxViews) * 100);
    const row  = document.createElement('div');
    row.className = 'stats-row';
    row.innerHTML = `
      <div class="stats-row-rank">${i+1}</div>
      ${item.poster ? `<img class="stats-row-img" src="${IMG}w92${item.poster}" alt="${item.title}" loading="lazy">` : `<div class="stats-row-img" style="background:var(--surface);border-radius:8px"></div>`}
      <div class="stats-row-info">
        <div class="stats-row-title">${item.title}</div>
        <div class="stats-row-meta">${item.year}${item.tmdbType ? ' · ' + item.tmdbType : ''}</div>
      </div>
      <div class="stats-row-bar-wrap">
        <div class="stats-row-bar"><div class="stats-row-bar-fill" style="width:${pct}%"></div></div>
      </div>
      <div class="stats-row-views">${fmtViews(item.views)}</div>`;
    row.addEventListener('click', () => {
      if (item.type === 'film') openFilmPage(item.id);
      else openTVPage(item.id, item.type);
    });
    el.appendChild(row);
    // Animation de la barre
    requestAnimationFrame(() => {
      const fill = row.querySelector('.stats-row-bar-fill');
      if (fill) { fill.style.width = '0%'; requestAnimationFrame(() => { fill.style.width = pct + '%'; }); }
    });
  });
}

function fmtViews(n) {
  if (n >= 1000) return (n/1000).toFixed(1) + 'K';
  return String(n);
}

/* ══ CATALOG ══ */
function renderCatalogGrid(gridId, types, query) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  const seen = new Set();
  let movies = Object.values(moviesData).filter(m => {
    if (!types.includes(m._type)) return false;
    if (seen.has(m.id)) return false;
    seen.add(m.id); return true;
  });
  if (query) { const q = query.toLowerCase(); movies = movies.filter(m => m.title?.toLowerCase().includes(q) || m.original_title?.toLowerCase().includes(q)); }
  grid.innerHTML = '';
  if (!movies.length) { grid.innerHTML = `<p style="color:var(--muted);padding:40px 0;font-size:.9rem;text-align:center;grid-column:1/-1">Aucun résultat.</p>`; return; }
  movies.forEach(m => { const c = makeMovieCard(m); c.style.width = 'auto'; grid.appendChild(c); });
}
function renderCatalogGridTV(gridId, type, query) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  let list = type === 'serie' ? Object.values(seriesData) : Object.values(animesData);
  if (query) { const q = query.toLowerCase(); list = list.filter(s => (s.name||s.title||'').toLowerCase().includes(q)); }
  grid.innerHTML = '';
  if (!list.length) { grid.innerHTML = `<p style="color:var(--muted);padding:40px 0;font-size:.9rem;text-align:center;grid-column:1/-1">Aucun résultat.</p>`; return; }
  list.forEach(s => { const c = makeTVCard(s); c.style.width = 'auto'; grid.appendChild(c); });
}
function renderMaListeGrid() {
  const grid = document.getElementById('maListeGrid');
  if (!grid) return;
  const wl = getWishlist();
  grid.innerHTML = '';
  let count = 0;
  const seen = new Set();
  Object.values(moviesData).forEach(m => {
    if (seen.has(m.id)) return;
    if (wl.some(x => x == m.id)) { seen.add(m.id); const c = makeMovieCard(m); c.style.width = 'auto'; grid.appendChild(c); count++; }
  });
  [...Object.values(seriesData), ...Object.values(animesData)].forEach(s => {
    if (wl.some(x => x === `${s._type}_${s.id}`)) { const c = makeTVCard(s); c.style.width = 'auto'; grid.appendChild(c); count++; }
  });
  if (!count) grid.innerHTML = `<p style="color:var(--muted);padding:40px 0;font-size:.9rem;text-align:center;grid-column:1/-1">Ta liste est vide.</p>`;
}
function filterCatalog(query, section) {
  if (section === 'films') renderCatalogGrid('filmsCatalogGrid', ['film','animation'], query);
  else if (section === 'series') renderCatalogGridTV('seriesCatalogGrid', 'serie', query);
  else if (section === 'animes') renderCatalogGridTV('animesCatalogGrid', 'anime', query);
}
function filterMaListe(query) {
  // Simple filter on existing items (re-render with query)
  renderMaListeGrid(); // Pour l'instant, pas de filtre inline (Ma Liste est courte)
}

/* ══ GLOBAL SEARCH ══ */
function toggleSearchBar() {
  const bar = document.getElementById('searchBarContainer');
  bar.classList.toggle('open');
  if (bar.classList.contains('open')) document.getElementById('globalSearchInput').focus();
}
function closeSearchBar() {
  document.getElementById('searchBarContainer').classList.remove('open');
  document.getElementById('globalSearchResults').innerHTML = '';
  document.getElementById('globalSearchInput').value = '';
}
function doGlobalSearch(query) {
  const results = document.getElementById('globalSearchResults');
  if (!query.trim()) { results.innerHTML = ''; return; }
  const q = query.toLowerCase();
  const seen = new Set();
  const matchFilms = Object.values(moviesData).filter(m => {
    if (seen.has(m.id)) return false;
    if (!(m.title?.toLowerCase().includes(q) || m.original_title?.toLowerCase().includes(q))) return false;
    seen.add(m.id); return true;
  });
  const matchTV = [...Object.values(seriesData), ...Object.values(animesData)].filter(s => (s.name||s.title||'').toLowerCase().includes(q));
  results.innerHTML = '';
  matchTV.slice(0,3).forEach(s => {
    const title = s.name||s.title||'';
    const div   = document.createElement('div');
    div.className = 'search-result-item';
    div.innerHTML = `${s.poster_path ? `<img src="${IMG}w92${s.poster_path}" alt="${title}">` : '<div style="width:36px;height:54px;background:var(--surface);border-radius:6px;flex-shrink:0"></div>'}<div class="search-result-info"><div class="sr-title">${title}</div><div class="sr-year">${(s.first_air_date||'').slice(0,4)} · ${s._type === 'anime' ? 'Anime' : 'Série'}</div></div>`;
    div.addEventListener('click', () => { closeSearchBar(); openTVPage(s.id, s._type); });
    results.appendChild(div);
  });
  matchFilms.slice(0,5).forEach(m => {
    const div = document.createElement('div');
    div.className = 'search-result-item';
    div.innerHTML = `${m.poster_path ? `<img src="${IMG}w92${m.poster_path}" alt="${m.title}">` : '<div style="width:36px;height:54px;background:var(--surface);border-radius:6px;flex-shrink:0"></div>'}<div class="search-result-info"><div class="sr-title">${m.title}</div><div class="sr-year">${m.release_date?.slice(0,4)??''} · ${m._type}</div></div>`;
    div.addEventListener('click', () => { closeSearchBar(); openFilmPage(m.id); });
    results.appendChild(div);
  });
}

/* ══ PAGE FILM ══ */
async function openFilmPage(id) {
  const movie = moviesData[id];
  if (!movie) return;
  currentMovieId = id;
  playerMode     = 'film';
  // IMPORTANT : Ne pas démarrer le film depuis reprendre le visionnage si on arrive de la page catalogue
  // On reset pendingResumeTime seulement si l'entrée vient d'un clic catalogue (pas resume)
  stopPageMedia();
  setActivePage('film');
  document.getElementById('filmPage').classList.remove('page-hidden');
  window.scrollTo({ top: 0 });
  populateFilmPage(movie);
  renderStars('mmStars', 'mmRatingVal', 'mmAvgVal', null, 'film');
  fetchExtraData(id);
}

/* ═══ POINT CLÉ : Quand on vient du catalogue (pas du resume), on reset le timestamp ═══ */
function openFilmPageFresh(id) {
  pendingResumeTime = null; // Pas de reprise → démarre à 0
  openFilmPage(id);
}

function populateFilmPage(movie) {
  const bg = movie.backdrop_path ? `${IMG}w1280${movie.backdrop_path}` : '';
  document.getElementById('filmBackdropImg').style.backgroundImage = bg ? `url(${bg})` : 'none';
  document.getElementById('filmPoster').src = movie.poster_path ? `${IMG}w500${movie.poster_path}` : '';
  document.getElementById('filmPoster').alt = movie.title;
  const rating  = movie.vote_average?.toFixed(1) ?? 'N/A';
  const year    = movie.release_date?.slice(0, 4) ?? '—';
  const runtime = movie.runtime ? `${movie.runtime} min` : '—';
  document.getElementById('filmInfoCol').innerHTML = `
    <div class="fic-row"><span class="fic-label">Note</span><span class="fic-value fic-stars">⭐ ${rating} / 10</span></div>
    <div class="fic-divider"></div>
    <div class="fic-row"><span class="fic-label">Année</span><span class="fic-value">${year}</span></div>
    <div class="fic-divider"></div>
    <div class="fic-row"><span class="fic-label">Durée</span><span class="fic-value">${runtime}</span></div>
    <div class="fic-divider"></div>
    <div class="fic-row"><span class="fic-label">Type</span><span class="fic-value">${movie._type === 'animation' ? 'Animation' : 'Film'}</span></div>
    <div class="fic-divider"></div>
    <div class="fic-row"><span class="fic-label">TMDB</span><span class="fic-value" style="color:var(--muted);font-size:.75rem">${movie.id}</span></div>`;
  document.getElementById('filmTitle').textContent    = movie.title || '';
  document.getElementById('filmTagline').textContent  = movie.tagline || '';
  document.getElementById('filmGenres').innerHTML     = (movie.genres ?? []).map(g => `<span class="genre-tag">${g.name}</span>`).join('');
  document.getElementById('filmSynopsis').textContent = movie.overview || 'Aucune description disponible.';
  updateWishlistBtn(isInWishlist(movie.id));
  document.getElementById('castGrid').innerHTML = '<div style="color:var(--muted);font-size:.82rem">Chargement...</div>';
  document.getElementById('trailerContainer').innerHTML = `<div class="trailer-loader"><div class="spin-ring"></div><span>Chargement...</span></div>`;
}
async function fetchExtraData(id) {
  try {
    const [credits, videos] = await Promise.all([
      fetch(`${TMDB_BASE}/movie/${id}/credits?api_key=${TMDB_KEY}&language=fr-FR`).then(r => r.json()),
      fetch(`${TMDB_BASE}/movie/${id}/videos?api_key=${TMDB_KEY}&language=fr-FR`).then(r => r.json())
    ]);
    renderCast(credits.cast?.slice(0, 10) ?? []);
    renderTrailerMovie(videos.results ?? [], id);
  } catch(e) {
    document.getElementById('castGrid').innerHTML = '<span style="color:var(--muted)">Casting indisponible</span>';
  }
}
function renderCast(cast) {
  const el = document.getElementById('castGrid');
  if (!cast.length) { el.innerHTML = '<span style="color:var(--muted)">Casting indisponible</span>'; return; }
  el.innerHTML = cast.map(p => `
    <div class="cast-card">
      ${p.profile_path ? `<img class="cast-photo" src="${IMG}w185${p.profile_path}" alt="${p.name}" loading="lazy">` : `<div class="cast-photo-placeholder">👤</div>`}
      <div class="cast-info"><div class="cast-name">${p.name}</div><div class="cast-char">${p.character||''}</div></div>
    </div>`).join('');
}
async function renderTrailerMovie(videos, id) {
  const el = document.getElementById('trailerContainer');
  if (!el) return;
  let trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') || videos.find(v => v.site === 'YouTube');
  if (!trailer) {
    try { const en = await fetch(`${TMDB_BASE}/movie/${id}/videos?api_key=${TMDB_KEY}&language=en-US`).then(r => r.json()); trailer = en.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube'); } catch(e) {}
  }
  el.innerHTML = trailer
    ? `<iframe src="https://www.youtube-nocookie.com/embed/${trailer.key}?rel=0&modestbranding=1" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen loading="lazy"></iframe>`
    : `<div class="trailer-loader"><span style="color:var(--muted)">Bande annonce non disponible</span></div>`;
}

/* ══ PAGE SÉRIE / ANIME ══ */
async function openTVPage(tmdbId, type = 'serie', season = 1, episode = null, autoPlay = false, resumeTime = null) {
  const dataStore = type === 'anime' ? animesData : seriesData;
  let tv = dataStore[tmdbId];
  if (!tv) {
    try {
      const data = await fetch(`${TMDB_BASE}/tv/${tmdbId}?api_key=${TMDB_KEY}&language=fr-FR`).then(r => r.json());
      tv = { ...data, _type: type, _tmdbId: tmdbId };
      dataStore[tmdbId] = tv;
    } catch(e) { showToast('❌ Impossible de charger les données'); return; }
  }
  if (type === 'anime') currentAnimeId = tmdbId;
  else currentSerieId = tmdbId;
  currentSeason = season;
  playerMode    = type;
  playerTmdbId  = tmdbId;
  stopPageMedia();
  setActivePage('serie');
  document.getElementById('seriePage').classList.remove('page-hidden');
  window.scrollTo({ top: 0 });
  populateTVPage(tv, type);
  renderStars('mmStarsSerie', 'mmRatingValSerie', 'mmAvgValSerie', null, type);
  await renderTVSeasonTabs(tv, type, season);
  fetchTVTrailer(tmdbId, type);
  if (autoPlay && episode !== null) {
    pendingResumeTime = resumeTime;
    setTimeout(() => playTVEpisode(tmdbId, type, season, episode), 400);
  }
}
function populateTVPage(tv, type) {
  const title = tv.name || tv.title || '';
  const bg    = tv.backdrop_path ? `${IMG}w1280${tv.backdrop_path}` : '';
  document.getElementById('serieBackdropImg').style.backgroundImage = bg ? `url(${bg})` : 'none';
  document.getElementById('seriePoster').src = tv.poster_path ? `${IMG}w500${tv.poster_path}` : '';
  document.getElementById('seriePoster').alt = title;
  const rating  = tv.vote_average?.toFixed(1) ?? 'N/A';
  const seasons = tv.number_of_seasons ?? '—';
  const episodes= tv.number_of_episodes ?? '—';
  const year    = (tv.first_air_date||'').slice(0,4);
  const label   = type === 'anime' ? 'Anime' : 'Série';
  document.getElementById('serieInfoCol').innerHTML = `
    <div class="fic-row"><span class="fic-label">Note</span><span class="fic-value fic-stars">⭐ ${rating} / 10</span></div>
    <div class="fic-divider"></div>
    <div class="fic-row"><span class="fic-label">Saisons</span><span class="fic-value">${seasons}</span></div>
    <div class="fic-divider"></div>
    <div class="fic-row"><span class="fic-label">Épisodes</span><span class="fic-value">${episodes}</span></div>
    <div class="fic-divider"></div>
    <div class="fic-row"><span class="fic-label">Année</span><span class="fic-value">${year}</span></div>
    <div class="fic-divider"></div>
    <div class="fic-row"><span class="fic-label">Type</span><span class="fic-value">${label}</span></div>`;
  document.getElementById('serieTitle').textContent    = title;
  document.getElementById('serieTagline').textContent  = tv.tagline || '';
  document.getElementById('serieGenres').innerHTML     = (tv.genres||[]).map(g => `<span class="genre-tag">${g.name}</span>`).join('');
  document.getElementById('serieSynopsis').textContent = tv.overview || 'Aucune description disponible.';
  updateWishlistBtnTV(isInWishlist(`${type}_${tv.id}`));
}
async function renderTVSeasonTabs(tv, type, activeSeason) {
  const tabs = document.getElementById('seasonsTabs');
  tabs.innerHTML = '';
  const seasons = (tv.seasons||[]).filter(s => s.season_number > 0);
  for (const s of seasons) {
    const btn = document.createElement('button');
    btn.className   = 'season-tab' + (s.season_number === activeSeason ? ' active' : '');
    btn.textContent = s.name || `Saison ${s.season_number}`;
    btn.addEventListener('click', async () => {
      currentSeason = s.season_number;
      document.querySelectorAll('.season-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      await renderTVEpisodes(tv.id, type, s.season_number);
    });
    tabs.appendChild(btn);
  }
  await renderTVEpisodes(tv.id, type, activeSeason);
}
async function renderTVEpisodes(tmdbId, type, seasonNum) {
  const list = document.getElementById('episodesList');
  list.innerHTML = `<div style="color:var(--muted);padding:20px;font-size:.85rem">Chargement des épisodes...</div>`;
  let episodes = [];
  try {
    const data = await fetch(`${TMDB_BASE}/tv/${tmdbId}/season/${seasonNum}?api_key=${TMDB_KEY}&language=fr-FR`).then(r => r.json());
    episodes = data.episodes || [];
  } catch(e) { list.innerHTML = `<div style="color:var(--muted);padding:20px">Épisodes indisponibles.</div>`; return; }
  list.innerHTML = '';
  episodes.forEach(ep => {
    const progressKey = `mm_progress_${currentUser?.email}_${currentProfile?.name}_${type}_${tmdbId}_S${seasonNum}E${ep.episode_number}`;
    const saved = load(progressKey, null);
    const pct   = saved ? Math.round((saved.time / saved.duration) * 100) : 0;
    const thumb = ep.still_path ? `${IMG}w300${ep.still_path}` : null;
    const runtime = ep.runtime ? `${ep.runtime} min` : '~';
    const airDate = ep.air_date ? new Date(ep.air_date).toLocaleDateString('fr-FR') : '';
    const card = document.createElement('div');
    card.className = 'episode-card';
    card.innerHTML = `
      <div class="episode-thumb">
        ${thumb ? `<img src="${thumb}" alt="E${ep.episode_number}" loading="lazy">` : `<div class="episode-thumb-placeholder">▶</div>`}
        <div class="episode-num-badge">E${ep.episode_number}</div>
      </div>
      <div class="episode-info">
        <div class="episode-title">${ep.name||`Épisode ${ep.episode_number}`}</div>
        <div class="episode-meta">Épisode ${ep.episode_number} · ${runtime}${airDate ? ' · '+airDate : ''}</div>
        <div class="episode-desc">${ep.overview||''}</div>
        ${pct > 0 ? `<div class="ep-progress-bar"><div class="ep-progress-fill" style="width:${pct}%"></div></div>` : ''}
      </div>
      <button class="ep-play-btn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>`;
    card.addEventListener('click', () => {
      // Vient des épisodes → pas de reprise auto, on part de 0 sauf si progress sauvé
      pendingResumeTime = null;
      playTVEpisode(tmdbId, type, seasonNum, ep.episode_number);
    });
    list.appendChild(card);
  });
}
async function fetchTVTrailer(tmdbId, type) {
  const el = document.getElementById('serieTrailerContainer');
  if (!el) return;
  el.innerHTML = `<div class="trailer-loader"><div class="spin-ring"></div><span>Chargement...</span></div>`;
  try {
    let videos  = await fetch(`${TMDB_BASE}/tv/${tmdbId}/videos?api_key=${TMDB_KEY}&language=fr-FR`).then(r => r.json());
    let trailer = videos.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    if (!trailer) { videos = await fetch(`${TMDB_BASE}/tv/${tmdbId}/videos?api_key=${TMDB_KEY}&language=en-US`).then(r => r.json()); trailer = videos.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube'); }
    el.innerHTML = trailer
      ? `<iframe src="https://www.youtube-nocookie.com/embed/${trailer.key}?rel=0&modestbranding=1" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen loading="lazy"></iframe>`
      : `<div class="trailer-loader"><span style="color:var(--muted)">Bande annonce non disponible</span></div>`;
  } catch(e) { el.innerHTML = `<div class="trailer-loader"><span style="color:var(--muted)">Bande annonce non disponible</span></div>`; }
}

/* ══ LECTURE SÉRIE / ANIME ══ */
function playTVEpisode(tmdbId, type, season, episodeNum) {
  playerMode    = type;
  playerTmdbId  = tmdbId;
  playerSeason  = season;
  playerEpisode = episodeNum;
  currentMovieId = `${type}_${tmdbId}_S${season}E${episodeNum}`;
  const sources  = VIDEO_SOURCES[currentMovieId] ?? [];
  const tv = (type === 'anime' ? animesData : seriesData)[tmdbId];
  document.getElementById('sourceModalSub').textContent = tv ? `${tv.name||tv.title} — S${season}E${episodeNum}` : `S${season}E${episodeNum}`;
  buildSourceList(sources);
  document.getElementById('sourceOverlay').classList.add('open');
}

/* ══ ÉPISODE SUIVANT ══ */
async function computeNextEpisode() {
  if (playerMode !== 'serie' && playerMode !== 'anime') return null;
  const dataStore = playerMode === 'anime' ? animesData : seriesData;
  const tv = dataStore[playerTmdbId];
  if (!tv) return null;
  try {
    const data = await fetch(`${TMDB_BASE}/tv/${playerTmdbId}/season/${playerSeason}?api_key=${TMDB_KEY}&language=fr-FR`).then(r => r.json());
    const eps  = data.episodes || [];
    const idx  = eps.findIndex(e => e.episode_number === playerEpisode);
    if (idx >= 0 && idx < eps.length - 1) return { season: playerSeason, episode: eps[idx+1].episode_number, label: `E${eps[idx+1].episode_number}` };
    const seasons = (tv.seasons||[]).filter(s => s.season_number > 0);
    const sIdx    = seasons.findIndex(s => s.season_number === playerSeason);
    if (sIdx >= 0 && sIdx < seasons.length - 1) { const next = seasons[sIdx+1]; return { season: next.season_number, episode: 1, label: `S${next.season_number}E1`, isSeason: true }; }
  } catch(e) {}
  return null;
}
async function updateNextEpButton() {
  const btn   = document.getElementById('nextEpBtn');
  const label = document.getElementById('nextEpBtnLabel');
  if (!btn) return;
  if (playerMode !== 'serie' && playerMode !== 'anime') { btn.style.display = 'none'; return; }
  const next = await computeNextEpisode();
  if (next) { btn.style.display = 'flex'; label.textContent = next.isSeason ? `Saison ${next.season}` : next.label; }
  else btn.style.display = 'none';
}
async function playNextEpisode() {
  const next = await computeNextEpisode();
  if (!next) return;
  closePlayer();
  setTimeout(() => playTVEpisode(playerTmdbId, playerMode, next.season, next.episode), 300);
}

/* ══ MODAL SOURCES ══ */
function openSourceModal() {
  const id      = currentMovieId?.toString();
  const sources = VIDEO_SOURCES[id] ?? [];
  const movie   = moviesData[currentMovieId] || null;
  if (movie) document.getElementById('sourceModalSub').textContent = movie.title || '';
  buildSourceList(sources);
  document.getElementById('sourceOverlay').classList.add('open');
}
function buildSourceList(sources) {
  const list = document.getElementById('sourceList');
  if (!sources.length) {
    list.innerHTML = `<div style="text-align:center;color:var(--muted);padding:20px">Aucune source configurée.<br><span style="font-size:.75rem;margin-top:8px;display:block">Clé : <strong>${currentMovieId}</strong></span></div>`;
    return;
  }
  list.innerHTML = sources.map(src => `
    <div class="source-item ${src.available ? '' : 'unavailable'}" ${src.available ? `onclick="selectSource('${src.id}')"` : ''}>
      <div class="source-icon ${src.iconClass}">${src.icon}</div>
      <div class="source-info"><div class="source-name">${src.label} · ${src.quality}</div><div class="source-desc">${src.available ? 'Prête à la lecture' : 'Non disponible'}</div></div>
      <span class="source-status ${src.available ? 'available' : 'unavailable'}">${src.available ? '✓ Disponible' : 'Bientôt'}</span>
    </div>`).join('');
}
function closeSourceModal() { document.getElementById('sourceOverlay').classList.remove('open'); }
function selectSource(sourceId) {
  closeSourceModal();
  playerSourceId = sourceId;
  loadAndPlay(sourceId);
}

/* ══════════════════════════════════════
   LECTEUR VIDÉO — ANTI-CHAUFFE
   • preload="none" → pas de téléchargement avant lecture
   • Pas de buffer excessif : on ne précharge que ce qu'il faut
   • On coupe TOUTES les autres sources avant de lancer
   • playsinline pour iOS/iPhone
   • Pas d'autoplay invisible
══════════════════════════════════════ */
function loadAndPlay(sourceId) {
  const id      = currentMovieId?.toString();
  const sources = VIDEO_SOURCES[id] ?? [];
  const src     = sources.find(s => s.id === sourceId);
  if (!src || !src.available || !src.url) { showToast('⚠️ Source non configurée'); return; }

  // Arrêt de TOUT (iframes, autre vidéo)
  stopAllIframes();

  const dataStore = playerMode === 'anime' ? animesData : seriesData;
  const tv    = playerMode !== 'film' ? dataStore[playerTmdbId] : null;
  const movie = playerMode === 'film' ? moviesData[currentMovieId] : null;

  document.getElementById('playerTitleLabel').textContent   = tv ? (tv.name||tv.title||'') : (movie?.title ?? '');
  document.getElementById('playerEpLabel').textContent      = tv ? `S${playerSeason} · E${playerEpisode}` : '';
  document.getElementById('playerQualityBadge').textContent = `${src.label} · ${src.quality}`;

  const vid = document.getElementById('mainVideo');

  // Arrêt propre de la vidéo précédente
  vid.pause();
  vid.removeAttribute('src');
  try { vid.load(); } catch(e) {}

  showLoading(true);
  document.getElementById('playerOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  setPlayIcon(false);
  resetProgress();
  updateNextEpButton();

  // Incrémenter les vues
  const vidType = (playerMode === 'serie' || playerMode === 'anime') ? playerMode : 'film';
  const vidId   = playerMode !== 'film' ? playerTmdbId : currentMovieId;
  incrementViews(vidId, vidType);

  // Récupérer le timestamp de reprise
  let resumeAt = null;
  if (pendingResumeTime && pendingResumeTime > 5) {
    resumeAt = pendingResumeTime;
    pendingResumeTime = null;
  } else if (playerMode === 'film') {
    // On cherche dans l'historique seulement si pendingResumeTime était défini
    // (sinon = clic normal depuis catalogue = reprend à 0)
    // Ne rien faire ici
  } else {
    // Pour les épisodes, on reprend à partir de la progression sauvée
    const progressKey = `mm_progress_${currentUser?.email}_${currentProfile?.name}_${playerMode}_${playerTmdbId}_S${playerSeason}E${playerEpisode}`;
    const saved = load(progressKey, null);
    if (saved && saved.time > 5) resumeAt = saved.time;
  }

  // Configurer la source — preload minimal pour économiser CPU/RAM
  vid.preload = 'none';
  vid.src     = src.url;

  vid.addEventListener('canplay', function onCanplay() {
    vid.removeEventListener('canplay', onCanplay);
    showLoading(false);
    if (resumeAt !== null) { vid.currentTime = resumeAt; resumeAt = null; }
    vid.play().catch(() => showToast('▶ Appuie sur Play'));
  });

  vid.addEventListener('error', function onError() {
    vid.removeEventListener('error', onError);
    showLoading(false);
    showToast('❌ Erreur de lecture');
    console.error('Video error:', vid.error);
  });

  // ANTI-CHAUFFE : Limiter le buffer via MediaSource si disponible
  // (le navigateur gère nativement la limitation du buffer sur mobile)
  // On ne force pas de téléchargement en avance
  vid.load();
}

/* ══ CLOSE PLAYER ══ */
function closePlayer() {
  const vid = document.getElementById('mainVideo');
  // Sauvegarder la progression
  if (vid.currentTime > 5 && vid.duration) saveProgress(vid.currentTime, vid.duration);
  // Arrêt COMPLET : évite toute lecture en fond
  vid.pause();
  vid.removeAttribute('src');
  try { vid.load(); } catch(e) {}
  document.getElementById('playerOverlay').classList.remove('open');
  document.body.style.overflow = '';
  resetProgress();
  setPlayIcon(false);
  const nextBtn = document.getElementById('nextEpBtn');
  if (nextBtn) nextBtn.style.display = 'none';
}

function saveProgress(time, duration) {
  const dataStore = playerMode === 'anime' ? animesData : seriesData;
  if (playerMode === 'serie' || playerMode === 'anime') {
    const tv = dataStore[playerTmdbId];
    const progressKey = `mm_progress_${currentUser?.email}_${currentProfile?.name}_${playerMode}_${playerTmdbId}_S${playerSeason}E${playerEpisode}`;
    store(progressKey, { time, duration });
    saveResume({ id: currentMovieId, tmdbId: playerTmdbId, type: playerMode, title: tv ? (tv.name||tv.title||'') : '', season: playerSeason, episode: playerEpisode, epTitle: '', backdrop: tv?.backdrop_path||null, time, duration });
  } else {
    const movie = moviesData[currentMovieId];
    saveResume({ id: currentMovieId, type: 'film', title: movie?.title||'', backdrop: movie?.backdrop_path||null, time, duration });
  }
}

function showLoading(show) { document.getElementById('stageLoading').classList.toggle('active', show); }

/* ══ CONTRÔLES VIDÉO ══ */
const vid = document.getElementById('mainVideo');

function initPlayerEvents() {
  vid.addEventListener('timeupdate', updateProgress);
  vid.addEventListener('progress',   updateBuffer);
  vid.addEventListener('play',       () => { setPlayIcon(true);  flashIcon('play');  });
  vid.addEventListener('pause',      () => { setPlayIcon(false); flashIcon('pause'); });
  vid.addEventListener('ended',      () => { setPlayIcon(false); resetProgress(); handleVideoEnded(); });
  vid.addEventListener('waiting',    () => showLoading(true));
  vid.addEventListener('playing',    () => showLoading(false));
  // Sauvegarde périodique toutes les 10s (en cas de fermeture inattendue)
  setInterval(() => {
    if (!document.getElementById('playerOverlay').classList.contains('open')) return;
    if (vid.currentTime > 5 && vid.duration) saveProgress(vid.currentTime, vid.duration);
  }, 10000);
}
async function handleVideoEnded() {
  if (playerMode === 'serie' || playerMode === 'anime') {
    const next = await computeNextEpisode();
    if (next) { showToast('⏭ Épisode suivant dans 3s...'); setTimeout(() => playNextEpisode(), 3000); }
  }
}
function updateProgress() {
  if (!vid.duration) return;
  const pct = (vid.currentTime / vid.duration) * 100;
  document.getElementById('progFill').style.width = pct + '%';
  document.getElementById('timeTxt').textContent  = `${fmt(vid.currentTime)} / ${fmt(vid.duration)}`;
}
function updateBuffer() {
  if (!vid.duration || !vid.buffered.length) return;
  const pct = (vid.buffered.end(vid.buffered.length - 1) / vid.duration) * 100;
  document.getElementById('progBuf').style.width = pct + '%';
}
function seekVideo(e) {
  if (!vid.duration) return;
  const r = document.getElementById('progTrack').getBoundingClientRect();
  vid.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * vid.duration;
}
function resetProgress() {
  document.getElementById('progFill').style.width = '0%';
  document.getElementById('progBuf').style.width  = '0%';
  document.getElementById('timeTxt').textContent  = '0:00 / 0:00';
}
function fmt(s) { if (isNaN(s)) return '0:00'; return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`; }
function togglePlay()   { if (!vid.src) return; vid.paused ? vid.play().catch(() => {}) : vid.pause(); }
function skipForward()  { vid.currentTime = Math.min(vid.duration||0, vid.currentTime + 10); showToast('⏩ +10s'); }
function skipBackward() { vid.currentTime = Math.max(0, vid.currentTime - 10); showToast('⏪ -10s'); }
function toggleMute() {
  vid.muted = !vid.muted;
  document.getElementById('volSlider').value = vid.muted ? 0 : vid.volume;
  updateVolumeIcon();
}
function setVolume(v) { vid.volume = parseFloat(v); vid.muted = parseFloat(v) === 0; updateVolumeIcon(); }
function updateVolumeIcon() {
  const muted = vid.muted || vid.volume === 0;
  document.getElementById('volIcon').innerHTML = muted
    ? '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>'
    : vid.volume < 0.5
      ? '<path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>'
      : '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
}
function setPlayIcon(playing) {
  document.getElementById('playIcon').innerHTML = playing
    ? '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>'
    : '<path d="M8 5v14l11-7z"/>';
}
function flashIcon(type) {
  const el = document.getElementById(type === 'play' ? 'playFlash' : 'pauseFlash');
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 500);
}
function toggleFullscreen() {
  const target = document.getElementById('playerOverlay');
  if (document.fullscreenElement) document.exitFullscreen();
  else target.requestFullscreen().catch(() => {});
  document.addEventListener('fullscreenchange', () => {
    document.getElementById('fsIcon').innerHTML = document.fullscreenElement
      ? '<path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>'
      : '<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>';
  }, { once: true });
}

/* ══ MASQUAGE CONTRÔLES ══ */
function initControlsHide() {
  const overlay  = document.getElementById('playerOverlay');
  const header   = document.getElementById('playerHeader');
  const controls = document.getElementById('playerControls');
  const show = () => {
    header?.classList.remove('hidden');
    controls?.classList.remove('hidden');
    clearTimeout(controlsTimer);
    if (!vid.paused) {
      controlsTimer = setTimeout(() => {
        header?.classList.add('hidden');
        controls?.classList.add('hidden');
      }, 3000);
    }
  };
  overlay.addEventListener('mousemove',  show);
  overlay.addEventListener('touchstart', show, { passive: true });
}

/* ══ CLAVIER ══ */
document.addEventListener('keydown', e => {
  if (!document.getElementById('playerOverlay').classList.contains('open')) return;
  switch (e.key) {
    case 'Escape':        closePlayer();                    break;
    case ' ': case 'k':   e.preventDefault(); togglePlay(); break;
    case 'ArrowRight':    skipForward();                    break;
    case 'ArrowLeft':     skipBackward();                   break;
    case 'ArrowUp':       vid.volume = Math.min(1, vid.volume+0.1); document.getElementById('volSlider').value = vid.volume; updateVolumeIcon(); showToast(`🔊 ${Math.round(vid.volume*100)}%`); break;
    case 'ArrowDown':     vid.volume = Math.max(0, vid.volume-0.1); document.getElementById('volSlider').value = vid.volume; updateVolumeIcon(); showToast(`🔉 ${Math.round(vid.volume*100)}%`); break;
    case 'f': toggleFullscreen(); break;
    case 'm': toggleMute();       break;
    case 'n': playNextEpisode();  break;
  }
});

/* ══ OVERLAY CLICK ══ */
function handleOverlayClick(e, id) {
  if (e.target.id === id) document.getElementById(id).classList.remove('open');
}

/* ══ TOAST ══ */
let _toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

/* ══ UTILS ══ */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ══ Page visibility — pause video si onglet masqué (anti-chauffe) ══ */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Sauvegarde silencieuse si le lecteur est ouvert
    if (document.getElementById('playerOverlay').classList.contains('open')) {
      if (vid.currentTime > 5 && vid.duration) saveProgress(vid.currentTime, vid.duration);
    }
    // On ne met PAS en pause automatiquement car l'utilisateur peut vouloir écouter l'audio
    // Mais on arrête les iframes non visibles pour éviter la chauffe
    document.querySelectorAll('#trailerContainer iframe, #serieTrailerContainer iframe').forEach(f => {
      if (f.src && f.src !== 'about:blank') {
        f.dataset.pausedSrc = f.src;
        f.src = 'about:blank';
      }
    });
  } else {
    // Restauration des iframes si on revient
    document.querySelectorAll('iframe[data-paused-src]').forEach(f => {
      f.src = f.dataset.pausedSrc;
      delete f.dataset.pausedSrc;
    });
  }
});