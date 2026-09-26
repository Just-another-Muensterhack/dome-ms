"""DNS lookups to prove the ownership of a domain."""

import hmac

import dns.exception
import dns.resolver
from django.conf import settings

# public resolvers instead of the system one, to avoid stale local caches
NAMESERVERS = ["1.1.1.1", "8.8.8.8"]
TIMEOUT_SECONDS = 5


def check_txt(record_name: str, expected: str) -> bool:
    """Whether a TXT record at `record_name` has exactly the value `expected`.

    Always true with `DEBUG` on, a development setup has no public DNS to publish the record in.
    """
    if settings.DEBUG:
        return True

    resolver = dns.resolver.Resolver(configure=False)
    resolver.nameservers = NAMESERVERS
    resolver.lifetime = TIMEOUT_SECONDS
    try:
        answers = resolver.resolve(record_name, "TXT")
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.resolver.NoNameservers, dns.exception.Timeout):
        return False
    for rdata in answers:
        value = b"".join(rdata.strings)  # long TXT values arrive in 255 byte chunks
        if hmac.compare_digest(value, expected.encode()):
            return True
    return False
