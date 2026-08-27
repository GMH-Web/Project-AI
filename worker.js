export default {
  async fetch(request, env) {

    // Allow your GitHub website to call the Worker
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    // Handle browser CORS check
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({
          error: "Use POST /chat"
        }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    }

    try {

      const data = await request.json();

      const messages = data.messages || [];

      let conversation = "";

      for (const message of messages) {
        conversation +=
          `${message.role}: ${message.content}\n`;
      }

      const prompt = `
You are Nova, an advanced AI assistant.

You are:
- Intelligent
- Friendly
- Helpful
- Fast
- Good at programming
- Good at reasoning
- Clear and concise

Answer the user's questions directly.

Conversation:

${conversation}

Nova:
`;

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY
          },

          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ]
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return new Response(
          JSON.stringify({
            error:
              result.error?.message ||
              "Gemini request failed"
          }),
          {
            status: response.status,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );
      }

      const reply =
        result.candidates?.[0]?.content?.parts?.[0]?.text;

      return new Response(
        JSON.stringify({
          reply: reply || "Nova returned no response."
        }),
        {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );

    } catch (error) {

      return new Response(
        JSON.stringify({
          error: error.message
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    }
  }
};
