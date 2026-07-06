import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) { navigate('/', { replace: true }); }
    });
  }, [navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);

    if (signInError) {
      setError(signInError.message || 'Could not sign in. Check your email and password.');
      return;
    }

    navigate('/', { replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-bg text-text font-sans">
      <div className="bg-white border border-border rounded-2xl w-[380px] max-w-full px-9 py-10 shadow-[0_12px_40px_rgba(20,34,74,0.08)]">
        <div className="flex items-center gap-[9px] justify-center font-heading text-[20px] tracking-[0.1em] text-sidebar mb-[6px]">
          <div className="w-[10px] h-[10px] bg-accent rounded-full" />
          <span>CAREFORALL</span>
        </div>
        <div className="text-center text-[13px] text-muted mb-[30px]">Admin Portal</div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="login-email" className="block text-[11px] font-bold text-muted uppercase tracking-[0.05em] mb-[6px]">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-[13px] py-[11px] border border-border rounded-lg text-[14px] font-sans text-text bg-bg outline-none transition-colors duration-150 focus:border-brand focus:bg-white"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="login-password" className="block text-[11px] font-bold text-muted uppercase tracking-[0.05em] mb-[6px]">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-[13px] py-[11px] border border-border rounded-lg text-[14px] font-sans text-text bg-bg outline-none transition-colors duration-150 focus:border-brand focus:bg-white"
            />
          </div>
          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand text-white border-none rounded-lg text-[14px] font-bold font-sans cursor-pointer mt-[6px] transition-colors duration-150 enabled:hover:bg-brand-dark disabled:opacity-70 disabled:cursor-default"
          >
            {loading ? 'Signing In…' : 'Sign In'}
          </button>
          <div className="text-danger-dark text-[12.5px] mt-3 text-center min-h-[16px]">{error}</div>
        </form>
      </div>
    </div>
  );
}
