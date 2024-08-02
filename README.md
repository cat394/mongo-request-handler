# MongoDB Data API Request Handler (MRH)

![Kokomi, in school uniform with red twin-tailed hair and red eyes, says, "ORM? ODM? We don't need that!"](https://github.com/cat394/mongo-request-handler/blob/main/images/thumbnail.webp)

## Features

- **Simple**

  ORM? ODM? Driver? You don't need them. We already have the most powerful API
  on the web—the **Fetch API**.

- **Easy and Powerful**

  This handler reduces the verbosity that comes with the MongoDB Data API. You
  don't need to serialize queries with `JSON.stringify()` or deserialize query
  results with `.json()`.

  We don't abstract away the beauty of the MongoDB Data API.

  Write your queries as you like, and we will send them to MongoDB.

For setup, please refer to
[Getting Started with Deno & MongoDB](https://www.mongodb.com/developer/languages/javascript/getting-started-deno-mongodb/).

For more information about the
[MongoDB Data API](https://www.mongodb.com/docs/atlas/app-services/data-api/),
please see the official documentation.

## Installation

> [!CAUTION]
> Available for Node version 18 and above

NPM:

```bash
npx jsr add @kokomi/mongo-request-handler
```

PNPM:

```bash
pnpm dlx jsr add @kokomi/mongo-request-handler
```

Deno:

```bash
deno add @kokomi/mongo-request-handler
```

Yarn:

```bash
yarn dlx jsr add @kokomi/mongo-request-handler
```

Bun:

```bash
bunx jsr add @kokomi/mongo-request-handler
```

## Usage

1. **Define a database configuration object:**

   > You can easily get this data with MongoDB Compass. For more information, please watch the video [Getting Started with Deno & MongoDB](https://www.mongodb.com/developer/languages/javascript/getting-started-deno-mongodb/).

   ```ts
   import {
     createSendDBRequestFunction,
     type DatabaseConfig,
     MongoDBRequest,
   } from "@kokomi/mongo-request-handler";

   const config: DatabaseConfig = {
     baseUrl: "https://data.mongodb-api.com/app/data-<APP_ID>/endpoint/data/v1",
     dataSource: "Cluster0",
     database: "myDatabase",
     apiKey: "your-api-key",
   };
   ```

2. **Create a function to send the request:**

   ```ts
   const sendDBRequest = createSendDBRequestFunction(config);
   ```

3. **Create a request:**

   Making a request is simple.

   1. Create a request object:

      ```ts
      const dbRequest = new MongoDBRequest();
      ```

   2. Add a endpoint:

      Sets the endpoint following the base path for the MongoDB Data API.

      ```ts
      dbRequest.endpoint = "/find";
      ```

   3. Add a query:

      Set the query to send to that endpoint.

      For more information on queries, see the
      [MongoDB Data API example](https://www.mongodb.com/docs/atlas/app-services/data-api/examples/)
      or
      [Mongo DB Aggregation](https://www.mongodb.com/docs/manual/reference/operator/aggregation-pipeline/).

      ```ts
      dbRequest.query = { collection: "books" };
      ```

4. **Send request**

   Once you have filled in the request object with the necessary data, all you
   have to do is send it.

   The result of the request will already be deserialized.

   ```ts
   const result = sendDBRequest(dbRequest);

   console.log(result); // Output: { documents: [...some book documents] }
   ```

## Response type

If you want to add a type to the result of the request, pass that type as a
generic to the `sendDBRequest()` function.

The types for the request results of the basic endpoints provided by the MongoDB
Data API are exposed as `RequestResult`.

```ts
type Book = {
    name: string;
    price: number;
    publishDate: Date;
}

const dbRequest = new MongoDBRequest();

dbRequest.endpoint = '/findOne';

dbRequest.query = { collection: 'books', filter: { _id: $oid: '123'} };

const result = await sendDBRequest<RequestResult.ReadSingleDocument<Book>>();
/**
 * result = {
 *   _id: string;
 *   name: string;
 *   price: number;
 *   publishDate: string; // Date object saved in MongoDB is returned as an ISO8601 formatted string
 * }
 */
```

## Error Handling

There are two types of errors that can occur when executing the
`sendDBRequest()` method.

1. **MRHMissingParameterError**

   This occurs when the endpoint or query parameters are not set in the
   `dbRequest` object.

   - Case when the `endpoint` parameter is not set:

     ```ts
     try {
         const dbRequest = new MongoDBRequest();

         // dbRequest.endpoint = '/findOne'; The endpoint parameter is not set!

         dbRequest.query = { collection: 'books', filter: { _id: $oid: '123'} };

         const result = await dbRequest.send(); // MRHMissingParameterError!
     } catch(error) {
         if (error instanceof MRHMissingParameterError) {
             console.error(error.name); // Output: MRHMissingParameterError
             console.error(error.message); // Output: Missing required parameter: Endpoint
         }
     }
     ```

   - Case when the `query` parameter is not set:

     ```ts
     try {
       const dbRequest = new MongoDBRequest();

       dbRequest.endpoint = "/findOne";

       // dbRequest.query = { collection: 'books', filter: { _id: $oid: '123'} }; The query parameter is not set!

       const result = await dbRequest.send();
     } catch (error) {
       if (error instanceof MRHMissingParameterError) {
         console.error(error.name); // Output: MRHMissingParameterError
         console.error(error.message); // Output: Missing required parameter: Query
       }
     }
     ```

2. **MRHRequestError**

   This occurs when an error is returned as a response after sending the request
   to the database.

   ```ts
   try {
   const dbRequest = new MongoDBRequest();

   dbRequest.endpoint = '/findOne';

   dbRequest.query = { collection: 'books', filter: { _id: $oid: '123'} };

   const result = await dbRequest.send(); // Error!
   } catch(error) {
       if (error instanceof MRHRequestError) {
           console.error(error.name); // Output: MRHRequestError
           console.error(error.message);
           // Output:
           //	Error: Database request failed <Error message from MongoDB server>
           //	Endpoint: '/findOne'
           //	Query: "{ 'collection': 'books' }"

           console.error(error.endpoint); // Output: '/find'
           console.error(error.query); // Output: { collection: "books" }
           console.error(error.mongoErrorMessage); // Output: Error message from MongoDB
       }
   }
   ```

## Custom request class

Duplicate queries can be handled by extending the MongoDBRequest class.

```ts
class BookCollectionRequest extends MongoDBRequest {
  constructor() {
    this.baseQuery = {
      collection: "books",
    };
  }
}

const bookCollectionRequest = new BookCollectionRequest();

// Insert document
bookCollectionRequest.endpoint = "/InsertOne";
bookCollectionRequest.query = {
  document: {
    book_id: "123",
    name: "Book1",
    price: 800,
    publishDate: new Date("2024-08-02"),
  },
};

console.log(bookCollectionRequest.fullQuery);
/**
 * Output: {
 *    collection: 'books',
 *    document: { book_id: '123', name: 'Book1', price: 800 }
 * }
 */

await sendDBRequest(bookCollectionRequest);

// delete document
bookCollectionRequest.endpoint = "/deleteOne";

bookCollectionRequest.query = {
  filter: { book_id: "123" },
};
```

## Custom Endpoints

The `endpoint` property is of the `BasicEndpoints` type by default. You can
override this and set custom endpoints as the type of the `endpoint` property.

To do this, pass it as a generic type to the `createMongoDBClient()` function.

```ts
import { type BasicEndpoints } from "@kokomi/mongo-request-handler";

type CustomEndpoints = BasicEndpoints | "/custom-endpoint";

const dbRequest = new MongoDBRequest<CustomEndpoints>();

dbRequest.endpoint = "/custom-endpoint"; // Type is safe.
```

## Custom Headers

As of version 1.1.0, you can set custom headers on the MongoDBRequest object, allowing you to authenticate requests. For more information, see [MongoDB Data API Authentication](https://www.mongodb.com/docs/atlas/app-services/data-api/authenticate/).

```ts
function getUserProfile(ctx) {
  // Those function is fake.
  const accessToken = getAccessToken(ctx); 
  const usreId = getUserId(ctx);

  const dbRequest = new MongoDBRequest();

  dbRequest.endpoint = '/findOne';

  dbRequest.query = {
    collection: 'users',
    filter: { _id: { $oid: userId } }
  }

  dbRequest.headers = { Authorization: `Bearer ${accessToken}` };

  const result = await sendDBRequest(dbRequest);

  const user = result.document;

  return user;
}
```

## FAQ

**Q: What is the base URL?**

A: The base URL is the URL provided by MongoDB Data API for your database.

**Q: How do I handle authentication?**

A: The API key provided in the database configuration is used for
authentication.

**Q: Can I use this with any MongoDB database?**

A: Yes, as long as the MongoDB database is accessible via the Data API.

## License

MIT
