import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return <SafeAreaView style={styles.screen}><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.eyebrow}>HANZI WRITING PRACTICE</Text>
    <Text style={styles.title}>Cùng luyện chữ Hán</Text>
    <Text style={styles.subtitle}>Chọn một cách học để bắt đầu.</Text>
    {([
      ['/worksheet', '✎', 'Tạo trang luyện viết', 'Tạo trang tập viết chữ Hán hoặc trang ô trống để in.'],
      ['/lessons', '学', 'Bài học', 'Chọn bài học và xem chữ Hán, pinyin cùng nghĩa.'],
      ['/practice', '字', 'Luyện tập', 'Ôn chữ Hán và pinyin với các thẻ ghi nhớ.'],
    ] as const).map(([path, icon, title, detail]) => <Pressable key={path} accessibilityRole="button" onPress={() => router.push(path)} style={styles.option}>
      <View style={styles.icon}><Text style={styles.iconText}>{icon}</Text></View>
      <View style={styles.copy}><Text style={styles.optionTitle}>{title}</Text><Text style={styles.detail}>{detail}</Text></View>
      <Text style={styles.arrow}>↗</Text>
    </Pressable>)}
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6f4ef' }, content: { padding: 20, paddingTop: 40, maxWidth: 760, width: '100%', alignSelf: 'center' },
  eyebrow: { color: '#66775a', fontSize: 11, fontWeight: '800', letterSpacing: 1.8 }, title: { marginTop: 12, fontFamily: 'serif', fontSize: 36, color: '#26251f' }, subtitle: { marginTop: 8, marginBottom: 28, color: '#6e6b62', fontSize: 15 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: '#e5e1d8', borderRadius: 16, backgroundColor: '#fff' }, icon: { width: 52, height: 52, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: '#edf3e9' }, iconText: { color: '#536b47', fontSize: 26 }, copy: { flex: 1 }, optionTitle: { fontSize: 17, fontWeight: '700', color: '#26251f' }, detail: { marginTop: 6, color: '#77746b', fontSize: 13, lineHeight: 19 }, arrow: { color: '#819275', fontSize: 20 },
});
