import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, AlertCircle, ArrowRight, ShieldCheck, X, Key, Users, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchJsonSafely } from '../utils/api';
import { Logo } from '../components/common/Logo';

declare global {
  interface Window {
    google?: any;
  }
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  // Google OAuth Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [customClientIdInput, setCustomClientIdInput] = useState(() => localStorage.getItem('custom_google_client_id') || '');
  const [googleModalTab, setGoogleModalTab] = useState<'oauth' | 'email'>('oauth');
  const [googleModalError, setGoogleModalError] = useState<string | null>(null);

  // Check URL query parameters for OAuth & SSO callback results
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const tokenParam = searchParams.get('token') || searchParams.get('sso_token');
    const userParam = searchParams.get('user');
    const redirectParam = searchParams.get('redirect');
    const emailParam = searchParams.get('email') || searchParams.get('email_id');

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    } else if (tokenParam && userParam) {
      try {
        const userObj = JSON.parse(decodeURIComponent(userParam));
        login(tokenParam, userObj);
        if (redirectParam) {
          navigate(redirectParam);
        } else {
          navigate(userObj.role === 'ADMIN' ? '/admin' : '/dashboard');
        }
      } catch (err) {
        setError('Failed to process sign-in response.');
      }
    } else if (tokenParam || emailParam) {
      // Returning directly from SSO with token or email parameter
      const identifier = tokenParam || emailParam;
      setSubmitting(true);
      fetchJsonSafely(`/api/user-by-email?email=${encodeURIComponent(identifier!)}`)
        .then((res) => {
          if (res.ok && res.data?.token && (res.data?.user || res.data?.id)) {
            const userData = res.data.user || res.data;
            login(res.data.token, userData);
            if (redirectParam) {
              navigate(redirectParam);
            } else {
              navigate(userData.role === 'ADMIN' ? '/admin' : '/dashboard');
            }
          } else {
            setError(res.data?.error || 'Could not verify alumni session from SSO.');
          }
        })
        .catch(() => {
          setError('Network error verifying SSO credentials.');
        })
        .finally(() => {
          setSubmitting(false);
        });
    }
  }, [searchParams, login, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const redirectAfterLogin = (role?: string) => {
    const redirectParam = searchParams.get('redirect');
    if (redirectParam) {
      navigate(redirectParam);
    } else if (role === 'ADMIN') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please enter your email address and password.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetchJsonSafely('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (res.ok && res.data?.token && res.data?.user) {
        login(res.data.token, res.data.user);
        redirectAfterLogin(res.data.user.role);
        return;
      }

      if (res.data?.error) {
        setError(res.data.error);
        return;
      }

      setError('Unable to connect to backend server. Please ensure the backend is running.');
    } catch (err) {
      setError('Network connection error. Please ensure the backend server is running.');
    } finally {
      setSubmitting(false);
    }
  };

  const loadGoogleIdentityScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts) {
        return resolve();
      }
      const existingScript = document.getElementById('google-jssdk');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        return;
      }
      const script = document.createElement('script');
      script.id = 'google-jssdk';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.body.appendChild(script);
    });
  };

  const triggerOAuthPopup = (clientId: string) => {
    if (!window.google?.accounts?.oauth2) {
      // Direct full-page OAuth redirect fallback
      window.location.href = '/api/auth/google?redirect=true';
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            if (tokenResponse.error === 'popup_closed_by_user') {
              setError('Google sign-in was cancelled.');
            } else {
              setError('Unable to sign in with Google OAuth popup. Trying standard Google sign-in...');
              setTimeout(() => {
                window.location.href = '/api/auth/google?redirect=true';
              }, 800);
            }
            setGoogleSubmitting(false);
            return;
          }

          try {
            const res = await fetchJsonSafely('/api/auth/google', {
              method: 'POST',
              body: JSON.stringify({ accessToken: tokenResponse.access_token })
            });

            if (res.ok && res.data?.token && res.data?.user) {
              login(res.data.token, res.data.user);
              redirectAfterLogin(res.data.user.role);
            } else {
              setError(res.data?.error || 'Unable to sign in with Google OAuth. Please try again.');
            }
          } catch (err) {
            setError('Network error. Please check your connection and try again.');
          } finally {
            setGoogleSubmitting(false);
          }
        }
      });
      client.requestAccessToken();
    } catch (popupErr) {
      console.warn('Google popup client initialization error, falling back to redirect flow:', popupErr);
      window.location.href = '/api/auth/google?redirect=true';
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleSubmitting(true);

    try {
      await loadGoogleIdentityScript().catch(() => {});

      let googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || customClientIdInput;

      if (!googleClientId) {
        try {
          const configRes = await fetchJsonSafely('/api/auth/google');
          if (configRes.ok && configRes.data?.clientId) {
            googleClientId = configRes.data.clientId;
          }
        } catch (e) {
          // ignore error
        }
      }

      if (googleClientId) {
        triggerOAuthPopup(googleClientId);
        return;
      }

      setGoogleSubmitting(false);
      setShowGoogleModal(true);

    } catch (err) {
      setGoogleSubmitting(false);
      setShowGoogleModal(true);
    }
  };

  const handleCustomClientIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customClientIdInput.trim()) {
      setGoogleModalError('Please enter your Google OAuth Client ID.');
      return;
    }

    localStorage.setItem('custom_google_client_id', customClientIdInput.trim());
    setShowGoogleModal(false);
    setGoogleSubmitting(true);

    await loadGoogleIdentityScript().catch(() => {});
    triggerOAuthPopup(customClientIdInput.trim());
  };

  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmailInput || !googleEmailInput.includes('@')) {
      setGoogleModalError('Please enter a valid Google email address.');
      return;
    }

    setGoogleModalError(null);
    setGoogleSubmitting(true);

    try {
      const res = await fetchJsonSafely('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ email: googleEmailInput.trim() })
      });

      if (res.ok && res.data?.token && res.data?.user) {
        setShowGoogleModal(false);
        login(res.data.token, res.data.user);
        redirectAfterLogin(res.data.user.role);
      } else {
        setGoogleModalError(res.data?.error || 'Unable to sign in with Google email.');
      }
    } catch (err) {
      setGoogleModalError('Network error during Google authentication.');
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const fillAdminCredentials = () => {
    setFormData({ email: 'admin@successstory.com', password: 'admin123' });
  };

  const fillUserCredentials = () => {
    setFormData({ email: 'user@successstory.com', password: 'user123' });
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4">
      {/* Centered Modal-Style Card */}
      <div className="max-w-md w-full bg-white rounded-xl shadow-[0_10px_35px_rgba(124,58,237,0.06)] border border-slate-200 p-8 sm:p-9 relative">
        
        {/* Top Header & Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-2 rounded-lg bg-slate-50 border border-slate-200 mb-3">
            <Logo size={44} useImage={true} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Login
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            National Engineering College Alumni Portal
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-5 p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* SSO Progress Notification */}
        {submitting && (searchParams.get('token') || searchParams.get('sso_token') || searchParams.get('email')) && (
          <div className="mb-5 p-3 rounded-md bg-purple-50 border border-purple-200 text-primary text-xs font-semibold flex items-center gap-2.5 animate-pulse">
            <GraduationCap className="w-4 h-4 shrink-0 text-primary" />
            <span>Verifying NEC Alumni Portal Single Sign-On session...</span>
          </div>
        )}

        {/* Official NEC Alumni Portal SSO Link */}
        <div className="mb-5">
          <a
            href="https://alumni.nec.edu.in/sso/auth/pmGbbv39yFwZfOB6/aHR0cHM6Ly9uZWNhbHVtbmkubmVjLmVkdS5pbi9hcGkvc3Rvcmllcy9zc28="
            className="w-full py-3 px-3.5 bg-gradient-to-r from-purple-900 via-primary to-purple-800 hover:from-purple-950 hover:to-primary text-white font-semibold text-xs tracking-wide rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group border border-purple-700/30"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-amber-300 border border-white/20 shrink-0">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-bold text-xs text-white flex items-center gap-1.5">
                  <span>Sign in with NEC Alumni Portal</span>
                  <span className="text-[9px] bg-amber-400 text-slate-900 font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    SSO
                  </span>
                </div>
                <div className="text-[10px] text-purple-200 font-normal">
                  Login directly via alumni.nec.edu.in
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-purple-200 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </a>
        </div>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            OR LOGIN WITH EMAIL
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Address */}
          <div>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                name="email"
                required
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-12 py-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary text-xs font-semibold cursor-pointer transition-colors"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Remember Me & Help Link */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
              />
              <span>Remember me</span>
            </label>
            <a
              href="mailto:alumni@nec.edu.in?subject=Password%20Reset%20Assistance"
              className="text-primary hover:text-primary-hover hover:underline font-medium"
            >
              Forgot password?
            </a>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={submitting || googleSubmitting}
            className="w-full py-2.5 px-4 bg-primary hover:bg-primary-hover active:scale-[0.99] text-white font-semibold text-xs tracking-wide rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            <span>{submitting ? 'Verifying Credentials...' : 'Login Now'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            OR
          </div>
        </div>

        {/* Google OAuth Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleSubmitting || submitting}
          aria-label="Continue with Google"
          className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs border border-slate-200 rounded-lg shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 hover:border-slate-300"
        >
          {googleSubmitting ? (
            <span className="text-xs text-slate-500">Authenticating via Google...</span>
          ) : (
            <>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="font-semibold text-xs">Continue with Google</span>
            </>
          )}
        </button>

        {/* Quick Test Demo Logins */}
        <div className="mt-5 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Quick Test Logins
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={fillAdminCredentials}
              className="px-2.5 py-1.5 bg-primary-soft hover:bg-primary-light text-primary rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer border border-purple-200 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>Fill Admin</span>
            </button>
            <button
              type="button"
              onClick={fillUserCredentials}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-600 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Fill User</span>
            </button>
          </div>

          {/* Registration Footer */}
          <div className="mt-5 text-center text-xs text-slate-500">
            Not a member?{' '}
            <Link to="/register" className="text-primary font-bold hover:underline">
              Signup Now
            </Link>
          </div>
        </div>

      </div>



      {/* GOOGLE OAUTH & EMAIL LOGIN MODAL */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-slate-200 relative space-y-4">
            <button
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 p-1 rounded text-slate-400 hover:text-primary hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <h3 className="font-bold text-base text-slate-900 leading-tight">Google Sign-In Options</h3>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => { setGoogleModalTab('oauth'); setGoogleModalError(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  googleModalTab === 'oauth' ? 'bg-white text-primary shadow-xs' : 'text-slate-500 hover:text-primary'
                }`}
              >
                OAuth 2.0
              </button>
              <button
                type="button"
                onClick={() => { setGoogleModalTab('email'); setGoogleModalError(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  googleModalTab === 'email' ? 'bg-white text-primary shadow-xs' : 'text-slate-500 hover:text-primary'
                }`}
              >
                Google Email
              </button>
            </div>

            {googleModalError && (
              <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{googleModalError}</span>
              </div>
            )}

            {/* TAB 1: Google OAuth 2.0 Client ID */}
            {googleModalTab === 'oauth' && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setGoogleSubmitting(true);
                    window.location.href = '/api/auth/google?redirect=true';
                  }}
                  className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Sign In via Official Google OAuth (Redirect)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="relative my-2 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative bg-white px-2 text-[10px] font-bold text-slate-400 uppercase">
                    OR CUSTOM CLIENT ID
                  </div>
                </div>

                <form onSubmit={handleCustomClientIdSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-900 mb-1">
                      Custom Google OAuth Client ID
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-primary absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="123456789-abc.apps.googleusercontent.com"
                        value={customClientIdInput}
                        onChange={(e) => setCustomClientIdInput(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={googleSubmitting}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-2xs"
                  >
                    <span>{googleSubmitting ? 'Opening...' : 'Connect with Custom Client ID'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: Google Email Login */}
            {googleModalTab === 'email' && (
              <form onSubmit={handleGoogleEmailSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-1">
                    Google Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-primary absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="yourname@gmail.com"
                      value={googleEmailInput}
                      onChange={(e) => setGoogleEmailInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={googleSubmitting}
                  className="w-full py-2 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-2xs"
                >
                  <span>{googleSubmitting ? 'Authenticating...' : 'Sign in with Google Email'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};


