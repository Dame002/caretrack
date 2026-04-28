CREATE OR REPLACE FUNCTION public.generate_file_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE next_num INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SPLIT_PART(file_number, '-', 3) AS INT)), 0) + 1
  INTO next_num FROM public.patients
  WHERE file_number LIKE 'P-' || EXTRACT(YEAR FROM now()) || '-%';
  RETURN 'P-' || EXTRACT(YEAR FROM now()) || '-' || LPAD(next_num::TEXT, 4, '0');
END; $$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;