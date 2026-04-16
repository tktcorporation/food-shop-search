export const keywordCategories = [
  {
    name: '食事',
    keywords: [
      { value: 'モーニング', label: 'モーニング' },
      { value: 'ランチ', label: 'ランチ' },
      { value: 'ディナー', label: 'ディナー' },
    ],
  },
  {
    name: 'ジャンル',
    keywords: [
      { value: '和食', label: '和食' },
      { value: '中華料理', label: '中華料理' },
      { value: '韓国料理', label: '韓国料理' },
      { value: 'イタリアン', label: 'イタリアン' },
      { value: 'フレンチ', label: 'フレンチ' },
      { value: 'タイ料理', label: 'タイ料理' },
      { value: 'ベトナム料理', label: 'ベトナム料理' },
      { value: 'インド料理', label: 'インド料理' },
    ],
  },
  {
    name: 'スタイル',
    keywords: [
      { value: '定食', label: '定食' },
      { value: 'ファストフード', label: 'ファストフード' },
      { value: 'ファミレス', label: 'ファミレス' },
      { value: 'カフェ', label: 'カフェ' },
      { value: '居酒屋', label: '居酒屋' },
      { value: 'バー', label: 'バー' },
      { value: '食べ放題', label: '食べ放題' },
    ],
  },
  {
    name: '料理',
    keywords: [
      { value: 'ラーメン', label: 'ラーメン' },
      { value: 'うどん,そば', label: 'うどん,そば' },
      { value: 'カレー', label: 'カレー' },
      { value: '寿司', label: '寿司' },
      { value: '天ぷら', label: '天ぷら' },
      { value: 'とんかつ', label: 'とんかつ' },
      { value: '焼き鳥', label: '焼き鳥' },
      { value: '海鮮', label: '海鮮' },
      { value: '焼肉', label: '焼肉' },
      { value: 'ステーキ', label: 'ステーキ' },
      { value: 'ハンバーグ', label: 'ハンバーグ' },
      { value: 'ピザ', label: 'ピザ' },
      { value: 'パスタ', label: 'パスタ' },
      { value: '丼もの', label: '丼もの' },
      { value: '餃子', label: '餃子' },
      { value: 'たこ焼き,お好み焼き', label: 'たこ焼き,お好み焼き' },
    ],
  },
  {
    name: 'パン・スイーツ',
    keywords: [
      { value: 'パン', label: 'パン' },
      { value: 'ケーキ', label: 'ケーキ' },
      { value: 'スイーツ', label: 'スイーツ' },
      { value: 'ドーナツ', label: 'ドーナツ' },
      { value: 'クレープ', label: 'クレープ' },
      { value: 'アイスクリーム', label: 'アイスクリーム' },
    ],
  },
];

// Flatten all keywords for backward compatibility
export const keyWordOptions = keywordCategories.flatMap(
  (category) => category.keywords,
);

export const getKeywordLabel = (value: string): string => {
  const option = keyWordOptions.find((opt) => opt.value === value);
  return option ? option.label : value;
};
