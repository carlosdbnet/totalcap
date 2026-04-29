import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Camera from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { auxService, pneuService, producaoService } from '../services';

export default function ApontamentoScreen() {
  const [codigoBarra, setCodigoBarra] = useState('');
  const [idSetor, setIdSetor] = useState('');
  const [idOperador, setIdOperador] = useState('');
  const { colors, dark } = useTheme();

  const [listaSetores, setListaSetores] = useState([]);
  const [listaOperadores, setListaOperadores] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [activeTarget, setActiveTarget] = useState('pneu'); // 'pneu', 'operador' ou 'setor'
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
  const inputClienteRef = useRef(null);
  const inputInicioRef = useRef(null);
  const inputTerminoRef = useRef(null);
  
  // Hook de permissão com verificação de segurança
  const cameraPermission = Camera.useCameraPermissions ? Camera.useCameraPermissions() : [null, () => {}];
  const [permission, requestPermission] = cameraPermission;

  // Função manual de formatação de hora (mais estável que toLocaleTimeString)
  const getNowTimeStr = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  useEffect(() => {
    const init = async () => {
      try {
        await loadDefaults();
        // Não aguardamos o fetchAuxiliares para não travar a abertura da tela
        fetchAuxiliares();
      } catch (err) {
        console.warn("Erro na inicialização do Apontamento:", err);
      } finally {
        setTimeout(() => {
          setFocusedField('pneu');
          if (inputRef.current) inputRef.current.focus();
        }, 800);
      }
    };
    init();
  }, []);

  const fetchAuxiliares = async () => {
    try {
      const setores = await auxService.listarSetores();
      const operadores = await auxService.listarOperadores();
      setListaSetores(Array.isArray(setores) ? setores : []);
      setListaOperadores(Array.isArray(operadores) ? operadores : []);
    } catch (error) {
      console.warn('Servidor offline ou erro de rede ao carregar auxiliares');
      setListaSetores([]);
      setListaOperadores([]);
    }
  };

  const loadDefaults = async () => {
    try {
      const savedSetor = await AsyncStorage.getItem('default_setor');
      const savedOperador = await AsyncStorage.getItem('default_operador');

      if (savedSetor && savedSetor !== 'undefined' && savedSetor !== 'null') {
        const sid = parseInt(savedSetor);
        if (!isNaN(sid)) setIdSetor(sid);
      }

      if (savedOperador && savedOperador !== 'undefined' && savedOperador !== 'null') {
        const oid = parseInt(savedOperador);
        if (!isNaN(oid)) setIdOperador(oid);
      }

      return true;
    } catch (error) {
      console.warn('Erro ao carregar padrões do armazenamento local');
      return false;
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

  async function validarPneu(codigo = codigoBarra) {
    if (!codigo) return;
    setLoading(true);
    try {
      const pneu = await producaoService.buscarPneu(codigo);
      setPneuEncontrado(pneu);
      setClienteNome(pneu.nome_cliente || (pneu.id_contato ? `Sem nome (ID Contato: ${pneu.id_contato})` : 'Nenhum Contato Vinculado'));

      if (!idSetor) {
        Alert.alert('Dados Incompletos', 'Selecione o Setor antes de validar o Pneu.');
        setLoading(false);
        return;
      }

      // Sempre ilumina e foca o campo Operador para a próxima ação
      setFocusedField('operador');
      setTimeout(() => {
        if (inputOperadorRef.current) inputOperadorRef.current.focus();
      }, 100);
    } catch (error) {
      Alert.alert('Erro', 'Pneu não encontrado na base de dados.');
      setCodigoBarra('');
      setClienteNome('');
      if (inputRef.current) inputRef.current.focus();
    } finally {
      setLoading(false);
    }
  }

  async function registrarProducao(operadorId = idOperador) {
    if (!pneuEncontrado || !idSetor || !operadorId) {
      if (!pneuEncontrado) Alert.alert('Dados Incompletos', 'Informe o Pneu antes de registrar.');
      else if (!idSetor) Alert.alert('Dados Incompletos', 'Selecione o Setor antes de registrar.');
      else Alert.alert('Dados Incompletos', 'Selecione o Operador antes de registrar.');
      return;
    }
    setLoading(true);
    try {
      const apontamentoAtivo = await producaoService.buscarExistente(pneuEncontrado.id, idSetor);

      const timeStr = getNowTimeStr();
      const dateStr = new Date().toISOString().split('T')[0];

      if (apontamentoAtivo && (apontamentoAtivo.status === 'I' || apontamentoAtivo.STATUS === 'I' || !apontamentoAtivo.status)) {
        // Já existe e status = "I" -> Finalizar
        const iniRaw = apontamentoAtivo.inicio || apontamentoAtivo.INICIO || apontamentoAtivo.data_inicio;
        const iniTime = iniRaw ? new Date(iniRaw).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : timeStr;
        const duracao = calcularTempoMinutos(iniTime, timeStr);

        const dadosAtualizados = {
          ...apontamentoAtivo,
          id_pneu: pneuEncontrado.id,
          codbarra: codigoBarra,
          id_setor: parseInt(idSetor),
          id_operador: parseInt(operadorId),
          id_recap: pneuEncontrado.id_recap || apontamentoAtivo.id_recap,
          status: 'F',
          termino: `${dateStr}T${timeStr}:00`,
          tempo: duracao,
          userlan: 'MOBILE',
        };

        try {
          await producaoService.atualizar(apontamentoAtivo.id || apontamentoAtivo.ID, dadosAtualizados);
          setHoraInicio(iniTime);
          setHoraTermino(timeStr);
          setTempo(duracao.toString());
          setApontamentoExistente({ ...apontamentoAtivo, ...dadosAtualizados });
          setMensagem('Gravação executado c/ sucesso');
          setFocusedField('pneu');
          setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 150);
        } catch (e) {
          setMensagem('Erro ao gravar a alteração.');
        }

      } else {
        // Não existe (ou é de outro ciclo) -> Iniciar automático
        const dadosNovo = {
          id_pneu: pneuEncontrado.id,
          codbarra: codigoBarra,
          id_setor: parseInt(idSetor),
          id_operador: parseInt(operadorId),
          id_recap: pneuEncontrado.id_recap || 0,
          id_maquina: 0,
          id_proximo: 0,
          status: 'I',
          inicio: `${dateStr}T${timeStr}:00`,
          termino: null,
          tempo: 0,
          id_retrabalho: 0,
          userlan: 'MOBILE',
        };

        try {
          await producaoService.criar(dadosNovo);
          setHoraInicio(timeStr);
          setHoraTermino('');
          setTempo('0');
          setApontamentoExistente(null);
          setMensagem('Inclusão executado c/ sucesso');
          setFocusedField('pneu');
          setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 150);
        } catch (e) {
          setMensagem('Erro ao incluir o registro.');
        }
      }
    } catch (error) {
      setMensagem('Erro ao registrar o apontamento.');
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
        // Pula para o Operador após escanear o Setor
        setTimeout(() => {
          if (inputOperadorRef.current) inputOperadorRef.current.focus();
        }, 100);
      } else {
        Alert.alert('Aviso', 'Setor não encontrado (Código inválido).');
      }
    } else if (activeTarget === 'operador') {
      const dataStr = String(data).trim().toLowerCase();
      console.log('Scanner Operador - Lido:', dataStr);
      console.log('Lista Operadores (Primeiro item):', listaOperadores[0]);

      const op = listaOperadores.find(o => {
        const idStr = String(o.id || o.ID || '').toLowerCase();
        const codStr = String(o.CODIGO || o.codigo || '').trim().toLowerCase();
        const nomeStr = String(o.NOME || o.nome || '').trim().toLowerCase();
        return idStr === dataStr || codStr === dataStr || nomeStr === dataStr;
      });

      if (op) {
        const finalId = op.id !== undefined ? op.id : op.ID;
        console.log('Operador encontrado:', op.NOME || op.nome, 'ID:', finalId);
        setIdOperador(finalId);
        // Após escanear o Operador, registra a produção
        registrarProducao(finalId);
      } else {
        console.warn('Operador não encontrado na lista local para o código:', dataStr);
        Alert.alert('Aviso', `Operador não encontrado (${data}).`);
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

  const handleSalvar = async (overrideHoraInicio) => {
    const hIni = typeof overrideHoraInicio === 'string' ? overrideHoraInicio : horaInicio;

    if (!pneuEncontrado || !idSetor || !idOperador || !hIni) {
      Alert.alert('Dados Incompletos', 'Setor, Operador, Pneu e Início são obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const novoApontamento = {
        id_pneu: pneuEncontrado?.id,
        codbarra: codigoBarra,
        id_setor: parseInt(idSetor),
        id_operador: parseInt(idOperador),
        id_recap: pneuEncontrado?.id_recap || 0,
        id_maquina: 0,
        id_proximo: 0,
        inicio: `${dateStr}T${hIni || '00:00'}:00`,
        termino: horaTermino ? `${dateStr}T${horaTermino}:00` : null,
        tempo: parseFloat(tempo) || 0,
        id_retrabalho: 0,
        userlan: 'MOBILE',
      };

      await producaoService.criar(novoApontamento);
      Alert.alert('Sucesso', 'Apontamento registrado com sucesso!');
      setCodigoBarra('');
      setClienteNome('');
      const nowStr = getNowTimeStr();
      setHoraInicio(nowStr);
      setHoraTermino(nowStr);
      if (inputRef.current) inputRef.current.focus();
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao registrar o apontamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = async () => {
    if (!apontamentoExistente) return;
    setLoading(true);
    try {
      await producaoService.excluir(apontamentoExistente.id);
      Alert.alert('Sucesso', 'Registro excluído com sucesso.');

      setCodigoBarra('');
      setClienteNome('');
      setApontamentoExistente(null);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível excluir o registro.');
    } finally {
      setLoading(false);
    }
  };

  const handleEncerrar = async () => {
    if (!apontamentoExistente) return;
    setLoading(true);
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const fin = getNowTimeStr();
      const duracao = calcularTempoMinutos(horaInicio, fin);

      const dadosAtualizados = {
        id_pneu: pneuEncontrado?.id,
        codbarra: codigoBarra,
        id_setor: parseInt(idSetor),
        id_operador: parseInt(idOperador),
        inicio: `${dateStr}T${horaInicio}:00`,
        termino: `${dateStr}T${fin}:00`,
        tempo: duracao,
      };

      await producaoService.atualizar(apontamentoExistente.id, dadosAtualizados);
      Alert.alert('Sucesso', 'Produção encerrada com sucesso!');
      setHoraTermino(fin);
      setTempo(duracao.toString());
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao encerrar a produção.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>


        <View style={[
          styles.formGroup,
          { zIndex: focusedField === 'pneu' ? 1000 : 900, elevation: focusedField === 'pneu' ? 10 : 9 }
        ]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Pneu (Cód. Barra / ID)</Text>
          <View style={[
            styles.inputWrapper,
            { backgroundColor: colors.inputBackground, borderColor: colors.border },
            focusedField === 'pneu' && { backgroundColor: dark ? '#555500' : '#FFFF00', borderColor: colors.primary, borderWidth: 2 }
          ]}>
            <TextInput
              ref={inputRef}
              style={[
                styles.input,
                { color: colors.text, textAlign: 'left' },
                focusedField === 'pneu' && { backgroundColor: 'transparent' }
              ]}
              onFocus={() => {
                setCodigoBarra('');
                setFocusedField('pneu');
              }}
              onBlur={() => {
                setFocusedField(null);
              }}
              placeholder="Digite o codigo de barra ou ID"
              placeholderTextColor={colors.textSecondary}
              value={codigoBarra}
              onChangeText={(text) => {
                setCodigoBarra(text);
                setMensagem('');
              }}
              onEndEditing={() => validarPneu(codigoBarra)}
            />
            <TouchableOpacity style={[styles.scannerBtn, { backgroundColor: colors.primary }]} onPress={() => openScanner('pneu')}>
              <MaterialCommunityIcons name="barcode-scan" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.formGroup, { zIndex: 800 }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Setor</Text>
          <View style={[
            styles.inputWrapper, 
            { backgroundColor: colors.inputBackground, borderColor: colors.border, height: 65 },
            focusedField === 'setor' && { backgroundColor: dark ? '#555500' : '#FFFF00', borderColor: colors.primary, borderWidth: 2 }
          ]}>
            <TouchableOpacity 
              style={{ flex: 1, justifyContent: 'center' }} 
              onPress={() => setShowSetorModal(true)}
              activeOpacity={0.7}
            >
              <TextInput
                ref={inputSetorRef}
                style={{ color: colors.text, paddingHorizontal: 15, fontSize: 16 }}
                value={idSetor ? (listaSetores.find(s => (s.id || s.ID) === idSetor)?.DESCRICAO || listaSetores.find(s => (s.id || s.ID) === idSetor)?.descricao || 'Selecionado') : ''}
                placeholder="Selecione um Setor..."
                placeholderTextColor={colors.textSecondary}
                editable={false}
                pointerEvents="none"
                onFocus={() => setFocusedField('setor')}
                onBlur={() => setFocusedField(null)}
              />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.scannerBtn, { backgroundColor: colors.primary }]} onPress={() => openScanner('setor')}>
              <MaterialCommunityIcons name="barcode-scan" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.formGroup, { zIndex: 700 }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Operador Responsável</Text>
          <View style={[
            styles.inputWrapper, 
            { backgroundColor: colors.inputBackground, borderColor: colors.border, height: 65 },
            focusedField === 'operador' && { backgroundColor: dark ? '#555500' : '#FFFF00', borderColor: colors.primary, borderWidth: 2 }
          ]}>
            <TouchableOpacity 
              style={{ flex: 1, justifyContent: 'center' }} 
              onPress={() => setShowOperadorModal(true)}
              activeOpacity={0.7}
            >
              <TextInput
                ref={inputOperadorRef}
                style={{ color: colors.text, paddingHorizontal: 15, fontSize: 16 }}
                value={idOperador ? (listaOperadores.find(op => (op.id || op.ID) === idOperador)?.NOME || listaOperadores.find(op => (op.id || op.ID) === idOperador)?.nome || 'Selecionado') : ''}
                placeholder="Selecione um Operador..."
                placeholderTextColor={colors.textSecondary}
                editable={false}
                pointerEvents="none"
                onFocus={() => setFocusedField('operador')}
                onBlur={() => setFocusedField(null)}
                onEndEditing={() => registrarProducao()}
              />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.scannerBtn, { backgroundColor: colors.primary }]} onPress={() => openScanner('operador')}>
              <MaterialCommunityIcons name="barcode-scan" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Cliente</Text>
          <View style={[styles.inputWrapper, { backgroundColor: dark ? '#333' : '#e0e0e0', borderColor: colors.border }]}>
            <TextInput
              ref={inputClienteRef}
              style={[styles.input, { color: colors.text, textAlign: 'left' }]}
              value={clienteNome}
              editable={false}
              placeholder="Não informado"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>


        <View style={styles.row}>
          <View style={styles.thirdWidth}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Início</Text>
            <View style={[
              styles.pickerContainer,
              { backgroundColor: colors.inputBackground, borderColor: colors.border },
              focusedField === 'inicio' && { backgroundColor: dark ? '#555500' : '#FFFF00' }
            ]}>
              <TextInput
                ref={inputInicioRef}
                style={[styles.searchInput, { color: colors.text, height: 65, textAlign: 'left' }]}
                value={horaInicio}
                onFocus={() => setFocusedField('inicio')}
                onBlur={() => setFocusedField(null)}
                onChangeText={setHoraInicio}
                placeholder="00:00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
          <View style={styles.thirdWidth}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Término</Text>
            <View style={[
              styles.pickerContainer,
              { backgroundColor: colors.inputBackground, borderColor: colors.border },
              focusedField === 'termino' && { backgroundColor: dark ? '#555500' : '#FFFF00' }
            ]}>
              <TextInput
                ref={inputTerminoRef}
                style={[styles.searchInput, { color: colors.text, height: 65, textAlign: 'left' }]}
                value={horaTermino}
                onFocus={() => setFocusedField('termino')}
                onBlur={() => setFocusedField(null)}
                onChangeText={setHoraTermino}
                placeholder="00:00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
          <View style={styles.thirdWidth}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Tempo (min)</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border, opacity: 0.7 }]}>
              <TextInput
                style={[styles.searchInput, { color: colors.text, height: 65, fontWeight: 'bold', textAlign: 'left' }]}
                value={tempo}
                editable={false}
                placeholder="--"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>
        </View>

        <View style={[styles.formGroup, { flexDirection: 'row', alignItems: 'center' }]}>
          <View style={{ flex: 1, marginRight: 10 }}>
            {mensagem ? <Text style={styles.mensagemText}>{mensagem}</Text> : null}
          </View>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.success, width: 160 }, loading && styles.disabledBtn]}
            onPress={() => apontamentoExistente ? handleEncerrar() : handleSalvar()}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>{apontamentoExistente ? 'ENCERRAR' : 'SALVAR'}</Text>}
          </TouchableOpacity>
        </View>
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
                      if (inputOperadorRef.current) setTimeout(() => inputOperadorRef.current.focus(), 100);
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

      {/* Modal Operador */}
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
                      // Registra a produção após seleção do operador no modal
                      registrarProducao(val);
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

      <Modal visible={scanning} animationType="slide">
        {Camera.CameraView ? (
          <Camera.CameraView style={{ flex: 1 }} onBarcodeScanned={handleScan} />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Câmera Indisponível</Text></View>
        )}
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
  inputWrapper: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    height: 65,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  scannerBtn: {
    width: 70,
    height: 65,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  pickerContainer: {
    height: 65,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
  },
  picker: { height: 65, width: '100%' },
  saveBtn: {
    height: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
  },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  disabledBtn: { backgroundColor: '#A5D6A7' },
  mensagemText: { color: '#FF0000', fontSize: 14, fontWeight: 'bold' },
  operatorDisplayName: { fontSize: 13, fontWeight: 'bold', marginTop: 5, fontStyle: 'italic' },
  closeBtn: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: '#DC3545', padding: 15, borderRadius: 25 },
  closeBtnText: { color: '#FFF', fontWeight: 'bold' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  halfWidth: {
    width: '48%',
  },
  thirdWidth: {
    width: '31%',
  },
  commandWidth: {
    width: '65%',
  },
  buttonWidth: {
    width: '32%',
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
