import { useSafeAreaInsets } from "react-native-safe-area-context";
import React from "react";
import { View, StyleSheet, ScrollView } from 'react-native';
import { AppText as Text } from '../components/common/AppText';
import { AppPressable as TouchableOpacity } from '../components/common/AppPressable';
import { AppHeader } from '../components/common/AppHeader';

import { scale } from "react-native-size-matters";
import { useNavigation, useRoute } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
const Icon = MaterialIcons;
import Animated, { FadeInDown } from "react-native-reanimated";
import { colors, spacing, borderRadius, shadows, typography, sizes, layout } from "../theme";

const PRIVACY_SECTIONS = [
  {
    title: "Dados que recolhemos",
    body: "Podemos recolher dados de conta, contacto, veículo, localização durante pedidos de reboque, histórico de serviços, mensagens de suporte e dados técnicos de funcionamento da app.",
  },
  {
    title: "Como usamos os dados",
    body: "Usamos estes dados para criar e gerir pedidos, encontrar motoristas, calcular rotas, comunicar consigo, prestar suporte, prevenir fraude e melhorar a estabilidade do serviço.",
  },
  {
    title: "Localização",
    body: "A localização é usada para mostrar o mapa, indicar o ponto de recolha, acompanhar o serviço e orientar cliente e motorista. A app deve pedir permissão antes de usar localização.",
  },
  {
    title: "Logs e diagnóstico",
    body: "A app pode enviar logs técnicos sanitizados para o backend da Ureboque. Estes logs não devem conter palavra-passe, OTP, tokens, telefone, email, chat, pagamento ou localização exata.",
  },
  {
    title: "Sentry",
    body: "O Sentry é usado apenas para crashes e erros técnicos. O envio é sanitizado para evitar dados sensíveis como email, telefone, localização exata, mensagens, OTP ou tokens.",
  },
  {
    title: "Partilha de dados",
    body: "Podemos partilhar dados necessários com fornecedores operacionais, como mapas, envio de email, WhatsApp/OTP, infraestrutura cloud e ferramentas de diagnóstico técnico.",
  },
  {
    title: "Direitos do utilizador",
    body: "Pode contactar o suporte para pedir acesso, correção ou eliminação dos seus dados, conforme aplicável pela lei local.",
  },
];

const TERMS_SECTIONS = [
  {
    title: "Uso do serviço",
    body: "A Ureboque liga clientes que precisam de assistência/reboque a motoristas ou operadores disponíveis. O utilizador deve fornecer informação correta e usar a app de forma responsável.",
  },
  {
    title: "Pedidos e disponibilidade",
    body: "A disponibilidade de motoristas, tempos estimados, rotas e preços podem variar conforme localização, trânsito, tipo de serviço e condições operacionais.",
  },
  {
    title: "Conta e segurança",
    body: "O utilizador é responsável por manter a sua conta segura. Códigos OTP, tokens e palavras-passe não devem ser partilhados.",
  },
  {
    title: "Pagamentos e reclamações",
    body: "Valores, métodos de pagamento, recibos e reclamações devem seguir as regras operacionais comunicadas pela Ureboque. Reclame pelo ecrã de suporte quando necessário.",
  },
  {
    title: "Conduta",
    body: "Clientes e motoristas devem agir com respeito, segurança e boa-fé. Abuso, fraude ou comportamento perigoso pode levar a suspensão da conta.",
  },
  {
    title: "Limitação técnica",
    body: "A app depende de internet, GPS, mapas, notificações e serviços de terceiros. Falhas externas podem afetar a experiência.",
  },
];

const DOCUMENTS = {
  privacy: {
    title: "Política de Privacidade",
    updatedAt: "Atualizado em julho de 2026",
    sections: PRIVACY_SECTIONS,
  },
  terms: {
    title: "Termos de Serviço",
    updatedAt: "Atualizado em julho de 2026",
    sections: TERMS_SECTIONS,
  },
};

const LegalDocumentScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const type = route.params?.type || "privacy";
  const document = DOCUMENTS[type] || DOCUMENTS.privacy;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <AppHeader title={document.title} leftIcon="arrow-back" leftLabel="Voltar"
        onLeftPress={() => navigation.goBack()} style={styles.header} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.updatedAt}>{document.updatedAt}</Text>
        <View style={styles.card}>
          {document.sections.map((section, index) => (
            <View
              key={section.title}
              style={[styles.section, index === document.sections.length - 1 && styles.sectionLast]}
            >
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionBody}>{section.body}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.footerNote}>
          Para dúvidas ou pedidos relacionados com estes documentos, use o ecrã Contacte-nos/Reclamações.
        </Text>
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
    maxWidth: layout.contentMaxWidth,
    alignSelf: "center",
  },
  scrollContent: {
    width: "100%",
    maxWidth: layout.contentMaxWidth,
    alignSelf: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  updatedAt: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: "hidden",
    ...shadows.sm,
  },
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sectionLast: {
    borderBottomWidth: 0,
  },
  sectionTitle: {
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  sectionBody: {
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  footerNote: {
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
    lineHeight: 20,
    marginTop: spacing.lg,
  },
});

export default LegalDocumentScreen;
