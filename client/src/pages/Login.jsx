import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FlaskConical, Eye, EyeOff, Lock, Mail } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <FlaskConical className="w-9 h-9 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-white">PathLab</h1>
          <p className="text-primary-200 mt-1">Pathology Lab Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-1">Sign In</h2>
          <p className="text-sm text-slate-500 mb-6">Enter your credentials to access the system</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input-field pl-10"
                  placeholder="Enter your email"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input-field pl-10 pr-10"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-base">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Signing In...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs text-slate-500 text-center mb-3 font-medium">Demo Credentials</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { role: 'Admin', email: 'admin@dhanvantarilab.in', pass: 'Admin@2026' },
                { role: 'Reception', email: 'reception@dhanvantarilab.in', pass: 'Reception@2026' },
                { role: 'Dr. Rajesh', email: 'dr.rajesh@dhanvantarilab.in', pass: 'Rajesh@2026' },
                { role: 'Dr. Priya', email: 'dr.priya@dhanvantarilab.in', pass: 'Priya@2026' },
              ].map(cred => (
                <button
                  key={cred.role}
                  type="button"
                  onClick={() => setForm({ email: cred.email, password: cred.pass })}
                  className="p-2 rounded-lg border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-center"
                >
                  <p className="font-semibold text-slate-700">{cred.role}</p>
                  <p className="text-slate-400 truncate">{cred.email}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-primary-300 text-xs mt-6">
          © 2024 PathLab Management System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
