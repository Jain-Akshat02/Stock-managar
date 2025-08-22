"use client";
import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Search, 
  X, 
  Minus, 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Filter,
  Trash2
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

const getStockStatus = (stock: number) => {
  if (stock === 0)
    return { text: "Out of Stock", color: "bg-red-100 text-red-800", icon: AlertTriangle };
  if (stock <= 5)
    return { text: "Low Stock", color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle };
  return { text: "In Stock", color: "bg-green-100 text-green-800", icon: CheckCircle };
};

const SIZE_SETS: Record<string, string[]> = {
    Bras: ["28", "30", "32", "34", "36", "38", "40", "42", "44"],
    Panties: ["S", "M", "L", "XL", "XXL", "3XL", "4XL"],
};

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedSize, setSelectedSize] = useState("All Sizes");
  const [stockStatus, setStockStatus] = useState("Current Status");
  const [searchQuery, setSearchQuery] = useState("");
  const [totalProducts, setTotalProducts] = useState(0);
  
  // Delete modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProductToDelete, setSelectedProductToDelete] = useState<any>(null);
   
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "Bras",
  });

  const handleSaveProduct = async () => {
    if (!newProduct.name || !newProduct.category) {
      toast.error("Name and category are required");
      return;
    }
    try {
      await axios.post("/api/stock/inventory", {
        name: newProduct.name,
        category: newProduct.category,
      });
      toast.success("Product added!");
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Product already exists");
    }
  };

  const handleDeleteClick = (product: any) => {
    setSelectedProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const handleClearStock = async () => {
    try {
      const response = await axios.put(`/api/stock/entry`, {
        productId: selectedProductToDelete.product._id
      });
      window.location.reload();
      toast.success("All stock cleared successfully!");
      setIsDeleteModalOpen(false);
      setSelectedProductToDelete(null);
      // Refresh the data
      const stockResponse = await axios.get("/api/stock/inventory", {
        params: { category: selectedCategory }
      });
      const mapped = (stockResponse.data.products || []).map((p: any) => ({
        product: p,
        variants: p.variants || [],
      }));
      setProducts(mapped);
    } catch (error: any) {
      toast.error(`Failed to clear stock: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDeletePermanently = async () => {
    try {
      const response = await axios.delete(`/api/stock/entry`, {
        data:{productId: selectedProductToDelete.product._id}
      });
      toast.success("Product deleted permanently!");
      setIsDeleteModalOpen(false);
      setSelectedProductToDelete(null);
      // Refresh the data
      const stockResponse = await axios.get("/api/stock/inventory", {
        params: { category: selectedCategory }
      });
      const mapped = (stockResponse.data.products || []).map((p: any) => ({
        product: p,
        variants: p.variants || [],
      }));
      setProducts(mapped);
    } catch (error: any) {
      toast.error(`Failed to delete product: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedProductToDelete(null);
  };

  const router = useRouter();
  
  function aggregateStock(entries: any) {
    const map = new Map();
    for (const entry of entries) {
      const key = `${entry.product?._id}`;
      if (!map.has(key)) {
        map.set(key, {
          product: entry.product,
          variants: [],
          totalQuantity: 0,
        });
      }
      const productData = map.get(key);
      productData.variants.push(...entry.variants);
      // Sum the quantities from variants
      const variantQuantities = entry.variants.reduce((sum: number, variant: any) =>  sum + (variant.quantity || 0),0);
      productData.totalQuantity += variantQuantities;
    }    
    return Array.from(map.values());
  }
  
  const aggregatedProducts = aggregateStock(products);
  const filteredAggregatedProducts = aggregatedProducts.sort((a, b) => a.product.name.localeCompare(b.product.name))
  const filteredProducts = filteredAggregatedProducts.filter((entry: any) => {
    const matchesCategory =
      selectedCategory === "All Categories" ||
      entry.product?.category === selectedCategory;

    const matchesSize =
      selectedSize === "All Sizes" ||
      entry.variants?.some((v: any) => v.size === selectedSize);

    const matchesStatus =
      stockStatus === "Current Status" ||
      getStockStatus(entry.totalQuantity).text === stockStatus;

    const matchSearch =
      searchQuery === "" ||
      entry.product?.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSize && matchesStatus && matchSearch;
  });

  // Calculate summary statistics
  const totalStock = filteredProducts.reduce((sum: number, entry: any) => {
    return sum + (entry.totalQuantity || 0) },0
  );
  useEffect(() => {
    const totalProducts = async () => {
      try {
        const response = await axios.get("/api/stock/dashboard");
        setTotalProducts(response.data.totalProducts);
      } catch (error) {
        return console.log("Error fetching total products:", error);
      }
    }
    totalProducts();
  },[]);
  
  useEffect(() => {
    const fetchStockData = async () => {
      try {
        const response = await axios.get("/api/stock/inventory", {
          params: { category: selectedCategory }
        });
        const mapped = (response.data.products || []).map((p: any) => ({
          product: p,
          variants: p.variants || [],
        }));
        setProducts(mapped);
        console.log("Fetched product data:", response.data);
      } catch (error: any) {
        console.log("Error fetching product data:", error.message);
        toast.error(`Failed to fetch product data: ${error.message}`, {
          position: "top-right",
        });
        return [];
      }
    };
    fetchStockData();
  }, [selectedCategory]);

  // Helper function to get quantity for a specific size
  const getQuantityForSize = (variants: any[], size: string) => {
    const variant = variants.find((v: any) => v.size === size);
    return variant ? variant.quantity : 0;
  };

  // Helper function to get all available sizes for a product
  const getAvailableSizes = (variants: any[]) => {
    return variants.map((v: any) => v.size).sort();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package size={24} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">KORVIN BRA & PANTIES STOCK MANAGER</h1>
                <p className="text-sm text-gray-500">Track and manage your stock levels</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push("/add-stock")}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all font-medium"
              >
                <Plus size={18} />
                <span>Add Stock</span>
              </button>
              <button
                onClick={() => router.push("/record-sale")}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-red-600 text-white rounded-xl hover:from-pink-600 hover:to-red-700 transition-all font-medium"
              >
                <Minus size={18} />
                <span>Record Sale</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-3xl font-bold text-gray-900">{totalProducts}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Package size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Stock</p>
                <p className="text-3xl font-bold text-gray-900">{totalStock}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <TrendingUp size={24} className="text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0 lg:space-x-6">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter size={18} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>
              
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="All Categories">All Categories</option>
                <option value="Bras">Bras</option>
                <option value="Panties">Panties</option>
              </select>

              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
              >
                <option value="All Sizes">All Sizes</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
              </select>

              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value)}
              >
                <option value="Current Status">All Status</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Product Inventory</h2>
            <p className="text-sm text-gray-600">Showing {filteredProducts.length} products</p>
          </div>

          <div className="overflow-x-auto">
            {/* Bras Section */}
            {filteredProducts.filter((entry: any) => entry.product?.category === "Bras").length >= 0 && (
              <div className="mb-8">
                <div className="px-6 py-3 bg-pink-50 border-b border-pink-200">
                  <h3 className="text-lg font-semibold text-pink-800">Bras</h3>
                </div>
                <table className="w-full min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                        Product Name
                      </th>
                      <th className="px-2 py-3 text-center text-xl font-bold text-gray-700 uppercase tracking-wider w-12">
                        28
                      </th>
                      <th className="px-2 py-3 text-center text-xl font-bold text-gray-700 uppercase tracking-wider w-12">
                        30
                      </th>
                      <th className="px-2 py-3 text-center text-xl font-bold text-gray-700 uppercase tracking-wider w-12">
                        32
                      </th>
                      <th className="px-2 py-3 text-center text-xl font-bold text-gray-700 uppercase tracking-wider w-12">
                        34
                      </th>
                      <th className="px-2 py-3 text-center text-xl font-bold text-gray-700 uppercase tracking-wider w-12">
                        36
                      </th>
                      <th className="px-2 py-3 text-center text-xl font-bold text-gray-700 uppercase tracking-wider w-12">
                        38
                      </th>
                      <th className="px-2 py-3 text-center text-xl font-bold text-gray-700 uppercase tracking-wider w-12">
                        40
                      </th>
                      <th className="px-2 py-3 text-center text-xl font-bold text-gray-700 uppercase tracking-wider w-12">
                        42
                      </th>
                      <th className="px-2 py-3 text-center text-xl font-bold text-gray-700 uppercase tracking-wider w-12">
                        44
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-large text-gray-500 uppercase tracking-wider w-16">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts
                      .filter((entry: any) => entry.product?.category === "Bras")
                      .map((entry: any, index: number) => {
                        const availableSizes = getAvailableSizes(entry.variants);
                        
                        return (
                          <tr key={`bras-${index}`} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 relative group">
                                  <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center">
                                    <Package size={16} className="text-white" />
                                  </div>
                                  <button
                                    onClick={() => handleDeleteClick(entry)}
                                    className="absolute inset-0 bg-red-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                  >
                                    <Trash2 size={14} className="text-white" />
                                  </button>
                                </div>
                                <div className="ml-3">
                                  <div className="text-md font-semibold text-gray-900 uppercase truncate">
                                    {entry.product?.name || "Unknown Product"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            {SIZE_SETS.Bras.map((size) => {
                              const quantity = getQuantityForSize(entry.variants, size);
                              const isAvailable = availableSizes.includes(size);
                              
                              return (
                                <td key={size} className="px-2 py-4 text-center">
                                  <div className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-base font-semibold ${
                                    isAvailable && quantity >= 0
                                      ? quantity <= 5
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-500'
                                  }`}>
                                    {isAvailable ? quantity : '-'}
                                  </div>
                                </td>
                              );
                            })}
                            <td className="px-4 py-4 text-center">
                              <div className="text-md font-semibold text-gray-900">
                                {entry.totalQuantity || 0}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Panties Section */}
            {filteredProducts.filter((entry: any) => entry.product?.category === "Panties").length > 0 && (
              <div>
                <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800">Panties</h3>
                </div>
                <table className="w-full min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                        Product Name
                      </th>
                      <th className="px-2 py-3 text-center text-xl font-bold text-gray-700 uppercase tracking-wider w-12">
                        S
                      </th>
                      <th className="px-2 py-3 text-center text-xl font-bold text-gray-700 uppercase tracking-wider w-12">
                        M
                      </th>
                      <th className="px-2 py-3 text-center text-xl font-bold text-gray-700 uppercase tracking-wider w-12">
                        L
                      </th>
                      <th className="px-2 py-3 text-center text-xl font-bold text-gray-700 uppercase tracking-wider w-12">
                        XL
                      </th>
                      <th className="px-2 py-3 text-center text-xl font-bold text-gray-700 uppercase tracking-wider w-12">
                        XXL
                      </th>
                      <th className="px-2 py-3 text-center text-xl font-bold text-gray-700 uppercase tracking-wider w-12">
                        3XL
                      </th>
                      <th className="px-2 py-3 text-center text-xl font-bold text-gray-700 uppercase tracking-wider w-12">
                        4XL
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts
                      .filter((entry: any) => entry.product?.category === "Panties")
                      .map((entry: any, index: number) => {
                        const availableSizes = getAvailableSizes(entry.variants);
                        
                        return (
                          <tr key={`panties-${index}`} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 relative group">
                                  <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-400 to-cyan-500 flex items-center justify-center">
                                    <Package size={16} className="text-white" />
                                  </div>
                                  <button
                                    onClick={() => handleDeleteClick(entry)}
                                    className="absolute inset-0 bg-red-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                  >
                                    <Trash2 size={14} className="text-white" />
                                  </button>
                                </div>
                                <div className="ml-3">
                                  <div className="text-md font-semibold text-gray-900 uppercase truncate">
                                    {entry.product?.name || "Unknown Product"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            {SIZE_SETS.Panties.map((size) => {
                              const quantity = getQuantityForSize(entry.variants, size);
                              const isAvailable = availableSizes.includes(size);
                              
                              return (
                                <td key={size} className="px-2 py-4 text-center">
                                  <div className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-base font-semibold ${
                                    isAvailable && quantity > 0
                                      ? quantity <= 5
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-500'
                                  }`}>
                                    {isAvailable ? quantity : '-'}
                                  </div>
                                </td>
                              );
                            })}
                            <td className="px-4 py-4 text-center">
                              <div className="text-md font-semibold text-gray-900">
                                {entry.totalQuantity || 0}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Add New Product</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-4">
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Product Name*"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct((p) => ({ ...p, name: e.target.value }))
                  }
                />
                
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newProduct.category}
                  onChange={(e) =>
                    setNewProduct((p) => ({ ...p, category: e.target.value }))
                  }
                >
                  <option value="Bras">Bras</option>
                  <option value="Panties">Panties</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end items-center p-6 border-t border-gray-200 space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all"
                onClick={handleSaveProduct}
              >
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Delete Product</h2>
              <button
                onClick={handleCloseDeleteModal}
                className="p-2 rounded-full hover:bg-gray-600 transition-colors text-gray-400"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-900">
                  &ldquo;{selectedProductToDelete?.product?.name}&rdquo;?
                </span>
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleClearStock}
                  className="w-full px-4 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors font-medium"
                >
                  Clear All Stock
                </button>
                <button
                  onClick={handleDeletePermanently}
                  className="w-full px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
  @media print {
    /* Reset everything for print */
    * {
      box-sizing: border-box !important;
    }
    
    /* Hide only UI elements that shouldn't be printed */
    button, 
    input,
    select,
    .bg-gradient-to-br,
    .shadow-sm,
    .shadow-lg,
    .border,
    .rounded-2xl,
    .rounded-xl,
    .hover\\:bg-gray-50,
    .transition-colors,
    .max-w-7xl,
    .mx-auto,
    .px-4,
    .sm\\:px-6,
    .lg\\:px-8,
    .py-8,
    .mb-8,
    .gap-6,
    .space-x-4,
    .space-y-4,
    .lg\\:space-x-6,
    .lg\\:space-y-0,
    .flex-1,
    .max-w-md,
    .relative,
    .absolute,
    .left-3,
    .top-1/2,
    .-translate-y-1/2,
    .pl-10,
    .pr-4,
    .focus\\:outline-none,
    .focus\\:ring-2,
    .focus\\:ring-blue-500,
    .focus\\:border-transparent,
    .hover\\:from-blue-600,
    .hover\\:to-purple-700,
    .hover\\:from-pink-600,
    .hover\\:to-red-700,
    .transition-all,
    .font-medium {
      display: none !important;
    }
    
    /* Hide header section */
    .bg-white.shadow-sm.border-b.border-gray-100 {
      display: none !important;
    }
    
    /* Hide statistics cards */
    .grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4 {
      display: none !important;
    }
    
    /* Hide filters and search section */
    .bg-white.rounded-2xl.shadow-lg.border.border-gray-100.p-6.mb-8 {
      display: none !important;
    }
    
    /* Force the table container to be visible and take full page */
    .bg-white.rounded-2xl.shadow-lg.border.border-gray-100.overflow-hidden {
      background-color: white !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      max-width: none !important;
      border: none !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      overflow: visible !important;
    }
    
    /* Make table container visible */
    .overflow-x-auto {
      overflow: visible !important;
      border: none !important;
      box-shadow: none !important;
    }
    
    /* Ensure table is visible and properly formatted */
    table {
      width: 100% !important;
      border-collapse: collapse !important;
      page-break-inside: avoid !important;
      margin: 0 !important;
      padding: 0 !important;
      display: table !important;
    }
    
    /* Table headers and cells */
    th, td {
      border: 1px solid #000 !important;
      padding: 8px !important;
      text-align: center !important;
      page-break-inside: avoid !important;
      display: table-cell !important;
      vertical-align: middle !important;
    }
    
    th {
      background-color: #f0f0f0 !important;
      font-weight: bold !important;
      font-size: 14px !important;
    }
    
    td {
      font-size: 12px !important;
    }
    
    /* Section headers */
    .bg-pink-50, .bg-blue-50 {
      background-color: #f0f0f0 !important;
      border: 1px solid #000 !important;
      padding: 12px !important;
      margin: 0 !important;
      font-weight: bold !important;
      font-size: 16px !important;
      text-align: center !important;
    }
    
    /* Product name column */
    th:first-child, td:first-child {
      text-align: left !important;
      width: 200px !important;
    }
    
    /* Size columns */
    th:not(:first-child):not(:last-child), td:not(:first-child):not(:last-child) {
      width: 60px !important;
      text-align: center !important;
    }
    
    /* Total column */
    th:last-child, td:last-child {
      width: 80px !important;
      text-align: center !important;
    }
    
    /* Remove all background colors except for table structure */
    .bg-gradient-to-r,
    .bg-pink-400,
    .bg-purple-500,
    .bg-blue-400,
    .bg-cyan-500,
    .bg-yellow-100,
    .bg-green-100,
    .bg-gray-100 {
      background: none !important;
    }
    
    /* Ensure text is black and readable */
    * {
      color: black !important;
    }
    
    /* Hide package icons */
    svg {
      display: none !important;
    }
    
    /* Force page layout */
    @page {
      margin: 1cm;
      size: A4;
    }
    
    /* Ensure the main container takes full width */
    .min-h-screen {
      min-height: auto !important;
      height: auto !important;
      background: white !important;
    }
    
    /* Show the main content area */
    .max-w-7xl.mx-auto.px-4.sm\\:px-6.lg\\:px-8.py-8 {
      display: block !important;
      margin: 0 !important;
      padding: 0 !important;
      max-width: none !important;
    }
    
    /* Show table header */
    .px-6.py-4.border-b.border-gray-200 {
      display: block !important;
      padding: 12px !important;
      border-bottom: 1px solid #000 !important;
      background-color: #f0f0f0 !important;
      text-align: center !important;
      font-weight: bold !important;
      font-size: 18px !important;
    }
    
    /* Hide the "Showing X products" text */
    .px-6.py-4.border-b.border-gray-200 p {
      display: none !important;
    }
  }
`}</style>
    </div>
  );
};

export default Inventory;