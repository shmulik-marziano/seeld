
-- Add investment track and risk level columns to products table
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS investment_track text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS investment_track_custom text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS preferred_risk_level text DEFAULT NULL;

-- Add investment track and risk level columns to recommendations table
ALTER TABLE public.recommendations
  ADD COLUMN IF NOT EXISTS recommended_investment_track text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS recommended_investment_track_custom text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS recommended_risk_level text DEFAULT NULL;

-- Migrate existing track data in products
UPDATE public.products SET
  investment_track = CASE
    WHEN track IN ('כללי', 'מסלול כללי') THEN 'כללי'
    WHEN track IN ('מניות', 'מסלול מניות', 'מנייתי') THEN 'מניות'
    WHEN track IN ('עוקב S&P 500', 'עוקב מדד S&P500', 'עוקב S&P500', 'עוקב מדד S&P 500') THEN 'עוקב S&P 500'
    WHEN track IN ('מדדי מניות') THEN 'מדדי מניות'
    WHEN track IN ('מסלול אג"ח', 'אגח', 'אג"ח') THEN 'מסלול אג"ח'
    WHEN track IN ('אג"ח ממשלות') THEN 'אג"ח ממשלות'
    WHEN track IN ('עוקב מדדי אג"ח') THEN 'עוקב מדדי אג"ח'
    WHEN track IN ('אג"ח סחיר') THEN 'אג"ח סחיר'
    WHEN track IN ('אג"ח סחיר עד 25% מניות') THEN 'אג"ח סחיר עד 25% מניות'
    WHEN track IN ('עד 25% מניות') THEN 'עד 25% מניות'
    WHEN track IN ('משולב סחיר') THEN 'משולב סחיר'
    WHEN track IN ('מניות סחיר') THEN 'מניות סחיר'
    WHEN track IN ('הלכתי', 'הלכה') THEN 'הלכתי'
    WHEN track IN ('גילאי 50 ומטה', 'לבני 50 ומטה') THEN 'גילאי 50 ומטה'
    WHEN track IN ('גילאי 50–60', 'גילאי 50-60', 'לבני 50 עד 60', 'גילאי 50 עד 60') THEN 'גילאי 50–60'
    WHEN track IN ('גילאי 60 ומעלה', 'לבני 60 ומעלה') THEN 'גילאי 60 ומעלה'
    WHEN track IN ('סיכון גבוה') THEN 'סיכון גבוה'
    WHEN track IN ('סיכון בינוני') THEN 'סיכון בינוני'
    WHEN track IN ('סיכון נמוך') THEN 'סיכון נמוך'
    WHEN track IN ('קיימות') THEN 'קיימות'
    WHEN track IN ('שריעה / הלכה אסלאמית', 'שריעה') THEN 'שריעה / הלכה אסלאמית'
    WHEN track IS NOT NULL AND track != '' THEN 'אחר'
    ELSE NULL
  END,
  investment_track_custom = CASE
    WHEN track IS NOT NULL AND track != '' AND track NOT IN (
      'כללי', 'מסלול כללי', 'מניות', 'מסלול מניות', 'מנייתי',
      'עוקב S&P 500', 'עוקב מדד S&P500', 'עוקב S&P500', 'עוקב מדד S&P 500',
      'מדדי מניות', 'מסלול אג"ח', 'אגח', 'אג"ח', 'אג"ח ממשלות',
      'עוקב מדדי אג"ח', 'אג"ח סחיר', 'אג"ח סחיר עד 25% מניות',
      'עד 25% מניות', 'משולב סחיר', 'מניות סחיר', 'הלכתי', 'הלכה',
      'גילאי 50 ומטה', 'לבני 50 ומטה', 'גילאי 50–60', 'גילאי 50-60',
      'לבני 50 עד 60', 'גילאי 50 עד 60', 'גילאי 60 ומעלה', 'לבני 60 ומעלה',
      'סיכון גבוה', 'סיכון בינוני', 'סיכון נמוך', 'קיימות',
      'שריעה / הלכה אסלאמית', 'שריעה'
    ) THEN track
    ELSE NULL
  END,
  preferred_risk_level = CASE
    WHEN track ILIKE '%סיכון מוגבר%' OR track ILIKE '%סיכון גבוה%' THEN 'גבוה'
    WHEN track ILIKE '%סיכון בינוני%' THEN 'בינוני'
    WHEN track ILIKE '%סיכון מועט%' OR track ILIKE '%סיכון נמוך%' THEN 'נמוך'
    ELSE NULL
  END
WHERE track IS NOT NULL AND track != '';

-- Migrate existing recommended_track data in recommendations
UPDATE public.recommendations SET
  recommended_investment_track = CASE
    WHEN recommended_track IN ('כללי', 'מסלול כללי') THEN 'כללי'
    WHEN recommended_track IN ('מניות', 'מסלול מניות', 'מנייתי') THEN 'מניות'
    WHEN recommended_track IN ('עוקב S&P 500', 'עוקב מדד S&P500', 'עוקב S&P500', 'עוקב מדד S&P 500') THEN 'עוקב S&P 500'
    WHEN recommended_track IN ('מדדי מניות') THEN 'מדדי מניות'
    WHEN recommended_track IN ('מסלול אג"ח', 'אגח', 'אג"ח') THEN 'מסלול אג"ח'
    WHEN recommended_track IN ('אג"ח ממשלות') THEN 'אג"ח ממשלות'
    WHEN recommended_track IN ('עוקב מדדי אג"ח') THEN 'עוקב מדדי אג"ח'
    WHEN recommended_track IN ('אג"ח סחיר') THEN 'אג"ח סחיר'
    WHEN recommended_track IN ('אג"ח סחיר עד 25% מניות') THEN 'אג"ח סחיר עד 25% מניות'
    WHEN recommended_track IN ('עד 25% מניות') THEN 'עד 25% מניות'
    WHEN recommended_track IN ('משולב סחיר') THEN 'משולב סחיר'
    WHEN recommended_track IN ('מניות סחיר') THEN 'מניות סחיר'
    WHEN recommended_track IN ('הלכתי', 'הלכה') THEN 'הלכתי'
    WHEN recommended_track IN ('גילאי 50 ומטה', 'לבני 50 ומטה') THEN 'גילאי 50 ומטה'
    WHEN recommended_track IN ('גילאי 50–60', 'גילאי 50-60', 'לבני 50 עד 60', 'גילאי 50 עד 60') THEN 'גילאי 50–60'
    WHEN recommended_track IN ('גילאי 60 ומעלה', 'לבני 60 ומעלה') THEN 'גילאי 60 ומעלה'
    WHEN recommended_track IN ('סיכון גבוה') THEN 'סיכון גבוה'
    WHEN recommended_track IN ('סיכון בינוני') THEN 'סיכון בינוני'
    WHEN recommended_track IN ('סיכון נמוך') THEN 'סיכון נמוך'
    WHEN recommended_track IN ('קיימות') THEN 'קיימות'
    WHEN recommended_track IN ('שריעה / הלכה אסלאמית', 'שריעה') THEN 'שריעה / הלכה אסלאמית'
    WHEN recommended_track IS NOT NULL AND recommended_track != '' THEN 'אחר'
    ELSE NULL
  END,
  recommended_investment_track_custom = CASE
    WHEN recommended_track IS NOT NULL AND recommended_track != '' AND recommended_track NOT IN (
      'כללי', 'מסלול כללי', 'מניות', 'מסלול מניות', 'מנייתי',
      'עוקב S&P 500', 'עוקב מדד S&P500', 'עוקב S&P500', 'עוקב מדד S&P 500',
      'מדדי מניות', 'מסלול אג"ח', 'אגח', 'אג"ח', 'אג"ח ממשלות',
      'עוקב מדדי אג"ח', 'אג"ח סחיר', 'אג"ח סחיר עד 25% מניות',
      'עד 25% מניות', 'משולב סחיר', 'מניות סחיר', 'הלכתי', 'הלכה',
      'גילאי 50 ומטה', 'לבני 50 ומטה', 'גילאי 50–60', 'גילאי 50-60',
      'לבני 50 עד 60', 'גילאי 50 עד 60', 'גילאי 60 ומעלה', 'לבני 60 ומעלה',
      'סיכון גבוה', 'סיכון בינוני', 'סיכון נמוך', 'קיימות',
      'שריעה / הלכה אסלאמית', 'שריעה'
    ) THEN recommended_track
    ELSE NULL
  END
WHERE recommended_track IS NOT NULL AND recommended_track != '';
