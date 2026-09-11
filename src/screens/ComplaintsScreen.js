import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import { scale } from "react-native-size-matters";
import { useNavigation } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
const Icon = MaterialIcons;
import Animated, { FadeInDown } from "react-native-reanimated";
import { useAlert } from "../context/AlertContext";
import { colors, spacing, borderRadius, shadows, typography } from "../theme";

const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL || "suporte@ureboque.com";
const SUPPORT_PHONE = process.env.EXPO_PUBLIC_SUPPORT_PHONE || "";
const SUPPORT_WHATSAPP_PHONE =
  process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP_PHONE || SUPPORT_PHONE;

const sanitizePhone = (value = "") => value.replace(/[^\d]/g, "");
const isConfiguredPhone = (value = "") => sanitizePhone(value).length >= 10;

const getDialPhone = () => {
  const phone = SUPPORT_PHONE || SUPPORT_WHATSAPP_PHONE;
  const clean = sanitizePhone(phone);
  return clean.length >= 10 ? `+${clean}` : "";
};

const CONTACT_MESSAGE = [
  "Olá equipa Ureboque,",
  "",
  "Pretendo apresentar uma reclamação na app Cliente.",
  "Número da viagem:",
  "Data:",
  "Descrição:",
].join("\n");

const ContactOption = ({ icon, title, subtitle, label, onPress, disabled }) => (
  <TouchableOpacity
    style={[styles.contactOption, disabled && styles.contactOptionDisabled]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <View style={[styles.contactIcon, disabled && styles.contactIconDisabled]}>
      <Icon name={icon} size={scale(21)} color={disabled ? colors.textMuted : colors.primary} />
    </View>
    <View style={styles.contactCopy}>
      <Text style={[styles.contactTitle, disabled && styles.mutedText]}>{title}</Text>
      <Text style={styles.contactSubtitle}>{subtitle}</Text>
    </View>
    <Text style={[styles.contactLabel, disabled && styles.mutedText]}>{label}</Text>
  </TouchableOpacity>
);

const ComplaintsScreen = () => {
  const navigation = useNavigation();
  const { showAlert } = useAlert();

  const showMissingPhone = () => {
    showAlert({
      type: "error",
      title: "Contacto indisponível",
      message: "Configure EXPO_PUBLIC_SUPPORT_PHONE ou EXPO_PUBLIC_SUPPORT_WHATSAPP_PHONE no ambiente da app.",
      buttons: [{ text: "OK" }],
    });
  };

  const openLink = async (url, errorMessage) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      showAlert({
        type: "error",
        title: "Não foi possível abrir",
        message: errorMessage,
        buttons: [{ text: "OK" }],
      });
    }
  };

  const handleWhatsApp = async () => {
    const phone = sanitizePhone(SUPPORT_WHATSAPP_PHONE);
    if (!isConfiguredPhone(SUPPORT_WHATSAPP_PHONE)) {
      showMissingPhone();
      return;
    }

    const text = encodeURIComponent(CONTACT_MESSAGE);
    const appUrl = `whatsapp://send?phone=${phone}&text=${text}`;
    const webUrl = `https://wa.me/${phone}?text=${text}`;

    try {
      await Linking.openURL(appUrl);
    } catch (error) {
      openLink(webUrl, "Não foi possível abrir o WhatsApp.");
    }
  };

  const handleEmail = () => {
    const subject = encodeURIComponent("Reclamação Ureboque - Cliente");
    const body = encodeURIComponent(CONTACT_MESSAGE);
    openLink(
      `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`,
      "Não foi possível abrir a aplicação de email."
    );
  };

  const handleCall = () => {
    const phone = getDialPhone();
    if (!phone) {
      showMissingPhone();
      return;
    }

    openLink(`tel:${phone}`, "Não foi possível iniciar a chamada.");
  };

  const hasPhone = isConfiguredPhone(SUPPORT_PHONE || SUPPORT_WHATSAPP_PHONE);

  return (
    <View style={styles.container}>
      <Animated.View
        style={styles.header}
        entering={FadeInDown.delay(0).springify().damping(28).stiffness(180)}
      >
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}
          activeOpacity={0.7}
        >
          <Icon name="menu" size={scale(22)} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>RECLAMAÇÕES</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          style={styles.summary}
          entering={FadeInDown.delay(60).springify().damping(28).stiffness(180)}
        >
          <View style={styles.summaryIcon}>
            <Icon name="support-agent" size={scale(28)} color={colors.primary} />
          </View>
          <Text style={styles.summaryTitle}>Fale com a equipa Ureboque</Text>
          <Text style={styles.summaryText}>
            Escolha o canal de contacto para reclamar, reportar uma viagem ou pedir acompanhamento.
          </Text>
        </Animated.View>

        <Animated.View
          style={styles.section}
          entering={FadeInDown.delay(120).springify().damping(28).stiffness(180)}
        >
          <Text style={styles.sectionTitle}>CONTACTOS</Text>
          <View style={styles.contactCard}>
            <ContactOption
              icon="chat"
              title="WhatsApp"
              subtitle={hasPhone ? "Mensagem pré-preenchida" : "Número por configurar"}
              label="Abrir"
              onPress={handleWhatsApp}
              disabled={!isConfiguredPhone(SUPPORT_WHATSAPP_PHONE)}
            />
            <View style={styles.divider} />
            <ContactOption
              icon="mail-outline"
              title="Email"
              subtitle={SUPPORT_EMAIL}
              label="Enviar"
              onPress={handleEmail}
            />
            <View style={styles.divider} />
            <ContactOption
              icon="phone"
              title="Chamada"
              subtitle={hasPhone ? getDialPhone() : "Número por configurar"}
              label="Ligar"
              onPress={handleCall}
              disabled={!hasPhone}
            />
          </View>
        </Animated.View>

        <Animated.View
          style={styles.note}
          entering={FadeInDown.delay(180).springify().damping(28).stiffness(180)}
        >
          <Icon name="report-problem" size={scale(20)} color={colors.warning} />
          <Text style={styles.noteText}>
            Inclua o número da viagem, data e uma descrição curta para acelerar a análise.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: spacing.headerHeight,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xxl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: borderRadius.xxl,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.sm,
  },
  headerSpacer: {
    width: scale(40),
    height: scale(40),
  },
  headerTitle: {
    fontSize: scale(17),
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  summary: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.xxl,
    alignItems: "center",
    marginBottom: spacing.xxl,
    ...shadows.sm,
  },
  summaryIcon: {
    width: scale(58),
    height: scale(58),
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  summaryTitle: {
    fontSize: scale(18),
    fontWeight: "800",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  summaryText: {
    fontSize: scale(13),
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: scale(19),
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  contactCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: "hidden",
    ...shadows.sm,
  },
  contactOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  contactOptionDisabled: {
    opacity: 0.72,
  },
  contactIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  contactIconDisabled: {
    backgroundColor: colors.borderLight,
  },
  contactCopy: {
    flex: 1,
  },
  contactTitle: {
    fontSize: scale(15),
    fontWeight: "700",
    color: colors.textPrimary,
  },
  contactSubtitle: {
    fontSize: scale(12),
    color: colors.textMuted,
    marginTop: scale(2),
  },
  contactLabel: {
    fontSize: scale(12),
    fontWeight: "700",
    color: colors.primary,
  },
  mutedText: {
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: scale(68),
  },
  note: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  noteText: {
    flex: 1,
    fontSize: scale(12),
    color: colors.textSecondary,
    lineHeight: scale(18),
  },
});

export default ComplaintsScreen;
