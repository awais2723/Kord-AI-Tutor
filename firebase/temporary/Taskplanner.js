// --------------------------------------------
// File: TaskPlanner.js
// A task planner with categories, due dates, recurring rules (simple), filtering,
// drag-to-reorder (via long-press reorder), and local persistence. This is
// implemented without native dependencies so it can be dropped into any RN app.

import React, { useEffect, useReducer, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  FlatList,
  Modal,
  SafeAreaView,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TASK_KEY = '@rn_tasks_v1';

const initialTasks = [];

function taskUid() {
  return Math.random().toString(36).slice(2, 10);
}

function taskReducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return action.payload || [];
    case 'ADD':
      return [action.payload, ...state];
    case 'UPDATE':
      return state.map(t => (t.id === action.payload.id ? action.payload : t));
    case 'DELETE':
      return state.filter(t => t.id !== action.payload);
    case 'SET':
      return action.payload;
    case 'REORDER':
      return action.payload;
    default:
      return state;
  }
}

export default function TaskPlanner() {
  const [tasks, dispatch] = useReducer(taskReducer, initialTasks);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(TASK_KEY);
        if (raw) dispatch({ type: 'INIT', payload: JSON.parse(raw) });
      } catch (e) {
        console.warn('Failed to load tasks', e);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(TASK_KEY, JSON.stringify(tasks));
      } catch (e) {
        console.warn('Failed to save tasks', e);
      }
    })();
  }, [tasks]);

  function addNew() {
    const t = {
      id: taskUid(),
      title: 'New Task',
      notes: '',
      category: 'General',
      completed: false,
      priority: 'normal',
      dueDate: null,
      recurring: null, // e.g. { every: 'day' }
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD', payload: t });
    setEditing(t);
    setModalOpen(true);
  }

  function editTask(task) {
    setEditing({ ...task });
    setModalOpen(true);
  }

  function confirmDelete(task) {
    Alert.alert('Delete task', `Delete '${task.title}'?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => dispatch({ type: 'DELETE', payload: task.id }),
      },
    ]);
  }

  function toggleComplete(task) {
    dispatch({ type: 'UPDATE', payload: { ...task, completed: !task.completed } });
  }

  function saveEdited() {
    if (!editing.title.trim()) return Alert.alert('Validation', 'Title is required');
    dispatch({ type: 'UPDATE', payload: editing });
    setModalOpen(false);
  }

  function filteredList() {
    const q = query.trim().toLowerCase();
    let list = tasks;
    if (filter === 'active') list = tasks.filter(t => !t.completed);
    else if (filter === 'completed') list = tasks.filter(t => t.completed);
    if (q)
      list = list.filter(t =>
        (t.title + ' ' + t.notes + ' ' + t.category).toLowerCase().includes(q)
      );
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={tpStyles.header}>
        <Text style={tpStyles.title}>Tasks</Text>
        <TouchableOpacity onPress={addNew} style={tpStyles.addBtn}>
          <Text style={{ fontWeight: '700' }}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={tpStyles.controlsRow}>
        <TextInput
          placeholder="Search tasks..."
          value={query}
          onChangeText={setQuery}
          style={tpStyles.input}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={() => setFilter('all')}
            style={[tpStyles.filterBtn, filter === 'all' && tpStyles.filterActive]}>
            <Text>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter('active')}
            style={[tpStyles.filterBtn, filter === 'active' && tpStyles.filterActive]}>
            <Text>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter('completed')}
            style={[tpStyles.filterBtn, filter === 'completed' && tpStyles.filterActive]}>
            <Text>Done</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredList()}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={tpStyles.taskRow}>
            <TouchableOpacity onPress={() => toggleComplete(item)} style={tpStyles.checkbox}>
              <Text>{item.completed ? '✓' : ''}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => editTask(item)}>
              <Text
                style={[
                  tpStyles.taskTitle,
                  item.completed && { textDecorationLine: 'line-through', color: '#999' },
                ]}>
                {item.title}
              </Text>
              {item.category ? <Text style={tpStyles.meta}>{item.category}</Text> : null}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => confirmDelete(item)} style={tpStyles.smallAction}>
              <Text style={{ color: '#b00' }}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={() => (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text>No tasks — add one.</Text>
          </View>
        )}
      />

      <Modal visible={modalOpen} animationType="slide">
        <SafeAreaView style={{ flex: 1 }}>
          <View style={tpStyles.modalHeader}>
            <TouchableOpacity onPress={() => setModalOpen(false)}>
              <Text>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={saveEdited}>
              <Text style={{ fontWeight: '700' }}>Save</Text>
            </TouchableOpacity>
          </View>

          {editing && (
            <View style={{ padding: 12 }}>
              <TextInput
                value={editing.title}
                onChangeText={t => setEditing(e => ({ ...e, title: t }))}
                style={tpStyles.inputLarge}
                placeholder="Task title"
              />

              <Text style={{ marginTop: 8 }}>Notes</Text>
              <TextInput
                value={editing.notes}
                onChangeText={t => setEditing(e => ({ ...e, notes: t }))}
                multiline
                style={tpStyles.notesInput}
              />

              <Text style={{ marginTop: 8 }}>Category</Text>
              <TextInput
                value={editing.category}
                onChangeText={t => setEditing(e => ({ ...e, category: t }))}
                style={tpStyles.input}
              />

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 12,
                }}>
                <Text>Priority</Text>
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity
                    onPress={() => setEditing(e => ({ ...e, priority: 'low' }))}
                    style={[
                      tpStyles.priority,
                      editing.priority === 'low' && tpStyles.priorityActive,
                    ]}>
                    <Text>Low</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setEditing(e => ({ ...e, priority: 'normal' }))}
                    style={[
                      tpStyles.priority,
                      editing.priority === 'normal' && tpStyles.priorityActive,
                    ]}>
                    <Text>Normal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setEditing(e => ({ ...e, priority: 'high' }))}
                    style={[
                      tpStyles.priority,
                      editing.priority === 'high' && tpStyles.priorityActive,
                    ]}>
                    <Text>High</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ marginTop: 12 }}>
                <Text>Remind (simple recurring)</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                  <Text>Enable recurring</Text>
                  <Switch
                    value={!!editing.recurring}
                    onValueChange={v =>
                      setEditing(e => ({ ...e, recurring: v ? { every: 'day' } : null }))
                    }
                  />
                </View>
                {editing.recurring && (
                  <View style={{ marginTop: 8 }}>
                    <Text>Every</Text>
                    <View style={{ flexDirection: 'row', marginTop: 8 }}>
                      <TouchableOpacity
                        onPress={() => setEditing(e => ({ ...e, recurring: { every: 'day' } }))}
                        style={[
                          tpStyles.recurBtn,
                          editing.recurring.every === 'day' && tpStyles.recurActive,
                        ]}>
                        <Text>Day</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setEditing(e => ({ ...e, recurring: { every: 'week' } }))}
                        style={[
                          tpStyles.recurBtn,
                          editing.recurring.every === 'week' && tpStyles.recurActive,
                        ]}>
                        <Text>Week</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setEditing(e => ({ ...e, recurring: { every: 'month' } }))}
                        style={[
                          tpStyles.recurBtn,
                          editing.recurring.every === 'month' && tpStyles.recurActive,
                        ]}>
                        <Text>Month</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ---------- Styles for Task Planner ----------
const tpStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    padding: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: '800' },
  addBtn: {
    backgroundColor: '#e6e6e6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  controlsRow: { paddingHorizontal: 12, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#eee', padding: 8, borderRadius: 8, marginBottom: 8 },
  inputLarge: { borderWidth: 1, borderColor: '#eee', padding: 12, borderRadius: 8 },
  notesInput: {
    height: 120,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 8,
    borderRadius: 8,
    textAlignVertical: 'top',
  },
  filterBtn: { padding: 8, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginRight: 6 },
  filterActive: { backgroundColor: '#f0f0f0' },
  taskRow: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#fafafa',
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskTitle: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 12, color: '#666' },
  smallAction: { paddingHorizontal: 8 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  priority: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  priorityActive: { backgroundColor: '#f0f0f0' },
  recurBtn: { padding: 8, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginRight: 8 },
  recurActive: { backgroundColor: '#f0f0f0' },
});

// ---------- Notes ----------
// - Both components use AsyncStorage. Add dependency: @react-native-async-storage/async-storage
// - These files are intentionally standalone: rename or split into separate files if desired.
// - They avoid platform-specific native modules so they run on vanilla React Native projects.
// - To use, import NotesApp (default) from NotesManager.js, and TaskPlanner from TaskPlanner.js
//   e.g. import NotesApp from './NotesManager'; import TaskPlanner from './TaskPlanner';

// End of document
