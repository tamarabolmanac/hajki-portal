import { createConsumer } from "@rails/actioncable";
import { config } from "./config";

export function connectWebsocket(token) {
  const wsBase = config.apiUrl.replace(/^http/, 'ws');
  const url = `${wsBase}/cable?token=${encodeURIComponent(token || '')}`;
  return createConsumer(url);
}