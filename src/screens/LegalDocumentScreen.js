import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { scale } from "react-native-size-matters";
import { useNavigation, useRoute } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { colors, spacing, borderRadius, shadows, typography } from "../theme";

const PRIVACY_SECTIONS = [
  {
    title: "Dados que recolhemos",
    body: "Podemos recolher dados de conta, contacto, veiculo, localizacao durante pedidos de reboque, historico de servicos, mensagens de suporte e dados tecnicos de funcionamento da app.",
  },
  {
    title: "Como usamos os dados",
    body: "Usamos estes dados para criar e gerir pedidos, encontrar motoristas, calcular rotas, comunicar consigo, prestar suporte, prevenir fraude e melhorar a estabilidade do servico.",
  },
  {
    title: "Localizacao",
    body: "A localizacao e usada para mostrar o mapa, indicar o ponto de recolha, acompanhar o servico e orientar cliente e motorista. A app deve pedir permissao antes de usar localizacao.",
  },
  {
    title: "Logs e diagnostico",
    body: "A app pode enviar logs tecnicos sanitizados para o backend da Ureboque. Estes logs nao devem conter palavra-passe, OTP, tokens, telefone, email, chat, pagamento ou localizacao exata.",
  },
  {
    title: "Sentry",
    body: "O Sentry e usado apenas para crashes e erros tecnicos. O envio e sanitizado para evitar dados sensiveis como email, telefone, localizacao exata, mensagens, OTP ou tokens.",
  },
  {
    title: "Partilha de dados",
    body: "Podemos partilhar dados necessarios com fornecedores operacionais, como mapas, envio de email, WhatsApp/OTP, infraestrutura cloud e ferramentas de diagnostico tecnico.",
  },
  {
    title: "Direitos do utilizador",
    body: "Pode contactar o suporte para pedir acesso, correcao ou eliminacao dos seus dados, conforme aplicavel pela lei local.",
  },
];

const TERMS_SECTIONS = [
  {
    title: "Uso do servico",
    body: "A Ureboque liga clientes que precisam de assistencia/reboque a motoristas ou operadores disponiveis. O utilizador deve fornecer informacao correta e usar a app de forma responsavel.",
  },
  {
    title: "Pedidos e disponibilidade",
    body: "A disponibilidade de motoristas, tempos estimados, rotas e precos podem variar conforme localizacao, transito, tipo de servico e condicoes operacionais.",
  },
  {
    title: "Conta e seguranca",
    body: "O utilizador e responsavel por manter a sua conta segura. Codigos OTP, tokens e palavras-passe nao devem ser partilhados.",
  },
  {
    title: "Pagamentos e reclamacoes",
    body: "Valores, metodos de pagamento, recibos e reclamacoes devem seguir as regras operacionais comunicadas pela Ureboque. Reclame pelo ecrã de suporte quando necessario.",
  },
  {
    title: "Conduta",
    body: "Clientes e motoristas devem agir com respeito, seguranca e boa-fe. Abuso, fraude ou comportamento perigoso pode levar a suspensao da conta.",
  },
  {
    title: "Limitacao tecnica",
    body: "A app depende de internet, GPS, mapas, notificacoes e servicos de terceiros. Falhas externas podem afetar a experiencia.",
  },
];

const DOCUMENTS = {
  privacy: {
    title: "Politica de Privacidade",
    updatedAt: "Atualizado em julho de 2026",
    sections: PRIVACY_SECTIONS,
  },
  terms: {
    title: "Termos de Servico",
    updatedAt: "Atualizado em julho de 2026",
    sections: TERMS_SECTIONS,
  },
};

const LegalDocumentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const type = route.params?.type || "privacy";
  const document = DOCUMENTS[type] || DOCUMENTS.privacy;

  return (
    <View style={styles.container}>
      <Animated.View
        style={styles.header}
        entering={FadeInDown.delay(0).springify().damping(28).stiffness(180)}
      >
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={scale(22)} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{document.title}</Text>
        <View style={styles.menuButton} pointerEvents="none" />
      </Animated.View>

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
          Para duvidas ou pedidos relacionados com estes documentos, use o ecrã Contacte-nos/Reclamacoes.
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
  headerTitle: {
    flex: 1,
    marginHorizontal: spacing.md,
    fontSize: scale(16),
    fontWeight: "800",
    color: colors.textPrimary,
    textAlign: "center",
  },
  scrollContent: {
    paddingHorizontal: spacing.xxl,
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
    fontSize: scale(15),
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  sectionBody: {
    fontSize: scale(13),
    color: colors.textSecondary,
    lineHeight: scale(20),
  },
  footerNote: {
    fontSize: scale(12),
    color: colors.textMuted,
    lineHeight: scale(18),
    marginTop: spacing.lg,
  },
});

export default LegalDocumentScreen;
