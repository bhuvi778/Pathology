import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FlaskConical, Eye, EyeOff, Lock, Mail } from 'lucide-react';

const LAB_BACKGROUND = 'https://images.unsplash.com/photo-1579165466741-7f35e4755660?auto=format&fit=crop&w=1600&q=80';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      console.log('Login submit returned user:', user);
      toast.success(`Welcome back, ${user.name}! Role: ${user.role}`);
      // Let the app-level role routing handle the destination
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: `url(${LAB_BACKGROUND})` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(2,6,23,0.92),rgba(15,23,42,0.78),rgba(8,47,73,0.62))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.12),transparent_28%)]" />

      <div className="relative z-10 min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center">
          <div className="grid w-full overflow-hidden rounded-[32px] border border-white/15 bg-white/10 shadow-[0_30px_80px_rgba(15,23,42,0.45)] backdrop-blur-sm lg:grid-cols-[1.15fr_0.85fr]">
            <section className="relative hidden min-h-[720px] overflow-hidden lg:flex">
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.05),rgba(15,23,42,0.7))]" />
              <div className="relative flex w-full flex-col justify-between p-10 xl:p-14">
                <div>
                  <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium tracking-[0.2em] text-slate-100 uppercase">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-primary-700 shadow-lg shadow-slate-900/20">
                      <FlaskConical className="h-5 w-5" />
                    </div>
                    PathLab
                  </div>
                  <div className="mt-14 max-w-xl">
                    <p className="text-sm font-medium uppercase tracking-[0.35em] text-sky-200/90">Diagnostic Operations</p>
                    <h1 className="mt-5 text-5xl font-semibold leading-tight text-white xl:text-6xl">
                      Modern access for a high-precision pathology workflow.
                    </h1>
                    <p className="mt-6 max-w-lg text-base leading-7 text-slate-200/90 xl:text-lg">
                      Secure sign-in for reporting, patient intake, billing, and lab coordination in one professional workspace.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { value: '24/7', label: 'Access control across lab roles' },
                    { value: 'Fast', label: 'Operational flow from sample to report' },
                    { value: 'Secure', label: 'Credential-based professional login' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                      <p className="text-2xl font-semibold text-white">{item.value}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-200/85">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="relative bg-white/95 p-6 sm:p-8 lg:p-10 xl:p-12">
              <div className="mx-auto flex h-full w-full max-w-md flex-col justify-center">
                <div className="mb-8 lg:hidden">
                  <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-900/20">
                      <FlaskConical className="h-5 w-5" />
                    </div>
                    PathLab
                  </div>
                </div>

                <div className="mb-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-700">Welcome Back</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Sign in to continue</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    Access the pathology lab management system with your assigned credentials.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="label text-slate-600">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        className="input-field rounded-2xl border-slate-200 bg-white/90 py-3 pl-11 pr-4 shadow-sm focus:border-primary-500"
                        placeholder="Enter your email"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label text-slate-600">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={form.password}
                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        className="input-field rounded-2xl border-slate-200 bg-white/90 py-3 pl-11 pr-11 shadow-sm focus:border-primary-500"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-base font-medium text-white transition-colors duration-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                        Signing In...
                      </span>
                    ) : 'Sign In'}
                  </button>
                </form>

                <p className="mt-8 text-center text-xs text-slate-500">
                  © 2024 PathLab Management System. All rights reserved.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
