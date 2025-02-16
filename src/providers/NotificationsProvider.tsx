import { Dispatch, createContext, useCallback, useContext, useMemo, useReducer, useState } from "react";
import GenerateUuid from "../utils/UUID.Helper";

export enum ActionTypes {
  Add = "ADD",
  Remove = "REMOVE",
  Clear = "CLEAR",
}
export type NotificationType = {
  id?: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
};
export type NotificationActionType =
  | { type: ActionTypes.Add; payload: NotificationType }
  | { type: ActionTypes.Remove; payload: string }
  | { type: ActionTypes.Clear };

export type NotificationContextType = {
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
      dispatch({ type: ActionTypes.Add, payload: { ...notification, id: GenerateUuid() } }),
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
