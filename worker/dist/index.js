"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const client = (0, redis_1.createClient)({ url: "redis://localhost:6379" });
const pubClient = (0, redis_1.createClient)({ url: "redis://localhost:6379" }); // Publisher client
client.on("error", (err) => {
    console.error("Redis Client Error", err);
});
pubClient.on("error", (err) => {
    console.error("Redis Pub Client Error", err);
});
function startWorker() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.connect();
            yield pubClient.connect();
            console.log("Connected to Redis");
            while (true) {
                try {
                    const response = yield client.brPop("submissions", 0);
                    yield new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate processing time
                    if (response) {
                        console.log("Received submission from queue:", response);
                        const submission = JSON.parse((response === null || response === void 0 ? void 0 : response.element) || "{}");
                        console.log("Processing submission:", submission);
                        // Simulate processing logic here...
                        // Publish to pubsub channel
                        yield pubClient.publish("submission_processed", JSON.stringify(submission));
                        console.log(`Published processed submission for problemId: ${submission.problemId}, userId: ${submission.userId}`);
                    }
                }
                catch (error) {
                    console.error("Error in worker loop:", error);
                    // Optionally re-queue or log failed submissions here
                }
            }
        }
        catch (error) {
            console.error("Error starting worker:", error);
        }
    });
}
startWorker();
