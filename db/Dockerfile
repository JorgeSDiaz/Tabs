FROM postgres:17-alpine

ENV POSTGRES_USER=tabs \
    POSTGRES_PASSWORD=tabs \
    POSTGRES_DB=tabs

HEALTHCHECK --interval=2s --timeout=5s --retries=10 \
  CMD pg_isready -U tabs -d tabs
