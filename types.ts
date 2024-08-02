import type { MongoDBRequest } from "./mod.ts";

/**
 * Represents the configuration settings for connecting to a MongoDB database.
 * This configuration includes necessary details such as the base URL, data source,
 * database name, and API key.
 */
export interface DatabaseConfig {
  /**
   * The base URL of the MongoDB Data API endpoint.
   * This URL serves as the root for all API requests.
   * @example "https://data.mongodb-api.com/app/data-xxxx/endpoint/data/v1"
   */
  baseUrl: string;

  /**
   * The data source name for the MongoDB cluster.
   * This is typically the name of the MongoDB Atlas cluster.
   * @example "Cluster0"
   */
  dataSource: string;

  /**
   * The name of the specific database to connect to.
   * This specifies which database within the cluster the operations should target.
   * @example "myDatabase"
   */
  database: string;

  /**
   * The API key used for authenticating requests to the MongoDB Data API.
   * This key should be kept secure and not shared publicly.
   * @example "your-api-key"
   */
  apiKey: string;
}

/**
 * Represents a MongoDB document with a unique identifier.
 * The `_id` field is a string that uniquely identifies the document.
 */
export type Document = {
  /**
   * The unique identifier for the document.
   * This is typically a string representation of an ObjectId.
   * @example "507f1f77bcf86cd799439011"
   */
  _id: string;
};

/**
 * Represents a query object used in MongoDB operations.
 * This is a generic record type where keys are strings and values can be of any type.
 * It is used to specify the criteria for querying, updating, or deleting documents.
 */
export type Query = Record<string, unknown>;

/**
 * Represents the basic set of endpoint paths available in the MongoDB Data API.
 * These endpoints correspond to common database operations such as finding,
 * inserting, updating, and deleting documents.
 */
export type BasicEndpoints =
  | "/find"
  | "/findOne"
  | "/insertOne"
  | "/insertMany"
  | "/updateOne"
  | "/updateMany"
  | "/deleteOne"
  | "/deleteMany";

export type SendDBRequestFunction = <T>(request: MongoDBRequest) => Promise<T>