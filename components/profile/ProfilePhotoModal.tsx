import { Icon } from '@/src/components/ui/icon';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';

const SCREEN_H = Dimensions.get('window').height;

type Props = {
  visible: boolean;
  onClose: () => void;
  onTakePhoto?: () => void;
  onChooseFromGallery?: () => void;
  isUploading?: boolean;
};

export function ProfilePhotoModal({
  visible,
  onClose,
  onTakePhoto,
  onChooseFromGallery,
  isUploading = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useMasjidConfig();
  const fg = colors.foreground.replace(/ /g, ',');
  const fgRgb = `rgb(${fg})`;
  const bgRgb = `rgb(${colors.background.replace(/ /g, ',')})`;
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;
  const styles = makeStyles({ fg, fgRgb, bgRgb, accentRgb });
  const [mounted, setMounted] = useState(visible);
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 0,
          duration: 160,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: SCREEN_H,
          duration: 260,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setMounted(false);
      });
    }
  }, [visible, translateY, backdrop, mounted]);

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View
          pointerEvents={visible ? 'auto' : 'none'}
          style={[styles.backdrop, { opacity: backdrop }]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              marginBottom: Math.max(insets.bottom, 12) - 5,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          <View style={styles.titleRow}>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={styles.closeButton}
            >
              <Icon name="close" size={18} color={`rgba(${fg},0.55)`} />
            </Pressable>
            <Text style={styles.title}>Profile Photo</Text>
            <View style={styles.closeButtonSpacer} />
          </View>

          <Text style={styles.heading}>Add a Profile Photo</Text>

          <Pressable
            onPress={onChooseFromGallery}
            disabled={isUploading}
            android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: false }}
            style={styles.tapToAdd}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color={accentRgb} />
            ) : (
              <>
                <Icon name="camera-outline" size={32} color={accentRgb} />
                <Text style={styles.tapToAddLabel}>Tap to add</Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={onTakePhoto}
            disabled={isUploading}
            style={[styles.actionButton, isUploading && styles.actionDisabled]}
          >
            <Icon name="camera-outline" size={18} color={fgRgb} style={styles.actionIcon} />
            <Text style={styles.actionLabel}>Take Photo</Text>
          </Pressable>

          <Pressable
            onPress={onChooseFromGallery}
            disabled={isUploading}
            style={[styles.actionButton, isUploading && styles.actionDisabled]}
          >
            <Icon name="images-outline" size={18} color={fgRgb} style={styles.actionIcon} />
            <Text style={styles.actionLabel}>Choose from Gallery</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const makeStyles = (c: {
  fg: string;
  fgRgb: string;
  bgRgb: string;
  accentRgb: string;
}) =>
  StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
      paddingHorizontal: 12,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
    },
    sheet: {
      backgroundColor: c.bgRgb,
      borderRadius: 28,
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 24,
    },
    handleRow: {
      alignItems: 'center',
      paddingBottom: 8,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: `rgba(${c.fg},0.18)`,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 4,
      paddingBottom: 16,
    },
    closeButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: `rgba(${c.fg},0.06)`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeButtonSpacer: {
      width: 28,
    },
    title: {
      color: c.fgRgb,
      fontSize: 14,
      fontWeight: '600',
    },
    heading: {
      color: c.fgRgb,
      fontSize: 22,
      fontWeight: '700',
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 24,
    },
    tapToAdd: {
      alignSelf: 'center',
      width: 116,
      height: 116,
      borderRadius: 58,
      backgroundColor: `rgba(${c.fg},0.04)`,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 28,
      borderWidth: 1,
      borderColor: c.accentRgb,
    },
    tapToAddLabel: {
      color: c.fgRgb,
      fontSize: 11,
      fontWeight: '600',
      marginTop: 4,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'stretch',
      height: 48,
      borderRadius: 24,
      backgroundColor: `rgba(${c.fg},0.05)`,
      borderWidth: 1,
      borderColor: `rgba(${c.fg},0.12)`,
      marginBottom: 10,
    },
    actionIcon: {
      marginRight: 8,
    },
    actionLabel: {
      color: c.fgRgb,
      fontSize: 14,
      fontWeight: '600',
    },
    actionDisabled: {
      opacity: 0.5,
    },
  });

