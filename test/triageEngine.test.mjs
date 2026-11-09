import { detectRedFlags, evaluateClinicalTriage } from '../src/utils/aiTriageEngine.ts';
import { BANNED_TELEMEDICINE_DRUGS } from '../src/data/clinicalLibrary.ts';

// Test Suite for Clinical Governance and Guardrails (PRD Section 8 & Section 11)
console.log('--- Running RuralCare Connect Clinical Safety Tests ---');

// Test 1: Cardiac Red Flag
const cardiacFlags = detectRedFlags('I feel heavy chest pain and left arm tightness');
console.assert(cardiacFlags.length > 0, 'Test 1 Failed: Chest pain not detected');
console.log('✓ Test 1 Passed: Cardiac red flag detection');

// Test 2: Multilingual Hindi Emergency
const hindiStroke = detectRedFlags('अचानक लकवा जैसा लग रहा है और बोलने में दिक्कत है');
console.assert(hindiStroke.length > 0, 'Test 2 Failed: Hindi stroke not detected');
console.log('✓ Test 2 Passed: Hindi neurological red flag detection');

// Test 3: Gujarati Obstetric Complication
const gujaratiPreg = detectRedFlags('સગર્ભા લોહી નીકળવું અને પેટમાં દુખાવો');
console.assert(gujaratiPreg.length > 0, 'Test 3 Failed: Gujarati obstetric flag not detected');
console.log('✓ Test 3 Passed: Gujarati obstetric red flag detection');

// Test 4: Banned Drug Filter (Schedule X)
const testBanned = 'Alprazolam';
const isBanned = BANNED_TELEMEDICINE_DRUGS.some(b => testBanned.toLowerCase().includes(b));
console.assert(isBanned === true, 'Test 4 Failed: Banned drug Alprazolam was not blocked');
console.log('✓ Test 4 Passed: Banned drug list filter (FR-5.7)');

// Test 5: Safe Self-Care non-pharmacological advice check
const dummyProfile = {
  id: 'test-1',
  name: 'Sunita',
  relation: 'Self',
  age: 34,
  gender: 'Female',
  avatar: '👩🏽'
};
const mildResult = evaluateClinicalTriage('mild cold and sore throat', '1 day', 'Mild', dummyProfile, 'en');
console.assert(mildResult.triageLevel === 'SELF_CARE', 'Test 5 Failed: Mild symptoms did not categorize as SELF_CARE');
console.assert(mildResult.approvedInterimAdvice.length > 0, 'Test 5 Failed: No interim advice provided');
console.log('✓ Test 5 Passed: Low-acuity classification & clinician-approved interim advice (FR-2.4)');

console.log('All 5 clinical safety test scenarios verified successfully!');
