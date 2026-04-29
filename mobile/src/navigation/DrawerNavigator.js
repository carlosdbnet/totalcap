import React, { useState, useEffect } from 'react';
import { View, Alert, BackHandler, StyleSheet, Text, Image, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  createDrawerNavigator, 
  DrawerContentScrollView, 
  DrawerItemList, 
  DrawerItem 
} from '@react-navigation/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import * as Application from 'expo-application';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { credencialService } from '../services';

import DashboardScreen from '../screens/DashboardScreen';
import LocalizacaoScreen from '../screens/LocalizacaoScreen';
import ApontamentoScreen from '../screens/ApontamentoScreen';
import AvaliacaoScreen from '../screens/AvaliacaoScreen';
import FalhasScreen from '../screens/FalhasScreen';
import ConsumoScreen from '../screens/ConsumoScreen';

import OperadoresScreen from '../screens/OperadoresScreen';
import SetoresScreen from '../screens/SetoresScreen';
import ServicosScreen from '../screens/ServicosScreen';
import MedidasScreen from '../screens/MedidasScreen';
import DesenhosScreen from '../screens/DesenhosScreen';
import CadastrosScreen from '../screens/CadastrosScreen';
import ConfiguracaoScreen from '../screens/ConfiguracaoScreen';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  const { dark, colors } = useTheme();
  
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <View style={{ flex: 1 }}>
        <DrawerContentScrollView {...props} style={{ flex: 1 }}>
          <View style={[styles.drawerHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.drawerTitle, { color: colors.primary }]}>Mobcap</Text>
              <Text style={[styles.drawerSubtitle, { color: colors.textSecondary }]}>Gestão e Produção</Text>
            </View>
            <Image 
              source={require('../../assets/images/LogoDBnetSlogan.png')} 
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
          <DrawerItemList {...props} />
        </DrawerContentScrollView>
        
        <View style={[styles.exitContainer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
          <DrawerItem
            label="SAIR"
            icon={({ size }) => <MaterialCommunityIcons name="exit-to-app" color="#FFF" size={24} />}
            onPress={() => BackHandler.exitApp()}
            labelStyle={{ color: '#FFF', fontWeight: 'bold' }}
            style={[styles.exitButton, { backgroundColor: colors.error }]}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function DrawerNavigator() {
  const { colors } = useTheme();
  const [isAuthorized, setIsAuthorized] = useState(null); // null = carregando

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      // 1. Tentar recuperar status salvo localmente para rapidez
      const savedAuthStatus = await AsyncStorage.getItem('auth_status');
      
      if (savedAuthStatus === 'autorizado') {
        setIsAuthorized(true);
        return; // Abre rápido
      }

      // 2. Se não estiver autorizado localmente, verificar no servidor (id do android)
      let id = '';
      if (Platform.OS === 'android') {
        id = await Application.getAndroidId();
      } else {
        id = 'iOS-Device-ID';
      }

      const cred = await credencialService.verificar(id);
      const authorized = !!(cred && cred.autorizado);
      
      // Atualizar armazenamento local com o status real do servidor
      if (cred) {
        await AsyncStorage.setItem('auth_status', cred.autorizado ? 'autorizado' : 'aguardando');
      } else {
        await AsyncStorage.setItem('auth_status', 'nao_solicitado');
      }

      setIsAuthorized(authorized);
    } catch (error) {
      console.warn("Erro ao verificar acesso inicial:", error);
      setIsAuthorized(false);
    }
  };

  if (isAuthorized === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Drawer.Navigator 
      initialRouteName={isAuthorized ? "Apontamento" : "Configuração"}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: 'bold' },
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.textSecondary,
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} options={{ 
        drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />
      }} />
      <Drawer.Screen name="Apontamento" component={ApontamentoScreen} options={{ 
        drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="gesture-tap" color={color} size={size} />
      }} />
      <Drawer.Screen name="Localização" component={LocalizacaoScreen} options={{ 
        drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="map-marker-radius" color={color} size={size} />
      }} />
      <Drawer.Screen name="Avaliação" component={AvaliacaoScreen} options={{ 
        drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="file-document-check-outline" color={color} size={size} />
      }} />
      <Drawer.Screen name="Falhas" component={FalhasScreen} options={{ 
        title: 'Registro de Falhas',
        drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="alert-circle-outline" color={color} size={size} />
      }} />
      <Drawer.Screen name="Consumo" component={ConsumoScreen} options={{ 
        title: 'Consumo Materia Prima',
        drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="format-list-checks" color={color} size={size} />
      }} />
      <Drawer.Screen name="Setores" component={SetoresScreen} options={{ 
        drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="domain" color={color} size={size} />,
        drawerItemStyle: { display: 'none' }
      }} />
      <Drawer.Screen name="Operadores" component={OperadoresScreen} options={{ 
        drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="account-group" color={color} size={size} />,
        drawerItemStyle: { display: 'none' }
      }} />

      <Drawer.Screen name="Serviços" component={ServicosScreen} options={{ 
        drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="cog-refresh" color={color} size={size} />,
        drawerItemStyle: { display: 'none' }
      }} />
      <Drawer.Screen name="Medidas" component={MedidasScreen} options={{ 
        drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="ruler" color={color} size={size} />,
        drawerItemStyle: { display: 'none' }
      }} />
      <Drawer.Screen name="Desenhos" component={DesenhosScreen} options={{ 
        drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="brush" color={color} size={size} />,
        drawerItemStyle: { display: 'none' }
      }} />
      <Drawer.Screen name="Cadastros" component={CadastrosScreen} options={{ 
        drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="card-text-outline" color={color} size={size} />
      }} />
      <Drawer.Screen name="Configuração" component={ConfiguracaoScreen} options={{ 
        drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="cog" color={color} size={size} />
      }} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerHeader: { 
    padding: 20, 
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  drawerTitle: { fontSize: 22, fontWeight: 'bold' },
  drawerSubtitle: { fontSize: 12 },
  headerLogo: {
    width: 90,
    height: 45,
    marginTop: -5
  },
  exitContainer: { borderTopWidth: 1, paddingVertical: 5 },
  exitButton: { borderRadius: 12, marginHorizontal: 15 }
});
