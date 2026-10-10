#!/bin/bash
#SBATCH --job-name=medvqa_apitest
#SBATCH --gres=gpu:1
#SBATCH --constraint="turing|ampere"
#SBATCH --exclude=c3-2,c3-3,c3-4,c3-5,c2-0
#SBATCH --cpus-per-task=8
#SBATCH --mem=48G
#SBATCH --time=00:45:00
#SBATCH --output=/home/ja396977/knighthacks/medvqa/scripts/logs/%x_%j.out
#SBATCH --error=/home/ja396977/knighthacks/medvqa/scripts/logs/%x_%j.err
# Test the real backend code on the cluster. Mock mode first, then the real two-call pipeline
# against a local OpenAI-compatible vLLM server (stand-in for the OpenAI API). Everything is localhost-only.
source /share/apps/anaconda3-2022.05/etc/profile.d/conda.sh
conda activate medvqa_env
export PYTHONIOENCODING=utf-8
R=/home/ja396977/knighthacks; L=$R/medvqa/scripts/logs; D=$R/demo_images
export INDEX_DIR=$R/index_build/index_medquad FASTEMBED_CACHE=$HOME/.cache/fastembed
cd $R/medvqa/backend
hostname; nvidia-smi --query-gpu=name --format=csv,noheader

echo "===== MOCK MODE"
MOCK_LLM=1 uvicorn app.main:app --host 127.0.0.1 --port 8080 > $L/api_mock_$SLURM_JOB_ID.log 2>&1 &
A=$!; until curl -s -o /dev/null http://127.0.0.1:8080/api/health; do sleep 2; kill -0 $A || { tail -30 $L/api_mock_$SLURM_JOB_ID.log; exit 1; }; done
python -u $R/medvqa/scripts/smoke_api.py http://127.0.0.1:8080 $D $L/smoke_mock.json --mock
kill $A; wait $A 2>/dev/null

echo "===== REAL PIPELINE (local vLLM ${TEST_MODEL:-Lingshu-7B} as the OpenAI-compatible engine)"
KEY=test-$RANDOM$RANDOM
DT=""; nvidia-smi --query-gpu=name --format=csv,noheader | grep -qi "RTX 6000\|2080" && DT="--dtype half"
HF_HUB_OFFLINE=1 vllm serve ${TEST_MODEL:-lingshu-medical-mllm/Lingshu-7B} --host 127.0.0.1 --port 8000 --api-key $KEY --served-model-name medvqa \
  --max-model-len 8192 --gpu-memory-utilization 0.92 --max-num-seqs 8 --limit-mm-per-prompt '{"image": 1}' \
  --reasoning-parser qwen3 --generation-config vllm $DT > $L/vllm_$SLURM_JOB_ID.log 2>&1 &
V=$!; until curl -s -o /dev/null -H "Authorization: Bearer $KEY" http://127.0.0.1:8000/v1/models; do sleep 5; kill -0 $V || { tail -20 $L/vllm_$SLURM_JOB_ID.log; exit 1; }; done
echo "vLLM ready"
OPENAI_API_KEY=$KEY OPENAI_BASE_URL=http://127.0.0.1:8000/v1 MODEL=medvqa \
LLM_EXTRA_BODY='{"chat_template_kwargs": {"enable_thinking": false}}' RATE_PER_MIN=100 \
  uvicorn app.main:app --host 127.0.0.1 --port 8080 > $L/api_real_$SLURM_JOB_ID.log 2>&1 &
A=$!; until curl -s -o /dev/null http://127.0.0.1:8080/api/health; do sleep 2; kill -0 $A || { tail -30 $L/api_real_$SLURM_JOB_ID.log; exit 1; }; done
python -u $R/medvqa/scripts/smoke_api.py http://127.0.0.1:8080 $D $L/smoke_real.json
kill $A $V; wait 2>/dev/null
echo TEST_DONE
