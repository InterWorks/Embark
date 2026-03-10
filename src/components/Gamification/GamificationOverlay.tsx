import { useEffect, useCallback, useMemo } from 'react';
import { useGamificationContext } from '../../context/GamificationContext';
import { XPPopup } from './XPPopup';
import { DeedToast } from './DeedToast';
import { LevelUpModal } from './LevelUpModal';
import { QuestCompleteOverlay } from './QuestCompleteOverlay';

export function GamificationOverlay() {
  const { getPendingEvents, dismissEvent } = useGamificationContext();
  const events = useMemo(() => getPendingEvents(), [getPendingEvents]);

  const xpEvents = events.filter(e => e.type === 'xp_gained');
  const deedEvents = events.filter(e => e.type === 'deed_unlocked');
  const levelUpEvent = events.find(e => e.type === 'level_up');
  const questEvent = events.find(e => e.type === 'quest_complete');

  const latestXP = xpEvents[xpEvents.length - 1];
  const latestDeed = deedEvents[deedEvents.length - 1];
  const modalEvent = levelUpEvent ?? questEvent;

  const handleDismissXP = useCallback(() => {
    if (latestXP) dismissEvent(latestXP.id);
  }, [latestXP, dismissEvent]);

  const handleDismissDeed = useCallback(() => {
    if (latestDeed) dismissEvent(latestDeed.id);
  }, [latestDeed, dismissEvent]);

  const handleDismissModal = useCallback(() => {
    if (modalEvent) dismissEvent(modalEvent.id);
  }, [modalEvent, dismissEvent]);

  // Auto-dismiss stale XP events (all but the latest)
  useEffect(() => {
    if (xpEvents.length > 1) {
      xpEvents.slice(0, -1).forEach(e => dismissEvent(e.id));
    }
  }, [xpEvents, dismissEvent]);

  return (
    <>
      {latestXP && (
        <XPPopup key={latestXP.id} amount={latestXP.xpGained ?? 0} onDone={handleDismissXP} />
      )}
      {latestDeed?.deed && (
        <DeedToast key={latestDeed.id} deed={latestDeed.deed} onDone={handleDismissDeed} />
      )}
      {modalEvent?.type === 'level_up' && (
        <LevelUpModal key={modalEvent.id} event={modalEvent} onDone={handleDismissModal} />
      )}
      {modalEvent?.type === 'quest_complete' && (
        <QuestCompleteOverlay key={modalEvent.id} event={modalEvent} onDone={handleDismissModal} />
      )}
    </>
  );
}
