import os

DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "lifeblood_db")

DATABASE_URL = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

JWT_SECRET = os.getenv("JWT_SECRET", "b07c1b9e-ff4e-4b59-8e33-abc123securekey@LifeBlood")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_SECONDS = 86400  # 24 hours, matches JwtUtil.java

BCRYPT_ROUNDS = 12

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
