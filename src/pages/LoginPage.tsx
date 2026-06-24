import FoodLoader from '../components/FoodLoader';
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { 
  Loader2, 
  AlertCircle, 
  TrendingUp,
  Eye,
  EyeOff
} from 'lucide-react';
import api from '../api/axios';
import './LoginPage.css';
import logo from '../assets/ANSOFTT_LOGO.png';
import centralKitchen from '../assets/kms_central_kitchen.png';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [settings, setSettings] = useState<any>({});
  
  const login = useAuthStore((state: any) => state.login);

  useEffect(() => {
    // Check for remembered username
    const savedUser = localStorage.getItem('remembered_user');
    if (savedUser) {
      setUsername(savedUser);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    const checkSettings = async () => {
      try {
        const res = await api.get('/business/settings');
        if (res.data.data) {
          setSettings(res.data.data);
          if (res.data.data.force_update === 'true') {
            setForceUpdate(true);
          }
        }
      } catch (err) {
        console.error('Settings check failed', err);
      }
    };
    
    checkSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forceUpdate) {
      setError('A critical update is required. Please update the application.');
      return;
    }

    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      if (rememberMe) {
        localStorage.setItem('remembered_user', username);
      } else {
        localStorage.removeItem('remembered_user');
      }

      const response = await api.post('/auth/login', {
        username,
        password
      });

      if (response.data.success) {
        const { admin, token } = response.data.data;
        login(admin, token);
      }
    } catch (err: any) {
      if (err.response?.data?.message === 'Business settings not initialized') {
        window.location.href = '/settings';
      } else {
        setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Left side: Branding & Visualization */}
        <div className="panel-branding" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', padding: '3rem', position: 'relative' }}>
          <img 
            src={centralKitchen} 
            alt="Central Kitchen Operations" 
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 1
            }} 
          />
          {/* Dark readable gradient overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to bottom, rgba(27, 70, 69, 0.4) 0%, rgba(18, 48, 47, 0.85) 100%)',
            zIndex: 2
          }}></div>

          <div className="promo-text" style={{ position: 'relative', zIndex: 3, textAlign: 'center', width: '100%' }}>
            <h3>Smarter way to manage</h3>
            <p>Welcome to <span style={{ fontFamily: "'Oleo Script', cursive" }}>KMS</span>. Efficiently track stock, manage sales, and optimize your entire ecosystem with ease.</p>
          </div>
        </div>

        {/* Right side: Form */}
        <div className="panel-form">
          <div className="top-nav">
            <div className="brand-mini">
              <img src={settings.company_logo || logo} alt="Logo" style={{ maxHeight: '80px', objectFit: 'contain' }} />
            </div>
          </div>

          <div className="login-content">
            <h2>Admin</h2>
            <p className="subtitle">Enterprise Resource Planning System</p>

            {error && (
              <div className="error-msg">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Username / Email</label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  placeholder="admin@kms.com"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="password-wrapper">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button 
                    type="button" 
                    className="password-toggle" 
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input 
                    type="checkbox" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)} 
                  />
                  <span className="checkbox-custom"></span>
                  <span>Remember me</span>
                </label>
                <a href="#" className="forgot-password">Forgot Password?</a>
              </div>

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? <FoodLoader size="icon" /> : 'Sign in to Hub'}
              </button>
            </form>
          </div>

          <footer className="login-footer">
             <span>Powered by <a href="https://www.ansoftt.com/" target="_blank" rel="noopener noreferrer" style={{color: 'inherit', textDecoration: 'none'}}><b>AN International</b></a></span>
            <span>v1.0.0</span>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
