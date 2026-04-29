import os

screens = [
    "DashboardScreen", "ApontamentoScreen", "ExameInicialScreen",
    "ExameFinalScreen", "FalhasScreen", "MateriaPrimaScreen",
    "ExpedicaoScreen", "BalancoScreen", "ConfiguracaoScreen"
]

os.makedirs(r"c:\Sistema\mobcap\frontend\src\screens", exist_ok=True)

for name in screens:
    content = f"""import React from 'react';
import {{ View, Text, StyleSheet }} from 'react-native';

export default function {name}() {{
  return (
    <View style={{styles.container}}>
      <Text style={{styles.title}}>{name}</Text>
    </View>
  );
}}

const styles = StyleSheet.create({{
  container: {{ flex: 1, justifyContent: 'center', alignItems: 'center' }},
  title: {{ fontSize: 24, fontWeight: 'bold' }},
}});
"""
    with open(rf"c:\Sistema\mobcap\frontend\src\screens\{name}.js", "w") as f:
        f.write(content)

print("Screens generated.")
