FROM oven/bun:1
WORKDIR /app
COPY --chown=bun:bun index.ts ./
USER bun
ENV PORT=3000
EXPOSE 3000
CMD ["bun", "run", "index.ts"]
