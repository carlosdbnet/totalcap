import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { setorService } from '../services';
import { useTheme } from '../context/ThemeContext';

export default function SetoresScreen() {
  const { colors } = useTheme();
  const [setores, setSetores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSetores = async () => {
    try {
      const data = await setorService.listar();
      setSetores(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSetores();
  }, []);

  const renderItem = ({ item }) => {
    const id = item.id !== undefined ? item.id : item.ID;
    const descricao = item.descricao || item.DESCRICAO;
    const codigo = item.codigo || item.CODIGO;
    const sequencia = item.sequencia !== undefined ? item.sequencia : item.SEQUENCIA;
    const ativo = item.ativo === true || item.ATIVO === 'S';

    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{descricao}</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Cod: {codigo} | Seq: {sequencia}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: ativo ? colors.success + '20' : colors.error + '20' }]}>
          <Text style={{ color: ativo ? colors.success : colors.error, fontSize: 12, fontWeight: 'bold' }}>
            {ativo ? 'ATIVO' : 'INATIVO'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Gerenciar Setores</Text>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={setores}
          keyExtractor={(item) => (item.id || item.ID || Math.random()).toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSetores(); }} />}
          ListEmptyComponent={<Text style={[styles.empty, { color: colors.textSecondary }]}>Nenhum setor encontrado.</Text>}
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
  card: { padding: 15, borderRadius: 12, marginBottom: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  cardSubtitle: { fontSize: 14, marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 16 }
});
