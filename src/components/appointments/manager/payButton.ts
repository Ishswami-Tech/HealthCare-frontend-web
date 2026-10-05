/**
 * The payment button takes only a class name, so these make it amber (pay is an amber action).
 * `PAY_CARD` is the 44 px main button of a card, `PAY_ROW` the 36 px button of a table row.
 */
const AMBER =
  "bg-action font-bold text-[#0f1b2d] shadow-action hover:bg-action hover:brightness-95 dark:shadow-none dark:hover:bg-action";

export const PAY_CARD_CLASS = `h-11 px-[18px] max-sm:flex-1 ${AMBER}`;
export const PAY_ROW_CLASS = AMBER;
