import { type Stub, stub } from "@std/testing/mock";
import { firstComment } from "./setting.ts";

export function createFetchStubForBodyCheck(): Stub<
  typeof globalThis,
  [input: string | URL | Request, init?: RequestInit],
  Promise<Response>
> {
  const imprementation = async (
    _: string | URL | Request,
    requestInit?: RequestInit,
  ): Promise<Response> => {
    if (!requestInit) {
      return Promise.resolve(
        new Response("Request init is Empty!", { status: 404 }),
      );
    }
    return await Promise.resolve(
      new Response(JSON.stringify(requestInit.body), { status: 200 }),
    );
  };

  return stub(globalThis, "fetch", imprementation);
}

export function createFetchStubForDatabaseOperation(): Stub<
  typeof globalThis,
  [input: string | URL | Request, init?: RequestInit],
  Promise<Response>
> {
  const imprementation = async (
    url: string | URL | Request,
  ): Promise<Response> => {
    if (!(typeof url === "string")) {
      return Promise.resolve(new Response("Invalid URL", { status: 404 }));
    }

    let response: Response;

    const mockData = {
      "/find": {
        status: 200,
        body: {
          documents: [
            {
              ...firstComment,
              _id: "1",
              date: firstComment.date.toISOString(),
            },
          ],
        },
      },
      "/findOne": {
        status: 200,
        body: {
          document: {
            ...firstComment,
            _id: "1",
            date: firstComment.date.toISOString(),
          },
        },
      },
      "/insertOne": {
        status: 200,
        body: { insertedId: "1" },
      },
      "/insertMany": {
        status: 200,
        body: { insertedIds: ["2", "3", "4"] },
      },
      "/updateOne": {
        status: 200,
        body: { matchedCount: 1, modifiedCount: 1 },
      },
      "/updateMany": {
        status: 200,
        body: { matchedCount: 3, modifiedCount: 3 },
      },
      "/deleteOne": {
        status: 200,
        body: { deletedCount: 1 },
      },
      "/deleteMany": {
        status: 200,
        body: { deletedCount: 3 },
      },
    };

    const route = Object.keys(mockData).find((key) => url.endsWith(key)) as
      | keyof typeof mockData
      | undefined;

    if (route && mockData[route]) {
      const { status, body } = mockData[route];
      response = new Response(JSON.stringify(body), { status });
    } else {
      response = new Response(null, { status: 404, statusText: "Not Found" });
    }

    return await Promise.resolve(response);
  };

  const fetchStub = stub(globalThis, "fetch", imprementation);

  return fetchStub;
}
