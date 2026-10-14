/* Supabase browser authentication. The publishable key is intended for client use. */
var AUTH_SUPABASE_URL = 'https://uowxoiuyviwhlsvrmbbp.supabase.co';
var AUTH_SUPABASE_KEY = 'sb_publishable_jQeeEO35my8R_9-Tkq9qdg_WUwDme3M';
var authClient = window.supabase
  ? window.supabase.createClient(AUTH_SUPABASE_URL, AUTH_SUPABASE_KEY, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true
      }
    })
  : null;
var _authUserId = null;

function getAuthRedirectUrl() {
  return window.location.origin + window.location.pathname;
}

function applyAuthUser(user, showWelcome) {
  if (!user) return;
  var previousUser = GS.user;
  var metadata = user.user_metadata || {};
  var name = metadata.display_name || metadata.full_name || metadata.name
    || (user.email ? user.email.split('@')[0] : 'Người chơi');
  var sameUser = previousUser && previousUser.id === user.id;

  GS.user = {
    id: user.id,
    email: user.email || '',
    name: name,
    accountName: sameUser && previousUser.accountName
      ? previousUser.accountName
      : name,
    avatar: sameUser ? previousUser.avatar : undefined,
    avatarType: sameUser ? previousUser.avatarType : undefined,
    avatarData: sameUser ? previousUser.avatarData : undefined,
    provider: user.app_metadata && user.app_metadata.provider
  };
  _authUserId = user.id;
  saveState();

  if (!document.getElementById('screen-ar').classList.contains('active')) {
    showScreen('screen-ar');
  } else {
    updateHUD();
  }

  if (showWelcome) {
    showToast('Đăng nhập thành công! Chào ' + getAccountName() + '!', 3000);
    setTimeout(showCompassPrompt, 500);
  }
}

function initAuth() {
  if (!authClient) {
    console.error('Không tải được Supabase Auth SDK.');
    showToast('Không tải được dịch vụ đăng nhập. Hãy kiểm tra kết nối mạng và tải lại trang.', 5000);
    return;
  }

  authClient.auth.onAuthStateChange(function(event, session) {
    if (session && session.user) {
      var isNewLogin = event === 'SIGNED_IN' && _authUserId !== session.user.id;
      applyAuthUser(session.user, isNewLogin);
    } else if (event === 'SIGNED_OUT') {
      _authUserId = null;
      GS.user = null;
      saveState();
      if (!document.getElementById('screen-login').classList.contains('active')) {
        showScreen('screen-login');
      }
    }
  });

  authClient.auth.getSession().then(function(result) {
    if (result.error) {
      console.error('Không thể đọc phiên Supabase:', result.error.message);
      showToast('Không thể khôi phục phiên đăng nhập: ' + result.error.message, 5000);
      return;
    }
    if (result.data.session) applyAuthUser(result.data.session.user, false);
  }).catch(function(error) {
    console.error('Không thể khôi phục phiên Supabase:', error);
    showToast('Không thể khôi phục phiên đăng nhập. Hãy tải lại trang.', 5000);
  });
}

function setAuthButtonsDisabled(disabled) {
  var buttons = document.querySelectorAll('#screen-login button');
  for (var i = 0; i < buttons.length; i++) buttons[i].disabled = disabled;
}

function showAuthError(prefix, error) {
  var message = error && error.message ? error.message : 'Lỗi không xác định';
  console.error(prefix + ':', error);
  showToast(prefix + ': ' + message, 5000);
}
