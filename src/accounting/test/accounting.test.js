'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');
const { createAccount, formatAmount, parseAmount } = require('../index');

const appPath = path.join(__dirname, '..', 'index.js');

function runApp(input) {
  const result = spawnSync(process.execPath, [appPath], {
    encoding: 'utf8',
    input,
  });

  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}

test('ACC-001: a new account starts with a balance of 1000.00', () => {
  const output = runApp('1\n4\n');
  assert.match(output, /Current balance: 1000\.00/);
});

test('ACC-002: viewing balance reads it without changing it', () => {
  const output = runApp('1\n1\n4\n');
  assert.equal((output.match(/Current balance: 1000\.00/g) || []).length, 2);
});

test('ACC-003: crediting a whole amount updates the balance', () => {
  const output = runApp('2\n50\n1\n4\n');
  assert.match(output, /Amount credited\. New balance: 1050\.00/);
  assert.match(output, /Current balance: 1050\.00/);
});

test('ACC-004: crediting cents preserves two-decimal precision', () => {
  const output = runApp('2\n25.75\n1\n4\n');
  assert.match(output, /Amount credited\. New balance: 1025\.75/);
  assert.match(output, /Current balance: 1025\.75/);
});

test('ACC-005: multiple transactions use the latest balance', () => {
  const output = runApp('2\n100.00\n3\n30.00\n1\n4\n');
  assert.match(output, /Amount credited\. New balance: 1100\.00/);
  assert.match(output, /Amount debited\. New balance: 1070\.00/);
  assert.match(output, /Current balance: 1070\.00/);
});

test('ACC-006: debiting less than the balance updates it', () => {
  const output = runApp('3\n200\n1\n4\n');
  assert.match(output, /Amount debited\. New balance: 800\.00/);
  assert.match(output, /Current balance: 800\.00/);
});

test('ACC-007: debiting exactly the balance is allowed', () => {
  const output = runApp('3\n1000\n1\n4\n');
  assert.match(output, /Amount debited\. New balance: 0\.00/);
  assert.match(output, /Current balance: 0\.00/);
});

test('ACC-008: an unaffordable debit is rejected without changing balance', () => {
  const output = runApp('3\n1000.01\n1\n4\n');
  assert.match(output, /Insufficient funds for this debit\./);
  assert.match(output, /Current balance: 1000\.00/);
  assert.doesNotMatch(output, /Amount debited\./);
});

test('ACC-009: zero credit succeeds without changing balance', () => {
  const output = runApp('2\n0\n1\n4\n');
  assert.match(output, /Amount credited\. New balance: 1000\.00/);
  assert.match(output, /Current balance: 1000\.00/);
});

test('ACC-010: zero debit succeeds without changing balance', () => {
  const output = runApp('3\n0\n1\n4\n');
  assert.match(output, /Amount debited\. New balance: 1000\.00/);
  assert.match(output, /Current balance: 1000\.00/);
});

test('ACC-011: invalid menu choice displays an error and menu continues', () => {
  const output = runApp('5\n1\n4\n');
  assert.match(output, /Invalid choice, please select 1-4\./);
  assert.match(output, /Current balance: 1000\.00/);
  assert.ok(output.indexOf('Invalid choice') < output.indexOf('Current balance'));
});

test('ACC-012: exit displays goodbye and stops the application', () => {
  const output = runApp('4\n');
  assert.match(output, /Exiting the program\. Goodbye!/);
  assert.equal((output.match(/Enter your choice \(1-4\):/g) || []).length, 1);
});

test('ACC-013: balance is reset when a new process starts', () => {
  const firstSession = runApp('2\n10\n4\n');
  const nextSession = runApp('1\n4\n');
  assert.match(firstSession, /Amount credited\. New balance: 1010\.00/);
  assert.match(nextSession, /Current balance: 1000\.00/);
});

test('ACC-014: negative transaction amounts are rejected without balance changes', () => {
  const creditOutput = runApp('2\n-5\n1\n4\n');
  const debitOutput = runApp('3\n-5\n1\n4\n');
  for (const output of [creditOutput, debitOutput]) {
    assert.match(output, /Invalid amount\./);
    assert.match(output, /Current balance: 1000\.00/);
  }
});

test('ACC-015: malformed transaction input is rejected and the program continues', () => {
  const creditOutput = runApp('2\nabc\n1\n4\n');
  const debitOutput = runApp('3\nabc\n1\n4\n');
  for (const output of [creditOutput, debitOutput]) {
    assert.match(output, /Invalid amount\./);
    assert.match(output, /Current balance: 1000\.00/);
    assert.match(output, /Exiting the program\. Goodbye!/);
  }
});

test('ACC-016: excess decimal precision and balance overflow are rejected safely', () => {
  const output = runApp('2\n1.234\n2\n999999.99\n1\n4\n');
  assert.match(output, /Invalid amount\./);
  assert.match(output, /Transaction exceeds the maximum supported balance\./);
  assert.match(output, /Current balance: 1000\.00/);
});

test('money helpers parse and format cents without floating-point values', () => {
  assert.equal(parseAmount('25.7'), 2570);
  assert.equal(parseAmount('25.75'), 2575);
  assert.equal(parseAmount('1.234'), null);
  assert.equal(parseAmount('1000000'), null);
  assert.equal(formatAmount(102575), '1025.75');
});

test('account operations preserve data integrity on rejected transactions', () => {
  const account = createAccount();
  assert.equal(account.credit(10000), true);
  assert.equal(account.debit(3000), true);
  assert.equal(account.balanceCents, 107000);
  assert.equal(account.debit(107001), false);
  assert.equal(account.balanceCents, 107000);
  assert.equal(account.credit(99999999), false);
  assert.equal(account.balanceCents, 107000);
});
