#!/usr/bin/env node
'use strict';

const readline = require('node:readline');

const INITIAL_BALANCE_CENTS = 100000;
const MAX_AMOUNT_CENTS = 99999999;

function formatAmount(cents) {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}

function parseAmount(input) {
  const match = input.trim().match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) {
    return null;
  }

  const whole = Number(match[1]);
  const fractional = Number((match[2] || '').padEnd(2, '0'));
  const cents = whole * 100 + fractional;
  return Number.isSafeInteger(cents) && cents <= MAX_AMOUNT_CENTS ? cents : null;
}

function createAccount(initialBalanceCents = INITIAL_BALANCE_CENTS) {
  let balanceCents = initialBalanceCents;

  return {
    get balanceCents() {
      return balanceCents;
    },
    credit(amountCents) {
      if (balanceCents + amountCents > MAX_AMOUNT_CENTS) {
        return false;
      }
      balanceCents += amountCents;
      return true;
    },
    debit(amountCents) {
      if (balanceCents < amountCents) {
        return false;
      }
      balanceCents -= amountCents;
      return true;
    },
  };
}

async function run() {
  const terminal = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const inputLines = terminal[Symbol.asyncIterator]();
  const account = createAccount();
  let running = true;

  const ask = async (prompt) => {
    process.stdout.write(prompt);
    const line = await inputLines.next();
    return line.done ? null : line.value;
  };

  try {
    while (running) {
      console.log('--------------------------------');
      console.log('Account Management System');
      console.log('1. View Balance');
      console.log('2. Credit Account');
      console.log('3. Debit Account');
      console.log('4. Exit');
      console.log('--------------------------------');

      const inputChoice = await ask('Enter your choice (1-4): ');
      if (inputChoice === null) {
        running = false;
        break;
      }
      const choice = inputChoice.trim();

      switch (choice) {
        case '1':
          console.log(`Current balance: ${formatAmount(account.balanceCents)}`);
          break;
        case '2':
        case '3': {
          const isCredit = choice === '2';
          const rawAmount = await ask(`Enter ${isCredit ? 'credit' : 'debit'} amount: `);
          if (rawAmount === null) {
            running = false;
            break;
          }
          const amountCents = parseAmount(rawAmount);

          if (amountCents === null) {
            console.log('Invalid amount. Enter a non-negative amount with up to two decimal places.');
          } else if (isCredit) {
            if (!account.credit(amountCents)) {
              console.log('Transaction exceeds the maximum supported balance.');
            } else {
              console.log(`Amount credited. New balance: ${formatAmount(account.balanceCents)}`);
            }
          } else if (account.debit(amountCents)) {
            console.log(`Amount debited. New balance: ${formatAmount(account.balanceCents)}`);
          } else {
            console.log('Insufficient funds for this debit.');
          }
          break;
        }
        case '4':
          running = false;
          break;
        default:
          console.log('Invalid choice, please select 1-4.');
      }
    }

    console.log('Exiting the program. Goodbye!');
  } finally {
    terminal.close();
  }
}

module.exports = { createAccount, formatAmount, parseAmount };

if (require.main === module) {
  run().catch((error) => {
    console.error('Unable to run the accounting application:', error);
    process.exitCode = 1;
  });
}
