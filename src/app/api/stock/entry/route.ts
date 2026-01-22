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
  const { productId, stockEntries,sale, customerName} = reqBody;
  if (sale) {
    // Sale mode: expects productId, size, mrp, quantity, notes
    
    for (const saleEntry of sale) {
      const { size, quantity } = saleEntry;
      if (!productId || quantity == null) {
        return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
      }
      
      // Check if the specific size has enough inventory
      const product = await Product.findById(productId);
      if (!product) {
        return NextResponse.json({ message: "Product not found" }, { status: 404 });
      }
      
      const variant = product.variants.find((v: any) => v.size === size);
      const availableQuantity = variant ? variant.quantity : 0;
      
      if (quantity > availableQuantity) {
        return NextResponse.json({ 
          message: `Cannot sell ${quantity} items of size ${size}. Only ${availableQuantity} available. Please reload the page to get updated inventory levels.` 
        }, { status: 400 });
      }
    }
    
    // If all validations pass, process the sales
    for (const saleEntry of sale) {
      const { size, quantity } = saleEntry;
      
      // Record the sale as a negative stock entry
      await Stock.create({
        product: productId,
        quantity: -quantity,
        status: "stock out",
        customer: customerName || "Walk-in Customer",
      });
      // Also update Product's variant quantity, ensuring it never goes below 0
      const updatedProduct = await Product.findById(productId);
      const variant = updatedProduct?.variants.find((v: any) => v.size === size);
      const newQuantity = Math.max(0, (variant?.quantity || 0) - quantity);
      
      await Product.updateOne(
        {
          _id: productId,
          "variants.size": size,
        },
        { $set: { "variants.$.quantity": newQuantity } }
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
    
      // 1. Create a Stock document (history)
      await Stock.create({
        product: productId,
        variants: stockEntries.map((entry: any) => ({
          size: entry.size,
          quantity: entry.quantity,
        })),
        status: "stock in",
      });
      
     for(const entry of stockEntries){ // 2. Update the Product's variant quantity
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
      }}
    
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
    const stocksIn = await Stock.find({ status: "stock in" })
      .select("product variants status createdAt customer")
      .populate({
        path: "product",
        select: "name category variants"
      })
      .sort({ createdAt: -1 })
      .limit(10);
      const stocksOut = await Stock.find({ status: "stock out" })
      .select("product variants status createdAt")
      .populate({
        path: "product",
        select: "name category variants"
      })
      .sort({ createdAt: -1 })
      .limit(10);
    console.log("Fetched stocks:", stocksIn,stocksOut);
    
    const response = NextResponse.json({stocksIn, stocksOut}, { status: 200 });
    
    // Add CORS headers
    Object.entries(cors(req)).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    //hello
    
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
    const { productId, action } = reqBody;
    
    // Handle cleanup of negative stock values
    if (action === "cleanup-negative-stock") {
      const products = await Product.find({});
      let cleanedCount = 0;
      
      for (const product of products) {
        let needsUpdate = false;
        const updatedVariants = product.variants.map((variant: any) => {
          if (variant.quantity < 0) {
            needsUpdate = true;
            cleanedCount++;
            return { ...variant.toObject(), quantity: 0 };
          }
          return variant;
        });
        
        if (needsUpdate) {
          await Product.findByIdAndUpdate(
            product._id,
            { variants: updatedVariants },
            { new: true }
          );
        }
      }
      
      const response = NextResponse.json({ 
        message: `Cleaned up ${cleanedCount} negative stock values`,
        cleanedCount 
      }, { status: 200 });
      
      // Add CORS headers
      Object.entries(cors(req)).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
    }
    
    // Original functionality - clear all stock for a product
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