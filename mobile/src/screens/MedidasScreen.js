import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { medidaService } from '../services';
import { useTheme } from '../context/ThemeContext';

export default function MedidasScreen() {
  const { colors } = useTheme();
  const [medidas, setMedidas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMedidas = async () => {
    try {
      const data = await medidaService.listar();
      setMedidas(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMedidas();
  }, []);

  const renderItem = ({ item }) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardInfo}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{(item.DESCRICAO || '').trim()}</Text>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
          Código: {(item.CODIGO || '').trim()} | Tipo: {(item.TIPO || '').trim()}
        </Text>
      </View>
      <View style={[styles.badge, { backgroundColor: item.ATIVO === 'S' ? colors.success + '20' : colors.error + '20' }]}>
        <Text style={{ color: item.ATIVO === 'S' ? colors.success : colors.error, fontSize: 10, fontWeight: 'bold' }}>
          {item.ATIVO === 'S' ? 'ATIVO' : 'INATIVO'}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Medidas de Pneus</Text>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={medidas}
          keyExtractor={(item) => item.ID.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMedidas(); }} />}
          ListEmptyComponent={<Text style={[styles.empty, { color: colors.textSecondary }]}>Nenhuma medida encontrada.</Text>}
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
  card: { padding: 15, borderRadius: 16, marginBottom: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  cardSubtitle: { fontSize: 14, marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 16 }
});
