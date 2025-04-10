// config/eventEmitter.config.ts
import { EventEmitter } from "events";

class AppEventEmitter extends EventEmitter {}
const eventEmitter = new AppEventEmitter();

// Verify it's a singleton
console.log("EventEmitter instance ID:", (eventEmitter as any).id || "no-id");

export { eventEmitter };
