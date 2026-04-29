import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { dashboardService } from '../services';
import { useTheme } from '../context/ThemeContext';

const StatCard = ({ title, value, icon, color, colors }) => (
  <View style={[styles.card, { backgroundColor: colors.surface, borderLeftColor: color, shadowColor: colors.text }]}>
    <View style={styles.cardHeader}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
      <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>{title}</Text>
    </View>
    <Text style={[styles.cardValue, { color: colors.text }]}>{value}</Text>
  </View>
);

export default function DashboardScreen() {
  const { colors, dark } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={[styles.header, { color: colors.text }]}>MobCap Dashboard</Text>
        <Text style={[styles.subHeader, { color: colors.textSecondary }]}>{new Date().toLocaleDateString('pt-BR')}</Text>

        <View style={styles.statsGrid}>
          <StatCard 
            title="Produção Hoje" 
            value={stats?.total_producao_dia || 0} 
            icon="tire" 
            color={colors.success} 
            colors={colors}
          />
          <StatCard 
            title="Falhas Hoje" 
            value={stats?.total_falhas_dia || 0} 
            icon="alert-octagon" 
            color={colors.error} 
            colors={colors}
          />
          <StatCard 
            title="Pendentes" 
            value={stats?.pneus_pendentes || 0} 
            icon="clock-outline" 
            color="#FF9800" 
            colors={colors}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Últimas Falhas</Text>
          {stats?.ultimas_falhas && stats.ultimas_falhas.length > 0 ? (
            stats.ultimas_falhas.map((falha) => (
              <View key={falha.id} style={[styles.falhaItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.falhaBadge, { backgroundColor: dark ? '#442124' : '#F8D7DA' }]}>
                  <Text style={[styles.falhaId, { color: dark ? '#FFBABA' : '#721C24' }]}>#{falha.id_pneu}</Text>
                </View>
                <View style={styles.falhaTextContainer}>
                  <Text style={[styles.falhaDesc, { color: colors.text }]}>{falha.observacao || "Sem observação"}</Text>
                  <Text style={[styles.falhaDate, { color: colors.textSecondary }]}>{new Date(falha.data).toLocaleDateString('pt-BR')}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhuma falha recente registrada.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 28, fontWeight: 'bold' },
  subHeader: { fontSize: 16, marginBottom: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '48%',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 5,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 14, marginLeft: 8 },
  cardValue: { fontSize: 24, fontWeight: 'bold' },
  section: { marginTop: 10 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  falhaItem: {
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
  },
  falhaBadge: {
    padding: 8,
    borderRadius: 6,
    marginRight: 15,
  },
  falhaId: { fontWeight: 'bold', fontSize: 12 },
  falhaTextContainer: { flex: 1 },
  falhaDesc: { fontSize: 16, fontWeight: '500' },
  falhaDate: { fontSize: 12, marginTop: 4 },
  emptyText: { textAlign: 'center', marginTop: 20 },
});
