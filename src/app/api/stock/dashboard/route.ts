// src/app/api/stock/route.ts
import { NextResponse, NextRequest } from 'next/server';
import connect from '@/config/dbConfig';
import Stock from '@/models/stockModel';
import Product from '@/models/productModel';
import { cors, handleCors } from '@/lib/cors';


await connect();

export async function GET(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const totalProducts = await Product.countDocuments();
    const response = NextResponse.json({ totalProducts }, { status: 200 });
    
    // Add CORS headers
    Object.entries(cors(request)).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  } catch (error: any) {
    const response = NextResponse.json({ message: error.message, error }, { status: 500 });
    
    // Add CORS headers
    Object.entries(cors(request)).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
}

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const body = await request.json();
    // In a real application, you would:

    const response = NextResponse.json({ message: "Stock added successfully"}, { status: 201 });
    
    // Add CORS headers
    Object.entries(cors(request)).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  } catch (error: any) {
    const response = NextResponse.json({ message: error.message, error }, { status: 500 });
    
    // Add CORS headers
    Object.entries(cors(request)).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
}
