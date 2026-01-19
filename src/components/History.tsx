"use client";
import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";

type StockEntry = {
  _id: string;
  product: {
    name: string;
    category: string;
  };
  variants: Array<{
    size: string;
    quantity: number;
  }>;
  createdAt: string;
  status: string;
};
const History = () => {
  const [stocksIn, setStocksIn] = useState<any[]>([]);
  const [stocksOut, setStocksOut] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<StockEntry | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);
  const openCard = (entry: any) => {
    console.log("entry clicked:", entry);
    console.log("Product:", entry.product);
    setSelectedEntry(entry);
  };
  const groupByStockEntry = (entries: any[]) => {};
  const formatDate = (dateString: string | undefined, entryId?: string) => {
    // First try createdAt if it exists
    if (dateString) {
      try {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString("en-GB");
        }
      } catch {
        console.log("no date string");
      }
    }

    // Fallback: use _id timestamp if createdAt doesn't exist
    if (entryId) {
      try {
        const timestamp = parseInt(entryId.substring(0, 8), 16) * 1000;
        const date = new Date(timestamp);
        return date.toLocaleDateString("en-GB");
      } catch {
        return "No date";
      }
    }

    return "No date";
  };
  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/stock/entry");
      const { stocksIn, stocksOut } = response.data;
      setStocksIn(stocksIn);
      setStocksOut(stocksOut);
    } catch (error) {
      toast.error("Error fetching history");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Stock History
          </h1>
          <p className="text-gray-600">View recent stock additions and sales</p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-4 text-gray-600">Loading history...</span>
          </div>
        )}

        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* STOCK IN SECTION */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <span className="mr-2">📥</span>
                  Stock In
                </h2>
              </div>
              
              <div className="p-4">
                {/* Table header */}
                <div className="grid grid-cols-2 gap-4 text-sm font-semibold text-gray-700 border-b-2 border-gray-200 pb-3 mb-2">
                  <span>Date</span>
                  <span>Product</span>
                </div>
                
                {stocksIn.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p>No stock additions yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stocksIn.map((entry) => (
                      <div
                        key={entry._id}
                        onClick={() => {
                          openCard(entry);
                        }}
                        className="cursor-pointer hover:bg-green-50 p-3 rounded-lg border border-gray-100 hover:border-green-200 transition-all duration-200 grid grid-cols-2 gap-4 items-center"
                      >
                        <span className="text-sm font-medium text-gray-700">
                          {formatDate(entry.createdAt, entry._id)}
                        </span>
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {entry.product.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          {/* STOCK OUT SECTION */}
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-medium mb-4 text-red-600">Stock Out</h2>

            {/* Table header */}
            <div className="grid grid-cols-4 text-sm font-semibold border-b pb-2">
              <span>Product</span>
              <span>Size</span>
              <span>Qty</span>
              <span>Date</span>
            </div>

            {/* Data rows will go here */}
            <div className="text-sm text-gray-400 mt-4">
              Stock-out entries will appear here
            </div>
          </div>
        </div>
      )}
      {selectedEntry && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEntry(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">
                  {selectedEntry?.product?.name || "Product Name"}
                </h3>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Date Section */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center text-gray-600 mb-1">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium">Date Added</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(selectedEntry?.createdAt, selectedEntry?._id)}
                </p>
              </div>

              {/* Variants Section */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">📦</span>
                  Sizes & Quantities
                </h4>
                <div className="space-y-2">
                  {selectedEntry.variants.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No variants available</p>
                  ) : (
                    selectedEntry.variants.map((variant, index) => (
                      <div 
                        key={index} 
                        className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100 hover:border-blue-300 transition-colors"
                      >
                        <span className="font-semibold text-gray-800">
                          Size <span className="text-blue-600">{variant.size}</span>
                        </span>
                        <span className="font-bold text-purple-600 text-lg">
                          {variant.quantity} <span className="text-sm font-normal text-gray-600">units</span>
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default History;
