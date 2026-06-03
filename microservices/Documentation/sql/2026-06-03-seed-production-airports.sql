-- Production-style airport seed data for location-service.
-- Safe to re-run: iata_code is unique and rows are updated on conflict.
--
-- Run this after:
--   2026-06-03-seed-production-cities.sql
--
-- Expected table columns are generated from Airport entity:
-- airports(
--   id, iata_code, name, time_zone_id, street, postal_code, city_id,
--   latitude, longitude, traveler_score, annual_passengers,
--   destinations_count, size_category, airlines_count, on_time_performance
-- )

BEGIN;

WITH airport_seed (
    iata_code,
    name,
    city_code,
    time_zone_id,
    street,
    postal_code,
    latitude,
    longitude,
    traveler_score,
    annual_passengers,
    destinations_count,
    size_category,
    airlines_count,
    on_time_performance
) AS (
    VALUES
        -- Vietnam
        ('SGN', 'Tan Son Nhat International Airport', 'SGN', 'Asia/Ho_Chi_Minh', 'Truong Son Street, Tan Binh District', '700000', 10.8188, 106.6519, 88, 41000000.0, 80, 'LARGE', 45, 82.5),
        ('HAN', 'Noi Bai International Airport', 'HAN', 'Asia/Ho_Chi_Minh', 'Phu Minh, Soc Son District', '100000', 21.2187, 105.8042, 84, 29000000.0, 65, 'LARGE', 35, 83.0),
        ('DAD', 'Da Nang International Airport', 'DAD', 'Asia/Ho_Chi_Minh', 'Duy Tan Street, Hai Chau District', '550000', 16.0439, 108.1994, 81, 15000000.0, 35, 'MEDIUM', 22, 84.0),

        -- Southeast Asia
        ('BKK', 'Suvarnabhumi Airport', 'BKK', 'Asia/Bangkok', 'Bang Phli, Samut Prakan', '10540', 13.6900, 100.7501, 90, 60000000.0, 120, 'LARGE', 95, 78.5),
        ('DMK', 'Don Mueang International Airport', 'BKK', 'Asia/Bangkok', 'Vibhavadi Rangsit Road', '10210', 13.9126, 100.6070, 76, 30000000.0, 55, 'LARGE', 35, 77.0),
        ('HKT', 'Phuket International Airport', 'HKT', 'Asia/Bangkok', 'Mai Khao, Thalang District', '83110', 8.1132, 98.3169, 79, 18000000.0, 45, 'MEDIUM', 28, 80.0),
        ('SIN', 'Singapore Changi Airport', 'SIN', 'Asia/Singapore', 'Airport Boulevard', '819642', 1.3644, 103.9915, 98, 68000000.0, 150, 'LARGE', 100, 88.0),
        ('KUL', 'Kuala Lumpur International Airport', 'KUL', 'Asia/Kuala_Lumpur', 'Sepang', '64000', 2.7456, 101.7072, 87, 62000000.0, 110, 'LARGE', 75, 80.0),
        ('CGK', 'Soekarno-Hatta International Airport', 'JKT', 'Asia/Jakarta', 'Tangerang, Banten', '19120', -6.1275, 106.6537, 84, 54000000.0, 95, 'LARGE', 65, 76.5),
        ('DPS', 'I Gusti Ngurah Rai International Airport', 'DPS', 'Asia/Makassar', 'Jalan Raya Gusti Ngurah Rai', '80362', -8.7482, 115.1670, 82, 24000000.0, 50, 'MEDIUM', 35, 79.0),
        ('MNL', 'Ninoy Aquino International Airport', 'MNL', 'Asia/Manila', 'Pasay and Paranaque', '1300', 14.5086, 121.0194, 78, 45000000.0, 80, 'LARGE', 45, 70.0),

        -- East Asia
        ('HKG', 'Hong Kong International Airport', 'HKG', 'Asia/Hong_Kong', 'Chek Lap Kok', '999077', 22.3080, 113.9185, 92, 71000000.0, 160, 'LARGE', 110, 83.5),
        ('TPE', 'Taiwan Taoyuan International Airport', 'TPE', 'Asia/Taipei', 'Dayuan District, Taoyuan', '33758', 25.0797, 121.2342, 89, 48000000.0, 100, 'LARGE', 60, 84.0),
        ('NRT', 'Narita International Airport', 'TYO', 'Asia/Tokyo', 'Narita, Chiba', '282-0004', 35.7720, 140.3929, 91, 44000000.0, 120, 'LARGE', 85, 85.0),
        ('HND', 'Tokyo Haneda Airport', 'TYO', 'Asia/Tokyo', 'Ota City, Tokyo', '144-0041', 35.5494, 139.7798, 96, 85000000.0, 100, 'LARGE', 75, 90.0),
        ('KIX', 'Kansai International Airport', 'OSA', 'Asia/Tokyo', 'Senshu-kuko Kita, Izumisano', '549-0001', 34.4347, 135.2441, 87, 30000000.0, 80, 'LARGE', 55, 84.0),
        ('ICN', 'Incheon International Airport', 'SEL', 'Asia/Seoul', 'Jung-gu, Incheon', '22382', 37.4602, 126.4407, 95, 71000000.0, 140, 'LARGE', 90, 87.0),
        ('PEK', 'Beijing Capital International Airport', 'BJS', 'Asia/Shanghai', 'Chaoyang-Shunyi District', '100621', 40.0801, 116.5846, 88, 65000000.0, 120, 'LARGE', 80, 78.0),
        ('PVG', 'Shanghai Pudong International Airport', 'SHA', 'Asia/Shanghai', 'Pudong New Area', '201207', 31.1443, 121.8083, 90, 76000000.0, 140, 'LARGE', 90, 80.0),
        ('CAN', 'Guangzhou Baiyun International Airport', 'CAN', 'Asia/Shanghai', 'Huadu District', '510470', 23.3924, 113.2988, 86, 73000000.0, 110, 'LARGE', 75, 78.5),

        -- South Asia and Oceania
        ('BOM', 'Chhatrapati Shivaji Maharaj International Airport', 'BOM', 'Asia/Kolkata', 'Sahar Road, Mumbai', '400099', 19.0896, 72.8656, 84, 49000000.0, 90, 'LARGE', 60, 78.0),
        ('DEL', 'Indira Gandhi International Airport', 'DEL', 'Asia/Kolkata', 'New Delhi', '110037', 28.5562, 77.1000, 88, 69000000.0, 110, 'LARGE', 75, 79.5),
        ('BLR', 'Kempegowda International Airport', 'BLR', 'Asia/Kolkata', 'Devanahalli, Bengaluru', '560300', 13.1986, 77.7066, 86, 37000000.0, 75, 'LARGE', 50, 82.0),
        ('SYD', 'Sydney Kingsford Smith Airport', 'SYD', 'Australia/Sydney', 'Mascot', '2020', -33.9399, 151.1753, 90, 44000000.0, 95, 'LARGE', 55, 83.5),
        ('MEL', 'Melbourne Airport', 'MEL', 'Australia/Melbourne', 'Arrival Drive, Tullamarine', '3045', -37.6690, 144.8410, 88, 37000000.0, 80, 'LARGE', 45, 84.0),
        ('AKL', 'Auckland Airport', 'AKL', 'Pacific/Auckland', 'Ray Emery Drive, Mangere', '2022', -37.0082, 174.7850, 86, 21000000.0, 50, 'MEDIUM', 28, 85.0),

        -- Europe
        ('LHR', 'London Heathrow Airport', 'LON', 'Europe/London', 'Longford, Hounslow', 'TW6', 51.4700, -0.4543, 91, 79000000.0, 180, 'LARGE', 95, 76.0),
        ('LGW', 'London Gatwick Airport', 'LON', 'Europe/London', 'Horley, Gatwick', 'RH6', 51.1537, -0.1821, 83, 46000000.0, 90, 'LARGE', 55, 78.0),
        ('MAN', 'Manchester Airport', 'MAN', 'Europe/London', 'Manchester Airport', 'M90', 53.3650, -2.2722, 80, 29000000.0, 70, 'LARGE', 35, 80.0),
        ('CDG', 'Paris Charles de Gaulle Airport', 'PAR', 'Europe/Paris', 'Roissy-en-France', '95700', 49.0097, 2.5479, 90, 76000000.0, 170, 'LARGE', 95, 77.5),
        ('ORY', 'Paris Orly Airport', 'PAR', 'Europe/Paris', 'Orly', '94390', 48.7262, 2.3652, 78, 31000000.0, 60, 'LARGE', 35, 80.0),
        ('AMS', 'Amsterdam Schiphol Airport', 'AMS', 'Europe/Amsterdam', 'Evert van de Beekstraat', '1118 CP', 52.3105, 4.7683, 93, 71000000.0, 160, 'LARGE', 85, 82.0),
        ('FRA', 'Frankfurt Airport', 'FRA', 'Europe/Berlin', 'Frankfurt Airport', '60547', 50.0379, 8.5622, 91, 70000000.0, 170, 'LARGE', 95, 80.0),
        ('MUC', 'Munich Airport', 'MUC', 'Europe/Berlin', 'Nordallee 25', '85356', 48.3538, 11.7861, 90, 48000000.0, 110, 'LARGE', 60, 86.0),
        ('ZRH', 'Zurich Airport', 'ZRH', 'Europe/Zurich', 'Zurich Airport', '8058', 47.4647, 8.5492, 92, 31000000.0, 90, 'LARGE', 50, 87.0),
        ('MAD', 'Adolfo Suarez Madrid-Barajas Airport', 'MAD', 'Europe/Madrid', 'Avenida de la Hispanidad', '28042', 40.4983, -3.5676, 87, 61000000.0, 120, 'LARGE', 65, 81.0),
        ('BCN', 'Barcelona-El Prat Airport', 'BCN', 'Europe/Madrid', 'El Prat de Llobregat', '08820', 41.2974, 2.0833, 85, 52000000.0, 100, 'LARGE', 55, 82.0),
        ('FCO', 'Rome Fiumicino Airport', 'ROM', 'Europe/Rome', 'Via dell Aeroporto di Fiumicino', '00054', 41.8003, 12.2389, 84, 43000000.0, 95, 'LARGE', 55, 79.0),
        ('IST', 'Istanbul Airport', 'IST', 'Europe/Istanbul', 'Arnavutkoy', '34283', 41.2753, 28.7519, 91, 76000000.0, 160, 'LARGE', 90, 80.5),

        -- Middle East and Africa
        ('DXB', 'Dubai International Airport', 'DXB', 'Asia/Dubai', 'Airport Road, Garhoud', '2525', 25.2532, 55.3657, 94, 87000000.0, 180, 'LARGE', 100, 83.0),
        ('AUH', 'Zayed International Airport', 'AUH', 'Asia/Dubai', 'Abu Dhabi International Airport', '94449', 24.4539, 54.6511, 88, 24000000.0, 80, 'LARGE', 45, 84.0),
        ('DOH', 'Hamad International Airport', 'DOH', 'Asia/Qatar', 'Doha', '24659', 25.2731, 51.6080, 93, 45000000.0, 170, 'LARGE', 80, 86.0),
        ('RUH', 'King Khalid International Airport', 'RUH', 'Asia/Riyadh', 'Airport Road', '13458', 24.9576, 46.6988, 82, 28000000.0, 80, 'LARGE', 40, 79.0),
        ('JED', 'King Abdulaziz International Airport', 'JED', 'Asia/Riyadh', 'Jeddah', '23635', 21.6796, 39.1565, 83, 41000000.0, 90, 'LARGE', 45, 78.0),
        ('CAI', 'Cairo International Airport', 'CAI', 'Africa/Cairo', 'Heliopolis', '11776', 30.1120, 31.4000, 78, 17000000.0, 65, 'MEDIUM', 30, 74.0),
        ('JNB', 'O. R. Tambo International Airport', 'JNB', 'Africa/Johannesburg', 'Kempton Park', '1627', -26.1337, 28.2420, 84, 21000000.0, 80, 'LARGE', 45, 79.0),
        ('CPT', 'Cape Town International Airport', 'CPT', 'Africa/Johannesburg', 'Matroosfontein', '7490', -33.9715, 18.6021, 82, 11000000.0, 45, 'MEDIUM', 25, 82.0),

        -- North America
        ('JFK', 'John F. Kennedy International Airport', 'NYC', 'America/New_York', 'Queens, New York', '11430', 40.6413, -73.7781, 88, 62000000.0, 140, 'LARGE', 80, 74.0),
        ('EWR', 'Newark Liberty International Airport', 'NYC', 'America/New_York', 'Newark, New Jersey', '07114', 40.6895, -74.1745, 80, 46000000.0, 100, 'LARGE', 60, 70.0),
        ('BOS', 'Boston Logan International Airport', 'BOS', 'America/New_York', 'East Boston', '02128', 42.3656, -71.0096, 83, 42000000.0, 90, 'LARGE', 45, 78.0),
        ('MIA', 'Miami International Airport', 'MIA', 'America/New_York', 'Miami-Dade County', '33142', 25.7959, -80.2870, 84, 46000000.0, 120, 'LARGE', 65, 74.5),
        ('ORD', 'Chicago O Hare International Airport', 'CHI', 'America/Chicago', 'Chicago', '60666', 41.9742, -87.9073, 86, 73000000.0, 180, 'LARGE', 80, 70.0),
        ('DFW', 'Dallas Fort Worth International Airport', 'DFW', 'America/Chicago', 'International Parkway', '75261', 32.8998, -97.0403, 88, 81000000.0, 190, 'LARGE', 70, 76.0),
        ('DEN', 'Denver International Airport', 'DEN', 'America/Denver', '8500 Pena Boulevard', '80249', 39.8561, -104.6737, 87, 69000000.0, 170, 'LARGE', 65, 78.0),
        ('LAX', 'Los Angeles International Airport', 'LAX', 'America/Los_Angeles', '1 World Way', '90045', 33.9416, -118.4085, 87, 75000000.0, 170, 'LARGE', 85, 70.0),
        ('SFO', 'San Francisco International Airport', 'SFO', 'America/Los_Angeles', 'San Mateo County', '94128', 37.6213, -122.3790, 86, 57000000.0, 130, 'LARGE', 65, 74.0),
        ('SEA', 'Seattle-Tacoma International Airport', 'SEA', 'America/Los_Angeles', '17801 International Boulevard', '98158', 47.4502, -122.3088, 86, 50000000.0, 120, 'LARGE', 55, 78.5),
        ('YYZ', 'Toronto Pearson International Airport', 'YTO', 'America/Toronto', 'Mississauga, Ontario', 'L5P', 43.6777, -79.6248, 84, 50000000.0, 120, 'LARGE', 55, 76.0),
        ('YVR', 'Vancouver International Airport', 'YVR', 'America/Vancouver', 'Richmond, British Columbia', 'V7B', 49.1967, -123.1815, 88, 26000000.0, 80, 'LARGE', 40, 84.0),
        ('MEX', 'Mexico City International Airport', 'MEX', 'America/Mexico_City', 'Venustiano Carranza', '15620', 19.4361, -99.0719, 79, 46000000.0, 100, 'LARGE', 50, 70.0),

        -- Latin America
        ('GRU', 'Sao Paulo Guarulhos International Airport', 'SAO', 'America/Sao_Paulo', 'Guarulhos', '07190-100', -23.4356, -46.4731, 83, 43000000.0, 100, 'LARGE', 55, 75.0),
        ('GIG', 'Rio de Janeiro Galeao International Airport', 'RIO', 'America/Sao_Paulo', 'Galeao, Rio de Janeiro', '21941-570', -22.8090, -43.2506, 78, 13000000.0, 55, 'MEDIUM', 28, 76.0),
        ('EZE', 'Ministro Pistarini International Airport', 'BUE', 'America/Argentina/Buenos_Aires', 'Ezeiza, Buenos Aires', '1802', -34.8222, -58.5358, 80, 12000000.0, 60, 'MEDIUM', 30, 77.0),
        ('SCL', 'Arturo Merino Benitez International Airport', 'SCL', 'America/Santiago', 'Pudahuel, Santiago', '9020000', -33.3928, -70.7858, 82, 24000000.0, 70, 'LARGE', 35, 78.0),
        ('LIM', 'Jorge Chavez International Airport', 'LIM', 'America/Lima', 'Callao', '07031', -12.0219, -77.1143, 81, 23000000.0, 70, 'LARGE', 35, 77.0),
        ('BOG', 'El Dorado International Airport', 'BOG', 'America/Bogota', 'Fontibon, Bogota', '110911', 4.7016, -74.1469, 83, 35000000.0, 90, 'LARGE', 45, 76.5),
        ('PTY', 'Tocumen International Airport', 'PTY', 'America/Panama', 'Tocumen, Panama City', '0819', 9.0714, -79.3835, 82, 16000000.0, 85, 'MEDIUM', 30, 80.0)
)
INSERT INTO airports (
    iata_code,
    name,
    time_zone_id,
    street,
    postal_code,
    city_id,
    latitude,
    longitude,
    traveler_score,
    annual_passengers,
    destinations_count,
    size_category,
    airlines_count,
    on_time_performance
)
SELECT
    seed.iata_code,
    seed.name,
    seed.time_zone_id,
    seed.street,
    seed.postal_code,
    city.id,
    seed.latitude,
    seed.longitude,
    seed.traveler_score,
    seed.annual_passengers,
    seed.destinations_count,
    seed.size_category,
    seed.airlines_count,
    seed.on_time_performance
FROM airport_seed seed
JOIN cities city ON city.city_code = seed.city_code
ON CONFLICT (iata_code) DO UPDATE SET
    name = EXCLUDED.name,
    time_zone_id = EXCLUDED.time_zone_id,
    street = EXCLUDED.street,
    postal_code = EXCLUDED.postal_code,
    city_id = EXCLUDED.city_id,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    traveler_score = EXCLUDED.traveler_score,
    annual_passengers = EXCLUDED.annual_passengers,
    destinations_count = EXCLUDED.destinations_count,
    size_category = EXCLUDED.size_category,
    airlines_count = EXCLUDED.airlines_count,
    on_time_performance = EXCLUDED.on_time_performance;

SELECT setval(
    pg_get_serial_sequence('airports', 'id'),
    COALESCE((SELECT MAX(id) FROM airports), 1),
    true
);

COMMIT;
