import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity,
  TouchableWithoutFeedback, 
  StyleSheet, 
  Dimensions,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  
} from 'react-native';

export type DeleteConfirmationModalRef = {
  present: (exerciseId?: string) => void;
  dismiss: () => void;
};

type Props = {
  onConfirm: () => void;
  onCancel?: () => void;
};

const DeleteConfirmationModal = forwardRef<DeleteConfirmationModalRef, Props>(
  ({ onConfirm, onCancel }, ref) => {
    const [visible, setVisible] = useState(false);
    const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

    useEffect(() => {
      const subscription = Dimensions.addEventListener('change', ({ window }) => {
        setScreenDimensions(window);
      });

      return () => subscription?.remove();
    }, []);

    useImperativeHandle(ref, () => ({
      present: (id?: string) => {
        setVisible(true);
      },
      dismiss: () => {
        setVisible(false);
      },
    }));

    const handleConfirm = () => {
      onConfirm();
      setVisible(false);
    };

    const handleCancel = () => {
      setVisible(false);
      onCancel?.();
    };

    const modalWidth = Math.min(screenDimensions.width * 0.85, 400);

    return (
      <View>
        <Modal 
          visible={visible}
          transparent={true}
          animationType="fade"
          statusBarTranslucent={Platform.OS === 'android'}
          onRequestClose={handleCancel}
          supportedOrientations={['portrait', 'landscape']}
          hardwareAccelerated={true}
        >
          <View style={[
            styles.overlay,
            {
              width: screenDimensions.width,
              height: screenDimensions.height,
            }
          ]}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardAvoid}
            >
              <TouchableWithoutFeedback
                style={styles.backdropTouchable} 
                onPress={handleCancel}
              >
                <View style={styles.centeredView}>
                  <View style={[
                    styles.modalContainer,
                    {
                      width: modalWidth,
                      maxWidth: modalWidth,
                    }
                  ]}>
                    <View 
                      style={styles.modalTouchable}
                    >
                      <View style={styles.modalContent}>
                        <Text style={styles.title}>Delete Exercise</Text>
                        <Text style={styles.message}>
                          Are you sure you want to delete this exercise?
                        </Text>
                        
                        <View style={styles.buttonContainer}>
                          <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={handleCancel}
                          >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={[styles.button, styles.deleteButton]}
                            onPress={handleConfirm}
                          >
                            <Text style={styles.deleteButtonText}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardAvoid: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backdropTouchable: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: Platform.OS === 'android' ? 10 : 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    ...(Platform.OS === 'android' && {
      alignSelf: 'center',
      marginLeft: 'auto',
      marginRight: 'auto',
    }),
  },
  modalTouchable: {
    width: '100%',
  },
  modalContent: {
    padding: 20,
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  deleteButton: {
    backgroundColor: '#E63946',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default DeleteConfirmationModal;