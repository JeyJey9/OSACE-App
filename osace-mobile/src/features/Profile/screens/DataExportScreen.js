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
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 8, padding: 4 }}>
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

      const exportDate = format(new Date(data.exported_at), 'dd MMMM yyyy, HH:mm', { locale: ro });
      const joinDate = format(new Date(data.user.created_at), 'dd MMMM yyyy', { locale: ro });

      const totalHours = [
        ...data.events_attended.filter(e => e.confirmation_status === 'attended'),
        ...data.special_contributions,
      ].reduce((sum, e) => sum + (parseFloat(e.awarded_hours) || 0), 0);

      const attendedEvents = data.events_attended.filter(e => e.confirmation_status === 'attended');

      const eventsRows = data.events_attended.map(e => `
        <tr>
          <td>${e.title}</td>
          <td style="text-transform:capitalize">${e.category || '—'}</td>
          <td>${e.start_time ? format(new Date(e.start_time), 'dd.MM.yyyy') : '—'}</td>
          <td style="text-align:center">${e.confirmation_status === 'attended'
          ? `<span class="pill green">+${parseFloat(e.awarded_hours || 0).toFixed(1)}h</span>`
          : `<span class="pill gray">${e.confirmation_status}</span>`
        }</td>
        </tr>
      `).join('');

      const contribRows = data.special_contributions.map(c => `
        <tr>
          <td>${c.title}</td>
          <td>${c.description || '—'}</td>
          <td>${format(new Date(c.created_at), 'dd.MM.yyyy')}</td>
          <td style="text-align:center"><span class="pill green">+${parseFloat(c.awarded_hours || 0).toFixed(1)}h</span></td>
        </tr>
      `).join('');

      const badgeRows = data.badges.map(b => `
        <tr>
          <td><strong>${b.name}</strong></td>
          <td>${b.description || '—'}</td>
          <td>${format(new Date(b.earned_at), 'dd.MM.yyyy')}</td>
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
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      color: #000;
      background: #fff;
      padding: 2cm 2.2cm;
    }

    /* ── HEADER ── */
    .org-name {
      text-align: center;
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      line-height: 1.5;
      margin-bottom: 12px;
    }

    .header-cols {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .col-address {
      font-size: 9pt;
      line-height: 1.8;
      width: 33%;
    }

    .col-logo {
      width: 33%;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    /* SVG Shield Logo */
    .shield {
      width: 200px;
      height: 100px;
    }

    .col-contact {
      font-size: 9pt;
      line-height: 1.8;
      width: 33%;
      text-align: right;
    }
    .col-contact a, .col-contact .link { color: #0000EE; text-decoration: underline; }

    .header-divider {
      border: none;
      border-top: 2px solid #000;
      margin: 8px 0 4px;
    }
    .header-divider-thin {
      border: none;
      border-top: 1px solid #000;
      margin: 3px 0 16px;
    }

    /* ── DOC META ── */
    .doc-meta {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .doc-nr { font-size: 11pt; }
    .doc-nr span { font-size: 9pt; color: #555; }

    /* ── TITLE ── */
    .doc-title {
      text-align: center;
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 6px;
    }
    .doc-subtitle {
      text-align: center;
      font-size: 9.5pt;
      color: #555;
      margin-bottom: 24px;
    }

    /* ── RGPD NOTICE ── */
    .rgpd-box {
      border: 1px solid #bbb;
      border-left: 4px solid #555;
      padding: 10px 14px;
      margin-bottom: 22px;
      font-size: 9.5pt;
      line-height: 1.6;
      background: #fafafa;
    }

    /* ── VOLUNTEER CARD ── */
    .volunteer-card {
      border: 1px solid #ccc;
      padding: 14px 18px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .volunteer-card .info { line-height: 1.9; font-size: 11pt; }
    .volunteer-card .info .name { font-size: 14pt; font-weight: bold; }
    .volunteer-card .info .sub { font-size: 9.5pt; color: #444; }
    .volunteer-card .totals { text-align: right; }
    .volunteer-card .totals .hours-num { font-size: 28pt; font-weight: bold; line-height: 1; }
    .volunteer-card .totals .hours-lbl { font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.5px; color: #555; margin-top: 2px; }

    /* ── SECTION ── */
    .section { margin-bottom: 26px; page-break-inside: auto; }
    .section-title {
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1.5px solid #000;
      padding-bottom: 5px;
      margin-bottom: 10px;
      page-break-after: avoid;
      break-after: avoid;
    }

    /* ── TABLE ── */
    table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-top: 0; }
    thead {
      display: table-header-group; /* repeats header on each new page */
    }
    thead tr th {
      border-top: 2px solid #000; /* visible top border when thead repeats on a new page */
    }
    th {
      border: 1px solid #000;
      padding: 6px 10px;
      background: #000;
      color: #fff;
      text-align: left;
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td { border: 1px solid #aaa; padding: 6px 10px; }
    tr:nth-child(even) td { background: #f6f6f6; }

    .pill { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 8.5pt; font-weight: bold; }
    .pill.green { background: #d4f5e2; color: #0d6e39; border: 1px solid #9adbb9; }
    .pill.gray  { background: #e8ecf2; color: #5a6a8a; border: 1px solid #c5ccda; }

    .empty-note { font-style: italic; color: #777; font-size: 10pt; padding: 6px 0; }

    /* ── SIGNATURE BLOCK ── */
    .sig-block {
      margin-top: 80px; /* Increased to push it down further */
      display: flex;
      justify-content: flex-end;
    }
    .sig-inner {
      text-align: center;
      width: 220px;
      font-size: 11pt;
      line-height: 1.8;
    }
    .sig-inner .sig-role { font-weight: bold; }
    .sig-inner .sig-stamp {
      width: 100px; height: 100px;
      border: 2px dashed #aaa;
      border-radius: 50%;
      margin: 16px auto 0;
      display: flex; align-items: center; justify-content: center;
      color: #aaa; font-size: 8pt; font-style: italic;
    }
    .sig-inner .sig-line {
      border-top: 1px solid #000;
      margin-top: 50px;
      padding-top: 4px;
      font-size: 9.5pt;
    }

    /* ── FOOTER ── */
    .footer {
      margin-top: 30px;
      border-top: 1px solid #ccc;
      padding-top: 8px;
      font-size: 8.5pt;
      color: #777;
      text-align: center;
      line-height: 1.7;
    }

    /* ── PAGE BREAK / PRINT ── */
    @page {
      size: A4;
      margin-top: 1.5cm;
      margin-bottom: 1.5cm;
      margin-left: 0;
      margin-right: 0;
    }

    /* Don't break inside these blocks */
    .volunteer-card,
    .rgpd-box,
    .sig-block,
    .section-title,
    .empty-note {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Section title must always stay with its first table row */
    .section-title {
      page-break-after: avoid;
      break-after: avoid;
    }

    /* Table rows never split across pages */
    tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Table header repeats on each new page automatically */
    thead {
      display: table-header-group;
    }

    /* Push each major section to start cleanly — no orphan titles */
    .section {
      page-break-inside: auto;
      break-inside: auto;
    }

    /* Signature block always stays together on whatever page it ends up on */
    .sig-block {
      page-break-before: auto;
      break-before: auto;
    }

    /* Footer stays with signature */
    .footer {
      page-break-inside: avoid;
      break-inside: avoid;
    }
  </style>
</head>
<body>

  <!-- ORG NAME -->
  <div class="org-name">
    Organizația Studenților din Facultatea de<br/>
    Automatică, Calculatoare și Electronică (O.S.A.C.E.)
  </div>

  <!-- THREE-COLUMN HEADER -->
  <div class="header-cols">
    <div class="col-address">
      B-dul. Decebal Nr. 107<br/>
      CRAIOVA 200440<br/>
      DOLJ<br/>
      ROMÂNIA
    </div>

    <div class="col-logo">
      <img src="${logoSrc}" alt="OSACE Logo" style="width:180px; height:auto;" />
    </div>

    <div class="col-contact">
      Tel: +4-0773-365903<br/>
      Fax: +4-0251-438198<br/>
      <span class="link">osace2001@gmail.com</span><br/>
      <span class="link">osace2001@yahoo.com</span><br/>
      <span class="link">www.osace.ro</span>
    </div>
  </div>

  <hr class="header-divider"/>
  <hr class="header-divider-thin"/>

  <!-- DOCUMENT NUMBER + DATE -->
  <div class="doc-meta">
    <div class="doc-nr">Nr. ________ / ________________</div>
    <div></div>
  </div>

  <!-- DOCUMENT TITLE -->
  <div class="doc-title">Export Date Personale</div>
  <div class="doc-subtitle">Generat: ${exportDate} &nbsp;·&nbsp; Conform RGPD (UE) 2016/679, Art. 15</div>

  <!-- RGPD NOTICE -->
  <div class="rgpd-box">
    <strong>Informare RGPD:</strong> Acest document conține toate datele personale pe care O.S.A.C.E. le deține despre
    membrul menționat mai jos, în conformitate cu dreptul de acces prevăzut de Art. 15 din Regulamentul (UE) 2016/679.
    Documentul poate fi utilizat pentru verificarea corectitudinii datelor. Pentru solicitări de ștergere a datelor,
    vă rugăm să accesați <em>Profil → Setări cont → Șterge cont</em> în aplicația OSACE.
  </div>

  <!-- VOLUNTEER INFO CARD -->
  <div class="volunteer-card">
    <div class="info">
      <div class="name">${data.user.first_name} ${data.user.last_name}</div>
      <div class="sub">Utilizator: @${data.user.display_name}</div>
      <div class="sub">Email: ${data.user.email}</div>
      <div class="sub">Rol: ${data.user.role} &nbsp;·&nbsp; Înregistrat: ${joinDate}</div>
      <div class="sub">Status verificare: ${data.user.student_verification_status}</div>
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
      <div class="sig-stamp">Ștampilă</div>
      <div class="sig-line">Semnătură</div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    Document generat automat de platforma OSACE &nbsp;·&nbsp; www.osace.ro<br/>
    Date exportate conform Regulamentului General privind Protecția Datelor (RGPD/GDPR) — Art. 15<br/>
    CUI: 14277339 &nbsp;·&nbsp; contact@osace.ro
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
