import { Feather } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { Animated, Dimensions, Modal, Text, TouchableOpacity, View } from 'react-native';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

interface Toast {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
  title?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface NotificationContextType {
  show: (message: string, type: NotificationType, duration?: number, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  confirm: (message: string, onConfirm: () => void, onCancel?: () => void, title?: string) => void;
}

export const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined);

const typeConfig = {
  success: {
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    titleColor: 'text-green-700',
    icon: 'check-circle',
    iconColor: '#10b981',
    buttonColor: 'bg-green-600'
  },
  error: {
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    titleColor: 'text-red-700',
    icon: 'alert-circle',
    iconColor: '#ef4444',
    buttonColor: 'bg-red-600'
  },
  warning: {
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    titleColor: 'text-yellow-700',
    icon: 'alert-triangle',
    iconColor: '#f59e0b',
    buttonColor: 'bg-yellow-600'
  },
  info: {
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    titleColor: 'text-blue-700',
    icon: 'info',
    iconColor: '#3b82f6',
    buttonColor: 'bg-blue-600'
  },
  confirm: {
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    titleColor: 'text-purple-700',
    icon: 'help-circle',
    iconColor: '#a855f7',
    buttonColor: 'bg-purple-600'
  }
};

interface NotificationItemProps {
  id: string;
  message: string;
  type: NotificationType;
  title?: string;
  onClose: (id: string) => void;
  duration?: number;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  id,
  message,
  type,
  title,
  onClose,
  duration = 3000,
  onConfirm,
  onCancel
}) => {
  const [visible, setVisible] = useState(true);
  const [scaleAnim] = useState(new Animated.Value(0));
  const config = typeConfig[type];
  const screenWidth = Dimensions.get('window').width;
  const boxSize = Math.min(screenWidth * 0.85, 400); // Max 400px atau 85% screen width

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 12,
        bounciness: 8,
      }).start();
    }
  }, [visible, scaleAnim]);

  const handleClose = () => {
    Animated.spring(scaleAnim, {
      toValue: 0,
      useNativeDriver: true,
      speed: 12,
    }).start(() => {
      setVisible(false);
      onClose(id);
    });
  };

  const handleConfirm = () => {
    onConfirm?.();
    handleClose();
  };

  const handleCancel = () => {
    onCancel?.();
    handleClose();
  };

  React.useEffect(() => {
    if (type !== 'confirm' && duration > 0) {
      const timer = setTimeout(handleClose, duration);
      return () => clearTimeout(timer);
    }
  }, [type, duration]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/40 justify-center items-center px-6">
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            width: boxSize,
            aspectRatio: 1,
          }}
        >
          <View
            className={`
              w-full h-full rounded-3xl p-8 shadow-2xl
              ${config.bgColor} border-2 ${config.borderColor}
              flex justify-center items-center
            `}
          >
            {/* Icon */}
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-6"
              style={{ backgroundColor: config.iconColor + '20' }}
            >
              <Feather
                name={config.icon as any}
                size={48}
                color={config.iconColor}
              />
            </View>

            {/* Title */}
            {title && (
              <Text
                className={`text-2xl font-bold ${config.titleColor} text-center mb-3`}
                style={{
                  transform: [{ scale: 1.2 }],
                }}
              >
                {title}
              </Text>
            )}

            {/* Message */}
            <Text className="text-gray-700 text-center mb-8 leading-6 font-medium text-base">
              {message}
            </Text>

            {/* Button Actions */}
            {type === 'confirm' ? (
              <View className="w-full gap-3 flex-row">
                <TouchableOpacity
                  onPress={handleCancel}
                  className="flex-1 py-3 px-4 border-2 border-gray-400 rounded-xl"
                >
                  <Text className="text-gray-700 font-bold text-center text-sm">Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleConfirm}
                  className={`flex-1 py-3 px-4 ${config.buttonColor} rounded-xl`}
                >
                  <Text className="text-white font-bold text-center text-sm">Ya</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleClose}
                className={`w-full py-3 px-4 ${config.buttonColor} rounded-xl`}
              >
                <Text className="text-white font-bold text-center text-sm">OK</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: NotificationType, duration = 3000, title?: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setNotifications(prev => [...prev, { id, message, type, duration, title }]);
  }, []);

  const success = useCallback((message: string, title = 'Sukses') => {
    show(message, 'success', 3000, title);
  }, [show]);

  const error = useCallback((message: string, title = 'Error') => {
    show(message, 'error', 4000, title);
  }, [show]);

  const warning = useCallback((message: string, title = 'Perhatian') => {
    show(message, 'warning', 3500, title);
  }, [show]);

  const info = useCallback((message: string, title = 'Informasi') => {
    show(message, 'info', 3000, title);
  }, [show]);

  const confirm = useCallback((message: string, onConfirm: () => void, onCancel?: () => void, title = 'Konfirmasi') => {
    const id = `${Date.now()}-${Math.random()}`;
    setNotifications(prev => [...prev, { id, message, type: 'confirm', title, onConfirm, onCancel }]);
  }, []);

  const handleClose = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ show, success, error, warning, info, confirm }}>
      {children}
      
      {/* Notification Modal Container */}
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          id={notification.id}
          message={notification.message}
          type={notification.type}
          title={notification.title}
          duration={notification.duration}
          onClose={handleClose}
          onConfirm={notification.onConfirm}
          onCancel={notification.onCancel}
        />
      ))}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};