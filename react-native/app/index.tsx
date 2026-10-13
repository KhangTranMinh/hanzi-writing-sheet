import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import ExpoBottomSheet, {
  BottomSheet as NativeBottomSheet,
  BottomSheetView,
} from '@expo/ui/community/bottom-sheet';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  parseCharacters,
  renderBlankHtml,
  renderWorksheetHtml,
  type WorksheetMode,
} from '../lib/worksheet';

const sampleInput = '陈明康\n陈日东\n咖啡';
const MIN_LOADING_DURATION_MS = 650;
const SHEET_TRANSITION_DELAY_MS = 250;

export default function GeneratorScreen() {
  const [mode, setMode] = useState<WorksheetMode>('characters');
  const [input, setInput] = useState(sampleInput);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const sheetRef = useRef<NativeBottomSheet>(null);
  const pendingSheetPresentation = useRef(false);
  const pendingSheetAction = useRef<(() => void) | null>(null);

  async function printWorksheet(html: string) {
    setBusy(true);
    setMessage('');
    try {
      await Print.printAsync({ html });
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Không mở được màn hình in.');
    } finally {
      setBusy(false);
    }
  }

  async function sharePdf(html: string) {
    setBusy(true);
    setMessage('');
    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (!(await Sharing.isAvailableAsync())) {
        setMessage(`PDF đã tạo tại ${uri}, nhưng chia sẻ tệp hiện không khả dụng.`);
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        UTI: '.pdf',
        dialogTitle: 'Chia sẻ worksheet PDF',
      });
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Không thể tạo PDF.');
    } finally {
      setBusy(false);
    }
  }

  async function generate() {
    if (busy) return;
    if (mode === 'characters' && parseCharacters(input).length === 0) {
      setMessage('Hãy nhập ít nhất một chữ Hán.');
      return;
    }

    const startedAt = Date.now();
    setMessage('');
    setBusy(true);
    setGenerating(true);
    try {
      const html = mode === 'blank' ? renderBlankHtml() : await renderWorksheetHtml(input);
      setGeneratedHtml(html);
      pendingSheetPresentation.current = true;
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Không thể tạo trang.');
    } finally {
      const remainingLoadingTime = MIN_LOADING_DURATION_MS - (Date.now() - startedAt);
      if (remainingLoadingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingLoadingTime));
      }
      setGenerating(false);
      setBusy(false);
    }
  }

  useEffect(() => {
    if (generating || !generatedHtml || !pendingSheetPresentation.current) return;

    pendingSheetPresentation.current = false;
    // Let the loading dialog finish closing before presenting the native sheet.
    const timeout = setTimeout(() => sheetRef.current?.present(), SHEET_TRANSITION_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [generating, generatedHtml]);

  function dismissSheetThen(action: () => void) {
    pendingSheetAction.current = action;
    sheetRef.current?.dismiss();
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.eyebrow}>HANZI WRITING SHEET</Text>
            <Text style={styles.title}>Tạo trang luyện viết</Text>
            <Text style={styles.subtitle}>
              Nhập chữ Hán để tạo worksheet, hoặc chọn trang trống để tự luyện viết.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Chọn loại trang</Text>
            <ModeOption
              selected={mode === 'characters'}
              title="Luyện chữ Hán"
              detail="Nhập chữ theo dòng như trong characters.txt"
              onPress={() => {
                setMode('characters');
                setMessage('');
              }}
            />
            <ModeOption
              selected={mode === 'blank'}
              title="Trang trống"
              detail="Tạo lưới ô vuông, không cần nhập chữ"
              onPress={() => {
                setMode('blank');
                setMessage('');
              }}
            />

            {mode === 'characters' ? (
              <View style={styles.inputArea}>
                <Text style={styles.sectionTitle}>Danh sách chữ Hán</Text>
                <TextInput
                  accessibilityLabel="Danh sách chữ Hán"
                  value={input}
                  onChangeText={(value) => {
                    setInput(value);
                    if (message) setMessage('');
                  }}
                  placeholder={'陈明康\n陈日东\n咖啡'}
                  placeholderTextColor="#aaa69d"
                  multiline
                  textAlignVertical="top"
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                  style={styles.textInput}
                />
                <Text style={styles.hint}>
                  Có thể nhập nhiều chữ trên mỗi dòng. Ký tự trùng lặp sẽ chỉ xuất hiện một lần.
                </Text>
              </View>
            ) : (
              <View style={styles.blankNote}>
                <Text style={styles.blankIcon}>▦</Text>
                <Text style={styles.blankNoteText}>
                  Mỗi trang có 11 cột × 16 hàng ô luyện viết.
                </Text>
              </View>
            )}

            {message ? <Text style={styles.message}>{message}</Text> : null}

            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={generate}
              style={({ pressed }) => [
                styles.generateButton,
                busy && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
            >
              {busy ? (
                <View style={styles.busyContent}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.generateLabel}>Đang tạo…</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.generateLabel}>Tạo trang</Text>
                  <Text style={styles.generateArrow}>↗</Text>
                </>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Sau khi tạo, chọn in hoặc chia sẻ PDF.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <ExpoBottomSheet
        ref={sheetRef}
        index={-1}
        enablePanDownToClose
        onDismiss={() => {
          const action = pendingSheetAction.current;
          pendingSheetAction.current = null;
          action?.();
        }}
      >
        <BottomSheetView style={styles.sheet}>
            <Text style={styles.sheetTitle}>Trang đã sẵn sàng</Text>
            <Text style={styles.sheetSubtitle}>Chọn cách bạn muốn sử dụng worksheet.</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                const html = generatedHtml;
                if (html) dismissSheetThen(() => void printWorksheet(html));
              }}
              style={({ pressed }) => [styles.sheetAction, pressed && styles.sheetActionPressed]}
            >
              <View style={styles.sheetIcon}><Text style={styles.sheetIconText}>▤</Text></View>
              <View style={styles.sheetActionCopy}>
                <Text style={styles.sheetActionTitle}>In / lưu PDF</Text>
                <Text style={styles.sheetActionDetail}>Mở tùy chọn in trên thiết bị</Text>
              </View>
              <Text style={styles.sheetArrow}>›</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                const html = generatedHtml;
                if (html) dismissSheetThen(() => void sharePdf(html));
              }}
              style={({ pressed }) => [styles.sheetAction, pressed && styles.sheetActionPressed]}
            >
              <View style={styles.sheetIcon}><Text style={styles.sheetIconText}>↗</Text></View>
              <View style={styles.sheetActionCopy}>
                <Text style={styles.sheetActionTitle}>Chia sẻ PDF</Text>
                <Text style={styles.sheetActionDetail}>Gửi tệp PDF qua ứng dụng khác</Text>
              </View>
              <Text style={styles.sheetArrow}>›</Text>
            </Pressable>
        </BottomSheetView>
      </ExpoBottomSheet>
      <Modal
        animationType="fade"
        transparent
        visible={generating}
        onRequestClose={() => undefined}
        statusBarTranslucent
      >
        <View style={styles.progressOverlay}>
          <View style={styles.progressDialog}>
            <ActivityIndicator size="large" color="#536b47" />
            <Text style={styles.progressTitle}>Đang tạo trang</Text>
            <Text style={styles.progressDetail}>
              Đang chuẩn bị worksheet và tải dữ liệu nét chữ nếu cần. Vui lòng đợi.
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

type ModeOptionProps = {
  selected: boolean;
  title: string;
  detail: string;
  onPress: () => void;
};

function ModeOption({ selected, title, detail, onPress }: ModeOptionProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.modeOption,
        selected && styles.modeOptionSelected,
        pressed && styles.modeOptionPressed,
      ]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      <View style={styles.modeCopy}>
        <Text style={styles.modeTitle}>{title}</Text>
        <Text style={styles.modeDetail}>{detail}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f6f4ef' },
  flex: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 20, paddingTop: 30, paddingBottom: 28 },
  header: { marginBottom: 24 },
  eyebrow: { color: '#66775a', fontSize: 11, fontWeight: '800', letterSpacing: 1.8 },
  title: { marginTop: 10, color: '#26251f', fontFamily: 'serif', fontSize: 36, lineHeight: 43, fontWeight: '500' },
  subtitle: { marginTop: 8, color: '#6e6b62', fontSize: 15, lineHeight: 23 },
  card: { padding: 20, borderRadius: 15, borderWidth: 1, borderColor: '#e5e1d8', backgroundColor: '#ffffff', shadowColor: '#373123', shadowOpacity: 0.07, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
  sectionTitle: { marginBottom: 11, color: '#4e4c44', fontSize: 13, fontWeight: '700' },
  modeOption: { minHeight: 67, flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 13, marginBottom: 9, borderWidth: 1, borderColor: '#e6e3dc', borderRadius: 10, backgroundColor: '#fff' },
  modeOptionSelected: { borderColor: '#839374', backgroundColor: '#f5f8f2' },
  modeOptionPressed: { opacity: 0.8 },
  radio: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center', marginTop: 1, borderWidth: 1.5, borderColor: '#88877f', borderRadius: 10 },
  radioSelected: { borderColor: '#536b47' },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#536b47' },
  modeCopy: { flex: 1, gap: 3 },
  modeTitle: { color: '#33322d', fontSize: 14, fontWeight: '700' },
  modeDetail: { color: '#77746b', fontSize: 12, lineHeight: 18 },
  inputArea: { marginTop: 12 },
  textInput: { minHeight: 155, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, borderColor: '#dcd8ce', borderRadius: 9, backgroundColor: '#fffefa', color: '#292821', fontSize: 16, lineHeight: 27 },
  hint: { marginTop: 7, color: '#77746b', fontSize: 12, lineHeight: 18 },
  blankNote: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, padding: 14, borderRadius: 9, backgroundColor: '#f7f6f1' },
  blankIcon: { color: '#536b47', fontSize: 28 },
  blankNoteText: { flex: 1, color: '#666258', fontSize: 13, lineHeight: 19 },
  message: { marginTop: 13, color: '#a13d30', fontSize: 13, lineHeight: 19 },
  generateButton: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingHorizontal: 19, paddingVertical: 15, borderRadius: 9, backgroundColor: '#536b47' },
  buttonPressed: { backgroundColor: '#43583a' },
  buttonDisabled: { opacity: 0.75 },
  busyContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sheet: { paddingHorizontal: 22, paddingTop: 26, paddingBottom: 32, backgroundColor: '#fbfaf7' },
  sheetTitle: { color: '#292821', fontSize: 20, fontWeight: '700' },
  sheetSubtitle: { marginTop: 5, marginBottom: 18, color: '#77746b', fontSize: 13, lineHeight: 19 },
  sheetAction: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 9, paddingHorizontal: 13, borderWidth: 1, borderColor: '#e8e4da', borderRadius: 13, backgroundColor: '#fff' },
  sheetActionPressed: { opacity: 0.72 },
  sheetIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#f0f3ec' },
  sheetIconText: { color: '#536b47', fontSize: 24, fontWeight: '600' },
  sheetActionCopy: { flex: 1, gap: 3 },
  sheetActionTitle: { color: '#33322d', fontSize: 14, fontWeight: '700' },
  sheetActionDetail: { color: '#77746b', fontSize: 12, lineHeight: 17 },
  sheetArrow: { color: '#908d83', fontSize: 26 },
  progressOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: 'rgba(29, 28, 24, 0.38)' },
  progressDialog: { width: '100%', maxWidth: 360, alignItems: 'center', paddingHorizontal: 26, paddingVertical: 28, borderRadius: 20, backgroundColor: '#fbfaf7', elevation: 8 },
  progressTitle: { marginTop: 18, color: '#292821', fontSize: 18, fontWeight: '700' },
  progressDetail: { marginTop: 8, color: '#77746b', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  generateLabel: { color: '#fff', fontSize: 15, fontWeight: '700' },
  generateArrow: { color: '#fff', fontSize: 19, fontWeight: '700' },
  footer: { gap: 5, marginTop: 17 },
  footerText: { color: '#77746b', fontSize: 11, lineHeight: 16 },
});
