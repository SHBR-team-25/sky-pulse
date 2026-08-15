import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from pipeline.config import YT_PROXY, BASE_PATH

# На кластере хакатона команды пишут только в свою директорию
# //home/hackathon/<team> (см. setup/spyt-env.md), а не в общий //home.
TEAM_BASE_PATH = os.getenv('YT_BASE_PATH', BASE_PATH)

CLUSTER_CONFIG = {
    'proxy': os.getenv('YT_PROXY', YT_PROXY),
    'token': os.getenv('YT_TOKEN', ''),
    'pool': os.getenv('YT_POOL', 'default'),
    'worker_cores': int(os.getenv('WORKER_CORES', 8)),
    'worker_num': int(os.getenv('WORKER_NUM', 3)),
    'worker_memory': os.getenv('WORKER_MEMORY', '32G'),
}

PATHS = {
    'discovery': os.getenv('YT_DISCOVERY_PATH', f"{TEAM_BASE_PATH}/spark/discovery"),
    'code': os.getenv('YT_CODE_PATH', f"{TEAM_BASE_PATH}/spark/code"),
    'checkpoints': os.getenv('YT_CHECKPOINT_PATH', f"{TEAM_BASE_PATH}/spark/checkpoints"),
    'input': os.getenv('YT_INPUT_PATH', f"{TEAM_BASE_PATH}/input_stream"),
    'output': os.getenv('YT_OUTPUT_PATH', f"{TEAM_BASE_PATH}/output_stream"),
}