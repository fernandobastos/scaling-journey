const ClientNode = require("./client/clientNode");
const LockWorker = require("./server/lockWorker");

const lockWorker = new LockWorker(3000, "http://127.0.0.1:30001");
lockWorker.start();

const node1 = new ClientNode(5001, "http://127.0.0.1:30001");
const node2 = new ClientNode(5002, "http://127.0.0.1:30001");

node1.start();
node2.start();

// setTimeout(() => {
//   const newOrder = {
//     id: "order1",
//     type: "buy",
//     price: 100,
//     quantity: 5,
//   };
//   node1.sendOrderToWorker(newOrder);
// }, 2000);
