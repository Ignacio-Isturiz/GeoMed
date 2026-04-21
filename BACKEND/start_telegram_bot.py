import logging
from pathlib import Path
import os
# Ensure TELEGRAM_BOT_TOKEN is taken from .env (prefer .env over existing process env)
def _load_token_from_envfile(env_path: Path) -> None:
    try:
        if not env_path.exists():
            return
        for line in env_path.read_text(encoding='utf-8').splitlines():
            if not line or line.strip().startswith('#'):
                continue
            if line.startswith('TELEGRAM_BOT_TOKEN'):
                parts = line.split('=', 1)
                if len(parts) == 2:
                    token = parts[1].strip()
                    if token:
                        os.environ['TELEGRAM_BOT_TOKEN'] = token
                        logging.getLogger(__name__).debug('Loaded TELEGRAM_BOT_TOKEN from .env')
                break
    except Exception:
        logging.getLogger(__name__).exception('Failed loading TELEGRAM_BOT_TOKEN from .env')

# Start script for running the Telegram bot with explicit DEBUG logs.
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

# Ensure .env is loaded from this directory (same behaviour as get_settings Config.env_file)
os.chdir(Path(__file__).resolve().parent)

# Load token from .env into process env (overrides existing Process env)
_load_token_from_envfile(Path(__file__).resolve().parent / '.env')

from app.services.telegram_bot import run_polling

if __name__ == '__main__':
    run_polling()
