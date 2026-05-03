import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Image } from 'react-native';
import { COLORS, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../theme';
import { useStaffStore } from '../store/useStaffStore';
import { useAuthStore } from '../store/useAuthStore';

const StaffPortalScreen = () => {
  const { currentUser } = useAuthStore();
  const { 
    attendance, tasks, requests, 
    checkIn, checkOut, completeTask, addRequest 
  } = useStaffStore();

  const [requestForm, setRequestForm] = useState({ type: 'leave', reason: '', date: '' });
  const [showRequestForm, setShowRequestForm] = useState(false);

  const myTasks = tasks.filter(t => t.staffId === currentUser?.id);
  const isCheckedIn = attendance.find(a => a.staffId === currentUser?.id && a.type === 'IN');

  const handleCheckIn = () => {
    Alert.alert(
      'Giriş Yap',
      'Konumunuz doğrulanıyor ve QR kod taranıyor...',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Onayla', onPress: () => {
          checkIn(currentUser.id);
          Alert.alert('Başarılı', 'Mesai başladı.');
        }}
      ]
    );
  };

  const handleCheckOut = () => {
    checkOut(currentUser.id);
    Alert.alert('Başarılı', 'Mesai sonlandırıldı.');
  };

  const handleCompleteTask = (taskId) => {
    Alert.alert(
      'Görevi Tamamla',
      'Fotoğraf yüklemek ister misiniz?',
      [
        { text: 'Fotoğrafsız Tamamla', onPress: () => completeTask(taskId, 'https://via.placeholder.com/150') },
        { text: 'Fotoğraf Yükle', onPress: () => {
          // Simüle edilmiş fotoğraf yükleme
          completeTask(taskId, 'https://images.unsplash.com/photo-1556740734-7f9a2b7a0f42?auto=format&fit=crop&w=400');
          Alert.alert('Başarılı', 'Fotoğraf yüklendi ve görev tamamlandı.');
        }}
      ]
    );
  };

  const handleSubmitRequest = () => {
    if (!requestForm.reason || !requestForm.date) {
      Alert.alert('Hata', 'Tüm alanları doldurun.');
      return;
    }
    addRequest({ ...requestForm, staffId: currentUser.id });
    Alert.alert('Başarılı', 'Talebiniz yöneticiye iletildi.');
    setRequestForm({ type: 'leave', reason: '', date: '' });
    setShowRequestForm(false);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Üst Bilgi */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Personel Portalı</Text>
        <Text style={styles.headerSubtitle}>{currentUser?.name} • {isCheckedIn ? 'Çalışıyor' : 'Mesai Dışı'}</Text>
      </View>

      {/* Giriş / Çıkış Aksiyonu */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: isCheckedIn ? COLORS.danger : COLORS.success }]} 
          onPress={isCheckedIn ? handleCheckOut : handleCheckIn}
        >
          <Text style={styles.actionBtnText}>{isCheckedIn ? '⏹️ Mesaiyi Bitir' : '🚀 Mesaiyi Başlat (QR/Konum)'}</Text>
        </TouchableOpacity>
      </View>

      {/* Görevlerim */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Görevlerim</Text>
        {myTasks.length === 0 && <Text style={styles.emptyText}>Henüz görev atanmamış.</Text>}
        {myTasks.map(task => (
          <View key={task.id} style={[styles.card, task.status === 'completed' && { opacity: 0.6 }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{task.title}</Text>
              <View style={[styles.badge, { backgroundColor: task.status === 'completed' ? COLORS.success : COLORS.warning }]}>
                <Text style={styles.badgeText}>{task.status === 'completed' ? 'Tamamlandı' : 'Bekliyor'}</Text>
              </View>
            </View>
            <Text style={styles.cardDesc}>{task.description}</Text>
            {task.status === 'pending' && (
              <TouchableOpacity style={styles.completeBtn} onPress={() => handleCompleteTask(task.id)}>
                <Text style={styles.completeBtnText}>✓ Tamamlandı Olarak İşaretle</Text>
              </TouchableOpacity>
            )}
            {task.photoUrl && (
              <Image source={{ uri: task.photoUrl }} style={styles.taskImage} />
            )}
          </View>
        ))}
      </View>

      {/* Taleplerim */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>📩 Taleplerim</Text>
          <TouchableOpacity onPress={() => setShowRequestForm(!showRequestForm)}>
            <Text style={{ color: COLORS.primary, fontWeight: '700' }}>{showRequestForm ? 'Kapat' : '＋ Yeni Talep'}</Text>
          </TouchableOpacity>
        </View>

        {showRequestForm && (
          <View style={styles.requestForm}>
            <View style={styles.typeToggle}>
              <TouchableOpacity style={[styles.typeBtn, requestForm.type === 'leave' && styles.typeBtnActive]} onPress={() => setRequestForm({...requestForm, type: 'leave'})}>
                <Text style={[styles.typeBtnText, requestForm.type === 'leave' && { color: '#fff' }]}>İzin</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.typeBtn, requestForm.type === 'late' && styles.typeBtnActive]} onPress={() => setRequestForm({...requestForm, type: 'late'})}>
                <Text style={[styles.typeBtnText, requestForm.type === 'late' && { color: '#fff' }]}>Geç Giriş</Text>
              </TouchableOpacity>
            </View>
            <TextInput 
              style={styles.input} 
              placeholder="Tarih (örn: 20 Mayıs)" 
              value={requestForm.date}
              onChangeText={(v) => setRequestForm({...requestForm, date: v})}
            />
            <TextInput 
              style={[styles.input, { height: 80 }]} 
              placeholder="Açıklama / Sebep" 
              multiline
              value={requestForm.reason}
              onChangeText={(v) => setRequestForm({...requestForm, reason: v})}
            />
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitRequest}>
              <Text style={styles.submitBtnText}>Talebi Gönder</Text>
            </TouchableOpacity>
          </View>
        )}

        {requests.filter(r => r.staffId === currentUser?.id).map(req => (
          <View key={req.id} style={styles.miniCard}>
            <Text style={styles.miniCardText}>{req.type === 'leave' ? '🌴 İzin' : '⏰ Geç Giriş'} - {req.date}</Text>
            <View style={[styles.badge, { backgroundColor: req.status === 'approved' ? COLORS.success : req.status === 'rejected' ? COLORS.danger : COLORS.warning }]}>
              <Text style={styles.badgeText}>{req.status.toUpperCase()}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
  header: { marginBottom: 24 },
  headerTitle: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.textPrimary },
  headerSubtitle: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  actionBtn: { padding: 20, borderRadius: BORDER_RADIUS.lg, alignItems: 'center', ...SHADOWS.md },
  actionBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  card: { backgroundColor: COLORS.surface, padding: 16, borderRadius: BORDER_RADIUS.lg, marginBottom: 12, ...SHADOWS.sm, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  cardDesc: { color: COLORS.textSecondary, marginBottom: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  completeBtn: { backgroundColor: COLORS.primary + '20', padding: 10, borderRadius: BORDER_RADIUS.md, alignItems: 'center' },
  completeBtnText: { color: COLORS.primary, fontWeight: '700' },
  taskImage: { width: '100%', height: 150, borderRadius: BORDER_RADIUS.md, marginTop: 12 },
  miniCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.surface, padding: 12, borderRadius: BORDER_RADIUS.md, marginBottom: 8 },
  miniCardText: { color: COLORS.textPrimary, fontWeight: '600' },
  requestForm: { backgroundColor: COLORS.surfaceLight, padding: 16, borderRadius: BORDER_RADIUS.lg, marginBottom: 16 },
  typeToggle: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  typeBtn: { flex: 1, padding: 10, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  typeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeBtnText: { fontWeight: '700', color: COLORS.textSecondary },
  input: { backgroundColor: '#fff', borderRadius: BORDER_RADIUS.md, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  submitBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: BORDER_RADIUS.md, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '800' },
  emptyText: { color: COLORS.textMuted, fontStyle: 'italic' }
});

export default StaffPortalScreen;
