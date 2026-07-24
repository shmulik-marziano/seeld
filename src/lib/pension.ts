/**
 * Shared pension assumptions.
 *
 * Converting a retirement balance into a monthly pension is done in Israel with
 * a מקדם המרה (conversion factor): the balance is divided by the factor, and the
 * result is the monthly pension. The factor reflects life expectancy at
 * retirement, the survivor's pension attached to the track, and the fund's
 * assumed return during the payout years.
 *
 * The site used to do this two different ways: the goal calculator divided by a
 * factor of 200, while the pension calculator divided the balance by
 * 20 years × 12 months = 240. The second is not a conversion factor at all — it
 * spends the balance down to nothing and credits it with no return during
 * retirement, so it quietly understated the monthly pension by about a fifth
 * compared to the same site's other calculator. One number, used by both.
 *
 * 200 is a round mid-market figure for retirement at 67. Real factors differ by
 * fund, track, gender and survivor options, which is why every calculator that
 * uses it says so on screen.
 */
export const PENSION_CONVERSION_FACTOR = 200;

/** Monthly pension from an accumulated balance. */
export const monthlyPensionFrom = (balance: number, factor: number = PENSION_CONVERSION_FACTOR): number =>
  factor > 0 ? balance / factor : 0;

/** The balance needed to fund a target monthly pension. */
export const balanceNeededFor = (monthlyPension: number, factor: number = PENSION_CONVERSION_FACTOR): number =>
  monthlyPension * factor;

/** The wording every calculator shows next to a pension figure. */
export const PENSION_FACTOR_NOTE =
  `החישוב מבוסס על מקדם המרה של ${PENSION_CONVERSION_FACTOR}, שהוא מקדם ממוצע לפרישה בגיל 67. ` +
  "המקדם בפועל משתנה בין הקרנות ולפי המסלול, הגיל ובחירת שאירים, ולכן זו הערכה ולא התחייבות.";
