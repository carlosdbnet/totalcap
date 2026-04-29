import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
// import { consumoService } from '../services'; // Implementaremos se necessário

export default function ConsumoScreen() {
  const [idProduto, setIdProduto] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [loading, setLoading] = useState(false);
  const { colors, dark } = useTheme();

  // Estados Visuais da Pesquisa
  const [listaProdutos, setListaProdutos] = useState([]);
  const [searchTextProduto, setSearchTextProduto] = useState('');
  const [showProdutoList, setShowProdutoList] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Estados do Scanner
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const inputProdutoRef = useRef(null);

  useEffect(() => {
    fetchProdutos();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setTimeout(() => {
        setFocusedField('produto');
        if (inputProdutoRef.current) {
          inputProdutoRef.current.focus();
        }
      }, 500);
    }, [])
  );

  const fetchProdutos = async () => {
    try {
      // Mocked endpoint preparation. Substituir por consumoService.listarProdutos() futuramente.
      // const produtos = await consumoService.listarProdutos();
      // setListaProdutos(produtos || []);
      setListaProdutos([
        { id: 1, codigo: '001', descricao: 'Borracha Vipal RC' },
        { id: 2, codigo: '002', descricao: 'Cola Vipal' },
        { id: 3, codigo: '003', descricao: 'Saco Plástico' },
      ]);
    } catch {
      setListaProdutos([]);
    }
  };

  const getProdutoFullStr = (p) => {
    const c = p.CODIGO || p.codigo;
    const d = p.DESCRICAO || p.descricao;
    const t_codigo = c ? String(c).trim() : '';
    const t_desc = d ? String(d).trim() : '';
    return t_codigo ? `${t_codigo} - ${t_desc}` : t_desc;
  };

  const isProdutoFullyMatched = (listaProdutos || []).some(p => getProdutoFullStr(p) === searchTextProduto);

  const produtosFiltrados = (listaProdutos || []).filter(p => {
    if (isProdutoFullyMatched) return true;
    const desc = p.DESCRICAO || p.descricao || '';
    const cod = p.CODIGO || p.codigo || '';
    const id = p.id !== undefined ? p.id : p.ID;
    const search = searchTextProduto.toLowerCase();
    
    return desc.toLowerCase().includes(search) ||
           (cod && String(cod).toLowerCase().includes(search)) ||
           (id !== undefined && id.toString().includes(search));
  });

  const selecionarProduto = (p) => {
    const id = p.id !== undefined ? p.id : p.ID;
    setIdProduto(id.toString());
    const fullStr = getProdutoFullStr(p);
    setSearchTextProduto(fullStr);
    setShowProdutoList(false);
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

  const handleScan = ({ data }) => {
    setScanning(false);
    const p = listaProdutos.find(o => 
      String(o.CODIGO || o.codigo || '').trim().toLowerCase() === String(data).trim().toLowerCase() || 
      String(o.id || o.ID || '').trim() === String(data).trim()
    );
    if (p) {
      selecionarProduto(p);
    } else {
      setSearchTextProduto(data);
      Alert.alert('Aviso', 'Produto/Insumo não encontrado na lista.');
    }
  };

  const salvarConsumo = async () => {
    if (!idProduto || !quantidade) {
      Alert.alert('Campos Obrigatórios', 'Preencha o ID do produto e a quantidade.');
      return;
    }
    setLoading(true);
    try {
      // await consumoService.registrar({ id_produto: parseInt(idProduto), quantidade: parseFloat(quantidade) });
      Alert.alert('Sucesso', 'Consumo de matéria-prima registrado!');
      setIdProduto('');
      setSearchTextProduto('');
      setQuantidade('');
      setFocusedField('produto');
      if (inputProdutoRef.current) setTimeout(() => inputProdutoRef.current.focus(), 150);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível registrar o consumo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">


        <View style={[styles.formGroup, { zIndex: (focusedField === 'produto' || showProdutoList) ? 1000 : 1 }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Produto / Insumo</Text>
          <View style={[
            styles.inputWrapper, 
            { backgroundColor: colors.inputBackground, borderColor: colors.border },
            focusedField === 'produto' && { backgroundColor: dark ? '#555500' : '#FFFF00', borderColor: colors.primary, borderWidth: 2 }
          ]}>
            <TextInput 
              ref={inputProdutoRef}
              style={[styles.input, { color: colors.text, flex: 1, borderWidth: 0, backgroundColor: 'transparent' }]} 
              placeholder="Pesquise por Nome ou Código..." 
              placeholderTextColor={colors.textSecondary}
              value={searchTextProduto}
              onFocus={() => {
                setShowProdutoList(true);
                setFocusedField('produto');
              }}
              onBlur={() => {
                setTimeout(() => setShowProdutoList(false), 200);
                setFocusedField(null);
              }}
              onChangeText={(text) => {
                setSearchTextProduto(text);
                setShowProdutoList(true);
              }}
              onSubmitEditing={() => {
                const search = searchTextProduto.trim().toLowerCase();
                const p = listaProdutos.find(o => 
                  (String(o.CODIGO || o.codigo || '').trim().toLowerCase() === search) || 
                  (String(o.id || o.ID || '') === search)
                );
                if (p) {
                  selecionarProduto(p);
                } else {
                  Alert.alert('Aviso', 'Produto não encontrado.');
                }
              }}
            />
            <TouchableOpacity style={[styles.scannerBtn, { backgroundColor: colors.primary }]} onPress={openScanner}>
              <MaterialCommunityIcons name="barcode-scan" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {showProdutoList && produtosFiltrados.length > 0 && (
            <View style={[styles.resultsList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 200 }} keyboardShouldPersistTaps="always">
                {produtosFiltrados.map((p) => (
                  <TouchableOpacity key={p.id || p.ID} style={styles.resultItem} onPress={() => selecionarProduto(p)}>
                    <Text style={[styles.resultText, { color: colors.text }]}>
                      {getProdutoFullStr(p)} (ID: {p.id !== undefined ? p.id : p.ID})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Quantidade consumida</Text>
          <TextInput 
            style={[
              styles.inputSingle, 
              { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text },
              focusedField === 'quantidade' && { backgroundColor: dark ? '#555500' : '#FFFF00', borderColor: colors.primary, borderWidth: 2 }
            ]} 
            placeholder="Ex: 5.5 (kg/un)" 
            placeholderTextColor={colors.textSecondary}
            value={quantidade}
            onFocus={() => setFocusedField('quantidade')}
            onBlur={() => setFocusedField(null)}
            onChangeText={setQuantidade}
            keyboardType="decimal-pad"
          />
        </View>

        <TouchableOpacity 
          style={[
            styles.saveBtn, 
            { backgroundColor: (idProduto && parseFloat(quantidade) > 0) ? colors.primary : '#999' },
            loading && { opacity: 0.7 }
          ]} 
          onPress={salvarConsumo}
          disabled={loading || !idProduto || !(parseFloat(quantidade) > 0)}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>REGISTRAR CONSUMO</Text>}
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL SCANNER */}
      <Modal visible={scanning} animationType="slide" transparent={false}>
        <View style={styles.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={scanning ? handleScan : undefined}
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_e', 'code128', 'code39', 'qr'],
            }}
          />
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerTarget} />
            <Text style={styles.scannerText}>Aponte a câmera para o Pneu</Text>
            <TouchableOpacity style={[styles.closeScannerBtn, { backgroundColor: colors.error }]} onPress={() => setScanning(false)}>
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
    height: 55,
  },
  inputSingle: {
    height: 55,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  scannerBtn: {
    paddingHorizontal: 15,
    height: '100%',
    justifyContent: 'center',
    borderTopRightRadius: 11,
    borderBottomRightRadius: 11,
  },
  resultsList: {
    position: 'absolute',
    top: 85,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 9999,
  },
  resultItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  resultText: { fontSize: 14 },
  saveBtn: {
    height: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
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
