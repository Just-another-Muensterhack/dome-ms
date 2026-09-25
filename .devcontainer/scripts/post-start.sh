# Install claude Code

cd service/src/ms_dome/
uv sync --all-groups
uv run python manage.py migrate
uv run python manage.py runserver 0.0.0.0:8000
cd -
