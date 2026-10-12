import app from "./app";
import { logger } from "./lib/logger";
import { startMedicalEmailWorker } from "./lib/business-notifications";
import { startRiskReviewEmailWorker } from "./lib/risk-notifications";
import { isLocalRuntime } from "./lib/local-runtime";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, isLocalRuntime() ? "127.0.0.1" : "0.0.0.0", (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  startMedicalEmailWorker();
  startRiskReviewEmailWorker();
});
