# Seed websites and domains for the Keycloak user test2 via the API (with and without relations, incl. a soft deleted website).
# Needs the dev server running, safe to rerun: existing objects are skipped.
set -euo pipefail

API=${MSDOME_API_URL:-http://localhost:8000/api/v1}
TOKEN=$(curl -sf -X POST "${KEYCLOAK_URL:-http://keycloak:8080}/realms/${KEYCLOAK_REALM:-msdome}/protocol/openid-connect/token" \
    -d grant_type=password -d client_id=msdome-web -d username=test2 -d password=test -d scope=openid | jq -r .access_token)

api() { curl -s -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' "$@"; }

curl -sf -o /dev/null -H "Authorization: Bearer $TOKEN" "$API/websites/" || { echo "API not reachable at $API, is the server running?"; exit 1; }

# website <name> <description> <tags json>, prints the id of the existing or created website
website() {
    local id
    id=$(api "$API/websites/" | jq -r --arg n "$1" '.[] | select(.name == $n) | .id')
    [ -n "$id" ] || id=$(api -X POST "$API/websites/" -d "$(jq -nc --arg n "$1" --arg d "$2" --argjson t "$3" '{name: $n, description: $d, tags: $t}')" | jq -r '.id // empty')
    [ -n "$id" ] || { echo "website $1: failed" >&2; exit 1; }
    echo "website $1: $id" >&2
    echo "$id"
}

# deleted_website <name>, soft deleted websites are hidden from the API so they are only created once
deleted_website() {
    local id
    id=$(api -X POST "$API/websites/" -d "$(jq -nc --arg n "$1" '{name: $n, description: "Soft deleted, hidden from the API", tags: ["archived"]}')" | jq -r '.id // empty')
    if [ -n "$id" ]; then
        api -X DELETE "$API/websites/$id"
        echo "website $1: created and soft deleted"
    else
        echo "website $1: exists, skipped"
    fi
}

# domain <name> <wildcard> [website id]
domain() {
    local code
    code=$(api -o /dev/null -w '%{http_code}' -X POST "$API/domains/" -d "$(jq -nc --arg n "$1" --argjson w "$2" --arg s "${3:-}" '{name: $n, wildcard: $w, website_id: (if $s == "" then null else $s end)}')")
    case $code in
        201) echo "domain $1: created" ;;
        409|422) echo "domain $1: exists, skipped" ;;
        *) echo "domain $1: failed ($code)"; exit 1 ;;
    esac
}

BLOG=$(website 'Jane Smith Blog' 'Personal blog' '["blog", "personal"]')
CONSULTING=$(website 'Smith Consulting' 'Company website' '["business"]')
website 'Recipe Collection' 'Website without any domains' '["hobby"]' > /dev/null
deleted_website 'Old Landing Page'

domain janes-blog.example.com false "$BLOG"
domain www.janes-blog.example.com false "$BLOG"
domain smith-consulting.example.org false "$CONSULTING"
domain apps.smith-consulting.example.org true "$CONSULTING"

# without a website
domain jane-smith.example.net false
domain parked.example.com false
domain sandbox.example.dev true
