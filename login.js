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
const DISCORD_REDIRECT_URI = 'https://rakaakromfr9-jpg.github.io/yvolka-frontend/';

// ==========================================================================
// ROLE SERVER CONFIG — set this to your deployed backend URL.
// ==========================================================================
const ROLE_SERVER_URL = 'https://yvolka-backend.vercel.app/api/role/1023770611362840606';

// Ask the backend what role this Discord user belongs to.
// Returns 'developer' | 'artist' | 'creator' | null.
async function fetchServerRole(discordId) {
  if (!ROLE_SERVER_URL) {
    console.warn('ROLE_SERVER_URL is not set in login.js — role will show as "No role yet".');
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

document.addEventListener('DOMContentLoaded', () => {
  const discordLoginBtn = document.getElementById('discordLoginBtn');

  // ------------------------------------------------------------------
  // Parse Discord OAuth2 implicit-flow hash on redirect back to this page
  // ------------------------------------------------------------------
  function handleOAuthCallback() {
    const hash = window.location.hash.substring(1);
    if (!hash) return false;

    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const tokenType = params.get('token_type');

    if (accessToken) {
      // Clean the URL hash immediately
      history.replaceState(null, '', window.location.pathname + window.location.search);

      fetch('https://discord.com/api/v10/users/@me', {
        headers: { Authorization: `${tokenType || 'Bearer'} ${accessToken}` }
      })
        .then(res => res.json())
        .then(async userData => {
          if (userData && userData.id) {
            userData.auth_type = 'oauth2';
            userData.role = await fetchServerRole(userData.id);
            localStorage.setItem('discord_user', JSON.stringify(userData));
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
          }
        })
        .catch(err => {
          console.error('Discord API authorization failed:', err);
          alert('Could not verify OAuth2 token with Discord. Please try signing in again.');
        });
      return true;
    }
    return false;
  }

  // ------------------------------------------------------------------
  // On load: if already logged in, redirect straight to dashboard
  // ------------------------------------------------------------------
  function checkExistingSession() {
    // First check if we're handling an OAuth callback
    const isHandlingOAuth = handleOAuthCallback();
    if (isHandlingOAuth) return;

    // If user is already logged in, go to dashboard
    const savedUser = localStorage.getItem('discord_user');
    if (savedUser) {
      try {
        JSON.parse(savedUser); // validate JSON
        window.location.href = 'dashboard.html';
      } catch (e) {
        localStorage.removeItem('discord_user');
      }
    }
  }

  // ------------------------------------------------------------------
  // Event Listeners
  // ------------------------------------------------------------------

  // Discord OAuth — the only sign-in path
  if (discordLoginBtn) {
    discordLoginBtn.addEventListener('click', () => {
      if (!DISCORD_CLIENT_ID || DISCORD_CLIENT_ID === '') {
        alert('Discord login is not configured yet. The site owner needs to set DISCORD_CLIENT_ID in login.js.');
        return;
      }
      const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=token&scope=identify%20email`;
      window.location.href = authUrl;
    });
  }

  // Run session check
  checkExistingSession();
});
