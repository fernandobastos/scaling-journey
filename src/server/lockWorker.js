const BaseDistributedNode = require("./baseDistributedNode");

class LockWorker extends BaseDistributedNode {
  constructor(port, grape) {
    super(port, grape);
    this.lockedOrders = {};
  }

  start() {
    this.announce(`lock_service`);

    this.service.on("request", (rid, key, payload, handler) => {
      const { action, orderId } = payload;
      if (action === "lock") {
        if (this.lockedOrders[orderId]) {
          handler.reply(null, { lockGranted: false });
        } else {
          this.lockedOrders[orderId] = true;
          handler.reply(null, { lockGranted: true });
        }
      } else if (action === "unlock") {
        delete this.lockedOrders[orderId];
        handler.reply(null, { lockReleased: true });
      } else if (action === "status") {
        const isLocked = !!this.lockedOrders[orderId];
        handler.reply(null, { isLocked });
      }
    });
  }
}

module.exports = LockWorker;
