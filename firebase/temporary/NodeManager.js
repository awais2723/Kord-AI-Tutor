// File: NotesManager.js
// A full-featured notes manager for React Native with Context, AsyncStorage,
// search, tags, markdown preview, and export/import functionality.
// Drop this file into your project and import NotesProvider and NotesApp where needed.

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Clipboard,
  ScrollView,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------- Utilities ----------
const STORAGE_KEY = '@rn_notes_v1';

const uid = () => Math.random().toString(36).slice(2, 9);

const nowISO = () => new Date().toISOString();

function simpleMarkdownToText(md) {
  // Extremely small markdown -> plain text conversion for preview (no libs)
  return md
    .replace(/\*\*(.*?)\*\*/g, (_, g) => g)
    .replace(/\*(.*?)\*/g, (_, g) => g)
    .replace(/\`(.*?)\`/g, (_, g) => g)
    .replace(/\[(.*?)\]\((.*?)\)/g, (_, g) => g)
    .replace(/\!\[(.*?)\]\((.*?)\)/g, (_, g) => g)
    .replace(/#+\s/g, '');
}

// ---------- Context & Reducer ----------
const NotesContext = createContext(null);

const initialState = {
  notes: [],
  initialized: false,
};

function notesReducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return { ...state, notes: action.payload || [], initialized: true };
    case 'ADD':
      return { ...state, notes: [action.payload, ...state.notes] };
    case 'UPDATE':
      return {
        ...state,
        notes: state.notes.map(n => (n.id === action.payload.id ? action.payload : n)),
      };
    case 'DELETE':
      return { ...state, notes: state.notes.filter(n => n.id !== action.payload) };
    case 'SET':
      return { ...state, notes: action.payload };
    default:
      return state;
  }
}

export function NotesProvider({ children }) {
  const [state, dispatch] = useReducer(notesReducer, initialState);
  const savingRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) dispatch({ type: 'INIT', payload: JSON.parse(raw) });
        else dispatch({ type: 'INIT', payload: [] });
      } catch (e) {
        console.warn('Failed to load notes', e);
        dispatch({ type: 'INIT', payload: [] });
      }
    })();
  }, []);

  // Persist notes on change (debounced/simple guard)
  useEffect(() => {
    if (!state.initialized) return;
    if (savingRef.current) return;
    savingRef.current = true;
    const s = setTimeout(async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.notes));
      } catch (e) {
        console.warn('Failed to save notes', e);
      }
      savingRef.current = false;
    }, 400);
    return () => clearTimeout(s);
  }, [state.notes, state.initialized]);

  const api = useMemo(
    () => ({
      list: () => state.notes,
      create: ({ title = '', body = '', tags = [] } = {}) => {
        const newNote = {
          id: uid(),
          title: title || 'Untitled',
          body: body || '',
          tags: Array.isArray(tags) ? tags : [],
          createdAt: nowISO(),
          updatedAt: nowISO(),
        };
        dispatch({ type: 'ADD', payload: newNote });
        return newNote;
      },
      update: note => {
        const updated = { ...note, updatedAt: nowISO() };
        dispatch({ type: 'UPDATE', payload: updated });
        return updated;
      },
      del: id => {
        dispatch({ type: 'DELETE', payload: id });
      },
      importNotes: async json => {
        try {
          const parsed = typeof json === 'string' ? JSON.parse(json) : json;
          if (!Array.isArray(parsed)) throw new Error('Invalid format');
          const merged = [...parsed, ...state.notes];
          dispatch({ type: 'SET', payload: merged });
        } catch (e) {
          throw e;
        }
      },
      exportNotes: () => JSON.stringify(state.notes, null, 2),
    }),
    [state.notes]
  );

  return <NotesContext.Provider value={api}>{children}</NotesContext.Provider>;
}

export function useNotes() {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error('useNotes must be used within NotesProvider');
  return ctx;
}

// ---------- Notes App UI Component ----------
export default function NotesApp() {
  return (
    <NotesProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <NotesScreen />
      </SafeAreaView>
    </NotesProvider>
  );
}

function NotesScreen() {
  const api = useNotes();
  const [query, setQuery] = useState('');
  const [tagFilter, setTagFilter] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    setSearchResults(api.list());
  }, []);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    const all = api.list();
    let filtered = all;
    if (q) {
      filtered = all.filter(n =>
        (n.title + ' ' + n.body + ' ' + n.tags.join(' ')).toLowerCase().includes(q)
      );
    }
    if (tagFilter) filtered = filtered.filter(n => n.tags.includes(tagFilter));
    setSearchResults(filtered);
  }, [query, tagFilter, api]);

  function openNew() {
    const n = api.create({ title: 'New note', body: '' });
    setEditingNote(n);
    setModalVisible(true);
  }

  function openEdit(note) {
    setEditingNote(note);
    setModalVisible(true);
  }

  function handleDelete(note) {
    Alert.alert('Delete note', `Delete '${note.title}'?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => api.del(note.id),
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Notes</Text>
        <TouchableOpacity onPress={openNew} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search notes or full text..."
          style={styles.searchInput}
        />
        <TouchableOpacity onPress={() => setShowPreview(p => !p)} style={styles.smallBtn}>
          <Text>{showPreview ? 'Editor' : 'Preview'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={searchResults}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => openEdit(item)} style={styles.noteCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.noteTitle}>{item.title}</Text>
              <TouchableOpacity onPress={() => handleDelete(item)}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.notePreview}>{simpleMarkdownToText(item.body).slice(0, 120)}</Text>
            <View style={styles.tagRow}>
              {item.tags.slice(0, 4).map(t => (
                <Text key={t} style={styles.tag}>
                  {t}
                </Text>
              ))}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyBox}>
            <Text>No notes yet — create your first note.</Text>
          </View>
        )}
      />

      <NotesModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        note={editingNote}
        onSave={note => {
          api.update(note);
          setModalVisible(false);
        }}
        onExport={() => {
          const exported = api.exportNotes();
          Clipboard.setString(exported);
          Alert.alert('Exported', 'Notes JSON copied to clipboard');
        }}
        onImport={async json => {
          try {
            await api.importNotes(json);
            Alert.alert('Imported', 'Notes imported successfully');
          } catch (e) {
            Alert.alert('Import failed', e.message || String(e));
          }
        }}
        showPreviewToggle={showPreview}
      />
    </View>
  );
}

function NotesModal({ visible, onClose, note, onSave, onExport, onImport, showPreviewToggle }) {
  const [local, setLocal] = useState(note || null);
  const [importText, setImportText] = useState('');

  useEffect(() => setLocal(note ? { ...note } : null), [note]);

  if (!local) return null;

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: 'padding', android: undefined })}
          style={{ flex: 1 }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 16 }}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                onSave(local);
              }}>
              <Text style={{ fontSize: 16, fontWeight: '600' }}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 12 }}>
            <TextInput
              value={local.title}
              onChangeText={t => setLocal(s => ({ ...s, title: t }))}
              placeholder="Title"
              style={styles.titleInput}
            />

            {showPreviewToggle ? (
              <View style={styles.previewBox}>
                <Text style={{ fontWeight: '600' }}>Preview</Text>
                <Text>{simpleMarkdownToText(local.body)}</Text>
              </View>
            ) : (
              <TextInput
                value={local.body}
                onChangeText={t => setLocal(s => ({ ...s, body: t }))}
                placeholder="Write your note. Markdown supported (basic)."
                multiline
                style={styles.bodyInput}
              />
            )}

            <View style={{ marginTop: 12 }}>
              <Text style={{ marginBottom: 6 }}>Tags (comma separated)</Text>
              <TextInput
                value={(local.tags || []).join(',')}
                onChangeText={t =>
                  setLocal(s => ({
                    ...s,
                    tags: t
                      .split(',')
                      .map(x => x.trim())
                      .filter(Boolean),
                  }))
                }
                placeholder="eg: work,ideas,personal"
                style={styles.tagsInput}
              />
            </View>

            <View style={{ marginTop: 20 }}>
              <Text style={{ marginBottom: 6 }}>Import notes (paste JSON)</Text>
              <TextInput
                value={importText}
                onChangeText={setImportText}
                placeholder="Paste JSON array of notes"
                multiline
                style={styles.importInput}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <TouchableOpacity
                  onPress={() => {
                    if (!importText) return Alert.alert('Paste JSON first');
                    try {
                      const parsed = JSON.parse(importText);
                      onImport(parsed);
                    } catch (e) {
                      Alert.alert('Invalid JSON', 'Please paste a valid JSON array');
                    }
                  }}
                  style={styles.importBtn}>
                  <Text>Import</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={onExport} style={styles.importBtn}>
                  <Text>Export all</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  header: { fontSize: 24, fontWeight: '700' },
  addBtn: {
    backgroundColor: '#e6e6e6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: { fontWeight: '700' },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 8 },
  smallBtn: { padding: 8, marginLeft: 8, borderRadius: 6, borderWidth: 1, borderColor: '#ddd' },
  noteCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  noteTitle: { fontSize: 16, fontWeight: '700' },
  notePreview: { marginTop: 6, color: '#333' },
  deleteText: { color: '#b00' },
  tagRow: { flexDirection: 'row', marginTop: 8, flexWrap: 'wrap' },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 6,
    marginTop: 6,
  },
  emptyBox: { padding: 20, alignItems: 'center' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '700',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingBottom: 8,
  },
  bodyInput: {
    height: 220,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#eee',
    marginTop: 12,
    padding: 8,
    borderRadius: 8,
  },
  tagsInput: { borderWidth: 1, borderColor: '#eee', padding: 8, borderRadius: 8 },
  importInput: {
    height: 120,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  importBtn: { padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 8 },
  previewBox: { padding: 12, borderWidth: 1, borderColor: '#f0f0f0', borderRadius: 8 },
});
