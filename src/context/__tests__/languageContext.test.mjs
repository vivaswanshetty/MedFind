import test from 'node:test';
import assert from 'node:assert/strict';
import { SUPPORTED_LANGUAGES, translations } from '../LanguageContext.tsx';

test('Language context has supported languages with native names', () => {
  assert.equal(SUPPORTED_LANGUAGES.length, 3);

  const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
  assert.deepEqual(codes, ['en', 'kn', 'hi']);

  const kn = SUPPORTED_LANGUAGES.find((l) => l.code === 'kn');
  assert.equal(kn?.nativeName, 'ಕನ್ನಡ');

  const hi = SUPPORTED_LANGUAGES.find((l) => l.code === 'hi');
  assert.equal(hi?.nativeName, 'हिंदी');
});

test('Translations dictionary has complete parity across en, kn, and hi', () => {
  const enKeys = Object.keys(translations.en).sort();
  const knKeys = Object.keys(translations.kn).sort();
  const hiKeys = Object.keys(translations.hi).sort();

  assert.ok(enKeys.length >= 90, `Expected at least 90 translation keys, got ${enKeys.length}`);

  // Check missing keys in kn
  const missingInKn = enKeys.filter((k) => !knKeys.includes(k));
  assert.deepEqual(missingInKn, [], `Keys missing in Kannada dictionary: ${missingInKn.join(', ')}`);

  // Check missing keys in hi
  const missingInHi = enKeys.filter((k) => !hiKeys.includes(k));
  assert.deepEqual(missingInHi, [], `Keys missing in Hindi dictionary: ${missingInHi.join(', ')}`);

  // Check kn extra keys
  const extraInKn = knKeys.filter((k) => !enKeys.includes(k));
  assert.deepEqual(extraInKn, [], `Extra keys in Kannada dictionary: ${extraInKn.join(', ')}`);

  // Check hi extra keys
  const extraInHi = hiKeys.filter((k) => !enKeys.includes(k));
  assert.deepEqual(extraInHi, [], `Extra keys in Hindi dictionary: ${extraInHi.join(', ')}`);
});
