import { useState, useEffect } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useDailyPlanner } from '../../hooks/useDailyPlanner';
import { useClients } from '../../hooks/useClients';
import { useGamificationContext } from '../../context/GamificationContext';
import type { CalendarConnection, CalendarEvent, TimeBlock, Client, ChecklistItem } from '../../types';
import { TimeBlockForm, type TimeBlockFormData } from './TimeBlockForm';
import { DayDetailPanel } from './DayDetailPanel';

export function PlannerView() {
  const [connections, setConnections] = useLocalStorage<CalendarConnection[]>('calendar-connections', []);
  const [events] = useLocalStorage<CalendarEvent[]>('calendar-events', []);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
  const [showTimeBlockForm, setShowTimeBlockForm] = useState(false);
  const [editingTimeBlock, setEditingTimeBlock] = useState<TimeBlock | null>(null);

  const { clients, toggleChecklistItem } = useClients();
  const { trackPlannerDay } = useGamificationContext();

  useEffect(() => {
    trackPlannerDay();
  }, []); // once per mount = once per planner visit per session

  // Keyboard shortcut to close panels with Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showTimeBlockForm) {
          setShowTimeBlockForm(false);
          setEditingTimeBlock(null);
        } else if (selectedDayDate) {
          setSelectedDayDate(null);
        } else if (showConnectModal) {
          setShowConnectModal(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTimeBlockForm, selectedDayDate, showConnectModal]);

  const {
    timeBlocks,
    getTimeBlocksForDate,
    createTimeBlock,
    updateTimeBlock,
    deleteTimeBlock,
    getDailyEntry,
    updateJournalContent,
    addDailyGoal,
    toggleDailyGoal,
    removeDailyGoal,
  } = useDailyPlanner();

  const googleConnected = connections.some((c) => c.provider === 'google' && c.connected);
  const microsoftConnected = connections.some((c) => c.provider === 'microsoft' && c.connected);

  const handleConnectGoogle = () => {
    const newConnection: CalendarConnection = {
      id: crypto.randomUUID(),
      provider: 'google',
      email: 'user@gmail.com',
      connected: true,
      connectedAt: new Date().toISOString(),
    };
    setConnections([...connections.filter((c) => c.provider !== 'google'), newConnection]);
    setShowConnectModal(false);
  };

  const handleConnectMicrosoft = () => {
    const newConnection: CalendarConnection = {
      id: crypto.randomUUID(),
      provider: 'microsoft',
      email: 'user@outlook.com',
      connected: true,
      connectedAt: new Date().toISOString(),
    };
    setConnections([...connections.filter((c) => c.provider !== 'microsoft'), newConnection]);
    setShowConnectModal(false);
  };

  const handleDisconnect = (provider: 'google' | 'microsoft') => {
    setConnections(connections.filter((c) => c.provider !== provider));
  };

  const handleAddTimeBlock = () => {
    setEditingTimeBlock(null);
    setShowTimeBlockForm(true);
  };

  const handleEditTimeBlock = (block: TimeBlock) => {
    setEditingTimeBlock(block);
    setShowTimeBlockForm(true);
  };

  const handleDeleteTimeBlock = (blockId: string) => {
    deleteTimeBlock(blockId);
    setShowTimeBlockForm(false);
    setEditingTimeBlock(null);
  };

  const handleSaveTimeBlock = (data: TimeBlockFormData) => {
    const startTime = new Date(`${data.date}T${data.startTime}:00`).toISOString();
    const endTime = new Date(`${data.date}T${data.endTime}:00`).toISOString();

    if (editingTimeBlock) {
      updateTimeBlock(editingTimeBlock.id, {
        title: data.title,
        startTime,
        endTime,
        clientId: data.clientId || null,
        taskId: data.taskId || null,
        color: data.color,
        notes: data.notes,
      });
    } else {
      createTimeBlock({
        title: data.title,
        startTime,
        endTime,
        clientId: data.clientId,
        taskId: data.taskId,
        color: data.color,
        notes: data.notes,
      });
    }

    setShowTimeBlockForm(false);
    setEditingTimeBlock(null);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDayDate(date);
  };

  const handleCloseDayPanel = () => {
    setSelectedDayDate(null);
  };

  const handleCreateTimeBlockForDay = () => {
    setEditingTimeBlock(null);
    setShowTimeBlockForm(true);
  };

  const handleCreateTimeBlockFromTask = (task: ChecklistItem, client: Client) => {
    const dateStr = selectedDayDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
    createTimeBlock({
      title: task.title,
      startTime: new Date(`${dateStr}T09:00:00`).toISOString(),
      endTime: new Date(`${dateStr}T10:00:00`).toISOString(),
      clientId: client.id,
      taskId: task.id,
      color: 'from-emerald-500 to-green-500',
    });
  };

  const handleToggleTask = (clientId: string, taskId: string) => {
    toggleChecklistItem(clientId, taskId);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const days = getDaysInMonth(selectedDate);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelectedDay = (date: Date | null) => {
    if (!date || !selectedDayDate) return false;
    return date.toDateString() === selectedDayDate.toDateString();
  };

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    return events.filter((e) => {
      const eventDate = new Date(e.startTime);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getTimeBlocksForDateObj = (date: Date | null) => {
    if (!date) return [];
    return timeBlocks.filter((b) => {
      const blockDate = new Date(b.startTime);
      return blockDate.toDateString() === date.toDateString();
    });
  };

  // Get time blocks and daily entry for selected day
  const selectedDayBlocks = selectedDayDate
    ? getTimeBlocksForDate(selectedDayDate.toISOString().split('T')[0])
    : [];
  const selectedDayEntry = selectedDayDate
    ? getDailyEntry(selectedDayDate.toISOString().split('T')[0])
    : undefined;

  return (
    <div className="flex gap-6 h-full">
      <div className={`flex-1 transition-all ${selectedDayDate ? 'lg:mr-0' : ''}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Planner</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage your calendar, time blocks, and meeting notes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddTimeBlock}
              className="flex items-center gap-2 px-4 py-2 glass-subtle text-gray-700 dark:text-gray-300 rounded-xl hover:bg-white/60 dark:hover:bg-white/15 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Time Block
            </button>
            <button
              onClick={() => setShowConnectModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition-opacity shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Connect Calendar
            </button>
          </div>
        </div>

        {/* Connection Status */}
        {(googleConnected || microsoftConnected) && (
          <div className="flex gap-3 mb-6">
            {googleConnected && (
              <div className="flex items-center gap-2 px-3 py-1.5 glass-subtle rounded-lg">
                <div className="w-5 h-5">
                  <svg viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Google Calendar</span>
                <button
                  onClick={() => handleDisconnect('google')}
                  className="ml-1 text-gray-400 hover:text-red-500"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            {microsoftConnected && (
              <div className="flex items-center gap-2 px-3 py-1.5 glass-subtle rounded-lg">
                <div className="w-5 h-5">
                  <svg viewBox="0 0 23 23">
                    <rect fill="#f25022" x="1" y="1" width="10" height="10"/>
                    <rect fill="#00a4ef" x="1" y="12" width="10" height="10"/>
                    <rect fill="#7fba00" x="12" y="1" width="10" height="10"/>
                    <rect fill="#ffb900" x="12" y="12" width="10" height="10"/>
                  </svg>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Outlook</span>
                <button
                  onClick={() => handleDisconnect('microsoft')}
                  className="ml-1 text-gray-400 hover:text-red-500"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        <div className={`grid grid-cols-1 gap-6 ${selectedDayDate ? 'lg:grid-cols-1' : 'lg:grid-cols-3'}`}>
          {/* Calendar */}
          <div className={`glass-card p-4 ${selectedDayDate ? '' : 'lg:col-span-2'}`}>
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                  className="p-2 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setSelectedDate(new Date())}
                  className="px-3 py-1.5 text-sm glass-subtle hover:bg-white/60 dark:hover:bg-white/15 rounded-lg transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                  className="p-2 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((date, i) => {
                const dayEvents = getEventsForDate(date);
                const dayBlocks = getTimeBlocksForDateObj(date);
                const hasItems = dayEvents.length > 0 || dayBlocks.length > 0;

                return (
                  <div
                    key={i}
                    onClick={() => date && handleDayClick(date)}
                    className={`min-h-[80px] p-1 rounded-lg transition-colors ${
                      date
                        ? isSelectedDay(date)
                          ? 'bg-purple-200 dark:bg-purple-800/40 ring-2 ring-purple-500'
                          : isToday(date)
                          ? 'bg-purple-100 dark:bg-purple-900/30'
                          : 'hover:bg-white/50 dark:hover:bg-white/10 cursor-pointer'
                        : ''
                    }`}
                  >
                    {date && (
                      <>
                        <div className={`text-sm font-medium mb-1 ${
                          isToday(date)
                            ? 'text-purple-600 dark:text-purple-400'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {date.getDate()}
                        </div>
                        {hasItems && (
                          <div className="space-y-0.5">
                            {dayEvents.slice(0, 2).map((event) => (
                              <div
                                key={event.id}
                                className="text-xs px-1 py-0.5 bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded truncate"
                              >
                                {event.title}
                              </div>
                            ))}
                            {dayBlocks.slice(0, 2).map((block) => (
                              <div
                                key={block.id}
                                className={`text-xs px-1 py-0.5 bg-gradient-to-r ${block.color || 'from-violet-500 to-purple-500'} text-white rounded truncate`}
                              >
                                {block.title}
                              </div>
                            ))}
                            {(dayEvents.length + dayBlocks.length) > 2 && (
                              <div className="text-xs text-gray-500">
                                +{dayEvents.length + dayBlocks.length - 2} more
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar - hidden when day panel is open on large screens */}
          {!selectedDayDate && (
            <div className="space-y-4">
              {/* Quick Actions */}
              <div className="glass-card p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={handleAddTimeBlock}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Create Time Block</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition-colors text-left">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Schedule Event</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition-colors text-left">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Add Meeting Notes</span>
                  </button>
                </div>
              </div>

              {/* Upcoming */}
              <div className="glass-card p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Upcoming</h3>
                {events.length === 0 && timeBlocks.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No upcoming events or time blocks
                  </p>
                ) : (
                  <div className="space-y-2">
                    {[...events, ...timeBlocks]
                      .filter((item) => new Date(item.startTime) >= new Date())
                      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                      .slice(0, 5)
                      .map((item) => {
                        const isTimeBlock = 'createdAt' in item && !('provider' in item);
                        return (
                          <div
                            key={item.id}
                            onClick={() => isTimeBlock && handleEditTimeBlock(item as TimeBlock)}
                            className={`flex items-center gap-3 p-2 rounded-lg hover:bg-white/30 dark:hover:bg-white/5 ${
                              isTimeBlock ? 'cursor-pointer' : ''
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full ${
                              isTimeBlock ? 'bg-purple-500' : 'bg-blue-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {item.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(item.startTime).toLocaleDateString()} at{' '}
                                {new Date(item.startTime).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Day Detail Panel */}
      {selectedDayDate && (
        <div className="hidden lg:block w-96 flex-shrink-0">
          <DayDetailPanel
            isOpen={!!selectedDayDate}
            onClose={handleCloseDayPanel}
            selectedDate={selectedDayDate}
            timeBlocks={selectedDayBlocks}
            dailyEntry={selectedDayEntry}
            clients={clients}
            onEditTimeBlock={handleEditTimeBlock}
            onDeleteTimeBlock={handleDeleteTimeBlock}
            onCreateTimeBlock={handleCreateTimeBlockForDay}
            onUpdateJournal={updateJournalContent}
            onAddGoal={addDailyGoal}
            onToggleGoal={toggleDailyGoal}
            onRemoveGoal={removeDailyGoal}
            onToggleTask={handleToggleTask}
            onCreateTimeBlockFromTask={handleCreateTimeBlockFromTask}
          />
        </div>
      )}

      {/* Mobile Day Detail Panel */}
      <div className="lg:hidden">
        <DayDetailPanel
          isOpen={!!selectedDayDate}
          onClose={handleCloseDayPanel}
          selectedDate={selectedDayDate || new Date()}
          timeBlocks={selectedDayBlocks}
          dailyEntry={selectedDayEntry}
          clients={clients}
          onEditTimeBlock={handleEditTimeBlock}
          onDeleteTimeBlock={handleDeleteTimeBlock}
          onCreateTimeBlock={handleCreateTimeBlockForDay}
          onUpdateJournal={updateJournalContent}
          onAddGoal={addDailyGoal}
          onToggleGoal={toggleDailyGoal}
          onRemoveGoal={removeDailyGoal}
          onToggleTask={handleToggleTask}
          onCreateTimeBlockFromTask={handleCreateTimeBlockFromTask}
        />
      </div>

      {/* Time Block Form Modal */}
      <TimeBlockForm
        isOpen={showTimeBlockForm}
        onClose={() => {
          setShowTimeBlockForm(false);
          setEditingTimeBlock(null);
        }}
        onSave={handleSaveTimeBlock}
        onDelete={editingTimeBlock ? () => handleDeleteTimeBlock(editingTimeBlock.id) : undefined}
        initialData={editingTimeBlock || undefined}
        initialDate={selectedDayDate?.toISOString().split('T')[0]}
        clients={clients}
      />

      {/* Connect Calendar Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowConnectModal(false)} />
          <div className="relative w-full max-w-md glass-strong rounded-2xl shadow-2xl border border-white/30 dark:border-white/10 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-white/20 dark:border-white/10">
              <h2 className="text-lg font-semibold gradient-text">Connect Calendar</h2>
              <button
                onClick={() => setShowConnectModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Connect your calendar to sync events, manage time blocks, and take meeting notes.
              </p>

              <button
                onClick={handleConnectGoogle}
                disabled={googleConnected}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  googleConnected
                    ? 'border-green-500/50 bg-green-500/10 cursor-default'
                    : 'border-white/30 dark:border-white/10 hover:bg-white/50 dark:hover:bg-white/10 cursor-pointer'
                }`}
              >
                <div className="w-10 h-10 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-8 h-8">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900 dark:text-gray-100">Google Calendar</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {googleConnected ? 'Connected' : 'Connect your Google account'}
                  </p>
                </div>
                {googleConnected && (
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              <button
                onClick={handleConnectMicrosoft}
                disabled={microsoftConnected}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  microsoftConnected
                    ? 'border-green-500/50 bg-green-500/10 cursor-default'
                    : 'border-white/30 dark:border-white/10 hover:bg-white/50 dark:hover:bg-white/10 cursor-pointer'
                }`}
              >
                <div className="w-10 h-10 flex items-center justify-center">
                  <svg viewBox="0 0 23 23" className="w-8 h-8">
                    <rect fill="#f25022" x="1" y="1" width="10" height="10"/>
                    <rect fill="#00a4ef" x="1" y="12" width="10" height="10"/>
                    <rect fill="#7fba00" x="12" y="1" width="10" height="10"/>
                    <rect fill="#ffb900" x="12" y="12" width="10" height="10"/>
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900 dark:text-gray-100">Microsoft Outlook</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {microsoftConnected ? 'Connected' : 'Connect your Microsoft account'}
                  </p>
                </div>
                {microsoftConnected && (
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
