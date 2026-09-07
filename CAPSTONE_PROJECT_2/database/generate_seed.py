import os
import random

# Seed strictly for reproducibility
random.seed(42)

attractions = [
    # Chennai
    ('Marina Beach', 'Chennai', 'Beach', 13.0475, 80.2824, 3000, 'World longest natural urban beach and historic promenade.'),
    ('Kapaleeshwarar Temple', 'Chennai', 'Religious', 13.0334, 80.2699, 1200, '7th century Dravidian architectural temple dedicated to Lord Shiva.'),
    ('Fort St. George', 'Chennai', 'Historical', 13.0797, 80.2872, 800, 'First English fortress in India founded in 1644.'),
    ('Guindy National Park', 'Chennai', 'Park', 13.0067, 80.2206, 900, 'Protected national park within city limits hosting blackbucks.'),
    ('San Thome Basilica', 'Chennai', 'Religious', 13.0337, 80.2782, 1000, 'Neo-Gothic church built over the tomb of Saint Thomas.'),
    ('Government Museum Chennai', 'Chennai', 'Museum', 13.0694, 80.2568, 1100, 'Human history and culture museum established in 1851.'),
    ('Elliot Beach', 'Chennai', 'Beach', 12.9998, 80.2709, 1800, 'Scenic southern end of the Marina coastline in Besant Nagar.'),

    # Bengaluru
    ('Lalbagh Botanical Garden', 'Bengaluru', 'Park', 12.9507, 77.5848, 2500, 'Century-old botanical garden with iconic glass house.'),
    ('Cubbon Park', 'Bengaluru', 'Park', 12.9764, 77.5929, 2800, 'Major green landmark lung of the central administrative area.'),
    ('Bangalore Palace', 'Bengaluru', 'Historical', 12.9988, 77.5921, 1400, 'Tudor-style royal estate inspired by Windsor Castle.'),
    ('Bannerghatta Biological Park', 'Bengaluru', 'Park', 12.8009, 77.5777, 2000, 'Wildlife sanctuary with safari, zoo, and butterfly park.'),
    ('ISKCON Temple Bangalore', 'Bengaluru', 'Religious', 13.0098, 77.5511, 2200, 'One of the largest Hindu temple complexes in the world.'),
    ('Visvesvaraya Industrial Museum', 'Bengaluru', 'Museum', 12.9752, 77.5963, 1200, 'Interactive science and technology exposition center.'),

    # Hyderabad
    ('Charminar', 'Hyderabad', 'Historical', 17.3616, 78.4747, 2600, 'Monument and mosque built in 1591 with four grand arches.'),
    ('Golconda Fort', 'Hyderabad', 'Historical', 17.3833, 78.4011, 2200, 'Medieval fortified citadel renowned for acoustic engineering.'),
    ('Hussain Sagar Lake', 'Hyderabad', 'Park', 17.4239, 78.4738, 2400, 'Heart-shaped lake featuring monolith Buddha statue.'),
    ('Salar Jung Museum', 'Hyderabad', 'Museum', 17.3713, 78.4804, 1500, 'Renowned art museum with collections across three continents.'),
    ('Birla Mandir Hyderabad', 'Hyderabad', 'Religious', 17.4062, 78.4691, 1300, 'White Rajasthani marble temple on Naubat Pahad hill.'),
    ('Ramoji Film City', 'Hyderabad', 'Park', 17.2543, 78.6808, 4000, 'Integrated film city and tourism recreation resort.'),

    # Mumbai
    ('Gateway of India', 'Mumbai', 'Historical', 18.9220, 72.8347, 3500, 'Iconic 20th century arch monument overlooking the Arabian Sea.'),
    ('Marine Drive', 'Mumbai', 'Beach', 18.9432, 72.8230, 4000, 'C-shaped concrete boulevard known as the Queen Necklace.'),
    ('Elephanta Caves', 'Mumbai', 'Historical', 18.9633, 72.9315, 1200, 'UNESCO World Heritage rock-cut cave temples on Gharapuri Island.'),
    ('Chhatrapati Shivaji Maharaj Vastu Museum', 'Mumbai', 'Museum', 18.9269, 72.8327, 1300, 'Prominent art and history museum in Indo-Saracenic style.'),
    ('Sanjay Gandhi National Park', 'Mumbai', 'Park', 19.2288, 72.9182, 2500, 'Extensive protected forest hosting ancient Kanheri Caves.'),
    ('Siddhivinayak Temple', 'Mumbai', 'Religious', 19.0169, 72.8303, 2000, 'Famous Hindu temple consecrated in 1801 dedicated to Lord Ganesha.'),

    # Delhi
    ('Red Fort', 'Delhi', 'Historical', 28.6562, 77.2410, 3200, 'Historic fortress palace of the Mughal dynasty in Old Delhi.'),
    ('Qutub Minar', 'Delhi', 'Historical', 28.5244, 77.1855, 2400, 'Tallest brick minaret in the world surrounded by ancient ruins.'),
    ('India Gate', 'Delhi', 'Historical', 28.6129, 77.2295, 3800, 'War memorial arch honoring fallen soldiers along Kartavya Path.'),
    ('Humayun Tomb', 'Delhi', 'Historical', 28.5933, 77.2507, 1600, 'Magnificent garden tomb precursor to the Taj Mahal.'),
    ('Lotus Temple', 'Delhi', 'Religious', 28.5535, 77.2588, 2500, 'Bahai House of Worship noted for flowerlike architecture.'),

    # Pune
    ('Shaniwar Wada', 'Pune', 'Historical', 18.5196, 73.8553, 1800, '18th-century seat of the Peshwa rulers of the Maratha Empire.'),
    ('Aga Khan Palace', 'Pune', 'Historical', 18.5523, 73.9015, 1200, 'Italian-arched palace notable as Mahatma Gandhi detention site.')
]

lines = []
lines.append("-- ==============================================================================")
lines.append("-- TourPulse: Academic Capstone Oracle Seed Dataset")
lines.append("-- Course: Cloud Computing & Big Data Analytics")
lines.append("-- DISCLAIMER: Synthetic demonstration dataset created for academic evaluation.")
lines.append("-- Does not contain real personal tracking data.")
lines.append("-- ==============================================================================")
lines.append("")
lines.append("PROMPT Seeding Users with Secure bcrypt Password Hashes...")
lines.append("INSERT INTO USERS (full_name, email, password_hash, role) VALUES ('System Administrator', 'admin@tourpulse.com', '$2b$12$vBFo6J.hvvNrU7lHD3E7gOe7cUeDUeSq9fGPy/6aUCljUbdYCDwwy', 'admin');")
lines.append("INSERT INTO USERS (full_name, email, password_hash, role) VALUES ('Senior Tourism Analyst', 'analyst@tourpulse.com', '$2b$12$8QtOUl6kvNDKVYsT6E3eEebntM8fHf/gzdj3YbpY9FqBuX60RDD4y', 'analyst');")
lines.append("INSERT INTO USERS (full_name, email, password_hash, role) VALUES ('Registered Visitor', 'tourist@tourpulse.com', '$2b$12$FrosNmZDUOuJ6nqVcOWy0.Wv5M8pPW4XV/V3RdlxICbNNQtlb5WeK', 'tourist');")
lines.append("")
lines.append("PROMPT Seeding 32 Monitored Attractions across 6 Metropolitan Regions...")
lines.append("")

for a in attractions:
    desc = a[6].replace("'", "''")
    lines.append(f"INSERT INTO ATTRACTIONS (attraction_name, city, category, latitude, longitude, capacity, description) VALUES ('{a[0]}', '{a[1]}', '{a[2]}', {a[3]}, {a[4]}, {a[5]}, '{desc}');")

lines.append("")
lines.append("PROMPT Seeding Tourist Device Identifiers...")
lines.append("")

sources = ['gps', 'travel_app', 'checkin']
for i in range(1, 151):
    code = f"T{i:04d}"
    dev = sources[i % 3]
    lines.append(f"INSERT INTO TOURISTS (tourist_code, device_type, source) VALUES ('{code}', '{dev}', '{dev}');")

lines.append("")
lines.append("PROMPT Seeding Deterministic Synthetic Check-in Records...")
lines.append("")

dates = [
    '2026-08-01', '2026-08-05', '2026-08-10', '2026-08-15', '2026-08-20',
    '2026-08-25', '2026-08-28', '2026-09-01', '2026-09-03', '2026-09-05'
]

checkin_count = 0
for idx, a in enumerate(attractions, 1):
    n_visits = int(a[5] / 150) + 25
    for v in range(n_visits):
        checkin_count += 1
        t_id = random.randint(1, 150)
        d = random.choice(dates)
        hour = random.choice([9, 10, 11, 14, 15, 16, 17, 18, 19, 20])
        minute = random.choice([0, 15, 30, 45])
        ts = f"{d} {hour:02d}:{minute:02d}:00"
        lat = a[3] + random.uniform(-0.005, 0.005)
        lng = a[4] + random.uniform(-0.005, 0.005)
        src = random.choice(sources)
        duration = random.randint(30, 180)
        crowd = 'High' if hour in [16, 17, 18, 19] and random.random() > 0.35 else ('Moderate' if hour in [11, 14, 15] else 'Low')
        lines.append(
            f"INSERT INTO CHECKINS (tourist_id, attraction_id, city, checkin_timestamp, latitude, longitude, source, visit_duration, crowd_level) "
            f"VALUES ({t_id}, {idx}, '{a[1]}', TO_TIMESTAMP('{ts}', 'YYYY-MM-DD HH24:MI:SS'), {lat:.6f}, {lng:.6f}, '{src}', {duration}, '{crowd}');"
        )

lines.append("")
lines.append("COMMIT;")
lines.append("PROMPT Seed script complete. All records inserted.")

os.makedirs("database", exist_ok=True)
with open("database/oracle_seed.sql", "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print(f"Generated database/oracle_seed.sql with {len(attractions)} attractions and {checkin_count} check-ins.")
