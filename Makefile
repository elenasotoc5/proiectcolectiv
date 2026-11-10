-include .env
export

MAVEN_VERSION = 3.10.0
MAVEN_URL = https://archive.apache.org/dist/maven/maven-3/$(MAVEN_VERSION)/binaries/apache-maven-$(MAVEN_VERSION)-bin.tar.gz

BIN_DIR = ./bin
MVN_BIN = $(BIN_DIR)/mvn
MAVEN_EXTRACT_DIR = $(BIN_DIR)/apache-maven-$(MAVEN_VERSION)

LINTER_VERSION = 2.0.0
LINTER_URL = https://github.com/google/google-java-format/releases/download/v$(LINTER_VERSION)/google-java-format-$(LINTER_VERSION)-all-deps.jar
LINTER_BIN = $(BIN_DIR)/linter

BACKEND_DIR = backend
BACKEND_POM = $(BACKEND_DIR)/pom.xml
BACKEND_BUILD_PATH = $(BIN_DIR)/$(BACKEND_DIR)

MAIN_CLASS = ubb.inothershoes.App

$(MVN_BIN):
	@mkdir -p $(BIN_DIR)
	curl -fsSL $(MAVEN_URL) | tar -xz -C $(BIN_DIR)
	ln -sf apache-maven-$(MAVEN_VERSION)/bin/mvn $(MVN_BIN)
	@chmod +x $(MAVEN_EXTRACT_DIR)/bin/mvn

.PHONY: get-maven
get-maven: $(MVN_BIN)

$(LINTER_BIN):
	@mkdir -p $(BIN_DIR)
	@rm -f $(LINTER_BIN)
	curl -fsSL $(LINTER_URL) -o $(BIN_DIR)/.linter.jar
	@printf '#!/bin/sh\nexec java -jar "$$0" "$$@"\n' > $(LINTER_BIN)
	@cat $(BIN_DIR)/.linter.jar >> $(LINTER_BIN)
	@rm -f $(BIN_DIR)/.linter.jar
	@chmod +x $(LINTER_BIN)

.PHONY: get-linter
get-linter: $(LINTER_BIN)

.PHONY: lint
lint: $(LINTER_BIN)
	@java_files=$$(find $(BACKEND_DIR)/src -name "*.java" 2>/dev/null); \
	if [ -z "$$java_files" ]; then \
		echo "No Java files found to lint."; \
	else \
		issues=$$($(LINTER_BIN) --dry-run $$java_files); \
		if [ -n "$$issues" ]; then \
			echo "Lint issues found:"; \
			tmp_dir=$$(mktemp -d); \
			trap 'rm -rf "$$tmp_dir"' EXIT; \
			for file in $$issues; do \
				target="$$tmp_dir/$$file"; \
				mkdir -p "$$(dirname "$$target")"; \
				cp "$$file" "$$target"; \
			done; \
			$(LINTER_BIN) --replace $$(find "$$tmp_dir" -name "*.java") >/dev/null 2>&1; \
			for file in $$issues; do \
				echo ""; \
				echo "=== Issues in $$file ==="; \
				diff -u --label "$$file" --label "$$file (formatted)" "$$file" "$$tmp_dir/$$file" || true; \
			done; \
			exit 1; \
		else \
			echo "All Java source files passed linting."; \
		fi \
	fi

.PHONY: lint-fix
lint-fix: $(LINTER_BIN)
	@java_files=$$(find $(BACKEND_DIR)/src -name "*.java" 2>/dev/null); \
	if [ -z "$$java_files" ]; then \
		echo "No Java files found to fix."; \
	else \
		$(LINTER_BIN) --replace $$java_files; \
		echo "Fixed lint issues in Java source files."; \
	fi

.PHONY: generate
generate: $(MVN_BIN)
	$(MVN_BIN) -f $(BACKEND_POM) clean generate-sources

.PHONY: compile
compile: $(MVN_BIN)
	$(MVN_BIN) -f $(BACKEND_POM) clean compile

.PHONY: build
build: $(MVN_BIN)
	$(MVN_BIN) -f $(BACKEND_POM) clean package
	@mkdir -p $(BACKEND_BUILD_PATH)
	cp $(BACKEND_DIR)/target/*.jar $(BACKEND_BUILD_PATH)/

.PHONY: run
run: build
	$(MVN_BIN) -f $(BACKEND_POM) exec:java -Dexec.mainClass="$(MAIN_CLASS)"

.PHONY: migrate
migrate: $(MVN_BIN)
	$(MVN_BIN) -f $(BACKEND_POM) flyway:migrate \
		-Dflyway.url=jdbc:postgresql://localhost:$(DB_PORT)/$(DB_NAME) \
		-Dflyway.user=$(DB_USER) \
		-Dflyway.password=$(DB_PASS)

.PHONY: up
up:
	docker compose up -d --build

.PHONY: down
down:
	docker compose down -v