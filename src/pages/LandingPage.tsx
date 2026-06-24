import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChefHat, 
  Layers, 
  TrendingUp, 
  Trash2, 
  Calendar, 
  CheckCircle, 
  X, 
  ArrowRight,
  ShieldCheck,
  Store,
  FileSpreadsheet
} from 'lucide-react';
import './LandingPage.css';
import logo from '../assets/ANSOFTT_LOGO.png';
import dashboardPreview from '../assets/kms_dashboard_preview.png';
import centralKitchen from '../assets/kms_central_kitchen.png';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    restaurant: '',
    phone: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    setDemoSubmitted(true);
    setTimeout(() => {
      // Auto close after 3 seconds
      // setIsDemoModalOpen(false);
    }, 3000);
  };

  const openDemoModal = () => {
    setDemoSubmitted(false);
    setFormData({ name: '', email: '', restaurant: '', phone: '', message: '' });
    setIsDemoModalOpen(true);
  };

  return (
    <div className="lp-container">
      {/* Navigation */}
      <header className="lp-header">
        <div className="lp-logo">
          <img src={logo} alt="ANSOFTT Logo" />
          <span>KMS</span>
        </div>
        <nav className="lp-nav">
          <a href="#features" className="lp-nav-link">Features</a>
          <a href="#about" className="lp-nav-link">About</a>
          <button className="lp-btn-login" onClick={() => navigate('/login')}>
            Sign In
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="lp-hero">
        <div className="lp-hero-content">
          <div className="lp-hero-tag">
            ✨ NEXT-GEN KITCHEN MANAGEMENT
          </div>
          <h1 className="lp-hero-title">
            Optimize Your Kitchen & <span>Control Costs</span>
          </h1>
          <p className="lp-hero-desc">
            A comprehensive Enterprise Resource Planning (ERP) platform built specifically for restaurants, central kitchens, and food franchise chains. Streamline inventory, track wastage, process POS sales, and gain real-time analytics.
          </p>
          <div className="lp-hero-actions">
            <button className="lp-btn-primary" onClick={() => navigate('/login')}>
              Go to Console <ArrowRight size={18} style={{ marginLeft: '8px', display: 'inline' }} />
            </button>
            <button className="lp-btn-secondary" onClick={openDemoModal}>
              Book Product Demo
            </button>
          </div>
        </div>

        <div className="lp-hero-preview">
          <img src={dashboardPreview} className="lp-hero-image" alt="KMS Dashboard Preview" />
          <div className="lp-floating-badge b-left">
            <ChefHat size={18} style={{ color: 'var(--lp-primary)' }} />
            <span style={{ fontSize: '13px', fontWeight: 700 }}>20+ Active Branches</span>
          </div>
          <div className="lp-floating-badge b-right">
            <ShieldCheck size={18} style={{ color: '#059669' }} strokeWidth={2.5} />
            <span style={{ fontSize: '13px', fontWeight: 700 }}>Real-Time Control</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="lp-features">
        <div className="lp-section-header">
          <h2 className="lp-section-title">Everything you need</h2>
          <p className="lp-section-desc">
            Powerful integrated modules to manage your daily food operations and supply chain without hassle.
          </p>
        </div>

        <div className="lp-features-grid">
          <div className="lp-feature-card">
            <div className="lp-feature-icon">
              <Layers size={24} />
            </div>
            <h3>Inventory & FIFO Stock</h3>
            <p>Track warehouse batches, raw material costs, auto-expiry notifications, and stock transfers across locations seamlessly.</p>
          </div>

          <div className="lp-feature-card">
            <div className="lp-feature-icon">
              <Store size={24} />
            </div>
            <h3>Multi-Branch & POS Registers</h3>
            <p>Setup counter registers, open/close cashier shifts, track drawer cash in hand, and manage branch custom pricing rules.</p>
          </div>

          <div className="lp-feature-card">
            <div className="lp-feature-icon">
              <Trash2 size={24} />
            </div>
            <h3>Wastage & Expiry Logs</h3>
            <p>Monitor raw ingredient food wastage, record reasons, track batch exipration, and automatically calculate food loss values.</p>
          </div>

          <div className="lp-feature-card">
            <div className="lp-feature-icon">
              <FileSpreadsheet size={24} />
            </div>
            <h3>P&L & Financial Reports</h3>
            <p>Generate detailed Profit and Loss statements, assets vs liabilities logs, vendor statements, and automated food cost reports.</p>
          </div>
        </div>
      </section>

      {/* Central Kitchen Showcase */}
      <section className="lp-showcase">
        <div className="lp-showcase-grid">
          <div className="lp-showcase-image-container">
            <img src={centralKitchen} className="lp-showcase-image" alt="Central Kitchen operations" />
          </div>
          <div className="lp-showcase-content">
            <div className="lp-hero-tag">
              🏭 CENTRALIZED PRODUCTION HUB
            </div>
            <h2 className="lp-showcase-title">
              Streamline Central Kitchen Operations
            </h2>
            <p className="lp-showcase-desc">
              Manage large scale recipe productions, food preparation logs, raw material distributions, and dispatch workflows. Automatically calculate ingredient costs, yields, and batch profit margins per recipe to maintain maximum production efficiency.
            </p>
            <ul className="lp-showcase-list" style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              <li style={{ display: 'flex', alignItems: 'center', fontWeight: 600, fontSize: '15px', color: 'var(--lp-text-light)' }}>
                <CheckCircle size={18} style={{ color: 'var(--lp-accent)', marginRight: '10px', flexShrink: 0 }} />
                FIFO Batch Inventory Costing
              </li>
              <li style={{ display: 'flex', alignItems: 'center', fontWeight: 600, fontSize: '15px', color: 'var(--lp-text-light)' }}>
                <CheckCircle size={18} style={{ color: 'var(--lp-accent)', marginRight: '10px', flexShrink: 0 }} />
                Auto distribution requests & stock transfers
              </li>
              <li style={{ display: 'flex', alignItems: 'center', fontWeight: 600, fontSize: '15px', color: 'var(--lp-text-light)' }}>
                <CheckCircle size={18} style={{ color: 'var(--lp-accent)', marginRight: '10px', flexShrink: 0 }} />
                Real-time central yield & cost estimation
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <p>&copy; {new Date().getFullYear()} ANSOFTT Kitchen Management System. All Rights Reserved. Powered by AN International.</p>
      </footer>

      {/* Book Demo Modal */}
      {isDemoModalOpen && (
        <div className="lp-modal-overlay">
          <div className="lp-modal">
            <button className="lp-modal-close" onClick={() => setIsDemoModalOpen(false)}>
              <X size={24} />
            </button>

            {!demoSubmitted ? (
              <>
                <h3>Book a Live Demo</h3>
                <p>Fill out the form below and our kitchen consultant will contact you within 24 hours.</p>
                <form onSubmit={handleDemoSubmit}>
                  <div className="lp-form-group">
                    <label>Your Name</label>
                    <input 
                      type="text" 
                      name="name" 
                      required 
                      className="lp-form-input" 
                      value={formData.name} 
                      onChange={handleInputChange} 
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div className="lp-form-group">
                    <label>Work Email</label>
                    <input 
                      type="email" 
                      name="email" 
                      required 
                      className="lp-form-input" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      placeholder="e.g. john@restaurant.com"
                    />
                  </div>
                  <div className="lp-form-group">
                    <label>Restaurant / Brand Name</label>
                    <input 
                      type="text" 
                      name="restaurant" 
                      required 
                      className="lp-form-input" 
                      value={formData.restaurant} 
                      onChange={handleInputChange} 
                      placeholder="e.g. Gourmet Burger Chain"
                    />
                  </div>
                  <div className="lp-form-group">
                    <label>Phone Number</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      required 
                      className="lp-form-input" 
                      value={formData.phone} 
                      onChange={handleInputChange} 
                      placeholder="e.g. +965-XXXXXXXX"
                    />
                  </div>
                  <div className="lp-form-group">
                    <label>Message (Optional)</label>
                    <textarea 
                      name="message" 
                      className="lp-form-input" 
                      rows={3}
                      value={formData.message} 
                      onChange={handleInputChange} 
                      placeholder="Tell us about your branches or central kitchen setup..."
                      style={{ resize: 'none' }}
                    />
                  </div>
                  <button type="submit" className="lp-btn-submit">
                    Schedule Live Demo
                  </button>
                </form>
              </>
            ) : (
              <div className="lp-success-state">
                <div className="lp-success-icon">
                  <CheckCircle size={40} />
                </div>
                <h3>Demo Request Received!</h3>
                <p>Thank you <strong>{formData.name}</strong>. We have scheduled your demo request for <strong>{formData.restaurant}</strong>. A product specialist will email you shortly at <strong>{formData.email}</strong> to set up a Zoom meeting.</p>
                <button className="lp-btn-submit" onClick={() => setIsDemoModalOpen(false)}>
                  Close Window
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
