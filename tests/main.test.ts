import {
  assertArrayIncludes,
  assertEquals,
  assertObjectMatch,
  assertRejects,
} from "@std/assert";
import { stub } from "@std/testing/mock";
import {
  createSendDBRequestFunction,
  MongoDBRequest,
  MRHMissingParameterError,
  MRHRequestError,
  type RequestResult,
} from "../mod.ts";
import {
  createFetchStubForDatabaseOperation,
  createFetchStubForRequestInitCheck,
} from "./fetch-stub.ts";
import {
  APP_ID,
  type Comment,
  databaseConfig,
  firstComment,
} from "./setting.ts";

const sendDBRequest = createSendDBRequestFunction(databaseConfig);

Deno.test("sendDBRequest function test", async (t) => {
  const fetchStub = createFetchStubForRequestInitCheck();
  try {
    await t.step("basic request", async () => {
      const dbReqeust = new MongoDBRequest();
      dbReqeust.endpoint = "/find";
      dbReqeust.query = { collection: "books" };

      const requestInit = (await sendDBRequest(dbReqeust)) as RequestInit;

      const expectedRequestBody = {
        dataSource: databaseConfig.dataSource,
        database: databaseConfig.database,
        collection: "books",
      };

      assertEquals(requestInit?.body, JSON.stringify(expectedRequestBody));
    });

    await t.step("extends request class request", async () => {
      class BookCollectionRequest extends MongoDBRequest {
        constructor() {
          super();
          this.baseQuery = { collection: "books" };
        }
      }

      const bookCollectionReqeust = new BookCollectionRequest();

      bookCollectionReqeust.endpoint = "/find";

      const requestInit = (await sendDBRequest(
        bookCollectionReqeust,
      )) as RequestInit;

      const expectedRequestBody = {
        dataSource: databaseConfig.dataSource,
        database: databaseConfig.database,
        collection: "books",
      };

      assertEquals(requestInit?.body, JSON.stringify(expectedRequestBody));
    });
  } finally {
    fetchStub.restore();
  }
});

Deno.test("MongoDBRequest object tests", async (t) => {
  await t.step("should set and get headers correctly", () => {
    const dbRequest = new MongoDBRequest();

    dbRequest.headers = { Authorization: "Bearer test-token" };

    assertEquals(dbRequest.headers, { Authorization: "Bearer test-token" });
  });

  await t.step("should set and get fullQuery correctly", () => {
    const dbRequest = new MongoDBRequest();

    dbRequest.baseQuery = { collection: "books" };

    dbRequest.query = { filter: { author: "Author Name" } };

    const expectedFullQuery = {
      collection: "books",
      filter: { author: "Author Name" },
    };

    assertEquals(dbRequest.fullQuery, expectedFullQuery);
  });

  await t.step("should work with extended class", () => {
    class BookCollectionRequest extends MongoDBRequest {
      constructor() {
        super();
        this.baseQuery = { collection: "books" };
      }
    }

    const bookRequest = new BookCollectionRequest();

    bookRequest.endpoint = "/findOne";
    bookRequest.query = { filter: { _id: { $oid: "123" } } };

    const expectedFullQuery = {
      collection: "books",
      filter: { _id: { $oid: "123" } },
    };

    assertEquals(bookRequest.fullQuery, expectedFullQuery);

    assertEquals(bookRequest.endpoint, "/findOne");
  });

  await t.step("should merge baseQuery and query correctly", () => {
    const dbRequest = new MongoDBRequest();

    dbRequest.baseQuery = { collection: "movies", limit: 10 };

    dbRequest.query = { filter: { genre: "Sci-Fi" }, limit: 5 };

    const expectedFullQuery = {
      collection: "movies",
      filter: { genre: "Sci-Fi" },
      limit: 5,
    };

    assertEquals(dbRequest.fullQuery, expectedFullQuery);
  });
});

Deno.test("Basic operation test", async (t) => {
  let fetchStub;

  if (!APP_ID) {
    fetchStub = createFetchStubForDatabaseOperation();
  }

  try {
    const collection = "comments";

    let commentId = "";

    await t.step("insert a document", async () => {
      const dbRequest = new MongoDBRequest();

      dbRequest.endpoint = "/insertOne";
      dbRequest.query = {
        collection,
        document: firstComment,
      };

      const result = await sendDBRequest<RequestResult.InsertSingleDocument>(
        dbRequest,
      );

      commentId = result.insertedId;

      assertEquals(result, { insertedId: commentId });
    });

    await t.step("insert some documents", async () => {
      const comments: Comment[] = [
        {
          name: "Tester2",
          email: "test@example.com",
          movie_id: "2",
          text: "Test description...",
          date: new Date(),
        },
        {
          name: "Tester3",
          email: "test@example.com",
          movie_id: "3",
          text: "Test description...",
          date: new Date(),
        },
        {
          name: "Tester4",
          email: "test@example.com",
          movie_id: "4",
          text: "Test description...",
          date: new Date(),
        },
      ];

      const dbRequest = new MongoDBRequest();

      dbRequest.endpoint = "/insertMany";
      dbRequest.query = {
        collection,
        documents: comments,
      };

      const result = await sendDBRequest<RequestResult.InsertMultipleDocuments>(
        dbRequest,
      );

      const numberOfInsertedData = result.insertedIds.length;

      const numberOfOtherComments = comments.length;

      assertEquals(numberOfInsertedData, numberOfOtherComments);
    });

    await t.step("get a document", async () => {
      const dbRequest = new MongoDBRequest();

      dbRequest.endpoint = "/findOne";
      dbRequest.query = {
        collection,
        filter: {
          _id: { $oid: commentId },
        },
      };

      const { document } = await sendDBRequest<
        RequestResult.ReadSingleDocument<Comment>
      >(dbRequest);

      const responseComment = {
        ...firstComment,
        date: firstComment.date.toISOString(),
      };

      assertObjectMatch(document, responseComment);
    });

    await t.step("get some documents", async () => {
      const dbRequest = new MongoDBRequest();

      dbRequest.endpoint = "/find";
      dbRequest.query = {
        collection,
        sort: { date: 1 },
        limit: 5,
      };

      const { documents } = await sendDBRequest<
        RequestResult.ReadMultipleDocuments<Comment>
      >(dbRequest);

      const responseFirstComment = {
        _id: commentId,
        ...firstComment,
        date: firstComment.date.toISOString(),
      };

      assertArrayIncludes(documents, [responseFirstComment]);
    });

    await t.step("update a document", async () => {
      const dbRequest = new MongoDBRequest();

      dbRequest.endpoint = "/updateOne";
      dbRequest.query = {
        collection,
        filter: {
          _id: { $oid: commentId },
        },
        update: {
          $set: {
            text: "Updated comment",
          },
        },
      };

      const result = await sendDBRequest<RequestResult.UpdateOperation>(
        dbRequest,
      );

      assertEquals(result, {
        matchedCount: 1,
        modifiedCount: 1,
      });
    });

    await t.step("update some documents", async () => {
      const dbRequest = new MongoDBRequest();

      dbRequest.endpoint = "/updateMany";
      dbRequest.query = {
        collection,
        filter: {
          movie_id: { $gte: "2", $lte: "4" },
        },
        update: {
          $set: {
            text: "Updated comment",
          },
        },
      };

      const result = await sendDBRequest<RequestResult.UpdateOperation>(
        dbRequest,
      );

      assertEquals(result, {
        matchedCount: 3,
        modifiedCount: 3,
      });
    });

    await t.step("delete a document", async () => {
      const dbRequest = new MongoDBRequest();

      dbRequest.endpoint = "/deleteOne";
      dbRequest.query = {
        collection,
        filter: {
          _id: { $oid: commentId },
        },
      };

      const result = await sendDBRequest<RequestResult.DeleteOperation>(
        dbRequest,
      );

      assertEquals(result, { deletedCount: 1 });
    });

    await t.step("delete some documents", async () => {
      const dbRequest = new MongoDBRequest();

      dbRequest.endpoint = "/deleteMany";
      dbRequest.query = {
        collection,
        filter: {
          email: "test@example.com",
        },
      };

      const data = await sendDBRequest<RequestResult.DeleteOperation>(
        dbRequest,
      );

      assertEquals(data, { deletedCount: 3 });
    });
  } finally {
    if (fetchStub) fetchStub.restore();
  }
});

Deno.test("Request error handling test", async (t) => {
  let fetchStub = createFetchStubForDatabaseOperation();

  try {
    await t.step(
      "MRHMissingParameterError should be thrown when endpoint is missing",
      async () => {
        const dbRequest = new MongoDBRequest();

        dbRequest.query = { collection: "comments" };

        await assertRejects(
          () => sendDBRequest(dbRequest),
          MRHMissingParameterError,
        );
      },
    );

    await t.step(
      "MRHMissingParameterError should be thrown when query is missing",
      async () => {
        const dbRequest = new MongoDBRequest();

        dbRequest.endpoint = "/find";

        await assertRejects(
          async () => await sendDBRequest(dbRequest),
          MRHMissingParameterError,
        );
      },
    );

    await t.step(
      "MRHRequestError should be thrown on fetch failure",
      async () => {
        fetchStub.restore();

        fetchStub = stub(
          globalThis,
          "fetch",
          () => Promise.reject(new Error("Fetch failed")),
        );

        const dbRequest = new MongoDBRequest();

        dbRequest.endpoint = "/find";
        dbRequest.query = { collection: "comments" };

        await assertRejects(
          async () => await sendDBRequest(dbRequest),
          MRHRequestError,
        );
      },
    );
  } finally {
    fetchStub.restore();
  }
});

Deno.test("sendDBRequest function with headers test", async (t) => {
  const fetchStub = createFetchStubForRequestInitCheck();
  try {
    await t.step("should include custom headers in the request", async () => {
      const dbRequest = new MongoDBRequest();
      dbRequest.endpoint = "/find";
      dbRequest.query = { collection: "books" };
      dbRequest.headers = { "Custom-Header": "HeaderValue" };

      await sendDBRequest(dbRequest);

      const requestInit = (await sendDBRequest(dbRequest)) as RequestInit;

      const expectedHeaders = {
        "Content-Type": "application/json",
        "api-key": databaseConfig.apiKey,
        "Custom-Header": "HeaderValue",
      };

      assertEquals(requestInit?.headers, expectedHeaders);
    });
  } finally {
    fetchStub.restore();
  }
});
