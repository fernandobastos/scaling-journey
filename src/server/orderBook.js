class OrderBook {
  constructor() {
    this.buyOrders = [];
    this.sellOrders = [];
    this.locks = {};
  }

  addOrder(order) {
    if (order.type === "buy") {
      this.buyOrders.push(order);
      this.buyOrders.sort((a, b) => b.price - a.price); // Descending
    } else if (order.type === "sell") {
      this.sellOrders.push(order);
      this.sellOrders.sort((a, b) => a.price - b.price); // Ascending
    }
  }

  findMatchingOrder(newOrder) {
    let match = null;

    if (newOrder.type === "buy") {
      // Sort by price first, then by timestamp
      const sortedSellOrders = this.sellOrders.sort(
        (a, b) => a.price - b.price || a.timestamp - b.timestamp
      );
      match = sortedSellOrders.find((order) => order.price <= newOrder.price);
    } else {
      // Sort by price first, then by timestamp
      const sortedBuyOrders = this.buyOrders.sort(
        (a, b) => b.price - a.price || a.timestamp - b.timestamp
      );
      match = sortedBuyOrders.find((order) => order.price >= newOrder.price);
    }

    return match;
  }

  showOrders() {
    console.log("Buy Orders:");
    console.table(this.buyOrders);
    console.log("Sell Orders:");
    console.table(this.sellOrders);
  }
}

module.exports = OrderBook;
