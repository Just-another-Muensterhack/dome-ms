# Seed websites, webservers and domains for the Keycloak user test2 via the API (with and without relations,
# incl. a soft deleted website and webserver).
# Needs the dev server running, safe to rerun: existing objects are skipped.
set -euo pipefail

API=${MSDOME_API_URL:-http://localhost:8000/api/v1}
TOKEN=$(curl -sf -X POST "${KEYCLOAK_URL:-http://keycloak:8080}/realms/${KEYCLOAK_REALM:-msdome}/protocol/openid-connect/token" \
    -d grant_type=password -d client_id=frontend-client -d username=test2 -d password=test -d scope=openid | jq -r .access_token)

api() { curl -s -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' "$@"; }

curl -sf -o /dev/null -H "Authorization: Bearer $TOKEN" "$API/websites/" || { echo "API not reachable at $API, is the server running?"; exit 1; }

# host <websites|webservers> <body json>, prints the id of the existing or created host with the name from the body
host() {
    local id name
    name=$(jq -r .name <<< "$2")
    id=$(api "$API/$1/" | jq -r --arg n "$name" '.[] | select(.name == $n) | .id')
    [ -n "$id" ] || id=$(api -X POST "$API/$1/" -d "$2" | jq -r '.id // empty')
    [ -n "$id" ] || { echo "${1%s} $name: failed" >&2; exit 1; }
    echo "${1%s} $name: $id" >&2
    echo "$id"
}

# seeded <websites|webservers>, whether an earlier run already created hosts of that kind
seeded() { [ "$(api "$API/$1/" | jq 'length')" -gt 0 ]; }

# deleted_host <websites|webservers> <already seeded> <body json>
# Soft deleted hosts are hidden from the API and free their name, so they are only created on the first run.
deleted_host() {
    local id name
    name=$(jq -r .name <<< "$3")
    if [ "$2" = true ]; then
        echo "${1%s} $name: seeded before, skipped"
        return
    fi
    id=$(api -X POST "$API/$1/" -d "$3" | jq -r '.id // empty')
    [ -n "$id" ] || { echo "${1%s} $name: failed"; exit 1; }
    api -X DELETE "$API/$1/$id"
    echo "${1%s} $name: created and soft deleted"
}

# website <name> <description> <tags json>
website() {
    host websites "$(jq -nc --arg n "$1" --arg d "$2" --argjson t "$3" '{name: $n, description: $d, tags: $t}')"
}

# webserver <name> <description> <tags json> <ipv4> <ipv6> <cname>, empty addresses are left unset
webserver() {
    host webservers "$(jq -nc --arg n "$1" --arg d "$2" --argjson t "$3" --arg v4 "$4" --arg v6 "$5" --arg c "$6" \
        '{name: $n, description: $d, tags: $t, ipv4: (if $v4 == "" then null else $v4 end), ipv6: (if $v6 == "" then null else $v6 end), cname: $c}')"
}

# domain <name> <wildcard> [website|webserver <host id>]
domain() {
    local code
    code=$(api -o /dev/null -w '%{http_code}' -X POST "$API/domains/" -d "$(jq -nc --arg n "$1" --argjson w "$2" --arg k "${3:-}" --arg s "${4:-}" \
        '{name: $n, wildcard: $w} + (if $k == "" then {} else {($k + "_id"): $s} end)')")
    case $code in
        201) echo "domain $1: created" ;;
        409|422) echo "domain $1: exists, skipped" ;;
        *) echo "domain $1: failed ($code)"; exit 1 ;;
    esac
}

SEEDED_WEBSITES=$(seeded websites && echo true || echo false)
SEEDED_WEBSERVERS=$(seeded webservers && echo true || echo false)

# Websites
BLOG=$(website 'Jane Smith Blog' 'Personal blog' '["blog", "personal"]')
CONSULTING=$(website 'Smith Consulting' 'Company website' '["business"]')
website 'Recipe Collection' 'Website without any domains' '["hobby"]' > /dev/null
deleted_host websites "$SEEDED_WEBSITES" '{"name": "Old Landing Page", "description": "Soft deleted, hidden from the API", "tags": ["archived"]}'

domain janes-blog.example.com false website "$BLOG"
domain www.janes-blog.example.com false website "$BLOG"
domain smith-consulting.example.org false website "$CONSULTING"
domain apps.smith-consulting.example.org true website "$CONSULTING"

# Webservers, covering every address combination
WEB01=$(webserver 'web-01' 'Main web server' '["production", "nginx"]' 203.0.113.10 2001:db8::10 '')
MAIL=$(webserver 'mail' 'Mail server, IPv4 only' '["production", "mail"]' 203.0.113.25 '' '')
CDN=$(webserver 'cdn-edge' 'Served through a CDN, CNAME only' '["cdn"]' '' '' edge.cdn.example.net)
webserver 'staging' 'Webserver without any domains, IPv6 only' '["staging"]' '' 2001:db8::20 '' > /dev/null
webserver 'backup' 'Webserver without any domains, all addresses' '["backup"]' 198.51.100.5 2001:db8::30 backup.hosting.example.net > /dev/null
deleted_host webservers "$SEEDED_WEBSERVERS" '{"name": "legacy-01", "description": "Soft deleted, hidden from the API", "tags": ["archived"], "ipv4": "192.0.2.99"}'

domain smith-shop.example.org false webserver "$WEB01"
domain www.smith-shop.example.org false webserver "$WEB01"
domain mail.smith-consulting.example.org false webserver "$MAIL"
domain static.example.com true webserver "$CDN"

# without a host
domain jane-smith.example.net false
domain parked.example.com false
domain sandbox.example.dev true
