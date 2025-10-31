
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    return NextResponse.json(data);
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
