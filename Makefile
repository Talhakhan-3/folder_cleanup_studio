.PHONY: install dev test ui lint format docker-build docker-up docker-down

install:
	pip install -e .

dev:
	pip install -e ".[dev]"

test:
	pytest tests/ -v

test-cov:
	pytest --cov=folder_cleanup tests/

ui:
	streamlit run src/folder_cleanup/ui.py

lint:
	ruff check src/

format:
	ruff format src/

docker-build:
	docker compose build

docker-up:
	docker compose up -d

docker-down:
	docker compose down
