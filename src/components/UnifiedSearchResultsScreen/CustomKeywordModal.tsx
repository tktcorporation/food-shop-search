import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface CustomKeywordModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  addCustomKeyword: (keyword: string) => void;
}

const CustomKeywordModal: React.FC<CustomKeywordModalProps> = ({
  isOpen,
  setIsOpen,
  addCustomKeyword,
}) => {
  const [newKeyword, setNewKeyword] = useState('');

  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
      addCustomKeyword(newKeyword.trim());
      setNewKeyword('');
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newKeyword.trim()) {
      handleAddKeyword();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-text/40 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 bottom-4 sm:inset-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 sm:w-full sm:max-w-md"
          >
            <div className="bg-surface-card rounded-2xl shadow-xl border border-primary-100 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-primary-100">
                <h3 className="text-lg font-bold text-text">
                  新しい店舗タイプを追加
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-surface-muted rounded-full transition-colors cursor-pointer"
                >
                  <X size={20} className="text-text-muted" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5">
                <label className="block text-sm font-semibold text-text mb-2">
                  店舗タイプ名
                </label>
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="input"
                  placeholder="例: ラーメン、カレー、イタリアン"
                  autoFocus
                />
                <p className="text-xs text-text-muted mt-2">
                  Google Maps上で検索されるキーワードを入力してください
                </p>
              </div>

              {/* Footer */}
              <div className="flex gap-3 p-5 pt-0">
                <button
                  onClick={() => setIsOpen(false)}
                  className="btn-secondary flex-1"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleAddKeyword}
                  disabled={!newKeyword.trim()}
                  className="btn-primary flex-1"
                >
                  追加
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CustomKeywordModal;
