import React, { useRef, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { AppText as Text } from './AppText';
import { AppPressable as TouchableOpacity } from './AppPressable';

import Icon from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavBarPad } from '../map/useMeasuredSheet';
import { typography, colors, spacing, borderRadius } from '../../theme';

const money = value => Number(value || 0).toLocaleString('pt-AO') + ' Kz';
const clock = date => date.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' });
const sentenceCase = value => value ? value.charAt(0).toUpperCase() + value.slice(1) : '';

export default function ScheduledTowDetails({ job, visible, onClose, statusLabel, statusHint,
  actionLabel, onAction, destructiveLabel, onDestructive, busy = false,
  confirmText = 'Esta acção retira a sua reserva deste agendamento.', keepLabel = 'Manter reserva', confirmLabel }) {
  const insets = useSafeAreaInsets();
  const navBarPad = useNavBarPad();
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const pendingRef = useRef(false);
  if (!job) return null;
  const date = new Date(job.scheduledFor);
  const dispatch = new Date(date.getTime() - 45 * 60000);
  const vehicle = job.user_car_details;
  const driver = job.claimedBy?.details;
  const overdue = job.status === 'scheduled' && date.getTime() <= Date.now();
  const dateLabel = sentenceCase(date.toLocaleDateString('pt-AO', { weekday: 'long', day: 'numeric', month: 'long' }));
  const calendarDay = String(date.getDate()).padStart(2, '0');
  const calendarMonth = date.toLocaleDateString('pt-AO', { month: 'short' }).replace('.', '').toUpperCase();
  // The driver was asked to confirm and hasn't yet (released 2h before if not).
  const awaitingConfirmation = job.claimedBy && job.confirmRequestedAt && !job.confirmedAt;
  const resolvedStatusLabel = statusLabel || (overdue ? 'A aguardar actualização' : awaitingConfirmation ? 'A aguardar confirmação do motorista' : job.claimedBy ? 'Confirmado por um motorista' : 'À procura de motorista');
  const resolvedStatusHint = statusHint || (overdue ? 'A hora prevista já passou. Estamos a verificar o estado do seu reboque.' : awaitingConfirmation ? 'Pedimos ao motorista que confirme. Se não confirmar até 2 horas antes, procuramos outro motorista.' : job.claimedBy ? 'O motorista recebe o pedido 45 minutos antes e sai para chegar a horas.' : 'Está tudo guardado. Assim que um motorista reservar, o estado muda para confirmado.');
  const run = async action => {
    if (pendingRef.current || busy) return;
    pendingRef.current = true;
    setPending(true);
    try { setErrorMessage(''); await action?.(); }
    catch (error) { setErrorMessage('O estado do reboque pode ter mudado. Actualize os detalhes e tente novamente.'); }
    finally { pendingRef.current = false; setPending(false); }
  };
  const confirm = () => setConfirming(true);
  const cancelConfirm = () => setConfirming(false);
  const working = busy || pending;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fechar detalhes" />
        {/* The bar is 43dp and EMUI reports a zero inset, so the old
            Math.max(insets.bottom, spacing.lg) left 16dp and the cancel action
            sat flush against it. useNavBarPad clears the bar, then spacing.lg
            is the breathing room. */}
        <View style={[styles.sheet, { paddingBottom: navBarPad + spacing.lg, marginTop: insets.top + spacing.lg }]} accessibilityViewIsModal>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>REBOQUE AGENDADO</Text>
              <Text style={styles.headerTitle}>Detalhes da viagem</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel="Fechar detalhes">
              <Icon name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.scheduleHero}>
              <View style={styles.calendarTile}>
                <Text style={styles.calendarDay}>{calendarDay}</Text>
                <Text style={styles.calendarMonth}>{calendarMonth}</Text>
              </View>
              <View style={styles.heroCopy}>
                <Text style={styles.date}>{dateLabel}</Text>
                <Text style={styles.time}>{clock(date)}</Text>
                <View style={styles.confirmedPill}>
                  <Icon name="check-circle" size={15} color={colors.primaryDark} />
                  <Text style={styles.confirmedText}>{resolvedStatusLabel}</Text>
                </View>
              </View>
            </View>
            <View style={styles.status}>
              <View style={styles.statusIcon}>
                <Icon name={job.status === 'cancelled' ? 'info-outline' : 'notifications-none'} size={21} color={colors.primaryDark} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.statusTitle}>Estado do agendamento</Text>
                <Text style={styles.body}>{resolvedStatusHint}</Text>
              </View>
            </View>
            <View style={styles.block}>
              <View style={styles.sectionHeading}>
                <Icon name="route" size={20} color={colors.textPrimary} />
                <Text style={styles.sectionTitle}>Percurso da viagem</Text>
              </View>
              <View style={styles.routeCard}>
                {(job.locations || []).map((location, index) => (
                  <View style={styles.routeRow} key={index}>
                    <View style={styles.routeRail}>
                      <View style={[styles.routeMarker, index > 0 && styles.destinationMarker]}>
                        <View style={[styles.routeMarkerCore, index > 0 && styles.destinationMarkerCore]} />
                      </View>
                      {index < job.locations.length - 1 && <View style={styles.line} />}
                    </View>
                    <View style={[styles.routeCopy, index < job.locations.length - 1 && styles.routeDivider]}>
                      <Text style={styles.label}>{index === 0 ? 'RECOLHA' : 'DESTINO'}</Text>
                      <Text style={styles.address}>{location.name || 'Local por confirmar'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.facts}>
              <View style={styles.factCard}>
                <View style={styles.factIcon}><Icon name="payments" size={19} color={colors.primaryDark} /></View>
                <Text style={styles.label}>VALOR PREVISTO</Text>
                <Text style={styles.price}>{money(job.payment?.value)}</Text>
              </View>
              <View style={styles.factCard}>
                <View style={styles.factIcon}><Icon name="account-balance-wallet" size={19} color={colors.primaryDark} /></View>
                <Text style={styles.label}>PAGAMENTO</Text>
                <Text style={styles.fact}>{job.payment?.method || 'Por confirmar'}</Text>
              </View>
            </View>
            <View style={styles.detailCard}>
              <View style={styles.detailIcon}><Icon name="directions-car" size={22} color={colors.primaryDark} /></View>
              <View style={styles.flex}>
                <Text style={styles.label}>VEÍCULO A REBOCAR</Text>
                <Text style={styles.detailValue}>{typeof vehicle === 'string' && vehicle ? vehicle : job.type_car || 'Por confirmar'}</Text>
              </View>
            </View>
            {driver && <View style={styles.detailCard}>
              <View style={styles.detailIcon}><Icon name="person-outline" size={22} color={colors.primaryDark} /></View>
              <View style={styles.flex}><Text style={styles.label}>MOTORISTA DA RESERVA</Text><Text style={styles.detailValue}>{[driver.name, driver.surname].filter(Boolean).join(' ') || 'Motorista'}</Text></View>
            </View>}
            {job.status === 'scheduled' && <View style={styles.block}>
              <View style={styles.sectionHeading}>
                <Icon name="schedule" size={20} color={colors.textPrimary} />
                <Text style={styles.sectionTitle}>Como vai funcionar</Text>
              </View>
              <View style={styles.timeline}>
                <View style={styles.timelineRow}>
                  <View style={styles.timelineTime}><Text style={styles.timelineTimeText}>{clock(dispatch)}</Text></View>
                  <View style={styles.timelineRail}><View style={styles.timelineDot} /><View style={styles.timelineLine} /></View>
                  <View style={styles.timelineCopy}><Text style={styles.timelineTitle}>O motorista sai</Text><Text style={styles.note}>45 minutos antes, o pedido segue para o motorista que reservou. Se ninguém reservou, procuramos um motorista disponível.</Text></View>
                </View>
                <View style={styles.timelineRow}>
                  <View style={styles.timelineTime}><Text style={styles.timelineTimeText}>{clock(date)}</Text></View>
                  <View style={styles.timelineRail}><View style={[styles.timelineDot, styles.timelineDotFinal]} /></View>
                  <View style={styles.timelineCopy}><Text style={styles.timelineTitle}>Recolha prevista</Text><Text style={styles.note}>Tenha o veículo acessível alguns minutos antes.</Text></View>
                </View>
              </View>
            </View>}
          </ScrollView>
          {errorMessage ? <View style={styles.errorBanner}><Icon name="error-outline" size={18} color={colors.error} /><Text style={styles.errorText}>{errorMessage}</Text><TouchableOpacity onPress={() => setErrorMessage('')}><Icon name="close" size={18} color={colors.error} /></TouchableOpacity></View> : null}
          {confirming && destructiveLabel ? <View style={styles.confirmPanel}>
            <Text style={styles.confirmTitle}>{destructiveLabel}?</Text>
            <Text style={styles.confirmText}>{confirmText}</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.confirmCancel} onPress={cancelConfirm} disabled={working}><Text style={styles.confirmCancelText}>{keepLabel}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.confirmProceed} onPress={() => { setConfirming(false); run(onDestructive); }} disabled={working}><Text style={styles.confirmProceedText} numberOfLines={1}>{confirmLabel || destructiveLabel}</Text></TouchableOpacity>
            </View>
          </View> : null}
          <View style={styles.footer}>
            <TouchableOpacity accessibilityRole="button" disabled={working} style={[styles.primary, working && styles.disabled]} onPress={() => onAction ? run(onAction) : onClose()}>
              {working ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryText}>{actionLabel || 'Entendido'}</Text>}
            </TouchableOpacity>
            {destructiveLabel && !confirming && <TouchableOpacity accessibilityRole="button" disabled={working} onPress={confirm} style={styles.secondary}><Text style={styles.destructive}>{destructiveLabel}</Text></TouchableOpacity>}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: { maxHeight: '94%', backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xxl, borderTopRightRadius: borderRadius.xxl },
  handle: { width: 36, height: 4, borderRadius: borderRadius.sm, backgroundColor: colors.borderLight, alignSelf: 'center', marginTop: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: spacing.xxl, paddingRight: spacing.md, paddingBottom: spacing.md },
  eyebrow: { fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight, letterSpacing: 1.4, fontWeight: '700', color: colors.textSecondary },
  headerTitle: { fontSize: typography.h3.fontSize, lineHeight: typography.h3.lineHeight, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.xs },
  close: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.xxl, paddingBottom: spacing.xl, gap: spacing.lg },
  scheduleHero: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.lg, borderRadius: borderRadius.xxl, backgroundColor: colors.primaryDark },
  calendarTile: { width: 62, height: 68, borderRadius: borderRadius.lg, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  calendarDay: { fontSize: typography.h1.fontSize, lineHeight: 32, fontWeight: '700', color: colors.primaryDark, fontVariant: ['tabular-nums'] },
  calendarMonth: { fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight, fontWeight: '700', letterSpacing: 1, color: colors.textSecondary },
  heroCopy: { flex: 1, alignItems: 'flex-start' },
  time: { ...typography.h1, color: colors.surface, fontVariant: ['tabular-nums'] },
  date: { fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight, color: colors.surfaceTint82, marginBottom: spacing.xs },
  confirmedPill: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderRadius: borderRadius.full, backgroundColor: colors.surface, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, marginTop: spacing.sm, alignSelf: 'flex-start' },
  confirmedText: { flexShrink: 1, fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight, fontWeight: '700', color: colors.primaryDark },
  status: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, backgroundColor: colors.primaryLight, borderRadius: borderRadius.xl },
  statusIcon: { width: 40, height: 40, borderRadius: borderRadius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  statusTitle: { fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight, fontWeight: '700', color: colors.primaryDark, marginBottom: spacing.xs },
  body: { fontSize: typography.bodySmall.fontSize, lineHeight: 20, color: colors.textSecondary },
  flex: { flex: 1 },
  block: { gap: spacing.md },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle: { fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight, fontWeight: '700', color: colors.textPrimary },
  routeCard: { borderRadius: borderRadius.xl, backgroundColor: colors.background, padding: spacing.lg },
  routeRow: { flexDirection: 'row', gap: spacing.md, minHeight: 62 },
  routeRail: { alignItems: 'center', width: 20 },
  routeMarker: { width: 18, height: 18, borderRadius: borderRadius.md, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  routeMarkerCore: { width: 6, height: 6, borderRadius: borderRadius.sm, backgroundColor: colors.primary },
  destinationMarker: { borderRadius: borderRadius.sm, borderColor: colors.textPrimary },
  destinationMarkerCore: { borderRadius: borderRadius.sm, backgroundColor: colors.textPrimary },
  line: { width: 2, flex: 1, minHeight: 25, backgroundColor: colors.borderLight, marginVertical: spacing.xs },
  routeCopy: { flex: 1, gap: spacing.xs, paddingBottom: spacing.md },
  routeDivider: { borderBottomWidth: 1, borderBottomColor: colors.borderLight, marginBottom: spacing.md },
  label: { fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight, letterSpacing: 1, fontWeight: '700', color: colors.textSecondary },
  address: { fontSize: typography.bodySmall.fontSize, lineHeight: 24, color: colors.textPrimary },
  facts: { flexDirection: 'row', gap: spacing.md },
  factCard: { flex: 1, minHeight: 112, borderRadius: borderRadius.xl, backgroundColor: colors.background, padding: spacing.md, justifyContent: 'space-between' },
  factIcon: { width: 34, height: 34, borderRadius: borderRadius.md, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  price: { fontSize: typography.h3.fontSize, lineHeight: typography.h3.lineHeight, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.xs },
  fact: { fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.xs },
  detailCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: borderRadius.xl, backgroundColor: colors.background, padding: spacing.lg },
  detailIcon: { width: 42, height: 42, borderRadius: borderRadius.md, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  detailValue: { fontSize: typography.bodySmall.fontSize, lineHeight: 20, fontWeight: '600', color: colors.textPrimary, marginTop: spacing.xs },
  timeline: { padding: spacing.lg, borderRadius: borderRadius.xl, backgroundColor: colors.background },
  timelineRow: { flexDirection: 'row', minHeight: 66 },
  timelineTime: { width: 49, paddingTop: spacing.xs },
  timelineTimeText: { fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight, fontWeight: '700', color: colors.textPrimary, fontVariant: ['tabular-nums'] },
  timelineRail: { width: 22, alignItems: 'center' },
  timelineDot: { width: 12, height: 12, borderRadius: borderRadius.sm, backgroundColor: colors.surface, borderWidth: 3, borderColor: colors.primary },
  timelineDotFinal: { backgroundColor: colors.primary, borderColor: colors.primary },
  timelineLine: { width: 2, flex: 1, backgroundColor: colors.borderLight, marginVertical: spacing.xs },
  timelineCopy: { flex: 1, paddingBottom: spacing.md },
  timelineTitle: { fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
  note: { fontSize: typography.caption.fontSize, lineHeight: 16, color: colors.textSecondary },
  footer: { paddingHorizontal: spacing.xxl, paddingTop: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.borderLight },
  primary: { minHeight: 50, padding: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight, fontWeight: '700', color: colors.surface },
  secondary: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  destructive: { fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight, fontWeight: '600', color: colors.error },
  disabled: { opacity: 0.6 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.xxl, marginBottom: spacing.sm, padding: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.errorLight },
  errorText: { flex: 1, fontSize: typography.caption.fontSize, lineHeight: 16, color: colors.error },
  confirmPanel: { marginHorizontal: spacing.xxl, marginBottom: spacing.sm, padding: spacing.lg, borderRadius: borderRadius.xl, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.borderLight },
  confirmTitle: { fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight, fontWeight: '700', color: colors.textPrimary },
  confirmText: { marginTop: spacing.xs, fontSize: typography.caption.fontSize, lineHeight: 20, color: colors.textSecondary },
  confirmActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  confirmCancel: { flex: 1, minHeight: 44, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  confirmCancelText: { fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight, fontWeight: '700', color: colors.textSecondary },
  confirmProceed: { flex: 1, minHeight: 44, borderRadius: borderRadius.md, backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center' },
  confirmProceedText: { fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight, fontWeight: '700', color: colors.surface },
});
