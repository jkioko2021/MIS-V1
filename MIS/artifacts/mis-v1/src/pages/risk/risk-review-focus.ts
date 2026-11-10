/** The popup is opened imperatively from a table, without a Radix DialogTrigger. */
export function restoreReviewFocus(trigger: HTMLButtonElement | null) {
  const testId = trigger?.getAttribute('data-testid');
  // Polling can replace the table while the popup is open.
  const currentTrigger = trigger?.isConnected
    ? trigger
    : testId
      ? document.querySelector<HTMLButtonElement>(`[data-testid="${CSS.escape(testId)}"]`)
      : null;
  currentTrigger?.focus({ preventScroll: true });
}
