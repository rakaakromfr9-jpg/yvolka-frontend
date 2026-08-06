// ==========================================================================
// DISCORD OAUTH2 CONFIG — set this ONCE, here, as the site owner.
// This is public and safe to hardcode (Client ID is not a secret — only
// Client Secret is, and this app never uses Client Secret since it relies
// on the OAuth2 implicit flow, response_type=token).
//
// 1. Go to https://discord.com/developers/applications
// 2. Create/select your application, copy its "Application ID" (Client ID)
// 3. Under OAuth2 > Redirects, add EXACTLY the URL this site is hosted at
//    (e.g. https://yourdomain.com/ or https://yourdomain.com/index.html)
// 4. Paste that same URL below as DISCORD_REDIRECT_URI
// ==========================================================================
const DISCORD_CLIENT_ID = '1534210727001325618';
const DISCORD_REDIRECT_URI = 'https://rakaakromfr9-jpg.github.io/company-profiles/';

// ==========================================================================
// ROLE SERVER CONFIG — set this to your deployed backend URL.
// See /server/README.md for how to set up and deploy that backend.
// Categories (Developer / Artist / Creator) are NOT picked by the user —
// they're read from the user's Discord server role via this backend.
// ==========================================================================
const ROLE_SERVER_URL = 'https://yvolka-backend.vercel.app/api/role/1023770611362840606'; // e.g. 'https://yvolka-role-server.onrender.com'

// Labels for the "Let's Join With Us" categories
const ROLE_LABELS = { developer: 'Developer', artist: 'Artist', creator: 'Creator' };

// Ask the backend what category this Discord user belongs to.
// Returns 'developer' | 'artist' | 'creator' | null.
async function fetchServerRole(discordId) {
  if (!ROLE_SERVER_URL) {
    console.warn('ROLE_SERVER_URL is not set in main.js — categories will show as "No category yet".');
    return null;
  }
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

// Human-readable category chip text + whether it should look "muted"
function roleDisplay(user) {
  if (user.role && ROLE_LABELS[user.role]) {
    return { label: ROLE_LABELS[user.role], muted: false };
  }
  if (user.auth_type === 'nickname') {
    return { label: 'Sign in with Discord for a category', muted: true };
  }
  return { label: 'No category yet', muted: true };
}

document.addEventListener('DOMContentLoaded', () => {
  // View Elements
  const welcomeView = document.getElementById('welcomeView');
  const dashboardView = document.getElementById('dashboardView');

  // Auth Buttons
  const discordLoginBtn = document.getElementById('discordLoginBtn');
  const nicknameInputInline = document.getElementById('nicknameInputInline');
  const nicknameSubmitBtn = document.getElementById('nicknameSubmitBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const accountLogoutBtn = document.getElementById('accountLogoutBtn');

  // Dashboard Profile Elements
  const userAvatarImg = document.getElementById('userAvatarImg');
  const userGlobalName = document.getElementById('userGlobalName');
  const userUsername = document.getElementById('userUsername');
  const authBadge = document.querySelector('.auth-badge');
  const userRoleBadge = document.getElementById('userRoleBadge');

  // Dashboard tabs
  const dashNavLinks = document.querySelectorAll('.dash-nav-link');
  const dashViews = document.querySelectorAll('.dash-view');

  // ---------------------------------------------------------------------
  // DASHBOARD TABS (Home / Account / Campaign)
  // ---------------------------------------------------------------------
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

  // View Router Function
  function setView(viewName) {
    if (viewName === 'dashboard') {
      welcomeView.classList.remove('view-active');
      dashboardView.classList.add('view-active');
      setDashView('home');
      window.scrollTo(0, 0);
    } else {
      dashboardView.classList.remove('view-active');
      welcomeView.classList.add('view-active');
      window.scrollTo(0, 0);
    }
  }

  // Render Logged-In User Profile (top bar + Account tab)
  function renderUserHeader(user) {
    if (!user) return;
    const avatarUrl = user.avatar
      ? (user.avatar.startsWith('http') ? user.avatar : `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`)
      : 'https://cdn.discordapp.com/embed/avatars/0.png';

    if (userAvatarImg) userAvatarImg.src = avatarUrl;
    if (userGlobalName) userGlobalName.textContent = user.global_name || user.username;
    if (userUsername) userUsername.textContent = user.username.startsWith('@') ? user.username : `@${user.username}`;

    if (authBadge) {
      authBadge.textContent = user.auth_type === 'nickname' ? 'Signed in via Nickname' : 'Verified via Discord OAuth2';
    }

    const { label: roleLabel, muted: roleMuted } = roleDisplay(user);
    if (userRoleBadge) {
      userRoleBadge.textContent = roleLabel;
      userRoleBadge.classList.toggle('muted', roleMuted);
    }

    renderAccountView(user, avatarUrl, roleLabel, roleMuted);
  }

  // Render the dedicated Account tab
  function renderAccountView(user, avatarUrl, roleLabel, roleMuted) {
    const accAvatar = document.getElementById('accountAvatarImg');
    const accName = document.getElementById('accountName');
    const accUsername = document.getElementById('accountUsername');
    const accAuthBadge = document.getElementById('accountAuthBadge');
    const accRoleChip = document.getElementById('accountRoleChip');
    const accRoleText = document.getElementById('accountRoleText');
    const accJoined = document.getElementById('accountJoined');
    const accRoleNote = document.getElementById('accountRoleNote');

    if (accAvatar) accAvatar.src = avatarUrl;
    if (accName) accName.textContent = user.global_name || user.username;
    if (accUsername) accUsername.textContent = user.username.startsWith('@') ? user.username : `@${user.username}`;
    if (accAuthBadge) accAuthBadge.textContent = user.auth_type === 'nickname' ? 'Signed in via Nickname' : 'Verified via Discord OAuth2';
    if (accRoleChip) {
      accRoleChip.textContent = roleLabel;
      accRoleChip.classList.toggle('muted', roleMuted);
    }
    if (accRoleText) accRoleText.textContent = roleLabel;
    if (accJoined) {
      if (!user.joined_label) user.joined_label = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
      accJoined.textContent = user.joined_label;
    }
    if (accRoleNote) {
      if (user.role) {
        accRoleNote.textContent = 'Category is synced from your role in the YVOLKA Discord server.';
      } else if (user.auth_type === 'nickname') {
        accRoleNote.textContent = 'Nickname sign-in can\'t be matched to a Discord role. Sign in with Discord to get a category.';
      } else {
        accRoleNote.textContent = 'No category role found yet. Ask an admin to assign your Developer / Artist / Creator role in Discord.';
      }
    }
  }

  // Parse Discord OAuth URL Hash
  function handleOAuthCallback() {
    const hash = window.location.hash.substring(1);
    if (!hash) return false;

    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const tokenType = params.get('token_type');

    if (accessToken) {
      history.replaceState(null, "", window.location.pathname + window.location.search);

      fetch('https://discord.com/api/v10/users/@me', {
        headers: { Authorization: `${tokenType || 'Bearer'} ${accessToken}` }
      })
        .then(res => res.json())
        .then(async userData => {
          if (userData && userData.id) {
            userData.auth_type = 'oauth2';
            userData.role = await fetchServerRole(userData.id); // read from Discord server role
            localStorage.setItem('discord_user', JSON.stringify(userData));
            renderUserHeader(userData);
            setView('dashboard');
          }
        })
        .catch(err => {
          console.error('Discord API authorization failed:', err);
          alert('Could not verify OAuth2 token with Discord. You can log in using your Discord Nickname.');
        });
      return true;
    }
    return false;
  }

  // Check saved session on page load
  function checkAuthSession() {
    const isHandlingOAuth = handleOAuthCallback();
    if (isHandlingOAuth) return;

    const savedUser = localStorage.getItem('discord_user');
    if (savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        renderUserHeader(userObj);
        setView('dashboard');

        // Re-check the Discord role in the background — if an admin changed
        // it since last visit, the dashboard updates without a fresh login.
        if (userObj.auth_type === 'oauth2') {
          fetchServerRole(userObj.id).then(role => {
            userObj.role = role;
            localStorage.setItem('discord_user', JSON.stringify(userObj));
            renderUserHeader(userObj);
          });
        }
      } catch (e) {
        localStorage.removeItem('discord_user');
        setView('welcome');
      }
    } else {
      setView('welcome');
    }
  }

  // --- NICKNAME LOGIN HANDLER ---
  // Note: nickname sign-in isn't a verified Discord account, so it can't be
  // matched against a Discord server role — these users get no category.
  function handleNicknameSubmit() {
    const rawName = nicknameInputInline ? nicknameInputInline.value.trim() : '';
    if (!rawName) {
      alert('Please enter your Discord nickname.');
      if (nicknameInputInline) nicknameInputInline.focus();
      return;
    }

    const randomAvatarIndex = Math.floor(Math.random() * 5);
    const userObj = {
      id: 'nick_' + Date.now().toString(36),
      username: rawName.toLowerCase().replace(/\s+/g, '_'),
      global_name: rawName,
      avatar: `https://cdn.discordapp.com/embed/avatars/${randomAvatarIndex}.png`,
      auth_type: 'nickname',
      role: null
    };

    localStorage.setItem('discord_user', JSON.stringify(userObj));
    renderUserHeader(userObj);
    setView('dashboard');
  }

  // --- EVENT LISTENERS ---

  // Option 1: Direct Discord OAuth Login (public — no per-user config needed)
  if (discordLoginBtn) {
    discordLoginBtn.addEventListener('click', () => {
      if (!DISCORD_CLIENT_ID || DISCORD_CLIENT_ID === '') {
        alert('Discord login is not configured yet. The site owner needs to set DISCORD_CLIENT_ID in main.js.');
        return;
      }

      const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=token&scope=identify%20email`;
      window.location.href = authUrl;
    });
  }

  // Option 2: Continue with nickname
  if (nicknameSubmitBtn) {
    nicknameSubmitBtn.addEventListener('click', handleNicknameSubmit);
  }

  if (nicknameInputInline) {
    nicknameInputInline.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleNicknameSubmit();
      }
    });
  }

  // Sign Out (top bar + Account tab)
  function handleLogout() {
    localStorage.removeItem('discord_user');
    setView('welcome');
  }
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  if (accountLogoutBtn) accountLogoutBtn.addEventListener('click', handleLogout);

  // --- DASHBOARD INTERACTIVE FEATURES ---
  const nav = document.getElementById('siteNav');
  if (nav) {
    window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 40), { passive: true });
  }

  // Client Marquee
  const marqueeTrack = document.getElementById('marqueeTrack');
  if (marqueeTrack) {
    const clients = [
      "Amber Field", "Northbound Co.", "Halden Gallery", "Plainfield Finance",
      "Vess & Rowe", "Marlowe Labs", "Coastline Freight", "Iron Gate Studio",
      "Quill Insurance", "Basecamp Outdoors", "Fernhollow", "Redline Motors"
    ];
    marqueeTrack.innerHTML = [...clients, ...clients].map(c => `<span>${c}</span>`).join('');
  }

  // Footer Tickers
  const tickerA = document.getElementById('tickerA');
  const tickerB = document.getElementById('tickerB');
  if (tickerA && tickerB) {
    const statsA = ["12+ YEARS", "40 PROJECTS", "ZERO SCRUBS", "PORT ELM"];
    const statsB = ["HARLOW", "0 REPTILIANS", "3 DOGS", "6 COUNTRIES"];
    tickerA.innerHTML = [...statsA, ...statsA].map(s => `<span>${s}</span>`).join('');
    tickerB.innerHTML = [...statsB, ...statsB].map(s => `<span>${s}</span>`).join('');
  }

  // Featured Work Slider
  const slides = [...document.querySelectorAll('.slide')];
  const sliderNav = document.getElementById('sliderNav');
  if (slides.length > 0 && sliderNav) {
    sliderNav.innerHTML = '';
    slides.forEach((s, i) => {
      const dot = document.createElement('button');
      dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Show slide ' + (i + 1));
      dot.addEventListener('click', () => goTo(i));
      sliderNav.appendChild(dot);
    });
    const dots = [...sliderNav.children];
    let current = 0;
    function goTo(i) {
      slides[current].classList.remove('active');
      dots[current].classList.remove('active');
      current = i;
      slides[current].classList.add('active');
      dots[current].classList.add('active');
    }
    setInterval(() => goTo((current + 1) % slides.length), 6000);
  }

  // Worked-with Accordion
  const list = document.getElementById('workedList');
  if (list) {
    const worked = [
      { name: "Vess & Rowe", tags: "Research – Strategy", body: "A round of interviews and usability tests gave us a clear direction." },
      { name: "Marlowe Labs", tags: "Design", body: "Built an online store that matched the product's packaging and feel." },
      { name: "Coastline Freight", tags: "Research – Strategy – Design – Development", body: "Maintained and grew their logistics platform over several years." },
      { name: "Iron Gate Studio", tags: "Strategy – Design – Development", body: "Restructured messaging hierarchy and improved findability." },
      { name: "Fernhollow", tags: "Research – Strategy – Design – Development", body: "A wellness app with a calm, unhurried interface." },
      { name: "Quill Insurance", tags: "Research – Strategy – Design – Development", body: "Simplified their multi-step quote flow for first-time visitors." }
    ];
    list.innerHTML = worked.map((w, i) => `
      <details class="worked-item">
        <summary>
          <span class="worked-idx">${String(i + 1).padStart(2, '0')}</span>
          <span class="worked-name">${w.name}</span>
          <span class="worked-tags">${w.tags}</span>
          <span class="cap-toggle">+</span>
        </summary>
        <div class="worked-body">${w.body}</div>
      </details>
    `).join('');
  }

  // Initialize Session Check
  checkAuthSession();
});
