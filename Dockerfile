# Build stage
FROM python:3.14.6-slim-trixie AS builder
COPY --from=ghcr.io/astral-sh/uv:0.11.21 /uv /uvx /bin/

WORKDIR /app

COPY . /app

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-editable --no-default-groups


FROM python:3.14.6-slim-trixie AS final

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --user-group --system --create-home --no-log-init app \
    && mkdir -p /app \
    && chown -R app:app /app

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

USER app
WORKDIR /app

COPY --chown=app:app src/ /app
COPY --chown=app:app --chmod=755 docker/start.sh /app/start.sh
COPY --from=builder --chown=app:app /app/.venv /app/.venv

EXPOSE 8000

CMD ["/app/start.sh"]
