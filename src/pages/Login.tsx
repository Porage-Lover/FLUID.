import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { FluidLogo } from '../components/FluidLogo';
import { triggerHaptic } from '../utils/haptics';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

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
      // 🛡️ Sentinel: Store the securely hashed academiaId to prevent IDOR vulnerabilities.
      // We bind the global reference ID and force a structural reload to trigger `DataContext` fetching.
      localStorage.setItem('academia_id', response.data.academiaId);
      window.location.href = '/dashboard';

    } catch (e: any) {
      console.error("Login failure", e);
      // Surface raw scraper trace correctly
      const traceMsg = e.response?.data?.error || e.message || 'Authentication Failed';
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
      
      {/* Background Ambience (Wave handles rendering globally) */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at center 40%, rgba(255, 42, 95, 0.05), transparent 70%)', zIndex: 0 }} />

      {/* Huge Logo Hero Area modeled after the reference */}
      <motion.div 
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        style={{ zIndex: 10, textAlign: 'center', marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <div style={{ width: '100%', maxWidth: '440px', height: 'auto', aspectRatio: '400/120', margin: '0 auto', marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
          <FluidLogo />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: "'Montserrat', sans-serif" }}>
             <span style={{ color: 'var(--accent-crimson)', fontWeight: 900, fontSize: '26px', letterSpacing: '-1px' }}>REVANCED</span>
             <span style={{ color: 'var(--text-main)', fontWeight: 900, fontSize: '26px', letterSpacing: '-1px' }}>ACADEMIA</span>
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
            <span style={{ fontSize: '14px', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{err}</span>
          </motion.div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label htmlFor="email" style={{ display: 'block', fontWeight: 800, marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)' }}>University ID</label>
            <input
              id="email"
              type="email"
              placeholder="netid@srmist.edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '15px',
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
            <label htmlFor="password" style={{ display: 'block', fontWeight: 800, marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px',
                  paddingRight: '56px',
                  fontSize: '15px',
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
                  fontSize: '15px',
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
      </motion.div>
    </div>
  );
}
