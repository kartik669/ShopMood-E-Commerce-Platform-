const mockProducts = require("./mockProducts");

const inMemoryOrders = [
  {
    _id: "65f000000000000000000099",
    userId: { _id: "67fc10776358a0393a221b3d", name: "Admin User", email: "admin@shopmood.com" },
    items: [
      {
        _id: "65f000000000000000000005",
        name: "Horizon Pro Smartwatch",
        price: 249.99,
        quantity: 1,
        imageUrl: "/images/products/smartwatch.jpg",
      },
    ],
    totalAmount: 249.99,
    address: { street: "221B Baker St", city: "London", postalCode: "NW16XE", country: "UK" },
    paymentId: "sandbox_txn_demo",
    status: "Delivered",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

module.exports = {
  products: mockProducts,
  orders: inMemoryOrders,
};
