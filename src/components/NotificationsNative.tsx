import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Animated, StyleSheet, Platform } from "react-native";
import { NotificationType, useNotifications } from "../providers/NotificationsProvider";

export default function Notification() {
  const { notifications } = useNotifications();

  return (
    <View style={styles.container}>
      {notifications.map(notification => (
        <NotificationAlert key={notification.id} notification={notification} />
      ))}
    </View>
  );
}

const NotificationAlert = ({ notification }: { notification: NotificationType }) => {
  const { removeNotification } = useNotifications();
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const opacityAnimation = useRef(new Animated.Value(1)).current;
  const [isPaused, setIsPaused] = useState(false);

  const handleCloseClick = () => {
    Animated.timing(opacityAnimation, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      removeNotification(notification.id);
    });
  };

  const startAnimation = () => {
    Animated.timing(progressAnimation, {
      toValue: 100,
      duration: 5000, // 5 seconds
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        handleCloseClick();
      }
    });
  };

  useEffect(() => {
    if (!isPaused) {
      startAnimation();
    } else {
      progressAnimation.stopAnimation();
    }

    // return () => {
    //   progressAnimation.stopAnimation();
    // };
  }, [isPaused]);

  const handleMouseEnter = () => {
    if (Platform.OS === "web") {
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    if (Platform.OS === "web") {
      setIsPaused(false);
    }
  };

  const backgroundColor =
    {
      success: "#10B981",
      error: "#EF4444",
      warning: "#F59E0B",
      info: "#3B82F6",
    }[notification.type] || "#3B82F6";

  return (
    <Animated.View
      style={[styles.alertContainer, { backgroundColor, opacity: opacityAnimation }]}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Text style={styles.message}>{notification.message}</Text>
      <TouchableOpacity onPress={handleCloseClick} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>
      <View style={styles.progressBarContainer}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: progressAnimation.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1000,
  },
  alertContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    width: "90%",
    maxWidth: 800,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  message: {
    color: "white",
    fontWeight: "bold",
  },
  closeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    padding: 4,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
  },
  progressBarContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 4,
    height: 4,
    overflow: "hidden",
    marginTop: 8,
  },
  progressBar: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    height: "100%",
  },
});
