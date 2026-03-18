import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import "./App.css";

const API_BASE = "http://localhost:5000/api";

function App() {
  const [page, setPage] = useState("dashboard");
  const [summary, setSummary] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productSearch, setProductSearch] = useState("");

  const [productForm, setProductForm] = useState({
    name: "",
    category: "",
    stock: "",
    buyPrice: "",
    sellPrice: "",
    lowStockThreshold: "",
  });

  const [supplierForm, setSupplierForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    productsSupplied: "",
  });

  const [purchaseForm, setPurchaseForm] = useState({
    supplierId: "",
    productId: "",
    quantity: "",
    purchasePricePerUnit: "",
  });

  const [saleForm, setSaleForm] = useState({
    productId: "",
    soldUnits: "",
    sellingPricePerUnit: "",
    soldBy: "",
  });

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN")}`;
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get(`${API_BASE}/analytics/summary`);
      setSummary(res.data);
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  const fetchPredictions = async () => {
    try {
      const res = await axios.get(`${API_BASE}/analytics/predictions`);
      setPredictions(res.data);
    } catch (error) {
      console.error("Error fetching predictions:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/products`);
      setProducts(res.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchSales = async () => {
    try {
      const res = await axios.get(`${API_BASE}/sales`);
      setSales(res.data);
    } catch (error) {
      console.error("Error fetching sales:", error);
    }
  };

  const fetchPurchases = async () => {
    try {
      const res = await axios.get(`${API_BASE}/purchases`);
      setPurchases(res.data);
    } catch (error) {
      console.error("Error fetching purchases:", error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/suppliers`);
      setSuppliers(res.data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const refreshAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchSummary(),
        fetchPredictions(),
        fetchProducts(),
        fetchSales(),
        fetchPurchases(),
        fetchSuppliers(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const topSellingProducts = useMemo(() => {
    return [...sales]
      .reduce((acc, sale) => {
        const existing = acc.find((item) => item.productId === sale.productId);

        if (existing) {
          existing.totalSold += sale.soldUnits;
          existing.totalRevenue += sale.soldUnits * sale.sellingPricePerUnit;
        } else {
          acc.push({
            productId: sale.productId,
            productName: sale.product?.name || "Unknown",
            totalSold: sale.soldUnits,
            totalRevenue: sale.soldUnits * sale.sellingPricePerUnit,
          });
        }

        return acc;
      }, [])
      .sort((a, b) => b.totalSold - a.totalSold);
  }, [sales]);

  const lowStockProducts = useMemo(() => {
    return summary?.lowStockProducts || [];
  }, [summary]);

  const recentSales = useMemo(() => sales.slice(0, 5), [sales]);
  const recentPurchases = useMemo(() => purchases.slice(0, 5), [purchases]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) =>
      `${product.name} ${product.category}`
        .toLowerCase()
        .includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

  const dashboardSalesChartData = useMemo(() => {
    return topSellingProducts.slice(0, 5).map((item) => ({
      name: item.productName,
      sold: item.totalSold,
    }));
  }, [topSellingProducts]);

  const stockChartData = useMemo(() => {
    return products.slice(0, 8).map((product) => ({
      name: product.name,
      stock: product.remainingStock ?? product.stock ?? 0,
      threshold: product.lowStockThreshold ?? 0,
    }));
  }, [products]);

  const financeChartData = useMemo(() => {
    return [
      {
        name: "Business Overview",
        revenue: summary?.totalRevenue ?? 0,
        purchaseCost: summary?.totalPurchaseCost ?? 0,
        profit: summary?.estimatedProfit ?? 0,
      },
    ];
  }, [summary]);

  const getStatusClass = (status) => {
    if (status === "Out of Stock") return "status-out";
    if (status === "Low Stock") return "status-low";
    return "status-healthy";
  };

  const handleProductChange = (e) => {
    setProductForm({ ...productForm, [e.target.name]: e.target.value });
  };

  const handleSupplierChange = (e) => {
    setSupplierForm({ ...supplierForm, [e.target.name]: e.target.value });
  };

  const handlePurchaseChange = (e) => {
    setPurchaseForm({ ...purchaseForm, [e.target.name]: e.target.value });
  };

  const handleSaleChange = (e) => {
    setSaleForm({ ...saleForm, [e.target.name]: e.target.value });
  };

  const addProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/products`, productForm);
      setProductForm({
        name: "",
        category: "",
        stock: "",
        buyPrice: "",
        sellPrice: "",
        lowStockThreshold: "",
      });
      await refreshAllData();
      alert("Product added successfully");
    } catch (error) {
      console.error("Add product error:", error);
      alert(error?.response?.data?.error || "Failed to add product");
    }
  };

  const deleteProduct = async (id) => {
    try {
      await axios.delete(`${API_BASE}/products/${id}`);
      await refreshAllData();
      alert("Product deleted successfully");
    } catch (error) {
      console.error("Delete product error:", error);
      alert(error?.response?.data?.error || "Failed to delete product");
    }
  };

  const addSupplier = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/suppliers`, supplierForm);
      setSupplierForm({
        name: "",
        email: "",
        phone: "",
        address: "",
        productsSupplied: "",
      });
      await refreshAllData();
      alert("Supplier added successfully");
    } catch (error) {
      console.error("Add supplier error:", error);
      alert(error?.response?.data?.error || "Failed to add supplier");
    }
  };

  const addPurchase = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/purchases`, purchaseForm);
      setPurchaseForm({
        supplierId: "",
        productId: "",
        quantity: "",
        purchasePricePerUnit: "",
      });
      await refreshAllData();
      alert("Purchase added successfully");
    } catch (error) {
      console.error("Add purchase error:", error);
      alert(error?.response?.data?.error || "Failed to add purchase");
    }
  };

  const addSale = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/sales`, saleForm);
      setSaleForm({
        productId: "",
        soldUnits: "",
        sellingPricePerUnit: "",
        soldBy: "",
      });
      await refreshAllData();
      alert("Sale added successfully");
    } catch (error) {
      console.error("Add sale error:", error);
      alert(error?.response?.data?.error || "Failed to add sale");
    }
  };

  const downloadCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert("No data available to download");
      return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((field) => `"${String(row[field] ?? "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSales = () => {
    const salesData = sales.map((sale) => ({
      id: sale.id,
      product: sale.product?.name || "",
      soldUnits: sale.soldUnits,
      sellingPricePerUnit: sale.sellingPricePerUnit,
      soldBy: sale.soldBy,
      date: sale.date,
    }));

    downloadCSV(salesData, "sales-history.csv");
  };

  const handleDownloadPurchases = () => {
    const purchaseData = purchases.map((purchase) => ({
      id: purchase.id,
      supplier: purchase.supplier?.name || "",
      product: purchase.product?.name || "",
      quantity: purchase.quantity,
      purchasePricePerUnit: purchase.purchasePricePerUnit,
      date: purchase.date,
    }));

    downloadCSV(purchaseData, "purchase-history.csv");
  };

  const clearSalesHistory = async () => {
    const confirmed = window.confirm("Are you sure you want to clear all sales history?");
    if (!confirmed) return;

    try {
      await axios.delete(`${API_BASE}/sales/clear`);
      await refreshAllData();
      alert("Sales history cleared successfully");
    } catch (error) {
      console.error("Clear sales history error:", error);
      alert(error?.response?.data?.error || "Failed to clear sales history");
    }
  };

  const clearPurchaseHistory = async () => {
    const confirmed = window.confirm("Are you sure you want to clear all purchase history?");
    if (!confirmed) return;

    try {
      await axios.delete(`${API_BASE}/purchases/clear`);
      await refreshAllData();
      alert("Purchase history cleared successfully");
    } catch (error) {
      console.error("Clear purchase history error:", error);
      alert(error?.response?.data?.error || "Failed to clear purchase history");
    }
  };

  const navItems = [
    { key: "dashboard", label: "Dashboard" },
    { key: "products", label: "Products" },
    { key: "suppliers", label: "Suppliers" },
    { key: "purchases", label: "Purchases" },
    { key: "sales", label: "Sales" },
    { key: "analytics", label: "Analytics" },
    { key: "reports", label: "Reports" },
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div>
          <div className="brand-box">
            <div className="brand-badge">AI</div>
            <div>
              <h2>Smart ERP</h2>
              <p>Inventory Intelligence</p>
            </div>
          </div>

          <div className="sidebar-menu">
            {navItems.map((item) => (
              <button
                key={item.key}
                className={`sidebar-btn ${page === item.key ? "active" : ""}`}
                onClick={() => setPage(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-footer">
          <p>AI-Powered Smart Inventory and Sales Prediction System</p>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-header">
          <div>
            <h1>Smart Inventory ERP Dashboard</h1>
            <p>
              AI-powered inventory management, finance tracking, and demand
              prediction dashboard
            </p>
          </div>

          <button className="primary-btn" onClick={refreshAllData}>
            Refresh Data
          </button>
        </div>

        {loading ? (
          <div className="section-box">
            <h2>Loading dashboard data...</h2>
          </div>
        ) : (
          <>
            {page === "dashboard" && (
              <>
                <div className="grid">
                  <div className="card">
                    <div className="card-label">Total Products</div>
                    <div className="card-value">{summary?.totalProducts ?? 0}</div>
                  </div>
                  <div className="card">
                    <div className="card-label">Total Suppliers</div>
                    <div className="card-value">{summary?.totalSuppliers ?? 0}</div>
                  </div>
                  <div className="card">
                    <div className="card-label">Total Revenue</div>
                    <div className="card-value">
                      {formatCurrency(summary?.totalRevenue)}
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-label">Estimated Profit</div>
                    <div className="card-value">
                      {formatCurrency(summary?.estimatedProfit)}
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-label">Total Stock Left</div>
                    <div className="card-value">{summary?.totalStock ?? 0}</div>
                  </div>
                  <div className="card low-stock-card">
                    <div className="card-label">Low Stock Products</div>
                    <div className="card-value">{summary?.lowStockCount ?? 0}</div>
                  </div>
                </div>

                <div className="dashboard-two-col">
                  <div className="section-box">
                    <h2>Top Selling Products Chart</h2>
                    <div className="chart-box">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dashboardSalesChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="sold" name="Units Sold" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="section-box">
                    <h2>Stock vs Threshold Chart</h2>
                    <div className="chart-box">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stockChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="stock" name="Stock Left" />
                          <Bar dataKey="threshold" name="Threshold" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="section-box">
                  <h2>Finance Overview Chart</h2>
                  <div className="chart-box">
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={financeChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="revenue" name="Revenue" />
                        <Bar dataKey="purchaseCost" name="Purchase Cost" />
                        <Bar dataKey="profit" name="Profit" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="dashboard-two-col">
                  <div className="section-box">
                    <h2>Recent Sales</h2>
                    <table>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Units Sold</th>
                          <th>Price Per Unit</th>
                          <th>Sold By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentSales.length > 0 ? (
                          recentSales.map((sale) => (
                            <tr key={sale.id}>
                              <td>{sale.product?.name || "Unknown"}</td>
                              <td>{sale.soldUnits}</td>
                              <td>{formatCurrency(sale.sellingPricePerUnit)}</td>
                              <td>{sale.soldBy}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4">No sales data available</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="section-box">
                    <h2>Low Stock Alerts</h2>
                    <table>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Category</th>
                          <th>Stock Left</th>
                          <th>Threshold</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lowStockProducts.length > 0 ? (
                          lowStockProducts.map((item) => (
                            <tr key={item.id}>
                              <td>{item.name}</td>
                              <td>{item.category}</td>
                              <td>{item.currentStock}</td>
                              <td>{item.lowStockThreshold}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4">No low stock alerts</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {page === "products" && (
              <>
                <div className="section-box">
                  <h2>Add Product</h2>
                  <form className="form-grid" onSubmit={addProduct}>
                    <input
                      type="text"
                      name="name"
                      placeholder="Product Name"
                      value={productForm.name}
                      onChange={handleProductChange}
                    />
                    <input
                      type="text"
                      name="category"
                      placeholder="Category"
                      value={productForm.category}
                      onChange={handleProductChange}
                    />
                    <input
                      type="number"
                      name="stock"
                      placeholder="Opening Stock"
                      value={productForm.stock}
                      onChange={handleProductChange}
                    />
                    <input
                      type="number"
                      name="buyPrice"
                      placeholder="Buy Price Per Unit"
                      value={productForm.buyPrice}
                      onChange={handleProductChange}
                    />
                    <input
                      type="number"
                      name="sellPrice"
                      placeholder="Sell Price Per Unit"
                      value={productForm.sellPrice}
                      onChange={handleProductChange}
                    />
                    <input
                      type="number"
                      name="lowStockThreshold"
                      placeholder="Low Stock Threshold"
                      value={productForm.lowStockThreshold}
                      onChange={handleProductChange}
                    />
                    <button className="submit-btn" type="submit">
                      Add Product
                    </button>
                  </form>
                </div>

                <div className="section-box">
                  <div className="section-header-row">
                    <h2>Products</h2>
                    <input
                      className="search-input"
                      type="text"
                      placeholder="Search by name or category..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>

                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Total Available</th>
                        <th>Stock Left</th>
                        <th>Total Sold</th>
                        <th>Total Purchased</th>
                        <th>Buy Price</th>
                        <th>Sell Price</th>
                        <th>Threshold</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map((p) => (
                          <tr key={p.id}>
                            <td>{p.id}</td>
                            <td>{p.name}</td>
                            <td>{p.category}</td>
                            <td>{p.remainingStock + p.totalSoldUnits}</td>
                            <td>{p.remainingStock}</td>
                            <td>{p.totalSoldUnits}</td>
                            <td>{p.totalPurchasedUnits}</td>
                            <td>{formatCurrency(p.buyPrice)}</td>
                            <td>{formatCurrency(p.sellPrice)}</td>
                            <td>{p.lowStockThreshold}</td>
                            <td>
                              <span
                                className={
                                  p.remainingStock === 0
                                    ? "status-out"
                                    : p.remainingStock <= p.lowStockThreshold
                                    ? "status-low"
                                    : "status-healthy"
                                }
                              >
                                {p.remainingStock === 0
                                  ? "Out of Stock"
                                  : p.remainingStock <= p.lowStockThreshold
                                  ? "Low Stock"
                                  : "Healthy"}
                              </span>
                            </td>
                            <td>
                              <button
                                className="danger-btn"
                                onClick={() => deleteProduct(p.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="12">No matching products found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {page === "suppliers" && (
              <>
                <div className="section-box">
                  <h2>Add Supplier</h2>
                  <form className="form-grid" onSubmit={addSupplier}>
                    <input
                      type="text"
                      name="name"
                      placeholder="Supplier Name"
                      value={supplierForm.name}
                      onChange={handleSupplierChange}
                    />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={supplierForm.email}
                      onChange={handleSupplierChange}
                    />
                    <input
                      type="text"
                      name="phone"
                      placeholder="Phone"
                      value={supplierForm.phone}
                      onChange={handleSupplierChange}
                    />
                    <input
                      type="text"
                      name="address"
                      placeholder="Address"
                      value={supplierForm.address}
                      onChange={handleSupplierChange}
                    />
                    <input
                      type="text"
                      name="productsSupplied"
                      placeholder="Products Supplied"
                      value={supplierForm.productsSupplied}
                      onChange={handleSupplierChange}
                    />
                    <button className="submit-btn" type="submit">
                      Add Supplier
                    </button>
                  </form>
                </div>

                <div className="section-box">
                  <h2>Suppliers</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Address</th>
                        <th>Products Supplied</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suppliers.length > 0 ? (
                        suppliers.map((supplier) => (
                          <tr key={supplier.id}>
                            <td>{supplier.id}</td>
                            <td>{supplier.name}</td>
                            <td>{supplier.email}</td>
                            <td>{supplier.phone}</td>
                            <td>{supplier.address}</td>
                            <td>{supplier.productsSupplied}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6">No suppliers available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {page === "purchases" && (
              <>
                <div className="section-box">
                  <h2>Add Purchase</h2>
                  <form className="form-grid" onSubmit={addPurchase}>
                    <select
                      name="supplierId"
                      value={purchaseForm.supplierId}
                      onChange={handlePurchaseChange}
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>

                    <select
                      name="productId"
                      value={purchaseForm.productId}
                      onChange={handlePurchaseChange}
                    >
                      <option value="">Select Product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      name="quantity"
                      placeholder="Quantity Bought"
                      value={purchaseForm.quantity}
                      onChange={handlePurchaseChange}
                    />

                    <input
                      type="number"
                      name="purchasePricePerUnit"
                      placeholder="Purchase Price Per Unit"
                      value={purchaseForm.purchasePricePerUnit}
                      onChange={handlePurchaseChange}
                    />

                    <button className="submit-btn" type="submit">
                      Add Purchase
                    </button>
                  </form>
                </div>

                <div className="section-box">
                  <div className="section-header-row">
                    <h2>Purchase History</h2>
                    <div className="action-btn-group">
                      <button className="download-btn" onClick={handleDownloadPurchases}>
                        Download CSV
                      </button>
                      <button className="danger-btn" onClick={clearPurchaseHistory}>
                        Clear History
                      </button>
                    </div>
                  </div>

                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Supplier</th>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Purchase Price Per Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.length > 0 ? (
                        purchases.map((purchase) => (
                          <tr key={purchase.id}>
                            <td>{purchase.id}</td>
                            <td>{purchase.supplier?.name}</td>
                            <td>{purchase.product?.name}</td>
                            <td>{purchase.quantity}</td>
                            <td>{formatCurrency(purchase.purchasePricePerUnit)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5">No purchase data available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {page === "sales" && (
              <>
                <div className="section-box">
                  <h2>Add Sale</h2>
                  <form className="form-grid" onSubmit={addSale}>
                    <select
                      name="productId"
                      value={saleForm.productId}
                      onChange={handleSaleChange}
                    >
                      <option value="">Select Product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      name="soldUnits"
                      placeholder="Units Sold"
                      value={saleForm.soldUnits}
                      onChange={handleSaleChange}
                    />

                    <input
                      type="number"
                      name="sellingPricePerUnit"
                      placeholder="Selling Price Per Unit"
                      value={saleForm.sellingPricePerUnit}
                      onChange={handleSaleChange}
                    />

                    <input
                      type="text"
                      name="soldBy"
                      placeholder="Sold By"
                      value={saleForm.soldBy}
                      onChange={handleSaleChange}
                    />

                    <button className="submit-btn" type="submit">
                      Add Sale
                    </button>
                  </form>
                </div>

                <div className="section-box">
                  <div className="section-header-row">
                    <h2>Sales History</h2>
                    <div className="action-btn-group">
                      <button className="download-btn" onClick={handleDownloadSales}>
                        Download CSV
                      </button>
                      <button className="danger-btn" onClick={clearSalesHistory}>
                        Clear History
                      </button>
                    </div>
                  </div>

                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Product</th>
                        <th>Units Sold</th>
                        <th>Selling Price Per Unit</th>
                        <th>Sold By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.length > 0 ? (
                        sales.map((sale) => (
                          <tr key={sale.id}>
                            <td>{sale.id}</td>
                            <td>{sale.product?.name}</td>
                            <td>{sale.soldUnits}</td>
                            <td>{formatCurrency(sale.sellingPricePerUnit)}</td>
                            <td>{sale.soldBy}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5">No sales data available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {page === "analytics" && (
              <div className="section-box">
                <h2>Demand Predictions</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Current Stock</th>
                      <th>Predicted Demand</th>
                      <th>Suggested Reorder</th>
                      <th>Status</th>
                      <th>Sales Records</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.length > 0 ? (
                      predictions.map((p) => (
                        <tr key={p.productId}>
                          <td>{p.productName}</td>
                          <td>{p.currentStock}</td>
                          <td>{p.predictedDemand}</td>
                          <td>{p.suggestedReorder}</td>
                          <td>
                            <span className={getStatusClass(p.stockStatus)}>
                              {p.stockStatus}
                            </span>
                          </td>
                          <td>{p.recentSalesCount}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6">No predictions available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {page === "reports" && (
              <div className="reports-page">
                <div className="report-header">
                  <h2>Business Report</h2>
                  <p>Inventory, finance, and predictive analytics overview</p>
                </div>

                <div className="grid">
                  <div className="card">
                    <div className="card-label">Total Revenue</div>
                    <div className="card-value">
                      {formatCurrency(summary?.totalRevenue)}
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-label">Total Purchase Cost</div>
                    <div className="card-value">
                      {formatCurrency(summary?.totalPurchaseCost)}
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-label">Estimated Profit</div>
                    <div className="card-value">
                      {formatCurrency(summary?.estimatedProfit)}
                    </div>
                  </div>
                  <div className="card low-stock-card">
                    <div className="card-label">Low Stock Products</div>
                    <div className="card-value">{summary?.lowStockCount ?? 0}</div>
                  </div>
                </div>

                <div className="report-grid">
                  <div className="section-box">
                    <h3>Top Selling Products</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Total Sold</th>
                          <th>Total Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topSellingProducts.length > 0 ? (
                          topSellingProducts.map((item) => (
                            <tr key={item.productId}>
                              <td>{item.productName}</td>
                              <td>{item.totalSold}</td>
                              <td>{formatCurrency(item.totalRevenue)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3">No sales data available</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="section-box">
                    <h3>Low Stock Products</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Category</th>
                          <th>Stock Left</th>
                          <th>Threshold</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lowStockProducts.length > 0 ? (
                          lowStockProducts.map((item) => (
                            <tr key={item.id}>
                              <td>{item.name}</td>
                              <td>{item.category}</td>
                              <td>{item.currentStock}</td>
                              <td>{item.lowStockThreshold}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4">No low stock products</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="section-box">
                  <h3>Purchase History</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Purchase ID</th>
                        <th>Supplier</th>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Price Per Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.length > 0 ? (
                        purchases.map((purchase) => (
                          <tr key={purchase.id}>
                            <td>{purchase.id}</td>
                            <td>{purchase.supplier?.name}</td>
                            <td>{purchase.product?.name}</td>
                            <td>{purchase.quantity}</td>
                            <td>{formatCurrency(purchase.purchasePricePerUnit)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5">No purchase data available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;