echo "DATABASE_URL is set to: "
cat ../../.env | awk '/^[[:blank:]]*DATABASE_URL/ {print}'
echo "\n"

echo "SECONDARY_DATABASE_URL is set to: "
cat ../../.env | awk '/^[[:blank:]]*SECONDARY_DATABASE_URL/ {print}'
