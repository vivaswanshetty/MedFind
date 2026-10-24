import test from 'node:test';
import assert from 'node:assert/strict';
import { getBuddy } from '../buddy.ts';

test('Buddy Archetypes - Individual Single-Yes Cases', () => {
  // 1. The Organizer (Remy)
  const remy = getBuddy([true, false, false, false, false]);
  assert.equal(remy.archetype, 'The Organizer');
  assert.equal(remy.name, 'Remy');
  assert.deepEqual(remy.traits, ['Organized']);
  assert.match(remy.blurb, /medicine box/i);

  // 2. The Hunter (Juno)
  const juno = getBuddy([false, true, false, false, false]);
  assert.equal(juno.archetype, 'The Hunter');
  assert.equal(juno.name, 'Juno');
  assert.deepEqual(juno.traits, ['Persistent']);
  assert.match(juno.blurb, /pharmacy stock/i);

  // 3. The Caregiver (Cleo)
  const cleo = getBuddy([false, false, true, false, false]);
  assert.equal(cleo.archetype, 'The Caregiver');
  assert.equal(cleo.name, 'Cleo');
  assert.deepEqual(cleo.traits, ['Caring']);
  assert.match(cleo.blurb, /prescriptions and refills/i);

  // 4. The Planner (Milo)
  const milo = getBuddy([false, false, false, true, false]);
  assert.equal(milo.archetype, 'The Planner');
  assert.equal(milo.name, 'Milo');
  assert.deepEqual(milo.traits, ['Punctual']);
  assert.match(milo.blurb, /schedule/i);

  // 5. The Smart Saver (Nova)
  const nova = getBuddy([false, false, false, false, true]);
  assert.equal(nova.archetype, 'The Smart Saver');
  assert.equal(nova.name, 'Nova');
  assert.deepEqual(nova.traits, ['Savvy']);
  assert.match(nova.blurb, /value/i);
});

test('Buddy Archetype - All-No Fallback (The Explorer)', () => {
  const explorer = getBuddy([false, false, false, false, false]);
  assert.equal(explorer.archetype, 'The Explorer');
  assert.equal(explorer.name, 'Pip');
  assert.deepEqual(explorer.traits, ['Curious']);
  assert.match(explorer.blurb, /guide you/i);
});

test('Buddy Archetype - Multiple-Yes Cases preserve all traits and prioritize first yes', () => {
  // Case A: [true, true, false, true, false] -> Organizer with 3 traits
  const buddyA = getBuddy([true, true, false, true, false]);
  assert.equal(buddyA.archetype, 'The Organizer');
  assert.equal(buddyA.name, 'Remy');
  assert.deepEqual(buddyA.traits, ['Organized', 'Persistent', 'Punctual']);

  // Case B: [false, false, true, true, true] -> Caregiver with 3 traits
  const buddyB = getBuddy([false, false, true, true, true]);
  assert.equal(buddyB.archetype, 'The Caregiver');
  assert.equal(buddyB.name, 'Cleo');
  assert.deepEqual(buddyB.traits, ['Caring', 'Punctual', 'Savvy']);

  // Case C: All true -> Organizer with all 5 traits
  const buddyAll = getBuddy([true, true, true, true, true]);
  assert.equal(buddyAll.archetype, 'The Organizer');
  assert.equal(buddyAll.name, 'Remy');
  assert.deepEqual(buddyAll.traits, ['Organized', 'Persistent', 'Caring', 'Punctual', 'Savvy']);
});
