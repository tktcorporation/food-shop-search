import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    addCustomKeyword(newKeyword);
    setNewKeyword('');
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 500 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center p-4"
        >
          <div className="bg-white rounded-t-2xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-semibold mb-4">新しい店舗タイプを追加</h3>
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 mb-4"
              placeholder="新しい店舗タイプを入力"
            />
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-gray-600 font-medium"
              >
                キャンセル
              </button>
              <button
                onClick={handleAddKeyword}
                className="px-4 py-2 bg-primary-500 text-white font-medium rounded-md"
              >
                追加
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CustomKeywordModal;