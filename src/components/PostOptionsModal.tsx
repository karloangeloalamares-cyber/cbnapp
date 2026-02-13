import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SavedIcon, ForwardIcon, CopyIcon } from './Icons';

interface PostOptionsModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: () => void;
    onForward: () => void;
    onCopy: () => void;
    isSaved?: boolean;
}

export const PostOptionsModal = ({
    visible,
    onClose,
    onSave,
    onForward,
    onCopy,
    isSaved = false,
}: PostOptionsModalProps) => {
    const insets = useSafeAreaInsets();

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
                        <View style={[styles.menuContainer, { paddingBottom: insets.bottom + 20 }]}>
                            <TouchableOpacity style={styles.menuItem} onPress={onSave}>
                                <Text style={styles.menuText}>{isSaved ? 'Unsave' : 'Save'}</Text>
                                <SavedIcon size={24} color="#FFFFFF" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.menuItem} onPress={onForward}>
                                <Text style={styles.menuText}>Forward</Text>
                                <ForwardIcon size={24} color="#FFFFFF" />
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.menuItem, styles.lastItem]} onPress={onCopy}>
                                <Text style={styles.menuText}>Copy</Text>
                                <CopyIcon size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        paddingRight: 16,
        paddingBottom: 80, // Adjust based on where you want it to appear
    },
    menuContainer: {
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        width: 200,
        paddingVertical: 8,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
    },
    lastItem: {
        borderBottomWidth: 0,
    },
    menuText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',
        fontFamily: 'Inter',
    },
});
