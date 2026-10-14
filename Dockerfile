FROM oven/bun:1
WORKDIR /app
COPY --chown=bun:bun index.ts enterprise.mjs compare.mjs site.mjs intelligence.mjs intelligence-page.mjs research-extension.mjs research-api.mjs research-store.mjs research-collector.mjs research-ai.mjs ./
USER bun
ENV PORT=3000
EXPOSE 3000
CMD ["bun", "run", "index.ts"]
