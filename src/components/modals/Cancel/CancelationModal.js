import React from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { scale } from "react-native-size-matters";
import { colors, spacing, borderRadius, shadows, typography } from "../../../theme";

const CancelationModal = ({
  questions,
  visible,
  onPressQuestion,
  closeModal,
}) => {
  const [selectedQuestion, setSelectedQuestion] = React.useState(null);
  const [otherText, setOtherText] = React.useState("");

  const handleConfirm = () => {
    const finalReason = selectedQuestion === "Outro" ? otherText : selectedQuestion;
    onPressQuestion(finalReason);
    // Reset state for next time
    setSelectedQuestion(null);
    setOtherText("");
  };

  const renderQuestionItem = ({ item }) => {
    const isSelected = selectedQuestion === item.question;
    return (
      <TouchableOpacity
        style={[
          styles.questionCard,
          isSelected && styles.selectedQuestionCard
        ]}
        onPress={() => {
          if (item.question === "Outro") {
            setSelectedQuestion("Outro");
          } else {
            onPressQuestion(item.question);
          }
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.questionText}>{item.question}</Text>
        <Icon
          name={isSelected ? "radio-button-checked" : "chevron-right"}
          size={scale(20)}
          color={isSelected ? colors.primary : colors.textMuted}
        />
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={closeModal}
      animationType="slide"
      statusBarTranslucent
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : scale(20)}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeModal}
              activeOpacity={0.7}
            >
              <Icon name="close" size={scale(24)} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Cancelar Viagem</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Warning Card */}
          <View style={styles.warningCard}>
            <View style={styles.warningIconContainer}>
              <Icon name="warning-amber" size={scale(24)} color={colors.warning} />
            </View>
            <Text style={styles.warningText}>
              O motorista já viajou por vários minutos. Antes de cancelar,
              diga-nos porque quer cancelar!
            </Text>
          </View>

          {/* Main Content Area */}
          <View style={styles.contentArea}>
            {selectedQuestion === "Outro" ? (
              <View style={styles.focusedOtherContainer}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setSelectedQuestion(null)}
                >
                  <Icon name="arrow-back" size={scale(20)} color={colors.primary} />
                  <Text style={styles.backButtonText}>Mudar motivo</Text>
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>Conte-nos o que aconteceu:</Text>

                <TextInput
                  style={styles.otherInputFocus}
                  placeholder="Descreva o motivo do cancelamento..."
                  value={otherText}
                  onChangeText={setOtherText}
                  multiline
                  numberOfLines={6}
                  autoFocus
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    !otherText.trim() && styles.disabledButton
                  ]}
                  onPress={handleConfirm}
                  disabled={!otherText.trim()}
                >
                  <Text style={styles.confirmButtonText}>Confirmar Cancelamento</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.questionsSection}>
                <Text style={styles.sectionTitle}>O que aconteceu? Conte-nos mais:</Text>
                <FlatList
                  data={questions}
                  renderItem={renderQuestionItem}
                  keyExtractor={(item) => item.key.toString()}
                  contentContainerStyle={styles.questionsList}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.headerHeight,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.primary,
  },
  headerSpacer: {
    width: scale(40),
  },
  warningCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.warningLight,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  warningIconContainer: {
    marginTop: scale(2),
  },
  warningText: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.textPrimary,
    lineHeight: scale(20),
  },
  contentArea: {
    flex: 1,
  },
  questionsSection: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  },
  focusedOtherContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  backButtonText: {
    marginLeft: spacing.xs,
    color: colors.primary,
    fontWeight: "600",
    fontSize: scale(14),
  },
  sectionTitle: {
    ...typography.sectionTitle,
    marginBottom: spacing.lg,
  },
  questionsList: {
    paddingBottom: spacing.xxl,
  },
  questionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectedQuestionCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  questionText: {
    flex: 1,
    ...typography.body,
    fontWeight: "500",
    marginRight: spacing.sm,
  },
  separator: {
    height: spacing.sm,
  },
  otherInputFocus: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...typography.body,
    minHeight: scale(150),
    textAlignVertical: "top",
    marginBottom: spacing.xxl,
    ...shadows.sm,
  },
  confirmButton: {
    backgroundColor: colors.error,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: "center",
    ...shadows.md,
  },
  confirmButtonText: {
    ...typography.buttonLabel,
    color: colors.surface,
    fontSize: scale(16),
  },
  disabledButton: {
    backgroundColor: colors.border,
    opacity: 0.6,
  },
});

export default CancelationModal;
