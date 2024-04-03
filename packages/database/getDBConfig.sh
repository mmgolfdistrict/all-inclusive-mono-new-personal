cat ../../.env | awk '/^[[:blank:]]*DATABASE_URL/ {print}'

