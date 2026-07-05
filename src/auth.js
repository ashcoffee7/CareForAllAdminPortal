import { supabase } from './supabase.js';

export async function loadCurrentAdmin() {
  var user;
  try {
    var result = await supabase.auth.getUser();
    user = result.data.user;
  } catch (authErr) {
    // No active session yet — normal until a sign-in flow exists.
    // Leave the sidebar/topbar placeholder text as-is rather than crashing.
    console.warn('No active Supabase session yet:', authErr.message);
    return;
  }

  if (!user) { return; }

  var { data: profile, error } = await supabase
    .from('profiles')
    .select('first_name, last_name, role')
    .eq('id', user.id)
    .single();

  if (error || !profile) { console.error(error); return; }

  var fullName = (profile.first_name || '') + ' ' + (profile.last_name || '');
  var initial = (profile.first_name || 'A').charAt(0).toUpperCase();

  var nameEls = [document.getElementById('sidebar-user-name'), document.getElementById('topbar-user-name')];
  nameEls.forEach(function (el) { if (el) { el.textContent = fullName.trim(); } });

  var avatarEl = document.getElementById('sidebar-user-avatar');
  if (avatarEl) { avatarEl.textContent = initial; }
}