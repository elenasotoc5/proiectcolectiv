-include .env
export

MAVEN_VERSION = 3.10.0
MAVEN_URL = https://archive.apache.org/dist/maven/maven-3/$(MAVEN_VERSION)/binaries/apache-maven-$(MAVEN_VERSION)-bin.tar.gz

BIN_DIR = ./bin
MVN_BIN = $(BIN_DIR)/mvn
MAVEN_EXTRACT_DIR = $(BIN_DIR)/apache-maven-$(MAVEN_VERSION)

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