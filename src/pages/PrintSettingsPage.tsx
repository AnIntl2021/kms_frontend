import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Printer, Image as ImageIcon, AlignLeft, CheckCircle } from 'lucide-react';

const PrintSettingsPage: React.FC = () => {
  const [printType, setPrintType] = useState('thermal');
  const [headerText, setHeaderText] = useState('KMS Restaurant Company\\n123 Main St, City Center\\nTel: +1234567890');
  const [footerText, setFooterText] = useState('Thank you for your visit!\\nPlease come again.');

  const handleSave = () => {
    // Save to local storage or API
    localStorage.setItem('printSettings', JSON.stringify({ printType, headerText, footerText }));
    alert('Print settings saved successfully!');
  };

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <Printer className="mr-3 text-indigo-600" /> Print Settings
        </h1>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Default Print Format</h2>
          <div className="flex space-x-4 mb-6">
            <button 
              onClick={() => setPrintType('thermal')}
              className={`flex-1 py-4 border-2 rounded-xl flex flex-col items-center justify-center transition-all ${printType === 'thermal' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
            >
              <AlignLeft size={32} className="mb-2" />
              <span className="font-bold">80mm Thermal Receipt</span>
              <span className="text-xs mt-1 opacity-70">For POS and Kitchen</span>
            </button>
            <button 
              onClick={() => setPrintType('a4')}
              className={`flex-1 py-4 border-2 rounded-xl flex flex-col items-center justify-center transition-all ${printType === 'a4' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
            >
              <ImageIcon size={32} className="mb-2" />
              <span className="font-bold">A4 Standard Invoice</span>
              <span className="text-xs mt-1 opacity-70">For B2B and detailed reports</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Header Text</label>
              <textarea 
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500"
                rows={3}
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Use \n for new lines. This appears at the top of every receipt.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Footer Text</label>
              <textarea 
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500"
                rows={2}
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={handleSave} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium flex items-center hover:bg-indigo-700">
              <CheckCircle size={18} className="mr-2" /> Save Settings
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PrintSettingsPage;
