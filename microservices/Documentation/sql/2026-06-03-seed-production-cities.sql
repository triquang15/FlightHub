-- Production-style city seed data for location-service.
-- Safe to re-run: city_code is unique and rows are updated on conflict.
-- Expected table columns are generated from City entity:
-- cities(id, name, city_code, country_code, country_name, region_code, time_zone_id)

BEGIN;

INSERT INTO cities (
    name,
    city_code,
    country_code,
    country_name,
    region_code,
    time_zone_id
) VALUES
    -- Asia Pacific
    ('Ho Chi Minh City', 'SGN', 'VN', 'Vietnam', 'APAC', 'Asia/Ho_Chi_Minh'),
    ('Hanoi', 'HAN', 'VN', 'Vietnam', 'APAC', 'Asia/Ho_Chi_Minh'),
    ('Da Nang', 'DAD', 'VN', 'Vietnam', 'APAC', 'Asia/Ho_Chi_Minh'),
    ('Bangkok', 'BKK', 'TH', 'Thailand', 'APAC', 'Asia/Bangkok'),
    ('Phuket', 'HKT', 'TH', 'Thailand', 'APAC', 'Asia/Bangkok'),
    ('Singapore', 'SIN', 'SG', 'Singapore', 'APAC', 'Asia/Singapore'),
    ('Kuala Lumpur', 'KUL', 'MY', 'Malaysia', 'APAC', 'Asia/Kuala_Lumpur'),
    ('Jakarta', 'JKT', 'ID', 'Indonesia', 'APAC', 'Asia/Jakarta'),
    ('Bali', 'DPS', 'ID', 'Indonesia', 'APAC', 'Asia/Makassar'),
    ('Manila', 'MNL', 'PH', 'Philippines', 'APAC', 'Asia/Manila'),
    ('Hong Kong', 'HKG', 'HK', 'Hong Kong', 'APAC', 'Asia/Hong_Kong'),
    ('Taipei', 'TPE', 'TW', 'Taiwan', 'APAC', 'Asia/Taipei'),
    ('Tokyo', 'TYO', 'JP', 'Japan', 'APAC', 'Asia/Tokyo'),
    ('Osaka', 'OSA', 'JP', 'Japan', 'APAC', 'Asia/Tokyo'),
    ('Seoul', 'SEL', 'KR', 'South Korea', 'APAC', 'Asia/Seoul'),
    ('Beijing', 'BJS', 'CN', 'China', 'APAC', 'Asia/Shanghai'),
    ('Shanghai', 'SHA', 'CN', 'China', 'APAC', 'Asia/Shanghai'),
    ('Guangzhou', 'CAN', 'CN', 'China', 'APAC', 'Asia/Shanghai'),
    ('Shenzhen', 'SZX', 'CN', 'China', 'APAC', 'Asia/Shanghai'),
    ('Mumbai', 'BOM', 'IN', 'India', 'APAC', 'Asia/Kolkata'),
    ('Delhi', 'DEL', 'IN', 'India', 'APAC', 'Asia/Kolkata'),
    ('Bengaluru', 'BLR', 'IN', 'India', 'APAC', 'Asia/Kolkata'),
    ('Sydney', 'SYD', 'AU', 'Australia', 'APAC', 'Australia/Sydney'),
    ('Melbourne', 'MEL', 'AU', 'Australia', 'APAC', 'Australia/Melbourne'),
    ('Auckland', 'AKL', 'NZ', 'New Zealand', 'APAC', 'Pacific/Auckland'),

    -- Europe
    ('London', 'LON', 'GB', 'United Kingdom', 'EUROPE', 'Europe/London'),
    ('Manchester', 'MAN', 'GB', 'United Kingdom', 'EUROPE', 'Europe/London'),
    ('Paris', 'PAR', 'FR', 'France', 'EUROPE', 'Europe/Paris'),
    ('Nice', 'NCE', 'FR', 'France', 'EUROPE', 'Europe/Paris'),
    ('Amsterdam', 'AMS', 'NL', 'Netherlands', 'EUROPE', 'Europe/Amsterdam'),
    ('Brussels', 'BRU', 'BE', 'Belgium', 'EUROPE', 'Europe/Brussels'),
    ('Frankfurt', 'FRA', 'DE', 'Germany', 'EUROPE', 'Europe/Berlin'),
    ('Munich', 'MUC', 'DE', 'Germany', 'EUROPE', 'Europe/Berlin'),
    ('Berlin', 'BER', 'DE', 'Germany', 'EUROPE', 'Europe/Berlin'),
    ('Zurich', 'ZRH', 'CH', 'Switzerland', 'EUROPE', 'Europe/Zurich'),
    ('Geneva', 'GVA', 'CH', 'Switzerland', 'EUROPE', 'Europe/Zurich'),
    ('Vienna', 'VIE', 'AT', 'Austria', 'EUROPE', 'Europe/Vienna'),
    ('Madrid', 'MAD', 'ES', 'Spain', 'EUROPE', 'Europe/Madrid'),
    ('Barcelona', 'BCN', 'ES', 'Spain', 'EUROPE', 'Europe/Madrid'),
    ('Rome', 'ROM', 'IT', 'Italy', 'EUROPE', 'Europe/Rome'),
    ('Milan', 'MIL', 'IT', 'Italy', 'EUROPE', 'Europe/Rome'),
    ('Athens', 'ATH', 'GR', 'Greece', 'EUROPE', 'Europe/Athens'),
    ('Istanbul', 'IST', 'TR', 'Turkey', 'EUROPE', 'Europe/Istanbul'),
    ('Copenhagen', 'CPH', 'DK', 'Denmark', 'EUROPE', 'Europe/Copenhagen'),
    ('Stockholm', 'STO', 'SE', 'Sweden', 'EUROPE', 'Europe/Stockholm'),
    ('Oslo', 'OSL', 'NO', 'Norway', 'EUROPE', 'Europe/Oslo'),
    ('Helsinki', 'HEL', 'FI', 'Finland', 'EUROPE', 'Europe/Helsinki'),
    ('Dublin', 'DUB', 'IE', 'Ireland', 'EUROPE', 'Europe/Dublin'),
    ('Lisbon', 'LIS', 'PT', 'Portugal', 'EUROPE', 'Europe/Lisbon'),
    ('Prague', 'PRG', 'CZ', 'Czech Republic', 'EUROPE', 'Europe/Prague'),
    ('Warsaw', 'WAW', 'PL', 'Poland', 'EUROPE', 'Europe/Warsaw'),

    -- Middle East and Africa
    ('Dubai', 'DXB', 'AE', 'United Arab Emirates', 'MEA', 'Asia/Dubai'),
    ('Abu Dhabi', 'AUH', 'AE', 'United Arab Emirates', 'MEA', 'Asia/Dubai'),
    ('Doha', 'DOH', 'QA', 'Qatar', 'MEA', 'Asia/Qatar'),
    ('Riyadh', 'RUH', 'SA', 'Saudi Arabia', 'MEA', 'Asia/Riyadh'),
    ('Jeddah', 'JED', 'SA', 'Saudi Arabia', 'MEA', 'Asia/Riyadh'),
    ('Tel Aviv', 'TLV', 'IL', 'Israel', 'MEA', 'Asia/Jerusalem'),
    ('Cairo', 'CAI', 'EG', 'Egypt', 'MEA', 'Africa/Cairo'),
    ('Casablanca', 'CAS', 'MA', 'Morocco', 'MEA', 'Africa/Casablanca'),
    ('Nairobi', 'NBO', 'KE', 'Kenya', 'MEA', 'Africa/Nairobi'),
    ('Johannesburg', 'JNB', 'ZA', 'South Africa', 'MEA', 'Africa/Johannesburg'),
    ('Cape Town', 'CPT', 'ZA', 'South Africa', 'MEA', 'Africa/Johannesburg'),

    -- North America
    ('New York', 'NYC', 'US', 'United States', 'NAM', 'America/New_York'),
    ('Boston', 'BOS', 'US', 'United States', 'NAM', 'America/New_York'),
    ('Washington', 'WAS', 'US', 'United States', 'NAM', 'America/New_York'),
    ('Miami', 'MIA', 'US', 'United States', 'NAM', 'America/New_York'),
    ('Chicago', 'CHI', 'US', 'United States', 'NAM', 'America/Chicago'),
    ('Dallas', 'DFW', 'US', 'United States', 'NAM', 'America/Chicago'),
    ('Houston', 'HOU', 'US', 'United States', 'NAM', 'America/Chicago'),
    ('Denver', 'DEN', 'US', 'United States', 'NAM', 'America/Denver'),
    ('Los Angeles', 'LAX', 'US', 'United States', 'NAM', 'America/Los_Angeles'),
    ('San Francisco', 'SFO', 'US', 'United States', 'NAM', 'America/Los_Angeles'),
    ('Seattle', 'SEA', 'US', 'United States', 'NAM', 'America/Los_Angeles'),
    ('Toronto', 'YTO', 'CA', 'Canada', 'NAM', 'America/Toronto'),
    ('Montreal', 'YMQ', 'CA', 'Canada', 'NAM', 'America/Toronto'),
    ('Vancouver', 'YVR', 'CA', 'Canada', 'NAM', 'America/Vancouver'),
    ('Mexico City', 'MEX', 'MX', 'Mexico', 'NAM', 'America/Mexico_City'),

    -- Latin America
    ('Sao Paulo', 'SAO', 'BR', 'Brazil', 'LATAM', 'America/Sao_Paulo'),
    ('Rio de Janeiro', 'RIO', 'BR', 'Brazil', 'LATAM', 'America/Sao_Paulo'),
    ('Buenos Aires', 'BUE', 'AR', 'Argentina', 'LATAM', 'America/Argentina/Buenos_Aires'),
    ('Santiago', 'SCL', 'CL', 'Chile', 'LATAM', 'America/Santiago'),
    ('Lima', 'LIM', 'PE', 'Peru', 'LATAM', 'America/Lima'),
    ('Bogota', 'BOG', 'CO', 'Colombia', 'LATAM', 'America/Bogota'),
    ('Panama City', 'PTY', 'PA', 'Panama', 'LATAM', 'America/Panama')
ON CONFLICT (city_code) DO UPDATE SET
    name = EXCLUDED.name,
    country_code = EXCLUDED.country_code,
    country_name = EXCLUDED.country_name,
    region_code = EXCLUDED.region_code,
    time_zone_id = EXCLUDED.time_zone_id;

SELECT setval(
    pg_get_serial_sequence('cities', 'id'),
    COALESCE((SELECT MAX(id) FROM cities), 1),
    true
);

COMMIT;
