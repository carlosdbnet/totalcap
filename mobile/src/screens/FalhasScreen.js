import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { falhaService, producaoService, auxService } from '../services';
import { useTheme } from '../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';

export default function FalhasScreen() {
  const [codigoBarra, setCodigoBarra] = useState('');
  const [clienteNome, setClienteNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  
  const [catalogo, setCatalogo] = useState([]);
  const [falhaSelecionada, setFalhaSelecionada] = useState(null);
  
  const [searchTextFalha, setSearchTextFalha] = useState('');
  const [showFalhaList, setShowFalhaList] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  
  const [observacao, setObservacao] = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const { colors, dark } = useTheme();

  const inputFalhaRef = useRef(null);
  const inputObsRef = useRef(null);
  const inputOperadorRef = useRef(null);
  const inputPneuRef = useRef(null);

  const [idOperador, setIdOperador] = useState('');
  const [listaOperadores, setListaOperadores] = useState([]);
  const [showOperadorModal, setShowOperadorModal] = useState(false);
  const [activeTarget, setActiveTarget] = useState('pneu');

  const [idSetor, setIdSetor] = useState('');
  const [listaSetores, setListaSetores] = useState([]);
  const [showSetorModal, setShowSetorModal] = useState(false);

  useEffect(() => {
    fetchCatalogo();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setTimeout(() => {
        setFocusedField('pneu');
        if (inputPneuRef.current) {
          inputPneuRef.current.focus();
        }
      }, 500);
    }, [])
  );

  const fetchCatalogo = async () => {
    try {
      const data = await falhaService.listarCatalogo();
      setCatalogo(data);
      const operadores = await auxService.listarOperadores();
      setListaOperadores(operadores);
      const setores = await auxService.listarSetores();
      setListaSetores(setores);
    } catch (error) {
      console.error(error);
    }
  };

  const getFalhaFullStr = (f) => {
    const cod = f.codigo ?? f.CODIGO ?? '';
    const desc = f.descricao || f.DESCRICAO || '';
    const codStr = String(cod).trim();
    const descStr = String(desc).trim();
    return codStr ? `${codStr} - ${descStr}` : descStr;
  };

  const isFalhaFullyMatched = (catalogo || []).some(f => getFalhaFullStr(f) === searchTextFalha);

  const falhasFiltradas = (catalogo || []).filter(f => {
    if (isFalhaFullyMatched) return true;
    const cod = String(f.codigo ?? f.CODIGO ?? '').trim().toLowerCase();
    const desc = String(f.descricao || f.DESCRICAO || '').trim().toLowerCase();
    const search = searchTextFalha.toLowerCase();
    return cod.includes(search) || desc.includes(search);
  });

  const selecionarFalha = (f) => {
    setFalhaSelecionada(f);
    setSearchTextFalha(getFalhaFullStr(f));
    setShowFalhaList(false);
    setTimeout(() => {
      if (inputObsRef.current) inputObsRef.current.focus();
    }, 150);
  };

  const validarPneu = async (codigo = codigoBarra) => {
    if (!codigo) return;
    setLoading(true);
    try {
      const pneu = await producaoService.buscarPneu(codigo);
      setClienteNome(pneu.nome_cliente || (pneu.id_contato ? `Sem nome (ID Contato: ${pneu.id_contato})` : 'Nenhum Contato Vinculado'));
      if (inputFalhaRef.current) inputFalhaRef.current.focus();
    } catch (error) {
      Alert.alert('Erro', 'Pneu não encontrado.');
      setClienteNome('');
      setCodigoBarra('');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async ({ data }) => {
    setScanning(false);
    if (activeTarget === 'pneu') {
      setCodigoBarra(data);
      await validarPneu(data);
    } else if (activeTarget === 'operador') {
      const dataStr = String(data).trim().toLowerCase();
      const op = listaOperadores.find(o => {
        const idStr = String(o.id || o.ID || '').toLowerCase();
        const codStr = String(o.CODIGO || o.codigo || '').trim().toLowerCase();
        const nomeStr = String(o.NOME || o.nome || '').trim().toLowerCase();
        return idStr === dataStr || codStr === dataStr || nomeStr === dataStr;
      });
      if (op) {
        const finalId = op.id !== undefined ? op.id : op.ID;
        setIdOperador(finalId);
        setFocusedField('falha');
        setTimeout(() => { if (inputFalhaRef.current) inputFalhaRef.current.focus(); }, 100);
      } else {
        Alert.alert('Aviso', `Operador não encontrado (${data}).`);
      }
    } else if (activeTarget === 'setor') {
      const dataStr = String(data).trim().toLowerCase();
      const st = listaSetores.find(s =>
        (s.id || s.ID || '').toString() === dataStr ||
        String(s.CODIGO || s.codigo || '').trim().toLowerCase() === dataStr ||
        String(s.DESCRICAO || s.descricao || '').trim().toLowerCase() === dataStr
      );
      if (st) {
        setIdSetor(st.id !== undefined ? st.id : st.ID);
        setFocusedField('falha');
        setTimeout(() => { if (inputFalhaRef.current) inputFalhaRef.current.focus(); }, 100);
      } else {
        Alert.alert('Aviso', 'Setor não encontrado (Código inválido).');
      }
    }
  };

  const openScanner = async (target = 'pneu') => {
    setActiveTarget(target);
    if (!permission?.granted) {
      const { status } = await requestPermission();
      if (status !== 'granted') {
        Alert.alert('Permissão Negada', 'O acesso à câmera é necessário para o scanner.');
        return;
      }
    }
    setScanning(true);
  };

  const registrarFalha = async () => {
    if (!codigoBarra || !falhaSelecionada) {
      Alert.alert('Atenção', 'Escaneie o pneu e selecione o tipo de falha.');
      return;
    }

    setLoading(true);
    try {
      const pneu = await producaoService.buscarPneu(codigoBarra);
      
      const registro = {
        codbarra: codigoBarra,
        id_pneu: pneu.id,
        id_setor: idSetor ? parseInt(idSetor) : 1,
        id_operador: idOperador ? parseInt(idOperador) : 1,
        id_falha: falhaSelecionada.id,
        datareg: new Date().toISOString(),
        motivo: observacao
      };

      await falhaService.registrar(registro);
      Alert.alert('Sucesso', 'Falha registrada no pneu!');
      setCodigoBarra('');
      setClienteNome('');
      setFalhaSelecionada(null);
      setSearchTextFalha('');
      setObservacao('');
      setFocusedField('pneu');
      if (inputPneuRef.current) setTimeout(() => inputPneuRef.current.focus(), 150);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Falha ao registrar ocorrência.');
    } finally {
      setLoading(false);
    }
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
              ref={inputPneuRef}
              style={[styles.inputSingle, { color: colors.text, flex: 1, borderWidth: 0, backgroundColor: 'transparent' }]} 
              placeholder="Escaneie ou digite o pneu" 
              placeholderTextColor={colors.textSecondary}
              value={codigoBarra}
              onChangeText={setCodigoBarra}
              onFocus={() => setFocusedField('pneu')}
              onBlur={() => setFocusedField(null)}
              onSubmitEditing={() => validarPneu(codigoBarra)}
            />
            <TouchableOpacity style={[styles.scanBtn, { backgroundColor: colors.primary }]} onPress={() => openScanner('pneu')}>
              <MaterialCommunityIcons name="barcode-scan" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Cliente</Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.dark ? '#333' : '#e0e0e0', borderColor: colors.border }]}>
            <TextInput
              style={[styles.inputSingle, { color: colors.text, flex: 1, borderWidth: 0, backgroundColor: 'transparent' }]}
              value={clienteNome}
              editable={false}
              placeholder="Não informado"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Operador Responsável</Text>
          <View style={[
            styles.inputWrapper, 
            { backgroundColor: colors.inputBackground, borderColor: colors.border },
            focusedField === 'operador' && { backgroundColor: colors.dark ? '#555500' : '#FFFF00', borderColor: colors.primary, borderWidth: 2 }
          ]}>
            <TouchableOpacity 
              style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 15 }} 
              onPress={() => setShowOperadorModal(true)}
              activeOpacity={0.7}
            >
              <Text style={{ color: idOperador ? colors.text : colors.textSecondary, fontSize: 16 }}>
                {idOperador
                  ? (listaOperadores.find(op => (op.id || op.ID) === idOperador)?.NOME || listaOperadores.find(op => (op.id || op.ID) === idOperador)?.nome || 'Selecionado')
                  : 'Selecione um Operador...'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.scanBtn, { backgroundColor: colors.primary }]} onPress={() => openScanner('operador')}>
              <MaterialCommunityIcons name="barcode-scan" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Setor</Text>
          <View style={[
            styles.inputWrapper, 
            { backgroundColor: colors.inputBackground, borderColor: colors.border },
            focusedField === 'setor' && { backgroundColor: dark ? '#555500' : '#FFFF00', borderColor: colors.primary, borderWidth: 2 }
          ]}>
            <TouchableOpacity 
              style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 15 }} 
              onPress={() => setShowSetorModal(true)}
              activeOpacity={0.7}
            >
              <Text style={{ color: idSetor ? colors.text : colors.textSecondary, fontSize: 16 }}>
                {idSetor
                  ? (listaSetores.find(s => (s.id || s.ID) === idSetor)?.DESCRICAO || listaSetores.find(s => (s.id || s.ID) === idSetor)?.descricao || 'Selecionado')
                  : 'Selecione um Setor...'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.scanBtn, { backgroundColor: colors.primary }]} onPress={() => openScanner('setor')}>
              <MaterialCommunityIcons name="barcode-scan" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.formGroup, { zIndex: (focusedField === 'falha' || showFalhaList) ? 1000 : 1 }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Tipo de Falha</Text>
          <View style={[
            styles.inputWrapper, 
            { backgroundColor: colors.inputBackground, borderColor: colors.border },
            focusedField === 'falha' && { backgroundColor: dark ? '#555500' : '#FFFF00', borderColor: colors.primary, borderWidth: 2 }
          ]}>
            <TextInput 
              ref={inputFalhaRef}
              style={[styles.inputSingle, { color: colors.text, flex: 1, borderWidth: 0, backgroundColor: 'transparent' }]} 
              placeholder="Pesquise por descrição..." 
              placeholderTextColor={colors.textSecondary}
              value={searchTextFalha}
              onFocus={() => {
                setShowFalhaList(true);
                setFocusedField('falha');
              }}
              onBlur={() => {
                setTimeout(() => setShowFalhaList(false), 200);
                setFocusedField(null);
              }}
              onChangeText={(text) => {
                setSearchTextFalha(text);
                setShowFalhaList(true);
              }}
              onSubmitEditing={() => {
                const search = searchTextFalha.trim().toLowerCase();
                const f = catalogo.find(o => {
                  const cod = String(o.codigo || o.CODIGO || '').trim().toLowerCase();
                  const desc = String(o.descricao || o.DESCRICAO || '').trim().toLowerCase();
                  return cod === search || desc === search || getFalhaFullStr(o).toLowerCase() === search;
                });
                if (f) {
                  selecionarFalha(f);
                } else {
                  Alert.alert('Aviso', 'Falha não encontrada. Escolha na lista.');
                }
              }}
            />
          </View>
          
          {showFalhaList && falhasFiltradas.length > 0 && (
            <View style={[styles.resultsList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 200 }} keyboardShouldPersistTaps="always">
                {falhasFiltradas.map((f) => (
                  <TouchableOpacity key={f.id} style={styles.resultItem} onPress={() => selecionarFalha(f)}>
                    <Text style={[styles.resultText, { color: colors.text }]}>
                      {getFalhaFullStr(f)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={[styles.formGroup, { zIndex: 1 }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Observações Técnicas</Text>
          <TextInput 
            ref={inputObsRef}
            style={[
              styles.inputSingle, 
              { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text, height: 100, textAlignVertical: 'top', paddingTop: 15 },
              focusedField === 'obs' && { backgroundColor: dark ? '#555500' : '#FFFF00', borderColor: colors.primary, borderWidth: 2 }
            ]} 
            placeholder="Detalhes adicionais sobre a falha..." 
            placeholderTextColor={colors.textSecondary}
            multiline
            value={observacao}
            onFocus={() => setFocusedField('obs')}
            onBlur={() => setFocusedField(null)}
            onChangeText={setObservacao}
          />
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, { backgroundColor: colors.error }, loading && { opacity: 0.7 }]} 
          onPress={registrarFalha}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>REGISTRAR OCORRÊNCIA</Text>}
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL OPERADOR */}
      <Modal visible={showOperadorModal} animationType="fade" transparent={true} onRequestClose={() => setShowOperadorModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Selecione um Operador</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {listaOperadores.map(op => {
                const c = op.CODIGO || op.codigo;
                const n = op.NOME || op.nome;
                const txt = c ? `${String(c).trim()} - ${String(n || '').trim()}` : String(n || '').trim();
                return (
                  <TouchableOpacity 
                    key={op.id !== undefined ? op.id : op.ID} 
                    style={styles.modalItem}
                    onPress={() => {
                      const val = op.id !== undefined ? op.id : op.ID;
                      setIdOperador(val);
                      setShowOperadorModal(false);
                      setFocusedField('falha');
                      setTimeout(() => { if (inputFalhaRef.current) inputFalhaRef.current.focus(); }, 100);
                    }}
                  >
                    <Text style={{ color: colors.text }}>{txt}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={[styles.closeModalBtn, { backgroundColor: colors.primary }]} onPress={() => setShowOperadorModal(false)}>
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>FECHAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL SETOR */}
      <Modal visible={showSetorModal} animationType="fade" transparent={true} onRequestClose={() => setShowSetorModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Selecione um Setor</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {listaSetores.map(s => {
                const c = s.CODIGO || s.codigo;
                const d = s.DESCRICAO || s.descricao;
                const txt = c ? `${String(c).trim()} - ${String(d || '').trim()}` : String(d || '').trim();
                return (
                  <TouchableOpacity 
                    key={s.id !== undefined ? s.id : s.ID} 
                    style={styles.modalItem}
                    onPress={() => {
                      const val = s.id !== undefined ? s.id : s.ID;
                      setIdSetor(val);
                      setShowSetorModal(false);
                      setFocusedField('falha');
                      setTimeout(() => { if (inputFalhaRef.current) inputFalhaRef.current.focus(); }, 100);
                    }}
                  >
                    <Text style={{ color: colors.text }}>{txt}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={[styles.closeModalBtn, { backgroundColor: colors.primary }]} onPress={() => setShowSetorModal(false)}>
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>FECHAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
            <Text style={styles.scannerText}>
              {activeTarget === 'setor' ? 'Aponte a câmera para o Setor' : activeTarget === 'operador' ? 'Aponte a câmera para o Operador' : 'Aponte a câmera para o Pneu'}
            </Text>
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
  readonlyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
  },
  readonlyText: { fontSize: 16, fontWeight: 'bold' },
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
  scanBtn: {
    paddingHorizontal: 18,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
  closeModalBtn: {
    marginTop: 20,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
});
