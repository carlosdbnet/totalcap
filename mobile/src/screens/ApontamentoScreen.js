import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Camera from 'expo-camera';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { auxService, pneuService, producaoService } from '../services';

export default function ApontamentoScreen() {
  const navigation = useNavigation();
  const [codigoBarra, setCodigoBarra] = useState('');
  const [idSetor, setIdSetor] = useState('');
  const [idOperador, setIdOperador] = useState('');
  const { colors, dark } = useTheme();

  const [listaSetores, setListaSetores] = useState([]);
  const [listaOperadores, setListaOperadores] = useState([]);
  const inputRef = useRef(null);
  const lastScanRef = useRef({ code: '', time: 0 });

  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [activeTarget, setActiveTarget] = useState('pneu');
  const [focusedField, setFocusedField] = useState(null);
  const [pneuEncontrado, setPneuEncontrado] = useState(null);
  const [showSetorModal, setShowSetorModal] = useState(false);
  const [showOperadorModal, setShowOperadorModal] = useState(false);

  const [horaInicio, setHoraInicio] = useState('');
  const [horaTermino, setHoraTermino] = useState('');
  const [tempo, setTempo] = useState('0');
  const [clienteNome, setClienteNome] = useState('');
  const [apontamentoExistente, setApontamentoExistente] = useState(null);
  const [mensagem, setMensagem] = useState('');

  const inputOperadorRef = useRef(null);
  const inputSetorRef = useRef(null);
  const inputInicioRef = useRef(null);
  const inputTerminoRef = useRef(null);

  const cameraPermission = Camera.useCameraPermissions ? Camera.useCameraPermissions() : [null, () => { }];
  const [permission, requestPermission] = cameraPermission;

  const getNowTimeStr = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const resetAndInit = async () => {
        setCodigoBarra('');
        setIdSetor('');
        setIdOperador('');
        setPneuEncontrado(null);
        setClienteNome('');
        setHoraInicio('');
        setHoraTermino('');
        setTempo('0');
        setApontamentoExistente(null);
        setMensagem('');

        try {
          await loadDefaults();
          await fetchAuxiliares();
        } catch (err) {
          console.warn("Erro no reset do Apontamento:", err);
        } finally {
          setTimeout(() => {
            setFocusedField('pneu');
            if (inputRef.current) {
              inputRef.current.clear();
              inputRef.current.focus();
            }
          }, 400);
        }
      };
      resetAndInit();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchAuxiliares = async () => {
    try {
      const setores = await auxService.listarSetores();
      const operadores = await auxService.listarOperadores();
      setListaSetores(Array.isArray(setores) ? setores : []);
      setListaOperadores(Array.isArray(operadores) ? operadores : []);
    } catch (error) {
      setListaSetores([]);
      setListaOperadores([]);
    }
  };

  const loadDefaults = async () => {
    try {
      const savedSetor = await AsyncStorage.getItem('default_setor');
      const savedOperador = await AsyncStorage.getItem('default_operador');
      if (savedSetor) {
        const sid = parseInt(savedSetor);
        if (!isNaN(sid)) setIdSetor(sid);
      }
      if (savedOperador) {
        const oid = parseInt(savedOperador);
        if (!isNaN(oid)) setIdOperador(oid);
      }
    } catch (error) {
      console.warn('Erro ao carregar padrões');
    }
  };

  const calcularTempoMinutos = (ini, fin) => {
    if (!ini || !fin || fin.length < 5 || ini.length < 5) return 0;
    const [h1, m1] = ini.split(':').map(Number);
    const [h2, m2] = fin.split(':').map(Number);
    const d1 = h1 * 60 + m1;
    const d2 = h2 * 60 + m2;
    return d2 >= d1 ? d2 - d1 : 0;
  };

  useEffect(() => {
    setTempo(calcularTempoMinutos(horaInicio, horaTermino).toString());
  }, [horaInicio, horaTermino]);

  async function validarPneu(codigo) {
    const cod = String(codigo || '').trim().replace(/[^a-zA-Z0-9]/g, '');

    // Proteção: Ignora se for o mesmo código validado há menos de 2.5 segundos
    const agora = Date.now();
    if (cod === lastScanRef.current.code && (agora - lastScanRef.current.time) < 2500) {
      console.log('[Apontamento] Ignorando validação duplicada/rápida:', cod);
      return;
    }

    // Proteção: Ignora se estiver vazio ou se for um bip curto demais (ruído)
    if (!cod || cod.length < 3 || cod === 'undefined') {
      return;
    }

    if (loading) return;

    lastScanRef.current = { code: cod, time: agora };
    console.log('[Apontamento] Validando Pneu:', cod);

    setLoading(true);
    try {
      const pneu = await producaoService.buscarPneu(cod);
      setPneuEncontrado(pneu);
      setClienteNome(pneu.nome_cliente || 'Cliente não identificado');

      if (!idSetor) {
        Alert.alert('Aviso', 'Selecione o Setor antes de validar.');
        setLoading(false);
        return;
      }

      const existente = await producaoService.buscarExistente(pneu.id, idSetor);
      if (existente) {
        setApontamentoExistente(existente);
        const iniRaw = existente.inicio || existente.INICIO;
        const terRaw = existente.termino || existente.TERMINO;
        if (iniRaw) setHoraInicio(new Date(iniRaw).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        if (terRaw) setHoraTermino(new Date(terRaw).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        else setHoraTermino('');

        const opId = existente.id_operador || existente.ID_OPERADOR;
        if (opId) setIdOperador(opId);
        setTempo((existente.tempo || existente.TEMPO || 0).toString());
        setMensagem(terRaw ? 'Apontamento já finalizado.' : 'Apontamento em andamento...');
      } else {
        setApontamentoExistente(null);
        setHoraInicio('');
        setHoraTermino('');
        setTempo('0');
        setMensagem('');
      }

      const jaFinalizou = existente && (existente.termino || existente.TERMINO);
      if (jaFinalizou) {
        setFocusedField('pneu');
        setTimeout(() => {
          setCodigoBarra('');
          if (inputRef.current) {
            inputRef.current.clear();
            inputRef.current.focus();
          }
        }, 1500);
      } else {
        setFocusedField('operador');
        setTimeout(() => {
          if (inputOperadorRef.current) inputOperadorRef.current.focus();
        }, 100);
      }
    } catch (error) {
      console.error('[Apontamento] Erro na validação:', error);
      setMensagem(`Pneu "${cod}" não encontrado.`);
      setCodigoBarra('');
    } finally {
      setLoading(false);
    }
  }

  async function registrarProducao(operadorId) {
    if (!pneuEncontrado || !idSetor || !operadorId) return;
    setLoading(true);
    try {
      const apontamentoAtivo = await producaoService.buscarExistente(pneuEncontrado.id, idSetor);
      const timeStr = getNowTimeStr();
      const dateStr = new Date().toISOString().split('T')[0];

      if (apontamentoAtivo && (apontamentoAtivo.status === 'I' || apontamentoAtivo.STATUS === 'I')) {
        const opOriginal = apontamentoAtivo.id_operador || apontamentoAtivo.ID_OPERADOR;
        
        // Bloqueio Rígido: Operador deve ser o mesmo do início
        if (opOriginal && opOriginal != operadorId) {
          setMensagem('ERRO: Operador diferente do início. Bloqueado.');
          setLoading(false);
          return;
        }

        const iniRaw = apontamentoAtivo.inicio || apontamentoAtivo.INICIO;
        const iniTime = iniRaw ? new Date(iniRaw).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : timeStr;
        const duracao = calcularTempoMinutos(iniTime, timeStr);

        const dados = {
          ...apontamentoAtivo,
          id_setor: parseInt(idSetor),
          id_operador: parseInt(operadorId),
          status: 'F',
          termino: `${dateStr}T${timeStr}:00`,
          tempo: duracao,
          userlan: 'MOBILE',
        };

        await producaoService.atualizar(apontamentoAtivo.id || apontamentoAtivo.ID, dados);
        setApontamentoExistente(dados);
        setHoraInicio(iniTime);
        setHoraTermino(timeStr);
        setTempo(duracao.toString());
        setMensagem('Gravado com sucesso');
      } else {
        const dadosNovo = {
          id_pneu: pneuEncontrado.id,
          codbarra: codigoBarra,
          id_setor: parseInt(idSetor),
          id_operador: parseInt(operadorId),
          status: 'I',
          inicio: `${dateStr}T${timeStr}:00`,
          id_retrabalho: 0,
          userlan: 'MOBILE',
        };
        await producaoService.criar(dadosNovo);
        setMensagem('Iniciado com sucesso');
      }
      setFocusedField('pneu');
      setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 200);
    } catch (e) {
      setMensagem('Erro ao registrar');
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
      const st = listaSetores.find(s => (s.id || s.ID || '').toString() === String(data).trim());
      if (st) {
        setIdSetor(st.id || st.ID);
        setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 300);
      }
    } else if (activeTarget === 'operador') {
      const op = listaOperadores.find(o => (o.id || o.ID || '').toString() === String(data).trim());
      if (op) {
        setIdOperador(op.id || op.ID);
        registrarProducao(op.id || op.ID);
      }
    }
  };

  const handleEncerrar = async () => {
    if (!apontamentoExistente || apontamentoExistente.termino || apontamentoExistente.TERMINO) return;
    setLoading(true);
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const fin = getNowTimeStr();
      const duracao = calcularTempoMinutos(horaInicio, fin);
      const dados = {
        id_pneu: pneuEncontrado?.id,
        id_setor: parseInt(idSetor),
        id_operador: parseInt(idOperador),
        inicio: `${dateStr}T${horaInicio}:00`,
        termino: `${dateStr}T${fin}:00`,
        tempo: duracao,
        status: 'F'
      };
      await producaoService.atualizar(apontamentoExistente.id, dados);
      setHoraTermino(fin);
      setTempo(duracao.toString());
      Alert.alert('Sucesso', 'Produção encerrada');
    } catch (e) {
      Alert.alert('Erro', 'Falha ao encerrar');
    } finally {
      setLoading(false);
    }
  };

  const handleSalvar = async () => {
    if (!pneuEncontrado || !idSetor || !idOperador) return;
    setLoading(true);
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const novo = {
        id_pneu: pneuEncontrado.id,
        codbarra: codigoBarra,
        id_setor: parseInt(idSetor),
        id_operador: parseInt(idOperador),
        inicio: `${dateStr}T${horaInicio || getNowTimeStr()}:00`,
        id_retrabalho: 0,
        status: 'I',
        userlan: 'MOBILE',
      };
      await producaoService.criar(novo);
      Alert.alert('Sucesso', 'Iniciado com sucesso');
    } catch (e) {
      Alert.alert('Erro', 'Falha ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const isFinalizado = !!(apontamentoExistente && (apontamentoExistente.termino || apontamentoExistente.TERMINO));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={[styles.formGroup, { zIndex: 900 }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Setor</Text>
          <TouchableOpacity
            style={[
              styles.inputWrapper,
              { backgroundColor: colors.inputBackground, borderColor: colors.border, height: 65 },
              focusedField === 'setor' && { backgroundColor: dark ? '#555500' : '#FFFF00', borderColor: colors.primary, borderWidth: 2 }
            ]}
            onPress={() => {
              setFocusedField('setor');
              setShowSetorModal(true);
            }}
          >
            <TextInput
              ref={inputSetorRef}
              style={{ flex: 1, color: colors.text, paddingHorizontal: 15, fontSize: 16 }}
              value={idSetor ? (listaSetores.find(s => (s.id !== undefined ? s.id : s.ID) == idSetor)?.DESCRICAO || listaSetores.find(s => (s.id !== undefined ? s.id : s.ID) == idSetor)?.descricao || '') : ''}
              editable={false}
              placeholder="Selecione um Setor..."
              pointerEvents="none"
            />
            <View style={[styles.scannerBtn, { backgroundColor: colors.primary }]}>
              <MaterialCommunityIcons name="barcode-scan" size={24} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.formGroup, { zIndex: 1000 }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Pneu (Cód. Barra / ID)</Text>
          <View style={[
            styles.inputWrapper,
            { backgroundColor: colors.inputBackground, borderColor: colors.border },
            focusedField === 'pneu' && { backgroundColor: dark ? '#555500' : '#FFFF00', borderColor: colors.primary, borderWidth: 2 }
          ]}>
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: colors.text }]}
              value={codigoBarra}
              onChangeText={setCodigoBarra}
              onSubmitEditing={() => validarPneu(codigoBarra)}
              onFocus={() => setFocusedField('pneu')}
              placeholder="Digite ou Bipe"
            />
            <TouchableOpacity style={[styles.scannerBtn, { backgroundColor: colors.primary }]} onPress={() => { setActiveTarget('pneu'); setScanning(true); }}>
              <MaterialCommunityIcons name="barcode-scan" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.formGroup, { zIndex: 700 }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Operador</Text>
          <TouchableOpacity
            style={[
              styles.inputWrapper,
              { backgroundColor: colors.inputBackground, borderColor: colors.border, height: 65 },
              focusedField === 'operador' && { backgroundColor: dark ? '#555500' : '#FFFF00', borderColor: colors.primary, borderWidth: 2 }
            ]}
            onPress={() => {
              setFocusedField('operador');
              setShowOperadorModal(true);
            }}
          >
            <TextInput
              ref={inputOperadorRef}
              style={{ flex: 1, color: colors.text, paddingHorizontal: 15, fontSize: 16 }}
              value={idOperador ? (listaOperadores.find(op => (op.id !== undefined ? op.id : op.ID) == idOperador)?.NOME || listaOperadores.find(op => (op.id !== undefined ? op.id : op.ID) == idOperador)?.nome || '') : ''}
              editable={false}
              pointerEvents="none"
            />
            <View style={[styles.scannerBtn, { backgroundColor: colors.primary }]}>
              <MaterialCommunityIcons name="barcode-scan" size={24} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Identificação / Cliente</Text>
          <View style={[styles.infoContainer, { backgroundColor: dark ? '#333' : '#e0e0e0', borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.idText, { color: colors.primary }]}>ID PNEU: {pneuEncontrado?.id || '--'}</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 'bold' }}>
                OP: {idOperador ? (listaOperadores.find(op => (op.id !== undefined ? op.id : op.ID) == idOperador)?.NOME || listaOperadores.find(op => (op.id !== undefined ? op.id : op.ID) == idOperador)?.nome || '...') : '--'}
              </Text>
            </View>
            <Text style={[styles.clienteText, { color: colors.text, marginTop: 4 }]} numberOfLines={1}>
              {clienteNome || 'Cliente não identificado'}
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.thirdWidth}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Início</Text>
            <TextInput
              ref={inputInicioRef}
              style={[
                styles.pickerContainer,
                { backgroundColor: colors.inputBackground, color: colors.text, textAlign: 'center' },
                focusedField === 'inicio' && { backgroundColor: dark ? '#555500' : '#FFFF00', borderColor: colors.primary, borderWidth: 2 }
              ]}
              value={horaInicio}
              onChangeText={setHoraInicio}
              onFocus={() => setFocusedField('inicio')}
              onBlur={() => setFocusedField(null)}
            />
          </View>
          <View style={styles.thirdWidth}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Término</Text>
            <TextInput
              ref={inputTerminoRef}
              style={[
                styles.pickerContainer,
                { backgroundColor: colors.inputBackground, color: colors.text, textAlign: 'center' },
                focusedField === 'termino' && { backgroundColor: dark ? '#555500' : '#FFFF00', borderColor: colors.primary, borderWidth: 2 }
              ]}
              value={horaTermino}
              onChangeText={setHoraTermino}
              onFocus={() => setFocusedField('termino')}
              onBlur={() => setFocusedField(null)}
            />
          </View>
          <View style={styles.thirdWidth}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Minutos</Text>
            <Text style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, color: colors.text, textAlign: 'center', paddingTop: 20 }]}>{tempo}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          {mensagem ? <Text style={styles.mensagemText}>{mensagem}</Text> : null}
          {!isFinalizado && (
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.success, width: '100%' }, !!loading && { opacity: 0.5 }]}
              onPress={() => apontamentoExistente ? handleEncerrar() : handleSalvar()}
              disabled={!!loading}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>{apontamentoExistente ? 'ENCERRAR' : 'SALVAR'}</Text>}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal visible={showSetorModal} transparent onRequestClose={() => setShowSetorModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <ScrollView>{listaSetores.map(s => (
              <TouchableOpacity key={s.id || s.ID} style={styles.modalItem} onPress={() => { setIdSetor(s.id || s.ID); setShowSetorModal(false); }}>
                <Text style={{ color: colors.text }}>{s.DESCRICAO || s.descricao}</Text>
              </TouchableOpacity>
            ))}</ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showOperadorModal} transparent onRequestClose={() => setShowOperadorModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <ScrollView>{listaOperadores.map(op => (
              <TouchableOpacity key={op.id || op.ID} style={styles.modalItem} onPress={() => { setIdOperador(op.id || op.ID); setShowOperadorModal(false); registrarProducao(op.id || op.ID); }}>
                <Text style={{ color: colors.text }}>{op.NOME || op.nome}</Text>
              </TouchableOpacity>
            ))}</ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={scanning} animationType="slide">
        <Camera.CameraView style={{ flex: 1 }} onBarcodeScanned={handleScan} />
        <TouchableOpacity style={styles.closeBtn} onPress={() => setScanning(false)}><Text style={styles.closeBtnText}>Cancelar</Text></TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  formGroup: { marginBottom: 15 },
  label: { fontSize: 12, fontWeight: 'bold', marginBottom: 5, textTransform: 'uppercase' },
  inputWrapper: { flexDirection: 'row', borderRadius: 12, borderWidth: 1 },
  input: { flex: 1, height: 65, paddingHorizontal: 15, fontSize: 16 },
  scannerBtn: { width: 70, height: 65, justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
  pickerContainer: { height: 65, borderRadius: 12, borderWidth: 1, justifyContent: 'center', fontSize: 18 },
  saveBtn: { height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  mensagemText: { color: '#FF0000', fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  closeBtn: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: '#DC3545', padding: 15, borderRadius: 25 },
  closeBtnText: { color: '#FFF', fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  thirdWidth: { width: '31%' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 20, padding: 20, maxHeight: '80%' },
  modalItem: { paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: '#ccc' },
  infoContainer: { padding: 12, borderRadius: 12, borderWidth: 1, minHeight: 65 },
  idText: { fontSize: 16, fontWeight: 'bold' },
  clienteText: { fontSize: 14 },
  footer: { marginTop: 10 }
});
