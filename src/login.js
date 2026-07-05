import './login.css';
import { supabase } from './supabase.js';

async function redirectIfAlreadySignedIn() {
  var { data } = await supabase.auth.getSession();
  if (data.session) {
    window.location.href = '/';
  }
}

function setLoading(isLoading) {
  var btn = document.getElementById('login-submit-btn');
  if (btn) {
    btn.disabled = isLoading;
    btn.textContent = isLoading ? 'Signing In…' : 'Sign In';
  }
}

function showError(message) {
  var el = document.getElementById('login-error');
  if (el) { el.textContent = message; }
}

async function handleSubmit(e) {
  e.preventDefault();
  showError('');

  var email = document.getElementById('login-email').value.trim();
  var password = document.getElementById('login-password').value;

  setLoading(true);
  var { error } = await supabase.auth.signInWithPassword({ email: email, password: password });
  setLoading(false);

  if (error) {
    showError(error.message || 'Could not sign in. Check your email and password.');
    return;
  }

  window.location.href = '/';
}

document.addEventListener('DOMContentLoaded', function () {
  redirectIfAlreadySignedIn();
  var form = document.getElementById('login-form');
  if (form) { form.addEventListener('submit', handleSubmit); }
});