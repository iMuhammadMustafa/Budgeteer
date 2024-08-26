import { useEffect, useState } from "react";
import { NotificationType, useNotifications } from "../providers/NotificationsProvider";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { tw } from "nativewind";

export default function Notification() {
  const { notifications } = useNotifications();

  return (
    notifications.length > 0 && (
      <View className="flex flex-col items-center my-5">
        {notifications.map(notification => (
          <NotificationAlert key={notification.id} notification={notification} />
        ))}
      </View>
    )
  );
}

const NotificationAlert = ({ notification }: { notification: NotificationType }) => {
  const [width, setWidth] = useState(new Animated.Value(0));
  const [intervalID, setIntervalID] = useState<NodeJS.Timeout | null>(null);
  const { removeNotification } = useNotifications();
  const [exit, setExit] = useState(false);

  const handleCloseClick = () => {
    if (intervalID) {
      clearInterval(intervalID);
    }
    setExit(true);

    setTimeout(() => {
      removeNotification(notification.id);
    }, 400); // Delay to allow exit animation
  };

  const handleStartTimer = () => {
    const id = setInterval(() => {
      setWidth(prev => {
        if (prev._value < 100) {
          Animated.timing(prev, {
            toValue: prev._value + 1, // Increment by 1 for smoother progress
            duration: 20,
            useNativeDriver: false,
          }).start();
          return prev;
        }
        clearInterval(id);
        return prev;
      });
    }, 20);
    setIntervalID(id);
  };

  const handlePauseTimer = () => {
    if (intervalID) clearInterval(intervalID);
  };

  useEffect(() => {
    handleStartTimer();
    return () => {
      if (intervalID) clearInterval(intervalID); // Cleanup interval on unmount
    };
  }, []);

  useEffect(() => {
    if (width._value >= 100) {
      handleCloseClick();
    }
  }, [width]);

  const backgroundColor =
    notification.type === "success"
      ? "bg-green-500"
      : notification.type === "error"
        ? "bg-red-500"
        : notification.type === "warning"
          ? "bg-yellow-500"
          : "bg-blue-500";

  return (
    <Animated.View
      onTouchStart={handlePauseTimer}
      onTouchEnd={handleStartTimer}
      className={`${backgroundColor} p-4 rounded-md shadow-md mb-2 ${exit ? "opacity-0" : "opacity-100"} transition-opacity duration-400`}
    >
      <Text className="text-white font-bold">{notification.message}</Text>
      <TouchableOpacity onPress={handleCloseClick} className="absolute top-1 right-1 p-1">
        <Text className="text-white">✕</Text>
      </TouchableOpacity>
      <View className="bg-gray-300 rounded-full h-2 overflow-hidden mt-2">
        <Animated.View
          className="bg-green-600 h-full"
          style={{
            width: width.interpolate({
              inputRange: [0, 100],
              outputRange: ["0%", "100%"],
            }),
          }}
        />
      </View>
    </Animated.View>
  );
};
