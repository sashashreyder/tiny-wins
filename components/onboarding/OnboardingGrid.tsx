import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

export function OnboardingGrid({
  columns,
  gap,
  children,
}: {
  columns: number;
  gap: number;
  children: ReactNode[];
}) {
  const rows = chunk(children, columns);

  return (
    <View style={[styles.grid, { gap }]}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={[styles.row, { gap }]}>
          {row.map((child, colIndex) => (
            <View key={`cell-${rowIndex}-${colIndex}`} style={styles.cell}>
              {child}
            </View>
          ))}
          {row.length < columns
            ? Array.from({ length: columns - row.length }).map((_, i) => (
                <View key={`spacer-${rowIndex}-${i}`} style={styles.cell} />
              ))
            : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'stretch',
  },
  cell: {
    flex: 1,
    minWidth: 0,
  },
});
