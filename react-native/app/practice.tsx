import { router } from 'expo-router';
import { pinyin } from 'pinyin-pro';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import practiceData from '../data/practice/data.json';

type Card = { hanzi: string; pinyin?: string; meaning?: string };
function shuffled(): Card[] {
  const result: Card[] = practiceData.map(item => ({ ...item, pinyin: item.pinyin?.trim() || pinyin(item.hanzi) }));
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export default function PracticeScreen() {
  const [items, setItems] = useState(shuffled);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const current = items[index];
  function next() { if (!revealed) setRevealed(true); else { setIndex(index + 1); setRevealed(false); } }
  return <SafeAreaView style={styles.screen}><ScrollView contentContainerStyle={styles.content}>
    <Text accessibilityRole="link" onPress={() => router.back()} style={styles.back}>← Trang chủ</Text>
    <Text style={styles.eyebrow}>HANZI WRITING PRACTICE</Text><Text style={styles.title}>Luyện tập</Text>
    <Text style={styles.subtitle}>Đọc chữ Hán, rồi chạm vào thẻ để xem pinyin và nghĩa.</Text>
    <Text style={styles.status}>{current ? `Thẻ ${index + 1} / ${items.length}` : `Đã hoàn thành ${items.length} thẻ!`}</Text>
    {current ? <><Pressable accessibilityRole="button" accessibilityLabel={revealed ? `Pinyin: ${current.pinyin}. ${current.meaning ? `Nghĩa: ${current.meaning}. ` : ''}Chạm để chuyển thẻ tiếp theo` : 'Chạm để xem pinyin và nghĩa'} onPress={next} style={styles.card}>
      <Text style={styles.hanzi}>{current.hanzi}</Text>{revealed && <Text style={styles.pinyin}>{current.pinyin}</Text>}{revealed && !!current.meaning && <Text style={styles.meaning}>{current.meaning}</Text>}
    </Pressable><Text style={styles.hint}>{revealed ? 'Chạm vào thẻ để tiếp tục' : 'Chạm vào thẻ để xem pinyin và nghĩa'}</Text></> : <Pressable accessibilityRole="button" onPress={() => { setItems(shuffled()); setIndex(0); setRevealed(false); }} style={styles.retry}><Text style={styles.retryText}>Luyện lại</Text></Pressable>}
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6f4ef' }, content: { padding: 20, paddingTop: 30, width: '100%', maxWidth: 520, alignSelf: 'center' }, back: { color: '#536b47', fontWeight: '700', marginBottom: 28 }, eyebrow: { color: '#66775a', fontSize: 11, fontWeight: '800', letterSpacing: 1.8 }, title: { color: '#26251f', fontFamily: 'serif', fontSize: 36, marginTop: 12 }, subtitle: { color: '#6e6b62', fontSize: 15, lineHeight: 23, marginTop: 8, marginBottom: 26 }, status: { color: '#66775a', fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 16 }, card: { minHeight: 280, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: '#fffefa', borderWidth: 1, borderColor: '#e5e1d8', borderRadius: 18 }, hanzi: { color: '#26251f', fontSize: 56, textAlign: 'center' }, pinyin: { color: '#536b47', fontSize: 26, textAlign: 'center' }, meaning: { color: '#6e6b62', fontSize: 19, textAlign: 'center' }, hint: { color: '#77746b', textAlign: 'center', marginTop: 15 }, retry: { backgroundColor: '#536b47', padding: 18, borderRadius: 9 }, retryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
