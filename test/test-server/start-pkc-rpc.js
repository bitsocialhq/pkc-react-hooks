import path from "path";
import assert from "assert";
import tcpPortUsed from "tcp-port-used";
import PKCRpc from "@pkcprotocol/pkc-js/rpc";
import { directory as getTmpFolderPath } from "tempy";
const pkcDataPath = getTmpFolderPath();

const startPkcRpc = async ({ port, ipfsApiPort, pubsubApiPort }) => {
  assert(typeof port === "number", `startPkcRpc port '${port}' not a number`);
  assert(typeof ipfsApiPort === "number", `startPkcRpc ipfsApiPort '${ipfsApiPort}' not a number`);
  assert(
    typeof pubsubApiPort === "number",
    `startPkcRpc pubsubApiPort '${pubsubApiPort}' not a number`,
  );

  const pkcOptions = {
    dataPath: pkcDataPath,
    kuboRpcClientsOptions: [`http://127.0.0.1:${ipfsApiPort}/api/v0`],
    pubsubKuboRpcClientsOptions: [`http://127.0.0.1:${pubsubApiPort}/api/v0`],
    httpRoutersOptions: [],
    resolveAuthorNames: false,
    validatePages: false,
  };

  console.log("pkc rpc: starting...");
  const pkcWebSocketServer = await PKCRpc.PKCWsServer({ port, pkcOptions });
  pkcWebSocketServer.ws.on("connection", (socket, request) => {
    console.log("pkc rpc: new connection");
    console.log("new pkc json-rpc websocket client connection");
    // debug raw JSON RPC messages in console
    socket.on("message", (message) => console.log(`pkc rpc: ${message.toString()}`));
  });
  // NOTE: don't subscribe to pkcWebSocketServer.on('error'), no errors should be emitted during tests

  await tcpPortUsed.waitUntilUsed(port);
  console.log(`pkc rpc: listening on port ${port}`);
};

export default startPkcRpc;
