import { createContext, useContext, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";

// Notification Context
const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  }
  return context;
};

// Notification Provider
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now();
    const newNotification = {
      id,
      type: notification.type || "info", // 'success', 'error', 'warning', 'info', 'fraud'
      title: notification.title,
      message: notification.message,
      duration: notification.duration || 5000,
      action: notification.action,
    };

    setNotifications((prev) => [...prev, newNotification]);

    // Auto-remove after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, removeNotification }}
    >
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

// Notification Container (Renders all notifications)
const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotifications();

  // Animate notifications when they appear
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotif = `.notification-${
        notifications[notifications.length - 1].id
      }`;
      gsap.fromTo(
        latestNotif,
        { x: 400, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: "back.out(2)" }
      );
    }
  }, [notifications]);

  return createPortal(
    <div className="fixed top-20 right-4 z-[9999] space-y-3 max-w-md">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>,
    document.body
  );
};

// Individual Notification Component
const Notification = ({ notification, onClose }) => {
  const { type, title, message, action } = notification;

  const handleClose = () => {
    const notifElement = `.notification-${notification.id}`;
    gsap.to(notifElement, {
      x: 400,
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete: onClose,
    });
  };

  // Type-based styling
  const typeStyles = {
    success: {
      bg: "bg-emerald-900/90",
      border: "border-emerald-500/50",
      icon: "✓",
      iconBg: "bg-emerald-500/20",
      iconColor: "text-emerald-400",
    },
    error: {
      bg: "bg-red-900/90",
      border: "border-red-500/50",
      icon: "✕",
      iconBg: "bg-red-500/20",
      iconColor: "text-red-400",
    },
    warning: {
      bg: "bg-amber-900/90",
      border: "border-amber-500/50",
      icon: "⚠",
      iconBg: "bg-amber-500/20",
      iconColor: "text-amber-400",
    },
    info: {
      bg: "bg-blue-900/90",
      border: "border-blue-500/50",
      icon: "ℹ",
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-400",
    },
    fraud: {
      bg: "bg-red-950/95",
      border: "border-red-500",
      icon: "🚨",
      iconBg: "bg-red-500/20",
      iconColor: "text-red-400",
    },
  };

  const style = typeStyles[type] || typeStyles.info;

  return (
    <div
      className={`notification-${notification.id} ${style.bg} border ${style.border} rounded-xl p-4 backdrop-blur-xl shadow-2xl flex items-start gap-4 min-w-[320px]`}
    >
      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-lg ${style.iconBg} flex items-center justify-center flex-shrink-0`}
      >
        <span className={`${style.iconColor} text-xl`}>{style.icon}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-bold text-white text-sm mb-1">{title}</h4>
        )}
        {message && (
          <p className="text-slate-300 text-sm leading-relaxed">{message}</p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 underline"
          >
            {action.label}
          </button>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          ></path>
        </svg>
      </button>
    </div>
  );
};

// Hook for easy notification usage
export const useNotify = () => {
  const { addNotification } = useNotifications();

  return {
    success: (title, message, action) =>
      addNotification({ type: "success", title, message, action }),
    error: (title, message, action) =>
      addNotification({ type: "error", title, message, action }),
    warning: (title, message, action) =>
      addNotification({ type: "warning", title, message, action }),
    info: (title, message, action) =>
      addNotification({ type: "info", title, message, action }),
    fraud: (title, message, action) =>
      addNotification({ type: "fraud", title, message, action, duration: 0 }), // No auto-dismiss for fraud
  };
};
