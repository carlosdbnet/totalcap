import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { operadorService } from '../services';
import { useTheme } from '../context/ThemeContext';

export default function OperadoresScreen() {
  const { colors } = useTheme();
  const [operadores, setOperadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOperadores = async () => {
    try {
      const data = await operadorService.listar();
      setOperadores(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOperadores();
  }, []);

  const renderItem = ({ item }) => {
    const nome = (item.nome || item.NOME || '').trim();
    const cargo = (item.cargo || item.CARGO || '').trim();
    const setorDesc = item.setor?.descricao || item.setor?.DESCRICAO || item.codset || item.CODSET;
    const ativo = item.ativo === true || item.ATIVO === 'S';

    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary + '15' }]}>
          <MaterialCommunityIcons name="account" size={24} color={colors.primary} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{nome}</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            {cargo} | Setor: {setorDesc}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: ativo ? colors.success + '20' : colors.error + '20' }]}>
          <Text style={{ color: ativo ? colors.success : colors.error, fontSize: 10, fontWeight: 'bold' }}>
            {ativo ? 'ATIVO' : 'INATIVO'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Operadores</Text>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="account-plus" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={operadores}
          keyExtractor={(item) => (item.id || item.ID || Math.random()).toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOperadores(); }} />}
          ListEmptyComponent={<Text style={[styles.empty, { color: colors.textSecondary }]}>Nenhum operador encontrado.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold' },
  addButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  list: { padding: 20, paddingTop: 0 },
  card: { padding: 15, borderRadius: 16, marginBottom: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  cardSubtitle: { fontSize: 13, marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 16 }
});
