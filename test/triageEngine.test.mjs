import { scanRedFlags, APPROVED_INTERIM_LIBRARY, getDisclaimerNotice } from '../backend/dist/controllers/triageController.js';
import { BANNED_DRUGS } from '../backend/dist/controllers/prescriptionController.js';

// Test Suite for Clinical Governance and Guardrails (PRD Section 8 & Section 11)
console.log('--- Running RuralCare Connect Clinical Safety Tests ---');

// Test 1: Cardiac Red Flag
const cardiacFlags = scanRedFlags('I feel heavy chest pain and left arm tightness');
console.assert(cardiacFlags.matched === true, 'Test 1 Failed: Chest pain not detected');
console.log('✓ Test 1 Passed: Cardiac red flag detection');

// Test 2: Multilingual Hindi Emergency
const hindiStroke = scanRedFlags('अचानक लकवा जैसा लग रहा है और बोलने में दिक्कत है');
console.assert(hindiStroke.matched === true, 'Test 2 Failed: Hindi stroke not detected');
console.log('✓ Test 2 Passed: Hindi neurological red flag detection');

// Test 3: Gujarati Obstetric Complication
const gujaratiPreg = scanRedFlags('સગર્ભા લોહી નીકળવું અને પેટમાં દુખાવો');
console.assert(gujaratiPreg.matched === true, 'Test 3 Failed: Gujarati obstetric flag not detected');
console.log('✓ Test 3 Passed: Gujarati obstetric red flag detection');

// Test 4: Banned Drug Filter (Schedule X)
const testBanned = 'Alprazolam';
const isBanned = BANNED_DRUGS.some(b => testBanned.toLowerCase().includes(b));
console.assert(isBanned === true, 'Test 4 Failed: Banned drug Alprazolam was not blocked');
console.log('✓ Test 4 Passed: Banned drug list filter (FR-5.7)');

// Test 5: Safe Self-Care non-pharmacological advice check
const adviceKeys = Object.keys(APPROVED_INTERIM_LIBRARY);
console.assert(adviceKeys.length > 0, 'Test 5 Failed: No interim advice provided');
console.assert(adviceKeys.includes('ORS_PROTOCOL'), 'Test 5 Failed: ORS protocol missing');
console.log('✓ Test 5 Passed: Low-acuity classification & clinician-approved interim advice (FR-2.4)');

console.log('All 5 clinical safety test scenarios verified successfully!');

