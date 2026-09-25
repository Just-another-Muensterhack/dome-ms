# Install claude Code
uv sync --all-groups

cd src/ms_dome
uv run python manage.py migrate
uv run python manage.py runserver 0.0.0.0:8000
cd -
