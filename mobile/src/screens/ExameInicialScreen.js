import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { producaoService } from '../services';

export default function ExameInicialScreen() {
  const [codigoBarra, setCodigoBarra] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [pneu, setPneu] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();

  const handleScan = ({ data }) => {
    setCodigoBarra(data);
    setScanning(false);
    buscarPneu(data);
  };

  const buscarPneu = async (codigo = codigoBarra) => {
    if (!codigo) {
      Alert.alert('Erro', 'Insira um código de barras.');
      return;
    }
    setLoading(true);
    try {
      const data = await producaoService.buscarPneu(codigo);
      setPneu(data);
    } catch (error) {
      Alert.alert('Erro', 'Pneu não encontrado ou erro na conexão.');
      setPneu(null);
    } finally {
      setLoading(false);
    }
  };

  const aprovarPneu = async () => {
    if (!pneu) return;
    setLoading(true);
    // Simulação de registro de aprovação técnica (poderia ser um endpoint real futuramente)
    setTimeout(() => {
      Alert.alert('Sucesso', 'Exame Inicial registrado com sucesso!');
      setPneu(null);
      setCodigoBarra('');
      setLoading(false);
    }, 800);
  };


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Exame Inicial</Text>
        <Text style={styles.subHeader}>Avaliação técnica inicial do pneu.</Text>

        <View style={styles.searchSection}>
          <View style={styles.inputWrapper}>
            <TextInput 
              style={styles.input} 
              placeholder="Código de Barras" 
              value={codigoBarra}
              onChangeText={setCodigoBarra}
            />
            <TouchableOpacity style={styles.scanBtn} onPress={() => setScanning(true)}>
              <MaterialCommunityIcons name="barcode-scan" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={() => buscarPneu()}>
            <Text style={styles.searchBtnText}>BUSCAR PNEU</Text>
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />}

        {pneu && (
          <View style={styles.pneuCard}>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>ID Ordem:</Text>
              <Text style={styles.cardValue}>{pneu.id_ordem}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Status Atual:</Text>
              <Text style={[styles.statusBadge, { backgroundColor: pneu.status === 'PENDENTE' ? '#FFC107' : '#28A745' }]}>
                {pneu.status || 'N/A'}
              </Text>
            </View>

            <TouchableOpacity style={styles.approveBtn} onPress={aprovarPneu}>
              <Text style={styles.approveBtnText}>APROVAR NO EXAME</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal visible={scanning} animationType="fade">
        <CameraView 
          style={styles.camera} 
          onBarcodeScanned={handleScan}
          barcodeScannerSettings={{ barcodeTypes: ["code128", "ean13"] }}
        />
        <TouchableOpacity style={styles.closeBtn} onPress={() => setScanning(false)}>
          <Text style={styles.closeBtnText}>Fechar</Text>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { padding: 20 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#212529' },
  subHeader: { fontSize: 16, color: '#6C757D', marginBottom: 25 },
  searchSection: { marginBottom: 25 },
  inputWrapper: { flexDirection: 'row', marginBottom: 10 },
  input: {
    flex: 1,
    height: 55,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  scanBtn: {
    width: 60,
    backgroundColor: '#343A40',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  searchBtn: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  pneuCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cardLabel: { fontSize: 14, color: '#6C757D', fontWeight: '500' },
  cardValue: { fontSize: 16, color: '#212529', fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5, color: '#FFF', fontSize: 12, overflow: 'hidden' },
  approveBtn: {
    backgroundColor: '#28A745',
    height: 55,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  approveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  camera: { flex: 1 },
  closeBtn: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: '#F44336', padding: 15, borderRadius: 25 },
  closeBtnText: { color: '#FFF', fontWeight: 'bold' },
});
