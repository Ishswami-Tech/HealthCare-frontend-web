import React from "react";
import { useWebSocketContext } from "./WebSocketProvider";

export function withWebSocket<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  const WithWebSocketComponent = (props: P) => {
    const webSocketContext = useWebSocketContext();

    return <WrappedComponent {...props} webSocket={webSocketContext} />;
  };

  WithWebSocketComponent.displayName = `withWebSocket(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;

  return WithWebSocketComponent;
}
