.PHONY: setup run clean

VENV := .venv
PYTHON := $(VENV)/bin/python
PIP := $(VENV)/bin/pip

setup:
	python3 -m venv $(VENV)
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt
	@echo "Setup complete! Run 'make run' to generate simulation files."

run:
	$(PYTHON) games/revolver_survival/generator.py

clean:
	rm -rf $(VENV)
	rm -rf library/publish_files/*
	rm -rf library/books/*
	@echo "Cleaned up generated files."

test:
	$(PYTHON) games/revolver_survival/config.py
