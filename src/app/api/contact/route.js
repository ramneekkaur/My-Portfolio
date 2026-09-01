export async function POST(request) {
  try {
    const body = await request.json();

    const { name, email, message } = body;

    if (!name || !email || !message) {
      return Response.json(
        { success: false, error: "All fields are required." },
        { status: 400 }
      );
    }

    console.log("New contact message:", {
      name,
      email,
      message,
      receivedAt: new Date().toISOString(),
    });

    return Response.json(
      {
        success: true,
        message: "Signal received successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: "Something went wrong.",
      },
      { status: 500 }
    );
  }
}