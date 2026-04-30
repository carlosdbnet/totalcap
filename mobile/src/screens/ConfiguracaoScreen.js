import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { auxService, credencialService } from '../services';
import { useTheme } from '../context/ThemeContext';
import * as Application from 'expo-application';
import { Platform, BackHandler } from 'react-native';

export default function ConfiguracaoScreen() {
  const [ip, setIp] = useState('192.168.15.98');
  const [porta, setPorta] = useState('8082');
  const [setor, setSetor] = useState('');
  const { dark, colors, mode, setMode } = useTheme();
  
  const [listaSetores, setListaSetores] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [tested, setTested] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [authStatus, setAuthStatus] = useState('nao_solicitado'); // 'nao_solicitado', 'aguardando', 'autorizado'

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedIp = await AsyncStorage.getItem('server_ip');
      const savedPort = await AsyncStorage.getItem('server_port');
      const savedSetor = await AsyncStorage.getItem('default_setor');
      const savedAuthStatus = await AsyncStorage.getItem('auth_status');

      if (savedIp) setIp(savedIp);
      if (savedPort) setPorta(savedPort);
      if (savedSetor) setSetor(parseInt(savedSetor));
      if (savedAuthStatus) setAuthStatus(savedAuthStatus);
      
      // Obter ID do Dispositivo e Verificar Autorização
      try {
        let id = '';
        if (Platform.OS === 'android') {
          id = await Application.getAndroidId();
          setDeviceId(id);
        } else {
          id = 'iOS-Device-ID';
          setDeviceId(id);
        }

        // Verificar na API
        const cred = await credencialService.verificar(id);
        if (cred) {
          setAuthStatus(cred.autorizado ? 'autorizado' : 'aguardando');
        } else {
          setAuthStatus('nao_solicitado');
        }
      } catch (err) {
        console.warn('Erro ao verificar credencial:', err);
      }

      // Carregar listas se o IP estiver definido
      if (savedIp || ip) {
        fetchAuxiliares(savedIp || ip, savedPort || porta);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAuxiliares = async (currentIp, currentPort) => {
    try {
      const setores = await auxService.listarSetores();
      setListaSetores(Array.isArray(setores) ? setores : []);
      return { success: true };
    } catch (error) {
      console.warn("Não foi possível carregar listas auxiliares:", error);
      return { success: false, error: error.message };
    }
  };

  const testarConexao = async () => {
    let fullUrl = '';
    
    // Detectando se é uma URL completa ou apenas um IP local
    if (ip.includes('vercel.app') || ip.startsWith('http')) {
      fullUrl = ip.startsWith('http') ? ip : `https://${ip}`;
      
      // Se for Vercel e não tiver /api/ nem /api/v1, adiciona /api/v1/
      const hasApiPrefix = fullUrl.includes('/api/v1') || fullUrl.includes('/api/');
      if (ip.includes('vercel.app') && !hasApiPrefix) {
        if (!fullUrl.endsWith('/')) fullUrl += '/';
        fullUrl += 'api/v1/';
      }
      
      if (!fullUrl.endsWith('/')) fullUrl += '/';
    } else {
      fullUrl = `http://${ip}:${porta}/`;
    }
    
    if (ip.toLowerCase() === 'localhost' || ip === '127.0.0.1') {
      Alert.alert('IP Inválido', 'No celular (APK), você deve usar o IP local do seu computador (ex: 192.168.15.20) e não localhost.');
      return;
    }

    setLoading(true);
    setTested(false);
    try {
      console.log(`Testando conexão em: ${fullUrl}`);
      let response;
      if (fullUrl.includes('/api/v1/')) {
        response = await axios.get(`${fullUrl}ping`, { timeout: 10000 });
      } else {
        response = await axios.get(fullUrl, { timeout: 10000 });
      }
      if (response.status === 200) {
        await AsyncStorage.setItem('server_ip', ip);
        await AsyncStorage.setItem('server_port', porta);
        
        setTested(true);
        const result = await fetchAuxiliares(ip, porta);
        
        if (result.success) {
          Alert.alert('Sucesso', 'Conexão estabelecida e listas carregadas com sucesso!');
        } else {
          Alert.alert('Parcial', 'Conexão estabelecida, mas não foi possível carregar Setores/Operadores. Verifique se o servidor está configurado.');
        }
      }
    } catch (error) {
      console.error(error);
      let errorDetail = error.message;
      
      // Detecção de erro comum de segurança no Android (bloqueio de HTTP)
      if (errorDetail === "Network Error" && !error.response) {
        errorDetail = "Erro de Rede: O Android pode estar bloqueando a conexão HTTP (Cleartext). Verifique se o app foi compilado com a permissão correta ou tente via navegador no celular primeiro.";
      }

      const errorMsg = error.response ? `Erro: ${error.response.status}` : (error.code === 'ECONNABORTED' ? 'Tempo esgotado (Timeout)' : errorDetail);
      
      Alert.alert(
        'Falha na Conexão', 
        `${errorMsg}\n\nURL Testada:\n${fullUrl}\n\nVerifique se o computador e o celular estão no mesmo Wi-Fi.`
      );
    } finally {
      setLoading(false);
    }
  };

  const limparConfiguracoes = async () => {
    Alert.alert(
      'Restaurar Padrões',
      'Deseja apagar as configurações salvas e voltar ao IP padrão do sistema?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sim, Restaurar', 
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('server_ip');
              await AsyncStorage.removeItem('server_port');
              await AsyncStorage.removeItem('default_setor');
              
              setIp('192.168.15.98');
              setPorta('8082');
              setTested(false);
              
              Alert.alert('Sucesso', 'Configurações resetadas! O app agora usará o IP padrão.');
            } catch (error) {
              Alert.alert('Erro', 'Falha ao limpar.');
            }
          }
        }
      ]
    );
  };

  const salvarConfiguracoes = async () => {
    if (!tested) {
      Alert.alert('Atenção', 'Por favor, teste a conexão antes de salvar.');
      return;
    }

    try {
      await AsyncStorage.setItem('server_ip', ip);
      await AsyncStorage.setItem('server_port', porta);
      await AsyncStorage.setItem('default_setor', String(setor || ''));
      await AsyncStorage.setItem('auth_status', authStatus);
      
      Alert.alert('Sucesso', 'Configurações salvas!');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao salvar.');
    }
  };

  const solicitarAutorizacao = async () => {
    if (!deviceId) {
      Alert.alert('Erro', 'Não foi possível obter o ID do dispositivo.');
      return;
    }
    if (!setor) {
      Alert.alert('Aviso', 'Selecione o Setor Padrão antes de solicitar autorização.');
      return;
    }

    // Se já solicitou, apenas verifica o status
    if (authStatus === 'aguardando') {
      setLoading(true);
      try {
        const cred = await credencialService.verificar(deviceId);
        if (cred && cred.autorizado) {
          setAuthStatus('autorizado');
          Alert.alert('Sucesso', 'Seu acesso foi autorizado!');
        } else {
          Alert.alert('Aguardando', 'Sua solicitação ainda não foi aprovada pelo administrador.');
        }
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível verificar o status agora.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Se não solicitou, envia nova solicitação
    setLoading(true);
    try {
      await credencialService.solicitar(deviceId, parseInt(setor));
      setAuthStatus('aguardando');
      Alert.alert('Sucesso', 'Solicitação de credencial enviada com sucesso!');
    } catch (error) {
      const msg = error.response?.data?.detail || 'Não foi possível enviar a solicitação.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Preferências Visuais</Text>
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Tema do Aplicativo</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <Picker
                selectedValue={mode}
                onValueChange={(itemValue) => setMode(itemValue)}
                style={[styles.picker, { color: colors.text }]}
                dropdownIconColor={colors.text}
              >
                <Picker.Item label="Claro" value="light" color={colors.text} />
                <Picker.Item label="Escuro" value="dark" color={colors.text} />
                <Picker.Item label="Seguir Sistema" value="system" color={colors.text} />
              </Picker>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Conectividade</Text>
          <View style={styles.rowContainer}>
            <View style={[styles.formGroup, { flex: 0.7, marginRight: 10 }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Endereço IP</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]} 
                placeholderTextColor={colors.textSecondary}
                value={ip}
                onChangeText={(text) => { setIp(text); setTested(false); }}
              />
            </View>
            <View style={[styles.formGroup, { flex: 0.3 }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Porta</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]} 
                placeholderTextColor={colors.textSecondary}
                value={porta}
                onChangeText={(text) => { setPorta(text); setTested(false); }}
                keyboardType="numeric"
              />
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.testBtn, { backgroundColor: colors.primary }, tested && styles.testBtnSuccess]} 
            onPress={testarConexao}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>{tested ? "CONEXÃO OK" : "TESTAR CONEXÃO"}</Text>}
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Padrões do Aparelho</Text>
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Setor Padrão</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <Picker
                selectedValue={setor}
                onValueChange={(itemValue) => setSetor(itemValue)}
                style={[styles.picker, { color: colors.text }]}
                dropdownIconColor={colors.text}
              >
                <Picker.Item label="Selecione um Setor..." value="" color={colors.textSecondary} />
                {listaSetores.map(s => (
                  <Picker.Item key={s.id} label={s.descricao || s.DESCRICAO} value={s.id} color={colors.text} />
                ))}
              </Picker>
            </View>
          </View>

        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Credenciamento</Text>
          
          <View style={styles.deviceIdRow}>
            <View style={[styles.deviceIdContainer, { flex: 1, marginRight: 10 }]}>
              <Text style={[styles.deviceIdLabel, { color: colors.textSecondary }]}>ID DO DISPOSITIVO:</Text>
              <Text style={[styles.deviceIdValue, { color: colors.text }]}>{deviceId || 'Obtendo...'}</Text>
            </View>

            <TouchableOpacity 
              style={[
                styles.smallAuthBtn, 
                { borderColor: colors.primary, borderWidth: 1 },
                authStatus === 'autorizado' && { borderColor: colors.textSecondary, opacity: 0.5 }
              ]} 
              onPress={solicitarAutorizacao}
              disabled={loading || authStatus === 'autorizado'}
            >
              {loading ? <ActivityIndicator size="small" color={colors.primary} /> : (
                <Text style={[
                  styles.authBtnText, 
                  { color: authStatus === 'autorizado' ? colors.textSecondary : colors.primary }
                ]}>
                  {authStatus === 'nao_solicitado' ? 'SOLICITAR' : (authStatus === 'aguardando' ? 'VERIFICAR' : 'OK')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.statusContainer}>
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>STATUS:</Text>
            <Text style={[
              styles.statusValue, 
              { color: authStatus === 'autorizado' ? '#28A745' : (authStatus === 'aguardando' ? '#FFC107' : colors.textSecondary) }
            ]}>
              {authStatus === 'autorizado' ? 'AUTORIZADO' : (authStatus === 'aguardando' ? 'AGUARDANDO APROVAÇÃO' : 'NÃO SOLICITADO')}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, { backgroundColor: colors.text }, !tested && styles.disabledBtn]} 
          onPress={salvarConfiguracoes}
          disabled={!tested}
        >
          <Text style={[styles.saveBtnText, { color: dark ? '#000' : '#FFF' }]}>SALVAR CONFIGURAÇÕES</Text>
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <TouchableOpacity 
            style={[styles.resetBtn, { borderColor: colors.error, flex: 1, marginRight: 10 }]} 
            onPress={limparConfiguracoes}
          >
            <Text style={[styles.resetBtnText, { color: colors.error }]}>RESTAURAR PADRÕES</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.exitBtn, { backgroundColor: colors.error, flex: 0.4 }]} 
            onPress={() => BackHandler.exitApp()}
          >
            <Text style={styles.exitBtnText}>SAIR</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  header: { fontSize: 26, fontWeight: 'bold' },
  subHeader: { fontSize: 14, marginBottom: 20 },
  section: { borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  rowContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  formGroup: { marginBottom: 12 },
  label: { fontSize: 11, fontWeight: 'bold', marginBottom: 5, textTransform: 'uppercase' },
  input: { height: 65, borderRadius: 12, borderWidth: 1, paddingHorizontal: 15, fontSize: 16 },
  pickerContainer: { height: 65, borderRadius: 12, borderWidth: 1, justifyContent: 'center' },
  picker: { height: 65, width: '100%' },
  testBtn: { height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  testBtnSuccess: { backgroundColor: '#28A745' },
  saveBtn: { height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  disabledBtn: { backgroundColor: '#ADB5BD' },
  resetBtn: { height: 50, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed' },
  resetBtnText: { fontWeight: 'bold', fontSize: 12 },
  footerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15, marginBottom: 20 },
  exitBtn: {

    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  authBtnText: { fontWeight: 'bold', fontSize: 13 },

  deviceIdRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  smallAuthBtn: {
    height: 55,
    paddingHorizontal: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceIdContainer: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceIdLabel: { fontSize: 9, fontWeight: 'bold', marginBottom: 2 },
  deviceIdValue: { fontSize: 13, fontWeight: 'bold', letterSpacing: 0.5 },
  statusContainer: {
    padding: 5,
    alignItems: 'center',
    marginTop: 5,
  },
  statusLabel: { fontSize: 9, fontWeight: 'bold' },
  statusValue: { fontSize: 14, fontWeight: 'bold', marginTop: 1 },
});
