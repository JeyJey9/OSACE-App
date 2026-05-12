import React, { useState, useLayoutEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '../../../constants/useThemeColor';
import { useAuth } from '../../Auth/AuthContext';
import { useNavigation } from '@react-navigation/native';
import api from '../../../services/api';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

export default function DataExportScreen() {
  const { colors, isDark } = useThemeColor();
  const { user } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const BLUE = isDark ? '#4A90E2' : '#1566B9';

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 8, padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors.textPrimary]);

  const generatePDF = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/profile/my-data');

      const exportDate = format(new Date(data.exported_at), 'dd MMMM yyyy, HH:mm', { locale: ro });
      const joinDate = format(new Date(data.user.created_at), 'dd MMMM yyyy', { locale: ro });

      const totalHours = [
        ...data.events_attended.filter(e => e.confirmation_status === 'attended'),
        ...data.special_contributions,
      ].reduce((sum, e) => sum + (parseFloat(e.awarded_hours) || 0), 0);

      const eventsRows = data.events_attended.map(e => `
        <tr>
          <td>${e.title}</td>
          <td>${e.category || '—'}</td>
          <td>${e.start_time ? format(new Date(e.start_time), 'dd.MM.yyyy') : '—'}</td>
          <td style="text-align:center">${
            e.confirmation_status === 'attended'
              ? `<span class="badge green">+${parseFloat(e.awarded_hours || 0).toFixed(1)}h</span>`
              : `<span class="badge gray">${e.confirmation_status}</span>`
          }</td>
        </tr>
      `).join('');

      const contribRows = data.special_contributions.map(c => `
        <tr>
          <td>${c.title}</td>
          <td>${c.description || '—'}</td>
          <td>${format(new Date(c.created_at), 'dd.MM.yyyy')}</td>
          <td style="text-align:center"><span class="badge green">+${parseFloat(c.awarded_hours || 0).toFixed(1)}h</span></td>
        </tr>
      `).join('');

      const badgeRows = data.badges.map(b => `
        <tr>
          <td>${b.icon_name || '🏅'} ${b.name}</td>
          <td>${b.description || '—'}</td>
          <td>${format(new Date(b.earned_at), 'dd.MM.yyyy')}</td>
        </tr>
      `).join('');

      const html = `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Export Date Personale OSACE</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; background: #fff; font-size: 13px; }

    /* ─── HEADER ─── */
    .header {
      background: linear-gradient(135deg, #1566B9 0%, #0D3E75 100%);
      color: white; padding: 32px 40px 28px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .header-left h1 { font-size: 28px; font-weight: 900; letter-spacing: 3px; }
    .header-left p { font-size: 12px; opacity: 0.8; margin-top: 4px; letter-spacing: 1px; }
    .header-right { text-align: right; font-size: 11px; opacity: 0.9; line-height: 1.6; }

    /* ─── BODY ─── */
    .body { padding: 32px 40px; }

    /* ─── USER CARD ─── */
    .user-card {
      background: #F0F5FF; border-radius: 14px;
      padding: 20px 24px; margin-bottom: 28px;
      border-left: 5px solid #1566B9;
      display: flex; justify-content: space-between; align-items: center;
    }
    .user-card h2 { font-size: 20px; font-weight: 900; color: #1566B9; }
    .user-card .sub { font-size: 12px; color: #5a6a8a; margin-top: 3px; }
    .user-card .stats { text-align: right; }
    .user-card .hours { font-size: 32px; font-weight: 900; color: #1566B9; line-height: 1; }
    .user-card .hours-label { font-size: 10px; color: #5a6a8a; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }

    /* ─── SECTION ─── */
    .section { margin-bottom: 32px; }
    .section-title {
      font-size: 13px; font-weight: 900; text-transform: uppercase;
      letter-spacing: 1.5px; color: #1566B9;
      border-bottom: 2px solid #1566B9; padding-bottom: 8px; margin-bottom: 14px;
      display: flex; align-items: center; gap: 8px;
    }

    /* ─── TABLE ─── */
    table { width: 100%; border-collapse: collapse; }
    th {
      background: #1566B9; color: white; font-size: 11px;
      text-transform: uppercase; letter-spacing: 0.8px;
      padding: 10px 14px; text-align: left;
    }
    td { padding: 10px 14px; border-bottom: 1px solid #edf2f7; }
    tr:nth-child(even) td { background: #f8faff; }
    tr:last-child td { border-bottom: none; }

    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
    .badge.green { background: #d4f5e2; color: #0d6e39; }
    .badge.gray { background: #e8ecf2; color: #5a6a8a; }

    /* ─── EMPTY ─── */
    .empty { color: #aab; font-style: italic; padding: 12px 0; }

    /* ─── FOOTER ─── */
    .footer {
      margin-top: 40px; padding-top: 16px;
      border-top: 1px solid #edf2f7;
      font-size: 10px; color: #aab; text-align: center; line-height: 1.6;
    }
    .gdpr-notice {
      background: #FFF8E8; border-radius: 10px; border-left: 4px solid #f39c12;
      padding: 14px 18px; margin-bottom: 28px; font-size: 12px; color: #7d5c00; line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>OSACE</h1>
      <p>PLATFORMA VOLUNTARILOR</p>
    </div>
    <div class="header-right">
      <strong>Export Date Personale</strong><br/>
      Generat: ${exportDate}<br/>
      Conform RGPD (UE) 2016/679
    </div>
  </div>

  <div class="body">
    <div class="user-card">
      <div>
        <h2>${data.user.first_name} ${data.user.last_name}</h2>
        <div class="sub">@${data.user.display_name} · ${data.user.email}</div>
        <div class="sub">Rol: ${data.user.role} · Înregistrat: ${joinDate}</div>
        <div class="sub">Status verificare: ${data.user.student_verification_status}</div>
      </div>
      <div class="stats">
        <div class="hours">${totalHours.toFixed(1)}</div>
        <div class="hours-label">ore voluntariat</div>
      </div>
    </div>

    <div class="gdpr-notice">
      📋 <strong>Informare RGPD:</strong> Acest document conține toate datele personale pe care OSACE le deține despre tine,
      conform dreptului de acces (Art. 15 RGPD). Îl poți folosi pentru a verifica corectitudinea datelor.
      Pentru ștergerea contului, accesează <em>osace.ro/app#account-deletion</em>.
    </div>

    <div class="section">
      <div class="section-title">📅 Activități Participare (${data.events_attended.length})</div>
      ${data.events_attended.length > 0 ? `
        <table>
          <thead><tr><th>Activitate</th><th>Categorie</th><th>Data</th><th>Status / Ore</th></tr></thead>
          <tbody>${eventsRows}</tbody>
        </table>
      ` : '<p class="empty">Nicio activitate înregistrată.</p>'}
    </div>

    <div class="section">
      <div class="section-title">⭐ Contribuții Speciale (${data.special_contributions.length})</div>
      ${data.special_contributions.length > 0 ? `
        <table>
          <thead><tr><th>Titlu</th><th>Descriere</th><th>Data</th><th>Ore</th></tr></thead>
          <tbody>${contribRows}</tbody>
        </table>
      ` : '<p class="empty">Nicio contribuție specială.</p>'}
    </div>

    <div class="section">
      <div class="section-title">🏅 Badge-uri (${data.badges.length})</div>
      ${data.badges.length > 0 ? `
        <table>
          <thead><tr><th>Badge</th><th>Descriere</th><th>Acordat</th></tr></thead>
          <tbody>${badgeRows}</tbody>
        </table>
      ` : '<p class="empty">Niciun badge acordat.</p>'}
    </div>

    <div class="footer">
      Document generat automat de platforma OSACE · osace.ro<br/>
      Date exportate conform Regulamentului General privind Protecția Datelor (RGPD/GDPR) — Art. 15<br/>
      Pentru întrebări: contact@osace.ro
    </div>
  </div>
</body>
</html>`;

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const fileName = `OSACE_Date_${data.user.last_name}_${data.user.first_name}_${format(new Date(), 'yyyyMMdd')}.pdf`;

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Export Date Personale OSACE',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Descărcat', `PDF salvat la: ${uri}`);
      }
    } catch (err) {
      console.error('[DataExport] Eroare:', err);
      Alert.alert('Eroare', 'Nu am putut genera PDF-ul. Încearcă din nou.');
    } finally {
      setLoading(false);
    }
  };

  const s = createStyles(colors, isDark, insets, BLUE);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={s.hero}>
        <View style={s.heroIcon}>
          <Ionicons name="document-text" size={40} color={BLUE} />
        </View>
        <Text style={s.heroTitle}>Exportul Datelor Tale</Text>
        <Text style={s.heroSub}>
          Conform RGPD (Art. 15), ai dreptul să accesezi toate datele personale pe care OSACE le deține despre tine.
        </Text>
      </View>

      {/* What's included */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Ce conține PDF-ul</Text>
        {[
          ['person-outline', 'Datele contului tău (nume, email, rol)'],
          ['calendar-outline', 'Toate activitățile la care ai participat'],
          ['star-outline', 'Contribuțiile speciale acordate'],
          ['ribbon-outline', 'Badge-urile câștigate'],
          ['time-outline', 'Total ore de voluntariat acumulate'],
        ].map(([icon, label]) => (
          <View key={icon} style={s.featureRow}>
            <View style={s.featureIcon}>
              <Ionicons name={icon} size={18} color={BLUE} />
            </View>
            <Text style={s.featureText}>{label}</Text>
          </View>
        ))}
      </View>

      {/* GDPR notice */}
      <View style={s.gdprCard}>
        <Ionicons name="shield-checkmark-outline" size={20} color="#f39c12" />
        <Text style={s.gdprText}>
          PDF-ul este generat în timp real din datele tale actuale și conține o marcă temporală pentru a dovedi autenticitatea.
        </Text>
      </View>

      {/* Generate button */}
      <TouchableOpacity
        style={[s.btn, { backgroundColor: BLUE, shadowColor: BLUE }, loading && { opacity: 0.7 }]}
        onPress={generatePDF}
        disabled={loading}
      >
        {loading ? (
          <>
            <ActivityIndicator color="white" />
            <Text style={s.btnText}>Se generează PDF...</Text>
          </>
        ) : (
          <>
            <Ionicons name="download-outline" size={22} color="white" />
            <Text style={s.btnText}>Generează & Descarcă PDF</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={s.legalNote}>
        Drept garantat de Regulamentul (UE) 2016/679 (RGPD), Art. 15 — Dreptul de acces.{'\n'}
        Pentru ștergerea contului:{' '}
        <Text style={{ color: BLUE, fontWeight: '700' }}>Profil → Setări cont → Șterge cont</Text>
      </Text>
    </ScrollView>
  );
}

const createStyles = (colors, isDark, insets, BLUE) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: insets.bottom + 40 },
  hero: { alignItems: 'center', paddingVertical: 28, gap: 12 },
  heroIcon: {
    width: 88, height: 88, borderRadius: 28,
    backgroundColor: BLUE + '15', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: BLUE + '30',
  },
  heroTitle: { fontSize: 24, fontWeight: '900', color: colors.textPrimary, textAlign: 'center' },
  heroSub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 8 },
  card: {
    backgroundColor: colors.card, borderRadius: 20, padding: 20,
    marginBottom: 16, gap: 14,
    borderWidth: isDark ? 1 : 0, borderColor: 'rgba(255,255,255,0.07)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.2 : 0.06, shadowRadius: 10, elevation: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: BLUE + '15', justifyContent: 'center', alignItems: 'center',
  },
  featureText: { fontSize: 14, color: colors.textSecondary, flex: 1, lineHeight: 20 },
  gdprCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: isDark ? 'rgba(243,156,18,0.12)' : '#FEF9E7',
    borderRadius: 14, padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(243,156,18,0.3)',
  },
  gdprText: { flex: 1, fontSize: 13, color: isDark ? '#f0c070' : '#7D5C00', lineHeight: 20 },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, height: 58, borderRadius: 18,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
    marginBottom: 20,
  },
  btnText: { color: 'white', fontSize: 16, fontWeight: '800' },
  legalNote: { fontSize: 11.5, color: colors.textSecondary, textAlign: 'center', lineHeight: 18 },
});
