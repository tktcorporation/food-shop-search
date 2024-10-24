export const keywordCategories = [
  {
    name: '料理ジャンル',
    keywords: [
      { value: '和食', label: '和食' },
      { value: '中華料理', label: '中華料理' },
      { value: '韓国料理', label: '韓国料理' },
      { value: 'イタリアン', label: 'イタリアン' },
      { value: 'フレンチ', label: 'フレンチ' },
      { value: 'タイ料理', label: 'タイ料理' },
      { value: 'ベトナム料理', label: 'ベトナム料理' },
      { value: 'インド料理', label: 'インド料理' },
    ]
  },
  {
    name: '和食専門',
    keywords: [
      { value: '定食', label: '定食' },
      { value: '寿司', label: '寿司' },
      { value: 'うどん', label: 'うどん' },
      { value: 'そば', label: 'そば' },
      { value: '天ぷら', label: '天ぷら' },
      { value: 'とんかつ', label: 'とんかつ' },
      { value: '焼き鳥', label: '焼き鳥' },
      { value: '海鮮', label: '海鮮' },
    ]
  },
  {
    name: '肉料理',
    keywords: [
      { value: '焼肉', label: '焼肉' },
      { value: 'ステーキ', label: 'ステーキ' },
      { value: 'ハンバーグ', label: 'ハンバーグ' },
    ]
  },
  {
    name: '粉物',
    keywords: [
      { value: 'お好み焼き', label: 'お好み焼き' },
      { value: 'たこ焼き', label: 'たこ焼き' },
    ]
  },
  {
    name: '軽食・カフェ',
    keywords: [
      { value: 'cafe', label: 'カフェ' },
      { value: 'パン屋', label: 'パン屋' },
      { value: 'スイーツ', label: 'スイーツ' },
      { value: 'ファストフード', label: 'ファストフード' },
    ]
  },
  {
    name: '居酒屋・バー',
    keywords: [
      { value: '居酒屋', label: '居酒屋' },
      { value: 'bar', label: 'バー' },
    ]
  },
];

// Flatten all keywords for backward compatibility
export const keyWordOptions = keywordCategories.flatMap(category => category.keywords);

export const getKeywordLabel = (value: string): string => {
  const option = keyWordOptions.find(opt => opt.value === value);
  return option ? option.label : value;
};

export const addCustomKeyword = (keyword: string) => {
  if (!keyWordOptions.some(option => option.value === keyword)) {
    keyWordOptions.push({ value: keyword, label: keyword });
  }
};

export const removeCustomKeyword = (keyword: string) => {
  const index = keyWordOptions.findIndex(option => option.value === keyword);
  if (index !== -1) {
    keyWordOptions.splice(index, 1);
  }
};