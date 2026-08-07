import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/storeHooks';
import { setAuthStart, setAuthSuccess, setAuthFailure } from '../features/auth/authSlice';
import axiosInstance from '../api/axiosInstance';

type Mode = 'login' | 'register';

const AuthPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error: authError } = useAppSelector((state) => state.auth);

  const [mode, setMode] = useState<Mode>('login');

  // Shared fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobileNumber, setMobileNumber] = useState('')
  // Register-only fields
  const [name, setName] = useState('');
  const [title, setTitle] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [confirmPassword, setConfirmPassword] = useState('');

  const switchMode = (next: Mode) => {
    dispatch(setAuthFailure('')); // clear stale errors when switching tabs
    setMode(next);
  };

  const handleSubmit = async(e: FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      dispatch(setAuthFailure('Please fill in all required fields.'));
      return;
    }

    if (mode === 'register') {
      if (!name) {
        dispatch(setAuthFailure('Please tell us your name.'));
        return;
      }
      if (mode === 'register' && password !== confirmPassword) {
        dispatch(setAuthFailure('Passwords do not match.'));
        return;
      }

      if (!mobileNumber) {
        dispatch(setAuthFailure('Please tell us your mobile number.'));
        return;
      }

      if (!title) {
        dispatch(setAuthFailure('Please tell us your title.'));
        return;
      }

      if (!companyName) {
        dispatch(setAuthFailure('Please tell us your company name.'));
        return;
      }
    }

    dispatch(setAuthStart());

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload = mode === 'login' ?
      {email , password}:
      {name, email , mobileNumber: Number(mobileNumber), title, companyName, password, role : "owner"}

      const response = await axiosInstance.post(endpoint, payload)
      console.log("responce", response);
      
      dispatch(setAuthSuccess(response.data))
      navigate("/dashboard")

    } catch (error: any) {
      // 5. Error Handling
      const errorMessage = error.response?.data?.message || 'Authentication failed. Please try again.';
      dispatch(setAuthFailure(errorMessage));
    }
  }



return (
  <div className="h-screen bg-bg text-text grid md:grid-cols-2 overflow-hidden">
    {/* ---------- Left: brand panel ---------- */}
    <div className="hidden md:flex flex-col justify-between border-r border-border p-10 overflow-y-auto">
      <div className="flex items-center gap-2.5">
        <span className="w-2 h-2 rounded-full bg-accent" />
        <span className="font-semibold text-base text-text-h">SyncBoard</span>
      </div>

      <div className="max-w-sm">
        <h1 className="text-text-h font-semibold text-3xl leading-tight mb-4">
          Built for teams who decided heavy tools weren't worth it.
        </h1>
        <p className="text-text/70 text-sm leading-relaxed">
          One workspace. Clear roles. Boards that sync the moment
          someone moves a issue — no refresh, no setup weeks.
        </p>
      </div>

      <div className="border border-border rounded-lg p-4">
        <p className="font-mono text-xs text-text/60 mb-3 uppercase tracking-wide">
          Sprint 12 / Workspace board
        </p>
        <div className="space-y-2">
          {['Design review', 'Auth flow', 'Release notes'].map((item) => (
            <div key={item} className="text-sm px-3 py-2 rounded-md border border-border bg-accent-bg">
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* ---------- Right: form panel ---------- */}
    <div className="h-full overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm">
          {/* Mode tabs */}
          <div className="flex border border-border rounded-md p-1 mb-8">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 text-sm font-medium py-2 rounded-sm transition-colors ${mode === 'login' ? 'bg-accent text-bg' : 'text-text/70 hover:text-text-h'
                }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 text-sm font-medium py-2 rounded-sm transition-colors ${mode === 'register' ? 'bg-accent text-bg' : 'text-text/70 hover:text-text-h'
                }`}
            >
              Create account
            </button>
          </div>

          <h2 className="text-text-h font-semibold text-2xl mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create your workspace'}
          </h2>
          <p className="text-text/70 text-sm mb-8">
            {mode === 'login'
              ? 'Sign in to pick up where your team left off.'
              : 'Set up your account in under a minute.'}
          </p>

          {authError && (
            <div className="rounded-md border border-border bg-accent-bg p-3 text-sm text-text mb-6">
              {authError}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-text/70 mb-1.5">
                  Full name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md bg-bg border border-border p-3 text-sm text-text placeholder-text/40 focus:outline-none focus:border-accent transition-colors"
                  placeholder="Vaibhav Sharma"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-text/70 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md bg-bg border border-border p-3 text-sm text-text placeholder-text/40 focus:outline-none focus:border-accent transition-colors"
                placeholder="you@company.com"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-text/70 mb-1.5">
                  Mobile number
                </label>
                <input
                  type="number"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full rounded-md bg-bg border border-border p-3 text-sm text-text placeholder-text/40 focus:outline-none focus:border-accent transition-colors"
                  placeholder="+91 80******93"
                />
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-text/70 mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-md bg-bg border border-border p-3 text-sm text-text placeholder-text/40 focus:outline-none focus:border-accent transition-colors"
                  placeholder="CEO"
                />
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-text/70 mb-1.5">
                  Company name
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-md bg-bg border border-border p-3 text-sm text-text placeholder-text/40 focus:outline-none focus:border-accent transition-colors"
                  placeholder="Sync-board Pro"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-text/70 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md bg-bg border border-border p-3 text-sm text-text placeholder-text/40 focus:outline-none focus:border-accent transition-colors"
                placeholder="••••••••"
              />
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-text/70 mb-1.5">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-md bg-bg border border-border p-3 text-sm text-text placeholder-text/40 focus:outline-none focus:border-accent transition-colors"
                    placeholder="••••••••"
                  />
                </div>


              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-accent text-bg font-medium py-3 text-sm hover:opacity-85 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : mode === 'login' ? (
                'Sign in'
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-text/60 mt-6">
            {mode === 'login' ? (
              <>
                Don't have a workspace?{' '}
                <button onClick={() => switchMode('register')} className="text-accent font-medium hover:underline">
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button onClick={() => switchMode('login')} className="text-accent font-medium hover:underline">
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  </div>
);
};

export default AuthPage;