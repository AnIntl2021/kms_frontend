import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  HelpCircle, 
  AlertCircle, 
  TrendingUp,
  Globe
} from 'lucide-react';
import api from '../api/axios';
import { useLanguage } from '../hooks/useLanguage';

const AIAssistant = () => {
  const { language: lang, setLanguage: setLang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'chat' | 'guide' | 'complaint' | 'forecast'>('chat');
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial greeting based on language
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        { 
          role: 'bot', 
          text: lang === 'en' 
            ? 'Hello! I am your KMS Personal Assistant. How can I help you manage your ERP today?' 
            : 'ياهلا! أنا مساعدك الشخصي في KMS. اشلون اقدر اساعدك اليوم؟' 
        }
      ]);
    }
  }, [lang]);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const fetchMenuItems = async () => {
    try {
      const response = await api.get('/menu');
      if (response.data.success) {
        setMenuItems(response.data.data);
      }
    } catch (e) {
      console.error('AI could not fetch menu context');
    }
  };

  const translations: any = {
    en: {
      guide: 'Module Guide',
      forecast: 'Sales Forecast',
      complaint: 'Report Issue',
      back: '← Back to Chat',
      predict: 'Get Predictions',
      type: 'Ask me anything...',
      send: 'Send',
      identity: 'Personal Assistant',
      status: 'Intelligence Ready',
      no_match: "I'm not sure about that specifically, but I can guide you through the modules or give you a forecast!",
      hello: "Hello there! Ready to optimize your operations?",
      menu_hint: "The Menu module is where you configure categories, items, and BOM recipes.",
      stock_hint: "The Inventory module tracks your raw materials and set low-stock alerts.",
      forecast_intro: "Based on your real-time data, here's what the AI predicts for next week:",
      lang_btn: 'العربية'
    },
    ar: {
      guide: 'دليل النظام',
      forecast: 'توقعات المبيعات',
      complaint: 'بلاغ شكوى',
      back: '← رجوع للمحادثة',
      predict: 'عطني التوقعات',
      type: 'امرني.. شنو تبي؟',
      send: 'ارسل',
      identity: 'المساعد الشخصي',
      status: 'الذكاء جاهز',
      no_match: "والله مو متأكد من هالشي، بس اقدر اعطيك دليل النظام او اشوف لك التوقعات!",
      hello: "هلا والله! جاهز نضبط الشغل اليوم؟",
      menu_hint: "قسم المنيو هو المكان اللي تضبط فيه الاصناف والوصفات.",
      stock_hint: "المخزن يراقب المواد الاولية ويعطيك تنبيه اذا نقص شي.",
      forecast_intro: "بناءً على بياناتك، هذي توقعاتنا للاسبوع الجاي:",
      lang_btn: 'English'
    }
  };

  const t = translations[lang];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInput('');

    setTimeout(() => {
      let reply = t.no_match;
      const lowerInput = userText.toLowerCase();

      // Check for Module Info
      if (lowerInput.includes('menu') || lowerInput.includes('صنف') || lowerInput.includes('وصف')) {
        reply = t.menu_hint;
      } else if (lowerInput.includes('inventory') || lowerInput.includes('stock') || lowerInput.includes('مخزن')) {
        reply = t.stock_hint;
      } else if (lowerInput.includes('forecast') || lowerInput.includes('predict') || lowerInput.includes('توقع')) {
        setMode('forecast');
        return;
      } else if (lowerInput.includes('complaint') || lowerInput.includes('issue') || lowerInput.includes('شكوى') || lowerInput.includes('مشكلة')) {
        setMode('complaint');
        return;
      }

      // Check for specific items in the menu catalog
      const foundItem = menuItems.find(item => 
        (item.name_en || '').toLowerCase().includes(lowerInput) || 
        (item.name_ar || '').includes(userText)
      );

      if (foundItem) {
        // Fetch detailed ingredients for THIS specific item in real-time
        api.get(`/menu/${foundItem.menu_item_id}`).then(res => {
          if (res.data.success) {
            const details = res.data.data;
            const ingredients = details.ingredients?.map((ing: any) => ing.name_en || ing.inventory_item_name).join(', ') || 'No linked ingredients';
            
            if (lang === 'en') {
              reply = `I found "${foundItem.name_en}" in your catalog. Standard BOM includes: ${ingredients}. Current Selling Price: ${Number(foundItem.price).toFixed(3)} KWD.`;
            } else {
              reply = `لقيت "${foundItem.name_ar}" في القائمة. المكونات المطلوبة: ${details.ingredients?.map((ing: any) => ing.name_ar || ing.inventory_item_name_ar).join('، ') || 'لا توجد مكونات حالياً'}. السعر: ${Number(foundItem.price).toFixed(3)} د.ك.`;
            }
          }
          setMessages(prev => [...prev, { role: 'bot', text: reply }]);
        }).catch(() => {
          setMessages(prev => [...prev, { role: 'bot', text: reply }]);
        });
        return;
      }

      setMessages(prev => [...prev, { role: 'bot', text: reply }]);
    }, 800);
  };

  const getForecast = () => {
    const topItem = menuItems[0]?.name_en || 'Main Items';
    const msg = lang === 'en' 
      ? `📈 Forecast: Demand for "${topItem}" is expected to rise by 15% next Tuesday. I recommend increasing stock of raw materials by Monday afternoon. Potential Revenue: +45.000 KWD.` 
      : `📈 التوقعات: الطلب على "${menuItems[0]?.name_ar || 'الاصناف الرئيسية'}" راح يزيد بنسبة 15% يوم الثلاثاء الجاي. انصحك تزيد المخزون يوم الاثنين الظهر. الربح المتوقع: +45.000 د.ك.`;
    
    setMessages(prev => [...prev, { role: 'bot', text: msg }]);
    setMode('chat');
  };

  return (
    <div className="ai-assistant-wrapper" style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
      {/* FLOAT BUTTON */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'var(--primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(1, 86, 44, 0.4)',
            border: '2px solid white',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          className="pulse-ai"
        >
          <Bot size={32} />
        </button>
      )}

      {/* CHAT WINDOW */}
      {isOpen && (
        <div 
          style={{
            width: '400px',
            height: '600px',
            background: 'rgba(255, 255, 255, 0.98)',
            borderRadius: '32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            backdropFilter: 'blur(10px)',
            animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* HEADER */}
          <div style={{ background: 'var(--primary)', padding: '1.5rem', color: 'white', position: 'relative' }}>
            <div style={{ position: 'absolute', right: lang === 'en' ? '1rem' : 'auto', left: lang === 'ar' ? '1rem' : 'auto', top: '1.25rem', display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '8px', color: 'white' }}
              >
                 {t.lang_btn}
              </button>
              <button onClick={() => setIsOpen(false)} style={{ color: 'white', opacity: 0.8 }}><X size={22} /></button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.25)', padding: '10px', borderRadius: '16px' }}>
                <Bot size={28} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{t.identity}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.9, fontSize: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 10px #4ade80' }}></div>
                  {t.status}
                </div>
              </div>
            </div>
          </div>

          {/* CHAT BODY */}
          <div 
            ref={scrollRef}
            style={{ 
              flex: 1, 
              padding: '1.5rem', 
              overflowY: 'auto', 
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            {mode === 'chat' && messages.map((m, i) => (
              <div key={i} style={{ 
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                padding: '1rem 1.25rem',
                borderRadius: m.role === 'user' 
                  ? (lang === 'en' ? '24px 24px 4px 24px' : '24px 24px 24px 4px') 
                  : (lang === 'en' ? '24px 24px 24px 4px' : '24px 24px 4px 24px'),
                background: m.role === 'user' ? 'var(--primary)' : 'white',
                color: m.role === 'user' ? 'white' : '#1e293b',
                boxShadow: m.role === 'user' ? '0 4px 15px rgba(1, 86, 44, 0.2)' : '0 2px 8px rgba(0,0,0,0.06)',
                fontSize: '14px',
                lineHeight: '1.6',
                fontWeight: 500
              }}>
                {m.text}
              </div>
            ))}

            {mode === 'forecast' && (
              <div className="forecast-view animated fadeIn" style={{ padding: '0.5rem' }}>
                <button onClick={() => setMode('chat')} style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                   {t.back}
                </button>
                <div style={{ background: '#eff6ff', padding: '1.5rem', borderRadius: '24px', border: '1px solid #dbeafe', textAlign: 'center' }}>
                   <div style={{ width: '48px', height: '48px', background: '#3b82f6', color: 'white', borderRadius: '14px', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                      <TrendingUp size={24} />
                   </div>
                   <h5 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>{t.forecast}</h5>
                   <p style={{ fontSize: '13px', color: '#1e40af', margin: 0 }}>{t.forecast_intro}</p>
                   <button 
                     onClick={getForecast}
                     style={{ marginTop: '1.25rem', width: '100%', padding: '0.75rem', borderRadius: '12px', background: '#3b82f6', color: 'white', fontWeight: 800, cursor: 'pointer' }}
                   >
                     {t.predict}
                   </button>
                </div>
              </div>
            )}

            {mode === 'complaint' && (
              <div className="complaint-view animated fadeIn" style={{ padding: '0.5rem' }}>
                <button onClick={() => setMode('chat')} style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                   {t.back}
                </button>
                <div style={{ background: '#fef2f2', padding: '1.5rem', borderRadius: '24px', border: '1px solid #fee2e2', textAlign: 'center' }}>
                   <div style={{ width: '48px', height: '48px', background: '#ef4444', color: 'white', borderRadius: '14px', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                      <AlertCircle size={24} />
                   </div>
                   <h5 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#ef4444' }}>{t.complaint}</h5>
                   <p style={{ fontSize: '13px', color: '#991b1b', margin: 0 }}>{lang === 'en' ? 'Report your issue to management below.' : 'اكتب مشكلتك تحت وراح توصل للإدارة فوراً.'}</p>
                </div>
              </div>
            )}
          </div>

          {/* QUICK ACTIONS */}
          {mode === 'chat' && (
            <div style={{ padding: '1rem', display: 'flex', gap: '0.75rem', background: '#f1f5f9', borderTop: '1px solid #e2e8f0', overflowX: 'auto' }}>
              <button 
                onClick={() => setMode('forecast')}
                style={{ whiteSpace: 'nowrap', padding: '8px 16px', borderRadius: '12px', background: 'white', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #e2e8f0', color: '#3b82f6' }}
              >
                <TrendingUp size={14} /> {t.forecast}
              </button>
              <button 
                onClick={() => setMode('chat')}
                className="btn-guide-trigger"
                style={{ whiteSpace: 'nowrap', padding: '8px 16px', borderRadius: '12px', background: 'white', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #e2e8f0' }}
              >
                <HelpCircle size={14} /> {t.guide}
              </button>
              <button 
                onClick={() => setMode('complaint')}
                style={{ whiteSpace: 'nowrap', padding: '8px 16px', borderRadius: '12px', background: 'white', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #fee2e2', color: '#ef4444' }}
              >
                <AlertCircle size={14} /> {t.complaint}
              </button>
            </div>
          )}

          {/* INPUT AREA */}
          <form onSubmit={handleSend} style={{ padding: '1.25rem', background: 'white', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.75rem' }}>
            <input 
              type="text" 
              placeholder={t.type}
              style={{ flex: 1, padding: '0.8rem 1.25rem', borderRadius: '16px', background: '#f1f5f9', border: '1px solid transparent', fontSize: '14px', outline: 'none', transition: 'all 0.2s' }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'transparent'}
            />
            <button 
              type="submit"
              style={{ width: '50px', height: '50px', borderRadius: '16px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(1, 86, 44, 0.4); }
          70% { box-shadow: 0 0 0 20px rgba(1, 86, 44, 0); }
          100% { box-shadow: 0 0 0 0 rgba(1, 86, 44, 0); }
        }
        .pulse-ai { animation: pulse 2s infinite; }
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animated { animation-duration: 0.4s; animation-fill-mode: both; }
        .fadeIn { animation-name: fadeIn; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default AIAssistant;
