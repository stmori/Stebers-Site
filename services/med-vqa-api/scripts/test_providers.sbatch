#!/bin/bash
#SBATCH --job-name=medvqa_providers
#SBATCH --cpus-per-task=4
#SBATCH --mem=16G
#SBATCH --time=00:20:00
#SBATCH --output=/home/ja396977/knighthacks/medvqa_test_logs/%x_%j.out
#SBATCH --error=/home/ja396977/knighthacks/medvqa_test_logs/%x_%j.err
source /share/apps/anaconda3-2022.05/etc/profile.d/conda.sh
conda activate medvqa_env
export PYTHONIOENCODING=utf-8 INDEX_DIR=/home/ja396977/knighthacks/index_build/index_medquad FASTEMBED_CACHE=$HOME/.cache/fastembed
cd /home/ja396977/Steber-s-Website/services/med-vqa-api
echo "===== provider tests"; python -u scripts/test_providers.py 2>&1 | grep -E "PASS|FAIL|Error|Traceback"
echo "===== mock mode still works"
MOCK_LLM=1 python -c "
from fastapi.testclient import TestClient; import app.main as m
c=TestClient(m.app); print('health', c.get('/api/health').json())
r=c.post('/api/ask', files={'image':('a.jpg', open('fallback-ui/examples/openi_cxr_00.jpg','rb'),'image/jpeg')}, data={'question':'What is abnormal?'})
print('mock ask', r.status_code, [x['title'][:40] for x in r.json()['citations'][:2]])"
echo "===== openai provider still imports"
PROVIDER=openai OPENAI_API_KEY=x python -c "import app.llm as l; print('openai provider ->', l.provider.__name__)"
echo "===== real Claude Haiku call (key from deploy/.env, never printed)"
set -a; source /home/ja396977/Steber-s-Website/deploy/.env; set +a
export MOCK_LLM=0 RATE_PER_MIN=100
python -c "
from fastapi.testclient import TestClient; import app.main as m
c=TestClient(m.app)
r=c.post('/api/ask', files={'image':('a.jpg', open('fallback-ui/examples/openi_cxr_02.jpg','rb'),'image/jpeg')}, data={'question':'Is the heart enlarged?'})
b=r.json(); print('real ask', r.status_code, b.get('model'), b.get('timings_ms'), 'cited:', [x['n'] for x in b.get('citations',[]) if x['cited']])
print('answer start:', b.get('answer','')[:200])"
