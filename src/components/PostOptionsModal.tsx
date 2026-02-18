import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { SavedIcon, ForwardIcon, CopyIcon, EditIcon, DeleteIcon } from './Icons';

interface PostOptionsModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: () => void;
    onShare: () => void;
    onCopy: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    isSaved?: boolean;
    isAdmin?: boolean;
}

export const PostOptionsModal = ({
    visible,
    onClose,
    onSave,
    onShare,
    onCopy,
    onEdit,
    onDelete,
    isSaved = false,
    isAdmin = false,
}: PostOptionsModalProps) => {
    const { theme } = useTheme();
    const styles = React.useMemo(() => createStyles(theme), [theme]);

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.menuContainer}>
                            {!isAdmin && (
                                <>
                                    <TouchableOpacity style={styles.menuItem} onPress={onSave}>
                                        <Text style={styles.menuText}>{isSaved ? 'Unsave' : 'Save'}</Text>
                                        <SavedIcon size={20} color={theme.colors.text} />
                                    </TouchableOpacity>
                                    <View style={styles.divider} />
                                </>
                            )}

                            <TouchableOpacity style={styles.menuItem} onPress={onShare}>
                                <Text style={styles.menuText}>Share</Text>
                                <ForwardIcon size={20} color={theme.colors.text} />
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            <TouchableOpacity style={styles.menuItem} onPress={onCopy}>
                                <Text style={styles.menuText}>Copy</Text>
                                <CopyIcon size={20} color={theme.colors.text} />
                            </TouchableOpacity>

                            {isAdmin && (
                                <>
                                    <View style={styles.divider} />
                                    <TouchableOpacity style={styles.menuItem} onPress={onEdit}>
                                        <Text style={styles.menuText}>Edit</Text>
                                        <EditIcon size={20} color={theme.colors.text} />
                                    </TouchableOpacity>
                                </>
                            )}

                            {onDelete && (
                                <>
                                    <View style={styles.divider} />
                                    <TouchableOpacity style={styles.menuItem} onPress={onDelete}>
                                        <Text style={[styles.menuText, { color: theme.colors.danger || '#EF4444' }]}>Delete</Text>
                                        <DeleteIcon size={20} color={theme.colors.danger || '#EF4444'} />
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const createStyles = (theme: any) =>
    StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        menuContainer: {
            backgroundColor: theme.colors.surface,
            borderRadius: 10,
            width: 175,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 4.65,
            elevation: 8,
        },
        menuItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 52,
            paddingHorizontal: 16,
        },
        divider: {
            height: 1,
            backgroundColor: theme.colors.border,
            marginHorizontal: 10,
        },
        menuText: {
            color: theme.colors.text,
            fontSize: 16,
            fontWeight: '500',
            fontFamily: 'Inter',
        },
    });
