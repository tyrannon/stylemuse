import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PhotoEditingToolbarProps {
  currentTool: 'crop' | 'adjust' | 'enhance' | 'background';
  onToolSelect: (tool: 'crop' | 'adjust' | 'enhance' | 'background') => void;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const PhotoEditingToolbar: React.FC<PhotoEditingToolbarProps> = ({
  currentTool,
  onToolSelect,
  onUndo,
  onRedo,
  onReset,
  canUndo,
  canRedo,
}) => {
  const tools = [
    { id: 'crop', icon: 'crop', label: 'Crop' },
    { id: 'adjust', icon: 'options', label: 'Adjust' },
    { id: 'enhance', icon: 'sparkles', label: 'Enhance' },
    { id: 'background', icon: 'cut', label: 'Background' },
  ] as const;

  return (
    <View style={styles.container}>
      {/* Tool selection */}
      <View style={styles.toolSelection}>
        {tools.map((tool) => (
          <TouchableOpacity
            key={tool.id}
            onPress={() => onToolSelect(tool.id)}
            style={[
              styles.toolButton,
              currentTool === tool.id && styles.activeToolButton,
            ]}
          >
            <Ionicons
              name={tool.icon as any}
              size={24}
              color={currentTool === tool.id ? '#007AFF' : '#8E8E93'}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Action buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          onPress={onUndo}
          disabled={!canUndo}
          style={[styles.actionButton, !canUndo && styles.disabledButton]}
        >
          <Ionicons
            name="arrow-undo"
            size={20}
            color={canUndo ? '#007AFF' : '#8E8E93'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onRedo}
          disabled={!canRedo}
          style={[styles.actionButton, !canRedo && styles.disabledButton]}
        >
          <Ionicons
            name="arrow-redo"
            size={20}
            color={canRedo ? '#007AFF' : '#8E8E93'}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={onReset} style={styles.actionButton}>
          <Ionicons name="refresh" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  toolSelection: {
    flexDirection: 'row',
    gap: 20,
  },
  toolButton: {
    padding: 8,
    borderRadius: 8,
  },
  activeToolButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
}); 