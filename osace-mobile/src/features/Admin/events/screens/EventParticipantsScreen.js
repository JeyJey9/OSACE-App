import React, { useState, useEffect, useLayoutEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  Alert, 
  TouchableOpacity,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import api from '../../../../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { OSACE_LOGO_SRC } from '../../../../constants/osaceLogo';

import ScreenContainer from '../../../../components/layout/ScreenContainer';
import { useThemeColor } from '../../../../constants/useThemeColor';
import { useAuth } from '../../../Auth/AuthContext';

export default function EventParticipantsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { eventId, eventTitle } = route.params;
  const { colors, isDark } = useThemeColor();
  const { user: currentUser } = useAuth();
  
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Single Edit Modal State
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editStatus, setEditStatus] = useState('registered');
  const [editHours, setEditHours] = useState('0');
  const [saving, setSaving] = useState(false);

  // Bulk Select State
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('attended');
  const [bulkHours, setBulkHours] = useState('0');

  // Export Modal State
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exporting, setExporting] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          style={{ paddingHorizontal: 8, paddingVertical: 4, justifyContent: 'center', alignItems: 'center' }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 8 }}>
          <TouchableOpacity
            onPress={() => {
              setBulkMode(!bulkMode);
              setSelectedIds([]);
            }}
            style={{ paddingHorizontal: 8, paddingVertical: 4 }}
          >
            <Ionicons 
              name={bulkMode ? "checkbox" : "checkbox-outline"} 
              size={22} 
              color={bulkMode ? colors.primary : colors.textPrimary} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setExportModalVisible(true)}
            style={{ paddingHorizontal: 8, paddingVertical: 4 }}
          >
            <Ionicons name="download-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      )
    });
  }, [navigation, colors.textPrimary, bulkMode]);

  const fetchParticipants = async () => {
    try {
      const response = await api.get(`/api/events/${eventId}/participants`);
      setParticipants(response.data);
    } catch (error) {
      Alert.alert("Eroare", "Nu s-au putut încărca datele participanților.");
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [eventId]);

  const toggleSelectParticipant = (id) => {
    Haptics.selectionAsync();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === participants.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(participants.map(p => p.id));
    }
  };

  const handleBulkStatusChange = async (targetStatus, customHours = null) => {
    if (selectedIds.length === 0) return;
    setBulkActionLoading(true);
    try {
      const payload = { status: targetStatus };
      if (customHours !== null && !isNaN(parseFloat(customHours))) {
        payload.awarded_hours = parseFloat(customHours);
      }
      const promises = selectedIds.map(userId => 
        api.put(`/api/events/${eventId}/participants/${userId}`, payload)
      );
      await Promise.all(promises);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: 'success',
        text1: 'Actualizare în lot reușită! ✅',
        text2: `Modificările au fost salvate pentru ${selectedIds.length} voluntari.`,
      });

      setSelectedIds([]);
      setBulkMode(false);
      setBulkModalVisible(false);
      fetchParticipants();
    } catch (error) {
      console.error("Eroare actualizare lot:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Eroare", "Nu s-au putut actualiza toți participanții selectați.");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const openBulkModal = () => {
    setBulkStatus('attended');
    setBulkHours('0');
    setBulkModalVisible(true);
  };

  const handleOpenEditModal = (participant) => {
    setSelectedParticipant(participant);
    setEditStatus(participant.confirmation_status || 'registered');
    setEditHours((parseFloat(participant.awarded_hours) || 0).toString());
    setModalVisible(true);
  };

  const handleSaveParticipant = async () => {
    if (!selectedParticipant) return;
    setSaving(true);
    try {
      const payload = {
        status: editStatus,
      };
      if (isAdmin) {
        payload.awarded_hours = parseFloat(editHours) || 0;
      }

      await api.put(`/api/events/${eventId}/participants/${selectedParticipant.id}`, payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: 'success',
        text1: 'Actualizat! ✅',
        text2: `Prezența lui ${selectedParticipant.first_name || selectedParticipant.display_name} a fost actualizată.`,
      });

      setModalVisible(false);
      fetchParticipants();
    } catch (error) {
      console.error("Eroare la salvare participant:", error.response?.data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Eroare", error.response?.data?.error || "Nu s-au putut salva modificările.");
    } finally {
      setSaving(false);
    }
  };

  // Export CSV
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      let csv = `ID,Nume,Prenume,Username,Email,Status,Hora Check-In,Hora Check-Out,Ore Acordate\n`;
      participants.forEach(p => {
        const checkIn = p.check_in_time ? format(new Date(p.check_in_time.replace(' ', 'T')), 'HH:mm dd/MM/yyyy') : '—';
        const checkOut = p.check_out_time ? format(new Date(p.check_out_time.replace(' ', 'T')), 'HH:mm dd/MM/yyyy') : '—';
        const hours = parseFloat(p.awarded_hours || 0).toFixed(1);
        csv += `${p.id},"${p.last_name || ''}","${p.first_name || ''}","${p.display_name || ''}","${p.email || ''}","${p.confirmation_status}","${checkIn}","${checkOut}",${hours}\n`;
      });

      const fileName = `OSACE_Prezenta_Event_${eventId}_${format(new Date(), 'yyyyMMdd')}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(filePath, csv, { encoding: FileSystem.EncodingType.UTF8 });

      setExportModalVisible(false);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/csv',
          dialogTitle: `Export Prezență CSV - ${eventTitle}`,
        });
      } else {
        Alert.alert('Salvat', `Fișier CSV salvat la: ${filePath}`);
      }
    } catch (err) {
      console.error("Eroare export CSV:", err);
      Alert.alert("Eroare", "Nu s-a putut genera fișierul CSV.");
    } finally {
      setExporting(false);
    }
  };

  // Export PDF with Official OSACE Header Template
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const logoSrc = OSACE_LOGO_SRC;

      const currentDate = format(new Date(), 'dd.MM.yyyy', { locale: ro });
      const totalHours = participants
        .filter(p => p.confirmation_status === 'attended')
        .reduce((sum, p) => sum + (parseFloat(p.awarded_hours) || 0), 0);

      const rowsHTML = participants.map((p, idx) => {
        const checkIn = p.check_in_time ? format(new Date(p.check_in_time.replace(' ', 'T')), 'HH:mm') : '—';
        const checkOut = p.check_out_time ? format(new Date(p.check_out_time.replace(' ', 'T')), 'HH:mm') : '—';
        const hours = p.confirmation_status === 'attended' ? `+${parseFloat(p.awarded_hours || 0).toFixed(1)}h` : '0h';
        const statusLabel = p.confirmation_status === 'attended' ? 'Finalizat' : p.confirmation_status === 'checked_in' ? 'Prezent' : 'Înscris';

        return `
          <tr>
            <td style="text-align:center">${idx + 1}</td>
            <td><strong>${p.last_name || ''} ${p.first_name || ''}</strong></td>
            <td>@${p.display_name}</td>
            <td style="text-align:center"><span class="pill ${p.confirmation_status === 'attended' ? 'green' : 'gray'}">${statusLabel}</span></td>
            <td style="text-align:center">${checkIn}</td>
            <td style="text-align:center">${checkOut}</td>
            <td style="text-align:center"><strong>${hours}</strong></td>
          </tr>
        `;
      }).join('');

      const html = `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8"/>
  <title>Prezență Activitate OSACE</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #222; background: #fff; padding: 1.8cm 2cm; }
    
    .org-title { text-align: center; font-size: 10.5pt; font-weight: bold; text-transform: uppercase; line-height: 1.4; margin-bottom: 14px; color: #111; }
    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    .header-table td { border: none; padding: 0; vertical-align: middle; background: transparent !important; }
    .col-left { width: 32%; font-size: 8.5pt; line-height: 1.6; color: #333; }
    .col-center { width: 36%; text-align: center; }
    .col-center img { width: 140px; height: auto; }
    .col-right { width: 32%; font-size: 8.5pt; line-height: 1.6; text-align: right; color: #333; }
    
    .header-divider-thick { border: none; border-top: 2.5px solid #111; margin: 10px 0 3px 0; }
    .header-divider-thin { border: none; border-top: 1px solid #111; margin: 0 0 16px 0; }
    
    .doc-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; font-size: 10pt; }
    .doc-title { text-align: center; font-size: 16pt; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 4px; color: #1566B9; }
    .doc-subtitle { text-align: center; font-size: 9.5pt; color: #555; margin-bottom: 20px; }
    
    .event-info-box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; background: #f8fafc; display: flex; justify-content: space-between; align-items: center; }
    .event-info-box .title { font-size: 13pt; font-weight: bold; color: #111; }
    .event-info-box .sub { font-size: 9pt; color: #555; margin-top: 2px; }
    .event-info-box .totals { text-align: right; }
    .event-info-box .totals .num { font-size: 22pt; font-weight: bold; color: #1566B9; line-height: 1; }
    .event-info-box .totals .lbl { font-size: 8pt; text-transform: uppercase; color: #666; }
    
    table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-top: 0; }
    th { border: 1px solid #cbd5e1; padding: 7px 8px; background: #f1f5f9; color: #334155; text-align: left; font-size: 8pt; text-transform: uppercase; }
    td { border: 1px solid #cbd5e1; padding: 7px 8px; color: #334155; }
    tr:nth-child(even) td { background: #f8fafc; }
    
    .pill { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 8pt; font-weight: bold; }
    .pill.green { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .pill.gray { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

    .sig-block { margin-top: 40px; display: flex; justify-content: flex-end; }
    .sig-inner { text-align: center; width: 220px; font-size: 10pt; line-height: 1.6; }
    .sig-inner .sig-role { font-weight: bold; color: #111; }
    .sig-inner .sig-line { border-top: 1px solid #111; margin-top: 45px; padding-top: 4px; font-size: 8.5pt; color: #555; }
    
    .footer { margin-top: 25px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 8pt; color: #64748b; text-align: center; }
    @page { size: A4; margin: 1.5cm; }
    tr, .sig-block, .event-info-box { page-break-inside: avoid; }
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
    <div class="doc-nr">Nr. ________ / ${currentDate}</div>
    <div>Craiova, România</div>
  </div>

  <div class="doc-title">FRAPĂ PREZENȚĂ ACTIVITATE</div>
  <div class="doc-subtitle">Raport Oficial de Participare & Ore de Voluntariat</div>

  <div class="event-info-box">
    <div>
      <div class="title">${eventTitle}</div>
      <div class="sub">Event ID: #${eventId} &nbsp;·&nbsp; Data generării: ${currentDate}</div>
      <div class="sub">Total Voluntari Înscriși: ${participants.length}</div>
    </div>
    <div class="totals">
      <div class="num">${totalHours.toFixed(1)}</div>
      <div class="lbl">total ore acordate</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 30px; text-align:center">#</th>
        <th>Nume Voluntar</th>
        <th>Username</th>
        <th style="text-align:center">Status</th>
        <th style="text-align:center">In</th>
        <th style="text-align:center">Out</th>
        <th style="text-align:center">Ore</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHTML}
    </tbody>
  </table>

  <div class="sig-block">
    <div class="sig-inner">
      <div class="sig-role">Președinte O.S.A.C.E.,</div>
      <div style="font-weight:600; margin-top:2px;">Rădoi Constantin-Mihai</div>
      <div class="sig-line">Semnătură și Ștampilă</div>
    </div>
  </div>

  <div class="footer">
    Document generat automat de aplicația OSACE &nbsp;·&nbsp; www.osace.ro<br/>
    CUI: 14277339 &nbsp;·&nbsp; B-dul. Decebal Nr. 107, Craiova, Dolj
  </div>

</body>
</html>
      `;

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      setExportModalVisible(false);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Export Prezență PDF - ${eventTitle}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Salvat', `PDF salvat la: ${uri}`);
      }
    } catch (err) {
      console.error("Eroare export PDF:", err);
      Alert.alert("Eroare", "Nu s-a putut genera PDF-ul.");
    } finally {
      setExporting(false);
    }
  };

  const styles = createStyles(colors, isDark);

  const renderParticipantItem = ({ item }) => {
    const isSelected = selectedIds.includes(item.id);
    const status = item.confirmation_status;
    
    let iconName = "time-outline";
    let iconColor = colors.textSecondary;
    let statusText = "Înscris";
    let tagStyle = styles.statusPending;
    let textColor = "#f39c12";

    if (status === 'checked_in') {
      iconName = "scan-circle";
      iconColor = "#3498db";
      statusText = "Prezent";
      tagStyle = styles.statusCheckedIn;
      textColor = "#3498db";
    } else if (status === 'attended') {
      iconName = "checkmark-circle";
      iconColor = "#2ecc71";
      statusText = "Finalizat";
      tagStyle = styles.statusAttended;
      textColor = "#2ecc71";
    }

    const timeText = status === 'attended' && item.awarded_hours 
      ? `${parseFloat(item.awarded_hours).toFixed(1)} ore primite`
      : status === 'checked_in' && item.check_in_time 
        ? `Sosit: ${format(new Date(item.check_in_time.replace(' ', 'T')), 'HH:mm')}`
        : 'Nu a sosit încă';

    return (
      <TouchableOpacity 
        style={[styles.participantItem, isSelected && { borderColor: colors.primary, borderWidth: 1.5 }]}
        onPress={() => bulkMode ? toggleSelectParticipant(item.id) : null}
        activeOpacity={bulkMode ? 0.7 : 1}
      >
        {bulkMode && (
          <TouchableOpacity 
            onPress={() => toggleSelectParticipant(item.id)}
            style={{ marginRight: 10 }}
          >
            <Ionicons 
              name={isSelected ? "checkbox" : "square-outline"} 
              size={24} 
              color={isSelected ? colors.primary : colors.textSecondary} 
            />
          </TouchableOpacity>
        )}

        <Ionicons 
          name={iconName}
          size={24} 
          color={iconColor}
          style={styles.icon}
        />
        <View style={styles.participantDetails}>
          <View style={styles.nameRow}>
            <Text style={styles.participantName}>{item.last_name} {item.first_name}</Text>
            <View style={styles.idChip}>
              <Text style={styles.idChipText}>#ID: {item.id}</Text>
            </View>
          </View>
          <Text style={styles.participantEmail}>@{item.display_name}</Text>
          
          {status !== 'pending' && (
            <Text style={[styles.confirmedTime, { color: textColor }]}>
              {timeText}
            </Text>
          )}
        </View>

        {!bulkMode && (
          <View style={styles.rightActions}>
            <View style={[styles.statusTag, tagStyle]}>
              <Text style={[styles.statusTagText, { color: textColor }]}>
                {statusText}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.editBtn}
              onPress={() => handleOpenEditModal(item)}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <ScreenContainer scrollable={false}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={false}>
      <FlatList
        data={participants}
        renderItem={renderParticipantItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>{eventTitle}</Text>
              <View style={styles.eventIdBadge}>
                <Text style={styles.eventIdBadgeText}>Event ID #{eventId}</Text>
              </View>
            </View>
            
            <View style={styles.subHeaderRow}>
              <Text style={styles.headerSubtitle}>Total înscriși: {participants.length}</Text>
              {bulkMode && (
                <TouchableOpacity onPress={selectAll} style={styles.selectAllBtn}>
                  <Text style={[styles.selectAllText, { color: colors.primary }]}>
                    {selectedIds.length === participants.length ? 'Deselectează Tot' : 'Selectează Tot'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color={colors.border} />
            <Text style={styles.emptyText}>Niciun participant înscris la acest eveniment.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        overScrollMode="never"
      />

      {/* BULK ACTION BAR */}
      {bulkMode && selectedIds.length > 0 && (
        <View style={[styles.bulkBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.bulkBarText, { color: colors.textPrimary }]}>
            {selectedIds.length} voluntari selectați
          </Text>
          
          <View style={styles.bulkBtnGroup}>
            <TouchableOpacity 
              style={[styles.bulkBtn, { backgroundColor: colors.primary }]}
              onPress={isAdmin ? openBulkModal : () => handleBulkStatusChange('attended')}
              disabled={bulkActionLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="options-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.bulkBtnText}>
                {isAdmin ? 'Setează Ore / Status' : 'Actualizează Prezența'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* MODAL EDITARE ÎN LOT (STATUS ȘI ORE) */}
      <Modal
        visible={bulkModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setBulkModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setBulkModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                    Editează {selectedIds.length} Voluntari
                  </Text>
                  <TouchableOpacity onPress={() => setBulkModalVisible(false)}>
                    <Ionicons name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.modalUserSub, { color: colors.textSecondary }]}>
                  Setează statusul și orele pentru toți cei {selectedIds.length} voluntari selectați.
                </Text>

                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Status Prezență:</Text>
                <View style={styles.statusPillsRow}>
                  {[
                    { key: 'registered', label: 'Înscris' },
                    { key: 'checked_in', label: 'Prezent' },
                    { key: 'attended', label: 'Finalizat' },
                  ].map((st) => {
                    const isSelected = bulkStatus === st.key;
                    return (
                      <TouchableOpacity
                        key={st.key}
                        style={[
                          styles.statusPill,
                          { borderColor: isSelected ? colors.primary : colors.border },
                          isSelected && { backgroundColor: colors.primary + '20' }
                        ]}
                        onPress={() => setBulkStatus(st.key)}
                      >
                        <Text style={[
                          styles.statusPillText,
                          { color: isSelected ? colors.primary : colors.textSecondary }
                        ]}>
                          {st.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.fieldBlock}>
                  <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Ore Acordate Fiecăruia:</Text>
                  <TextInput
                    style={[
                      styles.hoursInput,
                      { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }
                    ]}
                    keyboardType="numeric"
                    value={bulkHours}
                    onChangeText={setBulkHours}
                    placeholder="0.0"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.cancelBtn, { borderColor: colors.border }]}
                    onPress={() => setBulkModalVisible(false)}
                    disabled={bulkActionLoading}
                  >
                    <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Anulează</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalBtn, styles.saveBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleBulkStatusChange(bulkStatus, bulkHours)}
                    disabled={bulkActionLoading}
                  >
                    {bulkActionLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.saveBtnText}>Aplică pe Lot</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* MODAL EXPORT OPTIONS */}
      <Modal
        visible={exportModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setExportModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setExportModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Export Prezență</Text>
                <TouchableOpacity onPress={() => setExportModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalUserSub, { color: colors.textSecondary }]}>
                Alege formatul în care dorești să descarci prezența pentru activitatea "{eventTitle}"
              </Text>

              {exporting ? (
                <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={{ marginTop: 10, color: colors.textSecondary }}>Se generează fișierul...</Text>
                </View>
              ) : (
                <View style={{ gap: 12, marginTop: 10 }}>
                  <TouchableOpacity 
                    style={[styles.exportOptionBtn, { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]}
                    onPress={handleExportPDF}
                  >
                    <Ionicons name="document-text-outline" size={26} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.exportOptionTitle, { color: colors.primary }]}>Descarcă PDF (Adeverință / Frapă)</Text>
                      <Text style={styles.exportOptionSub}>Document oficial cu antetul OSACE și ștampilă</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.exportOptionBtn, { borderColor: colors.border }]}
                    onPress={handleExportCSV}
                  >
                    <Ionicons name="stats-chart-outline" size={26} color="#27ae60" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.exportOptionTitle, { color: colors.textPrimary }]}>Exportă CSV (Excel)</Text>
                      <Text style={styles.exportOptionSub}>Tabel brut pentru Google Sheets / Excel</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* MODAL EDITARE PREZENȚĂ ȘI ORE */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Editează Prezența</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {selectedParticipant && (
                  <Text style={[styles.modalUserSub, { color: colors.textSecondary }]}>
                    {selectedParticipant.first_name} {selectedParticipant.last_name} (@{selectedParticipant.display_name})
                  </Text>
                )}

                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Status Prezență:</Text>
                <View style={styles.statusPillsRow}>
                  {[
                    { key: 'registered', label: 'Înscris' },
                    { key: 'checked_in', label: 'Prezent' },
                    { key: 'attended', label: 'Finalizat' },
                  ].map((st) => {
                    const isSelected = editStatus === st.key;
                    return (
                      <TouchableOpacity
                        key={st.key}
                        style={[
                          styles.statusPill,
                          { borderColor: isSelected ? colors.primary : colors.border },
                          isSelected && { backgroundColor: colors.primary + '20' }
                        ]}
                        onPress={() => setEditStatus(st.key)}
                      >
                        <Text style={[
                          styles.statusPillText,
                          { color: isSelected ? colors.primary : colors.textSecondary }
                        ]}>
                          {st.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.fieldBlock}>
                  <View style={styles.labelWithBadge}>
                    <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Ore Acordate:</Text>
                    {!isAdmin && (
                      <View style={styles.adminOnlyTag}>
                        <Text style={styles.adminOnlyTagText}>Doar Admin</Text>
                      </View>
                    )}
                  </View>

                  <TextInput
                    style={[
                      styles.hoursInput,
                      { 
                        color: colors.textPrimary, 
                        borderColor: colors.border,
                        backgroundColor: isAdmin ? colors.background : (isDark ? 'rgba(255,255,255,0.05)' : '#f5f5f5')
                      }
                    ]}
                    keyboardType="numeric"
                    value={editHours}
                    onChangeText={setEditHours}
                    editable={isAdmin}
                    placeholder="0.0"
                    placeholderTextColor={colors.textSecondary}
                  />
                  {!isAdmin && (
                    <Text style={styles.hintText}>
                      * Doar utilizatorii cu rol de Admin pot modifica direct numărul de ore.
                    </Text>
                  )}
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.cancelBtn, { borderColor: colors.border }]}
                    onPress={() => setModalVisible(false)}
                    disabled={saving}
                  >
                    <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Anulează</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalBtn, styles.saveBtn, { backgroundColor: colors.primary }]}
                    onPress={handleSaveParticipant}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.saveBtnText}>Salvează</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScreenContainer>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listHeader: { backgroundColor: colors.card, padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 10 },
  headerTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, flex: 1 },
  eventIdBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: isDark ? 'rgba(74, 144, 226, 0.15)' : '#ebf5fb', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary + '40'
  },
  eventIdBadgeText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  subHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  headerSubtitle: { fontSize: 14, color: colors.textSecondary },
  selectAllBtn: { paddingVertical: 2, paddingHorizontal: 6 },
  selectAllText: { fontSize: 12, fontWeight: '700' },
  listContent: { paddingBottom: 180 },
  participantItem: { backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', padding: 15, marginHorizontal: 15, marginVertical: 6, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, borderWidth: isDark ? 1 : 0, borderColor: colors.border },
  icon: { marginRight: 12 },
  participantDetails: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  participantName: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary },
  idChip: { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  idChipText: { fontSize: 10, fontWeight: '700', color: colors.textSecondary },
  participantEmail: { fontSize: 13, color: colors.textSecondary },
  confirmedTime: { fontSize: 11, marginTop: 4, fontWeight: '600' },
  rightActions: { alignItems: 'flex-end', gap: 8 },
  statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusTagText: { fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  editBtn: { padding: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f0f4f8', borderRadius: 6 },
  statusAttended: { backgroundColor: isDark ? 'rgba(46, 204, 113, 0.15)' : '#e8f8f5' },
  statusCheckedIn: { backgroundColor: isDark ? 'rgba(52, 152, 219, 0.15)' : '#EBF5FB' },
  statusPending: { backgroundColor: isDark ? 'rgba(243, 156, 18, 0.15)' : '#fef9e7' },
  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyText: { textAlign: 'center', marginTop: 15, color: colors.textSecondary, fontSize: 16 },

  // Bulk Bar
  bulkBar: { 
    position: 'absolute', 
    bottom: 95, 
    left: 15, 
    right: 15, 
    padding: 14, 
    borderRadius: 14, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    elevation: 10, 
    zIndex: 999,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.35 : 0.15,
    shadowRadius: 8,
  },
  bulkBarText: { fontWeight: 'bold', fontSize: 14 },
  bulkBtnGroup: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  bulkBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  bulkBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 400, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalUserSub: { fontSize: 13, marginTop: 4, marginBottom: 15 },
  fieldLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  statusPillsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statusPill: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  statusPillText: { fontSize: 12, fontWeight: 'bold' },
  fieldBlock: { marginBottom: 20 },
  labelWithBadge: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  adminOnlyTag: { backgroundColor: 'rgba(231, 76, 60, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  adminOnlyTagText: { color: '#e74c3c', fontSize: 10, fontWeight: 'bold' },
  hoursInput: { height: 45, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 16, marginTop: 4 },
  hintText: { fontSize: 11, color: '#e74c3c', marginTop: 4, fontStyle: 'italic' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  modalBtn: { flex: 1, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  cancelBtn: { borderWidth: 1 },
  cancelBtnText: { fontWeight: 'bold' },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },

  // Export Option Buttons
  exportOptionBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 12, borderWidth: 1 },
  exportOptionTitle: { fontSize: 14, fontWeight: 'bold' },
  exportOptionSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
});
