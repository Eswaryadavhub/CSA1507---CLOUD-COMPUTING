"""
================================================================================
TourPulse: Database Seeder & Initial Population
================================================================================
Populates the persistent SQL database with:
- 3 Default Users (Admin, Analyst, Tourist)
- 32 Real City Attractions across 6 Indian Metropolitan Hubs
- 2,500+ Realistic Historical Check-in Records (Module 1/2/3/4 Data Foundation)
- Initial Pipeline Execution Log
================================================================================
"""

import datetime
import random
from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine, Base
from backend.models import User, Tourist, Attraction, Checkin, PipelineRun
from backend.auth import get_password_hash

ATTRACTIONS_SEED_DATA = [
    # Chennai
    {"name": "Marina Beach", "city": "Chennai", "category": "Nature/Beach", "latitude": 13.0475, "longitude": 80.2824, "capacity": 1500, "base_popularity": 96, "peak_start": 17, "peak_end": 20, "description": "Famous natural urban beach along the Bay of Bengal."},
    {"name": "Kapaleeshwarar Temple", "city": "Chennai", "category": "Heritage/Culture", "latitude": 13.0333, "longitude": 80.2694, "capacity": 800, "base_popularity": 89, "peak_start": 16, "peak_end": 19, "description": "Historic Dravidian-style Shiva temple located in Mylapore."},
    {"name": "Fort St. George", "city": "Chennai", "category": "Historical", "latitude": 13.0792, "longitude": 80.2917, "capacity": 600, "base_popularity": 78, "peak_start": 10, "peak_end": 13, "description": "The first English fortress in India, founded in 1644."},
    {"name": "Valluvar Kottam", "city": "Chennai", "category": "Monument", "latitude": 13.0528, "longitude": 80.2486, "capacity": 700, "base_popularity": 76, "peak_start": 14, "peak_end": 17, "description": "Monument dedicated to the classical Tamil poet-philosopher Thiruvalluvar."},
    {"name": "Government Museum", "city": "Chennai", "category": "Museum", "latitude": 13.0606, "longitude": 80.2562, "capacity": 900, "base_popularity": 83, "peak_start": 11, "peak_end": 15, "description": "Second oldest museum in India, renowned for Roman antiquities and bronzes."},
    {"name": "San Thome Basilica", "city": "Chennai", "category": "Heritage/Culture", "latitude": 13.0339, "longitude": 80.2785, "capacity": 650, "base_popularity": 81, "peak_start": 9, "peak_end": 12, "description": "Neo-Gothic church built over the tomb of St. Thomas the Apostle."},
    {"name": "Guindy National Park", "city": "Chennai", "category": "Nature/Wildlife", "latitude": 12.9982, "longitude": 80.2227, "capacity": 850, "base_popularity": 73, "peak_start": 7, "peak_end": 10, "description": "One of the very few national parks situated inside a city."},

    # Bengaluru
    {"name": "Lalbagh Botanical Garden", "city": "Bengaluru", "category": "Nature/Garden", "latitude": 12.9507, "longitude": 77.5844, "capacity": 1400, "base_popularity": 91, "peak_start": 7, "peak_end": 10, "description": "Famous botanical garden with historical glass house."},
    {"name": "Cubbon Park", "city": "Bengaluru", "category": "Nature/Garden", "latitude": 12.9739, "longitude": 77.5906, "capacity": 1600, "base_popularity": 90, "peak_start": 6, "peak_end": 9, "description": "Lush landmark green lung in the heart of Bengaluru."},
    {"name": "Bangalore Palace", "city": "Bengaluru", "category": "Historical", "latitude": 12.9988, "longitude": 77.5921, "capacity": 1000, "base_popularity": 85, "peak_start": 11, "peak_end": 14, "description": "Tudor-style royal residence built by King Chamaraja Wadiyar."},
    {"name": "Bannerghatta National Park", "city": "Bengaluru", "category": "Nature/Wildlife", "latitude": 12.8013, "longitude": 77.5777, "capacity": 1200, "base_popularity": 84, "peak_start": 10, "peak_end": 15, "description": "Biological reserve and zoo with safari circuits."},
    {"name": "Visvesvaraya Industrial Museum", "city": "Bengaluru", "category": "Museum", "latitude": 12.9754, "longitude": 77.5962, "capacity": 900, "base_popularity": 81, "peak_start": 11, "peak_end": 16, "description": "Interactive science and industrial technology exhibits."},

    # Hyderabad
    {"name": "Charminar", "city": "Hyderabad", "category": "Monument", "latitude": 17.3616, "longitude": 78.4747, "capacity": 1800, "base_popularity": 97, "peak_start": 16, "peak_end": 21, "description": "16th-century four-minaret mosque and global icon of Hyderabad."},
    {"name": "Golconda Fort", "city": "Hyderabad", "category": "Historical", "latitude": 17.3833, "longitude": 78.4011, "capacity": 1400, "base_popularity": 91, "peak_start": 15, "peak_end": 18, "description": "Magnificent medieval ruined fort city and diamond trading center."},
    {"name": "Hussain Sagar Lake", "city": "Hyderabad", "category": "Nature/Waterfront", "latitude": 17.4239, "longitude": 78.4738, "capacity": 1500, "base_popularity": 88, "peak_start": 17, "peak_end": 20, "description": "Heart-shaped lake featuring the giant monolithic Buddha statue."},
    {"name": "Birla Mandir", "city": "Hyderabad", "category": "Heritage/Culture", "latitude": 17.4062, "longitude": 78.4690, "capacity": 900, "base_popularity": 86, "peak_start": 16, "peak_end": 19, "description": "White Rajasthani marble temple on a high hillock."},
    {"name": "Salar Jung Museum", "city": "Hyderabad", "category": "Museum", "latitude": 17.3713, "longitude": 78.4804, "capacity": 1100, "base_popularity": 84, "peak_start": 11, "peak_end": 15, "description": "Major art museum holding the rare one-man antique collection."},

    # Mumbai
    {"name": "Gateway of India", "city": "Mumbai", "category": "Historical", "latitude": 18.9220, "longitude": 72.8347, "capacity": 2000, "base_popularity": 98, "peak_start": 16, "peak_end": 20, "description": "20th-century arch monument overlooking the Arabian Sea."},
    {"name": "Marine Drive", "city": "Mumbai", "category": "Nature/Waterfront", "latitude": 18.9431, "longitude": 72.8230, "capacity": 2500, "base_popularity": 97, "peak_start": 17, "peak_end": 22, "description": "C-shaped 3-kilometer promenade also known as the Queen's Necklace."},
    {"name": "Elephanta Caves", "city": "Mumbai", "category": "Heritage/Culture", "latitude": 18.9633, "longitude": 72.9315, "capacity": 800, "base_popularity": 83, "peak_start": 10, "peak_end": 14, "description": "UNESCO World Heritage rock-cut cave temples dedicated to Shiva."},
    {"name": "Chhatrapati Shivaji Terminus", "city": "Mumbai", "category": "Historical", "latitude": 18.9400, "longitude": 72.8354, "capacity": 1500, "base_popularity": 89, "peak_start": 8, "peak_end": 11, "description": "Historic Italian Gothic railway station and architectural marvel."},
    {"name": "Siddhivinayak Temple", "city": "Mumbai", "category": "Heritage/Culture", "latitude": 19.0169, "longitude": 72.8315, "capacity": 1300, "base_popularity": 92, "peak_start": 6, "peak_end": 11, "description": "Revered Hindu temple dedicated to Lord Shri Ganesha."},

    # Delhi
    {"name": "Red Fort", "city": "Delhi", "category": "Historical", "latitude": 28.6562, "longitude": 77.2410, "capacity": 1800, "base_popularity": 95, "peak_start": 10, "peak_end": 14, "description": "Historic red sandstone fortress and seat of the Mughal Emperors."},
    {"name": "Qutub Minar", "city": "Delhi", "category": "Monument", "latitude": 28.5244, "longitude": 77.1855, "capacity": 1400, "base_popularity": 93, "peak_start": 11, "peak_end": 15, "description": "Tallest brick minaret in the world surrounded by ancient ruins."},
    {"name": "India Gate", "city": "Delhi", "category": "Monument", "latitude": 28.6129, "longitude": 77.2295, "capacity": 2200, "base_popularity": 96, "peak_start": 17, "peak_end": 21, "description": "Grand war memorial arch situated along the Rajpath boulevard."},
    {"name": "Lotus Temple", "city": "Delhi", "category": "Heritage/Culture", "latitude": 28.5535, "longitude": 77.2588, "capacity": 1200, "base_popularity": 92, "peak_start": 10, "peak_end": 13, "description": "Flower-like Bahá'í House of Worship notable for architectural beauty."},
    {"name": "Humayun's Tomb", "city": "Delhi", "category": "Historical", "latitude": 28.5933, "longitude": 77.2507, "capacity": 950, "base_popularity": 88, "peak_start": 14, "peak_end": 17, "description": "Splendid garden tomb and architectural precursor to the Taj Mahal."},

    # Pune
    {"name": "Shaniwar Wada", "city": "Pune", "category": "Historical", "latitude": 18.5194, "longitude": 73.8553, "capacity": 1100, "base_popularity": 87, "peak_start": 10, "peak_end": 13, "description": "Historical 18th-century fortification seat of the Peshwa rulers."},
    {"name": "Aga Khan Palace", "city": "Pune", "category": "Historical", "latitude": 18.5524, "longitude": 73.9015, "capacity": 800, "base_popularity": 84, "peak_start": 11, "peak_end": 14, "description": "Italian arches and spacious lawns with Mahatma Gandhi memorial."},
    {"name": "Sinhagad Fort", "city": "Pune", "category": "Historical", "latitude": 18.3662, "longitude": 73.7558, "capacity": 1200, "base_popularity": 89, "peak_start": 6, "peak_end": 10, "description": "Historic hill fortress standing atop an isolated cliff of the Sahyadri."},
    {"name": "Dagdusheth Halwai Temple", "city": "Pune", "category": "Heritage/Culture", "latitude": 18.5165, "longitude": 73.8561, "capacity": 1000, "base_popularity": 91, "peak_start": 8, "peak_end": 12, "description": "Famous Ganesha temple attracting thousands of pilgrims daily."},
    {"name": "Osho Teerth Park", "city": "Pune", "category": "Nature/Garden", "latitude": 18.5369, "longitude": 73.8872, "capacity": 600, "base_popularity": 79, "peak_start": 15, "peak_end": 18, "description": "Serene Japanese-style Zen garden and water corridor."}
]

def seed_database():
    """Initializes tables and populates base seed data if not already present."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Users
        if db.query(User).count() == 0:
            print("[*] Seeding default platform user accounts...")
            users = [
                User(
                    name="Dr. S. Venkat (Admin)",
                    email="admin@tourpulse.com",
                    password_hash=get_password_hash("admin123"),
                    role="admin"
                ),
                User(
                    name="Ananya Sharma (Analyst)",
                    email="analyst@tourpulse.com",
                    password_hash=get_password_hash("analyst123"),
                    role="analyst"
                ),
                User(
                    name="Rahul Verma (Tourist)",
                    email="tourist@tourpulse.com",
                    password_hash=get_password_hash("tourist123"),
                    role="tourist"
                )
            ]
            db.add_all(users)
            db.commit()
            print("[+] 3 User accounts created (admin, analyst, tourist).")

        # 2. Seed Attractions
        if db.query(Attraction).count() == 0:
            print("[*] Seeding 32 city attractions...")
            attractions = [Attraction(**data) for data in ATTRACTIONS_SEED_DATA]
            db.add_all(attractions)
            db.commit()
            print(f"[+] {len(attractions)} Attractions successfully seeded.")

        # 3. Seed Checkins Telemetry
        if db.query(Checkin).count() == 0:
            print("[*] Generating persistent historical tourist check-in telemetry dataset...")
            all_attractions = db.query(Attraction).all()
            sources = ["GPS", "Travel App", "Check-in"]
            
            # Anchor reference date: current date
            base_date = datetime.date.today()
            checkin_records = []
            tourist_pool = [f"T-{i:05d}" for i in range(1, 350)]

            # Group attractions by city to generate realistic multi-attraction transit routes
            city_attractions_map = {}
            for a in all_attractions:
                city_attractions_map.setdefault(a.city, []).append(a)

            # Generate 2,800 realistic check-ins over the past 30 days
            random.seed(42) # Deterministic for consistent initial state
            for i in range(2800):
                # Pick a random tourist
                t_code = random.choice(tourist_pool)
                # Random city
                city = random.choices(
                    ["Chennai", "Bengaluru", "Hyderabad", "Mumbai", "Delhi", "Pune"],
                    weights=[0.25, 0.22, 0.18, 0.15, 0.12, 0.08]
                )[0]
                city_attrs = city_attractions_map[city]

                # Weight attraction pick by base popularity
                weights = [a.base_popularity for a in city_attrs]
                attr = random.choices(city_attrs, weights=weights)[0]

                # Offset date between 0 and 30 days ago
                day_offset = random.randint(0, 30)
                v_date = base_date - datetime.timedelta(days=day_offset)

                # Cluster hour near peak hours (70% probability)
                if random.random() < 0.70:
                    v_hour = random.randint(attr.peak_start, min(attr.peak_end + 1, 23))
                else:
                    v_hour = random.randint(6, 22)
                
                v_min = random.randint(0, 59)
                v_time = f"{v_hour:02d}:{v_min:02d}"
                v_timestamp = datetime.datetime.combine(v_date, datetime.time(v_hour, v_min))

                # Slight GPS coordinate jitter around attraction center
                lat_jitter = (random.random() - 0.5) * 0.0035
                lng_jitter = (random.random() - 0.5) * 0.0035
                
                duration = random.randint(45, 210)
                source = random.choice(sources)

                # Crowd level classification
                is_weekend = v_date.weekday() >= 5
                load = attr.base_popularity * (1.3 if is_weekend else 0.9)
                if v_hour >= attr.peak_start and v_hour <= attr.peak_end:
                    load *= 1.25

                if load > 100:
                    crowd = "High"
                elif load > 60:
                    crowd = "Moderate"
                else:
                    crowd = "Low"

                checkin_records.append(Checkin(
                    tourist_code=t_code,
                    attraction_id=attr.id,
                    attraction_name=attr.name,
                    city=city,
                    timestamp=v_timestamp,
                    visit_date=v_date,
                    visit_time=v_time,
                    latitude=round(attr.latitude + lat_jitter, 6),
                    longitude=round(attr.longitude + lng_jitter, 6),
                    source=source,
                    duration=duration,
                    crowd_level=crowd,
                    popularity_score=min(100, int(load))
                ))

            db.add_all(checkin_records)
            db.commit()
            print(f"[+] {len(checkin_records)} Tourist check-in records committed to persistent database.")

            # Initial Pipeline Run Log
            pipeline_run = PipelineRun(
                filename="initial_historical_telemetry_batch.csv",
                total_records=2800,
                valid_records=2800,
                invalid_records=0,
                duplicates_removed=0,
                processed_records=2800,
                execution_time_ms=142.6,
                mode="Local MapReduce Mode (PySpark Algorithm Equivalent)",
                status="Completed",
                error_summary="All 2,800 records validated against urban polygon boundaries and ingested."
            )
            db.add(pipeline_run)
            db.commit()
            print("[+] Initial PipelineRun audit entry created.")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
