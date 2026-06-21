\set ON_ERROR_STOP on

SELECT airline_id, COUNT(*) AS ancillary_count
FROM ancillaries
GROUP BY airline_id
ORDER BY airline_id;

SELECT airline_id, COUNT(*) AS meal_count
FROM meals
GROUP BY airline_id
ORDER BY airline_id;

SELECT flight_id, cabin_class_id, COUNT(*) AS assigned_ancillaries,
       COUNT(*) FILTER (WHERE available) AS available_ancillaries
FROM flight_cabin_ancillaries
GROUP BY flight_id, cabin_class_id
ORDER BY flight_id, cabin_class_id;

SELECT flight_id, COUNT(*) AS assigned_meals,
       COUNT(*) FILTER (WHERE available) AS available_meals
FROM flight_meals
GROUP BY flight_id
ORDER BY flight_id;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM flight_cabin_ancillaries WHERE price < 0 OR currency !~ '^[A-Z]{3}$') THEN
        RAISE EXCEPTION 'Invalid flight ancillary price or currency';
    END IF;
    IF EXISTS (SELECT 1 FROM flight_meals WHERE price < 0 OR currency !~ '^[A-Z]{3}$') THEN
        RAISE EXCEPTION 'Invalid flight meal price or currency';
    END IF;
    IF EXISTS (SELECT 1 FROM flight_cabin_ancillaries WHERE included_in_fare AND price <> 0) THEN
        RAISE EXCEPTION 'Included-in-fare ancillary still has a charge';
    END IF;
END $$;
