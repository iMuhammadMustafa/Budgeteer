import { Dispatch, createContext, useCallback, useContext, useMemo, useReducer, useState } from "react";
import generateUuid from "../lib/uuidHelper";

export enum ActionTypes {
  Add = "ADD",
  Remove = "REMOVE",
  Clear = "CLEAR",
}
type NotificationType = {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
};
type NotificationActionType =
  | { type: ActionTypes.Add; payload: NotificationType }
  | { type: ActionTypes.Remove; payload: string }
  | { type: ActionTypes.Clear };

type NotificationContextType = {
  notifications: NotificationType[];
  //   dispatch: Dispatch<NotificationActionType>;
  addNotification: (notification: NotificationType) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
};

const notificationsReducer = (state: NotificationType[], action: NotificationActionType) => {
  switch (action.type) {
    case ActionTypes.Add:
      return [...state, action.payload];
    case ActionTypes.Remove:
      return state.filter(notification => notification.id !== action.payload);
    //   return state.filter(notification => notification !== action.payload);
    case ActionTypes.Clear:
      return [];
    default:
      return state;
  }
};

const NotificationsContext = createContext<NotificationContextType | null>(null);

export default function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, dispatch] = useReducer(notificationsReducer, []);

  const addNotification = useCallback(
    (notification: NotificationType) =>
      dispatch({ type: ActionTypes.Add, payload: { ...notification, id: generateUuid() } }),
    [dispatch],
  );
  const removeNotification = useCallback(
    (id: string) => dispatch({ type: ActionTypes.Remove, payload: id }),
    [dispatch],
  );
  const clearNotifications = useCallback(() => dispatch({ type: ActionTypes.Clear }), [dispatch]);
  const value = useMemo(
    () => ({ notifications, addNotification, removeNotification, clearNotifications }),
    [notifications, addNotification, removeNotification, clearNotifications],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
};
