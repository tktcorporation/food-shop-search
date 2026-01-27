import { describe, it, expect } from 'vitest';
import {
  keywordCategories,
  keyWordOptions,
  getKeywordLabel,
} from './keywordOptions';

describe('keywordOptions', () => {
  describe('keywordCategories', () => {
    it('has three categories', () => {
      expect(keywordCategories).toHaveLength(3);
    });

    it('contains expected category names', () => {
      const names = keywordCategories.map((c) => c.name);
      expect(names).toEqual(['ジャンル', 'スタイル', '料理']);
    });

    it('each category has at least one keyword', () => {
      for (const category of keywordCategories) {
        expect(category.keywords.length).toBeGreaterThan(0);
      }
    });

    it('all keywords have value and label', () => {
      for (const category of keywordCategories) {
        for (const keyword of category.keywords) {
          expect(keyword.value).toBeTruthy();
          expect(keyword.label).toBeTruthy();
        }
      }
    });
  });

  describe('keyWordOptions', () => {
    it('is a flat array of all keywords', () => {
      const totalKeywords = keywordCategories.reduce(
        (sum, cat) => sum + cat.keywords.length,
        0,
      );
      expect(keyWordOptions).toHaveLength(totalKeywords);
    });

    it('contains keywords from all categories', () => {
      const values = keyWordOptions.map((opt) => opt.value);
      // From ジャンル
      expect(values).toContain('和食');
      // From スタイル
      expect(values).toContain('カフェ');
      // From 料理
      expect(values).toContain('ラーメン');
    });
  });

  describe('getKeywordLabel', () => {
    it('returns the label for a known keyword', () => {
      expect(getKeywordLabel('和食')).toBe('和食');
      expect(getKeywordLabel('ラーメン')).toBe('ラーメン');
    });

    it('returns the value itself for unknown keywords', () => {
      expect(getKeywordLabel('unknown-keyword')).toBe('unknown-keyword');
    });
  });
});
