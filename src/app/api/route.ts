import { NextRequest, NextResponse } from "next/server";
import app from "../../../../server";

// Helper to run your Express app inside Next.js API Routes
const handleExpress = async (req: NextRequest): Promise<NextResponse> => {
  const url = new URL(req.url);
  const method = req.method;
  
  let body: any = null;
  if (method !== "GET" && method !== "HEAD") {
    try {
      body = await req.json();
    } catch {
      try {
        body = await req.text();
      } catch {
        body = undefined;
      }
    }
  }

  // Convert NextRequest headers to plain object
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return new Promise((resolve) => {
    let responseStatus = 200;
    let responseHeaders: Record<string, string> = {
      "Content-Type": "application/json"
    };

    const mockReq: any = {
      method,
      url: url.pathname + url.search,
      originalUrl: url.pathname + url.search,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
      headers,
      body,
      params: {},
    };

    const mockRes: any = {
      status(code: number) {
        responseStatus = code;
        return this;
      },
      setHeader(name: string, value: string) {
        responseHeaders[name] = value;
        return this;
      },
      writeHead(code: number, headers?: any) {
        responseStatus = code;
        if (headers) {
          Object.assign(responseHeaders, headers);
        }
        return this;
      },
      json(data: any) {
        resolve(NextResponse.json(data, { status: responseStatus, headers: responseHeaders }));
      },
      send(data: any) {
        if (typeof data === "object") {
          resolve(NextResponse.json(data, { status: responseStatus, headers: responseHeaders }));
        } else {
          resolve(new NextResponse(data, { status: responseStatus, headers: responseHeaders }));
        }
      },
      end(data?: any) {
        if (data) {
          resolve(new NextResponse(data, { status: responseStatus, headers: responseHeaders }));
        } else {
          resolve(new NextResponse(null, { status: responseStatus, headers: responseHeaders }));
        }
      }
    };

    try {
      app(mockReq, mockRes, (err: any) => {
        if (err) {
          resolve(NextResponse.json({ success: false, message: err.message || "Internal server error" }, { status: 500 }));
        } else {
          resolve(NextResponse.json({ success: false, message: "Route not found in Express" }, { status: 404 }));
        }
      });
    } catch (err: any) {
      resolve(NextResponse.json({ success: false, message: err.message || "Server execution failed" }, { status: 500 }));
    }
  });
};

export const GET = handleExpress;
export const POST = handleExpress;
export const PUT = handleExpress;
export const DELETE = handleExpress;
export const PATCH = handleExpress;