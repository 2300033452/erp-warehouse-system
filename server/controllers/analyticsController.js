const prisma = require("../prismaClient");

const getSummary = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        sales: true,
        purchases: true,
      },
    });
    const suppliers = await prisma.supplier.findMany();
    const purchases = await prisma.purchase.findMany();
    const sales = await prisma.sale.findMany();

    const totalProducts = products.length;
    const totalSuppliers = suppliers.length;
    const totalPurchases = purchases.length;
    const totalSales = sales.length;

    const totalStock = products.reduce((sum, product) => sum + product.stock, 0);

    const lowStockProducts = products
      .filter((product) => product.stock <= product.lowStockThreshold)
      .map((product) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        currentStock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
      }));

    const lowStockCount = lowStockProducts.length;

    const totalRevenue = sales.reduce(
      (sum, sale) => sum + sale.soldUnits * sale.sellingPricePerUnit,
      0
    );

    const totalPurchaseCost = purchases.reduce(
      (sum, purchase) => sum + purchase.quantity * purchase.purchasePricePerUnit,
      0
    );

    const estimatedProfit = totalRevenue - totalPurchaseCost;

    res.json({
      totalProducts,
      totalSuppliers,
      totalPurchases,
      totalSales,
      totalStock,
      lowStockCount,
      lowStockProducts,
      totalRevenue,
      totalPurchaseCost,
      estimatedProfit,
    });
  } catch (error) {
    console.error("Get analytics summary error:", error);
    res.status(500).json({ error: "Failed to fetch analytics summary" });
  }
};

const getPredictions = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        sales: {
          orderBy: { date: "desc" },
        },
      },
    });

    const predictions = products.map((product) => {
      const recentSales = product.sales.slice(0, 3);

      let predictedDemand = 0;

      if (recentSales.length === 0) {
        predictedDemand = 0;
      } else if (recentSales.length === 1) {
        predictedDemand = recentSales[0].soldUnits;
      } else if (recentSales.length === 2) {
        predictedDemand = Math.round(
          recentSales[0].soldUnits * 0.6 + recentSales[1].soldUnits * 0.4
        );
      } else {
        predictedDemand = Math.round(
          recentSales[0].soldUnits * 0.5 +
            recentSales[1].soldUnits * 0.3 +
            recentSales[2].soldUnits * 0.2
        );
      }

      const buffer = 10;
      const suggestedReorder = Math.max(predictedDemand + buffer - product.stock, 0);

      let stockStatus = "Healthy";
      if (product.stock <= product.lowStockThreshold) {
        stockStatus = "Low Stock";
      }
      if (product.stock === 0) {
        stockStatus = "Out of Stock";
      }

      return {
        productId: product.id,
        productName: product.name,
        currentStock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        predictedDemand,
        suggestedReorder,
        stockStatus,
        recentSalesCount: product.sales.length,
      };
    });

    res.json(predictions);
  } catch (error) {
    console.error("Get predictions error:", error);
    res.status(500).json({ error: "Failed to fetch predictions" });
  }
};

module.exports = {
  getSummary,
  getPredictions,
};