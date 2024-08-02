import "@std/dotenv/load";
import type { DatabaseConfig } from "../mod.ts";

interface Comment {
  name: string;
  email: string;
  movie_id: string;
  text: string;
  date: Date;
}

const API_KEY = Deno.env.get("API_KEY") ?? "API_KEY_IS_NOT_SETTED";
const APP_ID = Deno.env.get("APP_ID");

console.log({ API_KEY, APP_ID });

const BASE_URL = APP_ID
  ? `https://ap-southeast-1.aws.data.mongodb-api.com/app/${APP_ID}/endpoint/data/v1/action`
  : "";

const databaseConfig: DatabaseConfig = {
  baseUrl: BASE_URL,
  dataSource: "Cluster0",
  database: "sample_mflix",
  apiKey: API_KEY,
};

const firstComment: Comment = {
  name: "Tester1",
  email: "test@example.com",
  movie_id: "1",
  text: "Test description...",
  date: new Date(),
};

export { API_KEY, APP_ID, type Comment, databaseConfig, firstComment };
