import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { desenhoService } from '../services';
import { useTheme } from '../context/ThemeContext';

export default function DesenhosScreen() {
  const { colors } = useTheme();
  const [desenhos, setDesenhos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDesenhos = async () => {
    try {
      const data = await desenhoService.listar();
      setDesenhos(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDesenhos();
  }, []);

  const renderItem = ({ item }) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.primary + '10' }]}>
        <MaterialCommunityIcons name="brush" size={24} color={colors.primary} />
      </View>
      <View style={styles.cardInfo}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{(item.DESCRICAO || '').trim()}</Text>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
          Código: {item.CODIGO} | Largura: {item.LARGURA || 'N/A'}
        </Text>
      </View>
      <View style={[styles.typeBadge, { backgroundColor: colors.border }]}>
        <Text style={{ color: colors.text, fontSize: 10 }}>TIPO {item.TIPO}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Desenhos / Bandas</Text>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={desenhos}
          keyExtractor={(item) => item.ID.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDesenhos(); }} />}
          ListEmptyComponent={<Text style={[styles.empty, { color: colors.textSecondary }]}>Nenhum desenho encontrado.</Text>}
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
  iconContainer: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  cardSubtitle: { fontSize: 14, marginTop: 4 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 16 }
});
