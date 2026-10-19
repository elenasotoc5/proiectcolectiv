# proiectcolectiv

# Life Swap - Backend

## ⚙️ OpenAPI Generation
Do not write DTOs or API interfaces manually. 
1. Edit the API spec in `backend/src/main/resources/openapi.yaml`.
2. The build process auto-generates models and interfaces in `backend/target/generated-sources/openapi/`.
3. Implement the generated interfaces using `@RestController` classes (e.g., `HealthController`).

## 🚀 Quick Start
Use the included `Makefile` to run the project. You don't need Maven installed globally.

Command / Description
`make generate` => Generates Java classes from the OpenAPI spec only.
`make compile` => Generates OpenAPI code and compiles the project.
`make run` => Builds and starts the server on port 8080.

### Test the Server
Once the server is running, test the health endpoint:
```bash
curl http://localhost:8080/api/v1/health