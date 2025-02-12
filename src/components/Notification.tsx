import React, { useCallback, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  cancelAnimation,
  runOnJS,
  useAnimatedReaction,
} from "react-native-reanimated";
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
  const progress = useSharedValue(0);
  const opacity = useSharedValue(1);
  const isPaused = useSharedValue(false);
  const remainingTime = useSharedValue(5000);

  const handleCloseClick = useCallback(() => {
    opacity.value = withTiming(0, { duration: 400 }, finished => {
      if (finished) {
        runOnJS(removeNotification)(notification.id);
      }
    });
  }, [opacity, removeNotification, notification.id]);

  const startAnimation = useCallback(() => {
    progress.value = withTiming(100, { duration: remainingTime.value });
  }, [progress, remainingTime]);

  useEffect(() => {
    startAnimation();
    return () => {
      cancelAnimation(progress);
    };
  }, [startAnimation]);

  useAnimatedReaction(
    () => progress.value,
    currentProgress => {
      if (currentProgress >= 100 && !isPaused.value) {
        runOnJS(handleCloseClick)();
      }
    },
    [isPaused.value],
  );

  const handleMouseEnter = useCallback(() => {
    if (Platform.OS === "web") {
      isPaused.value = true;
      cancelAnimation(progress);
      remainingTime.value = remainingTime.value * (1 - progress.value / 100);
    }
  }, [isPaused, progress, remainingTime]);

  const handleMouseLeave = useCallback(() => {
    if (Platform.OS === "web") {
      isPaused.value = false;
      startAnimation();
    }
  }, [isPaused, startAnimation]);

  const backgroundColor =
    {
      success: "#10B981",
      error: "#EF4444",
      warning: "#F59E0B",
      info: "#3B82F6",
    }[notification.type] || "#3B82F6";

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const progressBarStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value}%`,
    };
  });

  return (
    <Animated.View
      style={[styles.alertContainer, { backgroundColor }, animatedStyle]}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Text style={styles.message}>{notification.message}</Text>
      <TouchableOpacity onPress={handleCloseClick} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>
      <View style={styles.progressBarContainer}>
        <Animated.View style={[styles.progressBar, progressBarStyle]} />
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
