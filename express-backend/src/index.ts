import express from "express";
import { createClient } from "redis";

const client = createClient({url: "redis://localhost:6379"});
client.on("error", (err) => {
  console.error("Redis Client Error", err);
});

const app = express();

app.use(express.json());

app.post("/submit",  async(req, res) => {
    try {
        const { problemId, userId,code ,language } = req.body;
       //push this to a database prisma,submission.create();
      await client.lPush("submissions", JSON.stringify({ problemId, userId, code, language }));
       res.status(201).json({ message: "Submission received" });
    } catch (error) {
        console.error("Error in /submit:", error);
        res.status(500).json({ error: "Internal Server Error" });
        
    }
});


async function startServer() {
  try {
    await client.connect();
    console.log("Connected to Redis");

    const port = 8080;


    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

startServer();
