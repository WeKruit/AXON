'use client';

import React, { FC, useCallback, useMemo, useState } from 'react';
import { useClickOutside } from '@mantine/hooks';
import { useToaster } from '@gitroom/react/toaster/toaster';
import clsx from 'clsx';
import { useSouls } from '@gitroom/frontend/components/axon/hooks/use-axon-api';
import { useSoulIntegrationMappings } from '@gitroom/frontend/components/axon/matrix/use-matrix';
import { SoulIcon } from '@gitroom/frontend/components/axon/ui/icons';
import type { Soul } from '@gitroom/frontend/components/axon/types';

interface SelectSoulProps {
  onSoulChange: (soulId: string | null, connectedIntegrationIds: string[]) => void;
  selectedSoulId?: string | null;
}

export const SelectSoul: FC<SelectSoulProps> = ({ onSoulChange, selectedSoulId }) => {
  const { data: souls, isLoading: soulsLoading } = useSouls();
  const { data: mappings, isLoading: mappingsLoading } = useSoulIntegrationMappings();
  const toaster = useToaster();

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<any>({});
  const ref = useClickOutside(() => {
    if (open) {
      setOpen(false);
    }
  });

  const isLoading = soulsLoading || mappingsLoading;

  // Build a map of soulId -> integrationIds
  const soulIntegrationMap = useMemo(() => {
    const map = new Map<string, string[]>();
    if (!mappings) return map;

    for (const mapping of mappings) {
      const existing = map.get(mapping.soulId) || [];
      existing.push(mapping.integrationId);
      map.set(mapping.soulId, existing);
    }
    return map;
  }, [mappings]);

  // Get the currently selected soul
  const selectedSoul = useMemo(() => {
    if (!selectedSoulId || !souls) return null;
    return souls.find((s) => s.id === selectedSoulId) || null;
  }, [selectedSoulId, souls]);

  // Filter to only show souls that have connected integrations
  const soulsWithIntegrations = useMemo(() => {
    if (!souls) return [];
    return souls.filter((soul) => {
      const integrationIds = soulIntegrationMap.get(soul.id);
      return integrationIds && integrationIds.length > 0;
    });
  }, [souls, soulIntegrationMap]);

  const openClose = useCallback(() => {
    if (open) {
      setOpen(false);
      return;
    }

    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      setPos({ top: rect.y + rect.height, left: rect.x });
    }
    setOpen(true);
  }, [open]);

  const handleSoulSelect = useCallback(
    (soul: Soul | null) => {
      if (soul) {
        const connectedIntegrationIds = soulIntegrationMap.get(soul.id) || [];
        onSoulChange(soul.id, connectedIntegrationIds);
        toaster.show(`Filtering by ${soul.name}`, 'success');
      } else {
        onSoulChange(null, []);
        toaster.show('Showing all channels', 'success');
      }
      setOpen(false);
    },
    [onSoulChange, soulIntegrationMap, toaster]
  );

  // Don't render if no souls have integrations
  if (!isLoading && soulsWithIntegrations.length === 0) {
    return null;
  }

  return (
    <div className="relative select-none z-[500]" ref={ref}>
      <div
        data-tooltip-id="tooltip"
        data-tooltip-content="Filter channels by Soul"
        onClick={openClose}
        className={clsx(
          'relative z-[20] cursor-pointer h-[42px] rounded-[8px] pl-[12px] pr-[12px] gap-[8px] border flex items-center',
          open ? 'border-btnPrimary' : 'border-newColColor',
          selectedSoul && 'bg-btnPrimary/10'
        )}
      >
        {selectedSoul ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
              {selectedSoul.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium max-w-[100px] truncate">
              {selectedSoul.name}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <SoulIcon size="sm" className="text-textItemBlur" />
            <span className="text-sm text-textItemBlur">Soul</span>
          </div>
        )}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          className={clsx('transition-transform', open && 'rotate-180')}
        >
          <path
            d="M1 1L5 5L9 1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {open && (
        <div
          style={pos}
          className="flex flex-col fixed pt-[12px] bg-newBgColorInner menu-shadow min-w-[200px] rounded-lg border border-newBgLineColor overflow-hidden"
        >
          <div className="text-[14px] font-[600] px-[12px] mb-[5px]">
            Filter by Soul
          </div>

          {/* All Channels option */}
          <div
            onClick={() => handleSoulSelect(null)}
            className={clsx(
              'p-[12px] hover:bg-newBgColor text-[14px] font-[500] flex items-center gap-2 cursor-pointer',
              !selectedSoulId && 'bg-newBgColor'
            )}
          >
            <div className="w-6 h-6 rounded-full bg-newBgLineColor flex items-center justify-center">
              <SoulIcon size={12} className="text-textItemBlur" />
            </div>
            <span>All Channels</span>
            {!selectedSoulId && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="ml-auto text-btnPrimary"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>

          {/* Soul options */}
          {isLoading ? (
            <div className="p-[12px] text-[14px] text-textItemBlur">Loading souls...</div>
          ) : (
            soulsWithIntegrations.map((soul) => {
              const integrationCount = soulIntegrationMap.get(soul.id)?.length || 0;
              return (
                <div
                  key={soul.id}
                  onClick={() => handleSoulSelect(soul)}
                  className={clsx(
                    'p-[12px] hover:bg-newBgColor text-[14px] font-[500] flex items-center gap-2 cursor-pointer',
                    selectedSoulId === soul.id && 'bg-newBgColor'
                  )}
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                    {soul.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 truncate">{soul.name}</span>
                  <span className="text-xs text-textItemBlur">{integrationCount} channels</span>
                  {selectedSoulId === soul.id && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-btnPrimary"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
