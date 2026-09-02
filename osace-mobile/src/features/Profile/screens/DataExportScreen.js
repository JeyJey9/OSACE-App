import React, { useState, useLayoutEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView, Switch,
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
import { OSACE_LOGO_SRC } from '../../../constants/osaceLogo';

export default function DataExportScreen() {
  const { colors, isDark } = useThemeColor();
  const { user } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const BLUE = isDark ? '#4A90E2' : '#1566B9';

  // Submeniu Opțiuni Export (personalizare raport)
  const [includeProfile, setIncludeProfile] = useState(true);
  const [includeEvents, setIncludeEvents] = useState(true);
  const [includeContributions, setIncludeContributions] = useState(true);
  const [includeBadges, setIncludeBadges] = useState(true);
  const [includeSignature, setIncludeSignature] = useState(true);

  const selectedCount = [
    includeProfile,
    includeEvents,
    includeContributions,
    includeBadges,
    includeSignature,
  ].filter(Boolean).length;

  const toggleAll = (state) => {
    setIncludeProfile(state);
    setIncludeEvents(state);
    setIncludeContributions(state);
    setIncludeBadges(state);
    setIncludeSignature(state);
  };

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
    if (selectedCount === 0) {
      Alert.alert('Atenție', 'Te rugăm să selectezi cel puțin o secțiune pentru a genera raportul.');
      return;
    }

    setLoading(true);
    try {
      const logoSrc = OSACE_LOGO_SRC;

      const { data } = await api.get('/api/profile/my-data');

      const exportDate = format(new Date(data.exported_at.replace(' ', 'T')), 'dd.MM.yyyy', { locale: ro });
      const joinDate = format(new Date(data.user.created_at.replace(' ', 'T')), 'dd.MM.yyyy', { locale: ro });

      const totalHours = [
        ...(includeEvents ? data.events_attended.filter(e => e.confirmation_status === 'attended') : []),
        ...(includeContributions ? data.special_contributions : []),
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

      const fullName = `${data.user.first_name || ''} ${data.user.last_name || ''}`.trim() || data.user.display_name;

      // Construim lista de activități ca bullet points
      const attendedEvents = data.events_attended.filter(e => e.confirmation_status === 'attended');
      const eventsBullets = attendedEvents.map(e => {
        const eventDate = e.start_time ? format(new Date(e.start_time.replace(' ', 'T')), 'dd.MM.yyyy') : '';
        const hours = parseFloat(e.awarded_hours || 0).toFixed(1);
        return `<li><strong>${e.title}</strong>${e.category ? ` (${e.category})` : ''}${eventDate ? ` — ${eventDate}` : ''} — <em>${hours} ore</em></li>`;
      }).join('\n');

      const contribBullets = data.special_contributions.map(c => {
        const cDate = format(new Date(c.created_at.replace(' ', 'T')), 'dd.MM.yyyy');
        const hours = parseFloat(c.awarded_hours || 0).toFixed(1);
        return `<li><strong>${c.title}</strong>${c.description ? ` — ${c.description}` : ''} — ${cDate} — <em>${hours} ore</em></li>`;
      }).join('\n');

      const badgeBullets = data.badges.map(b => {
        const bDate = format(new Date(b.earned_at.replace(' ', 'T')), 'dd.MM.yyyy');
        return `<li><strong>${b.name}</strong>${b.description ? ` — ${b.description}` : ''} (${bDate})</li>`;
      }).join('\n');

      const html = `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8"/>
  <title>Adeverință Voluntariat OSACE</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11pt;
      color: #222;
      background: #fff;
      padding: 0.8cm 1.2cm;
    }

    .org-title {
      text-align: center;
      font-size: 9.5pt;
      font-weight: bold;
      text-transform: uppercase;
      line-height: 1.3;
      margin-bottom: 10px;
      color: #111;
    }

    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
    }
    .header-table td {
      border: none;
      padding: 0;
      vertical-align: middle;
      background: transparent !important;
    }
    .col-left { width: 33%; font-size: 7.5pt; color: #444; line-height: 1.3; text-align: left; }
    .col-center { width: 34%; text-align: center; }
    .col-center img { max-height: 150px; max-width: 360px; display: inline-block; }
    .col-right { width: 33%; font-size: 7.5pt; color: #444; line-height: 1.3; text-align: right; }

    .header-divider-thick {
      border: none; border-top: 2px solid #111;
      margin-top: 6px; margin-bottom: 2px;
    }
    .header-divider-thin {
      border: none; border-top: 0.5px solid #111;
      margin-bottom: 14px;
    }

    .doc-meta {
      display: flex; justify-content: space-between;
      font-size: 8.5pt; color: #555; margin-bottom: 14px;
    }
    .doc-nr { font-weight: bold; color: #222; }

    .doc-title {
      text-align: center; font-size: 15pt; font-weight: bold;
      letter-spacing: 1.5px; margin-bottom: 18px; color: #111;
      text-transform: uppercase;
    }

    .attestation-text {
      font-size: 10.5pt; color: #222; line-height: 1.7;
      margin-bottom: 16px; text-align: justify;
    }
    .attestation-text strong { color: #111; }

    .section-label {
      font-size: 10pt; font-weight: bold; color: #1e293b;
      margin-top: 16px; margin-bottom: 6px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 3px;
    }

    ul.activity-list {
      list-style: none; padding: 0; margin: 0 0 10px 0;
    }
    ul.activity-list li {
      font-size: 9.5pt; color: #334155; line-height: 1.5;
      padding: 3px 0 3px 14px; position: relative;
    }
    ul.activity-list li::before {
      content: "•";
      position: absolute; left: 0; color: #1566B9; font-weight: bold;
    }
    ul.activity-list li em {
      color: #15803d; font-style: normal; font-weight: 600;
    }

    .total-box {
      margin-top: 12px; padding: 8px 14px;
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px;
      font-size: 10pt; color: #1e293b;
    }
    .total-box strong { color: #1566B9; font-size: 13pt; }

    .empty-note {
      font-size: 9pt; color: #94a3b8; font-style: italic; padding: 4px 0;
    }

    .sig-block {
      margin-top: 36px; display: flex; justify-content: flex-end;
    }
    .sig-inner {
      width: 220px; text-align: center;
      border-top: 1px dashed #94a3b8; padding-top: 6px;
    }
    .sig-role { font-size: 8.5pt; font-weight: bold; color: #1e293b; }
    .sig-name { font-size: 8.5pt; color: #475569; margin-top: 2px; }
    .sig-line { font-size: 7pt; color: #94a3b8; margin-top: 28px; }

    .footer {
      margin-top: 30px; border-top: 0.5px solid #e2e8f0; padding-top: 6px;
      font-size: 7pt; color: #94a3b8; text-align: center; line-height: 1.3;
    }

    @page {
      size: A4 portrait;
      margin: 1cm;
    }

    .sig-block, .section-label, li {
      page-break-inside: avoid;
    }
  </style>
</head>
<body>

  <div class="org-title">
    ORGANIZAȚIA STUDENȚILOR DIN FACULTATEA DE AUTOMATICĂ, CALCULATOARE ȘI ELECTRONICĂ (O.S.A.C.E.)
  </div>

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

  <div class="doc-meta">
    <div class="doc-nr">Nr. ________ / ${exportDate}</div>
    <div>Craiova, România</div>
  </div>

  <div class="doc-title">Adeverință Voluntariat</div>

  <p class="attestation-text">
    Prin prezenta, <strong>Organizația Studenților din Facultatea de Automatică, Calculatoare și Electronică (O.S.A.C.E.)</strong> atestă că voluntarul
    <strong>${fullName}</strong>${data.user.email ? ` (${data.user.email})` : ''}, membru din data de <strong>${joinDate}</strong>,
    a participat la următoarele activități de voluntariat în cadrul organizației, acumulând un total de <strong>${totalHours.toFixed(1)} ore de voluntariat</strong>:
  </p>

  ${includeEvents && attendedEvents.length > 0 ? `
  <div class="section-label">Activități de Voluntariat (${attendedEvents.length})</div>
  <ul class="activity-list">
    ${eventsBullets}
  </ul>
  ` : ''}

  ${includeContributions && data.special_contributions.length > 0 ? `
  <div class="section-label">Contribuții Speciale & Proiecte (${data.special_contributions.length})</div>
  <ul class="activity-list">
    ${contribBullets}
  </ul>
  ` : ''}

  ${includeBadges && data.badges.length > 0 ? `
  <div class="section-label">Realizări & Distincții (${data.badges.length})</div>
  <ul class="activity-list">
    ${badgeBullets}
  </ul>
  ` : ''}

  <div class="total-box">
    Total ore de voluntariat acumulate: <strong>${totalHours.toFixed(1)} ore</strong>
  </div>

  ${includeSignature ? `
  <div class="sig-block">
    <div class="sig-inner">
      <div class="sig-role">Președinte O.S.A.C.E.,</div>
      <div class="sig-name">Rădoi Constantin-Mihai</div>
      <div class="sig-line">Semnătură și Ștampilă</div>
    </div>
  </div>
  ` : ''}

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

  const sectionsList = [
    {
      id: 'profile',
      icon: 'person-outline',
      title: 'Informații Profil & Cont',
      desc: 'Nume, email, username, rol și totalul de ore acumulate.',
      state: includeProfile,
      setter: setIncludeProfile,
    },
    {
      id: 'events',
      icon: 'calendar-outline',
      title: 'Activități de Voluntariat',
      desc: 'Evenimentele la care ai participat, categorii și ore validate.',
      state: includeEvents,
      setter: setIncludeEvents,
    },
    {
      id: 'contributions',
      icon: 'star-outline',
      title: 'Contribuții Speciale & Task-uri',
      desc: 'Ore și merite speciale acordate de conducere.',
      state: includeContributions,
      setter: setIncludeContributions,
    },
    {
      id: 'badges',
      icon: 'ribbon-outline',
      title: 'Insigne & Badge-uri',
      desc: 'Toate distincțiile și realizările deblocate în asociație.',
      state: includeBadges,
      setter: setIncludeBadges,
    },
    {
      id: 'signature',
      icon: 'shield-checkmark-outline',
      title: 'Semnătură & Ștampilă Oficială',
      desc: 'Bloc oficial de autentificare O.S.A.C.E. pentru dosare/adeverințe.',
      state: includeSignature,
      setter: setIncludeSignature,
    },
  ];

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={s.hero}>
        <View style={s.heroIcon}>
          <Ionicons name="document-text" size={40} color={BLUE} />
        </View>
        <Text style={s.heroTitle}>Exportul Datelor Tale</Text>
        <Text style={s.heroSub}>
          Personalizează secțiunile pe care dorești să le incluzi în raportul oficial PDF.
        </Text>
      </View>

      {/* Submeniu de Personalizare */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <View>
            <Text style={s.cardTitle}>Secțiuni Raport</Text>
            <Text style={s.cardSub}>{selectedCount} din 5 secțiuni selectate</Text>
          </View>
          <View style={s.quickActions}>
            <TouchableOpacity onPress={() => toggleAll(true)} style={s.quickBtn}>
              <Text style={s.quickBtnText}>Toate</Text>
            </TouchableOpacity>
            <Text style={{ color: colors.textSecondary, opacity: 0.4 }}>|</Text>
            <TouchableOpacity onPress={() => toggleAll(false)} style={s.quickBtn}>
              <Text style={s.quickBtnText}>Niciuna</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.divider} />

        {sectionsList.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.8}
            onPress={() => item.setter(!item.state)}
            style={[s.toggleRow, item.state && s.toggleRowActive]}
          >
            <View style={[s.toggleIconBox, item.state && { backgroundColor: BLUE + '20' }]}>
              <Ionicons name={item.icon} size={20} color={item.state ? BLUE : colors.textSecondary} />
            </View>

            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[s.toggleTitle, item.state && { color: colors.textPrimary }]}>{item.title}</Text>
              <Text style={s.toggleDesc}>{item.desc}</Text>
            </View>

            <Switch
              value={item.state}
              onValueChange={item.setter}
              trackColor={{ false: isDark ? '#333' : '#e2e8f0', true: BLUE + '70' }}
              thumbColor={item.state ? BLUE : isDark ? '#888' : '#f4f3f4'}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* GDPR notice */}
      <View style={s.gdprCard}>
        <Ionicons name="lock-closed-outline" size={20} color="#f39c12" />
        <Text style={s.gdprText}>
          Documentul este generat securizat pe baza datelor tale active și conține marca temporală oficială O.S.A.C.E.
        </Text>
      </View>

      {/* Generate button */}
      <TouchableOpacity
        style={[
          s.btn,
          { backgroundColor: BLUE, shadowColor: BLUE },
          (loading || selectedCount === 0) && { opacity: 0.6 },
        ]}
        onPress={generatePDF}
        disabled={loading || selectedCount === 0}
      >
        {loading ? (
          <>
            <ActivityIndicator color="white" />
            <Text style={s.btnText}>Se generează PDF...</Text>
          </>
        ) : (
          <>
            <Ionicons name="download-outline" size={22} color="white" />
            <Text style={s.btnText}>Descarcă Raportul Personalizat</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={s.legalNote}>
        Conform Regulamentului (UE) 2016/679 (RGPD), Art. 15 — Dreptul de acces.{'\n'}
        Document recunoscut oficial de asociația O.S.A.C.E.
      </Text>
    </ScrollView>
  );
}

const createStyles = (colors, isDark, insets, BLUE) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: insets.bottom + 40 },
  hero: { alignItems: 'center', paddingVertical: 20, gap: 10 },
  heroIcon: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: BLUE + '15', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: BLUE + '30',
  },
  heroTitle: { fontSize: 22, fontWeight: '900', color: colors.textPrimary, textAlign: 'center' },
  heroSub: { fontSize: 13.5, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, paddingHorizontal: 12 },
  card: {
    backgroundColor: colors.card, borderRadius: 20, padding: 18,
    marginBottom: 16,
    borderWidth: isDark ? 1 : 0, borderColor: 'rgba(255,255,255,0.07)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.2 : 0.06, shadowRadius: 10, elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  cardSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  quickActions: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  quickBtn: { paddingHorizontal: 4 },
  quickBtnText: { fontSize: 11.5, fontWeight: '700', color: BLUE },
  divider: {
    height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    marginVertical: 14,
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 8,
    borderRadius: 14, marginBottom: 4,
  },
  toggleRowActive: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
  },
  toggleIconBox: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  toggleTitle: { fontSize: 13.5, fontWeight: '700', color: colors.textSecondary, marginBottom: 2 },
  toggleDesc: { fontSize: 11, color: colors.textSecondary, lineHeight: 15 },
  gdprCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: isDark ? 'rgba(243,156,18,0.12)' : '#FEF9E7',
    borderRadius: 14, padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(243,156,18,0.3)',
  },
  gdprText: { flex: 1, fontSize: 12.5, color: isDark ? '#f0c070' : '#7D5C00', lineHeight: 18 },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, height: 56, borderRadius: 18,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
    marginBottom: 18,
  },
  btnText: { color: 'white', fontSize: 15, fontWeight: '800' },
  legalNote: { fontSize: 11, color: colors.textSecondary, textAlign: 'center', lineHeight: 16 },
});
