import type { BasicEndpoints, DatabaseConfig, Query } from "./types.ts";

/**
 * Error class representing a failure in the MongoDB request.
 * This error is thrown when a request to the database fails for any reason.
 *
 * @example
 * const createDBRequest = createSendDBRequestFunction(config);
 *
 * try {
 * 	const dbRequest = new MongoDBRequest();
 * 	dbRequest.endpoint = '/find';
 * 	dbRequest.query = {
 * 		collection: 'books'
 * 	}
 * 	await sendDBRequest(dbRequest); // Error!
 * } catch(error) {
 * 	if (error instanceof MRHRequestError) {
 * 		console.error(error.name); // => MRHRequestError
 * 		console.error(error.message);
 * 		// =>
 * 		//	Error: Database request failed <Error message from MongoDB server>
 * 		//	Endpoint: '/find'
 * 		//	Query: "{ 'collection': 'books' }"
 *
 * 		console.error(error.endpoint); // => '/find'
 * 		console.error(error.query); // => { collection: "books" }
 * 		console.error(error.mongoErrorMessage); // => Error message from MongoDB
 * 	}
 * }
 */
export class MRHRequestError extends Error {
  constructor(
    public endpoint: string,
    public query: Query,
    public mongoErrorMessage: string,
  ) {
    super(
      `Error: Database request failed ${mongoErrorMessage}\nEndpoint: ${endpoint}\Query: ${
        JSON.stringify(
          query,
        )
      }`,
    );
    this.name = this.constructor.name;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error class representing a missing required parameter error.
 * This error is thrown when a required parameter is missing from the MongoDB request.
 *
 * @example
 * const sendDBRequest = createSendDBRequestFunction(config);
 *
 * try {
 *  const dbRequest  = new MongoDBRequest();
 *  // MRHMissingParameterError is thrown because the endpoint is not set.
 *  dbRequest.endpoint = null;
 *
 *  // MRHMissingParameterError is thrown because the query is not set.
 *  // The query check occurs after the endpoint check.
 *  // So in this example, an endpoint error will be thrown.
 *  dbRequest.query = {};
 *
 *  await sendDBRequest(dbRequest);
 * } catch (error) {
 *  if (error instanceof MRHMissingParameterError) {
 *    console.error(error.name); // => Error: MRHMissingParameterError
 *    console.error(error.message); // => Error: Missing required paramter: Endpoint
 *  }
 * }
 */
export class MRHMissingParameterError extends Error {
  constructor(parameter: "Endpoint" | "Query") {
    super(`Error: Missing required parameter: ${parameter}`);
    this.name = this.constructor.name;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Represents a MongoDB request, allowing configuration of the endpoint and query.
 * This class serves as a base for creating MongoDB API requests, providing the
 * ability to set and get the endpoint, base query, and additional query parameters.
 *
 * @template T - A string literal type representing the allowed endpoints for the request.
 *
 * ### Basic usage:
 *
 * Example:
 *
 * ```ts
 * // Setup:
 * // Define your databaseConfig somewhere in your files
 * // and prepare your functions to send database requests.
 * // config.ts
 * const config: DatabaseConfig = {
 *  dataSource: '...'.
 *  database: '...',
 *  baseUrl: '...',
 *  apiKey: '...'
 * };
 *
 * const sendDBRequset = createSendDBRequestFunction(config);
 *
 * // books.ts
 * // 1. Create instance
 * const dbRequest = new MongoDBRequest();
 *
 * // 2. Set endpoint
 * dbRequest.endpoint = '/find'
 *
 * // 3. Set query
 * dbRequest.query = { collection: 'books' };
 *
 * // 4. Send request!
 * const result = sendDBRequest(dbReqeust);
 * // result.documents = [...some book documents]
 * ```
 *
 * ### Advanced topics:
 *
 * Custom reqeust class:
 *
 * If you have duplicate queries, you can resolve them by extending this class.
 *
 * Example:
 *
 * ```ts
 * class BookCollectionRequest extends MongoDBRequest {
 *  constructor() {
 *    super();
 *    this.baseQuery = {
 *      collection: 'books'
 *    }
 *  }
 * }
 *
 * const bookRequest = new BookCollectionRequest();
 *
 * bookRequest.endpoint = '/findOne';
 *
 * bookRequest.query = { filter: { _id: { $oid: '123' } } };
 *
 * console.log(bookRequest.fullQuery);
 * // Output: { collection: 'books', filter: { _id: '123' } }
 * ```
 */
export class MongoDBRequest<T extends BasicEndpoints = BasicEndpoints> {
  /**
   * The endpoint for the MongoDB API request.
   * Should be set to the appropriate endpoint such as '/find', '/findOne', etc.
   *
   * If you want to add your own endpoint type to the endpoint property, pass it a generic type in the MongoDBRequest class.
   *
   * @example
   * type CustomEndpoints = BasicEndpoints | '/custom-endpoint'
   *
   * const dbRequest = new MongoDBRequest<CustomEndpoints>();
   *
   * dbRequest.endpoint = '/custom-endpoint'; // endpoint property is type safe!
   */
  endpoint: T | null = null;

  /**
   * The base query parameters for the request.
   * This can include common parameters that are reused across multiple requests.
   */
  #baseQuery: Query = {};

  /**
   * The specific query parameters for the request.
   * These can override or extend the base query parameters.
   */
  query: Query = {};

  /**
   * Sets the base query parameters for the request.
   * These parameters are merged with the current base query.
   *
   * @example
   * class BookCollectionRequest extends MongoDBRequest {
   *  constructor() {
   *    super();
   *    this.baseQuery = {
   *      collection: 'books'
   *    }
   *  }
   * }
   *
   * const bookCollectionRequest = new BookCollectionRequest();
   *
   * bookCollectionRequest.endpoint = '/findOne';
   *
   * bookCollectionRequest.query = { filter: { $oid: '123' }};
   *
   * const book = await sendDBRequest(bookCollectionRequest);
   */
  set baseQuery(newBaseQuery: Query) {
    this.#baseQuery = { ...this.#baseQuery, ...newBaseQuery };
  }

  /**
   * Gets the current base query parameters.
   *
   * @example
   * class BookCollectionRequest extends MongoDBRequest {
   *  constructor() {
   *    super();
   *    this.baseQuery = {
   *      collection: 'books'
   *    }
   *  }
   * };
   *
   * const bookCollectionRequest = new BookCollectionRequest();
   *
   * bookCollectionRequest.endpoint = '/findOne';
   *
   * bookCollectionRequest.query = {
   *  filter: { _id: { $oid: '123' } }
   * };
   *
   * console.log(bookCollectionRequest.baseQuery);
   * // => { collection: 'books', filter: { _id: { $oid: '123' } } }
   */
  get baseQuery(): Query {
    return this.#baseQuery;
  }

  /**
   * Computes the full query by combining the base query and the specific query parameters.
   *
   * @example
   * class BookCollectionRequest extends MongoDBRequest {
   *  protected _baseQuery = { collection: 'books' }
   * }
   *
   * const bookCollectionRequest = new BookCollectionRequest();
   *
   * bookCollectionRequest.fullQuery // => { collection: 'books' }
   *
   * bookCollectionRequest.query = {
   *  filter: { _id: { $oid: '123' } }
   * };
   *
   * bookCollectionRequest.fullQuery;
   * // => { collection: 'books', filter: { $ oid: '123' }}
   */
  get fullQuery(): Query {
    return { ...this.baseQuery, ...this.query };
  }
}

/**
 * Creates a function to send MongoDB requests with a specific configuration.
 *
 * This function configures the necessary settings for sending a request to a MongoDB database,
 * including the base URL, data source, database name, and API key.
 * It returns a function that can be used to send requests with specific MongoDBRequest instances.
 *
 *  For more information on the values for each database configuration, see the [Getting Started with Deno & MongoDB](https://www.mongodb.com/developer/languages/javascript/getting-started-deno-mongodb/) video.
 *
 * @throws {MRHMissingParameterError} Throws an error if the request endpoint or query is missing.
 * @throws {MRHRequestError} Throws an error if the request fails due to a MongoDB server error.
 *
 * @example
 * const config: DatabaseConfig = {
 *   baseUrl: '...',
 *   dataSource: '...',
 *   database: '...',
 *   apiKey: '...'
 * };
 *
 * const sendDBRequest = createSendDBRequestFunction(config);
 *
 * try {
 *  const dbRequest = new MongoDBRequest();
 *
 *  dbRequest.endpoint = '/find';
 *  dbRequest.query = { collection: 'books' };
 *
 *  const result = await sendDBRequest(dbRequest);
 *  console.log(result.documents);
 * } catch (error) {
 *   if (error instanceof MRHMissingParameterError) {
 *      console.error(error.message);
 *   }
 *   if (error instanceof MRHRequestError) {
 *      console.error(error.message);
 *   } else {
 *      console.error('An unexpected error occurred:', error);
 *   }
 * }
 */
export function createSendDBRequestFunction({
  baseUrl,
  dataSource,
  database,
  apiKey,
}: DatabaseConfig) {
  return async function sendDBRequest<T>(request: MongoDBRequest): Promise<T> {
    if (!request.endpoint) {
      throw new MRHMissingParameterError("Endpoint");
    }

    if (!isExistQuery(request.fullQuery)) {
      throw new MRHMissingParameterError("Query");
    }

    const url = baseUrl + request.endpoint;
    const query = {
      dataSource,
      database,
      ...request.fullQuery,
    };

    const requestInit: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(query),
    };

    try {
      const response = await fetch(url, requestInit);
      const result = await response.json();
      return result;
    } catch (error) {
      throw new MRHRequestError(request.endpoint, request.fullQuery, error);
    }
  };
}

function isExistQuery(query: Query): boolean {
  return Object.keys(query).length > 0;
}
