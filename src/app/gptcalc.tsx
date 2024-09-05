import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function CalculatorModal() {
  const [display, setDisplay] = useState('');
  const [result, setResult] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const handleClick = (value) => {
    if (value === '=') {
      try {
        setResult(eval(display).toString());
      } catch (error) {
        setResult('Error');
      }
    } else if (value === 'C') {
      setDisplay('');
      setResult('');
    } else {
      setDisplay((prev) => prev + value);
    }
  };

  const buttons = [
    '7', '8', '9', '/',
    '4', '5', '6', '*',
    '1', '2', '3', '-',
    '0', '.', '+', '=',
    '(', ')', 'C'
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.openButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.buttonText}>Open Calculator</Text>
      </TouchableOpacity>

      {/* <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      > */}
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Calculator</Text>
          
          <View style={styles.displayContainer}>
            <Text style={styles.displayText}>{display || '0'}</Text>
            <Text style={styles.resultText}>{result}</Text>
          </View>

          <View style={styles.buttonContainer}>
            {buttons.map((btn) => (
              <TouchableOpacity
                key={btn}
                style={[styles.button, btn === '=' && styles.buttonEquals]}
                onPress={() => handleClick(btn)}
              >
                <Text style={styles.buttonText}>{btn}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      {/* </Modal> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  openButton: {
    backgroundColor: '#DDDDDD',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 18,
    color: '#000',
  },
  modalView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 24,
    marginBottom: 20,
  },
  displayContainer: {
    width: '100%',
    padding: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'flex-end',
  },
  displayText: {
    fontSize: 32,
  },
  resultText: {
    fontSize: 24,
    color: '#FF0000',
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  button: {
    width: '20%',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    margin: 5,
  },
  buttonEquals: {
    backgroundColor: '#4CAF50',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#DDDDDD',
    padding: 10,
    borderRadius: 5,
  },
});
