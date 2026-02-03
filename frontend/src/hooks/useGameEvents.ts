import { useEffect } from 'react';
import { iotService } from '../services/iot';

export const useGameEvents = (
  gameId: string | undefined,
  onEvent: (event: string, data: any) => void
) => {
  useEffect(() => {
    if (!gameId) return;

    iotService.subscribe(gameId, onEvent);

    return () => {
      iotService.unsubscribe(gameId);
    };
  }, [gameId, onEvent]);
};
