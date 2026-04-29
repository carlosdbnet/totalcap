import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { pneuService, producaoService } from '../services';
import { useTheme } from '../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';

export default function LocalizacaoScreen() {
  const [codigoBarra, setCodigoBarra] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [pneuInfo, setPneuInfo] = useState(null);
  
  const { colors, dark } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const inputRef = useRef(null);

  // Auto-focus ao entrar na tela
  useFocusEffect(
    useCallback(() => {
      setTimeout(() => {
        setFocusedField('pneu');
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 500);
    }, [])
  );

  const buscarPneu = async (codigo = codigoBarra) => {
    if (!codigo) return;
    setLoading(true);
    try {
      const pneu = await producaoService.buscarPneu(codigo);
      setPneuInfo(pneu);
    } catch (error) {
      Alert.alert('Erro', 'Pneu não encontrado.');
      setPneuInfo(null);
      setCodigoBarra('');
      if (inputRef.current) inputRef.current.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleScan = ({ data }) => {
    setScanning(false);
    setCodigoBarra(data);
    buscarPneu(data);
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const { status } = await requestPermission();
      if (status !== 'granted') {
        Alert.alert('Permissão Negada', 'O acesso à câmera é necessário para o scanner.');
        return;
      }
    }
    setScanning(true);
  };

  const formatData = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month} ${hours}:${mins}`;
  };

  const formatTempo = (decimalMinutos) => {
    if (!decimalMinutos) return '00:00';
    const totalMinutos = parseFloat(decimalMinutos);
    const hrs = Math.floor(totalMinutos / 60);
    const mins = Math.round(totalMinutos % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">


        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Pneu (Código de Barras)</Text>
          <View style={[
            styles.inputWrapper, 
            { backgroundColor: colors.inputBackground, borderColor: colors.border },
            focusedField === 'pneu' && { backgroundColor: dark ? '#555500' : '#FFFF00', borderColor: colors.primary, borderWidth: 2 }
          ]}>
            <TextInput 
              ref={inputRef}
              style={[styles.input, { color: colors.text }]} 
              placeholder="Escaneie ou digite o pneu" 
              placeholderTextColor={colors.textSecondary}
              value={codigoBarra}
              onChangeText={setCodigoBarra}
              onFocus={() => setFocusedField('pneu')}
              onBlur={() => setFocusedField(null)}
              onSubmitEditing={() => buscarPneu()}
            />
            <TouchableOpacity style={[styles.scanBtn, { backgroundColor: colors.primary }]} onPress={openScanner}>
              <MaterialCommunityIcons name="barcode-scan" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {loading && <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />}

        {pneuInfo && !loading && (
          <View style={styles.resultsContainer}>
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* HEADER IDENTIFICAÇÃO */}
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="tire" size={28} color={colors.primary} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={[styles.customerLabel, { color: colors.textSecondary }]}>CLIENTE</Text>
                  <Text style={[styles.customerName, { color: colors.text }]}>{pneuInfo.nome_cliente || 'NÃO INFORMADO'}</Text>
                  <Text style={[styles.productDesc, { color: colors.primary }]}>{pneuInfo.produto_desc}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* GRID DE INFORMAÇÕES */}
              <View style={styles.infoGrid}>
                <View style={styles.gridItem}>
                  <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>NUM. OS</Text>
                  <Text style={[styles.gridValue, { color: colors.text }]}>{pneuInfo.numos || '---'}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>ENTRADA</Text>
                  <Text style={[styles.gridValue, { color: colors.text }]}>{formatData(pneuInfo.dataentrada)}</Text>
                </View>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.gridItem}>
                  <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>VALOR OS</Text>
                  <Text style={[styles.gridValue, { color: colors.text }]}>R$ {pneuInfo.vrtotal_os || '0,00'}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>STATUS</Text>
                  <Text style={[styles.gridValue, { color: pneuInfo.statuspro ? colors.primary : '#DC3545', fontWeight: 'bold' }]}>
                    {pneuInfo.statuspro ? 'EM PRODUÇÃO' : 'ENCERRADO'}
                  </Text>
                </View>
              </View>
            </View>

            {/* HISTÓRICO DE APONTAMENTOS */}
            <View style={styles.historyContainer}>
              <Text style={[styles.historyTitle, { color: colors.text }]}>Fluxo de Produção</Text>
              {pneuInfo.historico && pneuInfo.historico.length > 0 ? (
                <View style={[styles.table, { borderColor: colors.border }]}>
                  <View style={[styles.tableHeader, { backgroundColor: colors.inputBackground }]}>
                    <Text style={[styles.columnHeader, { color: colors.textSecondary, flex: 2 }]}>Setor</Text>
                    <Text style={[styles.columnHeader, { color: colors.textSecondary, flex: 2 }]}>Início</Text>
                    <Text style={[styles.columnHeader, { color: colors.textSecondary, flex: 1, textAlign: 'right' }]}>Tempo</Text>
                  </View>
                  {pneuInfo.historico.map((item, index) => (
                    <View key={index} style={[styles.tableRow, { borderTopWidth: index === 0 ? 0 : 1, borderTopColor: colors.border }]}>
                      <Text style={[styles.cellText, { color: colors.text, flex: 2, fontWeight: '500' }]}>{item.nome_setor}</Text>
                      <Text style={[styles.cellText, { color: colors.textSecondary, flex: 2 }]}>{formatData(item.inicio)}</Text>
                      <Text style={[styles.cellText, { color: colors.text, flex: 1, textAlign: 'right' }]}>{formatTempo(item.tempo)}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyHistory}>
                  <MaterialCommunityIcons name="history" size={40} color={colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, marginTop: 10 }}>Nenhum apontamento registrado.</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* MODAL SCANNER */}
      <Modal visible={scanning} animationType="slide" transparent={false}>
        <View style={styles.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={scanning ? handleScan : undefined}
          />
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerTarget} />
            <Text style={styles.scannerText}>Aponte para o código de barras do pneu</Text>
            <TouchableOpacity style={styles.closeScannerBtn} onPress={() => setScanning(false)}>
              <Text style={styles.closeScannerText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 25 },
  header: { fontSize: 28, fontWeight: 'bold' },
  subHeader: { fontSize: 16, marginBottom: 30 },
  formGroup: { marginBottom: 25 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    height: 65,
  },
  input: {
    flex: 1,
    height: 65,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  scanBtn: {
    width: 70,
    height: 65,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  resultsContainer: {
    marginTop: 10,
  },
  infoCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  customerLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  productDesc: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
    marginVertical: 15,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  gridItem: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  
  historyContainer: {
    marginTop: 30,
    paddingBottom: 40,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  table: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    padding: 12,
  },
  columnHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
  },
  cellText: {
    fontSize: 14,
  },
  emptyHistory: {
    alignItems: 'center',
    padding: 40,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 12,
  },

  scannerContainer: { flex: 1, backgroundColor: '#000' },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerTarget: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#00FF00',
    backgroundColor: 'transparent',
  },
  scannerText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 20,
    fontWeight: 'bold',
  },
  closeScannerBtn: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: '#DC3545',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  closeScannerText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
