import connect from "@/config/dbConfig";
import Stock from "@/models/stockModel";
import Product from "@/models/productModel";
import { NextRequest, NextResponse } from "next/server";
import { cors, handleCors } from "@/lib/cors";

await connect();

export const POST = async (req: NextRequest) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const reqBody = await req.json();
  const { productId, stockEntries,sale} = reqBody;
  if (sale) {
    // Sale mode: expects productId, size, mrp, quantity, notes
    
    for (const saleEntry of sale) {
      const { size, quantity } = saleEntry;
      if (!productId || quantity == null) {
        
        return NextResponse.json({ message: "...." }, { status: 400 });
      }
      // Aggregate current stock for this product/variant
      const stockEntries = await Stock.find({
        product: productId,
      });
      // console.log(productId, stockEntries);
      const currentStock = stockEntries.reduce((sum: number, entry: any) => sum + entry.quantity, 0);
      if (currentStock < quantity) {
        return NextResponse.json({ message: "Not enough stock!" }, { status: 400 });
      }
      // Record the sale as a negative stock entry
      await Stock.create({
        product: productId,
        quantity: -quantity,
        status: "stock out",
      });
      // Also update Product's variant quantity
      await Product.updateOne(
        {
          _id: productId,
          "variants.size": size,
        },
        { $inc: { "variants.$.quantity": -quantity } }
      );
    }
    const response = NextResponse.json({ message: "Sale recorded successfully" }, { status: 201 });
    
    // Add CORS headers
    Object.entries(cors(req)).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }

  if (
    !productId ||
    !stockEntries ||
    stockEntries.length === 0
  ) {
    const response = NextResponse.json(
      { message: "Missing required fields" },
      { status: 400 }
    );
    
    // Add CORS headers
    Object.entries(cors(req)).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
  try {
    for (const entry of stockEntries) {
      // 1. Create a Stock document (history)
      await Stock.create({
        product: productId,
        variants: [{ size: entry.size, quantity: entry.quantity}],
        status: "stock in",
      });
      
      // 2. Update the Product's variant quantity
      const res = await Product.updateOne(
        {
          _id: productId,
          "variants.size": entry.size,

        },
        { $inc: { "variants.$.quantity": entry.quantity } }
      )
      if(res.matchedCount === 0){
        await Product.updateOne(
          { _id: productId },
          { $push: { variants: { size: entry.size, quantity: entry.quantity}}}
        )
      }
    }
  } catch (error: any) {
    console.log(error, error.message);
    const response = NextResponse.json(
      { message: error.message, error: error },
      { status: 500 }
    );
    
    // Add CORS headers
    Object.entries(cors(req)).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
  const response = NextResponse.json({ message: "Success" }, { status: 201 });
  
  // Add CORS headers
  Object.entries(cors(req)).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
};

export const GET = async (req: NextRequest) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const stocks = await Stock.find()
      .populate({
        path: "product",
        select:
          "name category variants"
        ,
      })
      .sort({ date: -1 });
    // console.log("Fetched stocks:", stocks);
    
    const response = NextResponse.json(stocks, { status: 200 });
    
    // Add CORS headers
    Object.entries(cors(req)).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  } catch (error: any) {
    const response = NextResponse.json(
      { message: "Error fetching stock", error: error.message },
      { status: 500 }
    );
    
    // Add CORS headers to error response too
    Object.entries(cors(req)).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
};

export const DELETE = async (req: NextRequest) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const reqBody = await req.json();
    const { productId } = reqBody;
    if(!productId){
      return NextResponse.json({ message: "Product ID is required" }, { status: 400 });
    }
    const product = await Product.findById(productId);
    if(!product){
      return NextResponse.json({ message:"Product Not found"}, { status: 404 });
    }
    await Stock.deleteMany({ product: productId });
    await Product.findByIdAndDelete(productId);

    const response = NextResponse.json({ message:"Stock entry deleted successfully" }, { status: 200 });
    
    // Add CORS headers
    Object.entries(cors(req)).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  } catch (error: any) {
    console.error("Error in DELETE request:", error);
    const response = NextResponse.json(
      { message: "Error deleting stock entry", error: error.message },
      { status: 500 }
    );
    
    // Add CORS headers
    Object.entries(cors(req)).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
};
//Stock validation failed: variants.0.size: Path `size` is required.

export const PUT = async (req: NextRequest) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const reqBody = await req.json();
    const { productId } = reqBody;
    console.log(productId);
    if(!productId){
      return NextResponse.json({ message: "Product ID is required" }, { status: 400 });
    }
    const product = await Product.findById(productId);
    if(!product){
      return NextResponse.json({ message:"Product not found" }, { status: 404 });
    }
    await Stock.deleteMany({ product: productId });
   const updatedVariants =  product.variants.map((variant:any)=>({
       ...variant.toObject(),
      quantity: 0
    }));
    await Product.findByIdAndUpdate(
      productId,
      {
        variants: updatedVariants,
      },
      { new: true }
    )
    console.log("Stock cleared successfully for product:", product.name);
    const response = NextResponse.json({ 
      message: "All stock cleared successfully",
      productId 
    }, { status: 200 });
    
    // Add CORS headers
    Object.entries(cors(req)).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  } catch (error: any) {
    console.error("Error in PUT request:", error);
    const response = NextResponse.json(
      { message: "Error updating stock", error: error.message },
      { status: 500 }
    );
    
    // Add CORS headers
    Object.entries(cors(req)).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
}