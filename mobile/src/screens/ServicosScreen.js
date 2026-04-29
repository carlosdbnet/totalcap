import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { servicoService } from '../services';
import { useTheme } from '../context/ThemeContext';

export default function ServicosScreen() {
  const { colors } = useTheme();
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchServicos = async () => {
    try {
      const data = await servicoService.listar();
      setServicos(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchServicos();
  }, []);

  const renderItem = ({ item }) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardInfo}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{(item.DESCRICAO || '').trim()}</Text>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
          Código: {item.CODSERVICO} | Tipo: {item.CODRECAP}
        </Text>
        <View style={styles.specRow}>
           <Text style={[styles.specText, { color: colors.textSecondary }]}>Medida: {item.MEDIDA}</Text>
           <Text style={[styles.specText, { color: colors.textSecondary, marginLeft: 15 }]}>Desenho: {item.DESENHO}</Text>
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Catálogo de Serviços</Text>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={servicos}
          keyExtractor={(item) => item.ID.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchServicos(); }} />}
          ListEmptyComponent={<Text style={[styles.empty, { color: colors.textSecondary }]}>Nenhum serviço encontrado.</Text>}
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
  specRow: { flexDirection: 'row', marginTop: 8 },
  specText: { fontSize: 12, fontStyle: 'italic' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 16 }
});
