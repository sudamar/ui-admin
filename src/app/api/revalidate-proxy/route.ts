
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  try {
    const response = await fetch(url);
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    const text = await response.text();
    return NextResponse.json(
      {
        success: response.ok,
        status: response.status,
        body: text,
      },
      { status: response.status },
    );
  } catch (error) {
    console.error("Revalidate proxy error:", error);

    let message = `Falha ao revalidar ${url}`;
    let cause: string | undefined;

    if (error instanceof Error) {
      message = error.message || message;
      const errorCause = (error as { cause?: unknown }).cause;
      if (errorCause && typeof errorCause === "object" && "code" in errorCause) {
        cause = String((errorCause as Record<string, unknown>).code);
      }
    } else if (typeof error === "string") {
      message = error;
    }

    return NextResponse.json(
      {
        error: message,
        cause,
      },
      { status: 500 },
    );
  }
}
