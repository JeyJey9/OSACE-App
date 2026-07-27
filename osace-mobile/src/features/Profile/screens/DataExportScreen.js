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
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
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
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          activeOpacity={0.7}
          style={{ 
            paddingHorizontal: 8,
            paddingVertical: 4,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors.textPrimary]);

  const generatePDF = async () => {
    setLoading(true);
    try {
      // Load logo as base64 so expo-print can embed it
      const asset = Asset.fromModule(require('../../../assets/osace.png'));
      await asset.downloadAsync();
      const logoBase64 = await FileSystem.readAsStringAsync(asset.localUri, {
        encoding: 'base64',
      });
      const logoSrc = `data:image/png;base64,${logoBase64}`;

      const { data } = await api.get('/api/profile/my-data');

      const exportDate = format(new Date(data.exported_at.replace(' ', 'T')), 'dd.MM.yyyy', { locale: ro });
      const joinDate = format(new Date(data.user.created_at.replace(' ', 'T')), 'dd.MM.yyyy', { locale: ro });

      const totalHours = [
        ...data.events_attended.filter(e => e.confirmation_status === 'attended'),
        ...data.special_contributions,
      ].reduce((sum, e) => sum + (parseFloat(e.awarded_hours) || 0), 0);

      const eventsRows = data.events_attended.map(e => `
        <tr>
          <td><strong>${e.title}</strong></td>
          <td style="text-transform:capitalize">${e.category || '—'}</td>
          <td>${e.start_time ? format(new Date(e.start_time.replace(' ', 'T')), 'dd.MM.yyyy') : '—'}</td>
          <td style="text-align:center">${e.confirmation_status === 'attended'
          ? `<span class="pill green">+${parseFloat(e.awarded_hours || 0).toFixed(1)}h</span>`
          : `<span class="pill gray">${e.confirmation_status}</span>`
        }</td>
        </tr>
      `).join('');

      const contribRows = data.special_contributions.map(c => `
        <tr>
          <td><strong>${c.title}</strong></td>
          <td>${c.description || '—'}</td>
          <td>${format(new Date(c.created_at.replace(' ', 'T')), 'dd.MM.yyyy')}</td>
          <td style="text-align:center"><span class="pill green">+${parseFloat(c.awarded_hours || 0).toFixed(1)}h</span></td>
        </tr>
      `).join('');

      const badgeRows = data.badges.map(b => `
        <tr>
          <td><strong>${b.name}</strong></td>
          <td>${b.description || '—'}</td>
          <td>${format(new Date(b.earned_at.replace(' ', 'T')), 'dd.MM.yyyy')}</td>
        </tr>
      `).join('');

      const html = `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8"/>
  <title>Export Date Personale OSACE</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11pt;
      color: #222;
      background: #fff;
      padding: 1.8cm 2cm;
    }

    /* ── HEADER OFICIAL OSACE ── */
    .org-title {
      text-align: center;
      font-size: 10.5pt;
      font-weight: bold;
      text-transform: uppercase;
      line-height: 1.4;
      margin-bottom: 14px;
      color: #111;
    }

    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }

    .header-table td {
      border: none;
      padding: 0;
      vertical-align: middle;
      background: transparent !important;
    }

    .col-left {
      width: 32%;
      font-size: 8.5pt;
      line-height: 1.6;
      color: #333;
    }

    .col-center {
      width: 36%;
      text-align: center;
    }

    .col-center img {
      width: 140px;
      height: auto;
    }

    .col-right {
      width: 32%;
      font-size: 8.5pt;
      line-height: 1.6;
      text-align: right;
      color: #333;
    }

    .col-right a { color: #1566B9; text-decoration: none; }

    .header-divider-thick {
      border: none;
      border-top: 2.5px solid #111;
      margin: 10px 0 3px 0;
    }

    .header-divider-thin {
      border: none;
      border-top: 1px solid #111;
      margin: 0 0 16px 0;
    }

    /* ── DOCUMENT METADATA ── */
    .doc-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 22px;
      font-size: 10pt;
    }

    .doc-nr { font-weight: bold; }

    /* ── TITLE ── */
    .doc-title {
      text-align: center;
      font-size: 16pt;
      font-weight: bold;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 4px;
      color: #1566B9;
    }

    .doc-subtitle {
      text-align: center;
      font-size: 9pt;
      color: #666;
      margin-bottom: 22px;
    }

    /* ── RGPD BOX ── */
    .rgpd-box {
      border: 1px solid #dcdcdc;
      border-left: 4px solid #1566B9;
      padding: 10px 14px;
      margin-bottom: 22px;
      font-size: 9pt;
      line-height: 1.5;
      background: #f8fafc;
      border-radius: 4px;
    }

    /* ── VOLUNTEER CARD ── */
    .volunteer-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
    }

    .volunteer-card .info { line-height: 1.8; font-size: 10pt; }
    .volunteer-card .info .name { font-size: 13pt; font-weight: bold; color: #111; }
    .volunteer-card .info .sub { font-size: 9pt; color: #555; }
    .volunteer-card .totals { text-align: right; }
    .volunteer-card .totals .hours-num { font-size: 26pt; font-weight: bold; line-height: 1; color: #1566B9; }
    .volunteer-card .totals .hours-lbl { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.5px; color: #666; margin-top: 2px; }

    /* ── SECTION ── */
    .section { margin-bottom: 24px; }
    .section-title {
      font-size: 10pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #1566B9;
      padding-bottom: 4px;
      margin-bottom: 10px;
      color: #1566B9;
    }

    /* ── TABLE ── */
    table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-top: 0; }
    th {
      border: 1px solid #cbd5e1;
      padding: 7px 10px;
      background: #f1f5f9;
      color: #334155;
      text-align: left;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td { border: 1px solid #cbd5e1; padding: 7px 10px; color: #334155; }
    tr:nth-child(even) td { background: #f8fafc; }

    .pill { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 8pt; font-weight: bold; }
    .pill.green { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .pill.gray  { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

    .empty-note { font-style: italic; color: #94a3b8; font-size: 9pt; padding: 6px 0; }

    /* ── SIGNATURE BLOCK ── */
    .sig-block {
      margin-top: 45px;
      display: flex;
      justify-content: flex-end;
    }

    .sig-inner {
      text-align: center;
      width: 220px;
      font-size: 10pt;
      line-height: 1.6;
    }

    .sig-inner .sig-role { font-weight: bold; color: #111; }
    .sig-inner .sig-name { font-size: 10pt; font-weight: 600; margin-top: 2px; }
    .sig-inner .sig-line {
      border-top: 1px solid #111;
      margin-top: 45px;
      padding-top: 4px;
      font-size: 8.5pt;
      color: #555;
    }

    /* ── FOOTER ── */
    .footer {
      margin-top: 30px;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      font-size: 8pt;
      color: #64748b;
      text-align: center;
      line-height: 1.6;
    }

    @page {
      size: A4;
      margin: 1.5cm;
    }

    .volunteer-card, .rgpd-box, .sig-block, .section-title, tr {
      page-break-inside: avoid;
    }
  </style>
</head>
<body>

  <!-- TITLE HEADER -->
  <div class="org-title">
    ORGANIZAȚIA STUDENȚILOR DIN FACULTATEA DE AUTOMATICĂ, CALCULATOARE ȘI ELECTRONICĂ (O.S.A.C.E.)
  </div>

  <!-- THREE COLUMN HEADER -->
  <table class="header-table">
    <tr>
      <td class="col-left">
        B-dul. Decebal Nr. 107<br/>
        CRAIOVA 200440<br/>
        DOLJ, ROMÂNIA
      </td>
      <td class="col-center">
        <img src="${logoSrc}" alt="OSACE Logo" />
      </td>
      <td class="col-right">
        Tel: +4-0773-365-903<br/>
        Fax: +4-0251-438-198<br/>
        contact@osace.ro<br/>
        www.osace.ro
      </td>
    </tr>
  </table>

  <hr class="header-divider-thick"/>
  <hr class="header-divider-thin"/>

  <!-- DOCUMENT METADATA -->
  <div class="doc-meta">
    <div class="doc-nr">Nr. ________ / ${exportDate}</div>
    <div>Craiova, România</div>
  </div>

  <!-- DOCUMENT TITLE -->
  <div class="doc-title">EXPORT DATE PERSONALE</div>
  <div class="doc-subtitle">Conform Regulamentului (UE) 2016/679 (RGPD), Art. 15 — Dreptul de Acces</div>

  <!-- RGPD NOTICE -->
  <div class="rgpd-box">
    <strong>Informare RGPD:</strong> Acest document conține toate datele personale pe care O.S.A.C.E. le deține despre
    membrul menționat mai jos. Documentul este extras în mod securizat din baza de date oficială a organizației.
  </div>

  <!-- VOLUNTEER INFO CARD -->
  <div class="volunteer-card">
    <div class="info">
      <div class="name">${data.user.first_name || ''} ${data.user.last_name || ''}</div>
      <div class="sub">Utilizator: @${data.user.display_name} &nbsp;·&nbsp; Email: ${data.user.email}</div>
      <div class="sub">Rol: ${data.user.role?.toUpperCase()} &nbsp;·&nbsp; Membru din: ${joinDate}</div>
      <div class="sub">Status verificare student: ${data.user.student_verification_status || 'N/A'}</div>
    </div>
    <div class="totals">
      <div class="hours-num">${totalHours.toFixed(1)}</div>
      <div class="hours-lbl">ore voluntariat total</div>
    </div>
  </div>

  <!-- EVENTS SECTION -->
  <div class="section">
    <div class="section-title">I. Activități de Voluntariat (${data.events_attended.length})</div>
    ${data.events_attended.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Denumire Activitate</th>
            <th>Categorie</th>
            <th>Data</th>
            <th style="text-align:center">Status / Ore</th>
          </tr>
        </thead>
        <tbody>${eventsRows}</tbody>
      </table>
    ` : '<p class="empty-note">Nicio activitate înregistrată.</p>'}
  </div>

  <!-- CONTRIBUTIONS SECTION -->
  <div class="section">
    <div class="section-title">II. Contribuții Speciale (${data.special_contributions.length})</div>
    ${data.special_contributions.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Titlu</th>
            <th>Descriere</th>
            <th>Data</th>
            <th style="text-align:center">Ore</th>
          </tr>
        </thead>
        <tbody>${contribRows}</tbody>
      </table>
    ` : '<p class="empty-note">Nicio contribuție specială acordată.</p>'}
  </div>

  <!-- BADGES SECTION -->
  <div class="section">
    <div class="section-title">III. Realizări (Badge-uri) (${data.badges.length})</div>
    ${data.badges.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Denumire Badge</th>
            <th>Descriere</th>
            <th>Data Acordării</th>
          </tr>
        </thead>
        <tbody>${badgeRows}</tbody>
      </table>
    ` : '<p class="empty-note">Niciun badge acordat.</p>'}
  </div>

  <!-- SIGNATURE BLOCK -->
  <div class="sig-block">
    <div class="sig-inner">
      <div class="sig-role">Președinte O.S.A.C.E.,</div>
      <div class="sig-name">Rădoi Constantin-Mihai</div>
      <div class="sig-line">Semnătură și Ștampilă</div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    Document generat automat de aplicația OSACE &nbsp;·&nbsp; www.osace.ro<br/>
    CUI: 14277339 &nbsp;·&nbsp; B-dul. Decebal Nr. 107, Craiova, Dolj
  </div>

</body>
</html>`;

      const { uri } = await Print.printToFileAsync({ html, base64: false });

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
