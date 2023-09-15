// ClientNode.js
const BaseDistributedNode = require("../server/baseDistributedNode");
const OrderBook = require("../server/orderBook");

class ClientNode extends BaseDistributedNode {
  constructor(port, grape) {
    super(port, grape); // Call the parent constructor
    this.peerList = [];
    this.orderBook = new OrderBook();
    this.lockWorkerId = "lock_service"; // Assuming LockWorker is announced as 'lock_service'
    this.discoverPeersInterval = null;
  }

  start() {
    // Call parent announce method
    this.announce(`client_node`);

    this.service.on("request", (rid, key, payload, handler) => {
      console.log("Request received", payload, this.port);
      payload.processedBy = payload.processedBy || [];
      console.log(
        "Request received 2",
        payload.order.id,
        payload.processedBy,
        this.port
      );
      if (payload.processedBy.includes(this.port)) {
        return handler.reply(null, { msg: "Order processed" });
      } else {
        payload.processedBy.push(this.port);
      }
      switch (payload.action) {
        case "processOrder":
          this.handleIncomingOrder(
            payload.order,
            payload.processedBy,
            (err) => {
              console.log("Order processed");
              handler.reply(null, { msg: "Order processed" });
            }
          );
          break;
        default:
          handler.reply(new Error(`Unknown action ${payload.action}`), null);
      }
    });

    // Discover LockWorker
    this.link.lookup(this.lockWorkerId, (err, data) => {
      if (err) return console.error(err);
      console.log("LockWorker discovered");
    });

    // Discover other clients
    this.discoverPeers();
  }

  isValidOrder(order) {
    if (!order) return false;

    const requiredFields = ["id", "type", "price", "quantity"];

    for (let field of requiredFields) {
      if (!Object.hasOwnProperty.call(order, field)) return false;
    }

    if (
      ["buy", "sell"].includes(order.type) &&
      typeof order.price === "number" &&
      typeof order.quantity === "number"
    ) {
      return true;
    }

    return false;
  }

  handleMatching(newOrder, matchedOrder, processedBy = []) {
    const minQty = Math.min(newOrder.quantity, matchedOrder.quantity);

    const newMatchedOrder = {
      ...matchedOrder,
      quantity: matchedOrder.quantity - minQty,
    };

    const newIncomingOrder = {
      ...newOrder,
      quantity: newOrder.quantity - minQty,
    };

    if (newMatchedOrder.quantity > 0) {
      this.orderBook.addOrder(newMatchedOrder);
      this.broadcastOrderToPeers(newMatchedOrder, processedBy);
    }

    if (newIncomingOrder.quantity > 0) {
      this.orderBook.addOrder(newIncomingOrder);
      this.broadcastOrderToPeers(newIncomingOrder, processedBy);
    }
  }

  handleIncomingOrder(newOrder, processedBy, callback) {
    const maxRetries = 5;
    let retries = 0;

    const acquireLock = (id, next) => {
      console.log("Acquiring lock for", id);
      this.lockOrder(id, (err, data) => {
        if (err || !data.lockGranted) {
          if (retries < maxRetries) {
            retries++;
            setTimeout(() => acquireLock(id, next), 2000); // wait 1 second before retrying
            return;
          } else {
            console.log("Could not acquire lock");
            return callback(new Error("Could not acquire lock"));
          }
        }
        next(err, data);
      });
    };
    acquireLock(newOrder.id, (err, data) => {
      if (err) {
        console.error("Error while locking:", err);
        return callback(err);
      }
      if (!data.lockGranted) {
        console.log("Lock not granted for incoming order");
        return callback();
      }
      if (!this.isValidOrder(newOrder)) {
        console.error("Invalid order structure");
        return;
      }
      const matchedOrder = this.orderBook.findMatchingOrder(newOrder);
      if (!matchedOrder) {
        console.log("No matching order found");
        this.orderBook.addOrder(newOrder);
        this.unlockOrder(newOrder.id, (err, data) => {
          if (err) console.error(err);
          this.broadcastOrderToPeers(newOrder, processedBy);
          return callback();
        });
      } else {
        acquireLock(matchedOrder.id, (err, data) => {
          if (err) return console.error(err);
          if (!data.lockGranted)
            return console.log("Lock not granted for matchedOrder");

          this.handleMatching(newOrder, matchedOrder);

          this.unlockOrder(matchedOrder.id, (err, data) => {
            if (err) console.error(err);
            // Unlock the incoming order
            this.unlockOrder(newOrder.id, (err, data) => {
              if (err) console.error(err);
              return callback();
            });
          });
        });
      }
    });
  }

  lockOrder(orderId, callback) {
    this.client.request(
      this.lockWorkerId,
      { action: "lock", orderId },
      { timeout: 10000 },
      callback
    );
  }

  unlockOrder(orderId, callback) {
    this.client.request(
      this.lockWorkerId,
      { action: "unlock", orderId },
      { timeout: 10000 },
      callback
    );
  }

  broadcastOrderToPeers(order, processedBy = []) {
    this.client.request(
      `client_node`,
      { action: "processOrder", order, processedBy },
      { timeout: 10000 },
      (err, data) => {
        if (err) console.error(err);
      }
    );
  }

  discoverPeers() {
    let retries = 0;
    const maxRetries = 5;
    let logOnce = true;
    const lookup = () => {
      this.link.lookup("client_node", (err, data) => {
        console.log("lookup", data);
        if (err) {
          if (
            err.message === "ERR_GRAPE_LOOKUP_EMPTY" &&
            retries < maxRetries
          ) {
            retries++;
            console.log("No peers found, retrying...");
            setTimeout(lookup, 2000); // retry after 2 seconds
            return;
          }
          console.error(err);
          return;
        }

        // Reset retries if successful
        retries = 0;

        // Update peer list, filter out self
        this.peerList = data.filter((host) => !host.includes(this.port));

        if (logOnce) {
          console.log(
            `client_node_${this.port} Peer list updated: ${this.peerList}`
          );
          logOnce = false;
        }
        console.log(
          `-------- Showing order book client_node_${this.port}----------`
        );
        this.orderBook.showOrders();
        console.log("-------- End Order Book ------------");
      });
    };

    // run the first lookup
    lookup();

    // set interval to run subsequent lookups
    const intervalId = setInterval(lookup, 5000); // run every 5 seconds
  }

  stop() {
    if (this.discoverPeersInterval) {
      clearInterval(this.discoverPeersInterval);
    }
  }
}

module.exports = ClientNode;
