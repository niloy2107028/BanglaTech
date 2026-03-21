const Groq = require("groq-sdk");
const Product = require("../models/Product");
const Category = require("../models/Category");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ১. ডাটাবেস থেকে প্রোডাক্ট সার্চ করার ফাংশন (Tool function)
async function getProductsFromDB(query, categoryName) {
  let filter = {};
  if (query) {
    filter.$or = [
      { name: { $regex: query, $options: "i" } },
      { brand: { $regex: query, $options: "i" } },
      { categoryName: { $regex: query, $options: "i" } },
    ];
  }

  // যদি সরাসরি কি-ওয়ার্ডে ক্যাটাগরি না পাওয়া যায়, তবে ক্যাটাগরি কালেকশন সার্চ করা
  if (categoryName || query) {
    const catSearch = categoryName || query;
    const matchedCats = await Category.find({
      name: { $regex: catSearch, $options: "i" }
    }).select("_id");
    
    if (matchedCats.length > 0) {
      if (!filter.$or) filter.$or = [];
      filter.$or.push({ category: { $in: matchedCats.map(c => c._id) } });
    }
  }

  const products = await Product.find(filter).limit(20).lean();
  const baseUrl = "http://localhost:3000";
  
  if (products.length === 0) return "CRITICAL: No products were found in the official database for this specific search. You MUST inform the user that we don't have this item. DO NOT suggest any fake or placeholder names.";

  return products.map(p => 
    `- Name: ${p.name}\n  Price: ৳${p.price}\n  Stock: ${p.stock}\n  Image: ${p.image}\n  Link: ${baseUrl}/search?q=${encodeURIComponent(p.name)}`
  ).join("\n\n");
}

exports.getChatResponse = async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ message: "Message is required" });

    const models = [
      "llama-3.3-70b-versatile",
      "openai/gpt-oss-120b",
      "meta-llama/llama-4-scout-17b-16e-instruct",
      "qwen/qwen3-32b",
      "llama-3.3-70b-versatile",
    ];

    // এআই-এর জন্য টুলস ডেফিনেশন
    const tools = [
      {
        type: "function",
        function: {
          name: "get_products",
          description: "Search for products in the store based on name, brand, or category.",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Product name or keyword (e.g., 'laptop', 'shirt')" },
              category: { type: "string", description: "Category name (e.g., 'Electronics', 'Home and Living')" },
            },
            required: ["query"],
          },
        },
      },
    ];

    let messages = [
      {
        role: "system",
        content: `You are 'BanglaMart Bot', a highly reliable e-commerce assistant.
        STRICT RULES (FOLLOW OR BE TERMINATED):
        1. NO HALLUCINATION: You are FORBIDDEN from mentioning any product name, brand, or price that is NOT returned by the 'get_products' tool.
        2. IF NO RESULTS: If 'get_products' returns no products or says "CRITICAL: No products found", you MUST say "দুঃখিত, বর্তমানে আমাদের কাছে এই পণ্যটি নেই।" (Sorry, we don't have this item right now). NEVER invent or recommend non-existent items.
        3. EXPLICIT SEARCH ONLY: Use 'get_products' ONLY when the user asks for shopping data.
        4. SEARCH OPTIMIZATION: Translate user query to English for the tool (e.g., 'Home' for 'বাড়ি সাজানো').
        5. LANGUAGE: Respond in the user's language.
        6. FORMAT: When displaying products, you MUST show Name, Price, Image, and Link TOGETHER as one unit. DO NOT skip the name or price.
        TEMPLATE:
        **Product Name**
        Price: Price_Value
        ![Name](img_url)
        [View Product](link_url)
        ---`,
      },
      ...(history ? history.slice(-5) : []),
      { role: "user", content: message },
    ];

    let chatCompletion = null;
    let finalResponse = "";

    for (const model of models) {
      try {
        // প্রথম কল: এআই-কে টুল ব্যবহার করার সুযোগ দেওয়া
        chatCompletion = await groq.chat.completions.create({
          messages: messages,
          model: model,
          tools: tools,
          tool_choice: "auto",
        });

        const responseMessage = chatCompletion.choices[0].message;

        // যদি এআই টুল কল করতে চায় (Tool Call)
        if (responseMessage.tool_calls) {
          messages.push(responseMessage); // এআই-এর চিন্তা মেসেজ হিস্ট্রিতে যোগ করা

          for (const toolCall of responseMessage.tool_calls) {
            const args = JSON.parse(toolCall.function.arguments);
            const toolResult = await getProductsFromDB(args.query, args.category);

            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "get_products",
              content: toolResult,
            });
          }

          // দ্বিতীয় কল: টুল রেজাল্ট নিয়ে এআই-এর ফাইনাল উত্তর
          const secondResponse = await groq.chat.completions.create({
            messages: messages,
            model: model,
          });
          finalResponse = secondResponse.choices[0].message.content;
        } else {
          finalResponse = responseMessage.content;
        }

        if (finalResponse) break;
      } catch (err) {
        console.error(`Model ${model} failed:`, err.message);
        continue;
      }
    }

    if (!finalResponse) throw new Error("AI failed to respond.");

    // Qwen/Reasoning মডেলের জন্য <think> ট্যাগ ক্লিন করা
    const cleanReply = finalResponse.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    res.json({ reply: cleanReply });

  } catch (error) {
    console.error("Chatbot Error:", error);
    res.status(500).json({ reply: "দুঃখিত, আমি এই মুহূর্তে উত্তর দিতে পারছি না।" });
  }
};
