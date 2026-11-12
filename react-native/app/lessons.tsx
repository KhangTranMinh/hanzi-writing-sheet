import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { lessons } from '../lib/lessons-data';

export default function LessonsScreen() {
  const [part, setPart] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const ids = Object.keys(lessons).sort();
  const parts = [...new Set(ids.map(id => id.slice(0, 4)))];
  const lesson = selected ? lessons[selected] : null;
  return <SafeAreaView style={styles.screen}><ScrollView contentContainerStyle={styles.content}>
    <Text accessibilityRole="link" onPress={() => selected ? setSelected(null) : router.back()} style={styles.back}>{selected ? '← Danh sách bài học' : '← Trang chủ'}</Text>
    <Text style={styles.eyebrow}>HANZI WRITING PRACTICE</Text>
    <Text style={styles.title}>{lesson && selected ? `Bài ${Number(selected.slice(5))} · ${lesson.title}` : 'Bài học'}</Text>
    <Text style={styles.subtitle}>{selected ? `Phần ${Number(selected.slice(0, 4))} · Bài ${Number(selected.slice(5))}` : 'Chọn phần và bài học để xem các thẻ chữ Hán.'}</Text>
    {lesson ? lesson.items.map((item, index) => <View key={index} style={styles.card}>
      <Text style={styles.hanzi}>{item.hanzi}</Text><Text style={styles.dot}>•</Text><Text style={styles.pinyin}>{item.pinyin}</Text><Text style={styles.dot}>•</Text><Text style={styles.meaning}>{item.meaning}</Text>
    </View>) : parts.map(id => {
      const entries = ids.filter(item => item.startsWith(`${id}-`));
      return <View key={id} style={styles.section}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: part === id }} onPress={() => setPart(part === id ? null : id)} style={styles.sectionTitle}>
          <Text style={styles.name}>Phần {Number(id)}</Text><Text style={styles.detail}>{entries.length} bài học</Text>
        </Pressable>
        {part === id && <View style={styles.list}>{entries.map(item => <Pressable key={item} accessibilityRole="button" onPress={() => setSelected(item)} style={styles.lesson}>
          <Text style={styles.name}>Bài {Number(item.slice(5))} · {lessons[item].title}</Text><Text style={styles.arrow}>→</Text>
        </Pressable>)}</View>}
      </View>;
    })}
    {lesson && !lesson.items.length && <Text style={styles.subtitle}>Bài học này chưa có thẻ.</Text>}
    {!ids.length && <Text style={styles.subtitle}>Chưa có bài học nào.</Text>}
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6f4ef' }, content: { padding: 20, paddingTop: 30, width: '100%', maxWidth: 760, alignSelf: 'center' }, back: { color: '#536b47', fontWeight: '700', marginBottom: 28 }, eyebrow: { color: '#66775a', fontSize: 11, fontWeight: '800', letterSpacing: 1.8 }, title: { color: '#26251f', fontFamily: 'serif', fontSize: 34, marginTop: 12 }, subtitle: { color: '#6e6b62', fontSize: 15, lineHeight: 23, marginTop: 8, marginBottom: 26 },
  section: { borderWidth: 1, borderColor: '#e5e1d8', borderRadius: 16, backgroundColor: '#fff', marginBottom: 14 }, sectionTitle: { padding: 24 }, name: { color: '#26251f', fontSize: 17, fontWeight: '700', flexShrink: 1 }, detail: { color: '#77746b', fontSize: 13, marginTop: 6 }, list: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 }, lesson: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderWidth: 1, borderColor: '#e5e1d8', borderRadius: 10 }, arrow: { color: '#819275', fontSize: 20 }, card: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, marginBottom: 14, borderWidth: 1, borderColor: '#e5e1d8', borderRadius: 16, backgroundColor: '#fffefa' }, hanzi: { color: '#26251f', fontSize: 42 }, pinyin: { color: '#536b47', fontSize: 17 }, meaning: { color: '#6e6b62', fontSize: 15 }, dot: { color: '#c45b50', fontSize: 16 },
});
