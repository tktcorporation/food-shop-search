export const keyWordOptions = [
  { value: 'restaurant', label: 'レストラン' },
  { value: 'cafe', label: 'カフェ' },
  { value: 'bar', label: 'バー' },
  { value: 'ファストフード', label: 'ファストフード' },
  { value: '定食', label: '定食' },
  { value: 'ラーメン', label: 'ラーメン' },
  { value: 'food', label: 'その他' }
];

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