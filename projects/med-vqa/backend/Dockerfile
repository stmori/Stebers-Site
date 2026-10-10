FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 FASTEMBED_CACHE=/models INDEX_DIR=/index
WORKDIR /srv
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# bake the query-embedding model into the image so the first request doesn't download it
RUN python -c "from fastembed import TextEmbedding; TextEmbedding('BAAI/bge-small-en-v1.5', cache_dir='/models')"
COPY app ./app
RUN useradd -m -u 1000 appuser && chown -R appuser /models
USER appuser
EXPOSE 8000
# one worker: the rate limiter is in memory
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--proxy-headers"]
