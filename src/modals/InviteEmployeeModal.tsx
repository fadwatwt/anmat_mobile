import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Check, Copy } from 'lucide-react-native';
import { Modal } from '../components/Modal';
import { useTheme } from '../context/ThemeContext';
import { inviteEmployee } from '../services/employees';
import { font, radii, spacing } from '../theme';
import type { InvitationData } from '../types';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function InviteEmployeeModal({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!email.trim()) return;
    setSending(true);
    setError('');
    try {
      const data = await inviteEmployee(email.trim());
      setInvitation(data);
    } catch (e: any) {
      setError(e?.data?.message || e?.message || 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  const handleCopy = async () => {
    if (invitation?.link) {
      try {
        await navigator.clipboard.writeText(invitation.link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setInvitation(null);
    setCopied(false);
    onClose();
  };

  return (
    <Modal visible={visible} onClose={handleClose} title="Invite New Employee" size="sm">
      {!invitation ? (
        <View style={s.form}>
          {error ? <Text style={s.error}>{error}</Text> : null}
          <Text style={[s.label, { color: colors.ink }]}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter employee email"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.ink }]}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={sending || !email.trim()}
            style={[s.btn, { backgroundColor: colors.primary }, (sending || !email.trim()) && s.btnDisabled]}
          >
            <Text style={s.btnText}>{sending ? 'Sending...' : 'Invite'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.success}>
          <View style={s.iconWrap}>
            <View style={s.checkCircle}><Check size={36} color="#10B981" strokeWidth={2.5} /></View>
          </View>
          <Text style={s.successTitle}>Invitation Sent Successfully</Text>
          <Text style={s.successEmail}>{invitation.email}</Text>
          {invitation.organization?.name && (
            <Text style={s.orgName}>Organization: {invitation.organization.name}</Text>
          )}
          <View style={s.linkBox}>
            <Text style={s.linkLabel}>Registration URL</Text>
            <View style={s.linkRow}>
              <View style={[s.linkDisplay, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[s.linkText, { color: colors.ink }]} numberOfLines={1}>{invitation.link}</Text>
              </View>
              <TouchableOpacity onPress={handleCopy} style={[s.copyBtn, { backgroundColor: copied ? '#10B981' : colors.primary }]}>
                {copied ? <Check size={18} color="#FFF" /> : <Copy size={18} color="#FFF" />}
                <Text style={s.copyText}>{copied ? 'Copied!' : 'Copy URL'}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity onPress={handleClose} style={[s.btn, { backgroundColor: colors.primary }]}>
            <Text style={s.btnText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
    </Modal>
  );
}

const s = StyleSheet.create({
  form: { gap: spacing.md },
  error: { color: '#EF4444', fontSize: font.sizes.sm, backgroundColor: '#FEF2F2', padding: spacing.sm, borderRadius: radii.lg },
  label: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  input: { borderWidth: 1, borderRadius: radii.lg, paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: font.sizes.sm },
  btn: { paddingVertical: 12, borderRadius: radii.lg, alignItems: 'center', marginTop: spacing.sm },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#FFF', fontSize: font.sizes.sm, fontWeight: font.weights.bold },
  success: { gap: spacing.md, alignItems: 'center' },
  iconWrap: { alignItems: 'center', paddingTop: spacing.md },
  checkCircle: { backgroundColor: '#D1FAE5', borderRadius: 40, padding: spacing.sm },
  successTitle: { fontSize: font.sizes.lg, fontWeight: font.weights.bold, color: '#1F2937', textAlign: 'center' },
  successEmail: { fontSize: font.sizes.base, color: '#375DFB', fontWeight: font.weights.semibold, textAlign: 'center' },
  orgName: { fontSize: font.sizes.sm, color: '#6B7280' },
  linkBox: { width: '100%', gap: spacing.xs },
  linkLabel: { fontSize: font.sizes.sm, fontWeight: font.weights.medium, color: '#374151' },
  linkRow: { flexDirection: 'row', gap: spacing.xs },
  linkDisplay: { flex: 1, borderWidth: 1, borderRadius: radii.lg, padding: spacing.sm, justifyContent: 'center' },
  linkText: { fontSize: font.sizes.xs },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, borderRadius: radii.lg },
  copyText: { color: '#FFF', fontSize: font.sizes.sm, fontWeight: font.weights.medium },
});
