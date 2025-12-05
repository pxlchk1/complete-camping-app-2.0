
import React from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { DEEP_FOREST, PARCHMENT } from "../constants/colors";

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  date: Date;
  onDateChange: (event: any, date?: Date) => void;
  title: string;
  minimumDate?: Date;
}

export default function CalendarModal({
  visible,
  onClose,
  date,
  onDateChange,
  title,
  minimumDate,
}: CalendarModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={DEEP_FOREST} />
            </Pressable>
          </View>
          <DateTimePicker
            value={date}
            mode="date"
            display="inline"
            onChange={onDateChange}
            themeVariant="light"
            minimumDate={minimumDate}
            style={styles.picker}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: PARCHMENT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: "JosefinSlab_700Bold",
    color: DEEP_FOREST,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f9f4",
    alignItems: "center",
    justifyContent: "center",
  },
  picker: {
    alignSelf: "center",
  },
});
