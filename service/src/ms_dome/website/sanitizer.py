"""Allowlist based sanitizer for generated HTML documents.

The language model output is untrusted: a prompt injection in the website description may trick the model into
emitting scripts, event handlers, forms that post elsewhere, redirects or external resources. The markup is cleaned
by nh3 (ammonia) and the document is rebuilt around it keeping only static HTML and CSS, so whatever the model
returns can not execute code.

nh3 cleans fragments and does not look into CSS: the title and the stylesheets are taken from the raw document,
the CSS is filtered by `sanitize_css`, and nh3 drops both elements with their content from the markup. Whatever
the extraction misses or takes too much ends up cleaned either as markup or as CSS.
"""

import re
from html import escape, unescape

import nh3

ALLOWED_TAGS = frozenset({
    # sections and text
    "header", "footer", "main", "nav", "section", "article", "aside", "div", "span", "p", "address",
    "h1", "h2", "h3", "h4", "h5", "h6", "a", "br", "hr", "wbr",
    "strong", "em", "b", "i", "u", "s", "small", "mark", "sub", "sup", "abbr", "time",
    "blockquote", "q", "cite", "code", "pre", "kbd", "samp", "var", "details", "summary", "button", "label",
    # lists and tables
    "ul", "ol", "li", "dl", "dt", "dd",
    "table", "caption", "colgroup", "col", "thead", "tbody", "tfoot", "tr", "th", "td",
    # media
    "img", "figure", "figcaption", "picture",
    # inline svg icons and decorations, nh3 matches svg names case sensitive
    "svg", "g", "path", "circle", "ellipse", "rect", "line", "polyline", "polygon", "text", "tspan",
    "defs", "linearGradient", "radialGradient", "stop", "clipPath", "mask", "pattern",
})

# dropped together with everything inside them, `style` and `title` are added back by `sanitize_html`
DROP_WITH_CONTENT = frozenset({
    "script", "style", "title", "noscript", "template", "iframe", "frame", "frameset", "object", "embed",
    "applet", "foreignObject", "math", "textarea", "select", "xmp", "noembed", "noframes", "plaintext",
})

SVG_ATTRIBUTES = frozenset({
    "viewBox", "xmlns", "width", "height", "preserveAspectRatio", "transform", "opacity",
    "fill", "fill-opacity", "fill-rule", "clip-rule", "stroke", "stroke-width", "stroke-opacity",
    "stroke-linecap", "stroke-linejoin", "stroke-dasharray", "stroke-dashoffset", "clip-path", "mask",
    "d", "cx", "cy", "r", "rx", "ry", "fx", "fy", "x", "y", "x1", "y1", "x2", "y2", "dx", "dy", "points",
    "offset", "stop-color", "stop-opacity", "gradientUnits", "gradientTransform", "spreadMethod",
    "patternUnits", "patternTransform", "maskUnits", "clipPathUnits",
    "font-size", "font-family", "font-weight", "text-anchor", "dominant-baseline", "focusable",
})
_SVG_TAGS = ALLOWED_TAGS & {
    "svg", "g", "path", "circle", "ellipse", "rect", "line", "polyline", "polygon", "text", "tspan",
    "defs", "linearGradient", "radialGradient", "stop", "clipPath", "mask", "pattern",
}

ALLOWED_ATTRIBUTES = {
    "*": {"id", "class", "style", "lang", "dir", "title", "role", "hidden", "tabindex"},
    "a": {"href", "target"},
    "img": {"src", "alt", "width", "height", "loading", "decoding"},
    "blockquote": {"cite"},
    "q": {"cite"},
    "time": {"datetime"},
    "ol": {"start", "reversed", "type"},
    "td": {"colspan", "rowspan", "headers"},
    "th": {"colspan", "rowspan", "headers", "scope", "abbr"},
    "col": {"span"},
    "colgroup": {"span"},
    "details": {"open"},
    "label": {"for"},
    "button": {"type"},
} | {tag: set(SVG_ATTRIBUTES) for tag in _SVG_TAGS}

URL_ATTRS = frozenset({"href", "src", "cite"})
# attributes whose value is CSS or may reference a resource with url(...)
CSS_ATTRS = frozenset({"style", "fill", "stroke", "clip-path", "mask"})

_SAFE_SCHEMES = ("http:", "https:", "mailto:", "tel:")
_DATA_IMAGE_RE = re.compile(r"^data:image/(png|jpeg|gif|webp|svg\+xml)[;,]")
# browsers ignore ASCII whitespace and control characters inside the scheme, e.g. "java\tscript:"
_URL_IGNORED_RE = re.compile(r"[\x00-\x20\x7f]+")

_STYLE_RE = re.compile(r"<style\b[^>]*>(.*?)(?:</style\s*>|$)", re.IGNORECASE | re.DOTALL)
_TITLE_RE = re.compile(r"<title\b[^>]*>(.*?)</title\s*>", re.IGNORECASE | re.DOTALL)
_LANG_RE = re.compile(r"<html\b[^>]*?\slang\s*=\s*[\"']?([a-zA-Z]{2,8}(?:-[a-zA-Z0-9]{1,8})*)[\"'\s>]", re.IGNORECASE)

_CSS_ESCAPE_RE = re.compile(r"\\([0-9a-fA-F]{1,6})\s?|\\(.)", re.DOTALL)
_CSS_COMMENT_RE = re.compile(r"/\*.*?(\*/|$)", re.DOTALL)
_CSS_IMPORT_RE = re.compile(r"@import[^;]*;?", re.IGNORECASE)
_CSS_URL_RE = re.compile(r"url\(\s*(['\"]?)(.*?)\1\s*\)", re.IGNORECASE | re.DOTALL)
_CSS_DANGEROUS_RE = re.compile(r"expression\s*\(|javascript:|vbscript:|-moz-binding|behavior\s*:", re.IGNORECASE)


def is_safe_url(url: str, *, allow_data_image: bool = False) -> bool:
    normalized = _URL_IGNORED_RE.sub("", url).lower()
    if not normalized or normalized.startswith(("#", "/", "./", "../", "?")):
        return not normalized.startswith("//")  # protocol relative URLs point to another host
    if normalized.startswith(_SAFE_SCHEMES):
        return True
    if allow_data_image and _DATA_IMAGE_RE.match(normalized):
        return True
    # relative path without a scheme, e.g. "about.html"
    scheme_end = normalized.find(":")
    return scheme_end == -1 or any(c in normalized[:scheme_end] for c in "/?#")


def _decode_css_escape(match: re.Match) -> str:
    if match.group(1):
        code = int(match.group(1), 16)
        return chr(code) if 0 < code <= 0x10FFFF and not 0xD800 <= code <= 0xDFFF else "\ufffd"
    return match.group(2)


def _sanitize_css_url(match: re.Match) -> str:
    url = match.group(2).strip()
    if not is_safe_url(url, allow_data_image=True) or url.lower().startswith(("mailto:", "tel:")):
        return "none"
    return 'url("{}")'.format(url.replace('"', "%22").replace("\n", ""))


def sanitize_css(css: str) -> str:
    # decode escapes first so "\69mport" or "j\61vascript" can not sneak past the filters below
    css = _CSS_ESCAPE_RE.sub(_decode_css_escape, css)
    css = _CSS_COMMENT_RE.sub("", css)
    css = _CSS_IMPORT_RE.sub("", css)
    css = _CSS_URL_RE.sub(_sanitize_css_url, css)
    css = _CSS_DANGEROUS_RE.sub("", css)
    # `<` is only valid inside strings, escaping it keeps `</style>` from closing the element early
    return css.replace("<", "\\3c ")


def _filter_attribute(tag: str, name: str, value: str) -> str | None:
    """Second line after nh3's allowlist, called with the decoded value, returning `None` drops the attribute."""
    if name in URL_ATTRS:
        # stricter than nh3's scheme check: no protocol relative URLs, data: only for images
        return value if is_safe_url(value, allow_data_image=tag == "img" and name == "src") else None
    if name in CSS_ATTRS:
        return sanitize_css(value)
    return value


def sanitize_html(document: str) -> str:
    """Return `document` reduced to static HTML and CSS."""
    lang = _LANG_RE.search(document)
    title = _TITLE_RE.search(document)
    css = "\n".join(sanitize_css(match.group(1)).strip() for match in _STYLE_RE.finditer(document))
    body = nh3.clean(
        document,
        tags=set(ALLOWED_TAGS),
        clean_content_tags=set(DROP_WITH_CONTENT),
        attributes=ALLOWED_ATTRIBUTES,
        attribute_filter=_filter_attribute,
        generic_attribute_prefixes={"aria-", "data-"},
        # `data` only passes nh3, `_filter_attribute` allows it for images only
        url_schemes={"http", "https", "mailto", "tel", "data"},
        strip_comments=True,
    )
    return (
        "<!DOCTYPE html>\n"
        f'<html lang="{lang.group(1) if lang else "de"}">\n'
        "<head>\n"
        '<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        f"<title>{escape(unescape(title.group(1)).strip()) if title else ''}</title>\n"
        f"<style>\n{css}\n</style>\n"
        "</head>\n"
        f"<body>\n{body.strip()}\n</body>\n"
        "</html>\n"
    )
