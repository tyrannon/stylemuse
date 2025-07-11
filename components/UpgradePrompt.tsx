import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useTierManagement } from '../hooks/useTierManagement';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';

interface UpgradePromptProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  title: string;
  message: string;
  currentUsage?: number;
  limit?: number;
  feature: string;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  visible,
  onClose,
  onUpgrade,
  title,
  message,
  currentUsage,
  limit,
  feature
}) => {
  const { theme } = useTheme();
  const { userTier } = useTierManagement();
  
  const styles = createStyles(theme);

  const handleUpgrade = () => {
    logger.info(LogCategories.MONETIZATION, 'Upgrade prompt accepted', {
      feature,
      userTier,
      currentUsage,
      limit
    });
    onUpgrade();
    onClose();
  };

  const handleClose = () => {
    logger.info(LogCategories.MONETIZATION, 'Upgrade prompt dismissed', {
      feature,
      userTier,
      currentUsage,
      limit
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.tierBadge}>{userTier.toUpperCase()}</Text>
          </View>
          
          {currentUsage !== undefined && limit !== undefined && (
            <View style={styles.usageBar}>
              <View style={styles.usageBarBackground}>
                <View 
                  style={[
                    styles.usageBarFill,
                    { width: `${Math.min((currentUsage / limit) * 100, 100)}%` }
                  ]}
                />
              </View>
              <Text style={styles.usageText}>
                {currentUsage} / {limit} {feature}
              </Text>
            </View>
          )}
          
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.benefits}>
            <Text style={styles.benefitsTitle}>StyleMuse Pro includes:</Text>
            <Text style={styles.benefit}>• Unlimited AI outfit generation</Text>
            <Text style={styles.benefit}>• Unlimited wardrobe items</Text>
            <Text style={styles.benefit}>• Advanced style analytics</Text>
            <Text style={styles.benefit}>• Weather-based recommendations</Text>
            <Text style={styles.benefit}>• Priority customer support</Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Maybe Later</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={handleUpgrade}
              activeOpacity={0.8}
            >
              <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
  },
  tierBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    textAlign: 'center',
  },
  usageBar: {
    marginBottom: 20,
  },
  usageBarBackground: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  usageBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  usageText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  message: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
    marginBottom: 20,
  },
  benefits: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  benefit: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 6,
    paddingLeft: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  upgradeButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});