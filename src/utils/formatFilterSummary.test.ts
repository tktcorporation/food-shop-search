import { describe, it, expect } from 'vitest';
import { formatKeywordSummary } from './formatFilterSummary';
import { getKeywordLabel } from './keywordOptions';

describe('formatKeywordSummary', () => {
  it('returns 未選択 when no keywords selected', () => {
    expect(formatKeywordSummary([], getKeywordLabel)).toBe('未選択');
  });

  it('returns single label when 1 keyword selected', () => {
    expect(formatKeywordSummary(['和食'], getKeywordLabel)).toBe('和食');
  });

  it('returns comma-separated labels when 2-3 keywords selected', () => {
    expect(formatKeywordSummary(['和食', 'ラーメン'], getKeywordLabel)).toBe('和食、ラーメン');
    expect(formatKeywordSummary(['和食', 'ラーメン', 'カフェ'], getKeywordLabel)).toBe('和食、ラーメン、カフェ');
  });

  it('returns first 3 labels + count when more than 3 keywords selected', () => {
    const keywords = ['和食', 'ラーメン', 'カフェ', '焼肉', 'ステーキ'];
    expect(formatKeywordSummary(keywords, getKeywordLabel)).toBe('和食、ラーメン、カフェ 他2件');
  });

  it('shows actual labels even when all keywords are selected (no すべて)', () => {
    const allKeywords = [
      '和食', '中華料理', '韓国料理', 'イタリアン', 'フレンチ', 'タイ料理', 'ベトナム料理', 'インド料理',
      '定食', 'ファストフード', 'ファミレス', 'カフェ',
      'ラーメン', 'うどん,そば', '天ぷら', 'とんかつ', '焼き鳥', '海鮮', '焼肉', 'ステーキ', 'ハンバーグ',
    ];
    expect(formatKeywordSummary(allKeywords, getKeywordLabel)).toBe('和食、中華料理、韓国料理 他18件');
  });

  it('uses getKeywordLabel to resolve custom keywords', () => {
    const customLabel = (v: string) => (v === 'custom' ? 'カスタム' : v);
    expect(formatKeywordSummary(['custom', '和食'], customLabel)).toBe('カスタム、和食');
  });
});
