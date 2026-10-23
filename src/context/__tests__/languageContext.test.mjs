import test from 'node:test';
import assert from 'node:assert/strict';
import { SUPPORTED_LANGUAGES } from '../LanguageContext.tsx';

test('Language context has supported languages with native names', () => {
  assert.equal(SUPPORTED_LANGUAGES.length, 3);

  const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
  assert.deepEqual(codes, ['en', 'kn', 'hi']);

  const kn = SUPPORTED_LANGUAGES.find((l) => l.code === 'kn');
  assert.equal(kn?.nativeName, 'ಕನ್ನಡ');

  const hi = SUPPORTED_LANGUAGES.find((l) => l.code === 'hi');
  assert.equal(hi?.nativeName, 'हिंदी');
});
