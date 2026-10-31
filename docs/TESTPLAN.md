# COBOL Account Management Test Plan

This plan describes the behavior implemented in `src/cobol/main.cob`,
`src/cobol/operations.cob`, and `src/cobol/data.cob`. Run each scenario in a
fresh program session unless a case explicitly depends on a prior transaction.
Record observed results in **Actual Result**, mark **Status (Pass/Fail)** after
stakeholder review, and capture any decisions or deviations in **Comments**.

The program starts with an in-memory balance of `1000.00`. Balances and
transaction amounts have two implied decimal places and support up to six
whole-number digits. The current implementation does not define validation or
business outcomes for malformed, negative, or out-of-range amounts; cases
covering those inputs are characterization questions for stakeholders, not
assumed requirements.

| Test Case ID | Test Case Description | Pre-conditions | Test Steps | Expected Result | Actual Result | Status (Pass/Fail) | Comments |
|---|---|---|---|---|---|---|---|
| ACC-001 | Initialize a new account session | Application is not running. | Start the application and select **View Balance**. | The displayed starting balance is `1000.00`. |  | Not run | Confirms the initial value provided by `DataProgram`. |
| ACC-002 | View the current balance | Application is running with no transactions in this session. | Select menu option `1`. | The application reads and displays the current balance (`1000.00`). The balance is not changed. |  | Not run | Covers menu dispatch, `TOTAL`, and data `READ`. |
| ACC-003 | Credit a whole-number amount | Application is running with balance `1000.00`. | Select option `2`; enter `50`; then select option `1`. | The credit succeeds, displays new balance `1050.00`, and the subsequent view also shows `1050.00`. |  | Not run | Covers credit calculation and data `WRITE`. |
| ACC-004 | Credit an amount containing cents | Application is running with balance `1000.00`. | Select option `2`; enter `25.75`; then view the balance. | The credit succeeds and the balance is `1025.75`. |  | Not run | Confirms two-decimal amount handling. |
| ACC-005 | Apply multiple transactions to the same balance | Application is running with balance `1000.00`. | Credit `100.00`, debit `30.00`, then view the balance. | Both transactions succeed and the final balance is `1070.00`. |  | Not run | Confirms balance changes are retained between operations during a session. |
| ACC-006 | Debit an amount less than the balance | Application is running with balance `1000.00`. | Select option `3`; enter `200`; then view the balance. | The debit succeeds, displays new balance `800.00`, and the subsequent view shows `800.00`. |  | Not run | Covers debit calculation and data `WRITE`. |
| ACC-007 | Debit an amount equal to the balance | Application is running with balance `1000.00`. | Select option `3`; enter `1000`; then view the balance. | The debit is allowed because the balance is greater than or equal to the amount; the new balance is `0.00`. |  | Not run | Covers the inclusive debit comparison. |
| ACC-008 | Reject a debit greater than the balance | Application is running with balance `1000.00`. | Select option `3`; enter `1000.01`; then view the balance. | The application displays the insufficient-funds message and the balance remains `1000.00`. |  | Not run | Confirms rejected debits do not write a changed balance. |
| ACC-009 | Credit zero | Application is running with balance `1000.00`. | Select option `2`; enter `0`; then view the balance. | With the current implementation's arithmetic and lack of a zero-amount guard, the credit completes, reports a new balance of `1000.00`, and leaves the balance unchanged. |  | Not run | Stakeholders should confirm whether zero-value transactions should be accepted. |
| ACC-010 | Debit zero | Application is running with balance `1000.00`. | Select option `3`; enter `0`; then view the balance. | With the current implementation's balance comparison and lack of a zero-amount guard, the debit completes, reports a new balance of `1000.00`, and leaves the balance unchanged. |  | Not run | Stakeholders should confirm whether zero-value transactions should be accepted. |
| ACC-011 | Handle an invalid numeric menu choice | Application is running. | Enter a numeric menu choice outside `1` through `4` (for example, `5`). Then select option `1`. | The application displays `Invalid choice, please select 1-4.`, shows the menu again, and remains usable; viewing the balance shows it is unchanged. |  | Not run | Confirms the invalid-choice branch and menu loop. |
| ACC-012 | Exit the application | Application is running. | Select menu option `4`. | The application leaves the menu loop and displays `Exiting the program. Goodbye!`. |  | Not run | Confirms normal termination. |
| ACC-013 | Confirm balance lifetime across sessions | Application is running; change the balance (for example, credit `10.00`) and exit. | Start a new application process and select **View Balance**. | The new process starts at `1000.00`; the previous session's balance is not persisted. |  | Not run | Balance is held in working storage, not a file or database. |
| ACC-014 | Characterize negative transaction input | Application is running. | Try a negative credit amount and a negative debit amount in separate fresh sessions; record messages, resulting balances, and whether the program continues. | No expected business outcome is defined by the current code. Stakeholders must decide the desired behavior before treating the observation as a migration requirement. |  | Not run | `AMOUNT` is an unsigned numeric field and there is no explicit negative-input validation. |
| ACC-015 | Characterize malformed transaction input | Application is running. | At a credit/debit amount prompt, enter non-numeric text; record messages, resulting balance, and whether the program continues. | No expected business outcome is defined by the current code. Stakeholders must decide how invalid input should be handled. |  | Not run | Input validation and recovery behavior are not implemented explicitly. |
| ACC-016 | Characterize amount or balance limits | Application is running. | Try an amount with more than two fractional digits and a transaction that would exceed the six-digit whole-number balance capacity; record runtime behavior and resulting balance. | No expected business outcome is defined by the current code. Stakeholders must decide precision, overflow, and error-handling requirements. |  | Not run | `PIC 9(6)V99` defines storage capacity, but the code has no explicit range/overflow handling. |
