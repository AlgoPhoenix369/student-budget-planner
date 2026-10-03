import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Upload, DollarSign, X } from 'lucide-react';
import { CURRENCIES } from '../../utils/constants';
import { loadCurrency, saveCurrency } from '../../utils/localStorage';
import { exportBackup, importBackup } from '../../utils/api';
import './Settings.css';

function Settings({ isOpen, onClose, onDataImported }) {
  const [selectedCurrency, setSelectedCurrency] = useState(loadCurrency());
  const [importError, setImportError] = useState('');

  const handleCurrencyChange = (currency) => {
    setSelectedCurrency(currency);
    saveCurrency(currency);
    window.location.reload(); // Refresh to apply currency
  };

  // Download visitor's expenses and budget from the server as a JSON backup file
  const handleExport = async () => {
    try {
      const data = await exportBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `budget-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      setImportError('Could not export your data. Please try again.');
    }
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
        // Reads the chosen file, sends it to the server, then reloads to show the restored data
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        await importBackup(data);
        setImportError('');
        onDataImported();
        window.location.reload();
      } catch (error) {
        console.error('Error importing data:', error);
        setImportError('Could not import this file. Please upload a valid backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="settings-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <div className="settings-modal-wrapper">
            <motion.div
              className="settings-modal glass"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2 className="modal-title">⚙️ Settings</h2>
                <button onClick={onClose} className="btn-close">
                  <X size={24} />
                </button>
              </div>

              <div className="settings-content">
                {/* Currency Selection */}
                <div className="settings-section">
                  <h3 className="section-title">
                    <DollarSign size={20} />
                    Currency
                  </h3>
                  <div className="currency-grid">
                    {CURRENCIES.map((currency) => (
                      <button
                        key={currency.code}
                        onClick={() => handleCurrencyChange(currency)}
                        className={`currency-card ${selectedCurrency.code === currency.code ? 'active' : ''}`}
                      >
                        <span className="currency-symbol">{currency.symbol}</span>
                        <span className="currency-code">{currency.code}</span>
                        <span className="currency-name">{currency.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Backup & Restore */}
                <div className="settings-section">
                  <h3 className="section-title">💾 Backup & Restore</h3>
                  <p className="section-description">
                    Export your data for backup or import from another device
                  </p>
                  
                  <div className="backup-actions">
                    <button onClick={handleExport} className="btn btn-secondary">
                      <Download size={18} />
                      Export Data
                    </button>
                    
                    <label className="btn btn-secondary" style={{ cursor: 'pointer', margin: 0 }}>
                      <Upload size={18} />
                      Import Data
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>

                  {importError && (
                    <div className="error-message" style={{ marginTop: 'var(--space-4)' }}>
                      {importError}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default Settings;