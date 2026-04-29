import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { expedicaoService, producaoService } from '../services';

export default function ExpedicaoScreen() {
  const [codigoBarra, setCodigoBarra] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [pneu, setPneu] = useState(null);
  const [observacao, setObservacao] = useState('');
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
      Alert.alert('Erro', 'Pneu não encontrado no sistema.');
      setPneu(null);
    } finally {
      setLoading(false);
    }
  };

  const confirmarExpedicao = async () => {
    if (!pneu) return;
    setLoading(true);
    try {
      await expedicaoService.registrar({ 
        codigo_barra: pneu.codigo_barra, 
        id_pneu: pneu.id, 
        data: new Date().toISOString().split('T')[0],
        observacao: observacao
      });
      Alert.alert('Sucesso', 'Expedição registrada! Pneu enviado para o cliente.');
      setCodigoBarra('');
      setPneu(null);
      setObservacao('');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível registrar a expedição.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Expedição de Pneus</Text>
        <Text style={styles.subHeader}>Confirme a saída final dos pneus produzidos.</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Pneu para Envio</Text>
          <View style={styles.inputWrapper}>
            <TextInput 
              style={styles.input} 
              placeholder="Código do Pneu" 
              value={codigoBarra}
              onChangeText={setCodigoBarra}
            />
            <TouchableOpacity style={styles.scanBtn} onPress={() => setScanning(true)}>
              <MaterialCommunityIcons name="barcode-scan" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={() => buscarPneu()}>
            <Text style={styles.searchBtnText}>VERIFICAR DISPONIBILIDADE</Text>
          </TouchableOpacity>
        </View>

        {pneu && (
          <View style={styles.pneuCard}>
            <Text style={styles.pneuTitle}>Pneu Pronto para Envio</Text>
            <View style={styles.divider} />
            <Text style={styles.infoText}>Medida: <Text style={styles.bold}>{pneu.medida}</Text></Text>
            <Text style={styles.infoText}>Número de Fogo: <Text style={styles.bold}>{pneu.numfogo || 'N/A'}</Text></Text>
            
            <View style={[styles.statusTag, { backgroundColor: pneu.status === 'PRONTO' ? '#28A745' : '#FFC107' }]}>
              <Text style={styles.statusTagText}>{pneu.status}</Text>
            </View>

            <TextInput 
              style={styles.obsInput}
              placeholder="Observações de saída (opcional)..."
              multiline
              value={observacao}
              onChangeText={setObservacao}
            />

            <TouchableOpacity 
              style={[styles.confirmBtn, loading && { opacity: 0.7 }]} 
              onPress={confirmarExpedicao}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmBtnText}>CONFIRMAR SAÍDA</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal visible={scanning} animationType="slide">
        <CameraView style={styles.camera} onBarcodeScanned={handleScan} />
        <TouchableOpacity style={styles.closeBtn} onPress={() => setScanning(false)}>
          <Text style={styles.closeBtnText}>Cancelar</Text>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F3F5' },
  scrollContent: { padding: 25 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#212529' },
  subHeader: { fontSize: 16, color: '#6C757D', marginBottom: 25 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#495057', marginBottom: 8, textTransform: 'uppercase' },
  inputWrapper: { flexDirection: 'row', marginBottom: 10 },
  input: {
    flex: 1,
    height: 60,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CED4DA',
    paddingHorizontal: 15,
    fontSize: 16,
  },
  scanBtn: {
    width: 60,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginLeft: 10,
  },
  searchBtn: {
    backgroundColor: '#212529',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: { color: '#FFF', fontWeight: 'bold' },
  pneuCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  pneuTitle: { fontSize: 18, fontWeight: 'bold', color: '#212529' },
  divider: { height: 1, backgroundColor: '#E9ECEF', marginVertical: 15 },
  infoText: { fontSize: 16, color: '#495057', marginBottom: 6 },
  bold: { fontWeight: 'bold', color: '#212529' },
  statusTag: { marginVertical: 15, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start' },
  statusTagText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  obsInput: {
    height: 80,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    padding: 12,
    fontSize: 14,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  confirmBtn: {
    backgroundColor: '#4CAF50',
    height: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  camera: { flex: 1 },
  closeBtn: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: '#F44336', padding: 15, borderRadius: 25 },
  closeBtnText: { color: '#FFF', fontWeight: 'bold' },
});
