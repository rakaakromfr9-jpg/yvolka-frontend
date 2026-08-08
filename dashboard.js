// ==========================================================================
// ROLE SERVER CONFIG — set this to your deployed backend URL.
// ==========================================================================
const ROLE_SERVER_URL = 'https://yvolka-backend.vercel.app/api/role/1023770611362840606';

// Labels for the "Let's Join With Us" roles
const ROLE_LABELS = { developer: 'Developer', artist: 'Artist', creator: 'Creator' };

// ==========================================================================
// CAMPAIGN DATA (demo/mock) — replace with a real fetch from your backend
// once campaigns are stored server-side. `mine` marks campaigns the signed
// in user is actually part of (used to compute the Account/Home stats);
// every campaign is still shown in the Campaign tab as an open brief.
// ==========================================================================
const CAMPAIGNS = [
  {
    title: 'Amber Field — Launch Push',
    payRate: '$6 / 1,000 views',
    paymentMethod: 'PayPal',
    rules: 'Tag @yvolka and @amberfield, video min. 15s, no reposts of old content.',
    status: 'ongoing',
    mine: true
  },
  {
    title: 'Northbound Co. — Product Teaser',
    payRate: '$4 / 1,000 views',
    paymentMethod: 'Bank Transfer',
    rules: 'Feature the product in first 3 seconds, use the provided caption template.',
    status: 'open',
    mine: false
  },
  {
    title: 'Halden Gallery — Exhibition Recap',
    payRate: '$5 / 1,000 views',
    paymentMethod: 'Crypto (USDT)',
    rules: 'On-site footage only, credit the gallery handle, submit draft for approval.',
    status: 'open',
    mine: false
  },
  {
    title: 'Plainfield Finance — Explainer Clip',
    payRate: '$3.5 / 1,000 views',
    paymentMethod: 'PayPal',
    rules: 'Keep tone factual, no financial advice claims, include disclosure tag.',
    status: 'completed',
    mine: true
  },
  {
    title: 'Coastline Freight — Behind the Scenes',
    payRate: '$4.5 / 1,000 views',
    paymentMethod: 'Bank Transfer',
    rules: 'Min. 30s runtime, must include warehouse b-roll provided by the brand.',
    status: 'open',
    mine: false
  },
  {
    title: 'Iron Gate Studio — Brand Story',
    payRate: '$7 / 1,000 views',
    paymentMethod: 'PayPal',
    rules: 'One long-form post + one short clip, both tagged, 48h posting window.',
    status: 'open',
    mine: false
  }
];

// ==========================================================================
// SPONSOR DATA (demo/mock) — just names for the marquee. Replace with a
// real fetch once sponsors are stored server-side.
// ==========================================================================
const SPONSORS = [
  'Amber Field', 'Northbound Co.', 'Halden Gallery', 'Plainfield Finance',
  'Coastline Freight', 'Iron Gate Studio', 'Marrow & Co.', 'Vantage Point'
];

// Ask the backend what role this Discord user belongs to.
// Returns 'developer' | 'artist' | 'creator' | null.
async function fetchServerRole(discordId) {
  if (!ROLE_SERVER_URL) return null;
  try {
    const res = await fetch(`${ROLE_SERVER_URL}/api/role/${discordId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.role || null;
  } catch (err) {
    console.error('Could not reach role server:', err);
    return null;
  }
}

// Human-readable role chip text + whether it should look "muted"
function roleDisplay(user) {
  if (user.role && ROLE_LABELS[user.role]) {
    return { label: ROLE_LABELS[user.role], muted: false };
  }
  return { label: 'No role yet', muted: true };
}

// Pick the campaign to feature on the Home tab: an ongoing one the user is
// part of, falling back to the first open brief.
function pickSpotlightCampaign() {
  return CAMPAIGNS.find(c => c.mine && c.status === 'ongoing')
    || CAMPAIGNS.find(c => c.status === 'open')
    || CAMPAIGNS[0];
}

function campaignStatusLabel(status) {
  if (status === 'ongoing') return 'Ongoing';
  if (status === 'completed') return 'Completed';
  return 'Open';
}

document.addEventListener('DOMContentLoaded', () => {
  // Auth buttons
  const logoutBtn = document.getElementById('logoutBtn');
  const accountLogoutBtn = document.getElementById('accountLogoutBtn');

  // Dashboard Profile Elements
  const userAvatarImg = document.getElementById('userAvatarImg');
  const userGlobalName = document.getElementById('userGlobalName');
  const userUsername = document.getElementById('userUsername');
  const userRoleBadge = document.getElementById('userRoleBadge');

  // Dashboard tabs
  const dashNavLinks = document.querySelectorAll('.dash-nav-link');
  const dashViews = document.querySelectorAll('.dash-view');
  const homeCampaignCta = document.getElementById('homeCampaignCta');
  const homeQuickCards = document.querySelectorAll('.home-quick-card[data-view]');

  // ------------------------------------------------------------------
  // Guard: if not logged in, redirect back to login page
  // ------------------------------------------------------------------
  const savedUser = localStorage.getItem('discord_user');
  if (!savedUser) {
    window.location.href = 'index.html';
    return;
  }

  let currentUser;
  try {
    currentUser = JSON.parse(savedUser);
  } catch (e) {
    localStorage.removeItem('discord_user');
    window.location.href = 'index.html';
    return;
  }

  // ------------------------------------------------------------------
  // DASHBOARD TABS (Home / Account / Campaign / Sponsorship)
  // ------------------------------------------------------------------
  function setDashView(viewName) {
    dashViews.forEach(v => v.classList.toggle('active', v.id === 'dash' + viewName.charAt(0).toUpperCase() + viewName.slice(1)));
    dashNavLinks.forEach(l => l.classList.toggle('active', l.dataset.view === viewName));
    window.scrollTo(0, 0);
  }

  dashNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      setDashView(link.dataset.view);
    });
  });

  if (homeCampaignCta) {
    homeCampaignCta.addEventListener('click', (e) => {
      e.preventDefault();
      setDashView('campaign');
    });
  }

  homeQuickCards.forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      setDashView(card.dataset.view);
    });
  });

  // ------------------------------------------------------------------
  // Render Logged-In User Profile (top bar + Home + Account tab)
  // ------------------------------------------------------------------
  function renderUserHeader(user) {
    if (!user) return;
    const avatarUrl = user.avatar
      ? (user.avatar.startsWith('http') ? user.avatar : `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`)
      : 'https://cdn.discordapp.com/embed/avatars/0.png';

    if (userAvatarImg) userAvatarImg.src = avatarUrl;
    if (userGlobalName) userGlobalName.textContent = user.global_name || user.username;
    if (userUsername) userUsername.textContent = user.username.startsWith('@') ? user.username : `@${user.username}`;

    const { label: roleLabel, muted: roleMuted } = roleDisplay(user);
    if (userRoleBadge) {
      userRoleBadge.textContent = roleLabel;
      userRoleBadge.classList.toggle('muted', roleMuted);
    }

    const completedCount = CAMPAIGNS.filter(c => c.mine && c.status === 'completed').length;
    const ongoingCount = CAMPAIGNS.filter(c => c.mine && c.status === 'ongoing').length;

    renderHomeView(user);
    renderAccountView(user, avatarUrl, roleLabel, roleMuted, ongoingCount, completedCount);
  }

  // Render the Home tab: greeting + spotlight brief
  function renderHomeView(user) {
    const homeUserName = document.getElementById('homeUserName');
    if (homeUserName) homeUserName.textContent = user.global_name || user.username;

    const spotlight = pickSpotlightCampaign();
    const spotStatus = document.getElementById('homeSpotlightStatus');
    const spotPay = document.getElementById('homeSpotlightPay');
    const spotTitle = document.getElementById('homeSpotlightTitle');
    const spotRules = document.getElementById('homeSpotlightRules');
    if (spotlight) {
      if (spotStatus) {
        spotStatus.textContent = campaignStatusLabel(spotlight.status);
        spotStatus.className = `campaign-status ${spotlight.status}`;
      }
      if (spotPay) spotPay.textContent = spotlight.payRate;
      if (spotTitle) spotTitle.textContent = spotlight.title;
      if (spotRules) spotRules.textContent = spotlight.rules;
    }
  }

  // Render the dedicated Account tab (maincard)
  function renderAccountView(user, avatarUrl, roleLabel, roleMuted, ongoingCount, completedCount) {
    const accAvatar = document.getElementById('accountAvatarImg');
    const accName = document.getElementById('accountName');
    const accUsername = document.getElementById('accountUsername');
    const accRoleChip = document.getElementById('accountRoleChip');
    const accJoined = document.getElementById('accountJoined');
    const accCompleted = document.getElementById('accountCompleted');
    const accOngoing = document.getElementById('accountOngoing');
    const accRoleNote = document.getElementById('accountRoleNote');

    if (accAvatar) accAvatar.src = avatarUrl;
    if (accName) accName.textContent = user.global_name || user.username;
    if (accUsername) accUsername.textContent = user.username.startsWith('@') ? user.username : `@${user.username}`;
    if (accRoleChip) {
      accRoleChip.textContent = roleLabel;
      accRoleChip.classList.toggle('muted', roleMuted);
    }
    if (accCompleted) accCompleted.textContent = completedCount;
    if (accOngoing) accOngoing.textContent = ongoingCount;
    if (accJoined) {
      if (!user.joined_label) user.joined_label = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
      accJoined.textContent = user.joined_label;
    }
    if (accRoleNote) {
      accRoleNote.textContent = user.role
        ? 'Your role is synced from the YVOLKA Discord server.'
        : 'No role found yet. Ask an admin to assign your Developer / Artist / Creator role in Discord.';
    }
  }

  // Render the sponsor name marquee (duplicated once for a seamless loop)
  function renderSponsors() {
    const track = document.getElementById('sponsorMarqueeTrack');
    if (!track) return;
    const items = SPONSORS.map(name => `<span class="sponsor-marquee-name"><span class="dot"></span>${name}</span>`).join('');
    track.innerHTML = items + items;
  }

  // Render the Campaign tab cards
  function renderCampaigns() {
    const grid = document.getElementById('campaignGrid');
    if (!grid) return;
    grid.innerHTML = CAMPAIGNS.map(c => `
      <div class="campaign-card">
        <div class="campaign-thumb"></div>
        <div class="campaign-body">
          <span class="campaign-status ${c.status}">${campaignStatusLabel(c.status)}</span>
          <h3 class="campaign-title">${c.title}</h3>
          <div class="campaign-meta-rows">
            <div class="campaign-meta-row"><span>Pay rate</span><span>${c.payRate}</span></div>
            <div class="campaign-meta-row"><span>Payment method</span><span>${c.paymentMethod}</span></div>
          </div>
          <p class="campaign-rules"><strong>Rules:</strong> ${c.rules}</p>
        </div>
      </div>
    `).join('');
  }

  // ------------------------------------------------------------------
  // Sign Out
  // ------------------------------------------------------------------
  function handleLogout() {
    localStorage.removeItem('discord_user');
    window.location.href = 'index.html';
  }
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  if (accountLogoutBtn) accountLogoutBtn.addEventListener('click', handleLogout);

  // ------------------------------------------------------------------
  // Dashboard interactive nav scroll effect
  // ------------------------------------------------------------------
  const nav = document.getElementById('siteNav');
  if (nav) {
    window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 40), { passive: true });
  }

  // ------------------------------------------------------------------
  // Initialize
  // ------------------------------------------------------------------
  renderCampaigns();
  renderSponsors();
  renderUserHeader(currentUser);

  // Re-check the Discord role in the background — if an admin changed
  // it since last visit, the dashboard updates without a fresh login.
  if (currentUser.auth_type === 'oauth2') {
    fetchServerRole(currentUser.id).then(role => {
      currentUser.role = role;
      localStorage.setItem('discord_user', JSON.stringify(currentUser));
      renderUserHeader(currentUser);
    });
  }

  // Start at Home tab
  setDashView('home');
});
