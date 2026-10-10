# med-vqa-inference

The vision model server that runs bare-metal on the UCF CRCV cluster (A100), not in Docker. Owner: Jake.

The API (`services/med-vqa-api`) talks to it as an OpenAI-compatible endpoint: set `OPENAI_BASE_URL` (and `MODEL`) in `deploy/.env` to the cluster's ngrok URL. The pipeline has been tested against Qwen3.5-9B on vLLM; see `services/med-vqa-api/scripts/test_on_cluster.sbatch`.

Put the cluster launch scripts (SLURM job, vLLM or custom PyTorch server, ngrok tunnel) in this folder.
