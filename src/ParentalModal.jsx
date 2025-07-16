import React, { useState } from 'react';
import TaskList from './components/TaskList';

const avatarOptions = [
  '/avatars/avatar1.svg',
  '/avatars/avatar2.svg',
  '/avatars/avatar3.svg',
  '/avatars/avatar4.svg'
];

export default function ParentalModal({
  onClose,
  children, setChildren,
  globalTasks, setGlobalTasks,
  globalRewards, setGlobalRewards,
  handleNewDay,
  handleParentTaskAction,
  background,
  setBackground,
  selectedChildId,
  setSelectedChildId,
}) {
  const selectedChild = children.find(c => c.id === selectedChildId);

  // --- Add Child State ---
  const [newChild, setNewChild] = useState({ name: '', avatar: avatarOptions[0] });

  // --- Task Assignment ---
  const toggleTaskForChild = (taskId) => {
    setChildren(children =>
      children.map(child =>
        child.id === selectedChildId
          ? {
              ...child,
              assignedTaskIds: child.assignedTaskIds?.includes(taskId)
                ? child.assignedTaskIds.filter(id => id !== taskId)
                : [...(child.assignedTaskIds || []), taskId]
            }
          : child
      )
    );
  };

  // --- Select All Logic ---
  const allAssigned = globalTasks.length > 0 && globalTasks.every(task =>
    selectedChild?.assignedTaskIds?.includes(task.id)
  );
  const handleSelectAll = () => {
    if (!selectedChild) return;
    setChildren(children =>
      children.map(child =>
        child.id === selectedChildId
          ? {
              ...child,
              assignedTaskIds: allAssigned
                ? []
                : globalTasks.map(task => task.id)
            }
          : child
      )
    );
  };

  // --- Global Task Management ---
  const [newTask, setNewTask] = useState({ name: '', emoji: '', reward: 1 });
  const addGlobalTask = () => {
    if (!newTask.name || !newTask.emoji) return;
    setGlobalTasks([
      ...globalTasks,
      { id: Date.now(), ...newTask }
    ]);
    setNewTask({ name: '', emoji: '', reward: 1 });
  };
  const editGlobalTask = (id, field, value) => {
    setGlobalTasks(globalTasks.map(task =>
      task.id === id ? { ...task, [field]: value } : task
    ));
  };
  const removeGlobalTask = (id) => {
    setGlobalTasks(globalTasks.filter(task => task.id !== id));
    setChildren(children =>
      children.map(child => ({
        ...child,
        assignedTaskIds: child.assignedTaskIds?.filter(tid => tid !== id) || []
      }))
    );
  };

  // --- Global Reward Management ---
  const [newReward, setNewReward] = useState({ name: '', emoji: '', cost: 1 });
  const addGlobalReward = () => {
    if (!newReward.name || !newReward.emoji || newReward.cost < 1) return;
    setGlobalRewards([
      ...globalRewards,
      { id: Date.now(), ...newReward }
    ]);
    setNewReward({ name: '', emoji: '', cost: 1 });
  };
  const editGlobalReward = (id, field, value) => {
    setGlobalRewards(globalRewards.map(reward =>
      reward.id === id ? { ...reward, [field]: value } : reward
    ));
  };
  const removeGlobalReward = (id) => {
    setGlobalRewards(globalRewards.filter(reward => reward.id !== id));
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background }}
    >
      <div className="bg-white rounded-xl shadow-lg p-6 w-[32rem] max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">Parent Dashboard</h2>
        <BackgroundPicker background={background} setBackground={setBackground} />
        <button
          className="w-full bg-yellow-400 text-white py-2 rounded-full font-bold hover:bg-yellow-500 mb-4"
          onClick={handleNewDay}
        >
          New Day: Reset All Tasks
        </button>

        {/* --- Add Child Section --- */}
        <div className="mb-4">
          <h3 className="font-bold mb-2">Add Child</h3>
          <input
            className="border px-2 py-1 rounded mr-2"
            placeholder="Name"
            value={newChild.name}
            onChange={e => setNewChild({ ...newChild, name: e.target.value })}
          />
          <select
            className="border px-2 py-1 rounded mr-2"
            value={newChild.avatar}
            onChange={e => setNewChild({ ...newChild, avatar: e.target.value })}
          >
            {avatarOptions.map(url => (
              <option key={url} value={url}>
                {url.split('/').pop().replace('.svg', '')}
              </option>
            ))}
          </select>
          <img src={newChild.avatar} alt="avatar" className="inline w-8 h-8 rounded-full mr-2 align-middle" />
          <button
            className="bg-blue-500 text-white px-2 py-1 rounded"
            onClick={() => {
              if (!newChild.name) return;
              const newId = Date.now();
              setChildren(children => [
                ...children,
                {
                  id: newId,
                  name: newChild.name,
                  avatar: newChild.avatar,
                  tokens: 0,
                  assignedTaskIds: [],
                  tasks: [],
                  rewardsUnlocked: 0,
                  history: [],
                }
              ]);
              setSelectedChildId(newId);
              setNewChild({ name: '', avatar: avatarOptions[0] });
            }}
          >
            Add
          </button>
        </div>

        {/* --- Select Child Section --- */}
        <div className="mb-4 flex items-center">
          <label className="font-bold">Select Child:</label>
          <select
            className="border px-2 py-1 rounded ml-2"
            value={selectedChildId}
            onChange={e => setSelectedChildId(Number(e.target.value))}
          >
            {children.map(child => (
              <option key={child.id} value={child.id}>{child.name}</option>
            ))}
          </select>
          <button
            className="ml-2 bg-red-500 text-white px-2 py-1 rounded"
            onClick={() => {
              setChildren(children => children.filter(child => child.id !== selectedChildId));
              setSelectedChildId(children.length > 1 ? children.find(child => child.id !== selectedChildId)?.id : null);
            }}
            disabled={children.length <= 1}
            title="Remove selected child"
          >
            Remove
          </button>
        </div>

        {/* Review & Approve Tasks */}
        <div className="mb-6">
          <h3 className="font-bold mb-2">Review & Approve Tasks for {selectedChild?.name}</h3>
          <TaskList
            tasks={selectedChild?.tasks || []}
            mode="parent"
            childId={selectedChildId}
            onParentApprove={(childId, taskId) => handleParentTaskAction(childId, taskId, 'approve')}
            onParentReject={(childId, taskId) => handleParentTaskAction(childId, taskId, 'reject')}
            onParentReset={(childId, taskId) => handleParentTaskAction(childId, taskId, 'reset')}
          />
        </div>

        {/* Assign Tasks to Child */}
        <div className="mb-6">
          <h3 className="font-bold mb-2">Assign Tasks to {selectedChild?.name}</h3>
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={allAssigned}
              onChange={handleSelectAll}
              className="mr-2"
            />
            Select All
          </label>
          <ul>
            {globalTasks.map(task => (
              <li key={task.id} className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  checked={selectedChild?.assignedTaskIds?.includes(task.id) || false}
                  onChange={() => toggleTaskForChild(task.id)}
                />
                <span>{task.emoji} {task.name} (Reward: {task.reward})</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Manage Global Tasks */}
        <div className="mb-6">
          <h3 className="font-bold mb-2">All Tasks (Edit Rewards)</h3>
          <ul>
            {globalTasks.map(task => (
              <li key={task.id} className="flex items-center gap-2 mb-1">
                <span>{task.emoji}</span>
                <input
                  className="border px-1 py-1 rounded flex-1"
                  value={task.name}
                  onChange={e => editGlobalTask(task.id, 'name', e.target.value)}
                />
                <input
                  className="border px-1 py-1 rounded w-16"
                  type="number"
                  min="1"
                  value={task.reward}
                  onChange={e => editGlobalTask(task.id, 'reward', Number(e.target.value))}
                />
                <button className="text-red-500" onClick={() => removeGlobalTask(task.id)}>Remove</button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2 mt-2">
            <input className="border px-2 py-1 rounded w-16" placeholder="Emoji" value={newTask.emoji} onChange={e => setNewTask({ ...newTask, emoji: e.target.value })} />
            <input className="border px-2 py-1 rounded flex-1" placeholder="Task Name" value={newTask.name} onChange={e => setNewTask({ ...newTask, name: e.target.value })} />
            <input className="border px-2 py-1 rounded w-16" type="number" min="1" value={newTask.reward} onChange={e => setNewTask({ ...newTask, reward: Number(e.target.value) })} />
            <button className="bg-blue-500 text-white px-2 rounded" onClick={addGlobalTask}>Add</button>
          </div>
        </div>

        {/* Manage Global Rewards */}
        <div className="mb-6">
          <h3 className="font-bold mb-2">All Rewards</h3>
          <ul>
            {globalRewards.map(reward => (
              <li key={reward.id} className="flex items-center gap-2 mb-1">
                <span>{reward.emoji}</span>
                <input
                  className="border px-1 py-1 rounded flex-1"
                  value={reward.name}
                  onChange={e => editGlobalReward(reward.id, 'name', e.target.value)}
                />
                <input
                  className="border px-1 py-1 rounded w-16"
                  type="number"
                  min="1"
                  value={reward.cost}
                  onChange={e => editGlobalReward(reward.id, 'cost', Number(e.target.value))}
                />
                <button className="text-red-500" onClick={() => removeGlobalReward(reward.id)}>Remove</button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2 mt-2">
            <input className="border px-2 py-1 rounded w-16" placeholder="Emoji" value={newReward.emoji} onChange={e => setNewReward({ ...newReward, emoji: e.target.value })} />
            <input className="border px-2 py-1 rounded flex-1" placeholder="Reward Name" value={newReward.name} onChange={e => setNewReward({ ...newReward, name: e.target.value })} />
            <input className="border px-2 py-1 rounded w-16" type="number" min="1" value={newReward.cost} onChange={e => setNewReward({ ...newReward, cost: Number(e.target.value) })} />
            <button className="bg-blue-500 text-white px-2 rounded" onClick={addGlobalReward}>Add</button>
          </div>
        </div>

        <button className="w-full bg-gray-400 text-white py-2 rounded-full font-bold hover:bg-gray-500 mt-4 text-lg" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

// --- Background Picker ---
function BackgroundPicker({ background, setBackground }) {
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setBackground(`url(${event.target.result}) center/cover`);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mb-4 flex gap-2 items-center">
      <label className="font-bold">Background:</label>
      <input
        type="color"
        value={background.startsWith('#') ? background : '#ffffff'}
        onChange={e => setBackground(e.target.value)}
        title="Pick a color"
      />
      <button
        className="px-2 py-1 rounded bg-blue-200"
        onClick={() => setBackground('linear-gradient(to bottom right, #dbeafe, #fbcfe8)')}
      >
        Gradient
      </button>
      <button
        className="px-2 py-1 rounded bg-pink-200"
        onClick={() => setBackground('url(https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80) center/cover')}
      >
        Demo Image
      </button>
      <label className="px-2 py-1 rounded bg-gray-200 cursor-pointer">
        Upload
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
      </label>
    </div>
  );
}