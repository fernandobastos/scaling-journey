const PeerRPCServer = require("grenache-nodejs-http").PeerRPCServer;
const PeerRPCClient = require("grenache-nodejs-http").PeerRPCClient;
const Link = require("grenache-nodejs-link");

class BaseDistributedNode {
  constructor(port, grape) {
    this.port = port;
    this.grape = grape;
    this.link = new Link({ grape: this.grape });
    this.link.start();

    this.peer = new PeerRPCServer(this.link, { timeout: 300000 });
    this.peer.init();

    this.client = new PeerRPCClient(this.link, {});
    this.client.init();

    this.service = this.peer.transport("server");
    this.service.listen(this.port);
  }

  announce(serviceName) {
    console.log(`Announcing ${serviceName} on port ${this.port}`);
    setInterval(() => {
      this.link.announce(serviceName, this.port, {});
    }, 1000);
  }
}

module.exports = BaseDistributedNode;
