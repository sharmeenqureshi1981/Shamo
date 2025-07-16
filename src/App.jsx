// App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import TokenCounter from './TokenCounter';
import TaskList from './components/TaskList';
import RewardShop from './RewardShop';
import Confetti from './Confetti';
import ParentalModal from './ParentalModal';

const defaultTasks = [
  { id: 1, name: 'Brush teeth', emoji: '🪥', reward: 1 },
  { id: 2, name: 'Make bed', emoji: '🛏️', reward: 1 },
  { id: 3, name: 'Feed pet', emoji: '🐶', reward: 2 },
  { id: 4, name: 'Do homework', emoji: '📚', reward: 3 },
  { id: 5, name: 'Take out trash', emoji: '🗑️', reward: 2 },
  { id: 6, name: 'Set the table', emoji: '🍽️', reward: 1 },
  { id: 7, name: 'Water plants', emoji: '🪴', reward: 1 },
  { id: 8, name: 'Read a book', emoji: '📖', reward: 2 },
  { id: 9, name: 'Clean room', emoji: '🧹', reward: 2 },
  { id: 10, name: 'Help cook', emoji: '👩‍🍳', reward: 2 },
];

const defaultRewards = [
  { id: 1, name: 'Ice Cream', emoji: '🍦', cost: 3 },
  { id: 2, name: 'Extra Screen Time', emoji: '📱', cost: 5 },
  { id: 3, name: 'Sticker', emoji: '⭐', cost: 2 },
  { id: 4, name: 'Movie Night', emoji: '🎬', cost: 7 },
  { id: 5, name: 'Stay Up Late', emoji: '🌙', cost: 6 },
  { id: 6, name: 'Small Toy', emoji: '🧸', cost: 8 },
  { id: 7, name: 'Choose Dinner', emoji: '🍕', cost: 4 },
  { id: 8, name: 'Board Game Time', emoji: '🎲', cost: 5 },
];

const initialMessages = ['Great job!', 'Keep it up!', 'You rock! 🎉'];

export default function App() {
  // --- Background State ---
  const [background, setBackground] = useState(() =>
    localStorage.getItem('background') ||
    'linear-gradient(to bottom right, #dbeafe, #fbcfe8)'
  );
  useEffect(() => {
    localStorage.setItem('background', background);
  }, [background]);

  // --- State ---
  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const [messages, setMessages] = useState(() => {
    const stored = localStorage.getItem('messagesData');
    return stored ? JSON.parse(stored) : initialMessages;
  });
  const [globalTasks, setGlobalTasks] = useState(() => {
    const stored = localStorage.getItem('globalTasks');
    return stored ? JSON.parse(stored) : defaultTasks;
  });
  const [globalRewards, setGlobalRewards] = useState(() => {
    const stored = localStorage.getItem('globalRewards');
    return stored ? JSON.parse(stored) : defaultRewards;
  });
  const [children, setChildren] = useState(() => {
    const stored = localStorage.getItem('childrenData');
    if (stored) return JSON.parse(stored);
    return [
      {
        id: 1,
        name: 'Alice',
        avatar: '/avatars/avatar1.svg',
        tokens: 0,
        assignedTaskIds: [1, 2],
        tasks: [],
        rewardsUnlocked: 0,
        history: [],
      },
      {
        id: 2,
        name: 'Bob',
        avatar: '/avatars/avatar2.svg',
        tokens: 0,
        assignedTaskIds: [1, 3],
        tasks: [],
        rewardsUnlocked: 0,
        history: [],
      },
    ];
  });
  const [selectedChildId, setSelectedChildId] = useState(() => {
    const stored = localStorage.getItem('selectedChildId');
    return stored ? JSON.parse(stored) : 1;
  });

  // --- Persistence ---
  useEffect(() => { localStorage.setItem('globalTasks', JSON.stringify(globalTasks)); }, [globalTasks]);
  useEffect(() => { localStorage.setItem('globalRewards', JSON.stringify(globalRewards)); }, [globalRewards]);
  useEffect(() => { localStorage.setItem('childrenData', JSON.stringify(children)); }, [children]);
  useEffect(() => { localStorage.setItem('messagesData', JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem('selectedChildId', JSON.stringify(selectedChildId)); }, [selectedChildId]);

  // --- Derived ---
  const selectedChild = children.find(child => child.id === selectedChildId);

  // --- Helpers ---
  const updateChild = (id, updates) => {
    setChildren(children =>
      children.map(child =>
        child.id === id ? { ...child, ...updates } : child
      )
    );
  };

  // Ensure tasks have status and are in sync with assignedTaskIds/globalTasks
  useEffect(() => {
    setChildren(children =>
      children.map(child => ({
        ...child,
        tasks: (child.assignedTaskIds || []).map(taskId => {
          const globalTask = globalTasks.find(t => t.id === taskId);
          const prevTask = (child.tasks || []).find(t => t.id === taskId);
          return {
            ...globalTask,
            status: prevTask ? prevTask.status : 'not_done',
          };
        }),
      }))
    );
    // eslint-disable-next-line
  }, [globalTasks, children.map(c => c.assignedTaskIds).join(',')]);

  // Child marks as done or undoes (if pending)
  const handleChildToggleTask = (taskId) => {
    if (!selectedChild) return;
    const updatedTasks = selectedChild.tasks.map(task => {
      if (task.id !== taskId) return task;
      if (task.status === 'not_done') return { ...task, status: 'pending' };
      if (task.status === 'pending') return { ...task, status: 'not_done' };
      return task; // approved can't be undone by child
    });
    updateChild(selectedChildId, { tasks: updatedTasks });
  };

  // Parent approves, rejects, or resets
  const handleParentTaskAction = (childId, taskId, action) => {
    setChildren(children =>
      children.map(child => {
        if (child.id !== childId) return child;
        const updatedTasks = child.tasks.map(task => {
          if (task.id !== taskId) return task;
          if (action === 'approve' && task.status === 'pending') {
            return { ...task, status: 'approved' };
          }
          if (action === 'reject' && task.status === 'pending') {
            return { ...task, status: 'not_done' };
          }
          if (action === 'reset') {
            return { ...task, status: 'not_done' };
          }
          return task;
        });
        // Give tokens only on approval
        let tokens = child.tokens;
        if (action === 'approve') {
          const t = child.tasks.find(t => t.id === taskId);
          if (t && t.status === 'pending') {
            const globalTask = globalTasks.find(gt => gt.id === taskId);
            tokens += globalTask?.reward || 1;
          }
        }
        return { ...child, tasks: updatedTasks, tokens };
      })
    );
    if (action === 'approve') {
      setConfettiTrigger(true);
      setTimeout(() => setConfettiTrigger(false), 1000);
    }
  };

  // --- Reward Handling ---
  const handleRedeem = (cost, rewardName) => {
    if (!selectedChild || selectedChild.tokens < cost) return;
    updateChild(selectedChildId, {
      tokens: selectedChild.tokens - cost,
      rewardsUnlocked: (selectedChild.rewardsUnlocked || 0) + 1,
      history: [
        ...(selectedChild.history || []),
        { type: 'reward', rewardName, timestamp: Date.now() }
      ]
    });
    setConfettiTrigger(true);
    setTimeout(() => setConfettiTrigger(false), 1000);
  };

  // --- Reset for New Day ---
  const handleNewDay = () => {
    setChildren(children =>
      children.map(child => ({
        ...child,
        tasks: (child.tasks || []).map(task => ({ ...task, status: 'not_done' })),
      }))
    );
  };

  return (
    <div className="min-h-screen" style={{ background }}>
      <Router>
        <Routes>
          <Route path="/" element={<WelcomeScreen background={background} setBackground={setBackground} />} />
          <Route path="/child" element={
            <ChildDashboard
              children={children}
              selectedChildId={selectedChildId}
              setSelectedChildId={setSelectedChildId}
              selectedChild={selectedChild}
              handleChildToggleTask={handleChildToggleTask}
              background={background}
              setBackground={setBackground}
            />
          } />
          <Route path="/parent" element={
            <ParentalModal
              onClose={() => window.location.assign('/')}
              children={children}
              setChildren={setChildren}
              globalTasks={globalTasks}
              setGlobalTasks={setGlobalTasks}
              globalRewards={globalRewards}
              setGlobalRewards={setGlobalRewards}
              handleNewDay={handleNewDay}
              handleParentTaskAction={handleParentTaskAction}
              background={background}
              setBackground={setBackground}
              selectedChildId={selectedChildId}
              setSelectedChildId={setSelectedChildId}
            />
          } />
          <Route path="/shop" element={
            selectedChild ? (
              <RewardShop
                tokens={selectedChild.tokens}
                onRedeem={handleRedeem}
                onClose={() => window.history.back()}
                rewards={globalRewards}
              />
            ) : null
          } />
        </Routes>
        <Confetti trigger={confettiTrigger} />
      </Router>
    </div>
  );
}

// --- Welcome Screen ---
function WelcomeScreen({ background, setBackground }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col justify-center items-center" style={{ background }}>
      <div className="bg-white rounded-2xl shadow-lg p-10 flex flex-col items-center">
        <h1 className="text-4xl font-extrabold mb-8 text-blue-600">Welcome!</h1>
        <BackgroundPicker background={background} setBackground={setBackground} />
        <div className="flex gap-8 mt-4">
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white text-2xl font-bold px-10 py-6 rounded-2xl shadow-lg transition"
            onClick={() => navigate('/parent')}
          >
            Parent
          </button>
          <button
            className="bg-green-500 hover:bg-green-600 text-white text-2xl font-bold px-10 py-6 rounded-2xl shadow-lg transition"
            onClick={() => navigate('/child')}
          >
            Child
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Child Dashboard ---
function ChildDashboard({
  children, selectedChildId, setSelectedChildId, selectedChild, handleChildToggleTask, background, setBackground
}) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen p-4" style={{ background }}>
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-6 mt-8 relative">
        <button
          className="absolute top-4 right-4 text-sm text-gray-500 underline"
          onClick={() => navigate('/')}
        >
          Back to Welcome
        </button>
        <div className="mb-4 flex justify-center">
          <select
            value={selectedChildId || ''}
            onChange={e => setSelectedChildId(Number(e.target.value))}
            className="border rounded px-2 py-1"
          >
            {children.map(child => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </select>
        </div>
        <BackgroundPicker background={background} setBackground={setBackground} />
        {selectedChild && (
          <div className="flex flex-col items-center">
            <h1 className="text-3xl font-extrabold text-blue-600 mb-2">{selectedChild.name}'s Choreboard</h1>
            <div className="relative w-24 h-24 mb-2">
              <img src={selectedChild.avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
            </div>
            <TokenCounter tokens={selectedChild.tokens} />
            <div className="w-full mt-4">
              <TaskList
                tasks={selectedChild.tasks}
                onChildToggleTask={handleChildToggleTask}
                mode="child"
              />
            </div>
            <div className="flex justify-center mt-6">
              <button
                className="bg-green-500 text-white px-6 py-2 rounded-full font-bold hover:bg-green-600"
                onClick={() => navigate('/shop')}
              >
                Open Reward Shop
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Background Picker Component ---
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
