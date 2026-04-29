import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const CadastroCard = ({ title, icon, color, onPress, colors }) => (
  <TouchableOpacity 
    style={[styles.card, { backgroundColor: colors.surface, borderLeftColor: color }]} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.cardContent}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon} size={32} color={color} />
      </View>
      <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
    </View>
  </TouchableOpacity>
);

export default function CadastrosScreen({ navigation }) {
  const { colors } = useTheme();

  const cadastros = [
    { title: 'Setores', icon: 'domain', color: '#4CAF50', screen: 'Setores' },
    { title: 'Operadores', icon: 'account-group', color: '#2196F3', screen: 'Operadores' },
    { title: 'Serviços', icon: 'cog-refresh', color: '#9C27B0', screen: 'Serviços' },
    { title: 'Medidas', icon: 'ruler', color: '#E91E63', screen: 'Medidas' },
    { title: 'Desenhos', icon: 'brush', color: '#00BCD4', screen: 'Desenhos' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.header, { color: colors.text }]}>Cadastros</Text>
        <Text style={[styles.subHeader, { color: colors.textSecondary }]}>Gerencie os dados base do sistema.</Text>

        <View style={styles.grid}>
          {cadastros.map((item, index) => (
            <CadastroCard 
              key={index}
              title={item.title}
              icon={item.icon}
              color={item.color}
              colors={colors}
              onPress={() => navigation.navigate(item.screen)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  header: { fontSize: 28, fontWeight: 'bold' },
  subHeader: { fontSize: 16, marginBottom: 25 },
  grid: { gap: 15 },
  card: {
    borderRadius: 15,
    padding: 15,
    borderLeftWidth: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
});
