import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FluidLogo } from '../components/FluidLogo';
import { triggerHaptic } from '../utils/haptics';
import { encryptData } from '../utils/security';
import { useData } from '../context/DataContext';
import { getThemeDef } from '../utils/themes';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  
  const { data, logout, theme } = useData();
  const navigate = useNavigate();
  const isLoggedIn = !!sessionStorage.getItem('academia_id');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr('');

    try {
      if (!email.includes('@srmist.edu.in')) throw new Error("Invalid University Mail ID. Please use @srmist.edu.in");

      const response = await axios.post('/api/scrape', {
        regNo: email,
        password: password
      });

      // Valid session natively stored via Proxy endpoint inside Supabase.
      // 🛡️ Sentinel: Bypassing Supabase fetch fragility by directly projecting the API JSON 
      // payload into client memory natively allowing immediate instantaneous Dashboard builds!
      // Using sessionStorage and encryption to prevent cleartext storage and ensure data is wiped on tab close.
      sessionStorage.setItem('academia_id', response.data.academiaId);
      sessionStorage.setItem('academia_cache', encryptData(JSON.stringify(response.data.data)));
      window.location.href = '/dashboard';

    } catch (e: any) {
      console.error("Login failure", e);
      // Defensively parse nested error structures thrown natively by Vercel edge proxy timeouts
      let traceMsg = 'Authentication Failed';
      const rawError = e.response?.data?.error;
      
      if (typeof rawError === 'string') {
        traceMsg = rawError;
      } else if (rawError?.message) {
        traceMsg = rawError.message;
      } else if (e.message) {
        traceMsg = e.message;
      }

      setErr(traceMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Removed Ambient Static Bound entirely to match sleek architectural layouts */}

      {/* Huge Logo Hero Area modeled after the reference */}
      <motion.div 
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        style={{ zIndex: 10, textAlign: 'center', marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <div onClick={() => window.location.reload()} style={{ cursor: 'pointer', width: '100%', maxWidth: '440px', height: 'auto', aspectRatio: '400/120', margin: '0 auto', marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
          <FluidLogo />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: getThemeDef(theme).fontFamily || "var(--font-main)" }}>
             <span style={{ color: 'var(--accent-crimson)', fontWeight: 900, fontSize: 'var(--text-2xl)', letterSpacing: '-1px' }}>REVANCED</span>
             <span style={{ color: 'var(--text-main)', fontWeight: 900, fontSize: 'var(--text-2xl)', letterSpacing: '-1px' }}>ACADEMIA</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
        className="fluid-card"
        style={{
          padding: '40px',
          width: '100%',
          maxWidth: '440px',
          zIndex: 10,
          position: 'relative',
          background: 'var(--card-bg)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
        }}
      >

        {err && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="brutal-border"
            role="alert"
            style={{ 
              backgroundColor: '#ffe6e6', 
              color: 'var(--accent-primary)', 
              padding: '16px', 
              marginBottom: '24px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              fontWeight: 600
            }}
          >
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span style={{ fontSize: 'var(--text-sm)', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{err}</span>
          </motion.div>
        )}

        {isLoggedIn ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', textAlign: 'center' }}>
             <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(29, 199, 209, 0.1)', border: '2px solid var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', boxShadow: '0 10px 30px rgba(29, 199, 209, 0.2)' }}>
                <span style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, color: 'var(--accent-cyan)' }}>
                  {data?.user?.name?.charAt(0) || '?'}
                </span>
             </div>
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
               <h2 style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '0px' }}>
                 Welcome back,
               </h2>
               <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--accent-crimson)', letterSpacing: '1px' }}>
                 {data?.user?.name || sessionStorage.getItem('academia_id') || 'Student'}
               </h3>
             </div>
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginTop: '24px' }}>
               <motion.button 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { triggerHaptic(40); navigate('/dashboard'); }}
                  style={{
                    width: '100%', padding: '20px', borderRadius: '30px', fontSize: 'var(--text-sm)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', background: 'var(--text-main)', color: 'var(--bg-color)', border: 'none', boxShadow: '0 10px 30px rgba(255, 255, 255, 0.2)', cursor: 'pointer'
                  }}
               >
                  CONTINUE TO DASHBOARD <ArrowRight size={18} />
               </motion.button>
               
               <button 
                  onClick={() => { triggerHaptic(20); logout(); }}
                  style={{
                    width: '100%', padding: '16px', fontSize: 'var(--text-sm)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', transition: 'color 0.2s ease', marginTop: '8px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-crimson)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
               >
                  Disconnect Profile
               </button>
             </div>
          </div>
        ) : (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label htmlFor="email" style={{ display: 'block', fontWeight: 800, marginBottom: '8px', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)' }}>University ID</label>
              <input
                id="email"
                type="email"
                placeholder="netid@srmist.edu.in"
                value={email}
                maxLength={100}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: 'var(--text-sm)',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-main)',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'border 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-crimson)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                required
              />
            </div>

            <div>
              <label htmlFor="password" style={{ display: 'block', fontWeight: 800, marginBottom: '8px', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  maxLength={100}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    paddingRight: '56px',
                    fontSize: 'var(--text-sm)',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-main)',
                    borderRadius: '8px',
                    outline: 'none',
                    transition: 'border 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent-crimson)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', opacity: 0.5, display: 'flex', color: 'var(--text-main)', background: 'none', border: 'none' }}
                >
                   {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ marginTop: '16px' }}>
               <button
                  type="submit"
                  disabled={loading}
                  onClick={() => triggerHaptic(40)}
                  style={{
                    width: '100%',
                    padding: '20px',
                    borderRadius: '30px',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'linear-gradient(90deg, #FF2A5F, #d41b47)',
                    color: '#fff',
                    border: 'none',
                    boxShadow: '0 10px 30px rgba(255, 42, 95, 0.4)',
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
               >
                  {loading ? 'SYNCING PORTAL...' : 'AUTHENTICATE'}
                  {!loading && <ArrowRight size={20} />}
               </button>
            </motion.div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
