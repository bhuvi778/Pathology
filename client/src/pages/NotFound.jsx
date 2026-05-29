import { Link } from 'react-router-dom';
import { Home, FlaskConical } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <FlaskConical className="w-16 h-16 text-primary-300 mx-auto mb-4" />
        <h1 className="text-6xl font-bold text-slate-200 mb-4">404</h1>
        <p className="text-xl font-semibold text-slate-700 mb-2">Page Not Found</p>
        <p className="text-slate-500 mb-8">The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <Home className="w-4 h-4" /> Go Home
        </Link>
      </div>
    </div>
  );
}
