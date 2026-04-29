import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { pneuService } from '../services';
import { useTheme } from '../context/ThemeContext';

export default function PneusScreen() {
  const { colors } = useTheme();
  const [pneus, setPneus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchPneus = async (query = '') => {
    try {
      const data = await pneuService.listar(query);
      setPneus(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPneus();
  }, []);

  const handleSearch = (text) => {
    setSearch(text);
    fetchPneus(text);
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.barcode, { color: colors.primary }]}>{item.CODBARRA || 'SEM BARRAS'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.STATPRO === 'F' ? colors.success + '20' : '#FF980020' }]}>
          <Text style={{ color: item.STATPRO === 'F' ? colors.success : '#FF9800', fontSize: 10, fontWeight: 'bold' }}>
            {item.STATPRO === 'F' ? 'FINALIZADO' : 'EM PROCESSAMENTO'}
          </Text>
        </View>
      </View>
      
      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>ID Ordem</Text>
          <Text style={[styles.value, { color: colors.text }]}>{item.id_ordem || '-'}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Série</Text>
          <Text style={[styles.value, { color: colors.text }]}>{item.numserie || '-'}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <MaterialCommunityIcons name="car-tire-alert" size={16} color={colors.textSecondary} />
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Pneu ID: {item.id} | DOT: {item.dot || '-'}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={24} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
          placeholder="Buscar por código de barras..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={handleSearch}
        />
        <TouchableOpacity style={[styles.scanButton, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="barcode-scan" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={pneus}
          keyExtractor={(item) => item.ID.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPneus(); }} />}
          ListEmptyComponent={<Text style={[styles.empty, { color: colors.textSecondary }]}>Nenhum pneu encontrado.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: { flexDirection: 'row', padding: 15, alignItems: 'center' },
  searchIcon: { position: 'absolute', left: 30, zIndex: 1 },
  searchInput: { flex: 1, height: 50, borderRadius: 25, paddingLeft: 45, paddingRight: 20, borderWidth: 1, fontSize: 16 },
  scanButton: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginLeft: 10, elevation: 4 },
  list: { padding: 15, paddingTop: 0 },
  card: { padding: 15, borderRadius: 20, marginBottom: 15, borderWidth: 1, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  barcode: { fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  gridItem: { flex: 1 },
  label: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 },
  value: { fontSize: 14, fontWeight: '600' },
  footer: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#00000010', paddingTop: 10 },
  footerText: { fontSize: 12, marginLeft: 6 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 16 }
});
