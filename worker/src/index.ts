import { createClient } from "redis";

const client = createClient({ url: "redis://localhost:6379" });
const pubClient = createClient({ url: "redis://localhost:6379" }); // Publisher client

client.on("error", (err: Error) => {
  console.error("Redis Client Error", err);
});
pubClient.on("error", (err: Error) => {
  console.error("Redis Pub Client Error", err);
});

async function startWorker() {
  try {
    await client.connect();
    await pubClient.connect();
    console.log("Connected to Redis");

    while (true) {
      try {
        const response = await client.brPop("submissions", 0);
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate processing time
        if (response) {
          console.log("Received submission from queue:", response);
          const submission = JSON.parse(response?.element || "{}");
          console.log("Processing submission:", submission);

          // Simulate processing logic here...

          // Publish to pubsub channel
          await pubClient.publish("submission_processed", JSON.stringify(submission));
          console.log(
            `Published processed submission for problemId: ${submission.problemId}, userId: ${submission.userId}`
          );
        }
      } catch (error) {
        console.error("Error in worker loop:", error);
        // Optionally re-queue or log failed submissions here
      }
    }
  } catch (error) {
    console.error("Error starting worker:", error);
  }
}

startWorker();