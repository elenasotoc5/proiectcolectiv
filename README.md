# Life Swap - Backend

## ⚙️ OpenAPI Generation
Do not write DTOs or API interfaces manually. 
1. Edit the API spec in `backend/src/main/resources/openapi.yaml`.
2. The build process auto-generates models and interfaces in `backend/target/generated-sources/openapi/`.
3. Implement the generated interfaces using `@RestController` classes (e.g., `HealthController`).

## 🚀 Quick Start
You can run the application either fully in Docker or locally on your machine. You don't need Maven installed globally, as the `Makefile` handles everything.

### Option 1: Run with Docker
Use this approach if you want to run the entire stack (Database + Backend) using containers without setting up anything else.

**Docker Commands:**
- **`make up`** — Starts the PostgreSQL database and the Backend server in the background.
- **`make down`** — Stops and removes all containers.

### Option 2: Run Locally
Use this approach if you prefer running the backend natively on your machine during development.

**Prerequisite:** Ensure you have a PostgreSQL server running locally on port `5432` with the correct credentials configured (from `.env`).

**Startup Commands (Required):**
1. **`make migrate`** — Applies the database schema. *(This is mandatory before starting the server locally).*
2. **`make run`** — Builds the project (including OpenAPI generation) and starts the backend server locally on port 8080.

**Development Commands (Optional):**
- **`make generate`** — Generates Java classes from the OpenAPI spec only. Use this when you modify `openapi.yaml` and want your IDE (VS Code/IntelliJ) to recognize the new classes without waiting for a full project compilation.
- **`make compile`** — Generates OpenAPI code and compiles the Java project. Use this to quickly check for compilation errors before running the application.

### Test the Server
Once the server is running (via Docker or locally), test the health endpoint:
```bash
curl http://localhost:8080/api/v1/health