import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { avaliacaoService, auxService, pneuService } from '../services';
import { useTheme } from '../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';

export default function AvaliacaoScreen() {
  const [codigoBarra, setCodigoBarra] = useState('');
  const [idSetor, setIdSetor] = useState('');
  const [resultado, setResultado] = useState('A'); // A: Aprovado, R: Reprovado, T: Retrabalho
  const [obs, setObs] = useState('');
  const [idOperador, setIdOperador] = useState('');
  const { colors, dark } = useTheme();
  
  const [listaSetores, setListaSetores] = useState([]);
  const inputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [activeTarget, setActiveTarget] = useState('pneu');
  const [pneuEncontrado, setPneuEncontrado] = useState(null);
  const [showSetorModal, setShowSetorModal] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    fetchAuxiliares();
    loadDefaults();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setTimeout(() => {
        setFocusedField('pneu');
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 300);
    }, [])
  );

  const fetchAuxiliares = async () => {
    try {
      const setores = await auxService.listarSetores();
      setListaSetores(setores);
    } catch (error) {
      console.warn('Erro ao carregar dados auxiliares:', error);
    }
  };

  const loadDefaults = async () => {
    try {
      const savedSetor = await AsyncStorage.getItem('default_setor');
      if (savedSetor) setIdSetor(parseInt(savedSetor));
    } catch (error) {
      console.error('Erro ao carregar padrões:', error);
    }
  };

  async function validarPneu(codigo = codigoBarra) {
    if (!codigo) return;
    setLoading(true);
    try {
      const pneu = await pneuService.buscar(codigo);
      setPneuEncontrado(pneu);
    } catch (error) {
      Alert.alert('Erro', 'Pneu não encontrado na base de dados.');
      setCodigoBarra('');
    } finally {
      setLoading(false);
    }
  }

  const handleScan = async ({ data }) => {
    setScanning(false);
    if (activeTarget === 'pneu') {
      setCodigoBarra(data);
      validarPneu(data);
    } else if (activeTarget === 'setor') {
      const dataStr = String(data).trim().toLowerCase();
      const st = listaSetores.find(s =>
        (s.id || s.ID || '').toString() === dataStr ||
        String(s.CODIGO || s.codigo || '').trim().toLowerCase() === dataStr ||
        String(s.DESCRICAO || s.descricao || '').trim().toLowerCase() === dataStr
      );
      if (st) {
        setIdSetor(st.id !== undefined ? st.id : st.ID);
        setTimeout(() => {
          if (inputRef.current) inputRef.current.focus();
        }, 100);
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

  const handleSalvar = async () => {
    if (!codigoBarra || !idSetor || !resultado) {
      Alert.alert('Campos Obrigatórios', 'Preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      const novaAvaliacao = {
        id_pneu: pneuEncontrado?.id,
        id_setor: parseInt(idSetor),
        codbarra: codigoBarra,
        resultado: resultado,
        obs: obs,
        dataexa: new Date().toISOString(),
      };

      await avaliacaoService.criar(novaAvaliacao);
      Alert.alert('Sucesso', 'Avaliação Técnica registrada!');
      setCodigoBarra('');
      setObs('');
      setPneuEncontrado(null);
      if (inputRef.current) inputRef.current.focus();
    } catch (error) {
      Alert.alert('Erro', 'Erro ao salvar avaliação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>


        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Setor de Avaliação</Text>
          <View style={[
            styles.inputWrapper,
            focusedField === 'setor' && { borderColor: colors.primary, borderWidth: 2 }
          ]}>
            <TouchableOpacity
              style={[
                styles.input,
                { backgroundColor: colors.inputBackground, borderColor: colors.border, justifyContent: 'center' },
                focusedField === 'setor' && { backgroundColor: dark ? '#555500' : '#FFFF00' }
              ]}
              onPress={() => setShowSetorModal(true)}
              activeOpacity={0.7}
            >
              <Text style={{ color: idSetor ? colors.text : colors.textSecondary, fontSize: 16, paddingHorizontal: 0 }}>
                {idSetor
                  ? (listaSetores.find(s => (s.id || s.ID) === idSetor)?.DESCRICAO || listaSetores.find(s => (s.id || s.ID) === idSetor)?.descricao || 'Selecionado')
                  : 'Escolha o Setor...'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.scannerBtn, { backgroundColor: colors.primary }]} onPress={() => openScanner('setor')}>
              <MaterialCommunityIcons name="barcode-scan" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Código do Pneu</Text>
          <View style={[
            styles.inputWrapper,
            focusedField === 'pneu' && { borderColor: colors.primary, borderWidth: 2 }
          ]}>
            <TextInput 
              ref={inputRef}
              style={[
                styles.input, 
                { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text },
                focusedField === 'pneu' && { backgroundColor: dark ? '#555500' : '#FFFF00' }
              ]} 
              onFocus={() => setFocusedField('pneu')}
              onBlur={() => setFocusedField(null)}
              onEndEditing={() => validarPneu(codigoBarra)}
              placeholder="Escaneie ou digite..." 
              placeholderTextColor={colors.textSecondary}
              value={codigoBarra}
              onChangeText={setCodigoBarra}
            />
            <TouchableOpacity style={[styles.scannerBtn, { backgroundColor: colors.primary }]} onPress={() => openScanner('pneu')}>
              <MaterialCommunityIcons name="barcode-scan" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {pneuEncontrado && (
          <View style={[styles.pneuInfo, { backgroundColor: colors.surface }]}>
            <Text style={{ fontWeight: 'bold', color: colors.primary }}>PNEU IDENTIFICADO</Text>
            <Text style={{ color: colors.text }}>Medida: {pneuEncontrado.medida || '-'}</Text>
            <Text style={{ color: colors.text }}>Série: {pneuEncontrado.numserie || '-'}</Text>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Resultado</Text>
          <View style={[
            styles.pickerContainer, 
            { backgroundColor: colors.inputBackground, borderColor: colors.border },
            focusedField === 'resultado' && { backgroundColor: dark ? '#555500' : '#FFFF00', borderColor: colors.primary, borderWidth: 2 }
          ]}>
            <Picker
              selectedValue={resultado}
              onValueChange={(val) => setResultado(val)}
              onFocus={() => setFocusedField('resultado')}
              onBlur={() => setFocusedField(null)}
              style={[styles.picker, { color: colors.text }]}
              dropdownIconColor={colors.text}
            >
              <Picker.Item label="Aprovado (Siga)" value="A" color={colors.success} />
              <Picker.Item label="Reprovado (Sucata)" value="R" color={colors.error} />
              <Picker.Item label="Retrabalho" value="T" color={colors.warning} />
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Observações Técnicas</Text>
          <TextInput 
            style={[
              styles.inputArea, 
              { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text },
              focusedField === 'obs' && { backgroundColor: dark ? '#555500' : '#FFFF00', borderColor: colors.primary, borderWidth: 2 }
            ]} 
            multiline
            numberOfLines={4}
            placeholder="Descreva o estado do pneu..." 
            placeholderTextColor={colors.textSecondary}
            value={obs}
            onChangeText={setObs}
            onFocus={() => setFocusedField('obs')}
            onBlur={() => setFocusedField(null)}
          />
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, { backgroundColor: colors.primary }, loading && styles.disabledBtn]} 
          onPress={handleSalvar}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>SALVAR AVALIAÇÃO</Text>}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Setor */}
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
                      if (inputRef.current) setTimeout(() => inputRef.current.focus(), 100);
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

      {/* Modal Scanner */}
      <Modal visible={scanning} animationType="slide">
        <CameraView style={{ flex: 1 }} onBarcodeScanned={handleScan} />
        <TouchableOpacity style={styles.closeBtn} onPress={() => setScanning(false)}>
          <Text style={styles.closeBtnText}>Cancelar</Text>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  header: { fontSize: 26, fontWeight: 'bold' },
  subHeader: { fontSize: 14, marginBottom: 25 },
  formGroup: { marginBottom: 15 },
  label: { fontSize: 12, fontWeight: 'bold', marginBottom: 5, textTransform: 'uppercase' },
  inputWrapper: { flexDirection: 'row' },
  input: {
    flex: 1,
    height: 60,
    borderWidth: 1,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  inputArea: {
    height: 100,
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  scannerBtn: {
    width: 65,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  pickerContainer: {
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
  },
  picker: { height: 60, width: '100%' },
  pneuInfo: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveBtn: {
    height: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
  },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  disabledBtn: { opacity: 0.7 },
  closeBtn: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: '#DC3545', padding: 15, borderRadius: 25 },
  closeBtnText: { color: '#FFF', fontWeight: 'bold' },
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
