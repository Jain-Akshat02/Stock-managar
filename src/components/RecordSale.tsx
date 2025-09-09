// src/components/RecordSale.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { ShoppingCart, X, ArrowLeft, Package, TrendingDown } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

const SIZE_SETS: Record<string, string[]> = {
  Bras: ["28", "30", "32", "34", "36", "38", "40", "42", "44"],
  Panties: ["S", "M", "L", "XL", "XXL", "3XL", "4XL"],
};

const RecordSale = () => {
  const [selectedCategory, setSelectedCategory] = useState("Bras");
  const [sizeQuantities, setSizeQuantities] = useState<{
    [size: string]: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectProductId, setSelectProductId] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const router = useRouter();
  const inputRefs = useRef<{ [size: string]: HTMLInputElement | null }>({});

  const selectedProduct = products.find((p) => p._id === selectProductId);

  const recordSaleBtnRef = useRef<HTMLButtonElement>(null);

  const sortedProducts = products.sort((a, b) => 
  a.name.localeCompare(b.name)
);

  // Create a ref callback for input elements
  const createInputRef = (size: string) => (el: HTMLInputElement | null) => {
    if (el) {
      inputRefs.current[size] = el;
    } else {
      delete inputRefs.current[size];
    }
  };

  // Reset size quantities when category changes
  useEffect(() => {
    const newQuantities: { [size: string]: string } = {};
    (SIZE_SETS[selectedCategory] || []).forEach((size) => {
      newQuantities[size] = "0";
    });
    setSizeQuantities(newQuantities);
  }, [selectedCategory]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("/api/stock/inventory", {
          params: { category: selectedCategory
        }
        });
        console.log(response.data);
        setProducts(response.data.products);
      } catch (error) {
        console.log("Failed to fetch products:", error);
        toast.error("Failed to load products. Please try again later.");
      }
    }
    fetchProducts();
  },[selectedCategory]);
  
  const handleProductChange = (selectProduct: string) => {
    setSelectProductId(selectProduct);
  }

  // Reset size quantities when product changes
  useEffect(() => {
    if (!selectProductId) return;
    const newQuantities: { [size: string]: string } = {};
    (SIZE_SETS[selectedCategory] || []).forEach((size) => {
      newQuantities[size] = "0";
    });
    setSizeQuantities(newQuantities);
  }, [selectProductId]);

  // Handle Enter key press to move to next input
  const handleKeyPress = (
    e: React.KeyboardEvent<HTMLInputElement>,
    currentSize: string
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const sizes = SIZE_SETS[selectedCategory] || [];
      const currentIndex = sizes.indexOf(currentSize);
      const nextSize = sizes[currentIndex + 1];

      if (nextSize && inputRefs.current[nextSize]) {
        inputRefs.current[nextSize]?.focus();
        console.log("--click detected--");
        
      }
      else if(recordSaleBtnRef.current){
        console.log("click detected");
        
        recordSaleBtnRef.current?.focus();

      }

    }
  };
  
  // Handles submitting the final sale information
  const handleSubmitSale = async () => {
    const saleEntries = Object.entries(sizeQuantities)
      .filter(([_, qty]) => Number(qty) > 0)
      .map(([size, qty]) => ({
        size,
        quantity: Number(qty),
      }));

    if (saleEntries.length === 0) {
      toast.error("Please enter a quantity for at least one size.");
      return;
    }

    setIsLoading(true);
    try {
      // Send all sale entries in one payload
      const payload = {
        productId: selectProductId,
        category: selectedCategory,
        sale:saleEntries
      };
      console.log(payload);
      await axios.post("/api/stock/entry", payload);
      toast.success("Sale recorded successfully!");
      router.refresh();
      setSelectedCategory("Bras");
    } catch (error: any) {
      console.error("Sale submission failed:", error);
      const message = error.response?.data?.message || "Failed to record sale.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-pink-600 transition-colors"
              >
                <ArrowLeft size={20} className="mr-2" />
                Back
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Record Sale</h1>
                <p className="text-sm text-gray-500">Update inventory levels</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm font-medium">
                <TrendingDown size={16} className="mr-1" />
                Sale Mode
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Product Selection Section */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-8 py-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Package size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Product Selection</h2>
                <p className="text-pink-100">Choose category and product quality</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Category and Product Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Category
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="Bras">Bras</option>
                  <option value="Panties">Panties</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Product Quality
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  value={selectProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                >
                  <option value="" >
                    Select Quality
                  </option>
                  {sortedProducts.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Product Display */}
            {selectedProduct && (
              <div className="bg-gradient-to-r from-gray-50 to-pink-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-pink-100 rounded-xl">
                    <Package size={20} className="text-pink-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedProduct.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Category: {selectedProduct.category}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Size Quantities Section */}
            {selectedProduct && (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ShoppingCart size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Enter Sale Quantities
                    </h3>
                    <p className="text-sm text-gray-600">
                      Select quantities for each available size
                    </p>
                  </div>
                </div>

                {/* Sizes Container with Horizontal Scroll */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide max-w-full">
                    {(SIZE_SETS[selectedCategory] || []).map((size) => {
                      // Find the variant for this size
                      const variant = selectedProduct.variants.find((v: any) => v.size === size);
                      const availableQuantity = variant ? variant.quantity : 0;
                      
                      return (
                        <div key={size} className="flex-shrink-0 min-w-0">
                          <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow w-20">
                            <div className="text-center space-y-2">
                              <div>
                                <span className="text-base font-bold text-gray-900">{size}</span>
                                <div className="text-xs text-gray-500 mt-1">
                                  Available: {availableQuantity}
                                </div>
                              </div>
                              <input
                                ref={createInputRef(size)}
                                type="number"
                                min="0"
                                max={availableQuantity}
                                className="w-full px-1 py-1 border border-gray-300 rounded-lg text-center text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-xs"
                                placeholder="0"
                                value={sizeQuantities[size] || ""}
                                onChange={(e) => {
                                  const inputValue = e.target.value;
                                  const normalized = inputValue === "" ? "" : inputValue.replace(/^0+(?=\d)/, "");
                                  setSizeQuantities((q) => ({
                                    ...q,
                                    [size]: normalized,
                                  }));
                                }}
                                onFocus={(e) => {
                                  if (e.currentTarget.value === "0") {
                                    e.currentTarget.select();
                                  }
                                }}
                                onKeyPress={(e) => handleKeyPress(e, size)}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {/* Total card on the right of sizes */}
                    <div className="flex-shrink-0 min-w-0">
                      <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow w-24 md:w-28">
                        <div className="text-center space-y-2">
                          <div className="text-xs text-gray-500">Total</div>
                          <div className="text-2xl font-extrabold text-gray-900">
                            {Object.values(sizeQuantities).reduce((sum, qty) => sum + (Number(qty) || 0), 0)}
                          </div>
                          
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all"
                onClick={() => {
                  setSelectedCategory("Bras");
                  setSizeQuantities({});
                  setSelectProductId("");
                }}
              >
                Reset
              </button>
              <button
                ref={recordSaleBtnRef}
                onClick={handleSubmitSale}
                disabled={isLoading || !selectedProduct}
                className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Recording...</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart size={20} />
                    <span>Record Sale</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default RecordSale;
