import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { DataTable, Card, Text } from "react-native-paper";
import { useSearchParams } from "expo-router/build/hooks";

export default function ValidationReportScreen() {
  const searchParams = useSearchParams();
  const report = searchParams.get("report");

  // Parse the report properly (handle JSON array)
  let errors: string[] = [];
  try {
    errors = report ? JSON.parse(report) : [];
  } catch (e) {
    console.error("Error parsing report:", e);
    errors = [report || "Invalid report format."];
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Validation Report" titleStyle={styles.title} />
        <Card.Content>
          {errors.length > 0 ? (
            <DataTable>
              <DataTable.Header>
                <DataTable.Title textStyle={styles.tableHeader}>Error Message</DataTable.Title>
              </DataTable.Header>
              {errors.map((err, index) => (
                <DataTable.Row key={index}>
                  <DataTable.Cell style={styles.tableCell}>{err}</DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          ) : (
            <Text style={styles.noErrorsText}>No validation errors found.</Text>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#F9FAFB",
  },
  card: {
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    backgroundColor: "#FFF",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#EF4444",
  },
  tableHeader: {
    fontWeight: "bold", // This now works with textStyle
    fontSize: 16,
  },
  tableCell: {
    flex: 1,
    paddingVertical: 10,
  },
  noErrorsText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginTop: 10,
  },
});
