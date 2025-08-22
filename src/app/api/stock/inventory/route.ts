import connect from "@/config/dbConfig";
import Product from "@/models/productModel";
import Stock from "@/models/stockModel";
import { NextRequest, NextResponse } from "next/server";
import { cors, handleCors } from "@/lib/cors";

connect();


export const GET = async (req: NextRequest) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const {searchParams} = new URL(req.url);
    const selectedCategory = searchParams.get("category");

    let query: any = {};
    if (selectedCategory && selectedCategory !== 'All' && selectedCategory !== 'All Categories') {
      query = { category: selectedCategory };
    }

    const products = await Product.find(query);
    const response = NextResponse.json({ products }, { status: 200 });
    
    // Add CORS headers
    Object.entries(cors(req)).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  } catch (error) {
    const response = NextResponse.json(
      {
        message: "Error fetching products",
      },
      { status: 500 }
    );
    
    // Add CORS headers to error response too
    Object.entries(cors(req)).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
};

export const POST = async (req: NextRequest) => {
  await connect();
  try {
    const body = await req.json();
    const { name, category } = body;
    
    // console.log(body);
    if (!name || !category) {
      return NextResponse.json(
        {
          message: "All feilds are required",
        },
        { status: 400 }
      );
    }
    const sizeSets: Record<string, string[]> = {
      Bras: ["28","30","32","34","36","38","40","42","44"],
      Panties: ["S","M","L","XL","XXL","3XL","4XL"]
    };
    const variants = (sizeSets[category] || []).map(size=>({
      size,quantity:0
    }))

    const product = await Product.create({ name, category,variants });
    return NextResponse.json(
      { message: "Product created successfully", product },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: error.status || 500 }
    );
  }
};

export const PATCH = async (req: Request) => {
  await connect();
  try {
    const body = await req.json();
    const { _id, name, category, variants } = body;
    if (!_id) {
      return new Response(JSON.stringify({ message: "Missing product id" }), {
        status: 400,
      });
    }
    // Validate each variant
    for (const v of variants) {
      if (!v.size || typeof v.mrp !== "number") {
        return new Response(
          JSON.stringify({
            message: "Each variant must have size and mrp (number)",
          }),
          { status: 400 }
        );
      }
    }
    const updated = await Product.findByIdAndUpdate(
      _id,
      { name, category, variants },
      { new: true }
    );
    if (!updated) {
      return new Response(JSON.stringify({ message: "Product not found" }), {
        status: 404,
      });
    }
    // Attach stockEntries for consistency with GET
    const stocks = await Stock.find();
    const stockEntries = stocks.filter(
      (entry: any) => entry.product.toString() === updated._id.toString()
    );
    return new Response(
      JSON.stringify({ ...updated.toObject(), stockEntries }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "Error updating product", error }),
      { status: 500 }
    );
  }
};

export const DELETE = async (req: Request) => {
  await connect();
  try {
    const data = await req.json();
    // console.log("Delete request data:", data);

    const { _id, removeVariant } = data;

    if (!_id) {
      return new Response(JSON.stringify({ message: "Missing product id" }), {
        status: 400,
      });
    }

    // If removeVariant is provided, remove only that variant
    if (removeVariant) {
      console.log("Removing variant:", removeVariant);

      // Remove the variant from the product
      const updated = await Product.updateOne(
        { _id },
        {
          $pull: {
            variants: { size: removeVariant.size, mrp: removeVariant.mrp },
          },
        }
      );

      if (updated.modifiedCount === 0) {
        return new Response(
          JSON.stringify({ message: "Variant not found or product not found" }),
          { status: 404 }
        );
      }

      // Delete related stock entries for this specific variant
      await Stock.deleteMany({
        product: _id,
        "variants.size": removeVariant.size,
        "variants.mrp": removeVariant.mrp,
      });

      return new Response(
        JSON.stringify({ message: "Variant deleted successfully" }),
        { status: 200 }
      );
    }

    // Otherwise, delete the whole product
    console.log("Deleting whole product with id:", _id);
    const deleted = await Product.findByIdAndDelete(_id);
    if (!deleted) {
      return new Response(JSON.stringify({ message: "Product not found" }), {
        status: 404,
      });
    }
    // Delete all related stock entries
    await Stock.deleteMany({ product: _id });
    return new Response(
      JSON.stringify({ message: "Product and related stock entries deleted" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete error:", error);
    return new Response(
      JSON.stringify({ message: "Error deleting product", error }),
      { status: 500 }
    );
  }
};
